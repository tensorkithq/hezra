# Comprehensive Overview: Paystack Go MCP HTTP Server

## Project Overview

The `apps/server` directory contains a **Golang HTTP Server** that implements the Model Context Protocol (MCP) for Paystack payment integration. It wraps the official `paystack-go` SDK and exposes MCP tools over HTTP with POST endpoints.

### Architecture
- **Language**: Go 1.23.0
- **HTTP Framework**: Chi v5.0.12 (lightweight router)
- **SDK**: github.com/borderlesshq/paystack-go
- **Database**: SQLite 3 with migrations
- **Transport**: HTTP/POST endpoints (Chi-based REST API, not SSE/stdio)

---

## Directory Structure

```
apps/server/
├── cmd/
│   └── server/
│       └── main.go                 # Entry point
├── internal/
│   ├── config/
│   │   └── config.go              # Environment & config loading
│   ├── database/
│   │   ├── database.go            # DB initialization & connection
│   │   ├── database_test.go       # DB tests
│   │   └── migrations.go           # Schema migrations
│   ├── dto/
│   │   └── response.go            # Response/DTO types
│   ├── handlers/
│   │   ├── core.go                # Balance check handler
│   │   ├── customers.go           # Customer CRUD handlers
│   │   ├── transactions.go        # Transaction handlers
│   │   ├── transfers.go           # Transfer handlers
│   │   ├── plans.go               # Plan/subscription handlers
│   │   ├── subscriptions.go       # Subscription list handlers
│   │   ├── banks.go               # Bank & account resolution
│   │   ├── subaccounts.go         # SubAccount handlers
│   │   ├── helpers.go             # JSON response helpers
│   └── paystack/
│   │   └── client.go              # Paystack SDK wrapper
│   └── server/
│       └── server.go              # Chi router setup
├── Makefile                        # Build & dev commands
├── go.mod                          # Dependencies
├── go.sum                          # Dependency checksums
├── .env.example                    # Config template
└── README.md                       # Documentation
```

---

## Handler Structure & Available Tools

### 1. Core Handler (`internal/handlers/core.go`)
**Purpose**: Account-level operations

| Endpoint | Method | Handler | Purpose |
|----------|--------|---------|---------|
| `/api/v1/balance` | POST | `CheckBalance()` | Check Paystack account balance |

**Request**: Empty body
**Response**: Balance data object

---

### 2. Customer Handler (`internal/handlers/customers.go`)
**Purpose**: Customer management

| Endpoint | Method | Handler | Parameters |
|----------|--------|---------|------------|
| `/api/v1/customers/create` | POST | `Create()` | email (req), first_name, last_name, phone |
| `/api/v1/customers/list` | POST | `List()` | count (opt), offset (opt) |

**Customer Create Request**:
```json
{
  "email": "customer@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+2348012345678"
}
```

**Customer List Request**:
```json
{
  "count": 50,
  "offset": 0
}
```

---

### 3. Transaction Handler (`internal/handlers/transactions.go`)
**Purpose**: Payment transaction management

| Endpoint | Method | Handler | Parameters |
|----------|--------|---------|------------|
| `/api/v1/transactions/initialize` | POST | `Initialize()` | email (req), amount (req), reference (opt), callback_url (opt), currency (opt) |
| `/api/v1/transactions/verify` | POST | `Verify()` | reference (req) |
| `/api/v1/transactions/list` | POST | `List()` | count (opt), offset (opt) |

**Initialize Request**:
```json
{
  "email": "customer@example.com",
  "amount": 500000,
  "reference": "unique_ref_123",
  "callback_url": "https://example.com/callback",
  "currency": "NGN"
}
```

**Verify Request**:
```json
{
  "reference": "unique_ref_123"
}
```

---

### 4. Transfer Handler (`internal/handlers/transfers.go`)
**Purpose**: Money transfer operations

| Endpoint | Method | Handler | Parameters |
|----------|--------|---------|------------|
| `/api/v1/transfers/recipient/create` | POST | `CreateRecipient()` | type (req), name (req), account_number (req), bank_code (req), currency (opt, default: NGN) |
| `/api/v1/transfers/initiate` | POST | `Initiate()` | source (req), amount (req), recipient (req), reason (opt) |

**Create Recipient Request**:
```json
{
  "type": "nuban",
  "name": "John Doe",
  "account_number": "0123456789",
  "bank_code": "058",
  "currency": "NGN"
}
```

**Initiate Transfer Request**:
```json
{
  "source": "balance",
  "amount": 100000,
  "recipient": "TRF_recipient_code",
  "reason": "Salary payment"
}
```

---

### 5. Plan Handler (`internal/handlers/plans.go`)
**Purpose**: Subscription plan management

| Endpoint | Method | Handler | Parameters |
|----------|--------|---------|------------|
| `/api/v1/plans/list` | POST | `List()` | count (opt), offset (opt) |

**List Plans Request**:
```json
{
  "count": 50,
  "offset": 0
}
```

---

### 6. Subscription Handler (`internal/handlers/subscriptions.go`)
**Purpose**: Active subscription management

| Endpoint | Method | Handler | Parameters |
|----------|--------|---------|------------|
| `/api/v1/subscriptions/list` | POST | `List()` | count (opt), offset (opt) |

**List Subscriptions Request**:
```json
{
  "count": 50,
  "offset": 0
}
```

---

### 7. Bank Handler (`internal/handlers/banks.go`)
**Purpose**: Bank and account information

| Endpoint | Method | Handler | Parameters |
|----------|--------|---------|------------|
| `/api/v1/banks/list` | POST | `List()` | None |
| `/api/v1/banks/resolve` | POST | `ResolveAccount()` | account_number (req), bank_code (req) |

**Resolve Account Request**:
```json
{
  "account_number": "0123456789",
  "bank_code": "058"
}
```

---

### 8. SubAccount Handler (`internal/handlers/subaccounts.go`)
**Purpose**: SubAccount management

| Endpoint | Method | Handler | Parameters |
|----------|--------|---------|------------|
| `/api/v1/subaccounts/list` | POST | `List()` | count (opt), offset (opt) |

**List SubAccounts Request**:
```json
{
  "count": 50,
  "offset": 0
}
```

---

## Response Format

All endpoints follow a standard response format:

**Success Response** (HTTP 200):
```json
{
  "status": true,
  "message": "Success",
  "data": { /* Paystack API response */ }
}
```

**Error Response** (HTTP 400/500):
```json
{
  "status": false,
  "message": "Error" or "Bad Request",
  "error": "Error description"
}
```

---

## Configuration

### Environment Variables
Located in `.env` file (copy from `.env.example`):

```bash
# Required
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here

# Optional
PORT=4000                              # Server port (default: 4000)
DATABASE_PATH=./data/moniewave.db     # SQLite DB path (default: ./data/moniewave.db)
```

### Configuration Loading
- `internal/config/config.go` loads from environment variables
- Fails if `PAYSTACK_SECRET_KEY` is not set
- Defaults to port 4000 and `./data/moniewave.db` for database

---

## Database

### SQLite Implementation
- Location: `./data/moniewave.db` (configurable via `DATABASE_PATH`)
- Migrations: `internal/database/migrations.go`

### Current Schema
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Default User
- Username: `president`
- Password: `20201103`
- Full Name: `Presi Dent`

---

## Paystack SDK Integration

### Client Wrapper (`internal/paystack/client.go`)

The server wraps the official `paystack-go` SDK with a custom `Client` struct:

```go
type Client struct {
  *paystack.Client
}
```

### Available SDK Services
All handlers use these SDK service methods:

| Service | Methods Used |
|---------|--------------|
| `client.Customer` | `Create()`, `List()`, `ListN()` |
| `client.Transaction` | `Initialize()`, `Verify()`, `List()`, `ListN()` |
| `client.Transfer` | `CreateRecipient()`, `Initiate()` |
| `client.Plan` | `List()`, `ListN()` |
| `client.Subscription` | `List()`, `ListN()` |
| `client.Bank` | `List()`, `ResolveAccountNumber()` |
| `client.SubAccount` | `List()`, `ListN()` |

### SafeCheckBalance() Method
Custom wrapper with panic recovery for the balance endpoint:
```go
func (c *Client) SafeCheckBalance() (paystack.Response, error)
```

---

## Handler Pattern

All handlers follow a consistent pattern:

1. **Type Definition**: Each domain has a handler struct
   ```go
   type CustomerHandler struct {
     client *paystack.Client
   }
   ```

2. **Constructor**: Factory function for handler
   ```go
   func NewCustomerHandler(client *paystack.Client) *CustomerHandler {
     return &CustomerHandler{client: client}
   }
   ```

3. **Request Type**: Specific struct for each operation
   ```go
   type CreateCustomerRequest struct {
     Email     string `json:"email"`
     FirstName string `json:"first_name,omitempty"`
     LastName  string `json:"last_name,omitempty"`
     Phone     string `json:"phone,omitempty"`
   }
   ```

4. **Handler Method**: HTTP handler signature
   ```go
   func (h *CustomerHandler) Create(w http.ResponseWriter, r *http.Request) {
     // Decode request
     // Validate parameters
     // Call SDK
     // Write response
   }
   ```

5. **Response Helpers**: Consistent JSON responses
   - `WriteJSONSuccess(w, data)` - HTTP 200
   - `WriteJSONError(w, err, statusCode)` - HTTP 4xx/5xx
   - `WriteJSONBadRequest(w, message)` - HTTP 400

---

## Server Startup (`internal/server/server.go`)

### Chi Router Setup
- **Framework**: go-chi/chi v5.0.12
- **CORS**: Enabled for all origins
- **Middleware**: RequestID, RealIP, Logger, Recoverer, 60s timeout
- **Base Route**: `/api/v1`
- **Health Check**: `GET /health`

### Route Registration Pattern
```go
r.Route("/api/v1", func(r chi.Router) {
  r.Post("/customers/create", customerHandler.Create)
  r.Post("/customers/list", customerHandler.List)
  // ... more routes
})
```

### Health Check Endpoint
```
GET /health
Response: "OK" (HTTP 200)
```

---

## Building & Running

### Build Commands

```bash
# Development build
make build

# Build with version info
go build -ldflags "-X main.Version=... -X main.BuildTime=... -X main.CommitHash=..." \
  -o bin/moniewave ./cmd/server

# Run after building
make run

# Development mode (auto-reload with air)
make dev
```

### Running the Server

```bash
# With environment file
make run

# Directly (requires .env setup)
PAYSTACK_SECRET_KEY=sk_test_xxx go run ./cmd/server/main.go
```

---

## Testing

### Test Files
- `internal/database/database_test.go` - Database tests

### Run Tests
```bash
# All tests
make test

# Go test verbose
go test -v ./...

# With coverage
go test -cover ./...
```

### Test Pattern (database_test.go)
Current tests focus on database initialization and migration execution.

---

## Development Tools

### Available Make Targets

```
Development:
  make dev              - Auto-reload development mode (requires air)
  make run              - Build and run
  make build            - Build binary only

Testing:
  make test             - Run tests

Code Quality:
  make fmt              - Format with go fmt
  make lint             - Run golangci-lint
  make vet              - Run go vet
  make check            - All quality checks

Dependencies:
  make install          - Download deps
  make tidy             - Tidy go.mod
  make deps-update      - Update all deps

Setup:
  make setup            - Initial setup (copy .env, install deps)
  make env-check        - Verify env variables
  make install-tools    - Install dev tools (air, golangci-lint, etc)

Cleanup:
  make clean            - Remove build artifacts
```

### Development Tools Installation
```bash
make install-tools
```
Installs:
- **air** - Hot reload
- **golangci-lint** - Linter
- **goimports** - Import formatting
- **staticcheck** - Static analysis

---

## Dependencies (`go.mod`)

```
github.com/borderlesshq/paystack-go v0.0.3    # Paystack SDK
github.com/go-chi/chi/v5 v5.0.12              # HTTP router
github.com/go-chi/cors v1.2.1                 # CORS middleware
github.com/mattn/go-sqlite3 v1.14.32          # SQLite driver
```

---

## Error Handling

### Error Response Format
All errors follow this structure:
```json
{
  "status": false,
  "message": "Error" or "Bad Request",
  "error": "Detailed error message"
}
```

### HTTP Status Codes
- **200**: Successful operation
- **400**: Bad request (missing/invalid parameters)
- **500**: Internal server error (SDK/database failures)

### Validation
- **Core Handler**: No validation (empty body expected)
- **Customer**: Requires `email`
- **Transaction**: Requires `email` and `amount`
- **Transfer Recipient**: Requires `type`, `name`, `account_number`, `bank_code`
- **Transfer Initiate**: Requires `source`, `amount`, `recipient`
- **Bank Resolve**: Requires `account_number` and `bank_code`
- **List Operations**: Optional `count` and `offset` for pagination

---

## Key Design Patterns

1. **Dependency Injection**: All handlers receive Paystack client via constructor
2. **Handler Pattern**: HTTP handler per operation with consistent structure
3. **Request/Response DTO**: Specific types for each operation
4. **Error Wrapping**: Context added to SDK errors
5. **Pagination Support**: Optional `count` and `offset` parameters
6. **Default Values**: Currency defaults to "NGN" for transfers

---

## Limitations & Notes

### Current Implementation
- **HTTP-based**: Uses Chi router for REST endpoints, NOT SSE/stdio MCP transport
- **Synchronous**: All operations are blocking/synchronous
- **Simple Database**: SQLite for future extensibility (not heavily used currently)
- **No Caching**: Direct calls to Paystack API on each request
- **No Rate Limiting**: No built-in rate limiting

### Potential Enhancements
- Add request signing/validation
- Implement rate limiting
- Add webhook support
- Cache frequently accessed data (banks, plans)
- Add more granular error codes
- Implement request/response logging
- Add metrics and monitoring

---

## Integration with Moniewave Monorepo

### Part of Turborepo
- Located in `apps/server/`
- Standalone Go module (not npm-based)
- Can be built independently

### Relationship with Other Packages
- **packages/paystack-mcp/**: TypeScript/Node.js version using `@modelcontextprotocol/sdk`
- **packages/xmcp/**: React widgets for ChatGPT integration
- **examples/**: Widget bundles that may use MCP servers

---

## Summary: 14 Available Tools

1. **paystack_check_balance** - Check account balance
2. **paystack_customer_create** - Create customer
3. **paystack_customer_list** - List customers
4. **paystack_transaction_initialize** - Initialize payment
5. **paystack_transaction_verify** - Verify payment status
6. **paystack_transaction_list** - List transactions
7. **paystack_transfer_recipient_create** - Create transfer recipient
8. **paystack_transfer_initiate** - Initiate transfer
9. **paystack_plan_list** - List subscription plans
10. **paystack_subscription_list** - List subscriptions
11. **paystack_bank_list** - List supported banks
12. **paystack_bank_resolve_account** - Resolve account details
13. **paystack_subaccount_list** - List subaccounts
14. **health_check** - Server health (GET /health)

---

## Next Steps for Integration Testing

To create comprehensive integration tests matching story workflows:

1. **Setup**: Configure `.env` with test Paystack keys
2. **Customer Flow**: Create customer → Initialize transaction → Verify transaction
3. **Transfer Flow**: Resolve bank account → Create recipient → Initiate transfer
4. **Subscription Flow**: List plans → Create subscription → Monitor
5. **Utility Operations**: Check balance, list banks, resolve accounts

Each test can call the HTTP endpoints directly using an HTTP client library (e.g., `net/http`, `httptest`, or external client).
