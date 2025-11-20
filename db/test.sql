CREATE DATABASE Test;
GO

USE Test;
GO

CREATE TABLE UserInfo (
	LoginName VARCHAR(100),
	Password VARCHAR(255) NOT NULL,
	-- PhoneNumber and Email Should not be unique because they could be NULL
	PhoneNumber CHAR(10),
	Email VARCHAR(255),
	UserName VARCHAR(255) NOT NULL UNIQUE,
	Gender BIT, -- Bit in SQL Server = Boolean in other DBMS
	BirthDate DATE, --- Format: YYYY-MM-DD
	Age AS (DATEDIFF(YEAR, BirthDate, GETDATE())),
	Address VARCHAR(500),
	-- Constraints
	PRIMARY KEY (LoginName),
	CONSTRAINT email_format CHECK (
		Email IS NULL OR 
		(
			Email LIKE '%_@__%.__%'
			AND Email NOT LIKE '% %' -- No space allowed
			AND Email NOT LIKE '%@%@%' -- Only one @symbol
			AND Email NOT LIKE '%.@%' --Not .@
			AND Email NOT LIKE '%@.%' -- Not @.
		)
    ),
	CONSTRAINT contact_method CHECK (
		PhoneNumber IS NOT NULL or Email IS NOT NULL
	)
);
GO

CREATE TABLE Buyer (
	LoginName VARCHAR(100) PRIMARY KEY,
	MoneySpent INT NOT NULL DEFAULT 0 CHECK (MoneySpent >= 0),
	-- Constraint
	FOREIGN KEY (LoginName) REFERENCES UserInfo(LoginName) ON DELETE CASCADE ON UPDATE CASCADE 
);
GO

CREATE TABLE Seller (
	LoginName VARCHAR(100) PRIMARY KEY,
	ShopName VARCHAR(100) NOT NULL UNIQUE,
	CitizenIDCard VARCHAR(30) NOT NULL UNIQUE,
	SellerName VARCHAR(50) NOT NULL UNIQUE,
	MoneyEarned INT NOT NULL DEFAULT 0,
	-- Constraint
	FOREIGN KEY (LoginName) REFERENCES UserInfo(LoginName) ON DELETE CASCADE ON UPDATE CASCADE,
);
GO

CREATE TABLE AddressInfo (
	LoginName VARCHAR(100),
	AddressID INT IDENTITY(1,1),
	ContactName VARCHAR(255) NOT NULL,
	ContactPhoneNumber CHAR(10) NOT NULL, -- PhoneNumber contains 10 digits
	City VARCHAR(100) NOT NULL,
    District VARCHAR(100) NOT NULL,
    Commune VARCHAR(100) NOT NULL,
    DetailAddress VARCHAR(500) NOT NULL,
    AddressType VARCHAR(50) NOT NULL DEFAULT 'Home' CHECK (AddressType IN ('Home', 'Office')), -- Home or Office
    IsAddressDefault BIT NOT NULL DEFAULT 0, -- 0 = True, 1 = False
	-- Constraints
	PRIMARY KEY(LoginName, AddressID),
	FOREIGN KEY (LoginName) REFERENCES UserInfo(LoginName) ON DELETE CASCADE ON UPDATE CASCADE,
);
GO

CREATE TABLE OrderInfo (
	OrderID INT IDENTITY(1,1),
	LoginName VARCHAR(100) NOT NULL,
	OrderDate DATETIME2 NOT NULL DEFAULT GETDATE(),
	TotalPrice INT NOT NULL DEFAULT 0, -- we need to create a trigger from sub order 
	-- Component of Payment Method
	ProviderName VARCHAR(100) NOT NULL DEFAULT 'VCB' CHECK(ProviderName IN ('VCB', 'OCB', 'MoMo', 'ZaloPay')),
	AccountID VARCHAR(30) UNIQUE,
	AddressID INT NOT NULL,
	--Constraint
	PRIMARY KEY (OrderID),
	FOREIGN KEY (LoginName, AddressID) REFERENCES AddressInfo(LoginName, AddressID) ON DELETE CASCADE ON UPDATE CASCADE
);
GO

CREATE TABLE SubOrderInfo (
	OrderID INT,
	SubOrderID INT IDENTITY(1,1),
	TotalSKUPrice INT NOT NULL DEFAULT 0,
	ShippingStatus VARCHAR(50) NOT NULL DEFAULT 'Preparing' CHECK (ShippingStatus IN ('Preparing', 'Shipping', 'Done', 'Cancelled')),
	ActualDate DATETIME2 NOT NULL,
	ExpectedDate DATETIME2 NOT NULL,
	DeliveryMethodName VARCHAR(100) NOT NULL,
	DeliveryProviderName VARCHAR(100) NOT NULL,
	DeliveryPrice INT NOT NULL DEFAULT 0,
	-- Constraints
	PRIMARY KEY(OrderID, SubOrderID),
	FOREIGN KEY (OrderID) REFERENCES OrderInfo(OrderID) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT DeliveryDate CHECK (ActualDate <= ExpectedDate)
);
GO

CREATE TABLE DeliveryMethod (
	MethodName VARCHAR(100) PRIMARY KEY
);
GO

CREATE TABLE DeliveryProvider (
	ProviderName VARCHAR(100) PRIMARY KEY
);
GO


ALTER TABLE SubOrderInfo ADD FOREIGN KEY (DeliveryMethodName) REFERENCES DeliveryMethod(MethodName) ON DELETE CASCADE ON UPDATE CASCADE;
GO
ALTER TABLE SubOrderInfo ADD FOREIGN KEY (DeliveryProviderName) REFERENCES DeliveryProvider(ProviderName) ON DELETE CASCADE ON UPDATE CASCADE;
GO

CREATE TABLE Cart (
	CartID INT IDENTITY(1,1) PRIMARY KEY,
	LoginName VARCHAR(100) NOT NULL,
	TotalCost INT NOT NULL DEFAULT 0,
	-- Constraint
	FOREIGN KEY (LoginName) REFERENCES UserInfo(LoginName) ON DELETE CASCADE ON UPDATE CASCADE 
);
GO


CREATE TABLE ProvideDelivery (
	ProviderName VARCHAR(100) REFERENCES DeliveryProvider(ProviderName) ON DELETE CASCADE ON UPDATE CASCADE, 
	MethodName VARCHAR(100) REFERENCES DeliveryMethod(MethodName) ON DELETE CASCADE ON UPDATE CASCADE,
	PRIMARY KEY(ProviderName, MethodName)
);
GO

CREATE TABLE ProductInfo (
	ProductID INT IDENTITY(1,1) PRIMARY KEY,
	LoginName VARCHAR(100) NOT NULL,
	ProductName VARCHAR(100) NOT NULL,
	ProductBrand VARCHAR(100),
	ProductCategory VARCHAR(100) NOT NULL,
	ProductDescription VARCHAR(500),
	ProductMadeIn VARCHAR(100) NOT NULL,
	-- Constraints
	FOREIGN KEY (LoginName) REFERENCES Seller(LoginName) ON DELETE CASCADE ON UPDATE CASCADE -- Connect to Seller
);
GO

CREATE TABLE SKU (
	ProductID INT,
	SKUName VARCHAR(100),
	Size INT,
	Price INT NOT NULL,
	InStockNumber INT NOT NULL, -- available amount of product in the shop -> use trigger for this
	Weight INT,
	-- Constraints
	PRIMARY KEY (ProductID, SKUName),
	FOREIGN KEY (ProductID) REFERENCES ProductInfo(ProductID)
);
GO

CREATE TABLE StoredSKU (
	CartID INT,
	ProductID INT,
	SKUName VARCHAR(100),
	Quantity INT NOT NULL DEFAULT 0,
	-- Constraints
	PRIMARY KEY(ProductID, CartID, SKUName),
	FOREIGN KEY (CartID) REFERENCES Cart(CartID) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (ProductID, SKUName) REFERENCES SKU(ProductID, SKUName) ON DELETE CASCADE ON UPDATE CASCADE
);	
GO

CREATE TABLE SubOrderDetail (
	OrderID INT NOT NULL,
	SubOrderID INT,
	ProductID INT NOT NULL,
	SKUName VARCHAR(100),
	Quantity INT NOT NULL Default 0,
	-- Constraints
	PRIMARY KEY(SubOrderID, SKUName),
	FOREIGN KEY (OrderID, SubOrderID) REFERENCES SubOrderInfo(OrderID, SubOrderID) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (ProductID, SKUName) REFERENCES SKU(ProductID, SKUName) ON DELETE CASCADE ON UPDATE CASCADE
);
GO

CREATE TABLE SKUImage (
	ProductID INT,
	SKUName VARCHAR(100),
	SKU_URL VARCHAR(200),
	-- Constraints
	PRIMARY KEY (ProductID, SKUName, SKU_URL),
	FOREIGN KEY (ProductID, SKUName) REFERENCES SKU(ProductID, SKUName) ON DELETE CASCADE ON UPDATE CASCADE
);
GO

CREATE TABLE Comment (
	CommentID INT IDENTITY(1,1),
	LoginName VARCHAR(100) NOT NULL,
	ProductID INT,
	SKUName VARCHAR(100),
	Ratings INT CHECK (Ratings IS NULL OR Ratings BETWEEN 1 AND 5),
	Content VARCHAR(500),
	ParentCommentID INT,
	-- Constraints
	PRIMARY KEY (CommentID),
	FOREIGN KEY (LoginName) REFERENCES Buyer(LoginName) ON DELETE CASCADE ON UPDATE CASCADE,
	-- FOREIGN KEY (ProductID, SKUName) REFERENCES SKU(ProductID, SKUName) ON DELETE SET NULL ON UPDATE CASCADE,
	-- FOREIGN KEY (ParentCommentID) REFERENCES Comment(CommentID) ON DELETE SET NULL,
	CONSTRAINT CHK_Comment_NotEmpty CHECK (Ratings IS NOT NULL OR Content IS NOT NULL),
	FOREIGN KEY (ProductID, SKUName) REFERENCES SKU(ProductID, SKUName) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (ParentCommentID) REFERENCES Comment(CommentID)
);
GO

CREATE TABLE CommentImage (
	CommentID INT,
	CommentURL VARCHAR(200),
	-- Constraints
	PRIMARY KEY (CommentID, CommentURL),
	FOREIGN KEY (CommentID) REFERENCES Comment(CommentID) ON DELETE CASCADE ON UPDATE CASCADE
);
GO

CREATE TABLE Voucher (
	VoucherID INT IDENTITY(1,1) NOT NULL UNIQUE,
	Code AS ('VCH-' + RIGHT('000000' + CAST(VoucherId AS VARCHAR(10)), 6)) PERSISTED PRIMARY KEY, -- persisted = saved to disk + indexable
	StartedTime DATETIME2 NOT NULL,
    ExpiredTime DATETIME2 NOT NULL,
    CurrentUsedNumber INT NOT NULL DEFAULT 0,
    MaxUsedNumber INT NOT NULL DEFAULT 1,
    MinMoneyValue INT NOT NULL DEFAULT 0,
	-- Constraints
	CONSTRAINT CHK_Voucher_TimeRange CHECK (StartedTime < ExpiredTime),
	CONSTRAINT CHK_Voucher_UsedNumber CHECK (CurrentUsedNumber < MaxUsedNumber)
);
GO

CREATE TABLE VoucherOffer(
	VoucherCode VARCHAR(10),
	ProductID INT,
	LoginName VARCHAR(100) NOT NULL,
	-- Constraints
	PRIMARY KEY (VoucherCode, ProductID),
	FOREIGN KEY (VoucherCode) REFERENCES Voucher(Code) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (ProductID) REFERENCES ProductInfo(ProductID) ON DELETE NO ACTION ON UPDATE NO ACTION,
	FOREIGN KEY (LoginName) REFERENCES UserInfo(LoginName) ON DELETE NO ACTION ON UPDATE NO ACTION
); 
GO

CREATE TABLE AppliedVoucher(
	OrderID INT,
	SubOrderID INT,
	VoucherCode VARCHAR(10),
	-- Constraints
	PRIMARY KEY(OrderID, SubOrderID, VoucherCode),
	FOREIGN KEY (OrderID, SubOrderID) REFERENCES SubOrderInfo(OrderID, SubOrderID) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (VoucherCode) REFERENCES Voucher(Code) ON DELETE CASCADE ON UPDATE CASCADE
);
GO

CREATE TABLE PercentageVoucher(
	Code VARCHAR(10) PRIMARY KEY,
	PercentageDiscount DECIMAL(10,2) NOT NULL DEFAULT 0.0,
	MaxAmountAllowed INT NOT NULL DEFAULT 1,
	-- Constraints
	FOREIGN KEY (Code) REFERENCES Voucher(Code) ON DELETE CASCADE ON UPDATE CASCADE
);
GO

CREATE TABLE FlatDiscountVoucher(
	Code VARCHAR(10) PRIMARY KEY,
	DiscountAmount INT NOT NULL DEFAULT 0
);
GO

CREATE TABLE DeliveryPartner(
	LoginName VARCHAR(100),
	ProviderName VARCHAR(100),
	-- Constraints
	PRIMARY KEY (LoginName, ProviderName),
	FOREIGN KEY (LoginName) REFERENCES UserInfo(LoginName),
	FOREIGN KEY (ProviderName) REFERENCES DeliveryProvider(ProviderName)
);
GO

CREATE TABLE Withdrawal (
	WithdrawalID INT IDENTITY(1,1) PRIMARY KEY,
	LoginName VARCHAR(100) NOT NULL REFERENCES UserInfo(LoginName) ON DELETE CASCADE ON UPDATE CASCADE,
	WithdrawalAmount INT NOT NULL,
	WithdrawalTime DATETIME2 NOT NULL,
	AccountID VARCHAR(30) UNIQUE,
	ProviderName VARCHAR(100) NOT NULL DEFAULT 'VCB' CHECK (ProviderName IN ('VCB', 'MoMo', 'OCB', 'ZaloPay')),
	RemainingBalance INT NOT NULL DEFAULT 0 CHECK (RemainingBalance >= 0)
);
GO


-- 2. Create Trigger
-- 2.1 Trigger that generate derived column values
--- TRIGGER TO AUTO CALCULATE TOTAL COST IN Cart AFTER WE INSERT, UPDATE OR DELETE STORED SKU (Modify Quantity)
CREATE TRIGGER calculateCartTotalCost ON StoredSKU AFTER INSERT, UPDATE, DELETE
AS BEGIN

	DECLARE @ModifiedCart TABLE (CartID INT PRIMARY KEY);

	INSERT INTO @ModifiedCart (CartID)
	SELECT CartID FROM inserted
	UNION
	SELECT CartID FROM deleted;

	UPDATE Cart
	SET TotalCost = (
		SELECT ISNULL(SUM(StoredSKU.Quantity * SKU.Price), 0)
		FROM StoredSKU
		JOIN SKU ON StoredSKU.ProductID = SKU.ProductID AND StoredSKU.SKUName = SKU.SKUName
		WHERE StoredSKU.CartID IN (SELECT CartID FROM @ModifiedCart)
	)
END
GO

-- TRIGER TO AUTO CALCULATE AFTER WE MODIFY PRICE OF SKU
CREATE TRIGGER UpdateCartTotalCost ON SKU AFTER UPDATE
AS
BEGIN
	IF UPDATE(Price) AND EXISTS(
		SELECT 1 FROM inserted AS i 
		JOIN deleted AS d ON  i.ProductID = d.ProductID AND i.SKUName = d.SKUName
		WHERE i.Price != d.Price
	)

	BEGIN
        DECLARE @AffectedCarts TABLE (CartID INT PRIMARY KEY);

        INSERT INTO @AffectedCarts (CartID)
        SELECT DISTINCT S.CartID
        FROM StoredSKU AS S
        JOIN inserted AS i ON S.ProductID = i.ProductID AND S.SKUName = i.SKUName;

        UPDATE Cart
        SET TotalCost = (
            SELECT SUM(StoredSKU.Quantity * SKU.Price)
            FROM StoredSKU
            JOIN SKU ON StoredSKU.ProductID = SKU.ProductID AND StoredSKU.SKUName = SKU.SKUName
            WHERE StoredSKU.CartID = Cart.CartID
        )
        WHERE Cart.CartID IN (SELECT CartID FROM @AffectedCarts);
		END
END
GO

INSERT INTO UserInfo (LoginName, Password, PhoneNumber, Email, UserName, Gender, BirthDate, Address)
VALUES 
('user001', 'Pass123!@#', '0901234567', 'john.doe@gmail.com', 'JohnDoe', 1, '1990-05-15', '123 Main St, District 1, HCMC'),
('user002', 'SecurePass456', '0912345678', 'jane.smith@yahoo.com', 'JaneSmith', 0, '1992-08-20', '456 Oak Ave, District 2, HCMC'),
('user003', 'MyPass789', '0923456789', 'mike.wilson@outlook.com', 'MikeWilson', 1, '1988-03-10', '789 Pine Rd, District 3, HCMC'),
('user004', 'Password2024', '0934567890', 'sarah.johnson@gmail.com', 'SarahJohnson', 0, '1995-11-25', '321 Elm St, District 4, HCMC'),
('user005', 'Safe@Pass01', '0945678901', NULL, 'DavidBrown', 1, '1991-07-08', '654 Maple Dr, District 5, HCMC'),
('user006', 'Qwerty!234', NULL, 'emily.davis@hotmail.com', 'EmilyDavis', 0, '1993-02-14', '987 Cedar Ln, District 6, HCMC'),
('user007', 'Test@Pass99', '0967890123', 'robert.miller@gmail.com', 'RobertMiller', 1, '1989-12-30', '147 Birch Blvd, District 7, HCMC'),
('user008', 'Strong#Pass', '0978901234', 'lisa.anderson@yahoo.com', 'LisaAnderson', 0, '1994-06-18', '258 Spruce St, District 8, HCMC'),
('user009', 'MySecret123', '0989012345', 'james.taylor@outlook.com', 'JamesTaylor', 1, '1987-09-05', '369 Willow Way, District 9, HCMC'),
('user010', 'Pass@Word10', '0990123456', 'amanda.white@gmail.com', 'AmandaWhite', 0, '1996-04-22', '741 Ash Court, District 10, HCMC');
GO

INSERT INTO Seller (LoginName, ShopName, CitizenIDCard, SellerName, MoneyEarned)
VALUES 
('user001', 'JohnTech Store', '001234567890', 'John Doe Shop', 0),
('user003', 'Wilson Electronics', '003456789012', 'Mike Wilson Shop', 0);
GO

INSERT INTO Buyer (LoginName)
SELECT LoginName FROM UserInfo
WHERE LoginName NOT IN ('user001', 'user003');

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
('user003', 'Logitech MX Master 3S', 'Logitech', 'Accessories', 'Wireless ergonomic mouse for productivity', 'China');
GO

SELECT * FROM ProductInfo;

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
(10, 'Standard-Gray', 0, 2490000, 70, 141);
GO

INSERT INTO Cart (LoginName)
SELECT LoginName FROM Buyer;
GO

-- Insert items into StoredSKU (assuming CartID starts from 1)
INSERT INTO StoredSKU (CartID, ProductID, SKUName, Quantity)
VALUES 
-- Cart 1 (user002 - JaneSmith)
(1, 1, '128GB-Black', 1),        -- iPhone 15 Pro
(1, 3, 'Standard-White', 1),     -- AirPods Pro 2
(1, 5, '41mm-GPS-Midnight', 1),  -- Apple Watch

-- Cart 2 (user004 - SarahJohnson)
(2, 6, '256GB-Titanium-Gray', 1), -- Samsung S24 Ultra
(2, 7, 'Standard-Black', 1),      -- Sony Headphones
(2, 10, 'Standard-Black', 1),     -- Logitech Mouse

-- Cart 3 (user005 - DavidBrown)
(3, 2, '8GB-256GB-Silver', 1),    -- MacBook Air M2
(3, 4, '64GB-Purple', 1),         -- iPad Air

-- Cart 4 (user006 - EmilyDavis)
(4, 1, '256GB-Blue', 2),          -- iPhone 15 Pro (2 units)
(4, 3, 'Standard-White', 2),      -- AirPods Pro 2 (2 units)

-- Cart 5 (user007 - RobertMiller)
(5, 8, 'i7-16GB-512GB', 1),       -- Dell XPS 15
(5, 7, 'Standard-Silver', 1),     -- Sony Headphones

-- Cart 6 (user008 - LisaAnderson)
(6, 9, '128GB-Beige', 1),         -- Samsung Tab S9
(6, 10, 'Standard-Gray', 2),      -- Logitech Mouse (2 units)
(6, 6, '512GB-Titanium-Black', 1); -- Samsung S24 Ultra
GO

INSERT INTO DeliveryMethod (MethodName) VALUES ('Standard'), ('Express'), ('Economy');
INSERT INTO DeliveryProvider (ProviderName) VALUES ('VNPost'), ('GrabExpress'), ('Giao Hang Nhanh');
INSERT INTO ProvideDelivery (ProviderName, MethodName) VALUES 
('VNPost', 'Standard'), ('GrabExpress', 'Express'), ('Giao Hang Nhanh', 'Economy');
GO

CREATE PROCEDURE createOrderFromCart 
    @LoginName VARCHAR(100),
    @AddressID INT,
    @ProviderName VARCHAR(100) = 'VCB',
    @AccountID VARCHAR(30) = NULL,
    @DeliveryMethodName VARCHAR(100),
    @DeliveryProviderName VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Variables
        DECLARE @OrderID INT;
        DECLARE @CartID INT;
        DECLARE @TotalCartCost INT;
        
        -- Get CartID and check if cart has items
        SELECT @CartID = CartID, @TotalCartCost = TotalCost
        FROM Cart
        WHERE LoginName = @LoginName;
        
        IF @CartID IS NULL
        BEGIN
            RAISERROR('Cart does not exist for this user', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Create main order
        INSERT INTO OrderInfo (LoginName, AddressID, ProviderName, AccountID, TotalPrice)
        VALUES (@LoginName, @AddressID, @ProviderName, @AccountID, 0);
        
        SET @OrderID = SCOPE_IDENTITY();
        
        -- Group cart items by seller to create sub-orders
        DECLARE @SellerLoginName VARCHAR(100);
        DECLARE @SubOrderID INT;
        DECLARE @SubOrderTotal INT;
        DECLARE @DeliveryPrice INT = 30000; -- Default delivery price
        
        -- Cursor to iterate through each seller
        DECLARE seller_cursor CURSOR FOR
        SELECT DISTINCT P.LoginName
        FROM StoredSKU S
        JOIN ProductInfo P ON S.ProductID = P.ProductID
        WHERE S.CartID = @CartID;
        
        OPEN seller_cursor;
        FETCH NEXT FROM seller_cursor INTO @SellerLoginName;
        
        WHILE @@FETCH_STATUS = 0
        BEGIN
            -- Calculate sub-order total for this seller
            SELECT @SubOrderTotal = SUM(S.Quantity * SK.Price)
            FROM StoredSKU S
            JOIN SKU SK ON S.ProductID = SK.ProductID AND S.SKUName = SK.SKUName
            JOIN ProductInfo P ON S.ProductID = P.ProductID
            WHERE S.CartID = @CartID AND P.LoginName = @SellerLoginName;
            
            -- Create sub-order
            INSERT INTO SubOrderInfo (
                OrderID, 
                TotalSKUPrice, 
                ActualDate, 
                ExpectedDate, 
                DeliveryMethodName, 
                DeliveryProviderName,
                DeliveryPrice
            )
            VALUES (
                @OrderID,
                @SubOrderTotal,
                GETDATE(),
                DATEADD(DAY, 7, GETDATE()), -- Expected delivery in 7 days
                @DeliveryMethodName,
                @DeliveryProviderName,
                @DeliveryPrice
            );
            
            SET @SubOrderID = SCOPE_IDENTITY();
            
            -- Move cart items to sub-order details
            INSERT INTO SubOrderDetail (OrderID, SubOrderID, ProductID, SKUName, Quantity)
            SELECT 
                @OrderID,
                @SubOrderID,
                S.ProductID,
                S.SKUName,
                S.Quantity
            FROM StoredSKU S
            JOIN ProductInfo P ON S.ProductID = P.ProductID
            WHERE S.CartID = @CartID AND P.LoginName = @SellerLoginName;
            
            -- Update SKU stock
            UPDATE SKU
            SET InStockNumber = InStockNumber - S.Quantity
            FROM SKU
            JOIN StoredSKU S ON SKU.ProductID = S.ProductID AND SKU.SKUName = S.SKUName
            JOIN ProductInfo P ON S.ProductID = P.ProductID
            WHERE S.CartID = @CartID AND P.LoginName = @SellerLoginName;
            
            FETCH NEXT FROM seller_cursor INTO @SellerLoginName;
        END
        
        CLOSE seller_cursor;
        DEALLOCATE seller_cursor;
        
        -- Update order total price
        UPDATE OrderInfo
        SET TotalPrice = (
            SELECT SUM(TotalSKUPrice + DeliveryPrice)
            FROM SubOrderInfo
            WHERE OrderID = @OrderID
        )
        WHERE OrderID = @OrderID;
        
        -- Clear the cart
        DELETE FROM StoredSKU WHERE CartID = @CartID;
        
        -- Update buyer's money spent
        UPDATE Buyer
        SET MoneySpent = MoneySpent + (SELECT TotalPrice FROM OrderInfo WHERE OrderID = @OrderID)
        WHERE LoginName = @LoginName;
        
        -- Update seller's money earned
        UPDATE Seller
        SET MoneyEarned = MoneyEarned + (
            SELECT SUM(SOI.TotalSKUPrice)
            FROM SubOrderInfo SOI
            JOIN SubOrderDetail SOD ON SOI.OrderID = SOD.OrderID AND SOI.SubOrderID = SOD.SubOrderID
            JOIN ProductInfo P ON SOD.ProductID = P.ProductID
            WHERE SOI.OrderID = @OrderID AND P.LoginName = Seller.LoginName
        )
        WHERE LoginName IN (
            SELECT DISTINCT P.LoginName
            FROM SubOrderDetail SOD
            JOIN ProductInfo P ON SOD.ProductID = P.ProductID
            WHERE SOD.OrderID = @OrderID
        );
        
        COMMIT TRANSACTION;
        
        -- Return success with order ID
        SELECT 
            @OrderID AS OrderID, 
            'Order created successfully' AS Message,
            (SELECT TotalPrice FROM OrderInfo WHERE OrderID = @OrderID) AS TotalPrice;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

INSERT INTO AddressInfo (LoginName, ContactName, ContactPhoneNumber, City, District, Commune, DetailAddress, AddressType, IsAddressDefault)
VALUES 
-- user001 (JohnDoe)
('user001', 'John Doe', '0901234567', 'Ho Chi Minh City', 'District 1', 'Ward 1', '123 Main St', 'Home', 1),
('user001', 'John Doe', '0901234567', 'Ho Chi Minh City', 'District 3', 'Ward 5', '456 Business Ave', 'Office', 0),

-- user002 (JaneSmith)
('user002', 'Jane Smith', '0912345678', 'Ho Chi Minh City', 'District 2', 'Ward 2', '456 Oak Ave', 'Home', 1),
('user002', 'Jane Smith', '0912345678', 'Ho Chi Minh City', 'District 1', 'Ward 3', '789 Office Blvd', 'Office', 0),

-- user003 (MikeWilson)
('user003', 'Mike Wilson', '0923456789', 'Ho Chi Minh City', 'District 3', 'Ward 4', '789 Pine Rd', 'Home', 1),

-- user004 (SarahJohnson)
('user004', 'Sarah Johnson', '0934567890', 'Ho Chi Minh City', 'District 4', 'Ward 5', '321 Elm St', 'Home', 1),
('user004', 'Sarah Johnson', '0934567890', 'Ho Chi Minh City', 'District 7', 'Ward 8', '111 Work Plaza', 'Office', 0),

-- user005 (DavidBrown)
('user005', 'David Brown', '0945678901', 'Ho Chi Minh City', 'District 5', 'Ward 6', '654 Maple Dr', 'Home', 1),

-- user006 (EmilyDavis)
('user006', 'Emily Davis', '0956789012', 'Ho Chi Minh City', 'District 6', 'Ward 7', '987 Cedar Ln', 'Home', 1),
('user006', 'Emily Davis', '0956789012', 'Ho Chi Minh City', 'District 2', 'Ward 4', '222 Corporate St', 'Office', 0),

-- user007 (RobertMiller)
('user007', 'Robert Miller', '0967890123', 'Ho Chi Minh City', 'District 7', 'Ward 9', '147 Birch Blvd', 'Home', 1),

-- user008 (LisaAnderson)
('user008', 'Lisa Anderson', '0978901234', 'Ho Chi Minh City', 'District 8', 'Ward 10', '258 Spruce St', 'Home', 1),
('user008', 'Lisa Anderson', '0978901234', 'Ho Chi Minh City', 'District 5', 'Ward 6', '333 Business Park', 'Office', 0),

-- user009 (JamesTaylor)
('user009', 'James Taylor', '0989012345', 'Ho Chi Minh City', 'District 9', 'Ward 11', '369 Willow Way', 'Home', 1),

-- user010 (AmandaWhite)
('user010', 'Amanda White', '0990123456', 'Ho Chi Minh City', 'District 10', 'Ward 12', '741 Ash Court', 'Home', 1),
('user010', 'Amanda White', '0990123456', 'Ho Chi Minh City', 'District 1', 'Ward 2', '444 Tech Tower', 'Office', 0);
GO

EXEC createOrderFromCart 
    @LoginName = 'user002',
    @AddressID = 3,
    @ProviderName = 'VCB',
    @AccountID = '1234567890',
    @DeliveryMethodName = 'Standard',
    @DeliveryProviderName = 'VNPost';
GO

SELECT * FROM OrderInfo;
SELECT * FROM SubOrderInfo;