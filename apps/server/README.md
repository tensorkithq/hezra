# Paystack HTTP API Server

A production-ready Go HTTP API server that provides a RESTful interface for Paystack payment integration. Built with Go 1.23.0, Chi router, and SQLite for persistence.

## Overview

This server acts as a proxy between your applications and Paystack's payment infrastructure, providing:
- RESTful HTTP endpoints for all major Paystack operations
- SQLite database for transaction logging and persistence
- CORS-enabled for web application integration
- Structured request/response handling with proper error management
- Middleware for request logging, recovery, and timeouts

## Architecture

```
apps/server/
├── cmd/
│   └── server/
│       └── main.go           # Application entry point
├── internal/
│   ├── config/              # Configuration management
│   ├── database/            # SQLite database layer
│   ├── handlers/            # HTTP request handlers
│   │   ├── banks.go        # Bank operations
│   │   ├── core.go         # Core operations (balance)
│   │   ├── customers.go    # Customer management
│   │   ├── plans.go        # Subscription plans
│   │   ├── subaccounts.go  # Sub-account management
│   │   ├── subscriptions.go # Subscription management
│   │   ├── transactions.go # Transaction processing
│   │   └── transfers.go    # Transfer operations
│   └── paystack/           # Paystack SDK wrapper
├── data/                   # SQLite database storage
└── bin/                    # Compiled binaries
```

## Installation

### Prerequisites

- Go 1.23.0 or higher
- SQLite3
- Paystack API credentials

### From Source

```bash
git clone https://github.com/tensorkithq/moniewave.git
cd moniewave/apps/server
go mod download
```

## Configuration

The server uses environment variables for configuration:

```bash
# Required
export PAYSTACK_SECRET_KEY="sk_test_your_secret_key_here"

# Optional (with defaults)
export PORT="4000"                           # Server port (default: 4000)
export DATABASE_PATH="./data/moniewave.db"   # SQLite database path
```

## Building & Running

### Development

```bash
# Run directly
PAYSTACK_SECRET_KEY=sk_test_xxx go run cmd/server/main.go

# Or with Make
make run
```

### Production Build

```bash
# Build binary
go build -o bin/paystack-server cmd/server/main.go

# Run binary
PAYSTACK_SECRET_KEY=sk_live_xxx ./bin/paystack-server
```

### Using Makefile

```bash
make build    # Build the binary
make run      # Run in development
make test     # Run tests
make clean    # Clean build artifacts
make deps     # Install dependencies
```

## API Endpoints

All endpoints use POST method and expect JSON payloads:

### Core Operations

- `POST /api/v1/balance` - Check account balance

### Customer Management

- `POST /api/v1/customers/create` - Create new customer
- `POST /api/v1/customers/list` - List customers (pagination supported)

### Transaction Processing

- `POST /api/v1/transactions/initialize` - Initialize payment
- `POST /api/v1/transactions/verify` - Verify payment status
- `POST /api/v1/transactions/list` - List transactions

### Transfer Operations

- `POST /api/v1/transfers/recipient/create` - Create transfer recipient
- `POST /api/v1/transfers/initiate` - Initiate money transfer

### Banking

- `POST /api/v1/banks/list` - List Nigerian banks
- `POST /api/v1/banks/resolve` - Resolve bank account details

### Subscription Management

- `POST /api/v1/plans/list` - List subscription plans
- `POST /api/v1/subscriptions/list` - List active subscriptions

### Sub-accounts

- `POST /api/v1/subaccounts/list` - List sub-accounts

### Health Check

- `GET /health` - Server health status

## Request/Response Examples

### Initialize Transaction

```bash
curl -X POST http://localhost:4000/api/v1/transactions/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "amount": 500000,
    "callback_url": "https://example.com/callback"
  }'
```

### Create Customer

```bash
curl -X POST http://localhost:4000/api/v1/customers/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+2348123456789"
  }'
```

### Check Balance

```bash
curl -X POST http://localhost:4000/api/v1/balance \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Database

The server uses SQLite for persistence with automatic initialization. The database stores:
- Transaction logs
- Request/response history
- Customer interactions
- Error logs

Database location: `./data/moniewave.db` (configurable via `DATABASE_PATH`)

## Middleware

The server includes the following middleware:
- **Request ID**: Unique ID for request tracking
- **Real IP**: Client IP extraction
- **Logger**: Structured request logging
- **Recoverer**: Panic recovery
- **Timeout**: 60-second request timeout
- **CORS**: Configured for web applications

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": true,
  "message": "Descriptive error message",
  "code": "ERROR_CODE"
}
```

## Dependencies

- [Chi Router](https://github.com/go-chi/chi) - HTTP routing
- [Paystack Go SDK](https://github.com/borderlesshq/paystack-go) - Paystack API client
- [SQLite3](https://github.com/mattn/go-sqlite3) - Database driver
- [go-chi/cors](https://github.com/go-chi/cors) - CORS middleware

## Security Considerations

- Always use HTTPS in production
- Never expose secret keys in logs or responses
- Implement rate limiting for production use
- Use environment-specific keys (test vs. live)
- Add authentication layer for public deployments
- Validate and sanitize all input data

## Development

### Project Structure

- `/cmd/server/` - Application entry point
- `/internal/config/` - Configuration management
- `/internal/database/` - Database operations
- `/internal/handlers/` - HTTP request handlers
- `/internal/paystack/` - Paystack client wrapper
- `/internal/server/` - HTTP server setup

### Adding New Endpoints

1. Create handler in `/internal/handlers/`
2. Define request/response structs
3. Implement business logic
4. Add route in `/internal/server/server.go`
5. Update documentation

## Testing

```bash
# Run all tests
make test

# With coverage
go test -cover ./...

# Specific package
go test ./internal/handlers/...
```

## Deployment

### Docker

```dockerfile
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o server cmd/server/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/server .
CMD ["./server"]
```

### Systemd Service

```ini
[Unit]
Description=Paystack API Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/paystack-server
Environment="PAYSTACK_SECRET_KEY=sk_live_xxx"
Environment="PORT=4000"
ExecStart=/opt/paystack-server/bin/paystack-server
Restart=always

[Install]
WantedBy=multi-user.target
```

## License

MIT