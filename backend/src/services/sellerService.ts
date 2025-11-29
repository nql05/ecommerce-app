import prisma from "../mssql/prisma";

const listSellerProducts = async (loginName: string) => {
  try {
    return await prisma.$queryRaw`
      SELECT 
        p.*,
        (
          SELECT s.*, 
            (SELECT i.* FROM SKUImage i WHERE i.ProductID = s.ProductID AND i.SKUName = s.SKUName FOR JSON PATH) AS SKUImage
          FROM SKU s 
          WHERE s.ProductID = p.ProductID 
          FOR JSON PATH
        ) AS SKU
      FROM ProductInfo p
      WHERE p.LoginName = ${loginName}
    `;
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to list products for ${loginName}: ${originalMessage}`
    );
  }
};

const createProduct = async (loginName: string, data: any) => {
  try {
    const { ProductID, ...payload } = data || {};
    const { ProductName, Description, CatalogID, BrandName, ProductStatus } =
      payload;

    const result: any[] = await prisma.$queryRaw`
      INSERT INTO ProductInfo (LoginName, ProductName, Description, CatalogID, BrandName, ProductStatus)
      OUTPUT INSERTED.*
      VALUES (${loginName}, ${ProductName}, ${Description}, ${CatalogID}, ${BrandName}, ${ProductStatus})
    `;
    return result[0];
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to create product for ${loginName}: ${originalMessage}`
    );
  }
};

const readProduct = async (id: number) => {
  try {
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
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read product ${id}: ${originalMessage}`);
  }
};

const updateProduct = async (id: number, data: any) => {
  try {
    const { ProductID, SKUID, ...payload } = data || {};
    const { ProductName, Description, CatalogID, BrandName, ProductStatus } =
      payload;

    await prisma.$executeRaw`
      UPDATE ProductInfo
      SET ProductName = COALESCE(${ProductName}, ProductName),
          Description = COALESCE(${Description}, Description),
          CatalogID = COALESCE(${CatalogID}, CatalogID),
          BrandName = COALESCE(${BrandName}, BrandName),
          ProductStatus = COALESCE(${ProductStatus}, ProductStatus)
      WHERE ProductID = ${id}
    `;

    return readProduct(id);
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to update product ${id}: ${originalMessage}`);
  }
};

const deleteProduct = async (id: number) => {
  try {
    await prisma.$executeRaw`DELETE FROM SKU WHERE ProductID = ${id}`;
    const result: any[] = await prisma.$queryRaw`
      DELETE FROM ProductInfo 
      OUTPUT DELETED.*
      WHERE ProductID = ${id}
    `;
    return result[0];
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to delete product ${id}: ${originalMessage}`);
  }
};

const getEarnings = async (loginName: string) => {
  try {
    const result: any[] = await prisma.$queryRaw`
      SELECT MoneyEarned FROM Seller WHERE LoginName = ${loginName}
    `;
    return result[0]?.MoneyEarned || 0;
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to get earnings for ${loginName}: ${originalMessage}`
    );
  }
};

const getProductStatistics = async (productId: number) => {
  try {
    const sales: any[] = await prisma.$queryRaw`
      SELECT 
        sod.*,
        soi.ActualDate,
        s.Price
      FROM SubOrderDetail sod
      JOIN SubOrderInfo soi ON sod.SubOrderID = soi.SubOrderID
      JOIN SKU s ON sod.ProductID = s.ProductID AND sod.SKUName = s.SKUName
      WHERE sod.ProductID = ${productId}
    `;

    let totalSold = 0;
    let totalRevenue = 0;
    const dailyStats: Record<string, number> = {};
    const monthlyStats: Record<string, number> = {};
    const yearlyStats: Record<string, number> = {};
    const skuStats: Record<string, { quantity: number; revenue: number }> = {};

    for (const sale of sales) {
      const qty = sale.Quantity;
      const price = sale.Price;
      const revenue = qty * price;
      const date = new Date(sale.ActualDate);

      totalSold += qty;
      totalRevenue += revenue;

      const dayKey = date.toISOString().split("T")[0];
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const yearKey = `${date.getFullYear()}`;

      dailyStats[dayKey] = (dailyStats[dayKey] || 0) + revenue;
      monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + revenue;
      yearlyStats[yearKey] = (yearlyStats[yearKey] || 0) + revenue;

      const skuName = sale.SKUName;
      if (!skuStats[skuName]) {
        skuStats[skuName] = { quantity: 0, revenue: 0 };
      }
      skuStats[skuName].quantity += qty;
      skuStats[skuName].revenue += revenue;
    }

    return {
      totalSold,
      totalRevenue,
      dailyStats,
      monthlyStats,
      yearlyStats,
      skuStats,
    };
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to get statistics for product ${productId}: ${originalMessage}`
    );
  }
};

const deleteSku = async (productId: number, skuName: string) => {
  try {
    const result: any[] = await prisma.$queryRaw`
      DELETE FROM SKU 
      OUTPUT DELETED.*
      WHERE ProductID = ${productId} AND SKUName = ${skuName}
    `;
    return result[0];
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to delete SKU ${skuName} for product ${productId}: ${originalMessage}`
    );
  }
};

export default {
  listSellerProducts,
  createProduct,
  readProduct,
  updateProduct,
  deleteProduct,
  deleteSku,
  getEarnings,
  getProductStatistics,
};
