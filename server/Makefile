# ---------- Local ----------

.PHONY: lint
lint:
ifdef fix
	@cargo fmt --all
	@cargo clippy --fix

else
	@cargo fmt --all --check
	@cargo clippy
endif

.PHONY: serve
start:
	@cargo run


# ---------- Docker ----------

.PHONY: build
build:
	@docker build -t web_file_browser_server .

.PHONY: clean
clean:
	@docker-compose down -v

.PHONY: logs
logs:
	@docker-compose logs -f

.PHONY: shell
shell:
	@docker-compose exec api sh

.PHONY: start
start:
	@docker-compose up -d

.PHONY: status
status:
	@echo "Running services:"
	@docker ps --filter name=livestream --format "table {{.Names}}\t{{.RunningFor}}\t{{.Status}}"

.PHONY: stop
stop:
	@docker-compose down

# Catch-all target which does nothing
%:
	@:
