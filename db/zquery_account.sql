SELECT *
FROM UserInfo u
INNER JOIN Seller b
    ON u.LoginName = b.LoginName;

-- SELECT * FROM UserInfo;