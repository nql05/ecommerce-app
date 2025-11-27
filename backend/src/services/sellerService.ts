import prisma from "../mssql/prisma";

const listSellerProducts = async (loginName: string) => {
  try {
    return await prisma.productInfo.findMany({
      where: { LoginName: loginName },
      include: { SKU: { include: { Comment: false } } },
    });
  } catch (error) {
    const originalMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to list products for ${loginName}: ${originalMessage}`);
  }
};

const createProduct = async (loginName: string, data: any) => {
  try {
    // Prevent clients from setting identity/PK values (ProductID)
    const { ProductID, ...payload } = data || {};

    // Force the LoginName from authenticated user
    return await prisma.productInfo.create({ data: { ...payload, LoginName: loginName } });
  } catch (error) {
    const originalMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create product for ${loginName}: ${originalMessage}`);
  }
};

const readProduct = async (id: number) => {
  try {
    return await prisma.productInfo.findUnique({
      where: { ProductID: id },
      include: { SKU: { include: { Comment: true } } },
    });
  } catch (error) {
    const originalMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read product ${id}: ${originalMessage}`);
  }
};

const updateProduct = async (id: number, data: any) => {
  try {
    // Do not allow modifying identity columns
    const { ProductID, SKUID, ...payload } = data || {};
    return await prisma.productInfo.update({ where: { ProductID: id }, data: payload });
  } catch (error) {
    const originalMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to update product ${id}: ${originalMessage}`);
  }
};

const deleteProduct = async (id: number) => {
  try {
    return await prisma.productInfo.delete({ where: { ProductID: id } });
  } catch (error) {
    const originalMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to delete product ${id}: ${originalMessage}`);
  }
};

const getEarnings = async (loginName: string) => {
  try {
    const seller = await prisma.seller.findUnique({
      where: { LoginName: loginName },
    });
    return seller?.MoneyEarned ?? 0;
  } catch (error) {
    const originalMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get earnings for ${loginName}: ${originalMessage}`);
  }
};

const getProductStatistics = async (productId: number) => {
  try {
    const sales = await prisma.subOrderDetail.findMany({
      where: { ProductID: productId },
      include: {
        SubOrderInfo: true,
        SKU: true,
      },
    });

    let totalSold = 0;
    let totalRevenue = 0;
    const dailyStats: Record<string, number> = {};
    const monthlyStats: Record<string, number> = {};
    const yearlyStats: Record<string, number> = {};

    for (const sale of sales) {
      const qty = sale.Quantity;
      const price = sale.SKU.Price;
      const revenue = qty * price;
      const date = new Date(sale.SubOrderInfo.ActualDate);

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
    }

    return {
      totalSold,
      totalRevenue,
      dailyStats,
      monthlyStats,
      yearlyStats,
    };
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to get statistics for product ${productId}: ${originalMessage}`
    );
  }
};

export default {
  listSellerProducts,
  createProduct,
  readProduct,
  updateProduct,
  deleteProduct,
  getEarnings,
  getProductStatistics,
};
