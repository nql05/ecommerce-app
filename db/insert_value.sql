USE Ecommerce;
GO

-- ======================================================
-- Table: UserInfo
-- ======================================================
INSERT INTO UserInfo (LoginName, Password, PhoneNumber, Email, UserName, Gender, BirthDate, Address)
VALUES 
('user001', 'Pass123!@#', '0901234567', 'john.doe@gmail.com', 'JohnDoe', 'M', '1990-05-15', '123 Main St, District 1, HCMC'),
('user002', 'SecurePass456', '0912345678', 'jane.smith@yahoo.com', 'JaneSmith', 'F', '1992-08-20', '456 Oak Ave, District 2, HCMC'),
('user003', 'MyPass789', '0923456789', 'mike.wilson@outlook.com', 'MikeWilson', 'M', '1988-03-10', '789 Pine Rd, District 3, HCMC'),
('user004', 'Password2024', '0934567890', 'sarah.johnson@gmail.com', 'SarahJohnson', 'F', '1995-11-25', '321 Elm St, District 4, HCMC'),
('user005', 'Safe@Pass01', '0945678901', NULL, 'DavidBrown', 'M', '1991-07-08', '654 Maple Dr, District 5, HCMC'),
('user006', 'Qwerty!234', NULL, 'emily.davis@hotmail.com', 'EmilyDavis', 'F', '1993-02-14', '987 Cedar Ln, District 6, HCMC'),
('user007', 'Test@Pass99', '0967890123', 'robert.miller@gmail.com', 'RobertMiller', 'M', '1989-12-30', '147 Birch Blvd, District 7, HCMC'),
('user008', 'Strong#Pass', '0978901234', 'lisa.anderson@yahoo.com', 'LisaAnderson', 'F', '1994-06-18', '258 Spruce St, District 8, HCMC'),
('user009', 'MySecret123', '0989012345', 'james.taylor@outlook.com', 'JamesTaylor', 'M', '1987-09-05', '369 Willow Way, District 9, HCMC'),
('user010', 'Pass@Word10', '0990123456', 'amanda.white@gmail.com', 'AmandaWhite', 'F', '1996-04-22', '741 Ash Court, District 10, HCMC'),
('admin', 'admin', NULL, 'admin@ecommerce.local', 'Administrator', 'M', NULL, NULL);
GO

-- ======================================================
-- Table: Seller
-- ======================================================
INSERT INTO Seller (LoginName, ShopName, CitizenIDCard, SellerName, MoneyEarned)
VALUES 
('user001', 'JohnTech Store', '001234567890', 'John Doe Shop', 0),
('user003', 'Wilson Electronics', '003456789012', 'Mike Wilson Shop', 0),
('user005','David Store','005234567890','David Brown Shop',0),
('user007','Robert Store','007345678901','Robert Miller Shop',0),
('user009','James Store','009456789012','James Taylor Shop',0);
GO

-- ======================================================
-- Table: Buyer
-- ======================================================
INSERT INTO Buyer (LoginName)
SELECT LoginName FROM UserInfo
WHERE LoginName NOT IN ('user001', 'user003', 'user005', 'user007', 'user009', 'admin');


-- ======================================================
-- Table: AddressInfo
-- ======================================================
INSERT INTO AddressInfo (LoginName, ContactName, ContactPhoneNumber, City, District, Commune, DetailAddress, AddressType, IsAddressDefault)
VALUES 
-- user001 (JohnDoe)
('user001', 'John Doe', '0901234567', 'Ho Chi Minh City', 'District 1', 'Ward 1', '123 Main St', 'Home', 'Y'),
('user001', 'John Doe', '0901234567', 'Ho Chi Minh City', 'District 3', 'Ward 5', '456 Business Ave', 'Office', 'N'),

-- user002 (JaneSmith)
('user002', 'Jane Smith', '0912345678', 'Ho Chi Minh City', 'District 2', 'Ward 2', '456 Oak Ave', 'Home', 'Y'),
('user002', 'Jane Smith', '0912345678', 'Ho Chi Minh City', 'District 1', 'Ward 3', '789 Office Blvd', 'Office', 'N'),

-- user003 (MikeWilson)
('user003', 'Mike Wilson', '0923456789', 'Ho Chi Minh City', 'District 3', 'Ward 4', '789 Pine Rd', 'Home', 'Y'),

-- user004 (SarahJohnson)
('user004', 'Sarah Johnson', '0934567890', 'Ho Chi Minh City', 'District 4', 'Ward 5', '321 Elm St', 'Home', 'Y'),
('user004', 'Sarah Johnson', '0934567890', 'Ho Chi Minh City', 'District 7', 'Ward 8', '111 Work Plaza', 'Office', 'N'),

-- user005 (DavidBrown)
('user005', 'David Brown', '0945678901', 'Ho Chi Minh City', 'District 5', 'Ward 6', '654 Maple Dr', 'Home', 'Y'),

-- user006 (EmilyDavis)
('user006', 'Emily Davis', '0956789012', 'Ho Chi Minh City', 'District 6', 'Ward 7', '987 Cedar Ln', 'Home', 'Y'),
('user006', 'Emily Davis', '0956789012', 'Ho Chi Minh City', 'District 2', 'Ward 4', '222 Corporate St', 'Office', 'N'),

-- user007 (RobertMiller)
('user007', 'Robert Miller', '0967890123', 'Ho Chi Minh City', 'District 7', 'Ward 9', '147 Birch Blvd', 'Home', 'Y'),

-- user008 (LisaAnderson)
('user008', 'Lisa Anderson', '0978901234', 'Ho Chi Minh City', 'District 8', 'Ward 10', '258 Spruce St', 'Home', 'Y'),
('user008', 'Lisa Anderson', '0978901234', 'Ho Chi Minh City', 'District 5', 'Ward 6', '333 Business Park', 'Office', 'N'),

-- user009 (JamesTaylor)
('user009', 'James Taylor', '0989012345', 'Ho Chi Minh City', 'District 9', 'Ward 11', '369 Willow Way', 'Home', 'Y'),

-- user010 (AmandaWhite)
('user010', 'Amanda White', '0990123456', 'Ho Chi Minh City', 'District 10', 'Ward 12', '741 Ash Court', 'Home', 'Y'),
('user010', 'Amanda White', '0990123456', 'Ho Chi Minh City', 'District 1', 'Ward 2', '444 Tech Tower', 'Office', 'N');
GO

-- ======================================================
-- Table: ProductInfo
-- ======================================================
INSERT INTO ProductInfo (LoginName, ProductName, ProductBrand, ProductCategory, ProductDescription, ProductMadeIn)
VALUES 
-- Products from user001 (JohnTech Store)
('user001', 'iPhone 15 Pro', 'Apple', 'Smartphone', 'Latest iPhone with A17 Pro chip and titanium design', 'USA'),
('user001', 'MacBook Air M2', 'Apple', 'Laptop', '13-inch laptop with M2 chip, 8GB RAM, 256GB SSD', 'China'),
('user001', 'AirPods Pro 2', 'Apple', 'Audio', 'Wireless earbuds with active noise cancellation', 'Vietnam'),
('user001', 'iPad Air 5th Gen', 'Apple', 'Tablet', '10.9-inch tablet with M1 chip', 'China'),
('user001', 'Apple Watch Series 9', 'Apple', 'Smartwatch', 'Fitness and health tracking smartwatch', 'China'),

-- Products from user003 (Wilson Electronics)
('user003', 'Samsung Galaxy S24 Ultra', 'Samsung', 'Smartphone', 'Flagship phone with S Pen and 200MP camera', 'South Korea'),
('user003', 'Sony WH-1000XM5', 'Sony', 'Audio', 'Premium noise-cancelling headphones', 'Malaysia'),
('user003', 'Dell XPS 15', 'Dell', 'Laptop', '15.6-inch laptop with Intel i7, 16GB RAM, 512GB SSD', 'China'),
('user003', 'Samsung Galaxy Tab S9', 'Samsung', 'Tablet', '11-inch Android tablet with S Pen included', 'Vietnam'),
('user003', 'Logitech MX Master 3S', 'Logitech', 'Accessories', 'Wireless ergonomic mouse for productivity', 'China'),

-- Products from user005 (David Store)
('user005', 'Xiaomi 14 Pro', 'Xiaomi', 'Smartphone', 'Flagship Xiaomi with high-refresh AMOLED and Snapdragon chipset', 'China'),
('user005', 'ROG Zephyrus G14', 'ASUS', 'Laptop', '14-inch gaming laptop with Ryzen CPU and RTX graphics', 'Taiwan'),
('user005', 'QuietComfort Earbuds II', 'Bose', 'Audio', 'Noise-cancelling true wireless earbuds', 'USA'),

-- Products from user007 (Robert Store)
('user007', 'Spectre x360', 'HP', 'Laptop', 'Convertible 2-in-1 ultrabook with OLED display', 'China'),
('user007', 'EOS R6 II', 'Canon', 'Camera', 'Mirrorless camera with high-speed AF and excellent low-light performance', 'Japan'),
('user007', 'PowerCore 26800', 'Anker', 'Accessories', 'High-capacity portable charger with fast charging support', 'China'),

-- Products from user009 (James Store)
('user009', 'OnePlus 12', 'OnePlus', 'Smartphone', 'Performance-focused smartphone with advanced camera tuning', 'China'),
('user009', 'SRS-XB43', 'Sony', 'Audio', 'Portable Bluetooth speaker with EXTRA BASS', 'Malaysia'),
('user009', 'T7 Shield', 'Samsung', 'Storage', 'Rugged portable SSD with fast transfer speeds', 'Vietnam');
GO

-- ======================================================
-- Table: SKU
-- ======================================================
INSERT INTO SKU (ProductID, SKUName, Size, Price, InStockNumber, Weight)
VALUES 
-- iPhone 15 Pro (ProductID = 1)
(1, '128GB-Black', 128, 25990000, 50, 187),
(1, '256GB-Black', 256, 28990000, 40, 187),
(1, '128GB-White', 128, 25990000, 45, 187),
(1, '256GB-Blue', 256, 28990000, 35, 187),

-- MacBook Air M2 (ProductID = 2)
(2, '8GB-256GB-Silver', 256, 27990000, 30, 1240),
(2, '8GB-512GB-Silver', 512, 32990000, 25, 1240),
(2, '16GB-512GB-Gold', 512, 37990000, 20, 1240),

-- AirPods Pro 2 (ProductID = 3)
(3, 'Standard-White', 0, 6490000, 100, 50),

-- iPad Air 5th Gen (ProductID = 4)
(4, '64GB-Purple', 64, 14990000, 40, 461),
(4, '256GB-Purple', 256, 18990000, 30, 461),
(4, '64GB-Starlight', 64, 14990000, 35, 461),

-- Apple Watch Series 9 (ProductID = 5)
(5, '41mm-GPS-Midnight', 41, 10990000, 50, 32),
(5, '45mm-GPS-Starlight', 45, 12990000, 40, 39),
(5, '41mm-Cellular-Pink', 41, 13990000, 30, 32),

-- Samsung Galaxy S24 Ultra (ProductID = 6)
(6, '256GB-Titanium-Gray', 256, 30990000, 45, 233),
(6, '512GB-Titanium-Black', 512, 35990000, 35, 233),
(6, '256GB-Titanium-Violet', 256, 30990000, 40, 233),

-- Sony WH-1000XM5 (ProductID = 7)
(7, 'Standard-Black', 0, 8990000, 60, 250),
(7, 'Standard-Silver', 0, 8990000, 50, 250),

-- Dell XPS 15 (ProductID = 8)
(8, 'i7-16GB-512GB', 512, 45990000, 20, 1800),
(8, 'i7-32GB-1TB', 1024, 55990000, 15, 1800),

-- Samsung Galaxy Tab S9 (ProductID = 9)
(9, '128GB-Beige', 128, 18990000, 35, 498),
(9, '256GB-Graphite', 256, 21990000, 30, 498),

-- Logitech MX Master 3S (ProductID = 10)
(10, 'Standard-Black', 0, 2490000, 80, 141),
(10, 'Standard-Gray', 0, 2490000, 70, 141),

-- user005 (ProductID = 11..13)
(11, '256GB-Black', 256, 16990000, 60, 198),
(11, '512GB-Black', 512, 19990000, 40, 198),
(11, '256GB-White', 256, 16990000, 50, 198),

(12, '16GB-512GB-Radeon', 512, 32990000, 20, 1400),
(12, '32GB-1TB-Radeon', 1024, 42990000, 10, 1400),
(12, '16GB-1TB-Radeon', 1024, 29990000, 15, 1400),

(13, 'Standard-White', 0, 2990000, 120, 50),
(13, 'Standard-Black', 0, 2990000, 90, 50),

-- user007 (ProductID = 14..16)
(14, '13-inch-8GB-512GB', 512, 27990000, 18, 1250),
(14, '13-inch-16GB-1TB', 1024, 33990000, 12, 1250),

(15, 'Body-Only', 0, 78900000, 8, 680),
(15, 'With-24-70-Lens', 0, 109900000, 5, 1200),

(16, 'Standard-26800mAh', 0, 899000, 150, 580),
(16, 'Slim-20000mAh', 0, 699000, 200, 420),

-- user009 (ProductID = 17..19)
(17, '256GB-Black', 256, 19990000, 55, 200),
(17, '512GB-Black', 512, 23990000, 30, 200),

(18, 'Standard-Black', 0, 2990000, 80, 780),

(19, '1TB', 1024, 2790000, 100, 60),
(19, '2TB', 2048, 4990000, 40, 60);
GO

-- ======================================================
-- Table: SKUImage
-- ======================================================
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

-- ======================================================
-- Table: SKUImage (Fill missing images)
-- ======================================================
INSERT INTO SKUImage (ProductID, SKUName, SKU_URL)
SELECT s.ProductID, s.SKUName, '/images/skus/placeholder.png'
FROM SKU s
LEFT JOIN SKUImage si ON s.ProductID = si.ProductID AND s.SKUName = si.SKUName
WHERE si.SKU_URL IS NULL;
GO

-- ======================================================
-- Table: Cart
-- ======================================================
INSERT INTO Cart (LoginName)
SELECT LoginName FROM Buyer;
GO

-- ======================================================
-- Table: DeliveryMethod
-- ======================================================
INSERT INTO DeliveryMethod (MethodName) VALUES ('Standard'), ('Express'), ('Economy');

-- ======================================================
-- Table: DeliveryProvider
-- ======================================================
INSERT INTO DeliveryProvider (ProviderName) VALUES ('VNPost'), ('GrabExpress'), ('Giao Hang Nhanh');

-- ======================================================
-- Table: ProvideDelivery
-- ======================================================
INSERT INTO ProvideDelivery (ProviderName, MethodName) VALUES 
('VNPost', 'Standard'), ('GrabExpress', 'Express'), ('Giao Hang Nhanh', 'Economy');
GO


-- ======================================================
-- Table: Voucher
-- ======================================================
-- INSERT INTO Voucher (StartedTime, ExpiredTime, MaxUsedNumber, MinMoneyValue)
-- VALUES 
-- -- Voucher 1: 10% Off for iPhone 15 (user001)
-- ('2024-01-01', '2025-12-31', 100, 20000000),
-- -- Voucher 2: 500k Off for MacBook (user001)
-- ('2024-01-01', '2025-12-31', 50, 25000000),
-- -- Voucher 3: 5% Off for Samsung S24 (user003)
-- ('2024-02-01', '2025-06-30', 200, 15000000),
-- -- Voucher 4: 200k Off for Sony Headphones (user003)
-- ('2024-01-01', '2025-12-31', 100, 5000000),
-- -- Voucher 5: 15% Off for Xiaomi 14 (user005)
-- ('2024-03-01', '2024-12-31', 30, 10000000);
-- GO

-- ======================================================
-- Table: PercentageVoucher & FlatDiscountVoucher
-- ======================================================
-- 2. Define the discount types (Assuming IDs 1-5 generated above match Codes VCH-000001 to VCH-000005)

-- VCH-000001: 10% Off (Max 2M)
-- INSERT INTO PercentageVoucher (Code, PercentageDiscount, MaxAmountAllowed)
-- VALUES ('VCH-000001', 10.0, 2000000);

-- -- VCH-000002: Flat 500k Off
-- INSERT INTO FlatDiscountVoucher (Code, DiscountAmount)
-- VALUES ('VCH-000002', 500000);

-- -- VCH-000003: 5% Off (Max 1M)
-- INSERT INTO PercentageVoucher (Code, PercentageDiscount, MaxAmountAllowed)
-- VALUES ('VCH-000003', 5.0, 1000000);

-- -- VCH-000004: Flat 200k Off
-- INSERT INTO FlatDiscountVoucher (Code, DiscountAmount)
-- VALUES ('VCH-000004', 200000);

-- -- VCH-000005: 15% Off (Max 3M)
-- INSERT INTO PercentageVoucher (Code, PercentageDiscount, MaxAmountAllowed)
-- VALUES ('VCH-000005', 15.0, 3000000);
-- GO

-- ======================================================
-- Table: VoucherOffer
-- ======================================================
-- 3. Link Vouchers to Products and Sellers
-- INSERT INTO VoucherOffer (VoucherCode, ProductID, LoginName)
-- VALUES 
-- -- user001 offers VCH-000001 on iPhone 15 Pro (ProductID=1)
-- ('VCH-000001', 1, 'user001'),

-- -- user001 offers VCH-000002 on MacBook Air M2 (ProductID=2)
-- ('VCH-000002', 2, 'user001'),

-- -- user003 offers VCH-000003 on Samsung S24 Ultra (ProductID=6)
-- ('VCH-000003', 6, 'user003'),

-- -- user003 offers VCH-000004 on Sony WH-1000XM5 (ProductID=7)
-- ('VCH-000004', 7, 'user003'),

-- -- user005 offers VCH-000005 on Xiaomi 14 Pro (ProductID=11)
-- ('VCH-000005', 11, 'user005');
-- GO

-- ======================================================
-- Table: StoredSKU
-- ======================================================
-- Insert items into StoredSKU (assuming CartID starts from 1)
INSERT INTO StoredSKU (CartID, ProductID, SKUName, Quantity)
VALUES 
-- Cart 1 (user002 - JaneSmith)
(1, 1, '128GB-Black', 1),
(1, 3, 'Standard-White', 1),
(1, 10, 'Standard-Black', 1),

-- Cart 2 (user004 - SarahJohnson)
(2, 6, '256GB-Titanium-Gray', 1),
(2, 7, 'Standard-Black', 1),
(2, 10, 'Standard-Black', 1),

-- Cart 3 (user006 - EmilyDavis)
(3, 4, '64GB-Purple', 1),
(3, 3, 'Standard-White', 1),

-- Cart 4 (user008 - LisaAnderson)
(4, 9, '128GB-Beige', 1),
(4, 10, 'Standard-Gray', 2),
(4, 6, '512GB-Titanium-Black', 1),

-- Cart 5 (user010 - AmandaWhite)
(5, 8, 'i7-16GB-512GB', 1),
(5, 7, 'Standard-Silver', 1);
GO


