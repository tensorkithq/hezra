.PHONY: build run clean test test-integration dev install fmt lint tidy help
.PHONY: vet check setup env-check deps-update install-tools

# Binary name
BINARY_NAME=moniewave
BUILD_DIR=bin
MODULE_NAME=paystack.mpc.proxy

# Version and build info
VERSION?=$(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
BUILD_TIME=$(shell date -u '+%Y-%m-%d_%H:%M:%S')
COMMIT_HASH=$(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Build flags
LDFLAGS=-ldflags "-X main.Version=$(VERSION) -X main.BuildTime=$(BUILD_TIME) -X main.CommitHash=$(COMMIT_HASH)"

# Include .env file if it exists
ifneq (,$(wildcard .env))
    include .env
    export
endif

# Default target
.DEFAULT_GOAL := help

## help: Show this help message
help:
	@echo "Available targets:"
	@echo ""
	@echo "  Development:"
	@echo "    make dev          - Run in development mode with auto-reload (requires air)"
	@echo "    make run          - Build and run the application"
	@echo "    make build        - Build the application binary"
	@echo ""
	@echo "  Testing:"
	@echo "    make test         - Run unit tests"
	@echo "    make test-integration - Run integration tests (requires running server)"
	@echo ""
	@echo "  Code Quality:"
	@echo "    make fmt          - Format code with go fmt"
	@echo "    make lint         - Run linter (golangci-lint)"
	@echo "    make vet          - Run go vet"
	@echo "    make check        - Run all checks (fmt, vet, lint, test)"
	@echo ""
	@echo "  Dependencies:"
	@echo "    make install      - Download dependencies"
	@echo "    make tidy         - Tidy and verify go.mod"
	@echo "    make deps-update  - Update all dependencies"
	@echo ""
	@echo "  Setup & Utilities:"
	@echo "    make setup        - Initial project setup (creates .env, installs deps)"
	@echo "    make env-check    - Verify environment variables"
	@echo "    make clean        - Remove build artifacts"
	@echo "    make install-tools - Install development tools"
	@echo ""

## build: Build the application
build:
	@echo "Building $(BINARY_NAME) $(VERSION)..."
	@mkdir -p $(BUILD_DIR)
	@go build $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME) ./cmd/server

## run: Run the application (automatically loads .env if it exists)
run: build
	@echo "Running $(BINARY_NAME)..."
	@./$(BUILD_DIR)/$(BINARY_NAME)

## dev: Development mode (with auto-reload using air if installed, otherwise just run)
dev:
	@if command -v air > /dev/null; then \
		air; \
	else \
		echo "Air not found. Install with: go install github.com/cosmtrek/air@latest"; \
		echo "Running normally..."; \
		$(MAKE) run; \
	fi

## clean: Clean build artifacts
clean:
	@echo "Cleaning..."
	@rm -rf $(BUILD_DIR)
	@rm -f $(BINARY_NAME)
	@rm -f coverage.out coverage.html
	@find . -type f -name '*.test' -delete

## test: Run unit tests
test:
	@echo "Running unit tests..."
	@go test -v ./...

## test-integration: Run integration tests (starts server automatically)
test-integration: env-check
	@echo "Running integration tests..."
	@bash ./scripts/test-integration.sh

## install: Install dependencies
install:
	@echo "Installing dependencies..."
	@go mod download

## fmt: Format code
fmt:
	@echo "Formatting code..."
	@go fmt ./...
	@echo "Running goimports..."
	@if command -v goimports > /dev/null; then \
		goimports -w .; \
	else \
		echo "goimports not installed. Install with: go install golang.org/x/tools/cmd/goimports@latest"; \
	fi

## lint: Run linter (requires golangci-lint)
lint:
	@echo "Running linter..."
	@if command -v golangci-lint > /dev/null; then \
		golangci-lint run --timeout 5m; \
	else \
		echo "golangci-lint not installed. Install from: https://golangci-lint.run/usage/install/"; \
		exit 1; \
	fi

## vet: Run go vet
vet:
	@echo "Running go vet..."
	@go vet ./...

## check: Run all checks (fmt, vet, lint, test)
check: fmt vet lint test
	@echo "All checks passed!"

## tidy: Tidy go.mod
tidy:
	@echo "Tidying go.mod..."
	@go mod tidy
	@go mod verify

## deps-update: Update dependencies
deps-update:
	@echo "Updating dependencies..."
	@go get -u ./...
	@go mod tidy
	@go mod verify

## setup: Initial project setup
setup:
	@echo "Setting up project..."
	@if [ ! -f .env ]; then \
		echo "Creating .env from .env.example..."; \
		cp .env.example .env; \
		echo "Please edit .env and add your PAYSTACK_SECRET_KEY"; \
	else \
		echo ".env already exists"; \
	fi
	@$(MAKE) install
	@echo "Verifying dependencies..."
	@go mod verify
	@echo "Setup complete!"

## env-check: Verify environment variables
env-check:
	@echo "Checking environment variables..."
	@if [ -z "$(PAYSTACK_SECRET_KEY)" ]; then \
		echo "ERROR: PAYSTACK_SECRET_KEY is not set"; \
		echo "Please set it in your .env file or export it:"; \
		echo "  export PAYSTACK_SECRET_KEY=sk_test_your_key_here"; \
		exit 1; \
	else \
		echo "✓ PAYSTACK_SECRET_KEY is set"; \
	fi

## install-tools: Install development tools
install-tools:
	@echo "Installing development tools..."
	@echo "Installing air (hot reload)..."
	@go install github.com/cosmtrek/air@latest
	@echo "Installing golangci-lint..."
	@go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@echo "Installing goimports..."
	@go install golang.org/x/tools/cmd/goimports@latest
	@echo "Installing staticcheck..."
	@go install honnef.co/go/tools/cmd/staticcheck@latest
	@echo "All tools installed!"
