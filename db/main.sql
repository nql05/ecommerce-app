SELECT SYSTEM_USER;

SELECT * FROM Cart WHERE CartID = 1;

SELECT * FROM StoredSKU WHERE CartID = 1;

-- Use Procedure 0 for + - quantity button
EXEC prc_UpdateQuantityStoredSKU 
    @Quantity = 5, 
    @CartID = 1, 
    @ProductID = 1, 
    @SKUName = '128GB-Black';

-- Use Procedure 1 when Buyer click "Check Out" and select some information
EXEC prc_CreateOrderFromStoredSKU
    @LoginName = 'user002',
    @AccountID = '1234567890222',
    @BankProviderName = 'VCB',
    @DeliveryMethodName = 'Standard',
    @DeliveryProviderName = 'VNPost',
    @AddressID = 3;

SELECT * FROM OrderInfo;

SELECT * FROM SubOrderInfo;

SELECT * FROM Buyer;

SELECT * FROM SubOrderDetail;

INSERT INTO StoredSKU (CartID, ProductID, SKUName, Quantity)
VALUES 
-- Cart 1 (user002 - JaneSmith)
(1, 1, '128GB-Black', 1),
(1, 3, 'Standard-White', 1),
(1, 10, 'Standard-Black', 1);

EXEC prc_CreateOrderFromStoredSKU
    @LoginName = 'user002',
    @AccountID = '123456789012',
    @BankProviderName = 'VCB',
    @DeliveryMethodName = 'Standard',
    @DeliveryProviderName = 'VNPost',
    @AddressID = 1;

