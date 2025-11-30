USE Ecommerce;
GO


-- ======================================================
-- Function 1: Caclulate TotalCost of Cart based on Quantity of StoredSKU and Price in SKU
-- ======================================================
CREATE OR ALTER FUNCTION func_CalculateCartTotal(@CartID INT)
RETURNS BIGINT
AS
BEGIN
    DECLARE @TotalCost BIGINT

    -- Validation of input paramater @CartID
    IF @CartID IS NULL
        RETURN 0

    IF NOT EXISTS (SELECT 1 FROM Cart WHERE CartID = @CartID)
        RETURN 0;

    SELECT @TotalCost = SUM(StoredSKU.Quantity * SKU.Price)
    FROM StoredSKU 
    JOIN SKU ON StoredSKU.ProductID = SKU.ProductID AND StoredSKU.SKUName = SKU.SKUName
    WHERE StoredSKU.CartID = @CartID

    RETURN ISNULL(@TotalCost, 0)
END;
GO

-- ======================================================
-- Function 2: Calculate TotalCost in SubOrder based on Total_SKU_Price + Delivery Price + Applied Voucher discount
-- ======================================================
CREATE OR ALTER FUNCTION func_CalculateSubOrderCost(@SubOrderID VARCHAR(100))
RETURNS BIGINT
AS
BEGIN
    -- validation of input parameter @SubOrderID
    IF @SubOrderID IS NULL
        RETURN 0;

    IF NOT EXISTS (SELECT 1 FROM SubOrderInfo WHERE SubOrderID = @SubOrderID)
        RETURN 0;
    -- Variable
    DECLARE @TotalSKUPrice BIGINT;
    DECLARE @DeliveryPrice BIGINT;
    DECLARE @Discount BIGINT = 0;
    DECLARE @FinalCost BIGINT;

    -- 1. Get SubOrder details
    SELECT @TotalSKUPrice = TotalSKUPrice, 
           @DeliveryPrice = DeliveryPrice
    FROM SubOrderInfo
    WHERE SubOrderID = @SubOrderID;

    -- 2. Check for Applied Voucher
    DECLARE @VoucherCode VARCHAR(10);
    SELECT @VoucherCode = VoucherCode 
    FROM AppliedVoucher 
    WHERE SubOrderID = @SubOrderID;


    IF @VoucherCode IS NOT NULL
    BEGIN
        -- A. Handle Flat Discount
        IF EXISTS (SELECT 1 FROM FlatDiscountVoucher WHERE Code = @VoucherCode)
        BEGIN
            SELECT @Discount = DiscountAmount 
            FROM FlatDiscountVoucher 
            WHERE Code = @VoucherCode;
        END
        -- B. Handle Percentage Discount
        ELSE IF EXISTS (SELECT 1 FROM PercentageVoucher WHERE Code = @VoucherCode)
        BEGIN
            DECLARE @Percent DECIMAL(10,2);

            SELECT @Percent = PercentageDiscount
            FROM PercentageVoucher 
            WHERE Code = @VoucherCode;

            -- Calculate percentage based on SKU Price (Delivery is usually excluded from discount)
            SET @Discount = CAST(@TotalSKUPrice * (@Percent / 100.0) AS BIGINT);
        END
    END

    -- 3. Calculate Final Cost
    SET @FinalCost = (@TotalSKUPrice + @DeliveryPrice) - @Discount;

    -- Ensure cost is not negative
    IF @FinalCost < 0 SET @FinalCost = 0;

    RETURN @FinalCost

END;
GO

-- ======================================================
-- Procedure 0: Alter Quantity in StoredSKU
-- ======================================================
CREATE OR ALTER PROCEDURE prc_UpdateQuantityStoredSKU
    @Quantity INT,
    @CartID INT,
    @ProductID INT,
    @SKUName VARCHAR(100)
AS
BEGIN
    -- 1. Check for NULL parameters
    IF @CartID IS NULL OR @ProductID IS NULL OR @SKUName IS NULL
    BEGIN
        PRINT 'Error: CartID, ProductID, and SKUName cannot be NULL.';
        RETURN;
    END

    -- 2. Check if Cart exists
    IF NOT EXISTS (SELECT 1 FROM Cart WHERE CartID = @CartID)
    BEGIN
        PRINT 'Error: CartID not found.';
        RETURN;
    END

    -- 3. Check if SKU exists (Product + Variant)
    IF NOT EXISTS (SELECT 1 FROM SKU WHERE ProductID = @ProductID AND SKUName = @SKUName)
    BEGIN
        PRINT 'Error: SKU (Product + Variant) not found.';
        RETURN;
    END

    -- 4. Check if the item is actually in the cart before trying to update
    IF NOT EXISTS (SELECT 1 FROM StoredSKU WHERE CartID = @CartID AND ProductID = @ProductID AND SKUName = @SKUName)
    BEGIN
        PRINT 'Error: Item not found in the specified Cart.';
        RETURN;
    END

    -- If Quantity <= 0, remove item. Otherwise, update it
    IF @Quantity <= 0 
    BEGIN
        DELETE FROM StoredSKU
        WHERE CartID = @CartID AND ProductID = @ProductID AND SKUName = @SKUName;
    END
    ELSE BEGIN
        UPDATE StoredSKU
        SET Quantity = @Quantity
        WHERE CartID = @CartID AND ProductID = @ProductID
    END
END;
GO

-- ======================================================
-- Procedure 1: Move data from Cart table into Order table, 
-- Parameters are AccountID, ProviderName, AddressID; Time and Date are depends on the real time buyers make orders
-- ======================================================
CREATE PROCEDURE prc_CreateOrderFromStoredSKU
    @LoginName VARCHAR(100),
    @AccountID VARCHAR(30),
    @BankProviderName VARCHAR(10),
    @DeliveryMethodName VARCHAR(100),
    @DeliveryProviderName VARCHAR(100),
    @AddressID INT
AS
BEGIN
    -- Step 1: Validate Input Parameters
    IF @LoginName IS NULL OR @AccountID IS NULL OR @BankProviderName IS NULL OR 
       @DeliveryMethodName IS NULL OR @DeliveryProviderName IS NULL
    BEGIN
        PRINT 'Error: All parameters (LoginName, AccountID, Bank, DeliveryMethod, DeliveryProvider) are required.';
        RETURN;
    END

    -- Check if Buyer exists
    IF NOT EXISTS (SELECT 1 FROM Buyer WHERE LoginName = @LoginName)
    BEGIN
        PRINT 'Error: Buyer ' + @LoginName + ' does not exist.';
        RETURN;
    END

    -- Check if Delivery Method exists
    IF NOT EXISTS (SELECT 1 FROM DeliveryMethod WHERE MethodName = @DeliveryMethodName)
    BEGIN
        PRINT 'Error: Delivery Method "' + @DeliveryMethodName + '" is invalid.';
        RETURN;
    END

    -- Check if Delivery Provider exists
    IF NOT EXISTS (SELECT 1 FROM DeliveryProvider WHERE ProviderName = @DeliveryProviderName)
    BEGIN
        PRINT 'Error: Delivery Provider "' + @DeliveryProviderName + '" is invalid.';
        RETURN;
    END

    BEGIN TRANSACTION
    BEGIN TRY
        -- Variables to store data we need to fetch
        DECLARE @CartID INT;
        DECLARE @CartTotalCost INT;
        DECLARE @DeliveryPrice INT = 30000;
        DECLARE @NewOrderID INT;
        DECLARE @NewSubOrderID INT;

        -- 1. Get Cart ID and Total Cost from the Cart table
        SELECT @CartID = CartID, @CartTotalCost = TotalCost
        FROM Cart 
        WHERE LoginName = @LoginName;

        -- Safety Check: Stop if  buyer doesn't add SKU to their cart
        IF @CartTotalCost = 0
        BEGIN
            PRINT 'Error: ' + @LoginName + ' doesnt buy anything.';
            ROLLBACK TRANSACTION
            RETURN;
        END

        -- 3. Create the Main Order (OrderInfo)
        INSERT INTO OrderInfo (LoginName, AddressID, BankProviderName, AccountID, TotalPrice)
        VALUES (@LoginName, @AddressID, @BankProviderName, @AccountID, @CartTotalCost);

        SET @NewOrderID = SCOPE_IDENTITY();

        -- 4. Create the SubOrderInfo
        INSERT INTO SubOrderInfo (
            OrderID, 
            TotalSKUPrice, 
            DeliveryPrice, 
            ActualDate, 
            ExpectedDate, 
            DeliveryMethodName, 
            DeliveryProviderName, 
            ShippingStatus
        )
        VALUES (
            @NewOrderID, 
            @CartTotalCost, 
            @DeliveryPrice, 
            GETDATE(), 
            DATEADD(DAY, 3, GETDATE()), 
            @DeliveryMethodName, 
            @DeliveryProviderName, 
            'Preparing'
        );

        SET @NewSubOrderID = SCOPE_IDENTITY();

        -- 5. MISSING STEP: Move items to SubOrderDetail
        INSERT INTO SubOrderDetail (OrderID, SubOrderID, ProductID, SKUName, Quantity)
        SELECT @NewOrderID, @NewSubOrderID, ProductID, SKUName, Quantity
        FROM StoredSKU
        WHERE CartID = @CartID;

        -- Commit the transaction if everything succeeded
        COMMIT TRANSACTION;
        PRINT 'Order created successfully.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        PRINT 'Error occurred: ' + @ErrorMessage;
    END CATCH
END;
GO

-- ======================================================
-- Procedure 2: Update Buyer's Money Spent OR Seller's Money Earned
-- ======================================================
CREATE PROCEDURE prc_UpdateMoney
    @UserRole VARCHAR(10), -- Buyer OR Seller
    @LoginName VARCHAR(100),
    @Amount BIGINT
AS
BEGIN
    IF @UserRole = 'Buyer'
    BEGIN
        UPDATE Buyer
        SET MoneySpent = MoneySpent + @Amount
        WHERE LoginName = @LoginName;
    END
    ELSE IF @UserRole = 'Seller'
    BEGIN
        UPDATE Seller
        SET MoneyEarned = MoneyEarned + @Amount
        WHERE LoginName = @LoginName;
    END
    ELSE
    BEGIN
        PRINT 'Error: Invalid UserRole. Must be "Buyer" or "Seller".';
    END
END;
GO

-- ======================================================
-- Procedure 3: Update InStockNumber (Decrease Stock)
-- ======================================================
CREATE PROCEDURE prc_UpdateInStockNumber
    @ProductID INT,
    @SKUName VARCHAR(100),
    @Quantity INT
AS
BEGIN
    IF EXISTS (SELECT 1 FROM SKU WHERE ProductID = @ProductID AND SKUName = @SKUName AND InStockNumber < @Quantity)
    BEGIN
        RAISERROR('Insufficient stock for ProductID: %d, SKU: %s', 16, 1, @ProductID, @SKUName);
        RETURN;
    END

    UPDATE SKU
    SET InStockNumber = InStockNumber - @Quantity
    WHERE ProductID = @ProductID and SKUName = @SKUName;
END;
GO

-- ======================================================
-- Procedure 4: DELETE data from StoredSKU 
-- ======================================================
CREATE PROCEDURE prc_DeleteStoredSKU
    @LoginName VARCHAR(100)
AS
BEGIN
    DECLARE @CartID INT;

    -- 1. Get the CartID for this buyer
    SELECT @CartID = CartID 
    FROM Cart 
    WHERE LoginName = @LoginName;

    -- 2. Delete the specific item from StoredSKU
    IF @CartID IS NOT NULL
    BEGIN
        DELETE FROM StoredSKU
        WHERE CartID = @CartID;
    END
END;
GO








