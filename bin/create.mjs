#!/usr/bin/env node

import {
  intro,
  outro,
  text,
  select,
  confirm,
  spinner,
  note,
  isCancel,
} from "@clack/prompts";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scaffold } from "../lib/scaffold.mjs";
import { generateClaudeMd } from "../lib/generate-claude-md.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesDir = path.join(__dirname, "..", "templates");

// ── Argument parsing ────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { command: null, projectName: null, frontend: null, agents: null, yes: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--frontend=")) {
      const val = arg.split("=")[1];
      if (val === "nextjs" || val === "vite") args.frontend = val;
    } else if (arg.startsWith("--agents=")) {
      const val = arg.split("=")[1];
      if (val === "agno" || val === "pydantic-ai") args.agents = val;
    } else if (arg === "--yes" || arg === "-y") {
      args.yes = true;
    } else if (!arg.startsWith("-") && !args.command) {
      args.command = arg;
    } else if (!arg.startsWith("-")) {
      args.projectName = arg;
    }
  }
  return args;
}

function cancel(message = "Operation cancelled.") {
  outro(message);
  process.exit(0);
}

// ── Validation ──────────────────────────────────────────────────────────────

const NAME_RE = /^[a-z0-9]([a-z0-9\-._]*[a-z0-9])?$/;

function validateProjectName(value) {
  if (!value || value.trim().length === 0) return "Project name is required.";
  if (!NAME_RE.test(value))
    return "Use lowercase letters, numbers, hyphens, or dots (no spaces).";
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const cliArgs = parseArgs(process.argv);

  // Require the `init` subcommand
  if (cliArgs.command !== "init") {
    console.log(`
  Usage: signal-starter init [project-name] [options]

  Options:
    --frontend=nextjs|vite          Frontend framework
    --agents=agno|pydantic-ai       AI agent framework
    -y, --yes                       Skip confirmation prompt

  Examples:
    npx @superset-signal/starter init
    npx @superset-signal/starter init my-app
    npx @superset-signal/starter init my-app --frontend=nextjs --agents=agno -y
`);
    process.exit(cliArgs.command ? 1 : 0);
  }

  intro("create-signal-app");

  // 1. Project name — defaults to current folder name
  const defaultName = path.basename(process.cwd());
  let projectName = cliArgs.projectName;
  if (!projectName) {
    const result = await text({
      message: "What is your project name?",
      placeholder: defaultName,
      defaultValue: defaultName,
      validate: validateProjectName,
    });
    if (isCancel(result)) cancel();
    projectName = result;
  } else {
    const err = validateProjectName(projectName);
    if (err) {
      outro(`Error: ${err}`);
      process.exit(1);
    }
  }

  // Scaffold into cwd if name matches current folder, otherwise create subdir
  const cwd = process.cwd();
  const cwdName = path.basename(cwd);
  const scaffoldInPlace = projectName === cwdName;
  const targetDir = scaffoldInPlace ? cwd : path.resolve(cwd, projectName);

  if (!scaffoldInPlace && fs.existsSync(targetDir)) {
    outro(`Error: Directory "${projectName}" already exists.`);
    process.exit(1);
  }

  // 2. Frontend selection
  let frontend = cliArgs.frontend;
  if (!frontend) {
    const result = await select({
      message: "Which frontend framework?",
      options: [
        {
          value: "nextjs",
          label: "Next.js",
          hint: "App Router, SSR, API routes",
        },
        {
          value: "vite",
          label: "Vite + React",
          hint: "SPA, fast dev server, nginx deploy",
        },
      ],
    });
    if (isCancel(result)) cancel();
    frontend = result;
  }

  // 3. Agent framework selection
  let agents = cliArgs.agents;
  if (!agents) {
    const result = await select({
      message: "Which AI agent framework?",
      options: [
        {
          value: "agno",
          label: "Agno",
          hint: "lightweight, streaming-first",
        },
        {
          value: "pydantic-ai",
          label: "Pydantic AI",
          hint: "type-safe, structured outputs",
        },
      ],
    });
    if (isCancel(result)) cancel();
    agents = result;
  }

  // 4. Summary
  const frontendLabel = frontend === "nextjs" ? "Next.js" : "Vite + React";
  const agentLabel = agents === "agno" ? "Agno" : "Pydantic AI";

  note(
    [
      `Project:   ${projectName}`,
      `Directory: ${scaffoldInPlace ? "." : projectName}`,
      `Frontend:  ${frontendLabel}`,
      `Agents:    ${agentLabel}`,
      `Database:  Supabase (PostgreSQL)`,
    ].join("\n"),
    "Your stack"
  );

  // 5. Confirmation (skip with --yes flag)
  if (!cliArgs.yes) {
    const shouldProceed = await confirm({
      message: "Scaffold this project?",
    });
    if (isCancel(shouldProceed) || !shouldProceed) cancel();
  }

  // 6. Scaffold
  const s = spinner();

  s.start("Copying template files...");
  scaffold({ targetDir, projectName, frontend, agents, templatesDir });
  s.stop("Template files copied.");

  s.start("Generating CLAUDE.md...");
  const claudeMd = generateClaudeMd({ projectName, frontend, agents });
  fs.writeFileSync(path.join(targetDir, "CLAUDE.md"), claudeMd, "utf8");
  s.stop("CLAUDE.md generated.");

  // 7. Next steps
  const isNext = frontend === "nextjs";
  const envKeyName = isNext
    ? "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    : "VITE_CLERK_PUBLISHABLE_KEY";

  const cdStep = scaffoldInPlace ? [] : [`cd ${projectName}`];

  note(
    [
      ...cdStep,
      `cp .env.example .env.local`,
      `make agents-setup          # Python venv + deps`,
      `make setup                 # pnpm install + db migrate`,
      `make dev-all               # Start both services`,
      ``,
      `Supabase: Create a project at https://supabase.com`,
      `  Copy connection strings into .env.local`,
      ``,
      `Clerk: ${isNext ? "Runs in keyless mode locally — no keys needed to start" : `Set ${envKeyName} in .env.local`}`,
      `  For production: create an app at https://clerk.com`,
    ].join("\n"),
    "Next steps"
  );

  outro(`"${projectName}" is ready — happy building!`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
