# FormCraft

A Cognito-Forms-style form builder. Next.js 14 + Supabase, deployable on Vercel,
with a token-secured REST API that Make can call (get forms, list/update entries)
and an outbound webhook so Make can watch new entries.

## What's in here

- **Form builder** (`/build/<id>`) — fields: text, email, number, paragraph,
  dropdown, checkbox, date, phone; edit labels, reorder, mark required, publish.
- **Public fill page** (`/f/<id>`) — the shareable form for respondents.
- **Entry viewer** (`/entries/<formId>`) — submissions table.
- **Dashboard** (`/dashboard`) — your forms; "New form" creates one and opens the builder.
- **Auth** — Supabase email/password (multi-user; each user sees only their own forms).
- **REST API** (`/api/*`) — for Make. Secured by a static bearer token.
- **Webhook** — Supabase fires to Make on each new entry.

---

## Deploy order (read this first)

Do it in this sequence — some steps depend on earlier ones:

1. Set up Supabase (DB + keys) — Step 1
2. Push to GitHub — Step 3
3. Deploy on Vercel **with env vars set before deploy** — Step 4
4. Point Supabase Auth at your Vercel domain — Step 5
5. Wire up Make + the entry webhook **last**, once you have a live URL — Step 7

You can run it locally first (Step 2) but it isn't required.

---

## 1. Supabase

1. Create a project at supabase.com (pick a region near you; save the DB password).
2. **SQL Editor → New query → paste `supabase/schema.sql` → Run.** Creates the
   `forms` and `entries` tables, RLS policies, and triggers.
3. **Skip `supabase/webhook.sql` for now** — it needs a Make URL you don't have yet.
   You'll run it in Step 7.
4. **Auth → Providers → Email:** for the smoothest first login, turn **OFF**
   "Confirm email" (Auth → Providers → Email → Confirm email). If you leave it on,
   your first signup won't be able to log in until you click the confirmation link
   in the email Supabase sends.
5. **Project Settings → API:** copy three values for the next steps —
   - Project URL  → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY` (server only — keep secret)

---

## 2. Run locally (optional)

Copy `.env.example` to `.env.local` and fill in all four values:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...          # server only
MAKE_API_TOKEN=...                     # generate a long random string
```

Generate the API token: `openssl rand -hex 32`

```
npm install
npm run dev          # http://localhost:3000
```

Sign up at `/signup`, then you land on the dashboard.

---

## 3. Push to GitHub

`.gitignore` already excludes `node_modules`, `.next`, and `.env*`, so your keys
won't be committed.

```
git init
git add .
git commit -m "FormCraft"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

---

## 4. Deploy on Vercel

1. vercel.com → **Add New → Project** → import your GitHub repo.
2. Framework preset auto-detects **Next.js**. Leave build/output settings default.
3. **Before clicking Deploy, open "Environment Variables"** and add all four
   (same names as `.env.local`). If you deploy without them, the build still
   succeeds but the live app errors at runtime ("supabaseUrl is required").
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `MAKE_API_TOKEN`
   The two non-`NEXT_PUBLIC_` vars are already server-only in code; they're never
   sent to the browser.
4. **Deploy.** Note your live URL, e.g. `https://your-app.vercel.app`.

If you ever change an env var in Vercel, redeploy for it to take effect.

---

## 5. Point Supabase Auth at your domain

Supabase → **Authentication → URL Configuration**:
- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:** add `https://your-app.vercel.app/**`

Without this, signup/login email links and redirects can misbehave on the live site.

---

## 6. Smoke test

- Visit `https://your-app.vercel.app/signup`, create an account, log in.
- Dashboard → **New form** → add a couple of fields → **Publish**.
- Open the public link shown in the builder (`/f/<id>`), submit a test entry.
- Back at `/entries/<formId>`, confirm the entry shows up.
- Test the API (replace TOKEN and host):
  ```
  curl -H "Authorization: Bearer TOKEN" https://your-app.vercel.app/api/forms
  ```

---

## 7. Make integration (do this last)

### A. Watch new entries — instant (recommended)

1. In Make, create a scenario starting with a **Custom Webhook** module → copy its URL.
2. Either:
   - **Dashboard route (easier):** Supabase → Database → Webhooks → Create →
     table `entries`, event `INSERT`, type `HTTP Request`, method `POST`, URL = your
     Make webhook URL. Save.
   - **SQL route:** edit `supabase/webhook.sql`, replace the placeholder URL with
     your Make webhook URL, then run it in the SQL Editor.
3. Submit a test entry; Make receives:
   `{ event:"entry.created", entry_id, form_id, data, created_at }`.

### B. Watch new entries — polling (alternative)

HTTP module → GET
`https://your-app.vercel.app/api/entries?form_id=<id>&since=<ISO timestamp>`
with header `Authorization: Bearer <MAKE_API_TOKEN>`.

### C. Get forms / update entries from Make

Use an HTTP module with the bearer header:
- **Get forms:** `GET /api/forms`
- **Get one form (field ids):** `GET /api/forms/<id>`
- **Update an entry:** `PATCH /api/entries/<id>` with body `{ "data": { ... } }`

---

## REST API reference

All requests need header: `Authorization: Bearer <MAKE_API_TOKEN>`

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/forms` | list forms (optional `?owner=<uuid>`) |
| GET | `/api/forms/:id` | one form + field schema |
| GET | `/api/entries?form_id=&limit=&since=` | list entries; `since` (ISO) for polling |
| POST | `/api/entries` | create entry `{ form_id, data }` |
| GET | `/api/entries/:id` | one entry |
| PATCH | `/api/entries/:id` | update entry `{ data }` |
| DELETE | `/api/entries/:id` | delete entry |

`data` is keyed by field id, e.g. `{ "f1a2b3c": "Jane", "f9z8y7x": "jane@x.com" }`.
Get the field ids from `GET /api/forms/:id` (the `schema` array).

---

## Importing the DEAL form + entries

The DEAL form is pre-built. To load it and its entries:

1. **Run `supabase/storage.sql`** (file-upload bucket for the POP field).
2. **Create the form:** open `supabase/deal_form.sql`, replace `<YOUR_USER_ID>`
   with your account's UUID (Supabase → Authentication → Users → copy the id),
   run it, and **copy the returned form id**.
3. **Export entries from Cognito:** DEAL → Entries → Actions/Export → CSV.
4. **Convert + import:**
   ```
   node supabase/import_entries.js <export.csv> <FORM_ID> > entries.sql
   ```
   Then paste `entries.sql` into the Supabase SQL Editor and run it.

The converter maps Cognito columns to field ids, turns `Total` into a number,
turns `COLLECTION LOCATION` into a checkbox array, and ignores Cognito's
Number/Status/Submitted columns. Edit `COLUMN_MAP` in the script if your headers
differ. Note: the **POP** files themselves aren't migrated by the CSV (Cognito
stores them on its own servers); new submissions upload to your Supabase bucket.

Dropdown options for MONTH and SALES REP are seeded with the values seen so far;
add any missing ones in the builder (`/build/<id>`).

---

## Security notes

- `service_role` key lives only in server API routes; never shipped to the browser.
- Make holds only `MAKE_API_TOKEN`; rotate it anytime without touching Supabase keys.
- RLS protects direct Supabase access; the API token protects the REST layer.
- Published forms are publicly readable and publicly submittable by design (that's
  how the `/f/<id>` page works for respondents). Unpublished forms are private.

---

## Troubleshooting

- **"supabaseUrl is required" on the live site** → env vars missing in Vercel; add them and redeploy.
- **Can't log in after signup** → email confirmation is on; confirm via email or disable it (Step 1.4).
- **API returns 401** → `MAKE_API_TOKEN` mismatch, or header isn't `Authorization: Bearer <token>`.
- **Make webhook never fires** → the entries webhook (Step 7A) wasn't created, or the URL is wrong.
- **Auth redirects to localhost on prod** → set Site URL / Redirect URLs (Step 5).
