# create-signal-app

Interactive CLI to scaffold a full-stack agentic app with your choice of frontend and AI agent framework, always backed by Supabase.

## Quick start

```bash
npx @superset-signal/starter init
```

The CLI will ask for your project name (defaults to the current folder name), then let you pick your frontend and agent framework with arrow keys.

## Options

| Choice | Options |
|---|---|
| **Frontend** | Next.js (App Router, SSR, API routes) or Vite + React (SPA, nginx deploy) |
| **AI Agents** | Agno (lightweight, streaming-first) or Pydantic AI (type-safe, structured outputs) |
| **Database** | Supabase (PostgreSQL) — always included |
| **Auth** | Clerk — always included |

A `CLAUDE.md` is auto-generated based on your architecture choices.

## Non-interactive mode

For CI or scripted usage, pass all options as flags:

```bash
npx @superset-signal/starter init my-app --frontend=nextjs --agents=agno -y
npx @superset-signal/starter init my-app --frontend=vite --agents=pydantic-ai -y
```

## Stack details

### Next.js frontend

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4, shadcn/ui
- Clerk (`@clerk/nextjs`) with keyless mode for local dev
- Supabase client with server-side service role
- TanStack Query v5
- Multi-stage Dockerfile (Node.js standalone)

### Vite frontend

- Vite + React 19, TypeScript
- Tailwind CSS 4, shadcn/ui
- Clerk (`@clerk/clerk-react`)
- Supabase client with anon key
- react-router-dom v7
- TanStack Query v5
- Multi-stage Dockerfile (nginx)

### Agno agents

- Python 3.12, FastAPI, streaming SSE
- Agno agent framework with OpenAI
- Supabase Python client
- Dockerfile (uvicorn)

### Pydantic AI agents

- Python 3.12, FastAPI, streaming SSE
- Pydantic AI agent framework with OpenAI
- Supabase Python client
- Dockerfile (uvicorn)

## After scaffolding

```bash
cd my-app
cp .env.example .env.local
make agents-setup          # Python venv + deps
make setup                 # pnpm install + db migrate
make dev-all               # Start both services
```

## Prerequisites

- **Node.js** >= 18
- **Python** >= 3.12
- **pnpm** (`npm install -g pnpm`)

## License

MIT
