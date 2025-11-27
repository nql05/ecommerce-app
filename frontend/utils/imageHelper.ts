export const FALLBACK_IMAGES = [
  "airpods-pro-2.png",
  "apple-watch-series-9-midnight.png",
  "apple-watch-series-9-pink.png",
  "apple-watch-series-9-starlight.png",
  "ipad-air-5th-gen-purple.png",
  "ipad-air-5th-gen-starlight.png",
  "iphone-15-pro-black.png",
  "iphone-15-pro-blue.png",
  "iphone-15-pro-white.png",
  "macbook-air-m2-gold.png",
  "macbook-air-m2-silver.png",
  "samsung-galaxy-s24-ultra-black.png",
  "samsung-galaxy-s24-ultra-gray.png",
  "samsung-galaxy-s24-ultra-violet.png",
];

export const getProductImage = (
  productName: string,
  skuName?: string,
  dbImageUrl?: string
) => {
  if (dbImageUrl) return dbImageUrl;

  const searchTerms = [skuName, productName].filter(Boolean) as string[];

  // Simple slugify for matching: remove special chars, replace spaces with hyphens
  const normalize = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const match = FALLBACK_IMAGES.find((img) =>
    searchTerms.some((term) => img.toLowerCase().includes(normalize(term)))
  );

  if (match) {
    return `/images/skus/${match}`;
  }

  return "https://via.placeholder.com/300?text=No+Image";
};
