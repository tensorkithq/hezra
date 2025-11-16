# Quick Reference: Paystack Go Server API

## Server Endpoints Summary

### Base URL
```
http://localhost:4000/api/v1
```

### All Endpoints (13 tools)

| Domain | Endpoint | Method | Parameters |
|--------|----------|--------|------------|
| **Core** | `/balance` | POST | - |
| **Customers** | `/customers/create` | POST | email*, first_name, last_name, phone |
| | `/customers/list` | POST | count, offset |
| **Transactions** | `/transactions/initialize` | POST | email*, amount*, reference, callback_url, currency |
| | `/transactions/verify` | POST | reference* |
| | `/transactions/list` | POST | count, offset |
| **Transfers** | `/transfers/recipient/create` | POST | type*, name*, account_number*, bank_code*, currency |
| | `/transfers/initiate` | POST | source*, amount*, recipient*, reason |
| **Plans** | `/plans/list` | POST | count, offset |
| **Subscriptions** | `/subscriptions/list` | POST | count, offset |
| **Banks** | `/banks/list` | POST | - |
| | `/banks/resolve` | POST | account_number*, bank_code* |
| **SubAccounts** | `/subaccounts/list` | POST | count, offset |

*Note: * indicates required parameter

### Health Check
```
GET /health
Response: "OK"
```

---

## Request/Response Examples

### Balance Check
```bash
curl -X POST http://localhost:4000/api/v1/balance
```
Response: `{ "status": true, "message": "Success", "data": { "balance": 1000000, ... } }`

### Create Customer
```bash
curl -X POST http://localhost:4000/api/v1/customers/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+2348012345678"
  }'
```

### Initialize Transaction
```bash
curl -X POST http://localhost:4000/api/v1/transactions/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "amount": 500000,
    "reference": "ref_123456",
    "currency": "NGN"
  }'
```

### Create Transfer Recipient
```bash
curl -X POST http://localhost:4000/api/v1/transfers/recipient/create \
  -H "Content-Type: application/json" \
  -d '{
    "type": "nuban",
    "name": "John Doe",
    "account_number": "0123456789",
    "bank_code": "058",
    "currency": "NGN"
  }'
```

### Resolve Account
```bash
curl -X POST http://localhost:4000/api/v1/banks/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "account_number": "0123456789",
    "bank_code": "058"
  }'
```

---

## Workflow Examples

### Complete Payment Flow
1. Create customer: `POST /customers/create`
2. Initialize transaction: `POST /transactions/initialize`
3. Verify transaction: `POST /transactions/verify` (with reference)

### Complete Transfer Flow
1. Resolve account: `POST /banks/resolve`
2. Create recipient: `POST /transfers/recipient/create`
3. Initiate transfer: `POST /transfers/initiate`

### Check Account Status
1. Check balance: `POST /balance`
2. List transactions: `POST /transactions/list`

---

## Error Responses

### Missing Required Parameter
```json
{
  "status": false,
  "message": "Bad Request",
  "error": "email is required"
}
```

### API Error
```json
{
  "status": false,
  "message": "Error",
  "error": "Error: Paystack API error details"
}
```

---

## Configuration

### Environment Variables
```bash
PAYSTACK_SECRET_KEY=sk_test_your_key_here  # Required
PORT=4000                                   # Optional (default: 4000)
DATABASE_PATH=./data/moniewave.db          # Optional (default)
```

### Setup
```bash
cd apps/server
cp .env.example .env
# Edit .env with your PAYSTACK_SECRET_KEY
make run
```

---

## Development Commands

```bash
# Start development server with auto-reload
make dev

# Build and run
make run

# Run tests
make test

# Check code quality
make check

# Format code
make fmt
```

---

## SDK Services Used

The server wraps these Paystack SDK service methods:

- `client.Customer.Create()`, `.List()`, `.ListN()`
- `client.Transaction.Initialize()`, `.Verify()`, `.List()`, `.ListN()`
- `client.Transfer.CreateRecipient()`, `.Initiate()`
- `client.Plan.List()`, `.ListN()`
- `client.Subscription.List()`, `.ListN()`
- `client.Bank.List()`, `.ResolveAccountNumber()`
- `client.SubAccount.List()`, `.ListN()`

---

## Important Notes

- All requests are POST (except health check which is GET)
- Amount values are in smallest currency units (kobo for NGN)
- Pagination uses `count` and `offset` parameters
- Default currency is NGN for transfers
- Requires valid PAYSTACK_SECRET_KEY environment variable
