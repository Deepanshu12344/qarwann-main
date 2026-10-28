# Qarwaan

<p align="center">
  <img src="qarwaan-dark-logo.png" alt="Qarwaan" width="300" />
</p>

Qarwaan is a premium full-stack MERN travel-planning platform for showcasing curated luxury journeys, capturing customer enquiries, and managing travel products and leads. It features a modern React 19 / TanStack Start frontend powered by an Express 4 and MongoDB Atlas backend, with high-performance Cloudinary CDN media delivery.

MongoDB Atlas is the single source of truth for all journeys, weekend getaways, day-by-day itineraries, and media assets. The public website dynamically reads all content from the Express API with smart HTTP caching (`Cache-Control: public, max-age=60, stale-while-revalidate`), while the administration dashboard provides end-to-end trip creation, Cloudinary gallery uploads, day editing, and Excel workbook synchronization.

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Technology](#technology)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Available commands](#available-commands)
- [Routes and APIs](#routes-and-apis)
- [Content workflow](#content-workflow)
- [Authentication and security](#authentication-and-security)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

### Public website

- Responsive landing page with featured destinations, signature journeys, weekend getaways, testimonials, FAQs, and calls to action.
- Searchable trip catalogue and destination-detail pages with rich day-by-day itineraries, image galleries, inclusions, and travel information, powered live by MongoDB Atlas.
- Dedicated pages for about, contact, enquiries, weekend getaways, privacy, cancellation, disclaimer, and terms.
- Dynamic SEO metadata, canonical links, XML sitemap generated from database, robots directives, and Cloudinary media optimization.
- A browser-facing **Qarwaan AI** travel concierge that creates trip ideas and downloadable itinerary content through a server-side AI route.
- Enquiry and contact forms that submit to the configured Formspree forms.

### Administration and API

- Cookie-based admin login with JWT verification and CSRF protection for state-changing operations.
- Dashboard metrics for journeys, enquiries, enquiry status, daily enquiry activity, journey types, and optional Brevo subscriber counts.
- Complete Trip and day-by-day itinerary CRUD operations with Cloudinary asset uploads.
- Excel workbook import that upserts trips and journey days.
- Enquiry searching, status updates, deletion, and Excel export.
- Optional Zoho SMTP email notifications and Brevo newsletter enrolment.
- Public Google-review endpoint with an approved manual-review fallback.
- Rate limiting, connection pooling, and schema validation on sensitive public and administrative endpoints.

## Architecture

```text
Browser
  │
  ├─ TanStack Start application (this repository root; React 19 + TypeScript)
  │    ├─ dynamic TanStack Query hooks & SSR loaders
  │    ├─ server routes under /api/public/trips forwarding to Express API
  │    ├─ server-side AI route at /api/ai/chat
  │    └─ Formspree enquiry/contact submissions
  │
  └─ Express API (backend/; default http://localhost:5000)
       ├─ MongoDB Atlas: trips, journey days, enquiries
       ├─ Cloudinary: image storage, transforms & CDN delivery
       ├─ admin authentication and dashboard
       ├─ Excel import/export
       ├─ Zoho SMTP and Brevo integrations
       └─ AI concierge, reviews, and brochure endpoints
```

The public storefront reads from the Express API (defaulting to `http://localhost:5000` via `VITE_API_BASE_URL`), with MongoDB Atlas as the single source of truth. All images are delivered via Cloudinary CDN.

## Technology

| Area | Main tools |
| --- | --- |
| Public application | React 19, TypeScript, TanStack Start, TanStack Router, Vite 8 |
| Styling and UI | Tailwind CSS 4, Radix UI, shadcn-style components, Framer Motion, Lucide |
| Client data/forms | TanStack Query, React Hook Form, Zod |
| Operations API | Node.js, Express 4, Mongoose, MongoDB |
| Backend services | JWT, bcrypt, Helmet, CORS, Multer, ExcelJS, PDFKit, Nodemailer |
| Content source | Excel (`.xlsx`) workbooks and generated TypeScript catalogue |
| Deployment configuration | Vercel (primary build preset) and Netlify config |

## Repository layout

```text
.
├── src/
│   ├── routes/                 # File-based TanStack routes, pages, server routes, admin UI
│   ├── components/             # Site, admin, AI, review, and reusable UI components
│   ├── data/                   # Generated public itinerary catalogue and fixture data
│   ├── lib/                    # API client, AI client, SEO, auth and utility helpers
│   └── assets/                 # Bundled visual assets
├── public/                     # Favicons, crawl files, images, and static files
├── backend/
│   ├── src/
│   │   ├── controllers/        # HTTP handlers
│   │   ├── routes/             # Express route definitions
│   │   ├── models/             # MongoDB schemas
│   │   ├── services/           # Mail, Brevo, AI, PDF, and reviews integrations
│   │   ├── middleware/         # Auth, validation, upload, error, and rate limiting
│   │   └── validators/         # Zod request schemas
│   └── scripts/seed.js         # Database seed command
├── scripts/build-itineraries.py # Builds public trip data from the .xlsx workbooks
├── *.xlsx                      # Source workbooks for published itineraries
├── vite.config.ts              # TanStack Start/Vite configuration (Vercel Nitro preset)
├── vercel.json                 # Vercel build configuration
└── netlify.toml                # Netlify build configuration
```

> **Do not edit `src/routeTree.gen.ts` manually.** TanStack Router generates this file from `src/routes`.

## Prerequisites

- Node.js 20.19 or newer (recommended for Vite 8) and npm.
- MongoDB only if you will run the `backend/` API with persistent data. MongoDB Atlas or a local MongoDB instance both work.
- Python 3.9+ only if you will regenerate the public itinerary catalogue from the Excel workbooks. The supplied script uses only Python's standard library.
- Accounts/credentials for Zoho, Brevo, and an AI provider are optional and only needed for their respective integrations.

## Quick start

### 1. Run the public website

The quickest way to work on the public experience does not require MongoDB or the Express backend.

```bash
npm ci
npm run dev
```

Open the address printed by Vite (normally `http://localhost:5173`).

The public site includes its static trip catalogue and local server routes. The enquiry and contact forms post to the Formspree endpoints configured in `src/lib/formspree.ts`.

### 2. Run the full stack with administration

Start the backend in one terminal:

```bash
cd backend
npm ci
cp .env.example .env # If an example file is supplied locally; otherwise create .env from the template below.
npm run dev
```

Then start the frontend in another terminal:

```bash
npm run dev
```

Set `VITE_API_BASE_URL=http://localhost:5000` in a root `.env.local` file when the API runs on its default port. Visit `/admin/login` in the frontend and sign in using the admin credentials configured in `backend/.env`.

The backend attempts a MongoDB connection on startup. If no database is available, it still listens for requests, but MongoDB-backed endpoints will not be usable.

### 3. Build and preview the public application

```bash
npm run build
npm run preview
```

`npm run build` produces the TanStack Start/Nitro deployment output. The Vite configuration is explicitly set to the Vercel Nitro preset.

## Environment variables

Environment files are ignored by Git. Never commit real keys, passwords, JWT secrets, or production connection strings.

### Frontend (`.env.local` at the repository root)

```dotenv
# Optional. Used only by the frontend admin client.
# Defaults to http://localhost:5000 when omitted.
VITE_API_BASE_URL=http://localhost:5000

# Required only for the application's /api/ai/chat route.
# AI_API_KEY takes precedence over GEMINI_API_KEY.
AI_API_KEY=your-provider-key
# GEMINI_API_KEY=your-gemini-key

# Optional. Defaults to Google's OpenAI-compatible Gemini endpoint.
AI_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
```

Values prefixed with `VITE_` are exposed to browser code. Do not store secrets in `VITE_*` variables. The AI variables above are read only from the server-side TanStack route.

### Backend (`backend/.env`)

Use this as a starting point and fill only the integrations you enable:

```dotenv
# Runtime and network
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/qarwaan
CORS_ORIGIN=http://localhost:5173
TRUST_PROXY=false

# Admin authentication
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=$2b$10$replace-with-a-bcrypt-hash
JWT_SECRET=replace-with-a-unique-random-value-at-least-32-characters-long
JWT_EXPIRES_IN=7d
COOKIE_SAME_SITE=lax
COOKIE_SECURE=false

# Optional: enquiry notifications through Zoho SMTP
ZOHO_SMTP_HOST=smtp.zoho.com
ZOHO_SMTP_PORT=465
ZOHO_SMTP_SECURE=true
ZOHO_SMTP_USER=your-zoho-email@example.com
ZOHO_SMTP_PASS=your-zoho-app-password
ZOHO_FROM_EMAIL=your-zoho-email@example.com
ZOHO_TO_EMAIL=travel-team@example.com

# Optional: newsletter subscribers in Brevo
BREVO_API_KEY=your-brevo-api-key
BREVO_LIST_ID=123

# Optional: backend AI endpoints
AI_API_KEY=your-provider-key
# GEMINI_API_KEY=your-gemini-key
AI_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
AI_MODEL=gemini-3.5-flash-lite
AI_TIMEOUT_MS=30000

# Optional: business metadata returned by the AI API
SITE_URL=https://www.qarwaan.com
CONTACT_EMAIL=hello@example.com
CONTACT_PHONE=+91XXXXXXXXXX

# Use `manual` (or omit) until an approved Google review provider is implemented.
GOOGLE_REVIEWS_SOURCE=manual
```

#### Generating an admin password hash

Run this inside `backend/`, then place the output in `ADMIN_PASSWORD_HASH`:

```bash
node -e "console.log(require('bcryptjs').hashSync('replace-with-a-strong-password', 10))"
```

#### Production cookie and CORS settings

`CORS_ORIGIN` is mandatory in backend production and accepts a comma-separated list of permitted frontend origins:

```dotenv
NODE_ENV=production
CORS_ORIGIN=https://www.qarwaan.com,https://qarwaan.com
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
```

If the frontend and API are on different sites and browser cookies must cross sites, use `COOKIE_SAME_SITE=none` and `COOKIE_SECURE=true`. This should be a deliberate deployment decision because it changes browser cookie behaviour.

## Available commands

### Root application

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the TanStack Start/Vite development server. |
| `npm run build` | Produces a production build. |
| `npm run build:dev` | Builds using Vite's development mode. |
| `npm run preview` | Serves the production build locally. |
| `npm run lint` | Runs ESLint across the repository. |
| `npm run format` | Formats files using Prettier (writes changes). |

### Backend

| Command | Description |
| --- | --- |
| `npm run dev` | Runs the API with Nodemon. |
| `npm start` | Runs the Express API with Node.js. |
| `npm run seed` | Runs `backend/scripts/seed.js`; requires `MONGODB_URI`. |

Run the backend commands from the `backend/` directory.

## Routes and APIs

### Public application routes

| Route | Purpose |
| --- | --- |
| `/` | Home page and featured journeys. |
| `/trips` | Searchable catalogue. |
| `/trips/:slug` | Public trip detail page. |
| `/weekend-getaways` | Short-break collection. |
| `/ai` | Qarwaan AI travel concierge. |
| `/enquire` | Trip enquiry form. |
| `/contact` | Contact form. |
| `/about-us`, `/privacy`, `/terms-and-conditions`, `/cancellation`, `/disclaimer` | Company and policy pages. |
| `/admin/login` | Admin sign-in. |
| `/admin` | Protected dashboard. |
| `/admin/trips`, `/admin/enquiries` | Protected trip and enquiry management. |

### TanStack Start server endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/public/trips` | Returns the checked-in public itinerary catalogue. |
| `GET` | `/api/public/trips/:slug` | Returns one static catalogue itinerary by ID or slug. |
| `POST` | `/api/ai/chat` | Server-side AI travel-concierge request; requires a configured AI key. |

### Express API (`backend/`)

The backend starts at `http://localhost:5000` by default and exposes `GET /health` for health checks.

| Area | Endpoints |
| --- | --- |
| Authentication | `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` |
| Trips | `GET/POST /api/trips`, `GET/PATCH/DELETE /api/trips/:id`, `GET /api/trips/slug/:slug`, `GET /api/trips/:id/journey-days` |
| Journey days | `GET/POST /api/journey-days`, `GET/PATCH/DELETE /api/journey-days/:id` |
| Excel import | `POST /api/import/excel` |
| Enquiries | `POST /api/enquiries`, `GET /api/enquiries`, `GET /api/enquiries/export`, `GET/PATCH/DELETE /api/enquiries/:id` |
| Admin metrics | `GET /api/admin/stats` |
| Reviews | `GET /api/google-reviews` |
| Backend AI | `GET /api/ai/discovery`, `POST /api/ai/travel-chat`, `POST /api/ai/brochure` |

Endpoints that create, update, or delete protected resources require a valid admin session or bearer JWT and the `X-CSRF-Token` returned by login or `/api/auth/me`.

## Content workflow

### Public catalogue: Excel workbooks → TypeScript data

The root-level `.xlsx` files are the editorial source for the public storefront. `scripts/build-itineraries.py` transforms the workbooks into `src/data/qarwaan-itineraries.ts`.

After editing a supported workbook, regenerate the catalogue from the repository root:

```bash
python3 scripts/build-itineraries.py
npm run lint
npm run build
```

The script is intentionally standard-library-only. It also owns starting prices and day-gallery mappings, which prevents generated output from discarding editorial image choices. Review the generated TypeScript diff before committing it.

### Admin import: workbook → MongoDB

The admin import screen and `POST /api/import/excel` expect a `.xlsx` file with these exact worksheets:

- `ABOUT TRIP`
- `JOURNEY MASTER`

The importer:

- accepts `.xlsx` files up to 10 MB and keeps the upload in memory;
- limits each required worksheet to 2,000 data rows;
- matches alternative header spellings such as `Package Name`/`packageName`;
- generates a URL-safe slug from the package name;
- upserts trips by slug; and
- upserts journey days by the `tripId` and day number pair.

If a journey row refers to a package name that cannot be matched to a trip, the import response reports the row-level error in its summary.

## Authentication and security

- The backend stores the admin JWT in the `qarwaan_admin_session` HTTP-only cookie. The API also accepts a bearer token for compatible clients.
- Admin login checks `ADMIN_EMAIL` and a bcrypt `ADMIN_PASSWORD_HASH` rather than storing a plaintext password.
- Mutating authenticated requests require the CSRF value embedded in the signed JWT, sent as `X-CSRF-Token`.
- The API uses Helmet, restrictive CORS, input validation with Zod, JSON-size limits, and an in-memory per-IP rate limiter.
- Login, enquiry creation, AI chat, discovery, and brochure endpoints have route-specific rate limits.
- Excel import restricts MIME types/extensions, input size, multipart fields, worksheet sizes, and validates the `.xlsx` ZIP signature.
- Enquiry exports escape spreadsheet formulas to reduce CSV/Excel formula injection risk.

The current rate limiter is process-local. For multiple API instances or serverless scaling, replace it with a shared store such as Redis before relying on it as a global abuse-control mechanism.

## Integrations

| Integration | Role | Configuration |
| --- | --- | --- |
| Formspree | Public enquiry and contact forms | Endpoints are currently defined in `src/lib/formspree.ts`. |
| MongoDB | Trips, journey days, and enquiry persistence | `MONGODB_URI` |
| Zoho Mail | New-enquiry email notifications | `ZOHO_SMTP_*`, `ZOHO_TO_EMAIL`, optional `ZOHO_FROM_EMAIL` |
| Brevo | Newsletter-contact upsert and dashboard subscriber count | `BREVO_API_KEY`, `BREVO_LIST_ID` |
| Gemini-compatible AI | AI chat and backend itinerary generation | `AI_API_KEY` or `GEMINI_API_KEY`, optional base URL/model/timeout |
| Google reviews | Public reviews API | Manual approved data by default; `GOOGLE_REVIEWS_SOURCE=google` intentionally fails until an approved provider is wired. |

## Deployment

### Frontend

The Vite configuration uses TanStack Start's Nitro **Vercel preset**, and `vercel.json` runs `npm run build`. Configure root deployment variables in your host:

```dotenv
VITE_API_BASE_URL=https://api.example.com
AI_API_KEY=your-server-side-ai-key
```

Do not expose the AI key with a `VITE_` prefix. The server route reads `AI_API_KEY`/`GEMINI_API_KEY` at runtime.

`netlify.toml` is also included with `npm run build` and `dist` as the publish directory. If deploying to Netlify, validate the generated SSR/function output in the target environment because the checked-in Vite configuration is explicitly configured for Vercel.

### Backend

Deploy `backend/` as a persistent Node.js service that can reach MongoDB. Set all production environment variables from the [backend template](#backend-backendenv), then:

1. Set `NODE_ENV=production`.
2. Use a high-entropy `JWT_SECRET` of at least 32 characters.
3. Set every allowed frontend URL in `CORS_ORIGIN`.
4. Enable secure cookies with `COOKIE_SECURE=true`.
5. Set `TRUST_PROXY=true` only when the API is actually behind a trusted reverse proxy.
6. Point `VITE_API_BASE_URL` at the deployed API URL and redeploy the frontend.
7. Verify `GET /health`, admin login, protected CRUD requests, and the preflight/CORS behaviour from the deployed frontend domain.

## Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| Admin login or CRUD calls target the wrong host | Add `VITE_API_BASE_URL` to root `.env.local`, restart Vite, and ensure it matches the backend URL exactly. |
| Browser shows a CORS error | Add the exact frontend origin to backend `CORS_ORIGIN`; include the protocol and do not add an extra trailing path. |
| Login works but writes return `403 Invalid CSRF token` | Use the same browser session that logged in and send the latest `csrfToken` as `X-CSRF-Token`. |
| Backend starts but API requests fail with MongoDB errors | Check `MONGODB_URI`, database network access, credentials, and connectivity. The server can start without MongoDB, but persistence cannot work. |
| AI concierge reports an error | Configure `AI_API_KEY` or `GEMINI_API_KEY` in the frontend server environment; the key must not be a `VITE_` variable. |
| Excel import says a required sheet is missing | Rename the worksheets exactly to `ABOUT TRIP` and `JOURNEY MASTER`. |
| Production backend exits during boot | In production, `JWT_SECRET` and `CORS_ORIGIN` are required and strictly validated. |
| New enquiry is saved but email/newsletter integration fails | Configure the relevant Zoho/Brevo variables. The API stores notification errors without failing the enquiry response. |

## License

No license file is currently included in this repository. Treat the code, brand assets, itineraries, and supplied media as proprietary unless the project owner provides different licensing terms.
