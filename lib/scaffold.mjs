import fs from "node:fs";
import path from "node:path";

/** Files that should be renamed on copy (dotfiles that can't be stored as-is in npm) */
const RENAME_MAP = {
  gitignore: ".gitignore",
  env_example: ".env.example",
  "env.example": ".env.example",
  npmrc: ".npmrc",
  dockerignore: ".dockerignore",
};

/** Files containing PROJECT_NAME placeholder, keyed by frontend choice */
const FILES_TO_PATCH = {
  nextjs: [
    "package.json",
    "src/app/layout.tsx",
    "agents/main.py",
    "agents/pyproject.toml",
    "supabase/config.toml",
  ],
  vite: [
    "package.json",
    "index.html",
    "README.md",
    "agents/main.py",
    "agents/pyproject.toml",
    "supabase/config.toml",
  ],
};

/**
 * Recursively copy src → dest, applying rename rules for known filenames.
 */
export function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDir(srcPath, path.join(dest, entry));
    } else {
      const destName = RENAME_MAP[entry] ?? entry;
      fs.copyFileSync(srcPath, path.join(dest, destName));
    }
  }
}

/**
 * Replace all occurrences of PROJECT_NAME in a file with the actual project name.
 */
function replaceProjectName(filePath, name) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  const updated = content.split("PROJECT_NAME").join(name);
  fs.writeFileSync(filePath, updated, "utf8");
}

/**
 * Scaffold a new project by composing template layers.
 *
 * @param {object} opts
 * @param {string} opts.targetDir  - absolute path to the new project directory
 * @param {string} opts.projectName - the project name (used for placeholder replacement)
 * @param {string} opts.frontend   - "nextjs" | "vite"
 * @param {string} opts.agents     - "agno" | "pydantic-ai"
 * @param {string} opts.templatesDir - absolute path to the templates/ directory
 */
export function scaffold({ targetDir, projectName, frontend, agents, templatesDir }) {
  // Layer 1: base (shared files — supabase, gitignore, etc.)
  copyDir(path.join(templatesDir, "base"), targetDir);

  // Layer 2: frontend-specific files
  copyDir(path.join(templatesDir, "frontends", frontend), targetDir);

  // Layer 3: agent-specific files
  copyDir(path.join(templatesDir, "agents", agents), targetDir);

  // Replace PROJECT_NAME placeholders
  const filesToPatch = FILES_TO_PATCH[frontend] || FILES_TO_PATCH.nextjs;
  for (const rel of filesToPatch) {
    replaceProjectName(path.join(targetDir, rel), projectName);
  }
}
