/**
 * Generate a CLAUDE.md file tailored to the chosen architecture.
 *
 * @param {object} opts
 * @param {string} opts.projectName
 * @param {"nextjs"|"vite"} opts.frontend
 * @param {"agno"|"pydantic-ai"} opts.agents
 * @returns {string}
 */
export function generateClaudeMd({ projectName, frontend, agents }) {
  const isNext = frontend === "nextjs";
  const isAgno = agents === "agno";

  const frontendLabel = isNext ? "Next.js (App Router)" : "Vite + React";
  const authPkg = isNext ? "@clerk/nextjs" : "@clerk/clerk-react";
  const agentLabel = isAgno ? "Agno" : "Pydantic AI";
  const envPrefix = isNext ? "NEXT_PUBLIC_" : "VITE_";

  const tree = isNext
    ? `\`\`\`
${projectName}/
├── src/
│   ├── app/                    # Next.js App Router pages & API routes
│   │   ├── api/health/         # Database health check
│   │   ├── api/user/me/        # Get current user
│   │   ├── api/user/sync/      # Sync Clerk user to Supabase
│   │   ├── sign-in/            # Clerk sign-in page
│   │   └── sign-up/            # Clerk sign-up page
│   ├── components/
│   │   ├── providers/          # Theme, Query, Clerk providers
│   │   └── ui/                 # shadcn/ui components
│   ├── db/                     # Supabase client & types
│   ├── hooks/                  # React hooks (useCurrentUser)
│   └── lib/                    # Utilities (cn helper)
├── agents/                     # Python ${agentLabel} service
│   ├── main.py                 # FastAPI server (/health, /chat, /user/sync, /user/me)
│   ├── example_agent.py        # ${agentLabel} streaming agent
│   ├── db.py                   # Supabase Python client
│   └── Dockerfile
├── supabase/
│   ├── config.toml             # Supabase local config
│   └── migrations/             # SQL migrations
├── Dockerfile                  # Next.js multi-stage Docker build
├── docker-compose.yml          # Agent service compose
├── Makefile                    # Dev/build/deploy commands
└── CLAUDE.md
\`\`\``
    : `\`\`\`
${projectName}/
├── src/
│   ├── pages/                  # Route components
│   │   ├── home.tsx            # Landing page
│   │   ├── sign-in.tsx         # Clerk sign-in
│   │   └── sign-up.tsx         # Clerk sign-up
│   ├── components/
│   │   ├── providers/          # Clerk, Query providers
│   │   └── ui/                 # shadcn/ui components
│   ├── hooks/                  # React hooks (useCurrentUser)
│   ├── lib/                    # Utilities (cn, supabase client)
│   ├── main.tsx                # React entry point
│   ├── App.tsx                 # Router + providers
│   └── app.css                 # Tailwind globals
├── agents/                     # Python ${agentLabel} service
│   ├── main.py                 # FastAPI server (/health, /chat, /user/sync, /user/me)
│   ├── example_agent.py        # ${agentLabel} streaming agent
│   ├── db.py                   # Supabase Python client
│   └── Dockerfile
├── supabase/
│   ├── config.toml             # Supabase local config
│   └── migrations/             # SQL migrations
├── index.html                  # Vite HTML entry
├── Dockerfile                  # Vite multi-stage Docker build (nginx)
├── nginx.conf                  # SPA routing config
├── docker-compose.yml          # Agent service compose
├── Makefile                    # Dev/build/deploy commands
└── CLAUDE.md
\`\`\``;

  const userSyncNote = isNext
    ? `- Next.js API routes (\`/api/user/sync\`, \`/api/user/me\`) handle Clerk-to-Supabase user sync server-side
- The agents service also exposes \`/user/sync\` and \`/user/me\` endpoints`
    : `- User sync between Clerk and Supabase is handled by the agents FastAPI service (\`/user/sync\`, \`/user/me\`)
- The frontend calls the agents service directly for user management`;

  return `# CLAUDE.md

## Project Overview

${projectName} is a full-stack application with a **${frontendLabel}** frontend and **${agentLabel}** AI agents, backed by **Supabase** (PostgreSQL).

## Tech Stack

- **Frontend**: ${frontendLabel} with TypeScript, Tailwind CSS 4, shadcn/ui
- **Auth**: Clerk (\`${authPkg}\`)
- **Database**: Supabase (PostgreSQL) with migrations in \`supabase/migrations/\`
- **AI Agents**: ${agentLabel} with FastAPI, streaming SSE responses
- **State Management**: TanStack Query v5
- **Deployment**: Docker (multi-stage builds for both services)

## Project Structure

${tree}

## Key Commands

\`\`\`bash
make setup-all       # Full setup for both frontend and agents
make dev-all         # Start both services concurrently
make dev             # Frontend dev server only (port 3000)
make agents-dev      # Agent service only (port 8080)
make agents-setup    # Create Python venv + install deps
make db-migrate      # Apply pending Supabase migrations
make db-types        # Regenerate TypeScript types from DB schema
make db-new name=x   # Create a new migration file
make clean           # Remove build artifacts
\`\`\`

## Development Workflow

1. Frontend runs on \`http://localhost:3000\`
2. Agent service runs on \`http://localhost:8080\`
3. Frontend calls agent service at \`/chat\` endpoint (SSE streaming)
4. Clerk handles authentication${isNext ? " (keyless mode available locally)" : ""}
5. Supabase provides PostgreSQL database + realtime capabilities

## Environment Variables

- **Frontend**: \`.env.local\` (\`${envPrefix}\` prefixed for client-side vars)
- **Agents**: \`agents/.env\` (API keys, Supabase credentials)

## Architecture Notes

${userSyncNote}
- Agent streaming uses Server-Sent Events (SSE) via FastAPI \`StreamingResponse\`
- ${isAgno ? "Agno" : "Pydantic AI"} agent is in \`agents/example_agent.py\` — customize the system prompt and model there
- Supabase migrations live in \`supabase/migrations/\` — create new ones with \`make db-new name=<name>\`
- Docker Compose runs the agent service; the frontend Dockerfile is separate for deployment
- Both services have independent Dockerfiles for isolated deployment
`;
}
