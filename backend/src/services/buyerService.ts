import prisma from "../mssql/prisma";

const findMany = async (search?: string) => {
  const searchPattern = search ? `%${search}%` : "%";
  //Query ProductInfo + SKU of that Product + SKUImage + Comment
  const result = await prisma.$queryRaw<any[]>`
    SELECT 
      p.*,
      JSON_QUERY((
        SELECT 
          s.*,
          JSON_QUERY((
            SELECT 
              c.*
            FROM Comment c
            WHERE c.ProductID = s.ProductID AND c.SKUName = s.SKUName
            FOR JSON PATH
          )) AS Comment,
          JSON_QUERY((
            SELECT 
              si.*
            FROM SKUImage si
            WHERE si.ProductID = s.ProductID AND si.SKUName = s.SKUName
            FOR JSON PATH
          )) AS SKUImage
        FROM SKU s
        WHERE s.ProductID = p.ProductID
        FOR JSON PATH
      )) AS SKU
    FROM ProductInfo p
    WHERE p.ProductName LIKE ${searchPattern}
    FOR JSON PATH
  `;

  if (!result || result.length === 0) return [];
  const jsonString = result.map(row => Object.values(row)[0]).join('');
  if (!jsonString) return [];
  return JSON.parse(jsonString);
};

const findUnique = async (id: number) => {
  // Query ProductInfo + SKU + Comment + SKUImage
  const result = await prisma.$queryRaw<any[]>`
    SELECT 
      p.*,
      JSON_QUERY((
        SELECT 
          s.*,
          JSON_QUERY((
            SELECT 
              c.*
            FROM Comment c
            WHERE c.ProductID = s.ProductID AND c.SKUName = s.SKUName
            FOR JSON PATH
          )) AS Comment,
          JSON_QUERY((
            SELECT 
              si.*
            FROM SKUImage si
            WHERE si.ProductID = s.ProductID AND si.SKUName = s.SKUName
            FOR JSON PATH
          )) AS SKUImage
        FROM SKU s
        WHERE s.ProductID = p.ProductID
        FOR JSON PATH
      )) AS SKU
    FROM ProductInfo p
    WHERE p.ProductID = ${id}
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
  `;

  if (!result || result.length === 0) return null;
  const jsonString = result.map(row => Object.values(row)[0]).join('');
  if (!jsonString) return null;
  return JSON.parse(jsonString);
};

const getAddresses = async (loginName: string) => {
  return prisma.$queryRaw`
    SELECT * 
    FROM AddressInfo 
    WHERE LoginName = ${loginName}
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
    SELECT CartID 
    FROM Cart 
    WHERE LoginName = ${loginName}
  `;
  
  if (!cartResult || cartResult.length === 0) throw new Error("Cart not found");
  const cartID = cartResult[0].CartID;

  // 2. Get SKU details (Price, Stock)
  const skuResult = await prisma.$queryRaw<any[]>`
    SELECT Price, InStockNumber 
    FROM SKU 
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
    SELECT Quantity 
    FROM StoredSKU 
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
    USING (
      SELECT ${cartID} AS CartID, ${productID} AS ProductID, ${skuName} AS SKUName
    ) AS source
    ON (target.CartID = source.CartID AND target.ProductID = source.ProductID AND target.SKUName = source.SKUName)
    WHEN MATCHED THEN
        UPDATE SET Quantity = Quantity + ${quantity}
    WHEN NOT MATCHED THEN
        INSERT (CartID, ProductID, SKUName, Quantity)
        VALUES (${cartID}, ${productID}, ${skuName}, ${quantity});
  `;
};

const getCart = async (loginName: string) => {
  // Quert Cart + StoredSKU
  const result = await prisma.$queryRaw<any[]>`
    SELECT 
      c.*,
      JSON_QUERY((
        SELECT 
          ss.*,
          JSON_QUERY((
            SELECT 
              s.*,
              JSON_QUERY((
                SELECT * FROM ProductInfo p WHERE p.ProductID = s.ProductID FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
              )) AS ProductInfo,
              JSON_QUERY((
                SELECT * FROM SKUImage si WHERE si.ProductID = s.ProductID AND si.SKUName = s.SKUName FOR JSON PATH
              )) AS SKUImage
            FROM SKU s
            WHERE s.ProductID = ss.ProductID AND s.SKUName = ss.SKUName
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
          )) AS SKU
        FROM StoredSKU ss
        WHERE ss.CartID = c.CartID
        FOR JSON PATH
      )) AS StoredSKU
    FROM Cart c
    WHERE c.LoginName = ${loginName}
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    `;
    
    if (!result || result.length === 0) return null;
    const jsonString = result.map(row => Object.values(row)[0]).join('');
    if (!jsonString) {
      console.log("Error JSON String")
      return null;
    }
      const parsedResult = JSON.parse(jsonString);
    console.log(JSON.stringify(parsedResult, null, 2));
  return parsedResult;
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
  const cartResult = await prisma.$queryRaw<any[]>`
    SELECT CartID 
    FROM Cart 
    WHERE LoginName = ${loginName}
  `;
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
  updateCartQuantity,
  createOrder,
  readOrderDetails,
  getMoneySpent,
  addComment,
  deleteComment,
  editComment,
};
