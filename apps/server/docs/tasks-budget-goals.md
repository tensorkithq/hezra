# Budgets & Financial Goals System - Implementation Specification

## Overview

A comprehensive system to help users stay disciplined with spending by setting budget limits and tracking financial goals. Goals are planned expenses/commitments that users want to achieve, while budgets enforce spending limits across different time periods.

## Core Concept

- **Goals** = Planned expenses/commitments (e.g., "Sunday Brunch", "Buy Stocks", "Emergency Fund")
- **Budgets** = Spending limits for time periods (monthly, quarterly, yearly, emergency)
- Goals are linked to budgets - when a goal is achieved via an expense, it deducts from the budget
- System validates affordability before allowing goal achievement

## Flow

1. User creates budget limits (e.g., "January Budget: ₦100,000")
2. User creates goals linked to budgets (e.g., "Sunday Brunch: ₦20,000" → January Budget)
3. User creates expense for the goal
4. User attempts to mark goal as achieved with expense_id
5. System checks if linked budget can afford it:
   - **Affordable**: Goal marked as achieved, budget updated, expense linked
   - **Not affordable**: Rejected with suggestion to adjust goal or increase budget

## Database Schema

### 0. Updates to `expenses` Table

Add budget tracking to existing expenses table:

```sql
ALTER TABLE expenses ADD COLUMN goal_id INTEGER;
ALTER TABLE expenses ADD COLUMN budget_limit_id INTEGER;

CREATE INDEX idx_expenses_goal ON expenses(goal_id);
CREATE INDEX idx_expenses_budget ON expenses(budget_limit_id);
```

**New Fields:**
- `goal_id` - Optional link to goal (FK to goals)
- `budget_limit_id` - Which budget this expense is tracked against (FK to budget_limits)

**Logic:**
- If `goal_id` is set, `budget_limit_id` is inherited from the goal
- If `goal_id` is null but `budget_limit_id` is set, expense directly linked to budget
- If both are null, system assigns default budget and sets `budget_limit_id`

### 1. `goals` Table

Stores planned expenses/commitments users want to achieve.

```sql
CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    goal_type TEXT NOT NULL,
    target_amount INTEGER NOT NULL,
    budget_limit_id INTEGER,
    frequency TEXT NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME,
    status TEXT DEFAULT 'pending',
    achieved_at DATETIME,
    achieved_by_expense_id INTEGER,
    category TEXT,
    priority TEXT DEFAULT 'medium',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (budget_limit_id) REFERENCES budget_limits(id),
    FOREIGN KEY (achieved_by_expense_id) REFERENCES expenses(id)
);

CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_budget ON goals(budget_limit_id);
CREATE INDEX idx_goals_type ON goals(goal_type);
CREATE INDEX idx_goals_frequency ON goals(frequency);
```

**Fields:**
- `id` - Primary key
- `title` - Name of the goal (e.g., "Sunday Brunch", "Buy Stocks")
- `description` - Optional detailed description
- `goal_type` - Type of goal: `recurring_expense`, `investment`, `purchase`, `emergency`
- `target_amount` - Amount needed to achieve goal (in kobo)
- `budget_limit_id` - Which budget to deduct from (FK to budget_limits)
- `frequency` - How often: `one-time`, `weekly`, `monthly`, `quarterly`, `yearly`
- `start_date` - When goal becomes active
- `end_date` - Optional deadline for achieving goal
- `status` - Current state: `pending`, `achieved`, `cancelled`, `failed`
- `achieved_at` - Timestamp when goal was marked as achieved
- `achieved_by_expense_id` - Which expense fulfilled this goal (FK to expenses)
- `category` - Grouping: `lifestyle`, `investment`, `emergency`, `family`, etc.
- `priority` - Importance: `high`, `medium`, `low`
- `notes` - Additional notes
- `created_at`, `updated_at` - Timestamps

### 2. `budget_limits` Table

Stores spending limits for different time periods.

```sql
CREATE TABLE IF NOT EXISTS budget_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    limit_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    period_start DATETIME NOT NULL,
    period_end DATETIME NOT NULL,
    spent_amount INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    alert_threshold INTEGER DEFAULT 80,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_budget_limits_type ON budget_limits(limit_type);
CREATE INDEX idx_budget_limits_status ON budget_limits(status);
CREATE INDEX idx_budget_limits_period ON budget_limits(period_start, period_end);
```

**Fields:**
- `id` - Primary key
- `name` - Budget name (e.g., "January 2025 Budget", "Q1 Emergency Fund", "Default Budget - January 2025")
- `limit_type` - Period type: `monthly`, `quarterly`, `yearly`, `emergency_fund`, `default`
- `amount` - Total budget limit (in kobo)
- `period_start` - Start of budget period
- `period_end` - End of budget period
- `spent_amount` - Total spent from this budget (updated when goals achieved)
- `status` - Current state: `active`, `exceeded`, `completed`, `paused`
- `alert_threshold` - Warning percentage (default 80%)
- `notes` - Additional notes
- `created_at`, `updated_at` - Timestamps

**Special Budget Type: `default`**
- Auto-created by system when needed
- One per period (month/quarter/year based on user preference)
- Catches all expenses without explicit goal or budget
- Naming convention: "Default Budget - [Period]" (e.g., "Default Budget - January 2025")
- Users can adjust the amount at any time

### 3. Default Budget Auto-Creation

When an expense is created without `goal_id` or `budget_limit_id`:

```
1. System checks current date
2. Determines period (month/quarter/year - configurable)
3. Looks for existing default budget:
   - WHERE limit_type = 'default'
   - AND period_start <= current_date
   - AND period_end >= current_date
   - AND status = 'active'
4. If found: Use it
5. If not found: Create new default budget
   - name: "Default Budget - [Month Year]"
   - limit_type: 'default'
   - amount: System default (e.g., ₦50,000 or configurable)
   - period: Current month start/end
   - status: 'active'
```

## API Endpoints

### Expense Creation (Modified)

The existing expense creation endpoint now includes budget validation:

```
POST /api/v1/expenses/create

Request Body:
{
  "recipient_code": "RCP_xxx",
  "amount": 1000000,
  "currency": "NGN",
  "category": "groceries",
  "description": "Weekly shopping",
  "goal_id": null,           // Optional - link to goal
  "budget_limit_id": null,   // Optional - explicit budget
  "notes": "Additional notes"
}

Budget Resolution Logic:
1. If goal_id provided:
   - Get goal's budget_limit_id
   - Check budget affordability
   - If ok: create expense + auto-achieve goal + update budget

2. Else if budget_limit_id provided:
   - Check budget affordability
   - If ok: create expense + update budget

3. Else (no goal or budget):
   - Find or create default budget
   - Check default budget affordability
   - If ok: create expense + update default budget

Response if affordable:
{
  "status": true,
  "message": "Expense created successfully",
  "data": {
    "id": 45,
    "amount": 1000000,
    "budget_limit_id": 3,
    "budget_name": "Default Budget - January 2025",
    "budget_remaining": 4000000,
    "goal_id": null,
    "goal_status": null,
    ...
  }
}

Response if NOT affordable:
{
  "status": false,
  "error": "Budget limit exceeded. Cannot create expense.",
  "data": {
    "requested_amount": 1000000,
    "budget_id": 3,
    "budget_name": "Default Budget - January 2025",
    "budget_limit": 5000000,
    "budget_spent": 4800000,
    "budget_remaining": 200000,
    "shortfall": 800000,
    "suggestions": [
      "Reduce expense amount by ₦8,000",
      "Increase Default Budget by ₦8,000",
      "Use a different budget",
      "Wait for next budget period"
    ]
  }
}
```

**Key Changes to Expense Handler:**
- Add budget validation before creating expense
- Auto-assign default budget if none specified
- Update budget.spent_amount on successful creation
- If goal_id provided, auto-achieve goal on success
- Reject creation if budget exceeded

### Goals Management

#### Create Goal
```
POST /api/v1/goals/create

Request Body:
{
  "title": "Sunday Brunch",
  "description": "Weekly family brunch",
  "goal_type": "recurring_expense",
  "target_amount": 2000000,
  "budget_limit_id": 1,
  "frequency": "weekly",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "category": "lifestyle",
  "priority": "high",
  "notes": "Every Sunday at 11am"
}

Response:
{
  "status": true,
  "message": "Goal created successfully",
  "data": {
    "id": 5,
    "title": "Sunday Brunch",
    "goal_type": "recurring_expense",
    "target_amount": 2000000,
    "budget_limit_id": 1,
    "frequency": "weekly",
    "status": "pending",
    ...
  }
}
```

#### List Goals
```
POST /api/v1/goals/list

Request Body (all optional):
{
  "status": "pending",
  "budget_limit_id": 1,
  "goal_type": "recurring_expense",
  "category": "lifestyle",
  "priority": "high",
  "count": 10,
  "offset": 0
}

Response:
{
  "status": true,
  "data": [
    {
      "id": 5,
      "title": "Sunday Brunch",
      "target_amount": 2000000,
      "status": "pending",
      "budget_name": "January Budget",
      ...
    },
    ...
  ]
}
```

#### Get Goal
```
GET /api/v1/goals/{id}

Response:
{
  "status": true,
  "data": {
    "id": 5,
    "title": "Sunday Brunch",
    "target_amount": 2000000,
    "budget_limit_id": 1,
    "budget_name": "January Budget",
    "budget_remaining": 5000000,
    "status": "pending",
    "achieved_at": null,
    "achieved_by_expense_id": null,
    ...
  }
}
```

#### Update Goal
```
PUT /api/v1/goals/{id}/update

Request Body (all optional):
{
  "title": "Sunday Brunch - Updated",
  "target_amount": 2500000,
  "budget_limit_id": 2,
  "priority": "medium",
  "notes": "Updated notes"
}

Response:
{
  "status": true,
  "message": "Goal updated successfully",
  "data": { ... }
}
```

#### Achieve Goal (Critical Endpoint)
```
POST /api/v1/goals/{id}/achieve

Request Body:
{
  "expense_id": 45
}

Response if affordable:
{
  "status": true,
  "message": "Goal achieved successfully",
  "data": {
    "goal_id": 5,
    "status": "achieved",
    "achieved_at": "2025-01-15T10:30:00Z",
    "expense_id": 45,
    "amount_spent": 1800000,
    "budget_name": "January Budget",
    "budget_spent": 3200000,
    "budget_remaining": 6800000,
    "budget_usage_percent": 32
  }
}

Response if NOT affordable:
{
  "status": false,
  "error": "Budget limit exceeded. Cannot achieve goal.",
  "data": {
    "goal_id": 5,
    "goal_amount": 2000000,
    "budget_id": 1,
    "budget_name": "January Budget",
    "budget_limit": 10000000,
    "budget_spent": 9000000,
    "budget_remaining": 1000000,
    "shortfall": 1000000,
    "suggestions": [
      "Reduce goal amount by ₦10,000",
      "Increase January Budget by ₦10,000",
      "Use a different budget",
      "Wait for next budget period"
    ]
  }
}
```

#### Delete/Cancel Goal
```
DELETE /api/v1/goals/{id}

Response:
{
  "status": true,
  "message": "Goal cancelled successfully"
}
```

### Budget Limits Management

#### Create Budget
```
POST /api/v1/budgets/create

Request Body:
{
  "name": "January 2025 Budget",
  "limit_type": "monthly",
  "amount": 10000000,
  "period_start": "2025-01-01",
  "period_end": "2025-01-31",
  "alert_threshold": 80,
  "notes": "Monthly spending limit"
}

Response:
{
  "status": true,
  "message": "Budget created successfully",
  "data": {
    "id": 1,
    "name": "January 2025 Budget",
    "limit_type": "monthly",
    "amount": 10000000,
    "spent_amount": 0,
    "remaining": 10000000,
    "status": "active",
    "usage_percent": 0,
    ...
  }
}
```

#### List Budgets
```
POST /api/v1/budgets/list

Request Body (all optional):
{
  "limit_type": "monthly",
  "status": "active",
  "active": true,
  "count": 10,
  "offset": 0
}

Response:
{
  "status": true,
  "data": [
    {
      "id": 1,
      "name": "January 2025 Budget",
      "amount": 10000000,
      "spent_amount": 3000000,
      "remaining": 7000000,
      "usage_percent": 30,
      "status": "active",
      ...
    },
    ...
  ]
}
```

#### Get Budget
```
GET /api/v1/budgets/{id}

Response:
{
  "status": true,
  "data": {
    "id": 1,
    "name": "January 2025 Budget",
    "limit_type": "monthly",
    "amount": 10000000,
    "spent_amount": 3000000,
    "remaining": 7000000,
    "usage_percent": 30,
    "status": "active",
    "alert_threshold": 80,
    "is_near_limit": false,
    "goals_count": 5,
    "achieved_goals_count": 2,
    ...
  }
}
```

#### Update Budget
```
PUT /api/v1/budgets/{id}/update

Request Body (all optional):
{
  "name": "January 2025 Budget - Updated",
  "amount": 12000000,
  "alert_threshold": 85,
  "status": "active",
  "notes": "Increased limit"
}

Response:
{
  "status": true,
  "message": "Budget updated successfully",
  "data": { ... }
}
```

#### Check Affordability
```
GET /api/v1/budgets/{id}/check/{amount}

Example: GET /api/v1/budgets/1/check/1800000

Response if affordable:
{
  "status": true,
  "data": {
    "can_afford": true,
    "requested_amount": 1800000,
    "budget_limit": 10000000,
    "budget_spent": 3000000,
    "budget_remaining": 7000000,
    "after_transaction": 5200000,
    "usage_before": 30,
    "usage_after": 48,
    "will_trigger_alert": false
  }
}

Response if NOT affordable:
{
  "status": false,
  "error": "Insufficient budget",
  "data": {
    "can_afford": false,
    "requested_amount": 1800000,
    "budget_limit": 10000000,
    "budget_spent": 9500000,
    "budget_remaining": 500000,
    "shortfall": 1300000,
    "suggestion": "Increase budget by ₦13,000 or reduce amount by ₦13,000"
  }
}
```

#### Get Active Budgets
```
GET /api/v1/budgets/active

Response:
{
  "status": true,
  "data": [
    {
      "id": 1,
      "name": "January 2025 Budget",
      "limit_type": "monthly",
      "amount": 10000000,
      "spent_amount": 3000000,
      "remaining": 7000000,
      "usage_percent": 30,
      ...
    },
    {
      "id": 2,
      "name": "Emergency Fund",
      "limit_type": "emergency_fund",
      "amount": 5000000,
      "spent_amount": 0,
      "remaining": 5000000,
      "usage_percent": 0,
      ...
    }
  ]
}
```

#### Get Budget Goals
```
GET /api/v1/budgets/{id}/goals

Response:
{
  "status": true,
  "data": {
    "budget_id": 1,
    "budget_name": "January 2025 Budget",
    "total_goals": 5,
    "pending_goals": 3,
    "achieved_goals": 2,
    "goals": [
      {
        "id": 5,
        "title": "Sunday Brunch",
        "target_amount": 2000000,
        "status": "pending",
        ...
      },
      ...
    ]
  }
}
```

## Use Cases

### Use Case 1: Weekly Recurring Goal (Sunday Brunch)

**Step 1: Create monthly budget**
```bash
POST /budgets/create
{
  "name": "January 2025 Budget",
  "limit_type": "monthly",
  "amount": 10000000,  # ₦100,000
  "period_start": "2025-01-01",
  "period_end": "2025-01-31"
}
# Returns budget_id: 1
```

**Step 2: Create recurring goal**
```bash
POST /goals/create
{
  "title": "Sunday Brunch",
  "goal_type": "recurring_expense",
  "target_amount": 2000000,  # ₦20,000 per brunch
  "budget_limit_id": 1,
  "frequency": "weekly"
}
# Returns goal_id: 5
```

**Step 3: Each Sunday - create expense**
```bash
POST /expenses/create
{
  "recipient_code": "RCP_restaurant",
  "amount": 1800000,  # ₦18,000
  "description": "Sunday brunch at restaurant"
}
# Returns expense_id: 45
```

**Step 4: Link expense to goal**
```bash
POST /goals/5/achieve
{
  "expense_id": 45
}
# System checks budget #1
# Budget has ₦82,000 remaining (₦100k - ₦18k)
# Approves: goal marked as achieved, budget updated
```

**Step 5: Next Sunday - repeat**
```bash
# Create new goal instance for next week
POST /goals/create
{
  "title": "Sunday Brunch - Week 2",
  "goal_type": "recurring_expense",
  "target_amount": 2000000,
  "budget_limit_id": 1,
  "frequency": "weekly"
}
# Create expense and link...
```

### Use Case 2: Investment Goal (Buy Stocks)

**Step 1: Create quarterly budget**
```bash
POST /budgets/create
{
  "name": "Q1 2025 Investment Budget",
  "limit_type": "quarterly",
  "amount": 50000000,  # ₦500,000
  "period_start": "2025-01-01",
  "period_end": "2025-03-31"
}
# Returns budget_id: 2
```

**Step 2: Create investment goal**
```bash
POST /goals/create
{
  "title": "Buy Tech Stocks",
  "goal_type": "investment",
  "target_amount": 20000000,  # ₦200,000
  "budget_limit_id": 2,
  "frequency": "quarterly",
  "priority": "high"
}
# Returns goal_id: 6
```

**Step 3: When ready to invest - create expense**
```bash
POST /expenses/create
{
  "recipient_code": "RCP_broker",
  "amount": 20000000,
  "description": "Stock purchase - Tech portfolio"
}
# Returns expense_id: 46
```

**Step 4: Achieve goal**
```bash
POST /goals/6/achieve
{
  "expense_id": 46
}
# System checks budget #2
# Budget has ₦500,000, spending ₦200,000 leaves ₦300,000
# Approves: goal achieved
```

### Use Case 3: Emergency Spending (Family Help)

**Step 1: Create emergency fund budget**
```bash
POST /budgets/create
{
  "name": "Emergency Fund",
  "limit_type": "emergency_fund",
  "amount": 5000000,  # ₦50,000 for emergencies
  "period_start": "2025-01-01",
  "period_end": "2025-12-31"
}
# Returns budget_id: 3
```

**Step 2: Emergency occurs - create goal**
```bash
POST /goals/create
{
  "title": "Help Family Member - Medical",
  "goal_type": "emergency",
  "target_amount": 3000000,  # ₦30,000
  "budget_limit_id": 3,  # Use emergency fund
  "frequency": "one-time",
  "priority": "high"
}
# Returns goal_id: 7
```

**Step 3: Create expense**
```bash
POST /expenses/create
{
  "recipient_code": "RCP_family",
  "amount": 3000000,
  "description": "Medical emergency assistance"
}
# Returns expense_id: 47
```

**Step 4: Achieve goal**
```bash
POST /goals/7/achieve
{
  "expense_id": 47
}
# System checks emergency budget #3
# Budget has ₦50,000, spending ₦30,000 leaves ₦20,000
# Approves: goal achieved
# Regular monthly budget unaffected!
```

### Use Case 4: Budget Exceeded - Rejection

**Scenario: Monthly budget nearly exhausted**
```bash
# Budget: ₦100,000
# Spent: ₦95,000
# Remaining: ₦5,000

POST /goals/create
{
  "title": "Weekend Trip",
  "target_amount": 15000000,  # ₦150,000
  "budget_limit_id": 1
}
# Returns goal_id: 8

POST /expenses/create
{
  "amount": 15000000
}
# Returns expense_id: 48

POST /goals/8/achieve
{
  "expense_id": 48
}

# Response:
{
  "status": false,
  "error": "Budget limit exceeded. Cannot achieve goal.",
  "data": {
    "goal_amount": 15000000,
    "budget_remaining": 500000,
    "shortfall": 14500000,
    "suggestions": [
      "Reduce goal amount by ₦145,000",
      "Increase January Budget by ₦145,000",
      "Wait for February budget period"
    ]
  }
}
```

## Validation Rules

### Goals
1. `title` is required
2. `goal_type` must be one of: `recurring_expense`, `investment`, `purchase`, `emergency`
3. `target_amount` must be > 0
4. `budget_limit_id` is optional but recommended
5. `frequency` must be one of: `one-time`, `weekly`, `monthly`, `quarterly`, `yearly`
6. `start_date` is required
7. `priority` must be one of: `high`, `medium`, `low` (default: `medium`)
8. Cannot achieve goal if status is already `achieved`
9. Cannot achieve goal without valid expense_id

### Budgets
1. `name` is required
2. `limit_type` must be one of: `monthly`, `quarterly`, `yearly`, `emergency_fund`
3. `amount` must be > 0
4. `period_start` is required
5. `period_end` is required and must be after `period_start`
6. `alert_threshold` must be between 1-100 (default: 80)
7. Cannot mark as `active` if period_end is in the past

### Achieve Goal Logic
1. Goal must exist and be in `pending` status
2. Expense must exist
3. Budget must exist (if goal has budget_limit_id)
4. Budget must be `active`
5. Current date must be within budget period
6. Budget remaining must be >= expense amount
7. If all checks pass:
   - Update goal: `status=achieved`, `achieved_at=now`, `achieved_by_expense_id`
   - Update budget: `spent_amount += expense.amount`
8. If any check fails: reject with helpful error message

## Implementation Checklist

### Database Changes
- [ ] Add `goal_id` and `budget_limit_id` columns to `expenses` table
- [ ] Add indexes on expenses(goal_id) and expenses(budget_limit_id)
- [ ] Create `goals` table migration with indexes
- [ ] Create `budget_limits` table migration with indexes

### Handlers
- [ ] **Modify Expense Handler** (`internal/handlers/expenses.go`)
  - [ ] Add `goal_id` and `budget_limit_id` fields to CreateExpenseRequest
  - [ ] Implement budget resolution logic (goal → explicit → default)
  - [ ] Add budget affordability check before creating expense
  - [ ] Implement default budget auto-creation
  - [ ] Update budget.spent_amount on successful creation
  - [ ] Auto-achieve goal if goal_id provided
  - [ ] Return budget info in response
  - [ ] Handle budget exceeded errors with suggestions
- [ ] Implement Goals handler (`internal/handlers/goals.go`)
  - [ ] Create goal
  - [ ] List goals with filters
  - [ ] Get goal details
  - [ ] Update goal
  - [ ] Achieve goal (with budget validation)
  - [ ] Delete/cancel goal
- [ ] Implement Budgets handler (`internal/handlers/budgets.go`)
  - [ ] Create budget
  - [ ] List budgets with filters
  - [ ] Get budget details
  - [ ] Update budget
  - [ ] Check affordability
  - [ ] Get active budgets
  - [ ] Get budget goals
- [ ] Implement helper functions
  - [ ] `findOrCreateDefaultBudget()` - Get current default budget or create new one
  - [ ] `checkBudgetAffordability(budgetID, amount)` - Validate budget can afford amount
  - [ ] `updateBudgetSpending(budgetID, amount)` - Increment spent_amount
  - [ ] `autoAchieveGoal(goalID, expenseID)` - Mark goal as achieved
- [ ] Register routes in `internal/server/server.go`
- [ ] Write integration tests (`tests/integration/budget_goal_test.go`)
  - [ ] Test goal creation
  - [ ] Test goal achievement (affordable)
  - [ ] Test goal achievement rejection (not affordable)
  - [ ] Test budget creation and tracking
  - [ ] Test multiple goals on same budget
  - [ ] Test emergency fund separation
  - [ ] Test recurring goals
  - [ ] **Test expense creation with budget enforcement**
    - [ ] Expense with goal_id (affordable)
    - [ ] Expense with goal_id (not affordable - reject)
    - [ ] Expense with budget_limit_id (affordable)
    - [ ] Expense with budget_limit_id (not affordable - reject)
    - [ ] Expense with neither (uses default budget - affordable)
    - [ ] Expense with neither (default budget exceeded - reject)
    - [ ] Default budget auto-creation
    - [ ] Goal auto-achievement on expense creation
- [ ] Build and validate
- [ ] Test with real workflows

## Budget Enforcement Strategy

### All Expenses Must Be Budgeted

**Core Principle**: Every expense is tracked against a budget. No untracked spending allowed.

### Expense Budget Resolution (Priority Order)

When creating an expense, the system determines which budget to use:

1. **If `goal_id` provided** → Use the goal's `budget_limit_id`
2. **If `budget_limit_id` provided** → Use the specified budget
3. **If neither provided** → Use the **default budget**

### Default Budget

A special budget that catches all unlinked expenses:
- **Limit Type**: `default`
- **Auto-created**: System creates one per period if missing
- **Naming**: "Default Budget - [Month/Quarter/Year]"
- **Purpose**: Ensure all spending is tracked even if user doesn't plan ahead

### Expense Creation Flow

```
POST /expenses/create
{
  "recipient_code": "RCP_xxx",
  "amount": 1000000,
  "description": "Random purchase",
  "goal_id": null,           // Optional
  "budget_limit_id": null    // Optional
}

System processing:
1. Check if goal_id provided → Get goal's budget_limit_id
2. Else check if budget_limit_id provided → Use it
3. Else find/create default budget for current period
4. Check if budget can afford expense.amount
5. If yes: Create expense + Update budget.spent_amount
6. If no: Reject with budget error + suggestions
```

### Example Scenarios

**Scenario 1: Expense with Goal**
```bash
# Goal has budget_limit_id = 1
POST /expenses/create
{
  "amount": 2000000,
  "goal_id": 5
}
→ Uses budget #1 (from goal)
→ Checks affordability
→ If ok: creates expense, auto-achieves goal, updates budget #1
```

**Scenario 2: Expense with Explicit Budget**
```bash
POST /expenses/create
{
  "amount": 1000000,
  "budget_limit_id": 2
}
→ Uses budget #2
→ Checks affordability
→ If ok: creates expense, updates budget #2
```

**Scenario 3: Expense with No Budget or Goal (Uses Default)**
```bash
POST /expenses/create
{
  "amount": 500000,
  "description": "Unplanned expense"
}
→ Finds/creates default budget for current period
→ Checks default budget affordability
→ If ok: creates expense, updates default budget
→ If not: rejects (even unplanned spending must fit in default budget!)
```

### Benefits

✅ **Complete tracking**: Every expense accounted for in some budget
✅ **Flexibility**: Users can plan with specific budgets or be loose with defaults
✅ **Spend discipline**: Even unplanned spending has limits via default budget
✅ **Reporting clarity**: Can show planned (goal-linked) vs unplanned (default budget) spending
✅ **No bypass**: Users cannot circumvent budget system

## Design Decisions

1. **All expenses must be budgeted**: No untracked spending - uses default budget as fallback
2. **Goals don't auto-deduct from budgets**: User explicitly links expense to goal via `/achieve` endpoint, giving full control
3. **Separate emergency budgets**: Emergency spending doesn't impact regular budget goals
4. **Default budget per period**: Auto-created monthly/quarterly/yearly to catch unplanned expenses
5. **Frequency field is informational**: System doesn't auto-create recurring instances; user creates new goal each period if needed
6. **Budget validation on creation**: Prevents overspending before expense is created
7. **Helpful error messages**: When budget exceeded, provide actionable suggestions
8. **Status tracking**: Clear goal lifecycle (pending → achieved/cancelled/failed)
9. **Flexible budget periods**: Support monthly, quarterly, yearly, and custom emergency funds
10. **Priority levels**: Help users focus on important goals first
