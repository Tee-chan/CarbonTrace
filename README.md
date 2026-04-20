# CarbonTrace 🌍

> Your AI-powered personal carbon accountability agent.

CarbonTrace automatically tracks your carbon footprint by scanning your Gmail inbox. No manual data entry — the agent reads your receipts, flight confirmations, and food delivery orders, then uses Google Gemini to classify each activity and estimate its CO₂ emissions.

## Live Demo

🔗 [carbontrace.vercel.app](https://carbontrace.vercel.app)

---

## What It Does

1. **Sign in with Google** via Auth0 for Agents
2. **Grant Gmail read-only access** — the agent scans on your behalf
3. **Gemini classifies your emails** — flights, rides, food orders, shopping
4. **See your carbon dashboard** — total CO₂, category breakdown, AI nudge
5. **Data persists in Supabase** — your history is there every time you return

---

## Tech Stack

| Technology | Version | Role |
|---|---|---|
| Next.js | 15.3.3 | App framework |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Styling |
| Auth0 for Agents | 4.0.1 | Authentication + Gmail OAuth |
| Google Gemini | 2.5 Flash | Email AI classification |
| Supabase | Latest | Postgres database |
| Vercel | — | Deployment |
| pnpm | Latest | Package manager |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Auth0 account
- Google AI Studio account (Gemini API key)
- Supabase account

### 1. Clone the repository

```bash
git clone https://github.com/tee-chan/carbontrace.git
cd carbontrace
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root of the project:

```bash
# Auth0
AUTH0_SECRET=your_generated_secret
AUTH0_DOMAIN=yourname.us.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
APP_BASE_URL=http://localhost:3000

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

Generate your `AUTH0_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Set up the database

Run this SQL in your Supabase SQL Editor:

```sql
create table carbon_logs (
  id uuid default gen_random_uuid() primary key,
  user_email text not null,
  activity text not null,
  category text not null,
  co2_kg numeric not null,
  confidence text,
  spend_amount text,
  receipt_date text,
  created_at timestamp default now()
);

alter table carbon_logs enable row level security;

create policy "Users see own logs" on carbon_logs
  for all using (user_email = current_user);
```

### 5. Configure Auth0

In your Auth0 dashboard under **Applications → Settings**:

```
Allowed Callback URLs:  http://localhost:3000/auth/callback
Allowed Logout URLs:    http://localhost:3000
Allowed Web Origins:    http://localhost:3000
```

Enable Google social login under **Authentication → Social**.

### 6. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
carbontrace/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Landing page
│   │   ├── dashboard/
│   │   │   ├── page.tsx              # Dashboard server component
│   │   │   └── DashboardClient.tsx   # Dashboard client component
│   │   └── api/
│   │       └── scan/
│   │           └── route.ts          # Core agent — Gemini + Supabase
│   ├── lib/
│   │   ├── auth0.ts                  # Auth0 client
│   │   └── supabase.ts               # Supabase client
│   └── components/
│       └── ScanSection.tsx           # Scan button + results UI
├── middleware.ts                     # Auth0 v4 middleware
├── .env.local                        # Environment variables (never commit)
└── README.md
```

---

## How It Works

```
User clicks Scan
      ↓
POST /api/scan
      ↓
Auth0 checks session → Unauthorized? Return 401
      ↓
Fetch emails from Gmail API (or mock data)
      ↓
Send emails to Gemini 2.5 Flash with structured schema
      ↓
Gemini returns: activities + CO₂ estimates + nudge
      ↓
Save each activity to Supabase carbon_logs
      ↓
Return JSON to dashboard
      ↓
Dashboard renders: total CO₂ + breakdown + nudge
```

---

## Environment Variables Reference

| Variable | Description |
|---|---|
| `AUTH0_SECRET` | 32-byte random hex string |
| `AUTH0_DOMAIN` | Your Auth0 tenant domain (no https://) |
| `AUTH0_CLIENT_ID` | Auth0 application client ID |
| `AUTH0_CLIENT_SECRET` | Auth0 application client secret |
| `APP_BASE_URL` | Your app URL (localhost or Vercel URL) |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_KEY` | Supabase Service Role Key (bypasses RLS strictly on the backend API layer) |

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full Vercel deployment instructions.

---

## Security

- Raw email content is **never stored** — only extracted CO₂ data is persisted
- Gmail scope is limited to `gmail.readonly` — no write access
- Auth0 tokens stored in httpOnly cookies — never localStorage
- Supabase Row Level Security — users can only access their own data
- All secrets in environment variables — nothing hardcoded

---

## Built With

- [Next.js](https://nextjs.org)
- [Auth0 for Agents](https://auth0.com)
- [Google Gemini](https://ai.google.dev)
- [Supabase](https://supabase.com)
- [Vercel](https://vercel.com)

---

## License

MIT

---

Built for the **Earth Day 2026 Developer Challenge** 🌱