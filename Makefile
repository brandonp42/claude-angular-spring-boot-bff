.PHONY: help up down restart build logs \
       infra infra-down \
       bff-run frontend-run frontend-install \
       clean clean-all

COMPOSE := podman-compose
COMPOSE_FILE := podman-compose.yml
COMPOSE_INFRA := podman-compose.infra.yml

##@ General
help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} \
		/^[a-zA-Z_-]+:.*##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

##@ Full Compose (all services in containers)
build: ## Build all container images
	$(COMPOSE) -f $(COMPOSE_FILE) build

up: ## Start all services (build if needed)
	$(COMPOSE) -f $(COMPOSE_FILE) up --build -d

down: ## Stop and remove all services
	$(COMPOSE) -f $(COMPOSE_FILE) down

restart: down up ## Restart all services

logs: ## Tail logs for all services
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f

logs-bff: ## Tail BFF logs only
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f bff

logs-frontend: ## Tail frontend logs only
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f frontend

logs-keycloak: ## Tail Keycloak logs only
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f keycloak

##@ Local Development (Keycloak + Redis in containers, BFF + Angular on host)
infra: ## Start infrastructure only (Keycloak + Redis)
	$(COMPOSE) -f $(COMPOSE_INFRA) up -d

infra-down: ## Stop infrastructure
	$(COMPOSE) -f $(COMPOSE_INFRA) down

frontend-install: ## Install frontend npm dependencies
	cd frontend && npm install

frontend-run: ## Run Angular dev server on host
	cd frontend && npm start

bff-run: ## Run BFF on host with local profile
	cd bff && mvn spring-boot:run -Dspring-boot.run.profiles=local

##@ Cleanup
clean: ## Remove build artifacts
	cd bff && mvn clean -q 2>/dev/null || true
	rm -rf frontend/dist frontend/.angular

clean-all: clean down infra-down ## Remove everything (artifacts + containers)
	$(COMPOSE) -f $(COMPOSE_FILE) down --rmi local -v 2>/dev/null || true
	$(COMPOSE) -f $(COMPOSE_INFRA) down -v 2>/dev/null || true

.DEFAULT_GOAL := help
