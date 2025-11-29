USE master;
GO

-- Drop and recreate the 'MyDatabase' database
IF EXISTS (SELECT 1 FROM sys.databases WHERE name = 'Ecommerce')
BEGIN
    ALTER DATABASE Ecommerce SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE Ecommerce;
END;
GO

-- Create the 'Ecommerce' database
CREATE DATABASE Ecommerce;
GO

USE Ecommerce;
GO

-- ======================================================
-- Table: UserInfo
-- ======================================================
CREATE TABLE UserInfo ( 
	LoginName VARCHAR(100),
	Password VARCHAR(255) NOT NULL,
	PhoneNumber CHAR(10),
	Email VARCHAR(255),
	UserName VARCHAR(255) NOT NULL UNIQUE,
	Gender CHAR(1) CHECK (Gender IN ('M', 'F')), 
	BirthDate DATE, 
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
	),
	CONSTRAINT phonenumber_format CHECK (
		PhoneNumber IS NULL
		OR (DATALENGTH(PhoneNumber) = 10 AND PhoneNumber NOT LIKE '%[^0-9]%')
	)
);
GO


-- ======================================================
-- Table: Buyer
-- ======================================================
CREATE TABLE Buyer (
	LoginName VARCHAR(100) PRIMARY KEY,
	MoneySpent BIGINT NOT NULL DEFAULT 0 CHECK (MoneySpent >= 0),
	-- Constraint
	FOREIGN KEY (LoginName) REFERENCES UserInfo(LoginName) ON DELETE CASCADE ON UPDATE CASCADE 
);
GO


-- ======================================================
-- Table: Seller
-- ======================================================
CREATE TABLE Seller (
	LoginName VARCHAR(100) PRIMARY KEY,
	ShopName VARCHAR(100) NOT NULL UNIQUE,
	CitizenIDCard VARCHAR(30) NOT NULL UNIQUE CHECK (CitizenIDCard NOT LIKE '%[^0-9]%'),
	SellerName VARCHAR(50) NOT NULL UNIQUE,
	MoneyEarned BIGINT NOT NULL DEFAULT 0 CHECK (MoneyEarned >= 0),
	-- Constraint
	FOREIGN KEY (LoginName) REFERENCES UserInfo(LoginName) ON DELETE CASCADE ON UPDATE CASCADE
);
GO

-- ======================================================
-- Table: AddressInfo
-- ======================================================
CREATE TABLE AddressInfo (
	LoginName VARCHAR(100),
	AddressID INT IDENTITY(1,1),
	ContactName VARCHAR(255) NOT NULL,
	ContactPhoneNumber CHAR(10) NOT NULL CHECK(DATALENGTH(ContactPhoneNumber) = 10 AND ContactPhoneNumber NOT LIKE '[^0-9]%'), -- PhoneNumber contains 10 digits
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

-- ======================================================
-- Table: OrderInfo
-- ======================================================
CREATE TABLE OrderInfo (
	OrderID INT IDENTITY(1,1),
	LoginName VARCHAR(100) NOT NULL,
	OrderDate DATETIME2 NOT NULL DEFAULT GETDATE(),
	TotalPrice BIGINT NOT NULL DEFAULT 0 CHECK (TotalPrice >= 0), -- we need to create a trigger from sub order 
	-- Component of Payment Method
	BankProviderName VARCHAR(10) NOT NULL DEFAULT 'VCB' CHECK(BankProviderName IN ('VCB', 'OCB', 'MoMo', 'ZaloPay')),
	AccountID VARCHAR(30) CHECK (AccountID NOT LIKE '[^0-9]%'),
	AddressID INT NOT NULL,
	--Constraint
	PRIMARY KEY (OrderID),
	FOREIGN KEY (LoginName, AddressID) REFERENCES AddressInfo(LoginName, AddressID) ON DELETE CASCADE ON UPDATE CASCADE
);
GO

-- ======================================================
-- Table: SubOrderInfo
-- ======================================================
CREATE TABLE SubOrderInfo (
	OrderID INT,
	SubOrderID INT IDENTITY(1,1),
	TotalSKUPrice BIGINT NOT NULL DEFAULT 0,
	ShippingStatus VARCHAR(20) NOT NULL DEFAULT 'Preparing' CHECK (ShippingStatus IN ('Preparing', 'Shipping', 'Done', 'Cancelled')),
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

-- HARD CODE IN FRONT END
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

-- ======================================================
-- Table: Cart
-- ======================================================
CREATE TABLE Cart (
	CartID INT IDENTITY(1,1) PRIMARY KEY,
	LoginName VARCHAR(100) NOT NULL,
	TotalCost BIGINT NOT NULL DEFAULT 0,
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

-- ======================================================
-- Table: ProductInfo
-- ======================================================
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

-- ======================================================
-- Table: SKU
-- ======================================================
CREATE TABLE SKU (
	ProductID INT,
	SKUName VARCHAR(100),
	Size INT,
	Price INT NOT NULL,
	InStockNumber INT NOT NULL DEFAULT 0, -- available amount of product in the shop -> use trigger for this
	Weight INT,
	-- Constraints
	PRIMARY KEY (ProductID, SKUName),
	FOREIGN KEY (ProductID) REFERENCES ProductInfo(ProductID)
);
GO

-- ======================================================
-- Table: StoredSKU
-- ======================================================
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

-- ======================================================
-- Table: SubOrderDetail
-- ======================================================
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

-- ======================================================
-- Table: Comment
-- ======================================================
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

-- ======================================================
-- Table: Voucher
-- ======================================================
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