# Documentation Index - Paystack Go MCP Server

This folder contains comprehensive documentation about the `apps/server` directory structure, all available handlers/tools, and integration patterns for testing.

## Documents Overview

### 1. SUMMARY.md
**Quick Executive Summary** (2,500 words)
- Project overview and key findings
- Architecture summary
- Handler organization (8 domains, 13 tools)
- File structure and organization
- Build/deployment information
- Testing recommendations
- Design highlights and limitations

**Best for**: Getting oriented quickly, understanding the big picture

### 2. apps_server_overview.md
**Comprehensive Technical Guide** (3,500+ words)
- Detailed project overview
- Complete directory structure with descriptions
- All 8 handler domains with:
  - Available endpoints
  - Request parameters
  - Response formats
  - Example requests/responses
- Configuration and environment setup
- Database schema and migrations
- Paystack SDK integration details
- Handler pattern explanations
- Server startup and middleware setup
- Building and running instructions
- Testing information
- Development tools and commands
- Dependencies list
- Error handling
- Key design patterns
- Integration with Moniewave monorepo
- Summary of all 14 available tools

**Best for**: Deep dive into implementation, setting up development environment, understanding all available endpoints

### 3. quick_reference.md
**Quick API Reference** (1,000+ words)
- Server endpoints summary table
- Health check endpoint
- Request/response examples with curl
- Workflow examples (Payment, Transfer, Account Status)
- Error response formats
- Configuration quick setup
- Development commands
- SDK services quick reference
- Important implementation notes

**Best for**: Quick lookups, copy-paste examples, API reference while developing

### 4. integration_patterns.md
**Testing and Integration Guide** (2,500+ words)
- 4 complete workflow patterns:
  1. Customer Payment Flow
  2. Account Transfer Flow
  3. Subscription Management Flow
  4. Utility Operations Flow
- Step-by-step workflow breakdowns
- Assertions for each workflow
- Common test scenarios (success, failure, edge cases)
- Test data setup and fixtures
- Key handler patterns
- SDK method mapping table
- Response DTO structure
- Integration test structure recommendations
- Debugging tips
- Performance considerations

**Best for**: Creating integration tests, understanding workflows, test-driven development

---

## Quick Start Guide

### 1. First Time? Start Here:
```
1. Read: SUMMARY.md (5 min)
2. Setup: apps_server_overview.md - Configuration section
3. Reference: quick_reference.md - for API examples
```

### 2. Want to Create Tests?
```
1. Read: integration_patterns.md
2. Reference: quick_reference.md - for curl examples
3. Code: Use integration_patterns.md as template
```

### 3. Building the Server?
```
1. Read: apps_server_overview.md - Building & Running section
2. Commands: Makefile targets (in apps_server_overview.md)
3. Environment: Configure .env with PAYSTACK_SECRET_KEY
```

### 4. Understanding Architecture?
```
1. Read: SUMMARY.md - Architecture section
2. Deep Dive: apps_server_overview.md - full documentation
3. Patterns: integration_patterns.md - design patterns section
```

---

## Available Tools Summary

### By Domain (13 Total)

**Core Operations** (1 tool)
- Check account balance

**Customer Operations** (2 tools)
- Create customer
- List customers with pagination

**Transaction Operations** (3 tools)
- Initialize transaction
- Verify transaction
- List transactions

**Transfer Operations** (2 tools)
- Create transfer recipient
- Initiate transfer

**Plan Operations** (1 tool)
- List subscription plans

**Subscription Operations** (1 tool)
- List subscriptions

**Bank Operations** (2 tools)
- List banks
- Resolve account

**SubAccount Operations** (1 tool)
- List sub-accounts

---

## Key Information At A Glance

### Configuration
```bash
PAYSTACK_SECRET_KEY=sk_test_xxx  # Required
PORT=4000                         # Optional, defaults to 4000
DATABASE_PATH=./data/moniewave.db # Optional
```

### Base URL
```
http://localhost:4000/api/v1
```

### Transport
- HTTP/POST for most endpoints
- GET for health check only

### Response Format (All Endpoints)
```json
{
  "status": true/false,
  "message": "Success" or error message,
  "data": { /* endpoint-specific data */ }
}
```

### HTTP Status Codes
- 200: Success
- 400: Bad Request (validation error)
- 500: Internal Server Error (SDK/API error)

---

## File Locations in Codebase

```
/Users/apple/srv/tensorkit/moniewave/apps/server/
├── cmd/server/main.go
├── internal/
│   ├── config/config.go
│   ├── database/
│   │   ├── database.go
│   │   ├── database_test.go
│   │   └── migrations.go
│   ├── dto/response.go
│   ├── handlers/
│   │   ├── banks.go
│   │   ├── core.go
│   │   ├── customers.go
│   │   ├── helpers.go
│   │   ├── plans.go
│   │   ├── subaccounts.go
│   │   ├── subscriptions.go
│   │   ├── transactions.go
│   │   └── transfers.go
│   ├── paystack/client.go
│   └── server/server.go
├── Makefile
├── go.mod
├── go.sum
├── .env.example
├── README.md
└── MIGRATION.md
```

---

## Development Commands

```bash
# Build
cd /Users/apple/srv/tensorkit/moniewave/apps/server
make build

# Run
make run

# Development with auto-reload
make dev

# Run tests
make test

# Code quality
make fmt      # Format
make lint     # Lint
make vet      # Go vet
make check    # All checks

# Setup
make setup    # Initial setup
make env-check # Verify environment
```

---

## Dependencies

```
github.com/borderlesshq/paystack-go v0.0.3  # Paystack SDK
github.com/go-chi/chi/v5 v5.0.12            # HTTP Router
github.com/go-chi/cors v1.2.1               # CORS middleware
github.com/mattn/go-sqlite3 v1.14.32        # SQLite driver
```

---

## Key Patterns

### Request Validation Pattern
1. Decode JSON
2. Validate required fields
3. Build SDK request
4. Call SDK method
5. Return response

### Error Handling Pattern
- Validation errors → 400 Bad Request
- SDK errors → 500 Internal Server Error
- Success → 200 OK

### Pagination Pattern
- Optional `count` and `offset` parameters
- If count > 0: Use ListN()
- If count == 0: Use List()

---

## Common Workflows

### Payment Flow
Create Customer → Initialize Transaction → Verify Transaction

### Transfer Flow
Check Balance → Resolve Account → Create Recipient → Initiate Transfer

### Subscription Flow
List Plans → Create Customer → Initialize Subscription Transaction

---

## Next Steps

1. Choose a document to start with based on your needs
2. Set up development environment per apps_server_overview.md
3. Run the server with `make run`
4. Test endpoints using quick_reference.md examples
5. Create integration tests following integration_patterns.md

---

## Document Statistics

| Document | Size | Sections | Best For |
|----------|------|----------|----------|
| SUMMARY.md | 2,500 words | 15 sections | Overview & orientation |
| apps_server_overview.md | 3,500+ words | 25+ sections | Deep technical dive |
| quick_reference.md | 1,000+ words | 12 sections | Quick API lookup |
| integration_patterns.md | 2,500+ words | 18 sections | Testing & integration |

**Total Documentation**: 9,500+ words covering all aspects of the server

---

Last Generated: 2025-11-14

