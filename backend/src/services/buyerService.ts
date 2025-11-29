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
  try {
    if (!Array.isArray(skus) || skus.length === 0) {
      throw new Error("Invalid order: skus must be a non-empty array");
    }

    const accountIdValue = accountID == null ? null : String(accountID);
    const skuListJson = JSON.stringify(skus);
    const now = new Date();

    // Single large query that validates, creates order, and updates all related tables
    const result: any[] = await prisma.$queryRaw`
      DECLARE @OrderID INT, @SubOrderID INT, @TotalPrice INT = 0;
      DECLARE @SkuList NVARCHAR(MAX) = ${skuListJson};
      
      -- Create temp table for SKU details
      CREATE TABLE #SkuDetails (
        ProductID INT,
        SKUName NVARCHAR(255),
        Quantity INT,
        Price INT,
        SellerLogin NVARCHAR(255),
        ItemTotal INT
      );
      
      -- Populate SKU details and validate
      INSERT INTO #SkuDetails
      SELECT 
        j.ProductID,
        j.SKUName,
        j.Quantity,
        s.Price,
        p.LoginName,
        s.Price * j.Quantity
      FROM OPENJSON(@SkuList) 
      WITH (
        ProductID INT '$.ProductID',
        SKUName NVARCHAR(255) '$.SKUName',
        Quantity INT '$.Quantity'
      ) j
      JOIN SKU s ON s.ProductID = j.ProductID AND s.SKUName = j.SKUName
      JOIN ProductInfo p ON p.ProductID = s.ProductID;
      
      -- Calculate total
      SELECT @TotalPrice = SUM(ItemTotal) FROM #SkuDetails;
      
      -- Create Order
      INSERT INTO OrderInfo (LoginName, AddressID, BankProviderName, AccountID, TotalPrice)
      VALUES (${loginName}, ${addressID}, ${providerName}, ${accountIdValue}, @TotalPrice);
      SET @OrderID = SCOPE_IDENTITY();
      
      -- Create SubOrder
      INSERT INTO SubOrderInfo (OrderID, DeliveryMethodName, DeliveryProviderName, ActualDate, ExpectedDate, DeliveryPrice, TotalSKUPrice)
      VALUES (@OrderID, ${deliveryMethod}, ${deliveryProvider}, ${now}, ${now}, 36363, @TotalPrice);
      SET @SubOrderID = SCOPE_IDENTITY();
      
      -- Create SubOrderDetails
      INSERT INTO SubOrderDetail (OrderID, SubOrderID, ProductID, SKUName, Quantity)
      SELECT @OrderID, @SubOrderID, ProductID, SKUName, Quantity FROM #SkuDetails;
      
      -- Update Seller Earnings
      UPDATE Seller
      SET MoneyEarned = MoneyEarned + sd.TotalEarning
      FROM Seller s
      JOIN (
        SELECT SellerLogin, SUM(ItemTotal) as TotalEarning
        FROM #SkuDetails
        GROUP BY SellerLogin
      ) sd ON s.LoginName = sd.SellerLogin;
      
      -- Update Buyer MoneySpent
      UPDATE Buyer
      SET MoneySpent = MoneySpent + @TotalPrice
      WHERE LoginName = ${loginName};
      
      -- Return the created order with nested data
      SELECT 
        o.*,
        (
          SELECT 
            soi.*,
            (
              SELECT sod.*
              FROM SubOrderDetail sod
              WHERE sod.SubOrderID = soi.SubOrderID
              FOR JSON PATH
            ) AS SubOrderDetail
          FROM SubOrderInfo soi
          WHERE soi.OrderID = o.OrderID
          FOR JSON PATH
        ) AS SubOrderInfo
      FROM OrderInfo o
      WHERE o.OrderID = @OrderID;
      
      DROP TABLE #SkuDetails;
    `;

    return convertBigIntToNumber(result[0]);
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);

    if (
      originalMessage.includes(
        "Foreign key constraint violated: `FK__SubOrderI__Deliv__4CA06362"
      ) ||
      originalMessage.includes("FK__SubOrderI__Deliv__4CA06362")
    ) {
      throw new Error(
        "Invalid order: delivery provider not found, choose among Giao Hang Nhanh, GrabExpress, VNPost"
      );
    }

    if (
      originalMessage.includes(
        "Foreign key constraint violated: `FK__SubOrderI__Deliv__4BAC3F29"
      ) ||
      originalMessage.includes("FK__SubOrderI__Deliv__4BAC3F29")
    ) {
      throw new Error(
        "Invalid order: delivery method not found, choose among Economy, Express, Standard"
      );
    }
    throw new Error(
      `Failed to create order for ${loginName}: ${originalMessage}`
    );
  }
};

const readOrderDetails = async (orderID: number) => {
  const result: any[] = await prisma.$queryRaw`
    SELECT 
      o.*,
      (
        SELECT 
          soi.*,
          (
            SELECT 
              sod.*,
              (
                SELECT 
                  s.*,
                  (SELECT p.* FROM ProductInfo p WHERE p.ProductID = s.ProductID FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) AS ProductInfo
                FROM SKU s 
                WHERE s.ProductID = sod.ProductID AND s.SKUName = sod.SKUName
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
              ) AS SKU
            FROM SubOrderDetail sod 
            WHERE sod.SubOrderID = soi.SubOrderID 
            FOR JSON PATH
          ) AS SubOrderDetail
        FROM SubOrderInfo soi 
        WHERE soi.OrderID = o.OrderID 
        FOR JSON PATH
      ) AS SubOrderInfo,
      (SELECT a.* FROM AddressInfo a WHERE a.AddressID = o.AddressID FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) AS AddressInfo
    FROM OrderInfo o
    WHERE o.OrderID = ${orderID}
  `;

  if (!result[0]) return null;

  const order = result[0];
  const subOrderData = safeJsonParse(order.SubOrderInfo);
  return convertBigIntToNumber({
    ...order,
    SubOrderInfo: subOrderData
      ? (Array.isArray(subOrderData) ? subOrderData : [subOrderData]).map(
          (subOrder: any) => {
            const detailData = safeJsonParse(subOrder.SubOrderDetail);
            return {
              ...subOrder,
              SubOrderDetail: detailData
                ? (Array.isArray(detailData) ? detailData : [detailData]).map(
                    (detail: any) => {
                      const skuData = safeJsonParse(detail.SKU);
                      return {
                        ...detail,
                        SKU: skuData
                          ? {
                              ...skuData,
                              ProductInfo: safeJsonParse(skuData.ProductInfo),
                            }
                          : null,
                      };
                    }
                  )
                : [],
            };
          }
        )
      : [],
    AddressInfo: safeJsonParse(order.AddressInfo),
  });
};

const getMoneySpent = async (loginName: string) => {
  const result: any[] = await prisma.$queryRaw`
    SELECT MoneySpent FROM Buyer WHERE LoginName = ${loginName}
  `;
  return result[0]?.MoneySpent ? Number(result[0].MoneySpent) : 0;
};

const addComment = async (
  loginName: string,
  productID: number,
  skuName: string,
  content: string,
  ratings: number
) => {
  await prisma.$executeRaw`
    INSERT INTO Comment (LoginName, ProductID, SKUName, Content, Ratings)
    VALUES (${loginName}, ${productID}, ${skuName}, ${content}, ${ratings})
  `;
  return {
    LoginName: loginName,
    ProductID: productID,
    SKUName: skuName,
    Content: content,
    Ratings: ratings,
  };
};

const deleteComment = async (loginName: string, commentID: number) => {
  const comment: any[] = await prisma.$queryRaw`
    SELECT * FROM Comment WHERE CommentID = ${commentID}
  `;

  if (!comment[0]) {
    throw new Error("Comment not found");
  }

  if (comment[0].LoginName !== loginName) {
    throw new Error("Unauthorized to delete this comment");
  }

  await prisma.$executeRaw`
    DELETE FROM Comment WHERE CommentID = ${commentID}
  `;
  return convertBigIntToNumber(comment[0]);
};

const editComment = async (
  loginName: string,
  commentID: number,
  content: string,
  ratings: number
) => {
  const comment: any[] = await prisma.$queryRaw`
    SELECT * FROM Comment WHERE CommentID = ${commentID}
  `;

  if (!comment[0]) {
    throw new Error("Comment not found");
  }

  if (comment[0].LoginName !== loginName) {
    throw new Error("Unauthorized to edit this comment");
  }

  await prisma.$executeRaw`
    UPDATE Comment 
    SET Content = ${content}, Ratings = ${ratings}
    WHERE CommentID = ${commentID}
  `;

  return convertBigIntToNumber({
    ...comment[0],
    Content: content,
    Ratings: ratings,
  });
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
