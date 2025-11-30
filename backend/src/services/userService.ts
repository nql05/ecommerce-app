import prisma from "../mssql/prisma";

const createUser = async ({
  loginName,
  password,
  userName,
  role,
}: {
  loginName: string;
  password: string;
  userName: string;
  role: string;
}) => {
  return prisma.userInfo.create({
    data: {
      LoginName: loginName,
      Password: password,
      UserName: userName,
      ...(role === "buyer"
        ? { Buyer: { create: {} } }
        : role === "seller"
        ? {
            Seller: {
              create: {
                ShopName: `${userName}'s Shop`,
                CitizenIDCard: "123456789",
                SellerName: userName,
              },
            },
          }
        : {}),
    },
  });
};

const findByLoginName = async (loginName: string) => {
  console.log("Find user of name: ", loginName);

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
  createUser,
  findByLoginName,
  getUserProfile,
};
