# E-commerce Backend

Express.js API server for the e-commerce website.

## Usage

- Install dependencies: `npm install`
- Start server: `npm start`

## How to build database for the project running on Docker

- **Install Docker** if you don't have it already: `https://docs.docker.com/get-docker/`.
- **Install the SQL Server image**
```bash
docker pull mcr.microsoft.com/mssql/server:2019-latest
```
- **Run the SQL Server container**
```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong@Passw0rd" \
-p 1433:1433 --name sqlserver \
-d mcr.microsoft.com/mssql/server:2019-latest
```
- Explain of the variable in the above command:
  - `ACCEPT_EULA`: You must accept the end user license agreement.
  - `SA_PASSWORD`: Set the password for the system administrator (SA) account. Make sure it meets SQL Server's password complexity requirements.
  - `-p 1433:1433`: Maps port 1433 of the container to port 1433 on the host machine.
  - `--name sqlserver`: Names the container "sqlserver".
  - `-d`: Runs the container in detached mode (in the background).
- **Connect to the SQL Server instance** using a SQL client like Azure Data Studio or SQL Server Management Studio with the following details:
  - **Server**: localhost,1433
  - **Authentication**: SQL Login
  - **Login**: sa
  - **Password**: YourStrong@Passw0rd
- **Create a new database** named `Test` by running the SQL command in the `/db/test.sql`. This script also add some initial data to the database.

## How to pull the database to your Prisma schema

- **Run you database** in Docker or something else, retrieve the URL.
- **Copy the `.env` file** and then add the URL to the variable `DATABASE_URL` in the following format:

```env
sqlserver://localhost:1433;database=Test;user=sa;password=YourStrong@Passw0rd;encrypt=true;trustServerCertificate=true
```

- **Run the command in the backend folder** `npx prisma db pull`. After this step, your schema has the `models` from the database tables.
  - If you have already has the models in `prisma/schema.prisma`, you may need to delete them first before running the command or use with option `--force` to overwrite.
  - If you want the database to match your Prisma schema, you can use the command `npx prisma db push` instead to force the DB to match the schema.
    - For a safer approach, use `npx prisma migrate dev` to create a migration file (`.sql`) and apply the changes to the database by running those SQL queries.
- Now, **Create Prisma Client** to be able to use the database: `npx prisma generate`. Make sure your database has no duplicate name for tables / columns, or else error will occurs.
