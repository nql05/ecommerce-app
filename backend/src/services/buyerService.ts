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

const getAddresses = async (loginName: string) => {
  return prisma.addressInfo.findMany({
    where: { LoginName: loginName },
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
  deliveryMethod: string,
  deliveryProvider: string,
  accountID?: string | number | null,
) => {
  try {
    if (!Array.isArray(skus) || skus.length === 0) {
      throw new Error("Invalid order: skus must be a non-empty array");
    }

    const accountIdValue = accountID == null ? null : String(accountID);

    // Fetch SKU details (Price, Seller) to calculate totals and validate
    const skuIdentifiers = skus.map((s) => ({
      ProductID: s.ProductID,
      SKUName: s.SKUName,
    }));

    const skuDetails = await prisma.sKU.findMany({
      where: {
        OR: skuIdentifiers,
      },
      include: { ProductInfo: true },
    });

    // Validate that all requested SKUs exist
    const foundSkuKeys = new Set(
      skuDetails.map((d) => `${d.ProductID}-${d.SKUName}`)
    );
    for (const sku of skus) {
      if (!foundSkuKeys.has(`${sku.ProductID}-${sku.SKUName}`)) {
        throw new Error(
          `Product/SKU not found: ${sku.ProductID} - ${sku.SKUName}`
        );
      }
    }

    // Calculate totals and prepare updates
    let totalOrderPrice = 0;
    const sellerEarnings = new Map<string, number>();

    for (const item of skus) {
      const details = skuDetails.find(
        (d) => d.ProductID === item.ProductID && d.SKUName === item.SKUName
      );
      if (!details) continue;

      const itemTotal = details.Price * item.Quantity;
      totalOrderPrice += itemTotal;

      const seller = details.ProductInfo.LoginName;
      const currentEarning = sellerEarnings.get(seller) || 0;
      sellerEarnings.set(seller, currentEarning + itemTotal);
    }

    // Create Order
    const order = await prisma.orderInfo.create({
      data: {
        LoginName: loginName,
        AddressID: addressID,
        ProviderName: providerName,
        AccountID: accountIdValue,
        TotalPrice: totalOrderPrice,
      },
    });

    // Create SubOrder
    const subOrder = await prisma.subOrderInfo.create({
      data: {
        OrderID: order.OrderID,
        DeliveryMethodName: deliveryMethod,
        DeliveryProviderName: deliveryProvider,
        ActualDate: new Date(),
        ExpectedDate: new Date(),
        DeliveryPrice: 36363,
        TotalSKUPrice: totalOrderPrice,
      },
    });

    // Create SubOrderDetails
    await prisma.subOrderDetail.createMany({
      data: skus.map((sku) => ({
        OrderID: order.OrderID,
        SubOrderID: subOrder.SubOrderID,
        ProductID: sku.ProductID,
        SKUName: sku.SKUName,
        Quantity: sku.Quantity,
      })),
    });

    // Update Seller Earnings
    for (const [sellerLogin, earnings] of sellerEarnings) {
      await prisma.seller.update({
        where: { LoginName: sellerLogin },
        data: { MoneyEarned: { increment: earnings } },
      });
    }

    // Update Buyer MoneySpent
    await prisma.buyer.update({
      where: { LoginName: loginName },
      data: { MoneySpent: { increment: totalOrderPrice } },
    });

    // Return the order with nested sub-orders and their details
    const fullOrder = await prisma.orderInfo.findUnique({
      where: { OrderID: order.OrderID },
      include: { SubOrderInfo: { include: { SubOrderDetail: true } } },
    });

    return fullOrder;
  } catch (error) {
    const originalMessage = error instanceof Error ? error.message : String(error);

    if (originalMessage.includes("Foreign key constraint violated: `FK__SubOrderI__Deliv__4CA06362")) {
      throw new Error("Invalid order: delivery provider not found, choose among Giao Hang Nhanh, GrabExpress, VNPost");
    }

    if (originalMessage.includes("Foreign key constraint violated: `FK__SubOrderI__Deliv__4BAC3F29")) {
      throw new Error("Invalid order: delivery method not found, choose among Economy, Express, Standard");
    }
    throw new Error(`Failed to create order for ${loginName}: ${originalMessage}`);
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
                  ProductInfo: true
                },
              },
            },
          },
        },
      },
      AddressInfo: true,
    },
  });
}

const getMoneySpent = async (loginName: string) => {
  const buyer = await prisma.buyer.findUnique({
    where: { LoginName: loginName },
    select: { MoneySpent: true },
  });
  return buyer?.MoneySpent || 0;
};

export default {
  findMany,
  findUnique,
  getAddresses,
  addToCart,
  getCart,
  removeFromCart,
  updateCartQuantity,
  createOrder,
  readOrderDetails,
  getMoneySpent,
};
