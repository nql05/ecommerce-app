USE Ecommerce;
DELETE FROM SKUImage;
GO

INSERT INTO SKUImage (ProductID, SKUName, SKU_URL)
VALUES
    -- iPhone 15 Pro (ProductID = 1)
    (1, '128GB-Black', '/images/skus/iphone-15-pro-black.png'),
    (1, '256GB-Black', '/images/skus/iphone-15-pro-black.png'),
    (1, '128GB-White', '/images/skus/iphone-15-pro-white.png'),
    (1, '256GB-Blue', '/images/skus/iphone-15-pro-blue.png'),

    -- MacBook Air M2 (ProductID = 2)
    (2, '8GB-256GB-Silver', '/images/skus/macbook-air-m2-silver.png'),
    (2, '8GB-512GB-Silver', '/images/skus/macbook-air-m2-silver.png'),
    (2, '16GB-512GB-Gold', '/images/skus/macbook-air-m2-gold.png'),

    -- AirPods Pro 2 (ProductID = 3)
    (3, 'Standard-White', '/images/skus/airpods-pro-2.png'),

    -- iPad Air 5th Gen (ProductID = 4)
    (4, '64GB-Purple', '/images/skus/ipad-air-5th-gen-purple.png'),
    (4, '256GB-Purple', '/images/skus/ipad-air-5th-gen-purple.png'),
    (4, '64GB-Starlight', '/images/skus/ipad-air-5th-gen-starlight.png'),

    -- Apple Watch Series 9 (ProductID = 5)
    (5, '41mm-GPS-Midnight', '/images/skus/apple-watch-series-9-midnight.png'),
    (5, '45mm-GPS-Starlight', '/images/skus/apple-watch-series-9-starlight.png'),
    (5, '41mm-Cellular-Pink', '/images/skus/apple-watch-series-9-pink.png'),

    -- Samsung Galaxy S24 Ultra (ProductID = 6)
    (6, '256GB-Titanium-Gray', '/images/skus/samsung-galaxy-s24-ultra-gray.png'),
    (6, '512GB-Titanium-Black', '/images/skus/samsung-galaxy-s24-ultra-black.png'),
    (6, '256GB-Titanium-Violet', '/images/skus/samsung-galaxy-s24-ultra-violet.png'),

    -- Sony WH-1000XM5 (ProductID = 7)
    (7, 'Standard-Black', '/images/skus/sony-wh-1000xm5-black.png'),
    (7, 'Standard-Silver', '/images/skus/sony-wh-1000xm5-silver.png'),

    -- Dell XPS 15 (ProductID = 8)
    (8, 'i7-16GB-512GB', '/images/skus/dell-xps-15.png'),
    (8, 'i7-32GB-1TB', '/images/skus/dell-xps-15.png'),

    -- Samsung Galaxy Tab S9 (ProductID = 9)
    (9, '128GB-Beige', '/images/skus/samsung-galaxy-tab-s9-beige.png'),
    (9, '256GB-Graphite', '/images/skus/samsung-galaxy-tab-s9-graphite.png'),

    -- Logitech MX Master 3S (ProductID = 10)
    (10, 'Standard-Black', '/images/skus/logitech-mx-master-3s-black.png'),
    (10, 'Standard-Gray', '/images/skus/logitech-mx-master-3s-gray.png');
GO

SELECT * FROM SKUImage;