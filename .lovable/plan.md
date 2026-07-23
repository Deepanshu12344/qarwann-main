## Enquiry System + MERN Admin Dashboard

Two related deliverables, both server-heavy. Below is the proposed shape — confirm before I build.

### 1. Enquiry System

**Frontend (TanStack Start)**
- `src/components/EnquiryDialog.tsx` — modal form opened by every "Enquire" / "Enquire Now" button on the homepage and Trip Details page.
- Fields: Name, Email, Phone, Trip Name (prefilled when launched from a trip), Number of Travelers, Travel Dates (date range), Message, newsletter consent checkbox.
- Validated with `zod` + `react-hook-form`, toast feedback via existing sonner.
- Posts to `POST {VITE_API_BASE_URL}/api/enquiries` on the Express backend.

**Backend (Express + MongoDB, existing `backend/`)**
- `models/Enquiry.js` — name, email, phone, tripName, travelers, travelStartDate, travelEndDate, message, newsletterOptIn, status (`new|contacted|closed`), source, createdAt.
- `controllers/enquiry.controller.js` — create / list (paginated, filters) / get / update status / delete / export.
- `routes/enquiry.routes.js` with Zod validation.
- On create:
  1. Save enquiry to MongoDB.
  2. Send email to Zoho inbox using Nodemailer over Zoho SMTP (`smtp.zoho.com:465`, SSL). Uses env `ZOHO_SMTP_USER`, `ZOHO_SMTP_PASS`, `ZOHO_TO_EMAIL`, `ZOHO_FROM_EMAIL`.
  3. If `newsletterOptIn === true`, call Brevo `POST https://api.brevo.com/v3/contacts` with `listIds: [BREVO_LIST_ID]` using `BREVO_API_KEY`. Handle "already exists" (HTTP 400 `duplicate_parameter`) gracefully.
- New env vars (added to `backend/.env.example`): `ZOHO_SMTP_USER`, `ZOHO_SMTP_PASS`, `ZOHO_TO_EMAIL`, `ZOHO_FROM_EMAIL`, `BREVO_API_KEY`, `BREVO_LIST_ID`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`.
- New deps: `nodemailer`, `axios` (for Brevo), `jsonwebtoken`, `bcryptjs`.

Note: Since this is a self-hosted Express backend (not Lovable Cloud), you'll need to set these secrets in your own `backend/.env` — I cannot use Lovable's secret store for the Express server.

### 2. MERN Admin Dashboard

A separate set of routes inside the same TanStack Start frontend, under `/admin/*`, talking to the Express API. (Keeps one frontend codebase; no second React app.)

**Auth**
- Single admin account, credentials checked server-side against `ADMIN_EMAIL` + bcrypt hash in env. `POST /api/admin/login` returns a JWT. Token stored in `localStorage` + sent as `Authorization: Bearer`.
- All `/api/admin/*` routes protected by `requireAdmin` middleware (verifies JWT).
- Frontend route guard via a small `useAdminAuth` hook; `/admin` redirects to `/admin/login` when unauthenticated.

**Routes & pages**
- `/admin/login` — login form.
- `/admin` — dashboard: KPI cards (total trips, total enquiries, new enquiries this week, newsletter subscriber count from Brevo `GET /v3/contacts/lists/{id}`), enquiries-per-day chart (recharts, already installed), trip-type breakdown.
- `/admin/trips` — table of trips (search, paginate), Edit / Delete actions, "New Trip" + "Import Excel" buttons.
- `/admin/trips/new` and `/admin/trips/$id/edit` — trip form (all Trip fields incl. cover image URL).
- `/admin/trips/import` — drag-and-drop Excel upload hitting existing `/api/import` (now protected).
- `/admin/enquiries` — table with filters (status, date range, search), row drawer for detail, status update, delete, and **Export to Excel** button.

**Backend additions**
- `controllers/auth.controller.js` + `routes/auth.routes.js` — login.
- `middleware/auth.js` — `requireAdmin`.
- `controllers/admin.controller.js` — `/api/admin/stats` (counts, chart series, subscriber count via Brevo).
- `controllers/enquiry.controller.js` adds `exportXlsx` returning an `.xlsx` stream built with existing `xlsx` package.
- Wrap existing trip/journey-day/import routes with `requireAdmin` for write operations; keep public GETs open for the site.

**UI conventions**
- Admin uses the same design tokens (`#004643`, `#F0EDE5`, `#C9A227`) but a denser layout: shadcn `Table`, `Card`, `Tabs`, `Dialog`, sidebar nav. Fully responsive (sidebar collapses to top bar on mobile).

### Files to create / edit
- **Backend** (new): `models/Enquiry.js`, `controllers/enquiry.controller.js`, `controllers/auth.controller.js`, `controllers/admin.controller.js`, `routes/enquiry.routes.js`, `routes/auth.routes.js`, `routes/admin.routes.js`, `middleware/auth.js`, `services/mailer.js`, `services/brevo.js`, `validators/enquiry.validator.js`.
- **Backend** (edit): `server.js`, `package.json`, `.env.example`, `routes/trip.routes.js`, `routes/journeyDay.routes.js`, `routes/import.routes.js`, `README.md`.
- **Frontend** (new): `src/lib/api.ts` (base URL + fetch helper), `src/lib/admin-auth.ts`, `src/components/EnquiryDialog.tsx`, `src/routes/admin.tsx` (layout), `src/routes/admin.index.tsx`, `src/routes/admin.login.tsx`, `src/routes/admin.trips.tsx`, `src/routes/admin.trips.new.tsx`, `src/routes/admin.trips.$id.edit.tsx`, `src/routes/admin.trips.import.tsx`, `src/routes/admin.enquiries.tsx`.
- **Frontend** (edit): `src/routes/index.tsx` and `src/routes/trips.$slug.tsx` to wire the Enquire buttons to `EnquiryDialog`. Add `VITE_API_BASE_URL` to use.

### Open questions before I start
1. **API base URL** — what should `VITE_API_BASE_URL` default to? (`http://localhost:5000` for local dev?)
2. **Admin account** — one fixed account via env vars is simplest. OK, or do you want a `users` collection with multiple admins?
3. **Brevo list** — you'll provide `BREVO_LIST_ID` of the newsletter list in your `.env`, correct?
4. **Newsletter count** — pull live from Brevo, or also mirror subscribers into a local `Subscriber` collection?

Reply with answers (or "go with defaults: localhost:5000, single env admin, Brevo list from env, live count from Brevo") and I'll build it.
