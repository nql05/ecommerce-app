SELECT SYSTEM_USER;

USE Ecommerce;
GO

SELECT * FROM Cart;

SELECT * FROM StoredSKU;

SELECT * FROM OrderInfo;

SELECT * FROM SubOrderInfo;

-- Use Procedure 0 for + - quantity button
EXEC prc_UpdateQuantityStoredSKU 
    @Quantity = 5, 
    @CartID = 1, 
    @ProductID = 1, 
    @SKUName = '128GB-Black';

-- Use Procedure 1 when Buyer click "Check Out" and select some information
EXEC prc_CreateOrderFromStoredSKU
    @LoginName = 'user002',
    @AccountID = '123456789012',
    @BankProviderName = 'VCB',
    @DeliveryMethodName = 'Standard',
    @DeliveryProviderName = 'VNPost';