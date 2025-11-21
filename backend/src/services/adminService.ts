import prisma from "../mssql/prisma";

// TODO: Add pagination to listing functions + filter to get only Buyers or Sellers
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

// TODO: Optimize query to include all necessary fields (cart, orders, etc.)
const readBuyer = async (loginName: string) => {
  return prisma.userInfo.findUnique({
    where: { LoginName: loginName },
    include: {
      Buyer: true,
      AddressInfo: true,
    },
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
