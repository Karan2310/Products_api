# Products Admin Monorepo

This workspace now contains a split client/server architecture for the complete storefront + admin experience.

- `client/` – Next.js 15 app that renders both the customer-facing storefront (catalogue, cart, checkout, order history) and the protected admin console.
- `server/` – Express + Mongoose backend powering authentication, catalogue APIs, order management, and Cloudinary image uploads.

## Quick start

1. **Install dependencies**
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```
2. **Configure environment**
   - Copy `client/.env.example` → `client/.env` and set the API URL plus `NEXTAUTH_SECRET` (override the dummy chatbot URL only if you have a real endpoint).
   - Copy `server/.env.example` → `server/.env` and supply MongoDB, admin credentials, JWT secret, Cloudinary keys, and (optionally) chatbot webhook credentials.
3. **Run the stack**
   ```bash
   # Terminal 1 – start the API
   cd server
   npm run dev

   # Terminal 2 – start the admin portal
   cd client
   npm run dev
   ```

The storefront lives at `http://localhost:3000/shop` while the admin UI remains at `http://localhost:3000/admin`. Both proxy API requests to the Express server (default `http://localhost:4000`).

Refer to the READMEs inside each package for feature-level details, including the new shopper workflows and order management tooling.
