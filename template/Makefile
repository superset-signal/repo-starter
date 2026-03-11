.PHONY: help install setup dev build lint db-migrate db-pull db-reset db-types \
       agents-setup agents-dev agents-docker agents-docker-down \
       setup-all dev-all clean

# —— Help ——

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# —— Next.js ——

install: ## Install Node dependencies
	pnpm install

setup: install db-migrate ## Full Next.js setup (install + run migrations)
	@echo "\n✅ Next.js setup complete. Add your keys to .env.local, then run: make dev"

dev: ## Start Next.js dev server
	pnpm dev

build: ## Production build
	pnpm build

lint: ## Run ESLint
	pnpm lint

# —— Database ——

db-migrate: ## Apply pending migrations to remote database
	pnpm db:migrate

db-pull: ## Pull schema from remote database and create migration
	pnpm db:pull

db-reset: ## Reset database (re-run all migrations from scratch)
	pnpm db:reset

db-types: ## Regenerate TypeScript types from database schema
	pnpm db:types

db-new: ## Create a new migration file (usage: make db-new name=add_posts)
	supabase migration new $(name)

# —— Agno Agents ——

agents-setup: ## Set up the Python agent service (create venv + install deps)
	cd agents && python3 -m venv .venv && \
		. .venv/bin/activate && \
		pip install -e .
	@if [ ! -f agents/.env ]; then cp agents/.env.example agents/.env; echo "\n⚠️  Created agents/.env from .env.example — fill in your keys"; fi
	@echo "\n✅ Agent setup complete."

agents-dev: ## Run the agent service locally (no Docker)
	cd agents && . .venv/bin/activate && uvicorn main:app --reload --port 8080

agents-docker: ## Start the agent service via Docker Compose
	docker compose up --build -d

agents-docker-down: ## Stop the agent service
	docker compose down

# —— Combined ——

setup-all: setup agents-setup ## Full setup for both Next.js and agents
	@echo "\n✅ All services set up. Configure .env.local and agents/.env, then run: make dev-all"

dev-all: ## Start both Next.js and the agent service concurrently
	@echo "Starting agent service..."
	@cd agents && . .venv/bin/activate && uvicorn main:app --reload --port 8080 &
	@echo "Starting Next.js..."
	@pnpm dev

clean: ## Remove build artifacts and generated files
	rm -rf .next node_modules agents/.venv agents/__pycache__
