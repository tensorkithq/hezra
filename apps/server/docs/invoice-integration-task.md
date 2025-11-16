# Invoice Integration Task

## Overview

Implement invoice (payment request) management with a hybrid architecture: Paystack as the source of truth with a lightweight SQLite proxy for fast lookups and customer-based filtering.

---

## Architecture

### Data Flow Strategy

| Operation | Data Source | Cache Update |
|-----------|-------------|--------------|
| **Create Invoice** | Write to Paystack | ✅ Cache in SQLite |
| **Verify Invoice** | Fetch from Paystack | ✅ Update SQLite status |
| **List Invoices** | Read from SQLite | ❌ No API call |
| **Get One Invoice** | Fetch from Paystack | ❌ Read-only |

### Why Hybrid?

- **Paystack** = Source of truth for complete invoice data
- **SQLite** = Fast lookups for list operations and customer filtering
- **No webhooks needed** = We control all write operations through handlers

---

## Database Schema

### SQLite Table: `invoices`

```sql
CREATE TABLE invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_code TEXT NOT NULL UNIQUE,        -- Paystack request_code
  customer_id TEXT NOT NULL,                 -- Paystack customer_code
  customer_name TEXT NOT NULL,               -- Cached for display
  amount INTEGER NOT NULL,                   -- Amount in kobo
  status TEXT,                               -- pending, success, failed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
```

**Fields Purpose:**
- `invoice_code` - Paystack request_code for lookups
- `customer_id` - Filter invoices by customer
- `customer_name` - Display in list without additional API calls
- `amount` - Quick totals/sorting
- `status` - Filter by payment status

---

## API Endpoints

### 1. Create Invoice

**Endpoint:** `POST /api/v1/invoices/create`

**Request Body:**
```json
{
  "customer": "CUS_xxxxx",
  "amount": 500000,
  "description": "2-for-1 promo",
  "line_items": [
    {
      "name": "Item 1",
      "amount": 250000,
      "quantity": 2
    }
  ],
  "due_date": "2025-12-31",
  "send_notification": true
}
```

**Flow:**
1. Validate required fields (customer, amount)
2. Verify customer exists: Call Paystack `GET /customer/:customer_code`
3. If customer not found, return 400 Bad Request
4. Call Paystack API: `POST /paymentrequest`
5. Extract response: `request_code`, `status`, customer details
6. Insert into SQLite: `(invoice_code, customer_id, customer_name, amount, status)`
7. Return full Paystack response

**Response:** Paystack payment request object
```json
{
  "status": true,
  "message": "Payment request created",
  "data": {
    "id": 123,
    "request_code": "PRQ_xxxxx",
    "customer": {...},
    "amount": 500000,
    "status": "pending",
    "offline_reference": "123456",
    ...
  }
}
```

---

### 2. List Invoices

**Endpoint:** `POST /api/v1/invoices/list`

**Request Body:**
```json
{
  "customer_id": "CUS_xxxxx",
  "status": "pending",
  "from": "2025-01-01",
  "to": "2025-12-31",
  "count": 50,
  "offset": 0
}
```

**Required Fields:**
- `customer_id` - Filter by customer (required)

**Optional Fields:**
- `status` - Filter by payment status (pending, success, failed)
- `from` - Start date (YYYY-MM-DD format)
- `to` - End date (YYYY-MM-DD format)
- `count` - Number of records to return
- `offset` - Number of records to skip

**Flow:**
1. Validate customer_id is provided
2. Query SQLite with filters (customer_id, status, date range)
3. Apply pagination (count, offset)
4. Return cached list (no Paystack API call)

**Response:**
```json
{
  "status": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "invoice_code": "PRQ_xxxxx",
      "customer_id": "CUS_xxxxx",
      "customer_name": "John Doe",
      "amount": 500000,
      "status": "pending",
      "created_at": "2025-11-14T00:00:00Z",
      "updated_at": "2025-11-14T00:00:00Z"
    }
  ]
}
```

---

### 3. Get Invoice

**Endpoint:** `POST /api/v1/invoices/get/:id_or_code`

**Path Parameter:** `id_or_code` - Paystack invoice ID or request_code

**Flow:**
1. Call Paystack API: `GET /paymentrequest/:id_or_code`
2. Return complete invoice data from Paystack
3. No cache update (read-only)

**Response:** Full Paystack payment request object with all details

---

### 4. Verify Invoice

**Endpoint:** `POST /api/v1/invoices/verify/:code`

**Path Parameter:** `code` - Paystack request_code

**Flow:**
1. Call Paystack API: `GET /paymentrequest/verify/:code`
2. Extract updated status from response
3. Update SQLite: `UPDATE invoices SET status = ?, updated_at = ? WHERE invoice_code = ?`
4. Return Paystack verification response

**Response:** Paystack verification object with payment status

---

## Additional Operations (Future)

These operations can be added later as needed:

### 5. Update Invoice
`PUT /api/v1/invoices/update/:id_or_code`

### 6. Finalize Invoice
`POST /api/v1/invoices/finalize/:code`

### 7. Send Notification
`POST /api/v1/invoices/notify/:code`

### 8. Archive Invoice
`POST /api/v1/invoices/archive/:code`

### 9. Get Totals
`GET /api/v1/invoices/totals`

---

## Implementation Steps

### Step 1: Database Migration
**File:** `internal/database/migrations.go`

Add invoices table creation to `runMigrations()` function.

### Step 2: Invoice Handler
**File:** `internal/handlers/invoices.go`

```go
type InvoiceHandler struct {
    client *paystack.Client
}

// Methods:
- Create(w http.ResponseWriter, r *http.Request)
- List(w http.ResponseWriter, r *http.Request)
- Get(w http.ResponseWriter, r *http.Request)
- Verify(w http.ResponseWriter, r *http.Request)
```

### Step 3: Paystack SDK Integration

The Paystack Go SDK (`github.com/borderlesshq/paystack-go`) may not have direct payment request methods. We'll need to:

**Option A:** Use SDK's generic `Call()` method
```go
client.Call("POST", "paymentrequest", requestBody, &response)
```

**Option B:** Extend the SDK wrapper in `internal/paystack/client.go`
```go
func (c *Client) CreatePaymentRequest(req *PaymentRequest) (Response, error)
func (c *Client) VerifyPaymentRequest(code string) (Response, error)
```

### Step 4: Register Routes
**File:** `internal/server/server.go` or `cmd/server/main.go`

```go
invoiceHandler := handlers.NewInvoiceHandler(paystackClient)
router.Post("/api/v1/invoices/create", invoiceHandler.Create)
router.Post("/api/v1/invoices/list", invoiceHandler.List)
router.Post("/api/v1/invoices/get/{id_or_code}", invoiceHandler.Get)
router.Post("/api/v1/invoices/verify/{code}", invoiceHandler.Verify)
```

---

## Paystack API Reference

### Payment Request Endpoints

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| Create | POST | `/paymentrequest` | Create new invoice |
| List | GET | `/paymentrequest` | List all invoices |
| Fetch | GET | `/paymentrequest/:id_or_code` | Get single invoice |
| Verify | GET | `/paymentrequest/verify/:code` | Verify payment status |
| Update | PUT | `/paymentrequest/:id_or_code` | Update invoice details |
| Finalize | POST | `/paymentrequest/finalize/:code` | Finalize draft invoice |
| Notify | POST | `/paymentrequest/notify/:code` | Send notification |
| Archive | POST | `/paymentrequest/archive/:code` | Archive invoice |
| Totals | GET | `/paymentrequest/totals` | Get payment totals |

### Required Headers
```
Authorization: Bearer sk_test_xxxxx
Content-Type: application/json
```

---

## Testing Workflow

### 1. Create Customer + Invoice Flow
```bash
# Step 1: Create customer
POST /api/v1/customers/create
{
  "email": "customer@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+2348012345678"
}
# Returns: customer_code (e.g., CUS_xxxxx)

# Step 2: Create invoice
POST /api/v1/invoices/create
{
  "customer": "CUS_xxxxx",
  "amount": 500000,
  "description": "Order #12345"
}
# Returns: request_code, offline_reference

# Step 3: List customer invoices
POST /api/v1/invoices/list
{
  "customer_id": "CUS_xxxxx"
}
# Returns: Array of cached invoices from SQLite

# Step 4: Get full invoice details
POST /api/v1/invoices/get/PRQ_xxxxx
# Returns: Full invoice data from Paystack

# Step 5: Verify payment (after customer pays)
POST /api/v1/invoices/verify/PRQ_xxxxx
# Returns: Verification status + updates SQLite
```

---

## Error Handling

### Validation Errors (400 Bad Request)
- Missing required fields (customer, amount)
- Invalid customer_code format
- Invalid amount (must be positive integer)

### Paystack API Errors (500 Internal Server Error)
- Invalid API key
- Customer not found
- Insufficient permissions
- Network/timeout errors

### Database Errors (500 Internal Server Error)
- Failed to insert invoice record
- Failed to update status
- Database connection issues

---

## Performance Considerations

### Cache Strategy
- **Write-through cache**: Insert to SQLite immediately after Paystack create
- **Lazy updates**: Only update status on verify operation
- **No background sync**: Keeps architecture simple

### Query Optimization
- Index on `customer_id` for fast filtering
- Index on `status` for status-based queries
- Pagination support for large datasets

### API Rate Limiting
- List operations use SQLite (no API calls)
- Get/Verify operations hit Paystack (respect rate limits)
- Consider implementing request throttling for production

---

## Design Decisions

1. **Create validates customer exists first** ✅
   - Always validate customer_code with Paystack before creating invoice
   - Fail fast with clear error if customer not found
   - customer_id is required field

2. **List operation filters:**
   - ✅ customer_id (required)
   - ✅ status (optional)
   - ✅ date range: from/to (optional)
   - ✅ pagination: count, offset

3. **Implementation scope: Core 4 endpoints**
   - ✅ Create, List, Get, Verify
   - ⏸️ Future: Update, Finalize, Notify, Archive, Totals

4. **Get operation is read-only**
   - Fetches full data from Paystack only
   - No cache updates (keeps it simple)

---

## Success Criteria

- ✅ Invoices can be created via Paystack API
- ✅ Invoice metadata cached in SQLite
- ✅ List operation returns cached data (no API calls)
- ✅ Get operation retrieves full data from Paystack
- ✅ Verify operation updates local status
- ✅ Customer filtering works correctly
- ✅ Status filtering works correctly
- ✅ Pagination works for large datasets
- ✅ All endpoints handle errors gracefully
