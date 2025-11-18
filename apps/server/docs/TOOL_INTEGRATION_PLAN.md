# Voice Agent Tool Integration Plan

## Executive Summary

This document outlines the integration strategy for exposing the Hezra server APIs as tools for voice agent interactions. The plan focuses on creating an intuitive, voice-friendly interface that enables natural language interactions like "send 10000 to andrew" without requiring users to provide complete bank details repeatedly.

## Core Principles

### 1. **Entity Resolution Before Action**
- Always search for entities (recipients, customers, service providers) before write operations
- Cache and retrieve previously stored information
- Minimize user input by leveraging stored data

### 2. **Read-Write Separation**
- **Search/Query Tools**: Safe, no side effects, can be called proactively
- **Action Tools**: Require explicit user confirmation, have side effects

### 3. **Natural Language Friendly**
- Support fuzzy search (partial names, nicknames)
- Handle ambiguity gracefully (multiple matches → clarify)
- Return human-readable results

### 4. **Progressive Disclosure**
- Start with minimal required info
- Fill in details from stored data
- Only ask for missing critical fields

---

## Tool Categories

### Category 1: Entity Search Tools (READ - Safe)
These tools help resolve user references to entities without side effects.

| Tool Name | Purpose | Example Query |
|-----------|---------|---------------|
| `search_recipients` | Find transfer recipients by name | "andrew", "john doe" |
| `search_customers` | Find customers by name/email/phone | "john", "john@example.com" |
| `search_service_providers` | Find service providers | "barber", "tech support" |
| `search_expenses` | Find past expenses | "last month utilities" |
| `search_budgets` | Find budget limits | "monthly budget" |
| `search_goals` | Find financial goals | "vacation fund" |

### Category 2: Information Retrieval Tools (READ)
These tools retrieve specific information about accounts, balances, and statuses.

| Tool Name | Purpose | Returns |
|-----------|---------|---------|
| `get_balance` | Check account balance | Current balance from Paystack |
| `get_recipient_details` | Get full recipient info | Bank details, account number |
| `list_banks` | Get available banks | Bank names and codes |
| `resolve_bank_account` | Verify bank account | Account holder name |
| `check_affordability` | Check if amount is affordable | Verdict, risk level, max amount |
| `get_transaction_status` | Check payment status | Transaction state |

### Category 3: Financial Analysis Tools (READ)
These tools provide insights and summaries.

| Tool Name | Purpose | Returns |
|-----------|---------|---------|
| `get_budget_summary` | Budget usage overview | Spent, remaining, alerts |
| `get_expense_summary` | Expense breakdown | Category totals, trends |
| `get_goal_progress` | Goal achievement status | Progress %, time remaining |
| `get_financial_profile` | Credit profile overview | Credit score, income, verdict |

### Category 4: Transaction Tools (WRITE - Requires Confirmation)
These tools perform actions with financial consequences.

| Tool Name | Purpose | Confirmation Required |
|-----------|---------|----------------------|
| `send_money` | Initiate transfer | Yes - amount, recipient |
| `create_payment_request` | Create invoice | Yes - amount, customer |
| `initialize_payment` | Start payment flow | Yes - amount, callback |
| `record_expense` | Log expense | Yes - amount, category, recipient |

### Category 5: Entity Management Tools (WRITE)
These tools create or update entities.

| Tool Name | Purpose | Use Case |
|-----------|---------|----------|
| `create_recipient` | Add new transfer recipient | First-time recipient |
| `create_customer` | Add new customer | New client onboarding |
| `create_budget` | Set spending limit | Budget planning |
| `create_goal` | Set financial goal | Savings planning |
| `update_budget` | Modify budget | Adjust spending limits |
| `update_goal` | Modify goal | Adjust targets |

---

## Priority 1: Search Implementation

### Problem Statement
Current state: Voice agent receives "send 10000 to andrew"
- ❌ No search endpoint for recipients by name
- ❌ Agent must ask for account number, bank code
- ❌ User frustration from repeated data entry

Desired state:
- ✅ Agent searches recipients: `search_recipients("andrew")`
- ✅ Finds match: "Andrew Smith - GTBank - 0123456789 (RCP_xyz)"
- ✅ Agent confirms: "Send ₦100 to Andrew Smith at GTBank?"
- ✅ User confirms: "Yes"
- ✅ Agent executes: `send_money(recipient_code="RCP_xyz", amount=10000)`

### Search Endpoints to Implement

#### 1. `/recipients/search` (GET)
**Query Parameters:**
- `q`: Search query (name, account number, bank name)
- `limit`: Max results (default 10)
- `offset`: Pagination offset

**Response:**
```json
{
  "status": true,
  "message": "Found 2 recipients matching 'andrew'",
  "data": {
    "results": [
      {
        "id": 1,
        "recipient_code": "RCP_abc123",
        "name": "Andrew Smith",
        "type": "nuban",
        "account_number": "0123456789",
        "bank_code": "058",
        "bank_name": "GTBank",
        "currency": "NGN",
        "created_at": "2025-01-15T10:30:00Z",
        "match_score": 0.95
      },
      {
        "id": 5,
        "recipient_code": "RCP_xyz789",
        "name": "Andrew Johnson",
        "type": "nuban",
        "account_number": "9876543210",
        "bank_code": "033",
        "bank_name": "United Bank for Africa",
        "currency": "NGN",
        "created_at": "2025-01-10T14:20:00Z",
        "match_score": 0.85
      }
    ],
    "total": 2,
    "query": "andrew"
  }
}
```

**Search Algorithm:**
- Case-insensitive partial matching on `name`
- Exact match on `account_number`
- Partial match on `bank_name`
- Return results sorted by relevance (exact > partial)
- Include match score for disambiguation

#### 2. `/customers/search` (GET)
**Query Parameters:**
- `q`: Search query (name, email, phone)
- `limit`: Max results (default 10)

**Response:**
```json
{
  "status": true,
  "message": "Found 1 customer matching 'john'",
  "data": {
    "results": [
      {
        "customer_code": "CUS_abc123",
        "email": "john.doe@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "phone": "+2348123456789",
        "created_at": "2025-01-01T00:00:00Z",
        "match_score": 1.0
      }
    ],
    "total": 1,
    "query": "john"
  }
}
```

**Search Algorithm:**
- Exact match on `email`
- Case-insensitive partial match on `first_name`, `last_name`
- Partial match on `phone`
- Combine name fields for full name search

#### 3. `/service_providers/search` (GET)
**Enhances existing `/service_providers` endpoint**

**Query Parameters:**
- `q`: Search query (provider name, service name)
- `category`: Filter by category (optional)
- `limit`: Max results

**Response:** Same as existing, but filtered by search query across:
- Provider `name`
- Provider `description`
- Service `service_name`
- Service `description`

---

## Tool Integration Architecture

### Voice Agent Flow: "Send 10000 to Andrew"

```
┌─────────────────────────────────────────────────────────────┐
│ User: "Send 10000 to Andrew"                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Agent: Parse Intent                                          │
│ - Action: send_money                                         │
│ - Amount: 10000                                              │
│ - Recipient: "Andrew" (needs resolution)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Tool Call: search_recipients(q="andrew")                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
    ┌────────┐            ┌─────────────┐
    │ 0 hits │            │ 2+ hits     │
    └───┬────┘            └──────┬──────┘
        │                        │
        ▼                        ▼
    Ask to create         Show options,
    recipient             ask to clarify
                                │
         ┌──────────────────────┘
         │
         ▼
    ┌────────┐
    │ 1 hit  │
    └───┬────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ Agent: Confirm with user                                     │
│ "Send ₦100 to Andrew Smith at GTBank (0123456789)?"        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
    ┌────────┐            ┌──────────┐
    │   No   │            │   Yes    │
    └───┬────┘            └─────┬────┘
        │                       │
        ▼                       ▼
    Cancel              ┌───────────────────────────────────────┐
                        │ Tool Call: send_money(                │
                        │   recipient_code="RCP_abc123",        │
                        │   amount=1000000  // kobo             │
                        │ )                                     │
                        └──────────┬────────────────────────────┘
                                   │
                                   ▼
                        ┌───────────────────────────────────────┐
                        │ Agent: Confirm success                │
                        │ "Done! ₦100 sent to Andrew Smith"    │
                        └───────────────────────────────────────┘
```

### Ambiguity Resolution Pattern

When `search_recipients("andrew")` returns multiple matches:

```
Agent: "I found 2 people named Andrew:
1. Andrew Smith at GTBank (ending in 6789)
2. Andrew Johnson at UBA (ending in 3210)

Which one did you mean?"

User: "The first one" / "GTBank" / "Smith"

Agent: [Re-executes search with more context or picks from list]
```

---

## Tool Schema Definitions

### OpenAI Function Calling Format

```json
{
  "name": "search_recipients",
  "description": "Search for transfer recipients by name, account number, or bank. Use this before initiating transfers to resolve recipient identity.",
  "parameters": {
    "type": "object",
    "properties": {
      "q": {
        "type": "string",
        "description": "Search query - can be recipient name (e.g., 'andrew', 'john smith'), account number, or bank name"
      },
      "limit": {
        "type": "integer",
        "description": "Maximum number of results to return",
        "default": 10
      }
    },
    "required": ["q"]
  }
}
```

```json
{
  "name": "send_money",
  "description": "Initiate a money transfer to a recipient. IMPORTANT: Always call search_recipients first to resolve the recipient_code. Confirm with user before calling.",
  "parameters": {
    "type": "object",
    "properties": {
      "recipient_code": {
        "type": "string",
        "description": "Paystack recipient code (e.g., 'RCP_abc123'). Obtain from search_recipients tool."
      },
      "amount": {
        "type": "number",
        "description": "Amount to send in kobo (multiply NGN by 100). E.g., ₦100 = 10000 kobo"
      },
      "reason": {
        "type": "string",
        "description": "Transfer reason/narration"
      },
      "source": {
        "type": "string",
        "description": "Transfer source",
        "default": "balance",
        "enum": ["balance"]
      }
    },
    "required": ["recipient_code", "amount"]
  }
}
```

### Anthropic Tool Use Format

```json
{
  "name": "search_recipients",
  "description": "Search for transfer recipients by name, account number, or bank. Use this before initiating transfers to resolve recipient identity.\n\nExamples:\n- search_recipients(q=\"andrew\")\n- search_recipients(q=\"0123456789\")\n- search_recipients(q=\"GTBank\")",
  "input_schema": {
    "type": "object",
    "properties": {
      "q": {
        "type": "string",
        "description": "Search query - recipient name, account number, or bank name"
      },
      "limit": {
        "type": "integer",
        "description": "Maximum results (default 10)"
      }
    },
    "required": ["q"]
  }
}
```

---

## Complete Tool Catalog

### Search & Query Tools (18 total)

| Tool Name | Endpoint | Parameters | Use Case |
|-----------|----------|------------|----------|
| `search_recipients` | GET `/recipients/search` | q, limit | Find recipient by name |
| `search_customers` | GET `/customers/search` | q, limit | Find customer by name/email |
| `search_service_providers` | GET `/service_providers` | q, category | Find service provider |
| `search_expenses` | POST `/expenses/list` | category, status, dates | Find past expenses |
| `search_budgets` | POST `/budgets/list` | limit_type, status | Find budgets |
| `search_goals` | POST `/goals/list` | status, category | Find goals |
| `get_balance` | POST `/balance` | - | Check balance |
| `get_recipient` | GET `/recipients/get` | id or code | Get recipient details |
| `list_banks` | POST `/banks/list` | count, offset | List banks |
| `resolve_account` | POST `/banks/resolve` | account_number, bank_code | Verify account |
| `check_affordability` | POST `/verdict/check` | email, amount | Check if affordable |
| `verify_transaction` | POST `/transactions/verify` | reference | Check payment status |
| `verify_invoice` | POST `/invoices/verify/{code}` | code | Check invoice paid |
| `get_budget` | GET `/budgets/{id}` | id | Get budget details |
| `check_budget_amount` | GET `/budgets/{id}/check/{amount}` | id, amount | Check if amount fits |
| `get_goal` | GET `/goals/{id}` | id | Get goal details |
| `get_expense` | GET `/expenses/get/{id}` | id | Get expense details |
| `get_financial_profile` | GET `/verdict/profile` | email | Get credit profile |

### Action Tools (13 total)

| Tool Name | Endpoint | Parameters | Confirmation |
|-----------|----------|------------|--------------|
| `send_money` | POST `/transfers/initiate` | recipient_code, amount, reason | Required |
| `create_payment_request` | POST `/invoices/create` | customer, amount, description | Required |
| `initialize_payment` | POST `/transactions/initialize` | email, amount, currency | Required |
| `record_expense` | POST `/expenses/create` | recipient_code, amount, category | Required |
| `create_recipient` | POST `/recipients/create` | name, account_number, bank_code | Optional |
| `create_customer` | POST `/customers/create` | email, first_name, last_name | Optional |
| `create_budget` | POST `/budgets/create` | name, amount, limit_type | Optional |
| `create_goal` | POST `/goals/create` | title, target_amount, goal_type | Optional |
| `update_budget` | PUT `/budgets/{id}` | id, updates | Optional |
| `update_goal` | PUT `/goals/{id}` | id, updates | Optional |
| `update_expense` | PUT `/expenses/update/{id}` | id, updates | Optional |
| `delete_goal` | DELETE `/goals/{id}` | id | Required |

---

## Implementation Priorities

### Phase 1: Core Search (Week 1)
1. ✅ Implement `/recipients/search` endpoint
2. ✅ Implement `/customers/search` endpoint
3. ✅ Enhance `/service_providers` with search
4. ✅ Test fuzzy matching algorithms
5. ✅ Add match scoring

### Phase 2: Tool Schemas (Week 1)
1. ✅ Define all 31 tool schemas (OpenAI format)
2. ✅ Define all 31 tool schemas (Anthropic format)
3. ✅ Create tool registration system
4. ✅ Add tool validation middleware

### Phase 3: Voice Agent Integration (Week 2)
1. ⏳ Implement confirmation flow for write operations
2. ⏳ Add ambiguity resolution patterns
3. ⏳ Create conversation state management
4. ⏳ Test multi-turn dialogues

### Phase 4: Advanced Features (Week 3)
1. ⏳ Add context awareness (remember last recipient)
2. ⏳ Implement transaction history lookup
3. ⏳ Add "send again" functionality
4. ⏳ Create spending insights tool

---

## Error Handling Patterns

### Search Returns No Results
```
Agent: "I couldn't find anyone named 'andrew' in your recipients.
Would you like to add them? I'll need their bank account details."

User: "Yes" → Trigger create_recipient flow
User: "No" → Cancel operation
```

### Search Returns Multiple Results
```
Agent: "I found 3 recipients matching 'andrew'. Which one?
1. Andrew Smith - GTBank
2. Andrew Johnson - UBA
3. Andrew Williams - Access Bank"

User: "The second one" → Select index
User: "UBA" → Filter by bank
User: "Cancel" → Abort
```

### Insufficient Funds
```
Tool Response: {
  "status": false,
  "message": "Insufficient balance",
  "data": { "balance": 50000, "requested": 100000 }
}

Agent: "You don't have enough balance. You have ₦500 but need ₦1,000."
```

### Budget Exceeded
```
Tool Response: {
  "status": false,
  "message": "Budget limit exceeded",
  "data": {
    "budget": "Monthly Utilities",
    "limit": 100000,
    "spent": 80000,
    "requested": 30000,
    "remaining": 20000
  }
}

Agent: "This expense would exceed your Monthly Utilities budget.
You've spent ₦800 of ₦1,000. This ₦300 expense leaves only ₦200."
```

---

## Security Considerations

### 1. **Confirmation Requirements**
- All money transfers require explicit confirmation
- Show amount, recipient, and bank details before execution
- Log all confirmations with timestamps

### 2. **Amount Limits**
- Implement per-transaction limits (e.g., ₦1,000,000)
- Require additional verification for large amounts
- Daily/monthly spending caps

### 3. **Recipient Verification**
- Always call `resolve_account` before first transfer to new recipient
- Cache verification results
- Flag mismatched names for user confirmation

### 4. **Audit Trail**
- Log all tool calls with user_id and timestamp
- Record search queries (helps improve search)
- Track confirmation/rejection rates

---

## Testing Strategy

### Unit Tests
```go
// Test recipient search
func TestRecipientSearch(t *testing.T) {
    // Exact name match
    results := searchRecipients("Andrew Smith")
    assert.Equal(t, 1, len(results))

    // Partial name match
    results = searchRecipients("andrew")
    assert.GreaterOrEqual(t, len(results), 1)

    // Account number match
    results = searchRecipients("0123456789")
    assert.Equal(t, 1, len(results))

    // No matches
    results = searchRecipients("nonexistent")
    assert.Equal(t, 0, len(results))
}
```

### Integration Tests
```python
# Test full transfer flow
def test_voice_transfer_flow():
    # 1. Search for recipient
    response = agent.process("Send 10000 to andrew")
    assert "search_recipients" in response.tool_calls

    # 2. Confirm transfer
    response = agent.process("Yes, the first one")
    assert "send_money" in response.tool_calls

    # 3. Verify success
    assert "success" in response.message.lower()
```

### Voice Agent Tests
```javascript
// Test ambiguity resolution
describe('Recipient Resolution', () => {
  it('should handle multiple matches', async () => {
    const response = await agent.say('Send money to John');
    expect(response.needsClarification).toBe(true);
    expect(response.options.length).toBeGreaterThan(1);
  });

  it('should handle no matches', async () => {
    const response = await agent.say('Send money to XYZ');
    expect(response.suggestCreateRecipient).toBe(true);
  });
});
```

---

## Voice Agent Best Practices

### 1. **Always Search Before Action**
```python
# ❌ Bad: Direct transfer without search
send_money(recipient_code="RCP_xyz", amount=10000)

# ✅ Good: Search first
recipients = search_recipients(q="andrew")
if len(recipients) == 1:
    confirm_and_send(recipients[0], 10000)
```

### 2. **Confirm Irreversible Actions**
```python
# ✅ Always confirm before transfers
agent.say(f"Send ₦{amount/100} to {recipient.name} at {recipient.bank}?")
confirmation = wait_for_user_response()
if confirmation == "yes":
    send_money(...)
```

### 3. **Handle Ambiguity Gracefully**
```python
# ✅ Present options clearly
if len(recipients) > 1:
    options = "\n".join([
        f"{i+1}. {r.name} - {r.bank_name} ({r.account_number[-4:]})"
        for i, r in enumerate(recipients)
    ])
    agent.say(f"Which recipient?\n{options}")
```

### 4. **Provide Context in Responses**
```python
# ❌ Bad: Vague response
"Transfer successful"

# ✅ Good: Detailed response
f"Sent ₦{amount/100} to {recipient.name} at {recipient.bank}. " \
f"Reference: {reference}. New balance: ₦{balance/100}"
```

---

## Metrics & Monitoring

### Track These KPIs:
1. **Search Effectiveness**
   - % of searches returning 1 exact match
   - % of searches returning 0 results
   - Average match score
   - Most common search queries

2. **User Experience**
   - Average turns per transaction
   - % of transactions requiring clarification
   - % of cancelled transactions
   - Time to completion

3. **Tool Usage**
   - Most/least used tools
   - Tool call success rates
   - Error rates by tool
   - Retry attempts

4. **Business Metrics**
   - Daily transaction volume
   - Average transaction amount
   - New recipients created
   - Budget compliance rate

---

## Next Steps

1. **Immediate (This Week)**
   - ✅ Implement 3 search endpoints
   - ✅ Create tool schema definitions
   - Test search accuracy

2. **Short-term (Next 2 Weeks)**
   - Build confirmation flow middleware
   - Integrate with voice agent platform
   - Conduct user acceptance testing

3. **Medium-term (Next Month)**
   - Add context awareness
   - Implement transaction history
   - Build analytics dashboard

4. **Long-term (Next Quarter)**
   - Machine learning for intent detection
   - Predictive recipient suggestions
   - Multi-language support

---

## Appendix: Example Conversations

### Example 1: Simple Transfer
```
User: "Send 10000 to Andrew"
Agent: [Calls search_recipients(q="andrew")]
Agent: "Send ₦100 to Andrew Smith at GTBank?"
User: "Yes"
Agent: [Calls send_money(recipient_code="RCP_abc", amount=1000000)]
Agent: "Done! ₦100 sent to Andrew Smith. Reference: TRF_xyz"
```

### Example 2: Multiple Matches
```
User: "Send 5000 to John"
Agent: [Calls search_recipients(q="john")]
Agent: "I found 3 people named John:
1. John Smith - GTBank
2. John Doe - UBA
3. John Williams - Access

Which one?"
User: "The first one"
Agent: "Send ₦50 to John Smith at GTBank?"
User: "Yes"
Agent: [Calls send_money(...)]
Agent: "Done!"
```

### Example 3: New Recipient
```
User: "Send 10000 to Sarah"
Agent: [Calls search_recipients(q="sarah")]
Agent: "I don't have Sarah in your recipients. Want to add her?"
User: "Yes"
Agent: "I'll need her bank account details. Which bank?"
User: "GTBank"
Agent: [Calls list_banks(), finds GTBank code 058]
Agent: "What's her account number?"
User: "0123456789"
Agent: [Calls resolve_account(account_number="0123456789", bank_code="058")]
Agent: "Found account holder: Sarah Johnson. Is this correct?"
User: "Yes"
Agent: [Calls create_recipient(...)]
Agent: "Added Sarah Johnson. Now sending ₦100..."
Agent: [Calls send_money(...)]
Agent: "Done!"
```

### Example 4: Budget Check
```
User: "Buy tech service from TechCorp for 50000"
Agent: [Calls search_service_providers(q="techcorp")]
Agent: [Calls check_budget_amount(budget_id=1, amount=5000000)]
Agent: "This ₦500 expense is within your Technology budget (₦200/₦1000 spent). Proceed?"
User: "Yes"
Agent: [Calls record_expense(...)]
Agent: "Recorded ₦500 expense. Budget remaining: ₦300"
```

---

## Document Version
- **Version**: 1.0
- **Date**: 2025-11-18
- **Author**: Claude
- **Status**: Draft for Review
