USE Ecommerce;
GO

-- ======================================================
-- Trigger: trg_UpdateCartTotal
-- Logic: Recalculates the total cost whenever the StoredSKU table changes
-- ======================================================
CREATE OR ALTER TRIGGER trg_UpdateCartTotal ON StoredSKU
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    UPDATE Cart
    SET TotalCost = dbo.func_CalculateCartTotal(CartID)
    WHERE CartID IN (
        SELECT CartID FROM INSERTED
        UNION
        SELECT CartID FROM DELETED);
END;
GO

-- ======================================================
-- Trigger: trg_AfterInsertSubOrderDetails
-- Update: InStockNumber
-- Update: Buyer.MoneySpent
-- Update: Seller.MoneyEarned
-- Delete: StoredSKU
-- Set Cart.TotalCost = 0
-- ======================================================
CREATE TRIGGER trg_AfterInsertSubOrderDetails ON SubOrderDetail
AFTER INSERT
AS
BEGIN
    -- 1. Declare variables to hold the inserted data
    DECLARE @OrderID INT;
    DECLARE @ProductID INT;
    DECLARE @SubOrderID INT;
    DECLARE @SKUName VARCHAR(100);
    DECLARE @Quantity INT;

    SELECT 
        @OrderID = OrderID, 
        @SubOrderID = SubOrderID,
        @ProductID = ProductID, 
        @SKUName = SKUName, 
        @Quantity = Quantity 
    FROM INSERTED;

    -- 2. UPDATE Buyer's MoneySpent 
    DECLARE @BuyerLogin VARCHAR(100);
    SELECT @BuyerLogin = LoginName FROM OrderInfo WHERE OrderID = @OrderID;

    DECLARE @CalculatedAmount BIGINT;
    SET @CalculatedAmount = dbo.func_CalculateSubOrderCost(@SubOrderID);

    EXEC prc_UpdateMoney @UserRole = 'Buyer', @LoginName = @BuyerLogin, @Amount = @CalculatedAmount;

    -- 3. UPDATE Seller's MoneyEarned
    DECLARE @SellerLogin VARCHAR(100);
    DECLARE @TotalSKUPrice BIGINT;

    SELECT @SellerLogin = LoginName FROM ProductInfo WHERE ProductID = @ProductID;
    SELECT @TotalSKUPrice = TotalSKUPrice FROM SubOrderInfo WHERE OrderID = @OrderID and SubOrderID = @SubOrderID;

    EXEC prc_UpdateMoney @UserRole = 'Seller', @LoginName = @SellerLogin, @Amount = @TotalSKUPrice;

    -- 4. UPDATE InStockNumber
    EXEC prc_UpdateInStockNumber @ProductID = @ProductID, @SKUName = @SKUName, @Quantity = @Quantity;

    --5. DELETE StoredSKU
    -- EXEC prc_DeleteStoredSKU @LoginName = @BuyerLogin;
END;
GO
