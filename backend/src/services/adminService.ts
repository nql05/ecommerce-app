import prisma from "../mssql/prisma";

const listBuyers = async () => {
  return prisma.userInfo.findMany({ include: { Buyer: true } });
};

const listSellers = async () => {
  return prisma.userInfo.findMany({ include: { Seller: true } });
};

// Preserved for future use
// const updateUser = async (loginName: string, data: any) => {
//   return prisma.userInfo.update({ where: { LoginName: loginName }, data });
// };

const readBuyer = async (loginName: string) => {
  return prisma.userInfo.findUnique({
    where: { LoginName: loginName },
    include: { Buyer: true },
  });
};

const readSeller = async (loginName: string) => {
  return prisma.userInfo.findUnique({
    where: { LoginName: loginName },
    include: { Seller: true },
  });
};

export default {
  listBuyers,
  listSellers,
  readBuyer,
  readSeller,
};
