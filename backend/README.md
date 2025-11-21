# E-commerce Backend

Express.js API server for the e-commerce website.

## Table of content

- [E-commerce Backend](#e-commerce-backend)
  - [Table of content](#table-of-content)
  - [Usage](#usage)
  - [How to build database for the project running on Docker](#how-to-build-database-for-the-project-running-on-docker)
  - [How to pull the database to your Prisma schema](#how-to-pull-the-database-to-your-prisma-schema)
  - [Auth API Endpoints](#auth-api-endpoints)
    - [`POST /auth/login` - For logging into the page](#post-authlogin---for-logging-into-the-page)
    - [`POST /auth/logout` - For loggin out of the page](#post-authlogout---for-loggin-out-of-the-page)
  - [Seller API Endpoints](#seller-api-endpoints)
    - [`GET /seller/products` - Get seller's products](#get-sellerproducts---get-sellers-products)
    - [`GET /seller/products/:id` - Get product details](#get-sellerproductsid---get-product-details)
    - [`PUT /seller/products/:id` - Edit product details](#put-sellerproductsid---edit-product-details)
    - [`POST /seller/products/add` - Add a new product](#post-sellerproductsadd---add-a-new-product)
    - [`DELETE /seller/products/:id` - Delete a product](#delete-sellerproductsid---delete-a-product)
    - [`GET /seller/earnings` - View seller earnings](#get-sellerearnings---view-seller-earnings)
    - [Notes about comments and SKUs](#notes-about-comments-and-skus)
  - [Buyer API Endpoints](#buyer-api-endpoints)
    - [`GET /buyers/products` - Browse products (public)](#get-buyersproducts---browse-products-public)
    - [`GET /buyers/products/:id` - Product details (public)](#get-buyersproductsid---product-details-public)
    - [`POST /buyers/cart` - Add item to cart / Edit quantity if already existed](#post-buyerscart---add-item-to-cart--edit-quantity-if-already-existed)
    - [`GET /buyers/cart` - Get current cart](#get-buyerscart---get-current-cart)
    - [`DELETE /buyers/cart` - Remove an item from cart](#delete-buyerscart---remove-an-item-from-cart)
    - [`POST /buyers/order/create` - Create an order](#post-buyersordercreate---create-an-order)
    - [`GET /buyers/order/:id` - Get Order ID](#get-buyersorderid---get-order-id)
  - [Admin API Endpoints](#admin-api-endpoints)
    - [`GET /admin/sellers` - List all sellers](#get-adminsellers---list-all-sellers)
    - [`GET /admin/sellers/:loginName` - Read seller details](#get-adminsellersloginname---read-seller-details)
    - [`GET /admin/buyers` - List all buyers](#get-adminbuyers---list-all-buyers)
    - [`GET /admin/buyers/:loginName` - Read buyer details](#get-adminbuyersloginname---read-buyer-details)

## Usage

- Install dependencies: `npm install`
- Compile the typescript files: `npm run build`
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


## Auth API Endpoints

### `POST /auth/login` - For logging into the page

**Request:** A POST method to this endpoint, no need the `Bearer ...` (JWT), the body of the request contains:

- `loginName`: user login name
- `password`: user password
- `role`: User role, now there are just 3 available role:
  - `A`: Admin
  - `B`: Buyer
  - `S`: Seller
- An example request:

  ```json
  POST /auth/login
  {
    loginName: "user001",
    password: "Pass123!@#",
    role: "A",
  }
  ```

**Response:**

- **If valid credentials**, return the JWT, the client side can store this to local storage and later send back to server in every request header for authentication and authorization.

  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2dpbk5hbWUiOiJkZXB0cmFpIiwicm9sZSI6IkEiLCJpYXQiOjE3NjM3MTAwNzgsImV4cCI6MTc2MzcxMzY3OH0.vfASWJtJlQY5lsHX4PawVUEoNPCHX2MiBaZkh-qK_IM"
  }
  ```

- **If invalid:** return a `404 - Invalid credentials` error.
- **If incorrect role:** return `403 - Unauthorized role` error.
- **If internal server error:** return a `500 - {Error}`.

### `POST /auth/logout` - For loggin out of the page

**Request:** a `POST /auth/logout`, after that, user delete the token on the client side and server invalidate that token.

**Response:** a `200 - OK` HTTP response.

## Seller API Endpoints

Note: seller routes are mounted under the `/seller` prefix. Most seller actions require a valid JWT and role `S` (Seller) or `A` (Admin).

### `GET /seller/products` - Get seller's products

**Request:** `GET /seller/products` with a valid JWT (role `S` or `A`).
**Response:** A list of the seller's products (brief information). Example format:

```json
[
  {
    "ProductID": 1,
    "LoginName": "user001",
    "ProductName": "iPhone 15 Pro",
    "ProductBrand": "Apple",
    "ProductCategory": "Smartphone",
    "ProductDescription": "Latest iPhone with A17 Pro chip and titanium design",
    "ProductMadeIn": "USA",
    "SKU": [
      {
        "ProductID": 1,
        "SKUName": "128GB-Black",
        "Size": 128,
        "Price": 25990000,
        "InStockNumber": 49,
        "Weight": 187
      },
      {
        "ProductID": 1,
        "SKUName": "128GB-White",
        "Size": 128,
        "Price": 25990000,
        "InStockNumber": 45,
        "Weight": 187
      },
      {
        "ProductID": 1,
        "SKUName": "256GB-Black",
        "Size": 256,
        "Price": 28990000,
        "InStockNumber": 40,
        "Weight": 187
      },
      {
        "ProductID": 1,
        "SKUName": "256GB-Blue",
        "Size": 256,
        "Price": 28990000,
        "InStockNumber": 35,
        "Weight": 187
      }
    ]
  },
  {
    "ProductID": 2,
    "LoginName": "user001",
    "ProductName": "MacBook Air M2",
    "ProductBrand": "Apple",
    "ProductCategory": "Laptop",
    "ProductDescription": "13-inch laptop with M2 chip, 8GB RAM, 256GB SSD",
    "ProductMadeIn": "China",
    "SKU": [
      {
        "ProductID": 2,
        "SKUName": "16GB-512GB-Gold",
        "Size": 512,
        "Price": 37990000,
        "InStockNumber": 20,
        "Weight": 1240
      },
      {
        "ProductID": 2,
        "SKUName": "8GB-256GB-Silver",
        "Size": 256,
        "Price": 27990000,
        "InStockNumber": 30,
        "Weight": 1240
      },
      {
        "ProductID": 2,
        "SKUName": "8GB-512GB-Silver",
        "Size": 512,
        "Price": 32990000,
        "InStockNumber": 25,
        "Weight": 1240
      }
    ]
  },
  {
    "ProductID": 3,
    "LoginName": "user001",
    "ProductName": "AirPods Pro 2",
    "ProductBrand": "Apple",
    "ProductCategory": "Audio",
    "ProductDescription": "Wireless earbuds with active noise cancellation",
    "ProductMadeIn": "Vietnam",
    "SKU": [
      {
        "ProductID": 3,
        "SKUName": "Standard-White",
        "Size": 0,
        "Price": 6490000,
        "InStockNumber": 99,
        "Weight": 50
      }
    ]
  },
  {
    "ProductID": 4,
    "LoginName": "user001",
    "ProductName": "iPad Air 5th Gen",
    "ProductBrand": "Apple",
    "ProductCategory": "Tablet",
    "ProductDescription": "10.9-inch tablet with M1 chip",
    "ProductMadeIn": "China",
    "SKU": [
      {
        "ProductID": 4,
        "SKUName": "256GB-Purple",
        "Size": 256,
        "Price": 18990000,
        "InStockNumber": 30,
        "Weight": 461
      },
      {
        "ProductID": 4,
        "SKUName": "64GB-Purple",
        "Size": 64,
        "Price": 14990000,
        "InStockNumber": 40,
        "Weight": 461
      },
      {
        "ProductID": 4,
        "SKUName": "64GB-Starlight",
        "Size": 64,
        "Price": 14990000,
        "InStockNumber": 35,
        "Weight": 461
      }
    ]
  },
  {
    "ProductID": 5,
    "LoginName": "user001",
    "ProductName": "Apple Watch Series 9",
    "ProductBrand": "Apple",
    "ProductCategory": "Smartwatch",
    "ProductDescription": "Fitness and health tracking smartwatch",
    "ProductMadeIn": "China",
    "SKU": [
      {
        "ProductID": 5,
        "SKUName": "41mm-Cellular-Pink",
        "Size": 41,
        "Price": 13990000,
        "InStockNumber": 30,
        "Weight": 32
      },
      {
        "ProductID": 5,
        "SKUName": "41mm-GPS-Midnight",
        "Size": 41,
        "Price": 10990000,
        "InStockNumber": 49,
        "Weight": 32
      },
      {
        "ProductID": 5,
        "SKUName": "45mm-GPS-Starlight",
        "Size": 45,
        "Price": 12990000,
        "InStockNumber": 40,
        "Weight": 39
      }
    ]
  }
]
```

### `GET /seller/products/:id` - Get product details

**Request:** `GET /seller/products/:id` with a valid JWT (role `S` or `A`). `:id` is the product id.
**Response:** A dictionary of the product's details. Example:

```json
{
  "ProductID": 1,
  "LoginName": "user001",
  "ProductName": "iPhone 15 Pro",
  "ProductBrand": "Apple",
  "ProductCategory": "Smartphone",
  "ProductDescription": "Latest iPhone with A17 Pro chip and titanium design",
  "ProductMadeIn": "USA",
  "SKU": [
    {
      "ProductID": 1,
      "SKUName": "128GB-Black",
      "Size": 128,
      "Price": 25990000,
      "InStockNumber": 49,
      "Weight": 187,
      "Comment": []
    },
    {
      "ProductID": 1,
      "SKUName": "128GB-White",
      "Size": 128,
      "Price": 25990000,
      "InStockNumber": 45,
      "Weight": 187,
      "Comment": []
    },
    {
      "ProductID": 1,
      "SKUName": "256GB-Black",
      "Size": 256,
      "Price": 28990000,
      "InStockNumber": 40,
      "Weight": 187,
      "Comment": []
    },
    {
      "ProductID": 1,
      "SKUName": "256GB-Blue",
      "Size": 256,
      "Price": 28990000,
      "InStockNumber": 35,
      "Weight": 187,
      "Comment": []
    }
  ]
}
```

Each comment format is like this:

```json
{
  "CommentID": // Int
  "LoginName": // String
  "ProductID": // Int
  "SKUName": // String
  "Ratings": // Int
  "Content": // String
  "ParentCommentID": // String
  "Comment": [] // List of Comment answer to this comment.
  "CommentImage": // Recently do not use this
}
```

**Exception:**

- Return a `404 - Product not found` if no product for the given `:id`.
- Return a `400 - Invalid ProductID` if `:id` is not a number.

### `PUT /seller/products/:id` - Edit product details

**Request:** `PUT /seller/products/:id` with the body containing only fields to update (do not include `ProductID`). JWT required (role `S` or `A`). Example body:

```json
{
  "LoginName": "user001",
  "ProductName": "iPhone 16 Pro",
  "ProductBrand": "Apple",
  "ProductCategory": "Smartphone",
  "ProductDescription": "Latest iPhone with A17 Pro chip and titanium design",
  "ProductMadeIn": "USA"
}
```

Do not include `ProductID` in the body — IDs are immutable. Modifying SKUs is not supported in the current version.

**Response:** The modified product record (may omit nested SKUs and comments):

```json
{
  "ProductID": 1,
  "LoginName": "user001",
  "ProductName": "iPhone 16 Pro",
  "ProductBrand": "Apple",
  "ProductCategory": "Smartphone",
  "ProductDescription": "Latest iPhone with A17 Pro chip and titanium design",
  "ProductMadeIn": "USA"
}
```

**Exceptions:**

- `404 - {error message}` if the `:id` is not found.
- `400 - Invalid ProductID` if `:id` is not a number.
- `500 - {error message}` for internal errors.

### `POST /seller/products/add` - Add a new product

**Request:** `POST /seller/products/add` with JWT (role `S` or `A`) and new product data in the body. Remember do not provide ProductID, if you procvide, server will ignore it and create product with the rest information

```json
{
  "LoginName": "user001",
  "ProductName": "iPhone 20 Pro",
  "ProductBrand": "Apple",
  "ProductCategory": "Smartphone",
  "ProductDescription": "Latest iPhone with M4 Pro chip and titanium design",
  "ProductMadeIn": "USA"
}
```

**Response:** Newly created product record (format similar to product detail but without SKU and Comment):

```json
{
  "ProductID": 11,
  "LoginName": "user001",
  "ProductName": "iPhone 20 Pro",
  "ProductBrand": "Apple",
  "ProductCategory": "Smartphone",
  "ProductDescription": "Latest iPhone with M4 Pro chip and titanium design",
  "ProductMadeIn": "USA"
}
```

### `DELETE /seller/products/:id` - Delete a product

**Request:** `DELETE /seller/products/:id` with JWT (role `S` or `A`).
**Response:** `200 - OK` on success or `404` if not found.

### `GET /seller/earnings` - View seller earnings

**Request:** `GET /seller/earnings` with JWT (role `S` or `A`).
**Response:** Summary object or list describing earnings for the authenticated seller:

```json
{
  "earnings": 130410000
}
```

### Notes about comments and SKUs

- Comment structure is included in product details (see `Comment` example). Creating/replying to comments and mutating SKUs are TODOs and not supported yet.

## Buyer API Endpoints

Note: buyer routes are mounted under `/buyers`. Product browsing endpoints are public; cart and order endpoints require JWT with role `B` (Buyer).

### `GET /buyers/products` - Browse products (public)

**Request:** `GET /buyers/products` (no JWT required).
**Response:** List of products (brief information) similar to seller listing.

```json
[
  {
    "ProductID": 1,
    "LoginName": "user001",
    "ProductName": "iPhone 15 Pro",
    "ProductBrand": "Apple",
    "ProductCategory": "Smartphone",
    "ProductDescription": "Latest iPhone with A17 Pro chip and titanium design",
    "ProductMadeIn": "USA",
    "SKU": [
      {
        "ProductID": 1,
        "SKUName": "128GB-Black",
        "Size": 128,
        "Price": 25990000,
        "InStockNumber": 49,
        "Weight": 187,
        "Comment": []
      },
      {
        "ProductID": 1,
        "SKUName": "128GB-White",
        "Size": 128,
        "Price": 25990000,
        "InStockNumber": 45,
        "Weight": 187,
        "Comment": []
      },
      {
        "ProductID": 1,
        "SKUName": "256GB-Black",
        "Size": 256,
        "Price": 28990000,
        "InStockNumber": 40,
        "Weight": 187,
        "Comment": []
      },
      {
        "ProductID": 1,
        "SKUName": "256GB-Blue",
        "Size": 256,
        "Price": 28990000,
        "InStockNumber": 35,
        "Weight": 187,
        "Comment": []
      }
    ]
  },
  {
    "ProductID": 2,
    "LoginName": "user001",
    "ProductName": "MacBook Air M2",
    "ProductBrand": "Apple",
    "ProductCategory": "Laptop",
    "ProductDescription": "13-inch laptop with M2 chip, 8GB RAM, 256GB SSD",
    "ProductMadeIn": "China",
    "SKU": [
      {
        "ProductID": 2,
        "SKUName": "16GB-512GB-Gold",
        "Size": 512,
        "Price": 37990000,
        "InStockNumber": 20,
        "Weight": 1240,
        "Comment": []
      },
      {
        "ProductID": 2,
        "SKUName": "8GB-256GB-Silver",
        "Size": 256,
        "Price": 27990000,
        "InStockNumber": 30,
        "Weight": 1240,
        "Comment": []
      },
      {
        "ProductID": 2,
        "SKUName": "8GB-512GB-Silver",
        "Size": 512,
        "Price": 32990000,
        "InStockNumber": 25,
        "Weight": 1240,
        "Comment": []
      }
    ]
  },
  {
    "ProductID": 3,
    "LoginName": "user001",
    "ProductName": "AirPods Pro 2",
    "ProductBrand": "Apple",
    "ProductCategory": "Audio",
    "ProductDescription": "Wireless earbuds with active noise cancellation",
    "ProductMadeIn": "Vietnam",
    "SKU": [
      {
        "ProductID": 3,
        "SKUName": "Standard-White",
        "Size": 0,
        "Price": 6490000,
        "InStockNumber": 99,
        "Weight": 50,
        "Comment": []
      }
    ]
  },
  {
    "ProductID": 4,
    "LoginName": "user001",
    "ProductName": "iPad Air 5th Gen",
    "ProductBrand": "Apple",
    "ProductCategory": "Tablet",
    "ProductDescription": "10.9-inch tablet with M1 chip",
    "ProductMadeIn": "China",
    "SKU": [
      {
        "ProductID": 4,
        "SKUName": "256GB-Purple",
        "Size": 256,
        "Price": 18990000,
        "InStockNumber": 30,
        "Weight": 461,
        "Comment": []
      },
      {
        "ProductID": 4,
        "SKUName": "64GB-Purple",
        "Size": 64,
        "Price": 14990000,
        "InStockNumber": 40,
        "Weight": 461,
        "Comment": []
      },
      {
        "ProductID": 4,
        "SKUName": "64GB-Starlight",
        "Size": 64,
        "Price": 14990000,
        "InStockNumber": 35,
        "Weight": 461,
        "Comment": []
      }
    ]
  },
  {
    "ProductID": 5,
    "LoginName": "user001",
    "ProductName": "Apple Watch Series 9",
    "ProductBrand": "Apple",
    "ProductCategory": "Smartwatch",
    "ProductDescription": "Fitness and health tracking smartwatch",
    "ProductMadeIn": "China",
    "SKU": [
      {
        "ProductID": 5,
        "SKUName": "41mm-Cellular-Pink",
        "Size": 41,
        "Price": 13990000,
        "InStockNumber": 30,
        "Weight": 32,
        "Comment": []
      },
      {
        "ProductID": 5,
        "SKUName": "41mm-GPS-Midnight",
        "Size": 41,
        "Price": 10990000,
        "InStockNumber": 49,
        "Weight": 32,
        "Comment": []
      },
      {
        "ProductID": 5,
        "SKUName": "45mm-GPS-Starlight",
        "Size": 45,
        "Price": 12990000,
        "InStockNumber": 40,
        "Weight": 39,
        "Comment": []
      }
    ]
  },
  {
    "ProductID": 6,
    "LoginName": "user003",
    "ProductName": "Samsung Galaxy S24 Ultra",
    "ProductBrand": "Samsung",
    "ProductCategory": "Smartphone",
    "ProductDescription": "Flagship phone with S Pen and 200MP camera",
    "ProductMadeIn": "South Korea",
    "SKU": [
      {
        "ProductID": 6,
        "SKUName": "256GB-Titanium-Gray",
        "Size": 256,
        "Price": 30990000,
        "InStockNumber": 45,
        "Weight": 233,
        "Comment": []
      },
      {
        "ProductID": 6,
        "SKUName": "256GB-Titanium-Violet",
        "Size": 256,
        "Price": 30990000,
        "InStockNumber": 40,
        "Weight": 233,
        "Comment": []
      },
      {
        "ProductID": 6,
        "SKUName": "512GB-Titanium-Black",
        "Size": 512,
        "Price": 35990000,
        "InStockNumber": 35,
        "Weight": 233,
        "Comment": []
      }
    ]
  },
  {
    "ProductID": 7,
    "LoginName": "user003",
    "ProductName": "Sony WH-1000XM5",
    "ProductBrand": "Sony",
    "ProductCategory": "Audio",
    "ProductDescription": "Premium noise-cancelling headphones",
    "ProductMadeIn": "Malaysia",
    "SKU": [
      {
        "ProductID": 7,
        "SKUName": "Standard-Black",
        "Size": 0,
        "Price": 8990000,
        "InStockNumber": 60,
        "Weight": 250,
        "Comment": []
      },
      {
        "ProductID": 7,
        "SKUName": "Standard-Silver",
        "Size": 0,
        "Price": 8990000,
        "InStockNumber": 50,
        "Weight": 250,
        "Comment": []
      }
    ]
  },
  {
    "ProductID": 8,
    "LoginName": "user003",
    "ProductName": "Dell XPS 15",
    "ProductBrand": "Dell",
    "ProductCategory": "Laptop",
    "ProductDescription": "15.6-inch laptop with Intel i7, 16GB RAM, 512GB SSD",
    "ProductMadeIn": "China",
    "SKU": [
      {
        "ProductID": 8,
        "SKUName": "i7-16GB-512GB",
        "Size": 512,
        "Price": 45990000,
        "InStockNumber": 20,
        "Weight": 1800,
        "Comment": []
      },
      {
        "ProductID": 8,
        "SKUName": "i7-32GB-1TB",
        "Size": 1024,
        "Price": 55990000,
        "InStockNumber": 15,
        "Weight": 1800,
        "Comment": []
      }
    ]
  },
  {
    "ProductID": 9,
    "LoginName": "user003",
    "ProductName": "Samsung Galaxy Tab S9",
    "ProductBrand": "Samsung",
    "ProductCategory": "Tablet",
    "ProductDescription": "11-inch Android tablet with S Pen included",
    "ProductMadeIn": "Vietnam",
    "SKU": [
      {
        "ProductID": 9,
        "SKUName": "128GB-Beige",
        "Size": 128,
        "Price": 18990000,
        "InStockNumber": 35,
        "Weight": 498,
        "Comment": []
      },
      {
        "ProductID": 9,
        "SKUName": "256GB-Graphite",
        "Size": 256,
        "Price": 21990000,
        "InStockNumber": 30,
        "Weight": 498,
        "Comment": []
      }
    ]
  },
  {
    "ProductID": 10,
    "LoginName": "user003",
    "ProductName": "Logitech MX Master 3S",
    "ProductBrand": "Logitech",
    "ProductCategory": "Accessories",
    "ProductDescription": "Wireless ergonomic mouse for productivity",
    "ProductMadeIn": "China",
    "SKU": [
      {
        "ProductID": 10,
        "SKUName": "Standard-Black",
        "Size": 0,
        "Price": 2490000,
        "InStockNumber": 80,
        "Weight": 141,
        "Comment": []
      },
      {
        "ProductID": 10,
        "SKUName": "Standard-Gray",
        "Size": 0,
        "Price": 2490000,
        "InStockNumber": 70,
        "Weight": 141,
        "Comment": []
      }
    ]
  },
  {
    "ProductID": 11,
    "LoginName": "user001",
    "ProductName": "iPhone 20 Pro",
    "ProductBrand": "Apple",
    "ProductCategory": "Smartphone",
    "ProductDescription": "Latest iPhone with M4 Pro chip and titanium design",
    "ProductMadeIn": "USA",
    "SKU": []
  }
]
```

### `GET /buyers/products/:id` - Product details (public)

**Request:** `GET /buyers/products/:id` (no JWT required).
**Response:** Product detail object (same structure as seller product detail):

```json
{
  "ProductID": 1,
  "LoginName": "user001",
  "ProductName": "iPhone 15 Pro",
  "ProductBrand": "Apple",
  "ProductCategory": "Smartphone",
  "ProductDescription": "Latest iPhone with A17 Pro chip and titanium design",
  "ProductMadeIn": "USA",
  "SKU": [
    {
      "ProductID": 1,
      "SKUName": "128GB-Black",
      "Size": 128,
      "Price": 25990000,
      "InStockNumber": 49,
      "Weight": 187,
      "Comment": []
    },
    {
      "ProductID": 1,
      "SKUName": "128GB-White",
      "Size": 128,
      "Price": 25990000,
      "InStockNumber": 45,
      "Weight": 187,
      "Comment": []
    },
    {
      "ProductID": 1,
      "SKUName": "256GB-Black",
      "Size": 256,
      "Price": 28990000,
      "InStockNumber": 40,
      "Weight": 187,
      "Comment": []
    },
    {
      "ProductID": 1,
      "SKUName": "256GB-Blue",
      "Size": 256,
      "Price": 28990000,
      "InStockNumber": 35,
      "Weight": 187,
      "Comment": []
    }
  ]
}
```

**Exception:** same as `GET /sellers/products/:id`.

### `POST /buyers/cart` - Add item to cart / Edit quantity if already existed

**Request:** `POST /buyers/cart` with JWT (role `B`). Body should include product/SKU identifier and `Quantity`. Example :

```json
{
  "ProductID": 1,
  "SKUName": "128GB-Black",
  "Quantity": 2
}
```

**Response:** Updated cart or created cart item. If quantity <= 0, return `400 - Quantity must be at least 1`.

### `GET /buyers/cart` - Get current cart

**Request:** `GET /buyers/cart` with JWT (role `B`).
**Response:** Cart contents like this:

```json
{
  "CartID": 2,
  "LoginName": "user004",
  "TotalCost": 0,
  "StoredSKU": [
    {
      "CartID": 2,
      "ProductID": 6,
      "SKUName": "256GB-Titanium-Gray",
      "Quantity": 1,
      "SKU": {
        "ProductID": 6,
        "SKUName": "256GB-Titanium-Gray",
        "Size": 256,
        "Price": 30990000,
        "InStockNumber": 45,
        "Weight": 233,
        "ProductInfo": {
          "ProductID": 6,
          "LoginName": "user003",
          "ProductName": "Samsung Galaxy S24 Ultra",
          "ProductBrand": "Samsung",
          "ProductCategory": "Smartphone",
          "ProductDescription": "Flagship phone with S Pen and 200MP camera",
          "ProductMadeIn": "South Korea"
        }
      }
    },
    {
      "CartID": 2,
      "ProductID": 7,
      "SKUName": "Standard-Black",
      "Quantity": 1,
      "SKU": {
        "ProductID": 7,
        "SKUName": "Standard-Black",
        "Size": 0,
        "Price": 8990000,
        "InStockNumber": 60,
        "Weight": 250,
        "ProductInfo": {
          "ProductID": 7,
          "LoginName": "user003",
          "ProductName": "Sony WH-1000XM5",
          "ProductBrand": "Sony",
          "ProductCategory": "Audio",
          "ProductDescription": "Premium noise-cancelling headphones",
          "ProductMadeIn": "Malaysia"
        }
      }
    },
    {
      "CartID": 2,
      "ProductID": 10,
      "SKUName": "Standard-Black",
      "Quantity": 1,
      "SKU": {
        "ProductID": 10,
        "SKUName": "Standard-Black",
        "Size": 0,
        "Price": 2490000,
        "InStockNumber": 80,
        "Weight": 141,
        "ProductInfo": {
          "ProductID": 10,
          "LoginName": "user003",
          "ProductName": "Logitech MX Master 3S",
          "ProductBrand": "Logitech",
          "ProductCategory": "Accessories",
          "ProductDescription": "Wireless ergonomic mouse for productivity",
          "ProductMadeIn": "China"
        }
      }
    }
  ]
}
```

### `DELETE /buyers/cart` - Remove an item from cart

**Request:** `DELETE /buyers/cart` with JWT (role `B`). Body should identify which item to remove (ProductID and SKUName):

```json
{
  "ProductID": 1,
  "SKUName": "128GB-Black"
}
```

**Response:** `200 - OK`.

### `POST /buyers/order/create` - Create an order

**Request:** `POST /buyers/order/create` with JWT (role `B`) and order details.

```json
{
    "Skus": [
        {
            "ProductID": 1,
            "SKUName": "128GB-Black",
            "Quantity": 2
        },
        {
            "ProductID": 1,
            "SKUName": "128GB-White",
            "Quantity": 3
        }

    ],
    "AddressID": 6,
    "ProviderName": "VCB",
    "AccountID": 12321
}
```

**Response:** Order confirmation including `OrderID` and status and the Order data:

```json
{
    "OrderID": 10,
    "LoginName": "user004",
    "OrderDate": "2025-11-21T11:19:42.371Z",
    "TotalPrice": 0,
    "ProviderName": "VCB",
    "AccountID": "12321",
    "AddressID": 6
}
```

### `GET /buyers/order/:id` - Get Order ID

**Request:** Send `GET /buyer/order/:id` with `:id` is the order id
**Response:** The order object with the following format:

```json
{
    "OrderID": 2,
    "LoginName": "user004",
    "OrderDate": "2025-11-21T10:04:20.333Z",
    "TotalPrice": 0,
    "ProviderName": "VCB",
    "AccountID": "36363636",
    "AddressID": 6,
    "SubOrderInfo": [],
    "AddressInfo": {
        "LoginName": "user004",
        "AddressID": 6,
        "ContactName": "Sarah Johnson",
        "ContactPhoneNumber": "0934567890",
        "City": "Ho Chi Minh City",
        "District": "District 4",
        "Commune": "Ward 5",
        "DetailAddress": "321 Elm St",
        "AddressType": "Home",
        "IsAddressDefault": true
    }
}
```

## Admin API Endpoints

Note: admin routes are mounted under `/admin` and require JWT with role `A` (Admin).

### `GET /admin/sellers` - List all sellers

**Request:** `GET /admin/sellers` with JWT (role `A`).
**Response:** Array of seller accounts / brief seller information as returned by `adminController.listSellers`.

```json
[
    {
        "LoginName": "user001",
        "Password": "Pass123!@#",
        "PhoneNumber": "0901234567",
        "Email": "john.doe@gmail.com",
        "UserName": "JohnDoe",
        "Gender": true,
        "BirthDate": "1990-05-15T00:00:00.000Z",
        "Age": 35,
        "Address": "123 Main St, District 1, HCMC",
        "Seller": {
            "LoginName": "user001",
            "ShopName": "JohnTech Store",
            "CitizenIDCard": "001234567890",
            "SellerName": "John Doe Shop",
            "MoneyEarned": 130410000
        }
    },
    {
        "LoginName": "user003",
        "Password": "MyPass789",
        "PhoneNumber": "0923456789",
        "Email": "mike.wilson@outlook.com",
        "UserName": "MikeWilson",
        "Gender": true,
        "BirthDate": "1988-03-10T00:00:00.000Z",
        "Age": 37,
        "Address": "789 Pine Rd, District 3, HCMC",
        "Seller": {
            "LoginName": "user003",
            "ShopName": "Wilson Electronics",
            "CitizenIDCard": "003456789012",
            "SellerName": "Mike Wilson Shop",
            "MoneyEarned": 0
        }
    }
]
```

### `GET /admin/sellers/:loginName` - Read seller details

**Request:** `GET /admin/sellers/:loginName` with JWT (role `A`).
**Response:** Full seller profile as returned by `adminController.readSeller`:

```json
{
    "LoginName": "user001",
    "Password": "Pass123!@#",
    "PhoneNumber": "0901234567",
    "Email": "john.doe@gmail.com",
    "UserName": "JohnDoe",
    "Gender": true,
    "BirthDate": "1990-05-15T00:00:00.000Z",
    "Age": 35,
    "Address": "123 Main St, District 1, HCMC",
    "Seller": {
        "LoginName": "user001",
        "ShopName": "JohnTech Store",
        "CitizenIDCard": "001234567890",
        "SellerName": "John Doe Shop",
        "MoneyEarned": 130410000
    }
}
```

Currently, this has no information of the seller's products, SKUs, delivery partner, ... These will be provided later after @nql05 provide the script / function for that.

### `GET /admin/buyers` - List all buyers

**Request:** `GET /admin/buyers` with JWT (role `A`).
**Response:** Array of buyer accounts / brief buyer information as returned by `adminController.listBuyers`:

```json
[
    {
        "LoginName": "user002",
        "Password": "SecurePass456",
        "PhoneNumber": "0912345678",
        "Email": "jane.smith@yahoo.com",
        "UserName": "JaneSmith",
        "Gender": false,
        "BirthDate": "1992-08-20T00:00:00.000Z",
        "Age": 33,
        "Address": "456 Oak Ave, District 2, HCMC",
        "Buyer": {
            "LoginName": "user002",
            "MoneySpent": 43500000
        }
    },
    {
        "LoginName": "user004",
        "Password": "Password2024",
        "PhoneNumber": "0934567890",
        "Email": "sarah.johnson@gmail.com",
        "UserName": "SarahJohnson",
        "Gender": false,
        "BirthDate": "1995-11-25T00:00:00.000Z",
        "Age": 30,
        "Address": "321 Elm St, District 4, HCMC",
        "Buyer": {
            "LoginName": "user004",
            "MoneySpent": 0
        }
    },
    {
        "LoginName": "user005",
        "Password": "Safe@Pass01",
        "PhoneNumber": "0945678901",
        "Email": null,
        "UserName": "DavidBrown",
        "Gender": true,
        "BirthDate": "1991-07-08T00:00:00.000Z",
        "Age": 34,
        "Address": "654 Maple Dr, District 5, HCMC",
        "Buyer": {
            "LoginName": "user005",
            "MoneySpent": 0
        }
    },
    {
        "LoginName": "user006",
        "Password": "Qwerty!234",
        "PhoneNumber": null,
        "Email": "emily.davis@hotmail.com",
        "UserName": "EmilyDavis",
        "Gender": false,
        "BirthDate": "1993-02-14T00:00:00.000Z",
        "Age": 32,
        "Address": "987 Cedar Ln, District 6, HCMC",
        "Buyer": {
            "LoginName": "user006",
            "MoneySpent": 0
        }
    },
    {
        "LoginName": "user007",
        "Password": "Test@Pass99",
        "PhoneNumber": "0967890123",
        "Email": "robert.miller@gmail.com",
        "UserName": "RobertMiller",
        "Gender": true,
        "BirthDate": "1989-12-30T00:00:00.000Z",
        "Age": 36,
        "Address": "147 Birch Blvd, District 7, HCMC",
        "Buyer": {
            "LoginName": "user007",
            "MoneySpent": 0
        }
    },
    {
        "LoginName": "user008",
        "Password": "Strong#Pass",
        "PhoneNumber": "0978901234",
        "Email": "lisa.anderson@yahoo.com",
        "UserName": "LisaAnderson",
        "Gender": false,
        "BirthDate": "1994-06-18T00:00:00.000Z",
        "Age": 31,
        "Address": "258 Spruce St, District 8, HCMC",
        "Buyer": {
            "LoginName": "user008",
            "MoneySpent": 0
        }
    },
    {
        "LoginName": "user009",
        "Password": "MySecret123",
        "PhoneNumber": "0989012345",
        "Email": "james.taylor@outlook.com",
        "UserName": "JamesTaylor",
        "Gender": true,
        "BirthDate": "1987-09-05T00:00:00.000Z",
        "Age": 38,
        "Address": "369 Willow Way, District 9, HCMC",
        "Buyer": {
            "LoginName": "user009",
            "MoneySpent": 0
        }
    },
    {
        "LoginName": "user010",
        "Password": "Pass@Word10",
        "PhoneNumber": "0990123456",
        "Email": "amanda.white@gmail.com",
        "UserName": "AmandaWhite",
        "Gender": false,
        "BirthDate": "1996-04-22T00:00:00.000Z",
        "Age": 29,
        "Address": "741 Ash Court, District 10, HCMC",
        "Buyer": {
            "LoginName": "user010",
            "MoneySpent": 0
        }
    }
]
```

### `GET /admin/buyers/:loginName` - Read buyer details

**Request:** `GET /admin/buyers/:loginName` with JWT (role `A`).
**Response:** Full buyer profile as returned by `adminController.readBuyer`. This is now currently the same as a user profile retrieve by the `GET /admin/buyers`, more information (Order, Cart, Comments, ...) will be later provided by @nql05.

```json
{
    "LoginName": "user002",
    "Password": "SecurePass456",
    "PhoneNumber": "0912345678",
    "Email": "jane.smith@yahoo.com",
    "UserName": "JaneSmith",
    "Gender": false,
    "BirthDate": "1992-08-20T00:00:00.000Z",
    "Age": 33,
    "Address": "456 Oak Ave, District 2, HCMC",
    "Buyer": {
        "LoginName": "user002",
        "MoneySpent": 43500000
    },
    "AddressInfo": [
        {
            "LoginName": "user002",
            "AddressID": 3,
            "ContactName": "Jane Smith",
            "ContactPhoneNumber": "0912345678",
            "City": "Ho Chi Minh City",
            "District": "District 2",
            "Commune": "Ward 2",
            "DetailAddress": "456 Oak Ave",
            "AddressType": "Home",
            "IsAddressDefault": true
        },
        {
            "LoginName": "user002",
            "AddressID": 4,
            "ContactName": "Jane Smith",
            "ContactPhoneNumber": "0912345678",
            "City": "Ho Chi Minh City",
            "District": "District 1",
            "Commune": "Ward 3",
            "DetailAddress": "789 Office Blvd",
            "AddressType": "Office",
            "IsAddressDefault": false
        }
    ]
}
```

**Notes:** Additional admin actions (create/edit/delete users, change roles, suspend accounts) are not implemented (may be when rảnh :D).
