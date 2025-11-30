import prisma from "../mssql/prisma";
import { Prisma } from "@prisma/client";

// Helper to safely parse JSON that might already be an object or null
const safeJsonParse = (value: any) => {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value; // Already an object
};

// Helper to convert BigInt to number recursively
const convertBigIntToNumber = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return Number(obj);
  if (Array.isArray(obj)) return obj.map(convertBigIntToNumber);
  if (typeof obj === "object") {
    const converted: any = {};
    for (const key in obj) {
      converted[key] = convertBigIntToNumber(obj[key]);
    }
    return converted;
  }
  return obj;
};

const findMany = async (search?: string) => {
  const whereClause = search
    ? Prisma.sql`WHERE p.ProductName LIKE ${"%" + search + "%"}`
    : Prisma.sql``;

  const results: any[] = await prisma.$queryRaw`
    SELECT 
      p.*,
      (
        SELECT s.*, 
          (SELECT c.* FROM Comment c WHERE c.ProductID = s.ProductID AND c.SKUName = s.SKUName FOR JSON PATH) AS Comment,
          (SELECT i.* FROM SKUImage i WHERE i.ProductID = s.ProductID AND i.SKUName = s.SKUName FOR JSON PATH) AS SKUImage
        FROM SKU s 
        WHERE s.ProductID = p.ProductID 
        FOR JSON PATH
      ) AS SKU
    FROM ProductInfo p
    ${whereClause}
  `;

  // Parse JSON strings to objects
  return results.map((product: any) => {
    const skuData = safeJsonParse(product.SKU);
    return convertBigIntToNumber({
      ...product,
      SKU: skuData
        ? (Array.isArray(skuData) ? skuData : [skuData]).map((sku: any) => ({
            ...sku,
            Comment: safeJsonParse(sku.Comment) || [],
            SKUImage: safeJsonParse(sku.SKUImage) || [],
          }))
        : [],
    });
  });
};

const findUnique = async (id: number) => {
  const result: any[] = await prisma.$queryRaw`
    SELECT 
      p.*,
      (
        SELECT s.*, 
          (SELECT c.* FROM Comment c WHERE c.ProductID = s.ProductID AND c.SKUName = s.SKUName FOR JSON PATH) AS Comment,
          (SELECT i.* FROM SKUImage i WHERE i.ProductID = s.ProductID AND i.SKUName = s.SKUName FOR JSON PATH) AS SKUImage
        FROM SKU s 
        WHERE s.ProductID = p.ProductID 
        FOR JSON PATH
      ) AS SKU
    FROM ProductInfo p
    WHERE p.ProductID = ${id}
  `;

  if (!result[0]) return null;

  const product = result[0];
  const skuData = safeJsonParse(product.SKU);
  return convertBigIntToNumber({
    ...product,
    SKU: skuData
      ? (Array.isArray(skuData) ? skuData : [skuData]).map((sku: any) => ({
          ...sku,
          Comment: safeJsonParse(sku.Comment) || [],
          SKUImage: safeJsonParse(sku.SKUImage) || [],
        }))
      : [],
  });
};

const getAddresses = async (loginName: string) => {
  const results = await prisma.$queryRaw`
    SELECT * FROM AddressInfo WHERE LoginName = ${loginName}
  `;
  return convertBigIntToNumber(results);
};

const addToCart = async (
  loginName: string,
  productID: number,
  skuName: string,
  quantity: number
) => {
  const result: any[] = await prisma.$queryRaw`
    DECLARE @CartID INT;
    DECLARE @Price INT;
    DECLARE @InStockNumber INT;
    DECLARE @ExistingQty INT;
    DECLARE @ErrorMessage NVARCHAR(MAX) = NULL;

    -- Get Cart ID
    SELECT @CartID = CartID FROM Cart WHERE LoginName = ${loginName};
    
    IF @CartID IS NULL
    BEGIN
      SET @ErrorMessage = 'Cart not found';
      SELECT @ErrorMessage AS ErrorMessage;
      RETURN;
    END

    -- Get SKU Info
    SELECT @Price = Price, @InStockNumber = InStockNumber 
    FROM SKU 
    WHERE ProductID = ${productID} AND SKUName = ${skuName};
    
    IF @Price IS NULL
    BEGIN
      SET @ErrorMessage = 'SKU not found: ProductID=' + CAST(${productID} AS VARCHAR) + ', SKUName=' + ${skuName};
      SELECT @ErrorMessage AS ErrorMessage;
      RETURN;
    END

    -- Validate quantity limits
    IF ${quantity} > FLOOR(2147483647.0 / @Price)
    BEGIN
      SET @ErrorMessage = 'Quantity too large. Maximum allowed: ' + CAST(FLOOR(2147483647.0 / @Price) AS VARCHAR);
      SELECT @ErrorMessage AS ErrorMessage;
      RETURN;
    END

    IF ${quantity} > @InStockNumber
    BEGIN
      SET @ErrorMessage = 'Insufficient stock. Available: ' + CAST(@InStockNumber AS VARCHAR);
      SELECT @ErrorMessage AS ErrorMessage;
      RETURN;
    END

    -- Check if item already exists in cart
    SELECT @ExistingQty = Quantity 
    FROM StoredSKU 
    WHERE ProductID = ${productID} AND CartID = @CartID AND SKUName = ${skuName};

    IF @ExistingQty IS NOT NULL
    BEGIN
      -- Check if adding quantity exceeds stock
      IF (@ExistingQty + ${quantity}) > @InStockNumber
      BEGIN
        SET @ErrorMessage = 'Insufficient stock. Available: ' + CAST(@InStockNumber AS VARCHAR) + 
                           '. You already have ' + CAST(@ExistingQty AS VARCHAR) + ' in cart.';
        SELECT @ErrorMessage AS ErrorMessage;
        RETURN;
      END

      -- Update existing item
      UPDATE StoredSKU 
      SET Quantity = Quantity + ${quantity}
      WHERE ProductID = ${productID} AND CartID = @CartID AND SKUName = ${skuName};
      
      -- Return updated row
      SELECT NULL AS ErrorMessage, 'UPDATED' AS Action, CartID, ProductID, SKUName, Quantity
      FROM StoredSKU
      WHERE ProductID = ${productID} AND CartID = @CartID AND SKUName = ${skuName};
    END
    ELSE
    BEGIN
      -- Insert new item
      INSERT INTO StoredSKU (CartID, ProductID, SKUName, Quantity)
      VALUES (@CartID, ${productID}, ${skuName}, ${quantity});
      
      -- Return inserted row
      SELECT NULL AS ErrorMessage, 'INSERTED' AS Action, CartID, ProductID, SKUName, Quantity
      FROM StoredSKU
      WHERE ProductID = ${productID} AND CartID = @CartID AND SKUName = ${skuName};
    END
  `;

  if (result[0]?.ErrorMessage) {
    throw new Error(result[0].ErrorMessage);
  }
  const sku = result[0];

  return convertBigIntToNumber(result[0]);
};

const getCart = async (loginName: string) => {
  const result: any[] = await prisma.$queryRaw`
    SELECT 
      c.*,
      (
        SELECT 
          ss.*,
          (
            SELECT 
              s.*,
              (SELECT p.* FROM ProductInfo p WHERE p.ProductID = s.ProductID FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) AS ProductInfo,
              (SELECT i.* FROM SKUImage i WHERE i.ProductID = s.ProductID AND i.SKUName = s.SKUName FOR JSON PATH) AS SKUImage
            FROM SKU s 
            WHERE s.ProductID = ss.ProductID AND s.SKUName = ss.SKUName
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
          ) AS SKU
        FROM StoredSKU ss 
        WHERE ss.CartID = c.CartID 
        FOR JSON PATH
      ) AS StoredSKU
    FROM Cart c
    WHERE c.LoginName = ${loginName}
  `;

  if (!result[0]) return null;

  const cart = result[0];
  const storedSkuData = safeJsonParse(cart.StoredSKU);
  return convertBigIntToNumber({
    ...cart,
    StoredSKU: storedSkuData
      ? (Array.isArray(storedSkuData) ? storedSkuData : [storedSkuData]).map(
          (stored: any) => {
            const skuData = safeJsonParse(stored.SKU);
            return {
              ...stored,
              SKU: skuData
                ? {
                    ...skuData,
                    ProductInfo: safeJsonParse(skuData.ProductInfo),
                    SKUImage: safeJsonParse(skuData.SKUImage) || [],
                  }
                : null,
            };
          }
        )
      : [],
  });
};

const removeFromCart = async (
  loginName: string,
  productID: number,
  skuName: string
) => {
  const result: any[] = await prisma.$queryRaw`
    DECLARE @CartID INT;
    
    -- Get Cart ID
    SELECT @CartID = CartID FROM Cart WHERE LoginName = ${loginName};
    
    IF @CartID IS NULL
    BEGIN
      SELECT NULL AS CartID; -- Return empty to indicate cart not found
      RETURN;
    END
    
    -- Check if item exists before deleting
    IF NOT EXISTS (
      SELECT 1 FROM StoredSKU 
      WHERE ProductID = ${productID} AND CartID = @CartID AND SKUName = ${skuName}
    )
    BEGIN
      SELECT NULL AS CartID; -- Return empty to indicate item not found
      RETURN;
    END
    
    -- Store the item before deleting
    SELECT CartID, ProductID, SKUName, Quantity
    INTO #DeletedItem
    FROM StoredSKU
    WHERE ProductID = ${productID} AND CartID = @CartID AND SKUName = ${skuName};
    
    -- Delete the item
    DELETE FROM StoredSKU
    WHERE ProductID = ${productID} AND CartID = @CartID AND SKUName = ${skuName};
    
    -- Return the deleted item
    SELECT * FROM #DeletedItem;
    
    DROP TABLE #DeletedItem;
  `;

  if (result.length === 0 || result[0]?.CartID === null) {
    throw new Error("Cart not found or item not in cart");
  }

  return convertBigIntToNumber(result[0]);
};

const createOrder = async (
  loginName: string,
  skus: any[],
  addressID: number,
  providerName: string,
  deliveryMethod: string,
  deliveryProvider: string,
  accountID?: string | number | null
) => {
  const accountIdValue = accountID == null ? null : String(accountID);

  // Execute the stored procedure
  // Note: The procedure uses the default address for the user and items from the cart (StoredSKU).
  // skus and addressID parameters are ignored by the procedure.
  await prisma.$executeRaw`
    EXEC prc_CreateOrderFromStoredSKU
      @LoginName = ${loginName},
      @AccountID = ${accountIdValue},
      @BankProviderName = ${providerName},
      @DeliveryMethodName = ${deliveryMethod},
      @DeliveryProviderName = ${deliveryProvider},
      @AddressID = ${addressID}
  `;

  // Fetch the latest order for this user to return details
  const result = await prisma.$queryRaw<any[]>`
    SELECT TOP 1 OrderID 
    FROM OrderInfo 
    WHERE LoginName = ${loginName} 
    ORDER BY OrderID DESC
  `;

  if (!result || result.length === 0) throw new Error("Order creation failed or no order found");
  const newOrderID = result[0].OrderID;

  return readOrderDetails(newOrderID);
};

const readOrderDetails = async (orderID: number) => {
  const result = await prisma.$queryRaw<any[]>`
    SELECT 
      o.*,
      JSON_QUERY((
        SELECT * FROM AddressInfo a WHERE a.AddressID = o.AddressID AND a.LoginName = o.LoginName FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
      )) AS AddressInfo,
      JSON_QUERY((
        SELECT 
          so.*,
          JSON_QUERY((
            SELECT 
              sod.*,
              JSON_QUERY((
                SELECT 
                  s.*,
                  JSON_QUERY((
                    SELECT * FROM ProductInfo p WHERE p.ProductID = s.ProductID FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                  )) AS ProductInfo
                FROM SKU s
                WHERE s.ProductID = sod.ProductID AND s.SKUName = sod.SKUName
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
              )) AS SKU
            FROM SubOrderDetail sod
            WHERE sod.OrderID = so.OrderID AND sod.SubOrderID = so.SubOrderID
            FOR JSON PATH
          )) AS SubOrderDetail
        FROM SubOrderInfo so
        WHERE so.OrderID = o.OrderID
        FOR JSON PATH
      )) AS SubOrderInfo
    FROM OrderInfo o
    WHERE o.OrderID = ${orderID}
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
  `;

  if (!result || result.length === 0) return null;
  const jsonString = result.map(row => Object.values(row)[0]).join('');
  if (!jsonString) return null;
  return JSON.parse(jsonString);
};

const getMoneySpent = async (loginName: string) => {
  const result = await prisma.$queryRaw<any[]>`
    SELECT MoneySpent 
    FROM Buyer 
    WHERE LoginName = ${loginName}
  `;
  if (!result || result.length === 0) return 0;
  return result[0].MoneySpent || 0;
};

const addComment = async (
  loginName: string,
  productID: number,
  skuName: string,
  content: string,
  ratings: number
) => {
  return prisma.$executeRaw`
    INSERT INTO Comment (LoginName, ProductID, SKUName, Content, Ratings)
    VALUES (${loginName}, ${productID}, ${skuName}, ${content}, ${ratings})
  `;
};

const deleteComment = async (loginName: string, commentID: number) => {
  const comment = await prisma.$queryRaw<any[]>`
    SELECT LoginName 
    FROM Comment 
    WHERE CommentID = ${commentID}
  `;

  if (!comment || comment.length === 0) {
    throw new Error("Comment not found");
  }

  if (comment[0].LoginName !== loginName) {
    throw new Error("Unauthorized to delete this comment");
  }

  return prisma.$executeRaw`
    DELETE FROM Comment 
    WHERE CommentID = ${commentID}
  `;
};

const editComment = async (
  loginName: string,
  commentID: number,
  content: string,
  ratings: number
) => {
  const comment = await prisma.$queryRaw<any[]>`
    SELECT LoginName 
    FROM Comment 
    WHERE CommentID = ${commentID}
  `;

  if (!comment || comment.length === 0) {
    throw new Error("Comment not found");
  }

  if (comment[0].LoginName !== loginName) {
    throw new Error("Unauthorized to edit this comment");
  }

  return prisma.$executeRaw`
    UPDATE Comment 
    SET Content = ${content}, Ratings = ${ratings}
    WHERE CommentID = ${commentID}
  `;
};

export default {
  findMany,
  findUnique,
  getAddresses,
  addToCart,
  getCart,
  removeFromCart,
  createOrder,
  readOrderDetails,
  getMoneySpent,
  addComment,
  deleteComment,
  editComment,
};
