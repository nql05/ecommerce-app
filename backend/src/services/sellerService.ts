import prisma from '../mssql/prisma';

const listSellerProducts = async (loginName: string) => {
  return prisma.productInfo.findMany({ where: { LoginName: loginName }, include: { SKU: { include: { Comment: true } } } });
};

const createProduct = async (loginName: string, data: any) => {
  return prisma.productInfo.create({ data: { ...data, LoginName: loginName } });
};

const updateProduct = async (id: number, data: any) => {
  return prisma.productInfo.update({ where: { ProductID: id }, data });
};

const deleteProduct = async (id: number) => {
  return prisma.productInfo.delete({ where: { ProductID: id } });
};

const getEarnings = async (loginName: string) => {
  const seller = await prisma.seller.findUnique({ where: { LoginName: loginName } });
  return seller?.MoneyEarned ?? 0;
};

export default {
  listSellerProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getEarnings,
};
