USE Ecommerce;
GO

-- ======================================================
-- Trigger: Update TotalCost of Cart after inserting a record into StoredSKU table\
-- handle multi-row insertes
-- ======================================================
CREATE TRIGGER trg_AfterInsertStoredSKU ON StoredSKU
AFTER INSERT
AS
BEGIN
    UPDATE Cart
    SET TotalCost = TotalCost + dbo.func_CalculateCartTotal(CartID)
    WHERE CartID IN (SELECT CartID FROM INSERTED);
END;
GO

-- ======================================================
-- Trigger: trg_AfterInsertOrder
-- Update: InStockNumber
-- Update: Buyer.MoneySpent
-- Update: Seller.MoneyEarned
-- ======================================================
CREATE TRIGGER trg_AfterInsertOrder ON OrderInfo
AFTER INSERT


AS
BEGIN

    -- Variable
    DECLARE @OrderID INT;
    DECLARE @LoginName VARCHAR(100);
    DECLARE @CartID INT;
    DECLARE @TotalPrice BIGINT;

    -- 1. Get the Order details from the newly inserted row
    SELECT @OrderID = OrderID, 
           @LoginName = LoginName, 
           @TotalPrice = TotalPrice 
    FROM INSERTED;

    -- 2. Update Buyer's MoneySpent

    -- 3. Update Seller's MoneyEarned

    -- 4. Update InStockNumber
    UPDATE SKU




END;
GO
