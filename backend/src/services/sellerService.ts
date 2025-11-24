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

export default {
  listSellerProducts,
  createProduct,
  readProduct,
  updateProduct,
  deleteProduct,
  getEarnings,
};
