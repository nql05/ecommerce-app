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
  return prisma.userInfo.findUnique({
    where: { LoginName: loginName },
    include: { Buyer: true, Seller: true },
  });
};

export default {
  createUser,
  findByLoginName,
};
