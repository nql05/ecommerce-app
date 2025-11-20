USE master;
GO

CREATE DATABASE Ecommerce;
GO

Use Ecommerce;
GO

-- 1. Create table

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
		SELECT SUM(StoredSKU.Quantity * SKU.Price)
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



-- 2.2 Trigger that enforce business rules that are meaningful. for example, constraints ...
-- 3. Create Function / Procedure