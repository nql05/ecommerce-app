import prisma from "../mssql/prisma";
import { Prisma } from "@prisma/client";

const findMany = async (search?: string) => {
  const whereClause = search
    ? Prisma.sql`WHERE p.ProductName LIKE ${"%" + search + "%"}`
    : Prisma.sql``;

  return prisma.$queryRaw`
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
  return result[0] || null;
};

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
  const result: any[] = await prisma.$queryRaw`
    WITH CartInfo AS (
      SELECT CartID FROM Cart WHERE LoginName = ${loginName}
    ),
    SkuInfo AS (
      SELECT Price, InStockNumber FROM SKU WHERE ProductID = ${productID} AND SKUName = ${skuName}
    ),
    ExistingItem AS (
      SELECT Quantity FROM StoredSKU 
      WHERE ProductID = ${productID} AND CartID = (SELECT CartID FROM CartInfo) AND SKUName = ${skuName}
    ),
    Validation AS (
      SELECT 
        CASE 
          WHEN NOT EXISTS (SELECT 1 FROM CartInfo) THEN 'Cart not found'
          WHEN NOT EXISTS (SELECT 1 FROM SkuInfo) THEN 'SKU not found: ProductID=' + CAST(${productID} AS VARCHAR) + ', SKUName=' + ${skuName}
          WHEN ${quantity} > FLOOR(2147483647.0 / (SELECT Price FROM SkuInfo)) THEN 'Quantity too large. Maximum allowed: ' + CAST(FLOOR(2147483647.0 / (SELECT Price FROM SkuInfo)) AS VARCHAR)
          WHEN ${quantity} > (SELECT InStockNumber FROM SkuInfo) THEN 'Insufficient stock. Available: ' + CAST((SELECT InStockNumber FROM SkuInfo) AS VARCHAR)
          WHEN EXISTS (SELECT 1 FROM ExistingItem) AND ((SELECT Quantity FROM ExistingItem) + ${quantity}) > (SELECT InStockNumber FROM SkuInfo) THEN 'Insufficient stock. Available: ' + CAST((SELECT InStockNumber FROM SkuInfo) AS VARCHAR) + '. You already have ' + CAST((SELECT Quantity FROM ExistingItem) AS VARCHAR) + ' in cart.'
          ELSE NULL
        END AS ErrorMessage
    )
    SELECT * FROM Validation WHERE ErrorMessage IS NOT NULL
    UNION ALL
    SELECT NULL AS ErrorMessage FROM Validation WHERE ErrorMessage IS NULL
      AND EXISTS(
        UPDATE StoredSKU 
        SET Quantity = Quantity + ${quantity}
        OUTPUT 'UPDATED' AS Action, INSERTED.*
        WHERE ProductID = ${productID} AND CartID = (SELECT CartID FROM CartInfo) AND SKUName = ${skuName}
      )
    UNION ALL
    SELECT NULL AS ErrorMessage FROM Validation WHERE ErrorMessage IS NULL
      AND NOT EXISTS (SELECT 1 FROM ExistingItem)
      AND EXISTS(
        INSERT INTO StoredSKU (CartID, ProductID, SKUName, Quantity)
        OUTPUT 'INSERTED' AS Action, INSERTED.*
        SELECT (SELECT CartID FROM CartInfo), ${productID}, ${skuName}, ${quantity}
      )
  `;

  if (result[0]?.ErrorMessage) {
    throw new Error(result[0].ErrorMessage);
  }

  return result[0];
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
  return result[0] || null;
};

const removeFromCart = async (
  loginName: string,
  productID: number,
  skuName: string
) => {
  const result: any[] = await prisma.$queryRaw`
    WITH CartInfo AS (
      SELECT CartID FROM Cart WHERE LoginName = ${loginName}
    )
    DELETE FROM StoredSKU
    OUTPUT DELETED.*
    WHERE ProductID = ${productID} 
      AND CartID = (SELECT CartID FROM CartInfo) 
      AND SKUName = ${skuName}
      AND EXISTS (SELECT 1 FROM CartInfo)
  `;

  if (result.length === 0) {
    throw new Error("Cart not found or item not in cart");
  }

  return result[0];
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
      INSERT INTO OrderInfo (LoginName, AddressID, ProviderName, AccountID, TotalPrice)
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

    return result[0];
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
  return result[0] || null;
};

const getMoneySpent = async (loginName: string) => {
  const result: any[] = await prisma.$queryRaw`
    SELECT MoneySpent FROM Buyer WHERE LoginName = ${loginName}
  `;
  return result[0]?.MoneySpent || 0;
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
  return comment[0];
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

  return { ...comment[0], Content: content, Ratings: ratings };
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
