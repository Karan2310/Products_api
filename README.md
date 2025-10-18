# Products Admin Monorepo

This workspace now contains a split client/server architecture for the products admin experience.

- `client/` – Next.js 15 app that renders the admin portal UI, handles authentication with NextAuth, and consumes the Express API.
- `server/` – Express + Mongoose backend powering authentication, product CRUD endpoints, and Cloudinary image uploads.

## Quick start

1. **Install dependencies**
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```
2. **Configure environment**
   - Copy `client/.env.example` → `client/.env` and set the API URL + `NEXTAUTH_SECRET`.
   - Copy `server/.env.example` → `server/.env` and supply MongoDB, admin credentials, JWT secret, and Cloudinary keys.
3. **Run the stack**
   ```bash
   # Terminal 1 – start the API
   cd server
   npm run dev

   # Terminal 2 – start the admin portal
   cd client
   npm run dev
   ```

The admin UI will be available at `http://localhost:3000`, proxying all product/image/auth requests to the Express server (default `http://localhost:4000`).

Refer to the READMEs inside each package for feature-level details.
