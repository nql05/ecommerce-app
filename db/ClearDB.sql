USE COMPANY;
GO

-- 1. Disable ALL Foreign Key constraints
-- This is essential to prevent conflicts during the data removal process.
EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL'
GO

-- 2. Clear Data: Use TRUNCATE (fast) for simple child tables.
-- Use DELETE FROM (slower, but handles complex dependencies) for parent tables.

-- Deepest Child Tables (TRUNCATE is fast)
TRUNCATE TABLE WORKS_ON;
TRUNCATE TABLE DEPENDENT;

-- Core Tables with complex dependencies (must use DELETE FROM)
-- ORDER: Employee must be cleared before Department or Project.
DELETE FROM EMPLOYEE; 
DELETE FROM PROJECT;

-- Child of DEPARTMENT (TRUNCATE is fast)
TRUNCATE TABLE DEPT_LOCATIONS;

-- Root Parent Table (must use DELETE FROM)
DELETE FROM DEPARTMENT;
GO

-- 3. Re-enable ALL Foreign Key constraints
EXEC sp_MSforeachtable 'ALTER TABLE ? CHECK CONSTRAINT ALL'
GO