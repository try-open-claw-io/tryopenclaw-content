# tryopenclaw-content — tooling.
.PHONY: install llms

install: ## Cài dependency cho generator (gray-matter)
	npm install

llms: ## Sinh lại root + per-dir + per-skill llms.txt + llms-full.txt
	node scripts/build-llms.mjs
