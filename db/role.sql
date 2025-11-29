-- 1. Create the Login at the Server level (Master)
USE [master];
GO
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'sManager')
BEGIN
    CREATE LOGIN [sManager] WITH PASSWORD = 'sManager123';
END
GO

-- 2. Create the User at the Database level
USE [Ecommerce];
GO
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'sManager')
BEGIN
    CREATE USER [sManager] FOR LOGIN [sManager]; -- Links to the server login
END
GO

-- 3. Create Role and Add Member
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'DB_Manager' AND type = 'R')
BEGIN
    CREATE ROLE [DB_Manager];
END
GO

GRANT CONTROL ON DATABASE::Ecommerce TO [DB_Manager];
ALTER ROLE [DB_Manager] ADD MEMBER [sManager];
GO

USE [master];
GO

ALTER LOGIN [sManager] WITH DEFAULT_DATABASE = [Ecommerce];
GO