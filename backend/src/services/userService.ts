import prisma from "../mssql/prisma";

const findByLoginName = async (loginName: string) => {
  return prisma.userInfo.findUnique({
    where: { LoginName: loginName },
    include: { Buyer: true, Seller: true },
  });
};

const getUserProfile = async (loginName: string) => {
  return prisma.userInfo.findUnique({
    where: { LoginName: loginName },
    select: {
      LoginName: true,
      UserName: true,
      Email: true,
      PhoneNumber: true,
      Gender: true,
      BirthDate: true,
      Age: true,
      Address: true,
      Buyer: {
        select: {
          MoneySpent: true,
        },
      },
      Seller: {
        select: {
          ShopName: true,
          SellerName: true,
          MoneyEarned: true,
        },
      },
    },
  });
};

export default {
  findByLoginName,
  getUserProfile,
};
