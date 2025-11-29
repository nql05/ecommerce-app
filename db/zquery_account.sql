SELECT *
FROM UserInfo u
INNER JOIN Buyer b
    ON u.LoginName = b.LoginName;

-- SELECT * FROM UserInfo;