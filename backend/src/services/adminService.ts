import prisma from "../mssql/prisma";

// Helper to convert BigInt to number recursively
const convertBigIntToNumber = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return Number(obj);
  if (Array.isArray(obj)) return obj.map(convertBigIntToNumber);
  if (typeof obj === "object") {
    const converted: any = {};
    for (const key in obj) {
      converted[key] = convertBigIntToNumber(obj[key]);
    }
    return converted;
  }
  return obj;
};

// TODO: Add pagination to listing functions + filter to get only Buyers or Sellers
const listBuyers = async () => {
  const result = await prisma.$queryRaw`
    SELECT u.*, b.MoneySpent
    FROM UserInfo u
    INNER JOIN Buyer b ON u.LoginName = b.LoginName
  `;
  return convertBigIntToNumber(result);
};

const listSellers = async () => {
  const result = await prisma.$queryRaw`
    SELECT u.*, s.ShopName, s.SellerName, s.MoneyEarned
    FROM UserInfo u
    INNER JOIN Seller s ON u.LoginName = s.LoginName
  `;
  return convertBigIntToNumber(result);
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
  return convertBigIntToNumber(result[0] || null);
};

const readSeller = async (loginName: string) => {
  const result: any[] = await prisma.$queryRaw`
    SELECT u.*, s.ShopName, s.SellerName, s.MoneyEarned
    FROM UserInfo u
    LEFT JOIN Seller s ON u.LoginName = s.LoginName
    WHERE u.LoginName = ${loginName}
  `;
  return convertBigIntToNumber(result[0] || null);
};

export default {
  listBuyers,
  listSellers,
  readBuyer,
  readSeller,
};
