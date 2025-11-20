# E-commerce Backend

Express.js API server for the e-commerce website.

## Usage

- Install dependencies: `npm install`
- Start server: `npm start`

## How to pull the database

- **Run you database** in Docker or something else, retrieve the URL.
- **Copy the `.env` file** and then add the URL to the variable `DATABASE_URL` in the following format:

```env
sqlserver://localhost:1433;database=Ecommerce;user=sa;password=YourStrong@Passw0rd;encrypt=true;trustServerCertificate=true
```

- **Run the command in the backend folder** `npx prisma db pull`. After this step, your schema has the `models` from the database tables.
- Now, **Create Prisma Client** to be able to use the database: `npx prisma generate`. Make sure your database has no duplicate name for tables / columns, or else error will occurs.
