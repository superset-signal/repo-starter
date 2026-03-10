# @superset/signal-starter

Scaffold a full-stack app with:

- **Next.js 15** (App Router, TypeScript, Tailwind CSS 4, shadcn/ui)
- **Agno agents** (Python / FastAPI, streaming SSE)
- **Supabase** via Drizzle ORM + postgres.js
- **Clerk** authentication
- **Docker** + **Makefile** for local development

## Quick start

```bash
npx @superset/signal-starter my-app
cd my-app
```

Then follow the setup sections below to configure Clerk and Supabase before running the app.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, Tailwind 4, shadcn/ui |
| State | TanStack Query v5 |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) + Drizzle ORM |
| Agents | Agno + FastAPI + OpenAI |
| Deployment | Docker (multi-stage Next.js + Python builds) |

---

## Setting up Clerk

1. **Create an application** at [clerk.com](https://clerk.com). Choose your sign-in methods (email, Google, GitHub, etc.).

2. **Copy your API keys** from the Clerk dashboard → API Keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — starts with `pk_test_` or `pk_live_`
   - `CLERK_SECRET_KEY` — starts with `sk_test_` or `sk_live_`

3. **Configure redirect URLs** in Clerk → Settings → Paths (these match the template defaults):
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/`
   - After sign-up: `/`

4. **Set up the webhook** so Clerk syncs users to your database:
   - Go to Clerk → Webhooks → Add Endpoint
   - URL: `https://your-domain.com/api/webhooks/clerk`
   - Subscribe to events: `user.created`, `user.updated`
   - Copy the **Signing Secret** (`whsec_...`) → `CLERK_WEBHOOK_SECRET`
   - For local development, use [ngrok](https://ngrok.com) or the [Clerk CLI](https://clerk.com/docs/testing/webhooks) to tunnel the webhook to localhost

5. **Protect routes** by adding patterns to `src/middleware.ts`. The template protects `/dashboard(.*)` and `/app(.*)` by default.

---

## Setting up Supabase

1. **Create a project** at [supabase.com](https://supabase.com). Note your project's region — choose one close to your deployment.

2. **Get your connection strings** from Supabase → Settings → Database → Connection string:
   - **Transaction mode** (port `6543`, pgBouncer) → `DATABASE_URL` — used at runtime by the app
   - **Direct connection** (port `5432`) → `DIRECT_URL` — used by Drizzle migrations only

   Both strings look like:
   ```
   postgresql://postgres.PROJECTREF:PASSWORD@aws-0-REGION.pooler.supabase.com:PORT/postgres
   ```

3. **Get the service role key** (only needed for the agents service if using `db.py`):
   - Supabase → Settings → API → `service_role` secret
   - Copy to `agents/.env` as `SUPABASE_SERVICE_ROLE_KEY`
   - Also copy the Project URL as `SUPABASE_URL`

4. **Push the schema**:
   ```bash
   make setup     # runs pnpm install then drizzle-kit push
   ```
   Or manually:
   ```bash
   pnpm db:push
   ```

5. **Row Level Security** — Supabase enables RLS by default. If you add tables, remember to add policies or disable RLS for tables accessed server-side via the service role.

---

## Environment variables

Copy the example files and fill in your keys:

```bash
cp env.example .env.local
cp agents/env.example agents/.env
```

### `.env.local` (Next.js)

```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase / PostgreSQL
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:5432/postgres
```

### `agents/.env`

```
OPENAI_API_KEY=sk-...

# Anthropic (optional)
ANTHROPIC_API_KEY=sk-ant-...

# Supabase (optional — only needed if using db.py)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Local development

```bash
make agents-setup   # create Python venv + install deps
make setup          # pnpm install + db push
make dev-all        # start Next.js (3000) + FastAPI (8080) concurrently
```

### Make targets

```
make setup          # pnpm install + db push
make dev            # Next.js dev server only
make agents-setup   # Python venv + install
make agents-dev     # FastAPI dev server only
make dev-all        # both services concurrently
make db-push        # push Drizzle schema
make db-studio      # open Drizzle Studio
```

---

## Deploying to Northflank

Northflank can run both services from the Docker images included in the template. You will create two services: one for the Next.js app and one for the FastAPI agents.

### Prerequisites

- A [Northflank](https://northflank.com) account and project
- Your Docker images pushed to a registry (Northflank's built-in registry, Docker Hub, or GHCR)

### 1. Build and push images

Northflank can build directly from your repo using its CI, or you can push pre-built images. To use Northflank's build service, connect your Git repo and point it at the relevant `Dockerfile`.

There are two Dockerfiles:
- `Dockerfile` — multi-stage Next.js build, exposes port `3000`
- `agents/Dockerfile` — Python/uvicorn build, exposes port `8080`

### 2. Deploy the Next.js service

1. In your Northflank project, create a **Deployment service**
2. Select your image or connect the repo with build path `/Dockerfile`
3. Set the **port** to `3000`
4. Add the following **environment variables** (mark sensitive values as secret):

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` |
   | `CLERK_SECRET_KEY` | `sk_live_...` |
   | `CLERK_WEBHOOK_SECRET` | `whsec_...` |
   | `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
   | `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
   | `DATABASE_URL` | Supabase transaction mode URL |
   | `DIRECT_URL` | Supabase direct connection URL |

   > **Note:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is a build-time arg in the Dockerfile (`ARG`). Pass it as a build argument in Northflank's build settings as well as a runtime env var.

5. Assign a custom domain or use the Northflank-provided subdomain

### 3. Deploy the agents service

1. Create a second **Deployment service**
2. Select your image or connect the repo with build path `/agents/Dockerfile`
3. Set the **port** to `8080`
4. Add environment variables:

   | Variable | Value |
   |---|---|
   | `OPENAI_API_KEY` | `sk-...` |
   | `ANTHROPIC_API_KEY` | `sk-ant-...` (if used) |
   | `SUPABASE_URL` | `https://xxx.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | service role secret |

5. This service does not need to be publicly exposed — you can make it **internal only** and call it from the Next.js service via Northflank's internal DNS

### 4. Update Clerk webhook URL

Once deployed, update your Clerk webhook endpoint URL from `localhost` to your production domain:

```
https://your-app.northflank.app/api/webhooks/clerk
```

### 5. Run database migrations

After the first deploy, run the Drizzle migration against the production database:

```bash
DATABASE_URL=<direct_url> pnpm db:push
```

Or connect to your Northflank service's shell and run it from there.
