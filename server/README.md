# Products Admin API

Express + Mongoose REST API that backs the admin portal. Provides authentication, product CRUD, and Cloudinary image uploads.

## Features
- Credential-based admin login returning signed JWTs.
- MongoDB persistence for products with pagination/filter/sort endpoints.
- Cloudinary upload pipeline with file validation and 10-image limit.
- JWT middleware protecting `/api/products` and `/api/upload` routes.

## Setup

1. Install deps
   ```bash
   npm install
   ```
2. Configure env
   ```bash
   cp .env.example .env
   # fill in MongoDB URI, admin credentials, JWT secret, Cloudinary keys, etc.
   ```
3. Start the server
   ```bash
   npm run dev
   ```

The API listens on `PORT` (default `4000`). Health check available at `/health`.

## Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/auth/login` | Validate admin credentials and return a JWT + user payload. |
| `GET` | `/api/products` | List products with `page`, `pageSize`, `search`, `category`, `sort`, `order`. |
| `POST` | `/api/products` | Create a product (requires JWT). |
| `GET` | `/api/products/:id` | Fetch a product by ID. |
| `PUT` | `/api/products/:id` | Update product metadata + images. |
| `DELETE` | `/api/products/:id` | Delete a product. |
| `POST` | `/api/upload` | Upload up to 10 images (≤5 MB each) to Cloudinary. |

All `/api/*` routes require the `Authorization: Bearer <token>` header issued by `/auth/login`.

## Scripts
- `npm run dev` – nodemon-powered development server.
- `npm run start` – run with Node.
- `npm run seed` – populate MongoDB with sample products from `scripts/product-seed-data.js`.

## Environment variables
See `.env.example` for the full list. The API requires either `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH` (bcrypt hash) along with Cloudinary credentials.
