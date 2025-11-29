import prisma from "../mssql/prisma";
const getAddresses = async (loginName: string) => {
  return prisma.$queryRaw`
    SELECT * FROM AddressInfo WHERE LoginName = ${loginName}
  `;
};

const addToCart = async (
  loginName: string,
  productID: number,
  skuName: string,
  quantity: number
) => {
  // 1. Get CartID
  const cartResult = await prisma.$queryRaw<any[]>`
    SELECT CartID FROM Cart WHERE LoginName = ${loginName}
  `;
  
  if (!cartResult || cartResult.length === 0) throw new Error("Cart not found");
  const cartID = cartResult[0].CartID;

  // 2. Get SKU details (Price, Stock)
  const skuResult = await prisma.$queryRaw<any[]>`
    SELECT Price, InStockNumber FROM SKU 
    WHERE ProductID = ${productID} AND SKUName = ${skuName}
  `;

  if (!skuResult || skuResult.length === 0) {
    throw new Error(`SKU not found: ProductID=${productID}, SKUName=${skuName}`);
  }
  const sku = skuResult[0];

  // 3. Check Max Quantity (Integer Overflow Protection)
  const maxSafeQuantity = Math.floor(2147483647 / sku.Price);
  if (quantity > maxSafeQuantity) {
    throw new Error(`Quantity too large. Maximum allowed: ${maxSafeQuantity}`);
  }

  // 4. Check Stock (Initial check)
  if (quantity > sku.InStockNumber) {
    throw new Error(`Insufficient stock. Available: ${sku.InStockNumber}`);
  }

  // 5. Upsert into StoredSKU using MERGE or IF EXISTS
  // We need to check existing quantity to validate stock again
  const existingItem = await prisma.$queryRaw<any[]>`
    SELECT Quantity FROM StoredSKU 
    WHERE CartID = ${cartID} AND ProductID = ${productID} AND SKUName = ${skuName}
  `;

  let newQuantity = quantity;
  if (existingItem && existingItem.length > 0) {
    newQuantity += existingItem[0].Quantity;
  }

  if (newQuantity > sku.InStockNumber) {
     throw new Error(
        `Insufficient stock. Available: ${sku.InStockNumber}. You already have ${existingItem && existingItem.length > 0 ? existingItem[0].Quantity : 0} in cart.`
      );
  }

  return prisma.$executeRaw`
    MERGE StoredSKU AS target
    USING (SELECT ${cartID} AS CartID, ${productID} AS ProductID, ${skuName} AS SKUName) AS source
    ON (target.CartID = source.CartID AND target.ProductID = source.ProductID AND target.SKUName = source.SKUName)
    WHEN MATCHED THEN
        UPDATE SET Quantity = Quantity + ${quantity}
    WHEN NOT MATCHED THEN
        INSERT (CartID, ProductID, SKUName, Quantity)
        VALUES (${cartID}, ${productID}, ${skuName}, ${quantity});
  `;
};

const getCart = async (loginName: string) => {
  const result = await prisma.$queryRaw<any[]>`
    SELECT 
      c.CartID,
      c.LoginName,
      c.TotalCost,
      (
        SELECT 
          ss.CartID,
          ss.ProductID,
          ss.SKUName,
          ss.Quantity,
          (
            SELECT 
              s.ProductID,
              s.SKUName,
              s.Size,
              s.Price,
              s.InStockNumber,
              s.Weight,
              (
                SELECT * FROM ProductInfo p WHERE p.ProductID = s.ProductID FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
              ) AS ProductInfo,
              (
                SELECT * FROM SKUImage si WHERE si.ProductID = s.ProductID AND si.SKUName = s.SKUName FOR JSON PATH
              ) AS SKUImage
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
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
  `;

  if (!result || result.length === 0) return null;
  const jsonString = Object.values(result[0])[0] as string;
  if (!jsonString) return null;
  return JSON.parse(jsonString);
};

const updateCartQuantity = async (
  loginName: string,
  productID: number,
  skuName: string,
  quantity: number
) => {
  const cartResult = await prisma.$queryRaw<any[]>`SELECT CartID FROM Cart WHERE LoginName = ${loginName}`;
  if (!cartResult || cartResult.length === 0) throw new Error("Cart not found");
  const cartID = cartResult[0].CartID;

  return prisma.$executeRaw`
    EXEC prc_UpdateQuantityStoredSKU 
      @Quantity = ${quantity}, 
      @CartID = ${cartID}, 
      @ProductID = ${productID}, 
      @SKUName = ${skuName}
  `;
};

const removeFromCart = async (
  loginName: string,
  productID: number,
  skuName: string
) => {
  const cartResult = await prisma.$queryRaw<any[]>`SELECT CartID FROM Cart WHERE LoginName = ${loginName}`;
  if (!cartResult || cartResult.length === 0) throw new Error("Cart not found");
  const cartID = cartResult[0].CartID;

  return prisma.$executeRaw`
    DELETE FROM StoredSKU
    WHERE CartID = ${cartID} AND ProductID = ${productID} AND SKUName = ${skuName}
  `;
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
    const skusJson = JSON.stringify(skus);

    const result = await prisma.$queryRaw<any[]>`
      BEGIN TRANSACTION;
      BEGIN TRY
        -- 1. Validate SKUs and Calculate Totals
        DECLARE @TotalOrderPrice INT = 0;
        DECLARE @SellerEarnings TABLE (LoginName VARCHAR(100), Earnings INT);
        
        -- Parse JSON input
        DECLARE @InputSKUs TABLE (ProductID INT, SKUName VARCHAR(100), Quantity INT);
        INSERT INTO @InputSKUs (ProductID, SKUName, Quantity)
        SELECT ProductID, SKUName, Quantity
        FROM OPENJSON(${skusJson})
        WITH (ProductID INT, SKUName VARCHAR(100), Quantity INT);

        -- Check if all SKUs exist
        IF EXISTS (
            SELECT 1 FROM @InputSKUs i
            LEFT JOIN SKU s ON i.ProductID = s.ProductID AND i.SKUName = s.SKUName
            WHERE s.ProductID IS NULL
        )
        BEGIN
            THROW 50000, 'One or more SKUs not found', 1;
        END

        -- Calculate Totals and Seller Earnings
        INSERT INTO @SellerEarnings (LoginName, Earnings)
        SELECT p.LoginName, SUM(s.Price * i.Quantity)
        FROM @InputSKUs i
        JOIN SKU s ON i.ProductID = s.ProductID AND i.SKUName = s.SKUName
        JOIN ProductInfo p ON s.ProductID = p.ProductID
        GROUP BY p.LoginName;

        SELECT @TotalOrderPrice = SUM(Earnings) FROM @SellerEarnings;

        -- 2. Create Order
        DECLARE @NewOrderID INT;
        INSERT INTO OrderInfo (LoginName, AddressID, ProviderName, AccountID, TotalPrice)
        VALUES (${loginName}, ${addressID}, ${providerName}, ${accountIdValue}, @TotalOrderPrice);
        SET @NewOrderID = SCOPE_IDENTITY();

        -- 3. Create SubOrder (Single SubOrder for now as per original logic)
        DECLARE @NewSubOrderID INT;
        INSERT INTO SubOrderInfo (OrderID, DeliveryMethodName, DeliveryProviderName, ActualDate, ExpectedDate, DeliveryPrice, TotalSKUPrice)
        VALUES (@NewOrderID, ${deliveryMethod}, ${deliveryProvider}, GETDATE(), DATEADD(DAY, 3, GETDATE()), 36363, @TotalOrderPrice);
        SET @NewSubOrderID = SCOPE_IDENTITY();

        -- 4. Create SubOrderDetails
        INSERT INTO SubOrderDetail (OrderID, SubOrderID, ProductID, SKUName, Quantity)
        SELECT @NewOrderID, @NewSubOrderID, ProductID, SKUName, Quantity
        FROM @InputSKUs;

        -- 5. Update Seller Earnings
        UPDATE s
        SET MoneyEarned = s.MoneyEarned + se.Earnings
        FROM Seller s
        JOIN @SellerEarnings se ON s.LoginName = se.LoginName;

        -- 6. Update Buyer MoneySpent
        UPDATE Buyer
        SET MoneySpent = MoneySpent + @TotalOrderPrice
        WHERE LoginName = ${loginName};

        COMMIT TRANSACTION;

        -- Return the created OrderID to fetch details
        SELECT @NewOrderID as OrderID;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        THROW 50000, @ErrorMessage, 1;
      END CATCH
    `;

    if (!result || result.length === 0) throw new Error("Order creation failed");
    const newOrderID = result[0].OrderID;

    return readOrderDetails(newOrderID);
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);

    if (
      originalMessage.includes(
        "Foreign key constraint violated: `FK__SubOrderI__Deliv"
      )
    ) {
      throw new Error(
        "Invalid order: delivery provider not found, choose among Giao Hang Nhanh, GrabExpress, VNPost"
      );
    }

    if (
      originalMessage.includes(
        "Foreign key constraint violated: `FK__SubOrderI__Deliv"
      )
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
  const result = await prisma.$queryRaw<any[]>`
    SELECT 
      o.OrderID,
      o.LoginName,
      o.OrderDate,
      o.TotalPrice,
      o.ProviderName,
      o.AccountID,
      o.AddressID,
      (
        SELECT * FROM AddressInfo a WHERE a.AddressID = o.AddressID AND a.LoginName = o.LoginName FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
      ) AS AddressInfo,
      (
        SELECT 
          so.OrderID,
          so.SubOrderID,
          so.DeliveryMethodName,
          so.DeliveryProviderName,
          so.ActualDate,
          so.ExpectedDate,
          so.DeliveryPrice,
          so.TotalSKUPrice,
          so.ShippingStatus,
          (
            SELECT 
              sod.OrderID,
              sod.SubOrderID,
              sod.ProductID,
              sod.SKUName,
              sod.Quantity,
              (
                SELECT 
                  s.ProductID,
                  s.SKUName,
                  s.Size,
                  s.Price,
                  s.InStockNumber,
                  s.Weight,
                  (
                    SELECT * FROM ProductInfo p WHERE p.ProductID = s.ProductID FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                  ) AS ProductInfo
                FROM SKU s
                WHERE s.ProductID = sod.ProductID AND s.SKUName = sod.SKUName
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
              ) AS SKU
            FROM SubOrderDetail sod
            WHERE sod.OrderID = so.OrderID AND sod.SubOrderID = so.SubOrderID
            FOR JSON PATH
          ) AS SubOrderDetail
        FROM SubOrderInfo so
        WHERE so.OrderID = o.OrderID
        FOR JSON PATH
      ) AS SubOrderInfo
    FROM OrderInfo o
    WHERE o.OrderID = ${orderID}
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
  `;

  if (!result || result.length === 0) return null;
  const jsonString = Object.values(result[0])[0] as string;
  if (!jsonString) return null;
  return JSON.parse(jsonString);
};

const getMoneySpent = async (loginName: string) => {
  const result = await prisma.$queryRaw<any[]>`
    SELECT MoneySpent FROM Buyer WHERE LoginName = ${loginName}
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
    SELECT LoginName FROM Comment WHERE CommentID = ${commentID}
  `;

  if (!comment || comment.length === 0) {
    throw new Error("Comment not found");
  }

  if (comment[0].LoginName !== loginName) {
    throw new Error("Unauthorized to delete this comment");
  }

  return prisma.$executeRaw`
    DELETE FROM Comment WHERE CommentID = ${commentID}
  `;
};

const editComment = async (
  loginName: string,
  commentID: number,
  content: string,
  ratings: number
) => {
  const comment = await prisma.$queryRaw<any[]>`
    SELECT LoginName FROM Comment WHERE CommentID = ${commentID}
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
  getAddresses,
  addToCart,
  getCart,
  removeFromCart,
  updateCartQuantity,
  createOrder,
  readOrderDetails,
  getMoneySpent,
  addComment,
  deleteComment,
  editComment,
};
