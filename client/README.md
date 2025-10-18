# Products Admin Client

Next.js admin dashboard that authenticates with NextAuth (credentials) and talks to the companion Express API for product management.

## Features
- Credentials sign-in backed by the Express `/auth/login` endpoint.
- Product catalogue with pagination, filtering, sorting, create/edit/delete flows, and Cloudinary-hosted image previews.
- Tailwind + shadcn/ui component system with dark/light theme toggle.
- React Query for data fetching, optimistic refresh, and toast feedback on mutations.

## Getting started

1. Install deps
   ```bash
   npm install
   ```
2. Configure env
   ```bash
   cp .env.example .env
   # edit NEXT_PUBLIC_API_URL (e.g. http://localhost:4000) and NEXTAUTH_SECRET
   ```
3. Run the dev server
   ```bash
   npm run dev
   ```

Ensure the Express API is running (see `../server/README.md`). Successful login will redirect to `/admin`; unauthenticated users are sent to `/login`.

## Scripts
- `npm run dev` – start Next.js (Turbopack).
- `npm run build` / `npm run start` – production build & serve.
- `npm run lint` – lint with ESLint.

## Environment variables
| Name | Description |
| ---- | ----------- |
| `NEXT_PUBLIC_API_URL` | Base URL for the Express server (must include protocol). |
| `NEXTAUTH_SECRET` | Shared secret for NextAuth JWT encryption. |

## Notes
- All API requests are proxied to the Express server and include the bearer token returned by `/auth/login`.
- Image uploads are streamed directly from the browser to the API, which handles validation + Cloudinary upload.
