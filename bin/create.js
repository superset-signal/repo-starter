#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ── Argument parsing ──────────────────────────────────────────────────────────

const projectName = process.argv[2];

if (!projectName) {
  console.error("Usage: npx @superset/signal-starter <project-name>");
  process.exit(1);
}

if (!/^[a-z0-9]([a-z0-9\-._]*[a-z0-9])?$/.test(projectName)) {
  console.error(
    `Error: "${projectName}" is not a valid project name.\n` +
      "Use lowercase letters, numbers, hyphens, or dots (no spaces)."
  );
  process.exit(1);
}

const targetDir = path.resolve(process.cwd(), projectName);

if (fs.existsSync(targetDir)) {
  console.error(`Error: Directory "${projectName}" already exists.`);
  process.exit(1);
}

// ── File copy helpers ─────────────────────────────────────────────────────────

/** Files in template root that should be renamed on copy (dotfiles etc.) */
const RENAME_MAP = {
  gitignore: ".gitignore",
  env_example: ".env.example", // used if named env_example
  "env.example": ".env.example",
  npmrc: ".npmrc",
  dockerignore: ".dockerignore",
};

/** Files under agents/ that should be renamed */
const AGENTS_RENAME_MAP = {
  "env.example": ".env.example",
};

/**
 * Recursively copy src → dest, applying rename rules for known filenames.
 * @param {string} src
 * @param {string} dest
 * @param {boolean} inAgents - whether we're currently inside the agents/ subtree
 */
function copyDir(src, dest, inAgents = false) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDir(srcPath, path.join(dest, entry), inAgents || entry === "agents");
    } else {
      const renameMap = inAgents ? AGENTS_RENAME_MAP : RENAME_MAP;
      const destName = renameMap[entry] ?? entry;
      fs.copyFileSync(srcPath, path.join(dest, destName));
    }
  }
}

// ── Placeholder replacement ───────────────────────────────────────────────────

const FILES_TO_PATCH = [
  "package.json",
  "src/app/layout.tsx",
  "README.md",
  "agents/main.py",
  "agents/pyproject.toml",
];

function replaceProjectName(filePath, name) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  const updated = content.split("PROJECT_NAME").join(name);
  fs.writeFileSync(filePath, updated, "utf8");
}

// ── Main ──────────────────────────────────────────────────────────────────────

const templateDir = path.join(__dirname, "..", "template");

console.log(`\nScaffolding "${projectName}"...`);

copyDir(templateDir, targetDir);

for (const rel of FILES_TO_PATCH) {
  replaceProjectName(path.join(targetDir, rel), projectName);
}

// Write a README if one wasn't in the template
const readmePath = path.join(targetDir, "README.md");
if (!fs.existsSync(readmePath)) {
  fs.writeFileSync(
    readmePath,
    `# ${projectName}\n\nScaffolded with [signal-starter](https://github.com/superset/signal-starter).\n`,
    "utf8"
  );
}

console.log(`
✅  "${projectName}" is ready!

── Get started ───────────────────────────────────────────
  cd ${projectName}
  cp .env.example .env.local
  make agents-setup                  # Python venv + deps
  make setup                         # pnpm install + db push
  make dev-all                       # start both services

── Supabase (required) ───────────────────────────────────
  1. Create a project at https://supabase.com
  2. Settings → Database → copy the two connection strings:
       DATABASE_URL  (transaction mode, port 6543)
       DIRECT_URL    (direct connection, port 5432)
  3. Paste both into .env.local
  4. Run: make setup   (pushes the Drizzle schema)

── Clerk (optional) ──────────────────────────────────────
  Clerk runs in keyless mode locally — no keys needed to
  get started. When you're ready to go to production:

  1. Create an app at https://clerk.com
  2. Copy NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY
     into .env.local
  3. Dashboard → Webhooks → Add Endpoint:
       URL:    https://your-domain.com/api/webhooks/clerk
       Events: user.created, user.updated
       Copy the signing secret → CLERK_WEBHOOK_SECRET

── Northflank (optional — deploy when ready) ─────────────
  Two services to create in your Northflank project:

  Next.js (Dockerfile in repo root)
    Port: 3000
    Build arg + env: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    Env: CLERK_SECRET_KEY, CLERK_WEBHOOK_SECRET,
         DATABASE_URL, DIRECT_URL

  Agents (agents/Dockerfile)
    Port: 8080  — set to internal-only
    Env: OPENAI_API_KEY, SUPABASE_URL,
         SUPABASE_SERVICE_ROLE_KEY

  After first deploy → update your Clerk webhook URL to
  your Northflank domain.

──────────────────────────────────────────────────────────
`);
