# tryopenclaw-content — content CMS tooling.
# Chạy `make` (hoặc `make help`) để xem danh sách target.
.DEFAULT_GOAL := help
.PHONY: help install llms build-llms check-llms validate check

help: ## Liệt kê các target
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-13s\033[0m %s\n", $$1, $$2}'

install: ## Cài dependency cho tooling (gray-matter, ajv)
	npm install

build-llms: ## Sinh lại root + per-dir + per-skill llms.txt + llms-full.txt
	node scripts/build-llms.mjs
llms: build-llms ## Alias của build-llms

check-llms: ## Drift-guard: fail nếu llms.txt lệch nội dung nguồn
	node scripts/build-llms.mjs --check

validate: ## Validate frontmatter (ai-providers + connectors + categories) theo _schema.json
	node scripts/validate-content.mjs

check: check-llms validate ## Chạy toàn bộ kiểm tra (giống CI)
