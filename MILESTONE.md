# Moniewave Demo Implementation Milestone

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Client App                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  OpenAI Realtime Voice Agent (WebRTC)                │   │
│  │  - Manages voice interaction                         │   │
│  │  - Tool definitions with ky HTTP client              │   │
│  │  - Widget rendering (client-side only)               │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          │ HTTP POST (ky)                    │
│                          ▼                                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      Server App (Go)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  HTTP Router (Chi/Gin/Fiber)                         │   │
│  │  - POST /api/pay-contractors-bulk                    │   │
│  │  - POST /api/set-account-limits                      │   │
│  │  - POST /api/create-virtual-card                     │   │
│  │  - POST /api/send-invoice                            │   │
│  │  - POST /api/aggregate-transactions                  │   │
│  │  - POST /api/account-snapshot                        │   │
│  │  - POST /api/set-beneficiary-limit                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │  Business Logic Layer                                │   │
│  │  - Paystack API integration                          │   │
│  │  - Transaction processing                            │   │
│  │  - Limit enforcement                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │  Database (SQLite / In-Memory)                       │   │
│  │  - Transactions history                              │   │
│  │  - Beneficiaries                                     │   │
│  │  - Account limits & policies                         │   │
│  │  - Virtual cards                                     │   │
│  │  - Invoices                                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Key Architecture Decisions

### 1. Widget Rendering: **Client-Side Only**
- ✅ Server returns plain JSON responses
- ✅ Client tools.ts constructs `_widget` objects after receiving data
- ✅ Keeps server simple and stateless
- ✅ Client already has full widget system implemented

### 2. Security Model
- ✅ OpenAI keys managed via Supabase Edge Function (ephemeral tokens)
- ✅ Paystack secret key stored in server environment variables only
- ✅ Client never has direct access to API keys
- ✅ CORS properly configured on server (allow client origin)
- ✅ Optional: JWT/session auth between client and server

### 3. Database Choice
- **Recommended**: SQLite with Go's `mattn/go-sqlite3` or `modernc.org/sqlite`
- **Alternative**: In-memory store with `sync.Map` (demo-only, non-persistent)
- **Why SQLite**: Lightweight, zero-config, persistent, perfect for single-user demo

---

## Milestone 1: Server HTTP Infrastructure (Priority 1)

**Goal**: Convert Go MCP server to also serve HTTP endpoints for client consumption

### Tasks

- [ ] **M1.1** - Add HTTP server alongside SSE MCP server
  - Choose router: `chi`, `gin`, or `fiber`
  - Set up CORS middleware (allow client origin: http://localhost:8080)
  - Health check endpoint: `GET /health`

- [ ] **M1.2** - Set up SQLite database
  - Schema design:
    - `transactions` table (id, batch_ref, type, amount, currency, status, timestamp, metadata)
    - `beneficiaries` table (id, name, account_number, bank_code, metadata)
    - `account_limits` table (id, limit_type, amount, currency, period, created_at)
    - `virtual_cards` table (id, label, card_id, last4, spend_limit, currency, status, expires_at)
    - `invoices` table (id, invoice_number, customer_email, amount, currency, status, due_date)
  - Initialize database on server startup
  - Migrations system (optional: `golang-migrate/migrate`)

- [ ] **M1.3** - Create HTTP handlers for all 7 core tools
  - `POST /api/pay-contractors-bulk` → calls Paystack bulk transfer
  - `POST /api/set-account-limits` → persists to database
  - `POST /api/set-beneficiary-limit` → persists to database
  - `POST /api/create-virtual-card` → calls Paystack virtual card API
  - `POST /api/send-invoice` → creates invoice (email notification optional)
  - `POST /api/aggregate-transactions` → queries database with filters
  - `POST /api/account-snapshot` → aggregates balance + KPIs

- [ ] **M1.4** - Input validation middleware
  - JSON schema validation for all endpoints
  - Return standardized error responses

- [ ] **M1.5** - Logging and error handling
  - Structured logging (use `zerolog` or `zap`)
  - Graceful error responses with status codes

**Deliverable**: Server accepts HTTP POST requests and returns JSON

---

## Milestone 2: Client-Server Integration (Priority 1)

**Goal**: Connect client OpenAI tools to server HTTP API

### Tasks

- [ ] **M2.1** - Install and configure `ky` HTTP client
  ```bash
  npm install ky
  ```
  - Create `src/lib/api.ts` with configured ky instance
  - Base URL from environment variable (`VITE_SERVER_URL`)
  - Timeout configuration (30s for bulk operations)

- [ ] **M2.2** - Update `tools.ts` executeToolCall functions
  - Replace mock data with `ky.post()` calls to server
  - Handle server errors gracefully
  - Parse JSON responses
  - Construct `_widget` objects from server data

- [ ] **M2.3** - Add environment variables
  - `.env` file:
    ```
    VITE_SERVER_URL=http://localhost:4000
    ```
  - Update `.env.example` for documentation

- [ ] **M2.4** - Error handling and user feedback
  - Network error handling (retry logic optional)
  - Toast notifications for server errors
  - Loading states during API calls

- [ ] **M2.5** - Test all 7 tools end-to-end
  - Voice command → OpenAI tool call → HTTP request → Server → Response → Widget

**Deliverable**: Client successfully calls server API for all tools

---

## Milestone 3: Paystack Integration (Priority 2)

**Goal**: Replace MCP-only logic with HTTP-accessible Paystack operations

### Tasks

- [ ] **M3.1** - Bulk Transfers (for pay_contractors_bulk)
  - Use existing Paystack SDK bulk transfer method
  - Store transaction records in database
  - Return batch status with reference

- [ ] **M3.2** - Virtual Cards (for create_virtual_card)
  - Paystack virtual card creation API
  - Store card metadata in database
  - Mask sensitive card data in responses

- [ ] **M3.3** - Invoice Creation (for send_invoice)
  - Paystack invoice API or custom implementation
  - Email notification via SMTP or Paystack
  - Track invoice status

- [ ] **M3.4** - Balance and Wallet Info (for account_snapshot)
  - Fetch Paystack wallet balance
  - Aggregate transaction totals from database

- [ ] **M3.5** - Error handling for Paystack API failures
  - Retry logic for transient errors
  - Meaningful error messages to client

**Deliverable**: All financial operations use real Paystack API

---

## Milestone 4: Widget Enhancements (Priority 2)

**Goal**: Improve widget rendering for all tool responses

### Tasks

- [ ] **M4.1** - Add widgets for missing tools
  - `set_account_limits` widget:
    - Display limits in formatted KeyValueList
    - Show effective_from date
    - Success badge
  - `set_beneficiary_transfer_limit` widget:
    - Beneficiary info
    - Limit breakdown (daily/weekly/monthly)
    - Alert threshold indicator

- [ ] **M4.2** - Widget schema validation improvements
  - Test all widget structures with `validateWidget()`
  - Add unit tests for new widget components

- [ ] **M4.3** - Widget animation polish (optional)
  - Smooth expand/collapse for FrameHeader
  - Fade-in animations for new widgets

**Deliverable**: All 7 tools have rich, consistent widget displays

---

## Milestone 5: Analytics & Limits System (Priority 3)

**Goal**: Implement transaction tracking and limit enforcement

### Tasks

- [ ] **M5.1** - Transaction storage pipeline
  - Save all transfers to database on success
  - Tag transactions with categories (Food, Family, Transport, etc.)
  - Store metadata for filtering

- [ ] **M5.2** - Aggregate queries implementation
  - `total_transfers_value` - sum by date range
  - `total_transfers_count` - count by date range
  - `top_categories` - group by category, sort by value
  - Beneficiary-specific filtering

- [ ] **M5.3** - Limit enforcement logic
  - Check daily/monthly transfer limits before processing
  - Check beneficiary-specific limits
  - Return error if limit exceeded

- [ ] **M5.4** - Alert system (80% threshold)
  - Calculate percentage of limit used
  - Return warning flags in API responses
  - Optional: Push notifications or webhooks

- [ ] **M5.5** - Beneficiary management
  - CRUD endpoints for beneficiaries
  - Group/label system (e.g., "siblings", "family")
  - Transfer history per beneficiary

**Deliverable**: Fully functional limits and analytics system

---

## Milestone 6: Additional Tools (Priority 3)

**Goal**: Implement tools needed for complete demo script

### Tasks

- [ ] **M6.1** - Risk Check Tool (Scene 4: `run_client_risk_check`)
  - Research Paystack/Nigerian credit check APIs (Mono, Okra, etc.)
  - Implement mock risk scoring for demo
  - Return credit history summary
  - Widget display with risk score visualization

- [ ] **M6.2** - Message Sending Tool (`send_message`)
  - Email via SMTP or SendGrid
  - SMS via Termii, AfricasTalking, or Twilio
  - Store message log in database

- [ ] **M6.3** - Transaction List Tool (optional)
  - `GET /api/transactions` with pagination
  - Filters: date range, status, beneficiary
  - Support for demo "Lagos street scroll" overlay

**Deliverable**: Demo script scenes fully supported

---

## Milestone 7: Security & Production Readiness (Priority 4)

**Goal**: Secure the application for deployment

### Tasks

- [ ] **M7.1** - Authentication between client and server
  - Option A: Supabase JWT validation
  - Option B: Session tokens
  - Middleware to verify requests

- [ ] **M7.2** - Rate limiting
  - Per-IP or per-user rate limits
  - Protect against abuse

- [ ] **M7.3** - Input sanitization
  - SQL injection prevention (use parameterized queries)
  - XSS prevention in stored data

- [ ] **M7.4** - Environment variable validation
  - Check required vars on startup
  - Fail fast with clear error messages

- [ ] **M7.5** - HTTPS/TLS configuration
  - Self-signed cert for local development
  - Production cert setup documentation

**Deliverable**: Secure, production-ready application

---

## Milestone 8: Testing & Documentation (Priority 4)

**Goal**: Ensure reliability and maintainability

### Tasks

- [ ] **M8.1** - Unit tests for server handlers
  - Test each endpoint with valid/invalid inputs
  - Mock Paystack API responses

- [ ] **M8.2** - Integration tests
  - End-to-end client → server → database flows
  - Test all 7 core tools

- [ ] **M8.3** - Demo script walkthrough
  - Test exact voice commands from moniewave.md
  - Verify all scenes work as scripted

- [ ] **M8.4** - API documentation
  - OpenAPI/Swagger spec for all endpoints
  - Request/response examples

- [ ] **M8.5** - Deployment guide
  - Server deployment (Docker optional)
  - Client build and deployment
  - Environment setup instructions

**Deliverable**: Fully tested and documented system

---

## Timeline Estimates

| Milestone | Estimated Time | Priority |
|-----------|----------------|----------|
| M1: Server HTTP Infrastructure | 3-5 days | P1 |
| M2: Client-Server Integration | 2-3 days | P1 |
| M3: Paystack Integration | 3-4 days | P2 |
| M4: Widget Enhancements | 1-2 days | P2 |
| M5: Analytics & Limits | 3-4 days | P3 |
| M6: Additional Tools | 2-3 days | P3 |
| M7: Security & Production | 2-3 days | P4 |
| M8: Testing & Documentation | 2-3 days | P4 |
| **Total** | **18-27 days** | |

---

## Critical Path (MVP for Demo)

To get a working demo ASAP, focus on:

1. ✅ **Week 1**: M1 + M2 (Server infrastructure + Client integration)
2. ✅ **Week 2**: M3 (Paystack) + M4 (Widgets)
3. ✅ **Week 3**: M6.1 (Risk check) + M8.3 (Demo script testing)

**MVP Delivery**: 3 weeks

---

## Open Questions to Resolve

1. **Database**: SQLite or in-memory? (Recommend SQLite for persistence)
2. **Authentication**: Do we need user accounts or is this single-user demo?
3. **Paystack Virtual Cards**: Does Paystack Nigeria support virtual card creation? (Verify API availability)
4. **Risk Check API**: Which vendor for credit checks? (Mono, Okra, or mock data?)
5. **Email/SMS**: Which provider for notifications? (Termii, AfricasTalking, SendGrid?)
6. **Deployment**: Where will this be hosted? (Render, Railway, DigitalOcean, local?)

---

## Success Criteria

- [ ] All 7 core tools work end-to-end with real Paystack API
- [ ] Voice commands from demo script execute successfully
- [ ] Widgets display correctly for all tool responses
- [ ] Server runs stably with database persistence
- [ ] Security: No API keys exposed in client
- [ ] Demo can be recorded without technical glitches

---

## Notes

- Server will listen on port `4000` (configurable)
- Client dev server on port `8080`
- Use CORS for local development, proper auth for production
- Mock data acceptable for demo if Paystack APIs are unavailable
- Widget system is already robust - focus on server-side logic
