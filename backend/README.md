# QARWAAN Backend (Express + MongoDB)

## Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in MONGODB_URI, JWT_SECRET, admin credentials, Zoho SMTP, Brevo
npm run dev
```

### Generate the admin password hash

```bash
node -e "console.log(require('bcryptjs').hashSync('your-strong-password', 10))"
```

Put the resulting string into `ADMIN_PASSWORD_HASH` in `.env`.

## API

### Public

- `GET  /health`
- `GET  /api/trips` — list trips
- `GET  /api/trips/:id`
- `GET  /api/trips/slug/:slug`
- `GET  /api/trips/:id/journey-days`
- `POST /api/enquiries` — submit website enquiry (sends Zoho email + optional Brevo subscribe)

### Admin (requires `Authorization: Bearer <jwt>`)

- `POST /api/auth/login` — `{ email, password }` → `{ token }`
- `GET  /api/auth/me`
- `GET  /api/admin/stats`
- `POST /api/trips`, `PATCH /api/trips/:id`, `DELETE /api/trips/:id`
- `POST /api/journey-days`, `PATCH /api/journey-days/:id`, `DELETE /api/journey-days/:id`
- `POST /api/import/excel` (multipart, field `file`)
- `GET  /api/enquiries` (?q, status, from, to, page, limit)
- `GET  /api/enquiries/export` — returns `.xlsx`
- `PATCH /api/enquiries/:id` — update status
- `DELETE /api/enquiries/:id`

## Integrations

- **Zoho Mail (SMTP)** — every new enquiry is emailed to `ZOHO_TO_EMAIL` via `smtp.zoho.com:465`.
- **Brevo** — when an enquirer ticks the consent checkbox, their email is upserted onto `BREVO_LIST_ID`.
