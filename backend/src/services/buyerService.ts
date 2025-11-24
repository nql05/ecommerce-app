import prisma from "../mssql/prisma";

const findMany = async (search?: string) => {
  return prisma.productInfo.findMany({
    where: search ? { ProductName: { contains: search } } : {},
    include: { SKU: { include: { Comment: true } } },
  });
};

const findUnique = async (id: number) => {
  return prisma.productInfo.findUnique({
    where: { ProductID: id },
    include: { SKU: { include: { Comment: true } } },
  });
};

const addToCart = async (
  loginName: string,
  productID: number,
  skuName: string,
  quantity: number
) => {
  const cart = await prisma.cart.findFirst({ where: { LoginName: loginName } });
  if (!cart) throw new Error("Cart not found");

  return prisma.storedSKU.upsert({
    where: {
      ProductID_CartID_SKUName: {
        ProductID: productID,
        CartID: cart.CartID,
        SKUName: skuName,
      },
    },
    update: { Quantity: { increment: quantity } },
    create: {
      CartID: cart.CartID,
      ProductID: productID,
      SKUName: skuName,
      Quantity: quantity,
    },
  });
};

const getCart = async (loginName: string) => {
  return prisma.cart.findFirst({
    where: { LoginName: loginName },
    include: {
      StoredSKU: { include: { SKU: { include: { ProductInfo: true } } } },
    },
  });
};

const updateCartQuantity = async (
  loginName: string,
  productID: number,
  skuName: string,
  quantity: number
) => {
  const cart = await prisma.cart.findFirst({ where: { LoginName: loginName } });
  if (!cart) throw new Error("Cart not found");
  return prisma.storedSKU.update({
    where: {
      ProductID_CartID_SKUName: {
        ProductID: productID,
        CartID: cart.CartID,
        SKUName: skuName,
      },
    },
    data: { Quantity: quantity },
  });
};

const removeFromCart = async (
  loginName: string,
  productID: number,
  skuName: string
) => {
  const cart = await prisma.cart.findFirst({ where: { LoginName: loginName } });
  if (!cart) throw new Error("Cart not found");
  return prisma.storedSKU.delete({
    where: {
      ProductID_CartID_SKUName: {
        ProductID: productID,
        CartID: cart.CartID,
        SKUName: skuName,
      },
    },
  });
};

const createOrder = async (
  loginName: string,
  skus: any[],
  addressID: number,
  providerName: string,
  accountID?: string | number | null
) => {
  try {
    if (!Array.isArray(skus) || skus.length === 0) {
      throw new Error("Invalid order: skus must be a non-empty array");
    }

    const accountIdValue = accountID == null ? null : String(accountID);
    const order = await prisma.orderInfo.create({
      data: {
        LoginName: loginName,
        AddressID: addressID,
        ProviderName: providerName,
        AccountID: accountIdValue,
      },
    });

    // Build a list of product IDs referenced by the request and validate
    // they exist in the DB. We no longer split by seller/shop — create a
    // single sub-order that contains all SKUs for this order.
    const productIds = Array.from(
      new Set(skus.map((s: any) => s.ProductID).filter((v: any) => v != null))
    );

    const products = productIds.length
      ? await prisma.productInfo.findMany({
          where: { ProductID: { in: productIds } },
          select: { ProductID: true },
        })
      : [];

    const existingIds = new Set(products.map((p: any) => p.ProductID));
    for (const sku of skus) {
      if (!existingIds.has(sku.ProductID)) {
        throw new Error(`Product not found for ProductID=${sku.ProductID}`);
      }
    }

    // Create a single sub-order for the whole order
    const subOrder = await prisma.subOrderInfo.create({
      data: {
        OrderID: order.OrderID,
        DeliveryMethodName: "Standard",
        DeliveryProviderName: "VNPost",
        ActualDate: new Date(),
        ExpectedDate: new Date(),
      },
    });

    // Create details for every SKU under the single sub-order
    for (const sku of skus) {
      await prisma.subOrderDetail.create({
        data: {
          OrderID: order.OrderID,
          SubOrderID: subOrder.SubOrderID,
          ProductID: sku.ProductID,
          SKUName: sku.SKUName,
          Quantity: sku.Quantity,
        },
      });
    }

    return order;
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);

    if (
      originalMessage.includes(
        "Foreign key constraint violated: `FK__SubOrderI__Deliv__4CA06362"
      )
    ) {
      throw new Error(
        "Invalid order: delivery provider not found, choose among Giao Hang Nhanh, GrabExpress, VNPost"
      );
    }

    if (
      originalMessage.includes(
        "Foreign key constraint violated: `FK__SubOrderI__Deliv__4BAC3F29"
      )
    ) {
      throw new Error(
        "Invalid order: delivery method not found, choose among Economy, Express, Standard"
      );
    }
    throw new Error(
      `Failed to create order for ${loginName}: ${originalMessage}`
    );
  }
};

const readOrderDetails = async (orderID: number) => {
  return prisma.orderInfo.findUnique({
    where: { OrderID: orderID },
    include: {
      SubOrderInfo: {
        include: {
          SubOrderDetail: {
            include: {
              SKU: {
                include: {
                  ProductInfo: true,
                },
              },
            },
          },
        },
      },
      AddressInfo: true,
    },
  });
};

export default {
  findMany,
  findUnique,
  addToCart,
  getCart,
  removeFromCart,
  updateCartQuantity,
  createOrder,
  readOrderDetails,
};
