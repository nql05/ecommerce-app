-- =============================================
-- 1. DDL: DATA DEFINITION LANGUAGE (The Structure)
-- =============================================
USE master;
GO

CREATE DATABASE ShopDB;
GO

USE ShopDB;
GO

-- Table for storing items
CREATE TABLE Products (
    ProductID INT IDENTITY(1,1) PRIMARY KEY,
    ProductName NVARCHAR(100),
    Price DECIMAL(10,2),
    StockQuantity INT
);

-- Table for storing orders
CREATE TABLE Orders (
    OrderID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT FOREIGN KEY REFERENCES Products(ProductID),
    BuyerName NVARCHAR(100),
    OrderDate DATETIME DEFAULT GETDATE()
);

-- Insert dummy data
INSERT INTO Products (ProductName, Price, StockQuantity)
VALUES ('Gaming Laptop', 1200.00, 10), ('Wireless Mouse', 25.00, 50);
GO

-- =============================================
-- 2. DCL: DATA CONTROL LANGUAGE (The Security)
-- =============================================

-- A. Create Roles (The "Containers" for permissions)
CREATE ROLE [Role_Admin];
CREATE ROLE [Role_Buyer];
CREATE ROLE [Role_Seller];
GO

-- B. Assign Permissions to Roles

-- --- BUYER PERMISSIONS ---
-- Can see products
GRANT SELECT ON dbo.Products TO [Role_Buyer];
-- Can place orders
GRANT INSERT ON dbo.Orders TO [Role_Buyer];
-- Can see their own order history
GRANT SELECT ON dbo.Orders TO [Role_Buyer];
-- CRITICAL: Cannot change prices or stock
DENY UPDATE, DELETE, INSERT ON dbo.Products TO [Role_Buyer];

-- --- SELLER PERMISSIONS ---
-- Can see and manage products
GRANT SELECT, INSERT, UPDATE ON dbo.Products TO [Role_Seller];
-- Can see orders (to fulfill them)
GRANT SELECT ON dbo.Orders TO [Role_Seller];
-- CRITICAL: Sellers cannot delete order history (Audit trail protection)
DENY DELETE ON dbo.Orders TO [Role_Seller];

-- --- ADMIN PERMISSIONS ---
-- Full control over everything
GRANT CONTROL ON DATABASE::ShopDB TO [Role_Admin];
GO

-- =============================================
-- 3. CREATE LOGIN USERS (For testing)
-- =============================================
-- Note: In a real scenario, you might use Contained Users or AD Accounts.
-- These are standard SQL Logins.

-- Create Logins at Server Level
CREATE LOGIN [User_Admin] WITH PASSWORD = 'AdminPassword123!';
CREATE LOGIN [User_Buyer] WITH PASSWORD = 'BuyerPassword123!';
CREATE LOGIN [User_Seller] WITH PASSWORD = 'SellerPassword123!';

-- Create Users in Database Level
CREATE USER [User_Admin] FOR LOGIN [User_Admin];
CREATE USER [User_Buyer] FOR LOGIN [User_Buyer];
CREATE USER [User_Seller] FOR LOGIN [User_Seller];

-- Add Users to Roles
ALTER ROLE [Role_Admin] ADD MEMBER [User_Admin];
ALTER ROLE [Role_Buyer] ADD MEMBER [User_Buyer];
ALTER ROLE [Role_Seller] ADD MEMBER [User_Seller];
GO