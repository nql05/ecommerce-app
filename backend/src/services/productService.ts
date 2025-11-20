import prisma from '../mssql/prisma';

const findMany = async (search?: string) => {
  return prisma.productInfo.findMany({
    where: search ? { ProductName: { contains: search } } : {},
    include: { SKU: { include: { Comment: true } } },
  });
};

const findUnique = async (id: number) => {
  return prisma.productInfo.findUnique({ where: { ProductID: id }, include: { SKU: { include: { Comment: true } } } });
};

const addToCart = async (loginName: string, productID: number, skuName: string, quantity: number) => {
  const cart = await prisma.cart.findFirst({ where: { LoginName: loginName } });
  if (!cart) throw new Error('Cart not found');
  return prisma.storedSKU.upsert({
    where: { ProductID_CartID_SKUName: { ProductID: productID, CartID: cart.CartID, SKUName: skuName } },
    update: { Quantity: { increment: quantity } },
    create: { CartID: cart.CartID, ProductID: productID, SKUName: skuName, Quantity: quantity },
  });
};

const getCart = async (loginName: string) => {
  return prisma.cart.findFirst({ where: { LoginName: loginName }, include: { StoredSKU: { include: { SKU: { include: { ProductInfo: true } } } } } });
};

const updateCartQuantity = async (loginName: string, productID: number, skuName: string, quantity: number) => {
  const cart = await prisma.cart.findFirst({ where: { LoginName: loginName } });
  if (!cart) throw new Error('Cart not found');
  return prisma.storedSKU.update({ where: { ProductID_CartID_SKUName: { ProductID: productID, CartID: cart.CartID, SKUName: skuName } }, data: { Quantity: quantity } });
};

const createOrder = async (loginName: string, skus: any[], addressID: number, providerName: string, accountID?: string | number | null) => {
  const accountIdValue = accountID == null ? null : String(accountID);
  const order = await prisma.orderInfo.create({ data: { LoginName: loginName, AddressID: addressID, ProviderName: providerName, AccountID: accountIdValue } });
  const shopGroups = skus.reduce((acc: Record<string, any[]>, sku: any) => {
    const shop = sku.productInfo.LoginName;
    if (!acc[shop]) acc[shop] = [];
    acc[shop].push(sku);
    return acc;
  }, {});
  for (const shop in shopGroups) {
    const subOrder = await prisma.subOrderInfo.create({ data: { OrderID: order.OrderID, DeliveryMethodName: 'Standard', DeliveryProviderName: 'Default', ActualDate: new Date(), ExpectedDate: new Date() } });
    for (const sku of shopGroups[shop]) {
      await prisma.subOrderDetail.create({ data: { OrderID: order.OrderID, SubOrderID: subOrder.SubOrderID, ProductID: sku.ProductID, SKUName: sku.SKUName, Quantity: sku.Quantity } });
    }
  }
  return order;
};

export default {
  findMany,
  findUnique,
  addToCart,
  getCart,
  updateCartQuantity,
  createOrder,
};
