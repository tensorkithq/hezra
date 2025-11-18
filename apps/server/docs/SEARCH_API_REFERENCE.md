# Search API Reference

This document provides quick reference and examples for the new search endpoints designed for voice agent integration.

## Overview

Two search endpoints enable natural language lookups:
1. **Recipients Search** - Find transfer recipients by name, account, or bank
2. **Service Provider Search** - Enhanced with match scoring

**Note**: Customer search is not yet implemented. Use `/customers/list` and filter client-side, or implement customer caching similar to recipients.

All search endpoints return results sorted by relevance (match score) for better voice agent interactions.

---

## 1. Recipient Search

### Endpoint
```
GET /api/v1/recipients/search?q={query}&limit={limit}&offset={offset}
```

### Parameters
- `q` (required): Search query - name, account number, or bank
- `limit` (optional): Max results (default: 10)
- `offset` (optional): Pagination offset (default: 0)

### Match Scoring
- **1.0**: Exact name match
- **0.9**: Partial name match
- **0.85**: Account number match
- **0.7**: Bank name match

### Example Request
```bash
curl -X GET "http://localhost:4000/api/v1/recipients/search?q=andrew&limit=10"
```

### Example Response
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
    "query": "andrew",
    "limit": 10,
    "offset": 0
  }
}
```

### Usage in Voice Agent

**Scenario**: User says "Send 10000 to Andrew"

```python
# Step 1: Search for recipient
response = search_recipients(q="andrew")

if response.total == 0:
    # No recipients found
    agent.say("I don't have anyone named Andrew. Want to add them?")

elif response.total == 1:
    # Single match - proceed with confirmation
    recipient = response.results[0]
    agent.say(f"Send ₦100 to {recipient.name} at {recipient.bank_name}?")

else:
    # Multiple matches - ask for clarification
    agent.say(f"I found {response.total} people named Andrew. Which one?")
    for i, r in enumerate(response.results):
        agent.say(f"{i+1}. {r.name} - {r.bank_name} ({r.account_number[-4:]})")
```

---

## 2. Service Provider Search (Enhanced)

### Endpoint
```
GET /api/v1/service_providers?search={query}&category={category}&limit={limit}&offset={offset}
```

### Parameters
- `search` (optional): Search query - provider/service name, description
- `category` (optional): Filter by category (technology, beauty, pets)
- `limit` (optional): Max results (default: 20)
- `offset` (optional): Pagination offset (default: 0)

### Match Scoring (NEW!)
- **1.0**: Exact provider name match
- **0.9**: Partial provider name match
- **0.85**: Exact service name match
- **0.75**: Partial service name match
- **0.6**: Description match
- **0.5**: Location match

### Example Request
```bash
curl -X GET "http://localhost:4000/api/v1/service_providers?search=camera&limit=5"
```

### Example Response
```json
{
  "status": true,
  "message": "Service providers retrieved successfully",
  "data": {
    "providers": [
      {
        "id": 2,
        "name": "ProGear Solutions",
        "category": "technology",
        "services": [
          {
            "name": "Professional Cameras",
            "price": 60000000
          },
          {
            "name": "Camera Lenses",
            "price": 25000000
          }
        ],
        "description": "Professional photography and videography equipment supplier",
        "location": "Lekki Phase 1, Lagos",
        "rating": 4.9,
        "contact": "+234 806 234 5678",
        "recipient_id": "RCP_serviceprovider",
        "match_score": 0.85
      },
      {
        "id": 1,
        "name": "TechHub Electronics",
        "category": "technology",
        "services": [
          {
            "name": "Professional Cameras",
            "price": 50000000
          }
        ],
        "description": "Your one-stop shop for all technology and gaming equipment needs",
        "location": "Victoria Island, Lagos",
        "rating": 4.8,
        "contact": "+234 803 123 4567",
        "recipient_id": "RCP_serviceprovider",
        "match_score": 0.75
      }
    ],
    "total_count": 2,
    "limit": 5,
    "offset": 0
  }
}
```

### Usage in Voice Agent

**Scenario**: User says "I need a camera"

```python
# Step 1: Search service providers
response = search_service_providers(search="camera", category="technology")

if response.total_count == 0:
    agent.say("I couldn't find any camera providers.")
else:
    agent.say(f"I found {response.total_count} providers with cameras:")
    for provider in response.providers[:3]:  # Top 3
        services = ", ".join([s.name for s in provider.services if "camera" in s.name.lower()])
        agent.say(f"• {provider.name}: {services}")
        agent.say(f"  Rating: {provider.rating}⭐ | {provider.location}")
```

---

## Complete Voice Agent Flow Example

### Scenario: "Send 10000 to Andrew"

```python
# Voice Agent Implementation
class TransferAgent:
    def process_transfer_request(self, utterance):
        # Parse: "Send 10000 to Andrew"
        amount_ngn = 100  # extracted from "10000" in kobo = ₦100
        amount_kobo = 10000  # convert to kobo
        recipient_name = "andrew"

        # Step 1: Search for recipient
        search_result = self.api.get("/recipients/search", params={"q": recipient_name})

        if search_result["data"]["total"] == 0:
            return self.handle_no_recipients(recipient_name)
        elif search_result["data"]["total"] == 1:
            return self.handle_single_recipient(search_result, amount_kobo, amount_ngn)
        else:
            return self.handle_multiple_recipients(search_result, amount_kobo, amount_ngn)

    def handle_single_recipient(self, search_result, amount_kobo, amount_ngn):
        recipient = search_result["data"]["results"][0]

        # Confirm with user
        confirmation = self.say_and_wait(
            f"Send ₦{amount_ngn} to {recipient['name']} at "
            f"{recipient['bank_name']} (ending in {recipient['account_number'][-4:]})?"
        )

        if confirmation == "yes":
            # Execute transfer
            transfer_result = self.api.post("/transfers/initiate", json={
                "recipient_code": recipient["recipient_code"],
                "amount": amount_kobo,
                "reason": f"Transfer to {recipient['name']}",
                "source": "balance"
            })

            if transfer_result["status"]:
                return f"Done! Sent ₦{amount_ngn} to {recipient['name']}"
            else:
                return f"Transfer failed: {transfer_result.get('error', 'Unknown error')}"
        else:
            return "Transfer cancelled"

    def handle_multiple_recipients(self, search_result, amount_kobo, amount_ngn):
        recipients = search_result["data"]["results"]

        # Show options
        options_text = "I found multiple people named Andrew:\n"
        for i, r in enumerate(recipients, 1):
            options_text += f"{i}. {r['name']} - {r['bank_name']} (ending in {r['account_number'][-4:]})\n"
        options_text += "Which one did you mean?"

        # Wait for user selection
        selection = self.say_and_wait(options_text)

        # Parse selection (could be "1", "the first one", "GTBank", etc.)
        selected_recipient = self.resolve_selection(selection, recipients)

        if selected_recipient:
            return self.handle_single_recipient(
                {"data": {"results": [selected_recipient]}},
                amount_kobo,
                amount_ngn
            )
        else:
            return "I didn't understand which recipient you meant. Please try again."

    def handle_no_recipients(self, name):
        response = self.say_and_wait(
            f"I don't have anyone named {name} in your recipients. "
            f"Would you like to add them?"
        )

        if response == "yes":
            return self.create_new_recipient(name)
        else:
            return "Transfer cancelled"

    def create_new_recipient(self, name):
        # Multi-turn conversation to collect bank details
        bank_name = self.say_and_wait(f"Which bank does {name} use?")

        # Search for bank
        banks = self.api.post("/banks/list", json={"count": 0})
        bank = self.find_bank(bank_name, banks["data"])

        if not bank:
            return f"I couldn't find a bank matching '{bank_name}'"

        account_number = self.say_and_wait("What's their account number?")

        # Resolve account to verify
        resolved = self.api.post("/banks/resolve", json={
            "account_number": account_number,
            "bank_code": bank["code"]
        })

        if not resolved["status"]:
            return "I couldn't verify that account number. Please check and try again."

        # Confirm account holder name
        resolved_name = resolved["data"]["account_name"]
        confirmation = self.say_and_wait(
            f"I found an account for {resolved_name}. Is this correct?"
        )

        if confirmation != "yes":
            return "Let's start over with the correct account details."

        # Create recipient
        create_result = self.api.post("/recipients/create", json={
            "type": "nuban",
            "name": resolved_name,
            "account_number": account_number,
            "bank_code": bank["code"],
            "currency": "NGN"
        })

        if create_result["status"]:
            return f"Added {resolved_name} to your recipients! Ready to send money?"
        else:
            return f"Failed to add recipient: {create_result.get('error', 'Unknown error')}"
```

---

## Testing the Search Endpoints

### Test 1: Recipient Search by Name
```bash
# Create a test recipient first
curl -X POST http://localhost:4000/api/v1/recipients/create \
  -H "Content-Type: application/json" \
  -d '{
    "type": "nuban",
    "name": "Andrew Smith",
    "account_number": "0123456789",
    "bank_code": "058",
    "currency": "NGN"
  }'

# Now search for it
curl -X GET "http://localhost:4000/api/v1/recipients/search?q=andrew"
```

### Test 2: Service Provider Search
```bash
# Search for camera-related services
curl -X GET "http://localhost:4000/api/v1/service_providers?search=camera"

# Search within a category
curl -X GET "http://localhost:4000/api/v1/service_providers?search=gaming&category=technology"

# Get all beauty services
curl -X GET "http://localhost:4000/api/v1/service_providers?category=beauty"
```

---

## Error Handling

### Empty Search Query
```bash
curl -X GET "http://localhost:4000/api/v1/recipients/search?q="
```
Response:
```json
{
  "status": false,
  "message": "Bad Request",
  "error": "q query parameter is required"
}
```

### No Results
```bash
curl -X GET "http://localhost:4000/api/v1/recipients/search?q=nonexistent"
```
Response:
```json
{
  "status": true,
  "message": "Found 0 recipients matching 'nonexistent'",
  "data": {
    "results": [],
    "total": 0,
    "query": "nonexistent",
    "limit": 10,
    "offset": 0
  }
}
```

---

## Best Practices

### 1. Always Search Before Creating
```python
# ❌ Bad: Create recipient without checking
create_recipient(name="John", ...)

# ✅ Good: Search first, create only if not found
results = search_recipients(q="John")
if results.total == 0:
    create_recipient(name="John", ...)
```

### 2. Handle Ambiguity Gracefully
```python
# ✅ Good: Present options when multiple matches
if results.total > 1:
    present_options_to_user(results)
    wait_for_clarification()
```

### 3. Use Match Scores for Confidence
```python
# ✅ Good: Skip confirmation for high-confidence matches
if results.total == 1 and results.results[0].match_score >= 0.95:
    # High confidence - proceed with minimal confirmation
    proceed_with_transfer()
else:
    # Lower confidence - require explicit confirmation
    confirm_with_full_details()
```

### 4. Provide Context in Confirmations
```python
# ❌ Bad: Vague confirmation
"Send money to Andrew?"

# ✅ Good: Specific confirmation
f"Send ₦{amount} to {recipient.name} at {recipient.bank_name} "
f"(account ending in {recipient.account_number[-4:]})?"
```

---

## Performance Notes

- **Recipients Search**: Queries local SQLite database - very fast (<10ms)
- **Service Provider Search**: In-memory filtering - very fast (<5ms)

For production scalability, consider:
1. Implementing customer caching locally (similar to recipients)
2. Adding full-text search indexes to SQLite
3. Using Redis for frequently searched items
4. Implementing phonetic/fuzzy matching algorithms

---

## Summary

The search endpoints enable natural, voice-friendly interactions:

✅ **No more asking for account numbers** - "Send to Andrew" works
✅ **Smart disambiguation** - System asks which Andrew if multiple exist
✅ **Relevance ranking** - Best matches first
✅ **Fast lookups** - Cached locally (recipients, service providers)
✅ **Progressive disclosure** - Only ask for details when needed

**Current Status:**
- ✅ Recipient search: Fully implemented with local caching
- ✅ Service provider search: Enhanced with match scoring
- ⏳ Customer search: Not yet implemented (requires caching layer)

This makes the voice agent feel intelligent and reduces user friction significantly.
