import prisma from '../mssql/prisma';

const listUsers = async () => {
  return prisma.userInfo.findMany({ include: { Buyer: true, Seller: true } });
};

const updateUser = async (loginName: string, data: any) => {
  return prisma.userInfo.update({ where: { LoginName: loginName }, data });
};

const getStats = async () => {
  const userCount = await prisma.userInfo.count();
  const productCount = await prisma.productInfo.count();
  const orderCount = await prisma.orderInfo.count();
  return { userCount, productCount, orderCount };
};

export default { listUsers, updateUser, getStats };
