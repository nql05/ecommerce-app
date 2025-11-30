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

const findByLoginName = async (loginName: string) => {
  const result: any[] = await prisma.$queryRaw`
    SELECT u.*, b.MoneySpent, s.ShopName, s.SellerName, s.MoneyEarned
    FROM UserInfo u
    LEFT JOIN Buyer b ON u.LoginName = b.LoginName
    LEFT JOIN Seller s ON u.LoginName = s.LoginName
    WHERE u.LoginName = ${loginName}
  `;
  return convertBigIntToNumber(result[0] || null);
};

const getUserProfile = async (loginName: string) => {
  const result: any[] = await prisma.$queryRaw`
    SELECT 
      u.LoginName, u.UserName, u.Email, u.PhoneNumber, u.Gender, 
      CONVERT(VARCHAR(10), u.BirthDate, 23) AS BirthDate,
      u.Age, u.Address,
      b.MoneySpent,
      s.ShopName, s.SellerName, s.MoneyEarned
    FROM UserInfo u
    LEFT JOIN Buyer b ON u.LoginName = b.LoginName
    LEFT JOIN Seller s ON u.LoginName = s.LoginName
    WHERE u.LoginName = ${loginName}
  `;
  return convertBigIntToNumber(result[0] || null);
};

export default {
  findByLoginName,
  getUserProfile,
};
