import prisma from "../mssql/prisma";

// Helper to safely parse JSON that might already be an object or null
const safeJsonParse = (value: any) => {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value; // Already an object
};

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

const listSellerProducts = async (loginName: string) => {
  try {
    const results: any[] = await prisma.$queryRaw`
      SELECT 
        p.*,
        (
          SELECT s.*, 
            (SELECT i.* FROM SKUImage i WHERE i.ProductID = s.ProductID AND i.SKUName = s.SKUName FOR JSON PATH) AS SKUImage
          FROM SKU s 
          WHERE s.ProductID = p.ProductID 
          FOR JSON PATH
        ) AS SKU
      FROM ProductInfo p
      WHERE p.LoginName = ${loginName}
    `;

    // Parse JSON strings to objects
    return results.map((product: any) => {
      const skuData = safeJsonParse(product.SKU);
      return convertBigIntToNumber({
        ...product,
        SKU: skuData
          ? (Array.isArray(skuData) ? skuData : [skuData]).map((sku: any) => ({
              ...sku,
              SKUImage: safeJsonParse(sku.SKUImage) || [],
            }))
          : [],
      });
    });
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to list products for ${loginName}: ${originalMessage}`
    );
  }
};

const createProduct = async (loginName: string, data: any) => {
  try {
    const { ProductID, SKU, ...payload } = data || {};
    const {
      ProductName,
      ProductDescription,
      ProductCategory,
      ProductBrand,
      ProductMadeIn,
    } = payload;

    // Create the product first
    const result: any[] = await prisma.$queryRaw`
      INSERT INTO ProductInfo (LoginName, ProductName, ProductDescription, ProductCategory, ProductBrand, ProductMadeIn)
      OUTPUT INSERTED.*
      VALUES (${loginName}, ${ProductName}, ${ProductDescription}, ${ProductCategory}, ${ProductBrand}, ${ProductMadeIn})
    `;

    const createdProduct = convertBigIntToNumber(result[0]);
    const productId = createdProduct.ProductID;

    // If SKUs are provided, create them
    if (SKU?.create && Array.isArray(SKU.create) && SKU.create.length > 0) {
      // Check for duplicate SKU names in the input
      const skuNames = SKU.create.map((sku: any) => sku.SKUName);
      const duplicates = skuNames.filter(
        (name: string, index: number) => skuNames.indexOf(name) !== index
      );
      if (duplicates.length > 0) {
        throw new Error(
          `Duplicate SKU names found: ${duplicates.join(
            ", "
          )}. Each SKU name must be unique for a product.`
        );
      }

      for (const sku of SKU.create) {
        const { SKUName, Price, InStockNumber, Size, Weight, SKUImage } = sku;

        // Insert SKU
        await prisma.$executeRaw`
          INSERT INTO SKU (ProductID, SKUName, Price, InStockNumber, Size, Weight)
          VALUES (${productId}, ${SKUName}, ${Price}, ${InStockNumber}, ${
          Size || null
        }, ${Weight || null})
        `;

        // Insert SKU Images if provided
        if (SKUImage?.create && Array.isArray(SKUImage.create)) {
          for (const img of SKUImage.create) {
            await prisma.$executeRaw`
              INSERT INTO SKUImage (ProductID, SKUName, SKU_URL)
              VALUES (${productId}, ${SKUName}, ${img.SKU_URL})
            `;
          }
        }
      }
    }

    // Return the complete product with SKUs
    return readProduct(productId);
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to create product for ${loginName}: ${originalMessage}`
    );
  }
};

const readProduct = async (id: number) => {
  try {
    const result: any[] = await prisma.$queryRaw`
      SELECT 
        p.*,
        (
          SELECT s.*, 
            (SELECT c.* FROM Comment c WHERE c.ProductID = s.ProductID AND c.SKUName = s.SKUName FOR JSON PATH) AS Comment,
            (SELECT i.* FROM SKUImage i WHERE i.ProductID = s.ProductID AND i.SKUName = s.SKUName FOR JSON PATH) AS SKUImage
          FROM SKU s 
          WHERE s.ProductID = p.ProductID 
          FOR JSON PATH
        ) AS SKU
      FROM ProductInfo p
      WHERE p.ProductID = ${id}
    `;

    if (!result[0]) return null;

    const product = result[0];
    const skuData = safeJsonParse(product.SKU);
    return convertBigIntToNumber({
      ...product,
      SKU: skuData
        ? (Array.isArray(skuData) ? skuData : [skuData]).map((sku: any) => ({
            ...sku,
            Comment: safeJsonParse(sku.Comment) || [],
            SKUImage: safeJsonParse(sku.SKUImage) || [],
          }))
        : [],
    });
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read product ${id}: ${originalMessage}`);
  }
};

const updateProduct = async (id: number, data: any) => {
  try {
    const { ProductID, SKUID, SKU, ...payload } = data || {};
    const {
      ProductName,
      ProductDescription,
      ProductCategory,
      ProductBrand,
      ProductMadeIn,
    } = payload;

    // Only update fields that are provided
    if (ProductName !== undefined && ProductName !== null) {
      await prisma.$executeRaw`UPDATE ProductInfo SET ProductName = ${ProductName} WHERE ProductID = ${id}`;
    }
    if (ProductDescription !== undefined && ProductDescription !== null) {
      await prisma.$executeRaw`UPDATE ProductInfo SET ProductDescription = ${ProductDescription} WHERE ProductID = ${id}`;
    }
    if (ProductCategory !== undefined && ProductCategory !== null) {
      await prisma.$executeRaw`UPDATE ProductInfo SET ProductCategory = ${ProductCategory} WHERE ProductID = ${id}`;
    }
    if (ProductBrand !== undefined && ProductBrand !== null) {
      await prisma.$executeRaw`UPDATE ProductInfo SET ProductBrand = ${ProductBrand} WHERE ProductID = ${id}`;
    }
    if (ProductMadeIn !== undefined && ProductMadeIn !== null) {
      await prisma.$executeRaw`UPDATE ProductInfo SET ProductMadeIn = ${ProductMadeIn} WHERE ProductID = ${id}`;
    }

    // Handle SKU operations
    if (SKU) {
      // Create new SKUs
      if (SKU.create && Array.isArray(SKU.create) && SKU.create.length > 0) {
        // Check for duplicate SKU names in the input
        const skuNames = SKU.create.map((sku: any) => sku.SKUName);
        const duplicates = skuNames.filter(
          (name: string, index: number) => skuNames.indexOf(name) !== index
        );
        if (duplicates.length > 0) {
          throw new Error(
            `Duplicate SKU names found: ${duplicates.join(
              ", "
            )}. Each SKU name must be unique for a product.`
          );
        }

        // Check if any of these SKU names already exist for this product
        for (const skuName of skuNames) {
          const existing: any[] = await prisma.$queryRaw`
            SELECT SKUName FROM SKU WHERE ProductID = ${id} AND SKUName = ${skuName}
          `;
          if (existing.length > 0) {
            throw new Error(
              `SKU name '${skuName}' already exists for this product. Please use a different name.`
            );
          }
        }

        for (const sku of SKU.create) {
          const { SKUName, Price, InStockNumber, Size, Weight, SKUImage } = sku;

          // Insert SKU
          await prisma.$executeRaw`
            INSERT INTO SKU (ProductID, SKUName, Price, InStockNumber, Size, Weight)
            VALUES (${id}, ${SKUName}, ${Price}, ${InStockNumber}, ${
            Size || null
          }, ${Weight || null})
          `;

          // Insert SKU Images if provided
          if (SKUImage?.create && Array.isArray(SKUImage.create)) {
            for (const img of SKUImage.create) {
              await prisma.$executeRaw`
                INSERT INTO SKUImage (ProductID, SKUName, SKU_URL)
                VALUES (${id}, ${SKUName}, ${img.SKU_URL})
              `;
            }
          }
        }
      }

      // Update existing SKUs
      if (SKU.update) {
        const { where, data: skuData } = SKU.update;
        const oldSKUName = where.ProductID_SKUName.SKUName;
        const { SKUName, Price, InStockNumber, Size, Weight, SKUImage } =
          skuData;

        // Update SKU
        if (SKUName && SKUName !== oldSKUName) {
          // If SKU name changed, we need to update it
          await prisma.$executeRaw`
            UPDATE SKU 
            SET SKUName = ${SKUName},
                Price = ${Price},
                InStockNumber = ${InStockNumber},
                Size = ${Size || null},
                Weight = ${Weight || null}
            WHERE ProductID = ${id} AND SKUName = ${oldSKUName}
          `;

          // Update related records
          await prisma.$executeRaw`UPDATE SKUImage SET SKUName = ${SKUName} WHERE ProductID = ${id} AND SKUName = ${oldSKUName}`;
          await prisma.$executeRaw`UPDATE Comment SET SKUName = ${SKUName} WHERE ProductID = ${id} AND SKUName = ${oldSKUName}`;
        } else {
          // Just update the values
          await prisma.$executeRaw`
            UPDATE SKU 
            SET Price = ${Price},
                InStockNumber = ${InStockNumber},
                Size = ${Size || null},
                Weight = ${Weight || null}
            WHERE ProductID = ${id} AND SKUName = ${oldSKUName}
          `;
        }

        // Handle SKU Image updates
        if (SKUImage) {
          const currentSKUName = SKUName || oldSKUName;

          if (SKUImage.deleteMany !== undefined) {
            await prisma.$executeRaw`DELETE FROM SKUImage WHERE ProductID = ${id} AND SKUName = ${currentSKUName}`;
          }

          if (SKUImage.create && Array.isArray(SKUImage.create)) {
            for (const img of SKUImage.create) {
              await prisma.$executeRaw`
                INSERT INTO SKUImage (ProductID, SKUName, SKU_URL)
                VALUES (${id}, ${currentSKUName}, ${img.SKU_URL})
              `;
            }
          }
        }
      }
    }

    return readProduct(id);
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to update product ${id}: ${originalMessage}`);
  }
};

const deleteProduct = async (id: number) => {
  try {
    await prisma.$executeRaw`DELETE FROM SKU WHERE ProductID = ${id}`;
    const result: any[] = await prisma.$queryRaw`
      DELETE FROM ProductInfo 
      OUTPUT DELETED.*
      WHERE ProductID = ${id}
    `;
    return convertBigIntToNumber(result[0]);
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to delete product ${id}: ${originalMessage}`);
  }
};

const getEarnings = async (loginName: string) => {
  try {
    const result: any[] = await prisma.$queryRaw`
      SELECT MoneyEarned FROM Seller WHERE LoginName = ${loginName}
    `;
    return result[0]?.MoneyEarned ? Number(result[0].MoneyEarned) : 0;
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to get earnings for ${loginName}: ${originalMessage}`
    );
  }
};

const getProductStatistics = async (productId: number) => {
  try {
    const sales: any[] = await prisma.$queryRaw`
      SELECT 
        sod.*,
        soi.ActualDate,
        s.Price
      FROM SubOrderDetail sod
      JOIN SubOrderInfo soi ON sod.SubOrderID = soi.SubOrderID
      JOIN SKU s ON sod.ProductID = s.ProductID AND sod.SKUName = s.SKUName
      WHERE sod.ProductID = ${productId}
    `;

    let totalSold = 0;
    let totalRevenue = 0;
    const dailyStats: Record<string, number> = {};
    const monthlyStats: Record<string, number> = {};
    const yearlyStats: Record<string, number> = {};
    const skuStats: Record<string, { quantity: number; revenue: number }> = {};

    for (const sale of sales) {
      const qty = Number(sale.Quantity);
      const price = Number(sale.Price);
      const revenue = qty * price;
      const date = new Date(sale.ActualDate);

      totalSold += qty;
      totalRevenue += revenue;

      const dayKey = date.toISOString().split("T")[0];
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const yearKey = `${date.getFullYear()}`;

      dailyStats[dayKey] = (dailyStats[dayKey] || 0) + revenue;
      monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + revenue;
      yearlyStats[yearKey] = (yearlyStats[yearKey] || 0) + revenue;

      const skuName = sale.SKUName;
      if (!skuStats[skuName]) {
        skuStats[skuName] = { quantity: 0, revenue: 0 };
      }
      skuStats[skuName].quantity += qty;
      skuStats[skuName].revenue += revenue;
    }

    return {
      totalSold,
      totalRevenue,
      dailyStats,
      monthlyStats,
      yearlyStats,
      skuStats,
    };
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to get statistics for product ${productId}: ${originalMessage}`
    );
  }
};

const deleteSku = async (productId: number, skuName: string) => {
  try {
    const result: any[] = await prisma.$queryRaw`
      DELETE FROM SKU 
      OUTPUT DELETED.*
      WHERE ProductID = ${productId} AND SKUName = ${skuName}
    `;
    return convertBigIntToNumber(result[0]);
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to delete SKU ${skuName} for product ${productId}: ${originalMessage}`
    );
  }
};

export default {
  listSellerProducts,
  createProduct,
  readProduct,
  updateProduct,
  deleteProduct,
  deleteSku,
  getEarnings,
  getProductStatistics,
};
