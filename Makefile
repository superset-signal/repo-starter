.PHONY: help release release-minor release-major

# —— Help ——

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# —— Release ——

release: ## Bump patch version, tag, and push (triggers npm publish via CI)
	npm version patch
	git push --follow-tags

release-minor: ## Bump minor version, tag, and push
	npm version minor
	git push --follow-tags

release-major: ## Bump major version, tag, and push
	npm version major
	git push --follow-tags
