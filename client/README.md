# Products Admin Client

Next.js application that powers both the customer-facing storefront and the protected admin dashboard. Authentication is handled with NextAuth credentials while data flows through the companion Express API.

## Features
- Customer storefront with product browsing, search/filtering, rich product detail pages, persistent cart, checkout flow, and order history dashboard.
- Credentials sign-in/registration backed by the Express auth endpoints with role-based routing between user and admin experiences.
- Admin product catalogue with pagination, filtering, sorting, create/edit/delete flows, Cloudinary-hosted previews, and a dedicated order management console.
- Optional chatbot instrumentation (sent to a configurable dummy endpoint by default) to simulate product, cart, and order interactions for future AI integrations.
- Tailwind + shadcn/ui component system with dark/light theme toggle and React Query powered data fetching/mutations.

## Getting started

1. Install deps
   ```bash
   npm install
   ```
2. Configure env
   ```bash
   cp .env.example .env
   # edit NEXT_PUBLIC_API_URL (e.g. http://localhost:4000) and NEXTAUTH_SECRET
   # optionally set NEXT_PUBLIC_CHATBOT_URL (defaults to a dummy sandbox endpoint)
   ```
3. Run the dev server
   ```bash
   npm run dev
   ```

Ensure the Express API is running (see `../server/README.md`). Admins land on `/admin`, while customers are guided to `/shop`, `/cart`, `/checkout`, and `/dashboard` for order history.

## Scripts
- `npm run dev` – start Next.js (Turbopack).
- `npm run build` / `npm run start` – production build & serve.
- `npm run lint` – lint with ESLint.

## Environment variables
| Name | Description |
| ---- | ----------- |
| `NEXT_PUBLIC_API_URL` | Base URL for the Express server (must include protocol). |
| `NEXTAUTH_SECRET` | Shared secret for NextAuth JWT encryption. |
| `NEXT_PUBLIC_CHATBOT_URL` | Optional override for the dummy chatbot webhook URL used to simulate interactions. |

## Notes
- Authenticated fetches automatically include the bearer token returned by `/auth/login`; customer catalogue requests fall back to unauthenticated access.
- Image uploads are streamed directly from the browser to the API, which handles validation + Cloudinary upload.
- Cart state persists to local storage so shoppers can resume sessions across visits.
