# MCP Server to Chi HTTP Server Migration

## Summary

Successfully converted the Paystack MCP SSE server to a Chi Router-based HTTP server.

## Changes Made

### 1. Dependencies Updated (go.mod)
- **Removed**: `github.com/mark3labs/mcp-go v0.42.0`
- **Added**:
  - `github.com/go-chi/chi/v5 v5.0.12`
  - `github.com/go-chi/cors v1.2.1`
- **Updated**: Go version from 1.25.3 (invalid) to 1.23.0

### 2. Handler Conversions
All MCP handlers converted to HTTP handlers using standard `http.ResponseWriter` and `*http.Request`:

#### Converted Handlers:
- **CoreHandler** (`internal/handlers/core.go`)
  - `CheckBalance` - GET/POST `/api/v1/balance`

- **CustomerHandler** (`internal/handlers/customers.go`)
  - `Create` - POST `/api/v1/customers/create`
  - `List` - POST `/api/v1/customers/list`

- **TransactionHandler** (`internal/handlers/transactions.go`)
  - `Initialize` - POST `/api/v1/transactions/initialize`
  - `Verify` - POST `/api/v1/transactions/verify`
  - `List` - POST `/api/v1/transactions/list`

- **TransferHandler** (`internal/handlers/transfers.go`)
  - `CreateRecipient` - POST `/api/v1/transfers/recipient/create`
  - `Initiate` - POST `/api/v1/transfers/initiate`

- **PlanHandler** (`internal/handlers/plans.go`)
  - `List` - POST `/api/v1/plans/list`

- **SubscriptionHandler** (`internal/handlers/subscriptions.go`)
  - `List` - POST `/api/v1/subscriptions/list`

- **BankHandler** (`internal/handlers/banks.go`)
  - `List` - POST `/api/v1/banks/list`
  - `ResolveAccount` - POST `/api/v1/banks/resolve`

- **SubAccountHandler** (`internal/handlers/subaccounts.go`)
  - `List` - POST `/api/v1/subaccounts/list`

### 3. Helper Functions Updated (`internal/handlers/helpers.go`)
Replaced MCP response helpers with HTTP JSON helpers:
- `WriteJSONSuccess(w, data)` - Writes successful JSON response
- `WriteJSONError(w, err, statusCode)` - Writes error JSON response
- `WriteJSONBadRequest(w, message)` - Writes 400 Bad Request response

### 4. Server Setup (`internal/server/server.go`)
Complete rewrite using Chi router:
- Added middleware: RequestID, RealIP, Logger, Recoverer, Timeout (60s)
- Added CORS support with wildcard origins
- All routes under `/api/v1` prefix
- Added health check endpoint: GET `/health`
- Server now uses `http.ListenAndServe` instead of MCP SSE

### 5. Request/Response Types
Added JSON request structs for all endpoints:
- `CreateCustomerRequest`
- `InitializeTransactionRequest`
- `VerifyTransactionRequest`
- `CreateRecipientRequest`
- `InitiateTransferRequest`
- `ResolveAccountRequest`
- `ListRequest` (shared for pagination)

### 6. Cleanup
- Removed `internal/tools/registry.go` (MCP tool registry)
- Removed `internal/tools/` directory
- Removed `internal/dto/encoder.go` (TOON encoder no longer needed)
- Removed all `toon:` struct tags from `internal/dto/response.go`

### 7. Entry Point (`cmd/server/main.go`)
No changes required - still calls `server.New(cfg)` and `srv.Start()`

## API Endpoints

All endpoints are POST requests under `/api/v1` prefix:

### Core
- `POST /api/v1/balance` - Check account balance

### Customers
- `POST /api/v1/customers/create` - Create customer
- `POST /api/v1/customers/list` - List customers

### Transactions
- `POST /api/v1/transactions/initialize` - Initialize transaction
- `POST /api/v1/transactions/verify` - Verify transaction
- `POST /api/v1/transactions/list` - List transactions

### Transfers
- `POST /api/v1/transfers/recipient/create` - Create transfer recipient
- `POST /api/v1/transfers/initiate` - Initiate transfer

### Plans
- `POST /api/v1/plans/list` - List subscription plans

### Subscriptions
- `POST /api/v1/subscriptions/list` - List subscriptions

### Banks
- `POST /api/v1/banks/list` - List banks
- `POST /api/v1/banks/resolve` - Resolve account number

### SubAccounts
- `POST /api/v1/subaccounts/list` - List subaccounts

### Health Check
- `GET /health` - Server health check

## Response Format

All responses follow this format:

### Success Response
```json
{
  "status": true,
  "message": "Success",
  "data": { /* actual response data */ }
}
```

### Error Response
```json
{
  "status": false,
  "message": "Error",
  "error": "Error description"
}
```

## Building and Running

### Prerequisites
```bash
# Ensure network connectivity to download dependencies
go mod download
```

### Build
```bash
cd /home/user/moniewave/apps/server
go build -o paystack-http-server ./cmd/server
```

### Run
```bash
PAYSTACK_SECRET_KEY=sk_test_xxx PORT=4000 ./paystack-http-server
```

Or directly:
```bash
PAYSTACK_SECRET_KEY=sk_test_xxx PORT=4000 go run ./cmd/server
```

## Environment Variables
- `PAYSTACK_SECRET_KEY` (required) - Paystack API secret key
- `PORT` (optional) - Server port (default: 4000)

## Testing

### Health Check
```bash
curl http://localhost:4000/health
```

### List Banks (example)
```bash
curl -X POST http://localhost:4000/api/v1/banks/list \
  -H "Content-Type: application/json"
```

### Create Customer (example)
```bash
curl -X POST http://localhost:4000/api/v1/customers/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+2348012345678"
  }'
```

## Next Steps
1. Run `go mod download` when network is available
2. Build and test the server
3. Update any client applications to use HTTP POST endpoints instead of MCP
4. Consider adding authentication middleware if needed
5. Add rate limiting for production use
6. Add request validation middleware
7. Add comprehensive logging and monitoring
