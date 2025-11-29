import prisma from "../mssql/prisma";

// TODO: Add pagination to listing functions + filter to get only Buyers or Sellers
const listBuyers = async () => {
  return prisma.$queryRaw`
    SELECT u.*, b.MoneySpent
    FROM UserInfo u
    LEFT JOIN Buyer b ON u.LoginName = b.LoginName
  `;
};

const listSellers = async () => {
  return prisma.$queryRaw`
    SELECT u.*, s.ShopName, s.SellerName, s.MoneyEarned
    FROM UserInfo u
    LEFT JOIN Seller s ON u.LoginName = s.LoginName
  `;
};

// Preserved for future use
// const updateUser = async (loginName: string, data: any) => {
//   return prisma.userInfo.update({ where: { LoginName: loginName }, data });
// };

// TODO: Optimize query to include all necessary fields (cart, orders, etc.)
const readBuyer = async (loginName: string) => {
  const result: any[] = await prisma.$queryRaw`
    SELECT u.*, b.MoneySpent
    FROM UserInfo u
    LEFT JOIN Buyer b ON u.LoginName = b.LoginName
    WHERE u.LoginName = ${loginName}
  `;
  return result[0] || null;
};

const readSeller = async (loginName: string) => {
  const result: any[] = await prisma.$queryRaw`
    SELECT u.*, s.ShopName, s.SellerName, s.MoneyEarned
    FROM UserInfo u
    LEFT JOIN Seller s ON u.LoginName = s.LoginName
    WHERE u.LoginName = ${loginName}
  `;
  return result[0] || null;
};

export default {
  listBuyers,
  listSellers,
  readBuyer,
  readSeller,
};
