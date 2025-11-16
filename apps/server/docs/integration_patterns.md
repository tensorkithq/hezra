# Integration Patterns: Paystack Go Server

## Testing Story Workflows

Based on the comprehensive handler analysis, here are the key integration patterns for creating end-to-end tests matching real-world story workflows.

---

## Pattern 1: Invoice Payment Flow

### Scenario
A merchant creates an invoice for a customer and tracks payment.

### Step-by-Step Workflow
```
1. Create Customer (if new)
   POST /api/v1/customers/create
   {
     "email": "customer@example.com",
     "first_name": "Jane",
     "last_name": "Smith",
     "phone": "+2348012345678"
   }
   Returns: Customer object with ID and customer_code

2. Create Invoice
   POST /api/v1/invoices/create
   {
     "customer": "CUS_xxxxx",
     "amount": 500000,           // 5000 NGN in kobo
     "description": "Order #12345",
     "due_date": "2025-12-31",
     "send_notification": true
   }
   Returns: Payment request with request_code, offline_reference
   Note: Also caches invoice in SQLite (invoice_code, customer_id, customer_name, amount, status)

3. List Customer Invoices (local cache)
   POST /api/v1/invoices/list
   {
     "customer_id": "CUS_xxxxx",
     "status": "pending"
   }
   Returns: Array of invoices from SQLite (fast, no API call)

4. Get Full Invoice Details
   POST /api/v1/invoices/get/PRQ_xxxxx
   {}
   Returns: Complete invoice data from Paystack

5. Verify Invoice Payment (after customer pays)
   POST /api/v1/invoices/verify/PRQ_xxxxx
   {}
   Returns: Verification status + updates SQLite status
```

### Assertions
- Customer creation returns non-zero ID and customer_code
- Invoice creation returns request_code and offline_reference
- Invoice is cached in SQLite with customer information
- List operation queries SQLite (no Paystack API call)
- Get operation fetches complete data from Paystack
- Verify updates local cache status
- Status progression: pending → success/failed

---

## Pattern 2: Customer Payment Flow

### Scenario
A customer wants to make a payment through your platform.

### Step-by-Step Workflow
```
1. Create Customer
   POST /api/v1/customers/create
   {
     "email": "newcustomer@example.com",
     "first_name": "Jane",
     "last_name": "Smith",
     "phone": "+2348012345678"
   }
   Returns: Customer object with ID and customer_code

2. Initialize Transaction
   POST /api/v1/transactions/initialize
   {
     "email": "newcustomer@example.com",
     "amount": 500000,           // 5000 NGN in kobo
     "reference": "ref_unique_123",
     "currency": "NGN",
     "callback_url": "https://yourapp.com/callback"
   }
   Returns: Transaction with authorization_url and access_code

3. Verify Transaction (after payment)
   POST /api/v1/transactions/verify
   {
     "reference": "ref_unique_123"
   }
   Returns: Transaction object with status (success/failed)

4. List Transactions (optional - audit)
   POST /api/v1/transactions/list
   {
     "count": 100,
     "offset": 0
   }
   Returns: List of all transactions
```

### Assertions
- Customer creation returns non-zero ID and customer_code
- Transaction initialization returns authorization_url
- Verification returns consistent reference
- Status progression: initiated → pending → success/failed

---

## Pattern 3: Account Transfer Flow

### Scenario
Your platform needs to initiate a payout to a customer's bank account.

### Step-by-Step Workflow
```
1. Check Account Balance (verify funds available)
   POST /api/v1/balance
   {}
   Returns: Balance object with available amount

2. List Banks (optional - for UI)
   POST /api/v1/banks/list
   {}
   Returns: List of all supported banks with codes

3. Resolve Account (verify recipient account)
   POST /api/v1/banks/resolve
   {
     "account_number": "0123456789",
     "bank_code": "058"          // GTBank Nigeria
   }
   Returns: Account holder name and validation status

4. Create Transfer Recipient
   POST /api/v1/transfers/recipient/create
   {
     "type": "nuban",
     "name": "Verified Account Name",
     "account_number": "0123456789",
     "bank_code": "058",
     "currency": "NGN"
   }
   Returns: Recipient object with recipient_code

5. Initiate Transfer (only if balance is sufficient)
   POST /api/v1/transfers/initiate
   {
     "source": "balance",
     "amount": 100000,           // 1000 NGN in kobo
     "recipient": "RCP_code_from_step_4",
     "reason": "Payout for order #12345"
   }
   Returns: Transfer object with status (pending/success/failed)
```

### Assertions
- Balance is available and sufficient
- Bank resolution returns matching account name
- Recipient creation returns recipient_code
- Transfer status transitions correctly
- All amounts are in correct currency units (kobo)

---

## Pattern 4: Utility Operations Flow

### Scenario
Common operations needed throughout the application.

### Operations Available
```
1. Check Account Balance (health check)
   POST /api/v1/balance
   {}
   Returns: Current account balance

2. Resolve Account Details
   POST /api/v1/banks/resolve
   {
     "account_number": "0123456789",
     "bank_code": "058"
   }
   Returns: Account holder name for verification

3. List Sub-Accounts (if using split payments)
   POST /api/v1/subaccounts/list
   {
     "count": 50,
     "offset": 0
   }
   Returns: List of sub-accounts with commission rates

4. List Banks (for dropdown/selection)
   POST /api/v1/banks/list
   {}
   Returns: All supported banks with codes and names
```

### Assertions
- Balance endpoint returns numeric balance
- Bank resolution returns account name
- SubAccount listing returns commission structures
- Bank listing includes all required fields

---

## Common Test Scenarios

### Success Path Testing
1. **Valid Parameters**: All required fields provided correctly
2. **SDK Integration**: Calls correctly map to paystack-go SDK methods
3. **Response Mapping**: API responses map correctly to expected DTOs
4. **Error Handling**: Graceful handling of SDK errors

### Failure Path Testing
1. **Missing Parameters**: Missing required field → 400 Bad Request
2. **Invalid Email**: Invalid email format → Error response
3. **Insufficient Balance**: Transfer amount > balance → SDK error
4. **Invalid Reference**: Non-existent reference → SDK error response
5. **Invalid Bank Code**: Non-existent bank code → SDK error

### Edge Cases
1. **Pagination Boundaries**: count=0, very large offset
2. **Special Characters**: Names with Unicode, apostrophes
3. **Amount Precision**: Exact kobo amounts vs. rounding
4. **Concurrent Requests**: Multiple simultaneous operations
5. **Rate Limiting**: Repeated requests within seconds

---

## Test Data Setup

### Required Configuration
```bash
# Must be set before running tests
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxx

# Optional
PORT=4000
DATABASE_PATH=./data/moniewave.db
```

### Test Fixtures
```json
{
  "customer": {
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User",
    "phone": "+2348012345678"
  },
  "transaction": {
    "email": "test@example.com",
    "amount": 500000,
    "currency": "NGN"
  },
  "transfer": {
    "account_number": "0123456789",
    "bank_code": "058",
    "amount": 100000,
    "currency": "NGN"
  }
}
```

---

## Key Handler Patterns

### Pattern: Request Validation
All handlers implement:
```go
1. Decode JSON request
2. Validate required fields (return 400 if missing)
3. Build SDK request object
4. Call SDK method
5. Return standardized response
```

### Pattern: Error Handling
```go
1. Validation errors → WriteJSONBadRequest (400)
2. SDK errors → WriteJSONError (500)
3. Success → WriteJSONSuccess (200)
```

### Pattern: Pagination
Optional for list operations:
```go
- If count > 0: Use client.Service.ListN(count, offset)
- If count == 0: Use client.Service.List() (no pagination)
```

---

## SDK Method Mapping

Each endpoint maps to specific SDK service methods:

| Handler | SDK Service | SDK Method |
|---------|-------------|-----------|
| CustomerHandler.Create | customer | Create() |
| CustomerHandler.List | customer | List() / ListN() |
| InvoiceHandler.Create | custom | CreatePaymentRequest() |
| InvoiceHandler.List | database | SQLite query |
| InvoiceHandler.Get | custom | GetPaymentRequest() |
| InvoiceHandler.Verify | custom | VerifyPaymentRequest() |
| TransactionHandler.Initialize | transaction | Initialize() |
| TransactionHandler.Verify | transaction | Verify() |
| TransactionHandler.List | transaction | List() / ListN() |
| TransferHandler.CreateRecipient | transfer | CreateRecipient() |
| TransferHandler.Initiate | transfer | Initiate() |
| BankHandler.List | bank | List() |
| BankHandler.ResolveAccount | bank | ResolveAccountNumber() |
| SubAccountHandler.List | subaccount | List() / ListN() |
| CoreHandler.CheckBalance | custom | SafeCheckBalance() |

---

## Response DTO Structure

All successful responses follow this envelope:
```json
{
  "status": true,
  "message": "Success",
  "data": {
    // SDK response data - varies by endpoint
  }
}
```

The `data` field contains the raw Paystack API response, which includes:
- Invoice (PaymentRequest): id, request_code, amount, status, offline_reference, customer
- Transaction: id, reference, amount, status, authorization_url, access_code
- Customer: id, email, first_name, last_name, customer_code
- Transfer: id, amount, recipient, status, transfer_code
- Bank: id, name, code, currency, country
- SubAccount: id, subaccount_code, commission_type, commission_value

---

## Integration Test Structure Recommendation

```go
// For each workflow:
func TestInvoiceFlow(t *testing.T) {
  // 1. Setup: Create customer
  // 2. Action: Create invoice
  // 3. Assert: Invoice cached in SQLite, request_code returned
  // 4. Action: List invoices by customer_id
  // 5. Assert: Invoice appears in list from SQLite
  // 6. Action: Get full invoice details
  // 7. Assert: Complete data from Paystack
  // 8. Action: Verify invoice
  // 9. Assert: Status updated in SQLite
}

func TestPaymentFlow(t *testing.T) {
  // 1. Setup: Create customer
  // 2. Action: Initialize transaction
  // 3. Assert: Verify transaction returns expected fields
  // 4. Cleanup: Verify transaction status
}

func TestTransferFlow(t *testing.T) {
  // 1. Setup: Check balance
  // 2. Action: Resolve account, create recipient, initiate transfer
  // 3. Assert: All steps succeed with expected response structure
}
```

---

## Debugging Tips

1. **Enable Logging**: Chi middleware automatically logs all requests
2. **Check Response Format**: All responses wrap with status/message/data envelope
3. **Validate Input**: Review required fields for each handler
4. **SDK Errors**: Paystack API errors are wrapped in 500 responses
5. **Environment**: Ensure PAYSTACK_SECRET_KEY is valid test key (sk_test_*)

---

## Performance Considerations

- **No Caching**: Each request hits Paystack API directly
- **No Rate Limiting**: Implement client-side rate limiting for production
- **Pagination**: Use count/offset for large list operations
- **Synchronous**: All operations are blocking, consider goroutines for multiple operations
- **Timeout**: 60-second timeout per request (configurable in server.go)

