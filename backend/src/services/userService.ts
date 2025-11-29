import prisma from "../mssql/prisma";

const findByLoginName = async (loginName: string) => {
  const result: any[] = await prisma.$queryRaw`
    SELECT u.*, b.MoneySpent, s.ShopName, s.SellerName, s.MoneyEarned
    FROM UserInfo u
    LEFT JOIN Buyer b ON u.LoginName = b.LoginName
    LEFT JOIN Seller s ON u.LoginName = s.LoginName
    WHERE u.LoginName = ${loginName}
  `;
  return result[0] || null;
};

const getUserProfile = async (loginName: string) => {
  const result: any[] = await prisma.$queryRaw`
    SELECT 
      u.LoginName, u.UserName, u.Email, u.PhoneNumber, u.Gender, u.BirthDate, u.Age, u.Address,
      b.MoneySpent,
      s.ShopName, s.SellerName, s.MoneyEarned
    FROM UserInfo u
    LEFT JOIN Buyer b ON u.LoginName = b.LoginName
    LEFT JOIN Seller s ON u.LoginName = s.LoginName
    WHERE u.LoginName = ${loginName}
  `;
  return result[0] || null;
};

export default {
  findByLoginName,
  getUserProfile,
};
