// Package handlers implements HTTP handlers for the moniewave financial management system.
//
// Expenses Handler - Financial Management Core
//
// OBJECTIVES:
// Users need to track where their money goes and link spending to budgets and goals.
//
// PURPOSE:
// - Record all outgoing payments with detailed context (narration, category, recipient)
// - Connect expenses to budgets for automatic spending tracking
// - Link expenses to financial goals for progress monitoring
// - Maintain payment history for analysis and reporting
//
// KEY WORKFLOW:
// Create Expense → Validate Recipient → Check Budget Limit → Update Budget Spent →
// Link to Goal (if applicable) → Return Budget Status
//
// DESIGN DECISIONS:
// - We use 'narration' instead of 'description' to better convey the story behind each expense
// - Budget tracking is automatic - when you create an expense in a category, it updates the relevant budget
// - Expenses are pending by default, allowing for approval workflows
// - All amounts stored in kobo (Nigerian currency subunit) for precision
// - Recipients are validated against local cache to prevent invalid expense creation
package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"paystack.mpc.proxy/internal/database"

	"github.com/go-chi/chi/v5"
)

type ExpenseHandler struct{}

func NewExpenseHandler() *ExpenseHandler {
	return &ExpenseHandler{}
}

// Expense represents an expense record
type Expense struct {
	ID            int        `json:"id"`
	RecipientCode string     `json:"recipient_code"`
	RecipientName string     `json:"recipient_name"`
	Amount        int        `json:"amount"`
	Currency      string     `json:"currency"`
	Category      string     `json:"category"`
	Narration     string     `json:"narration"`
	Reference     string     `json:"reference"`
	Status        string     `json:"status"`
	PaymentDate   *time.Time `json:"payment_date"`
	Notes         string     `json:"notes"`
	GoalID        *int       `json:"goal_id,omitempty"`
	BudgetLimitID *int       `json:"budget_limit_id,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

type CreateExpenseRequest struct {
	RecipientCode string `json:"recipient_code"`
	Amount        int    `json:"amount"`
	Currency      string `json:"currency,omitempty"`
	Category      string `json:"category,omitempty"`
	Narration     string `json:"narration"`
	Reference     string `json:"reference,omitempty"`
	Notes         string `json:"notes,omitempty"`
	GoalID        *int   `json:"goal_id,omitempty"`
	BudgetLimitID *int   `json:"budget_limit_id,omitempty"`
}

type UpdateExpenseRequest struct {
	Category    string     `json:"category,omitempty"`
	Narration   string     `json:"narration,omitempty"`
	Status      string     `json:"status,omitempty"`
	PaymentDate *time.Time `json:"payment_date,omitempty"`
	Notes       string     `json:"notes,omitempty"`
}

type ListExpensesRequest struct {
	RecipientCode string `json:"recipient_code,omitempty"`
	Category      string `json:"category,omitempty"`
	Status        string `json:"status,omitempty"`
	From          string `json:"from,omitempty"`
	To            string `json:"to,omitempty"`
	Count         int    `json:"count,omitempty"`
	Offset        int    `json:"offset,omitempty"`
}

// Create creates a new expense with budget validation
func (h *ExpenseHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateExpenseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteJSONBadRequest(w, "Invalid request body")
		return
	}

	// Validate required fields
	if req.RecipientCode == "" {
		WriteJSONBadRequest(w, "recipient_code is required")
		return
	}

	if req.Amount <= 0 {
		WriteJSONBadRequest(w, "amount must be greater than 0")
		return
	}

	if req.Narration == "" {
		WriteJSONBadRequest(w, "description is required")
		return
	}

	// Set default currency
	if req.Currency == "" {
		req.Currency = "NGN"
	}

	// Verify recipient exists
	var recipientName string
	err := database.DB.QueryRow("SELECT name FROM recipients WHERE recipient_code = ?", req.RecipientCode).Scan(&recipientName)
	if err != nil {
		WriteJSONError(w, fmt.Errorf("recipient not found: %s", req.RecipientCode), http.StatusNotFound)
		return
	}

	// BUDGET RESOLUTION LOGIC
	// Step 1: Determine which budget to use
	var budgetID int
	var goalID *int

	if req.GoalID != nil && *req.GoalID > 0 {
		// Goal provided - get goal's budget_limit_id
		var goalBudgetID sql.NullInt64
		var goalStatus string
		var goalTargetAmount int
		err := database.DB.QueryRow(
			"SELECT budget_limit_id, status, target_amount FROM goals WHERE id = ?",
			*req.GoalID,
		).Scan(&goalBudgetID, &goalStatus, &goalTargetAmount)

		if err != nil {
			if err == sql.ErrNoRows {
				WriteJSONError(w, fmt.Errorf("goal not found: %d", *req.GoalID), http.StatusNotFound)
				return
			}
			WriteJSONError(w, fmt.Errorf("failed to fetch goal: %w", err), http.StatusInternalServerError)
			return
		}

		// Check if goal is already achieved
		if goalStatus == "achieved" {
			WriteJSONBadRequest(w, "Cannot create expense for an already achieved goal")
			return
		}

		// Check if goal is cancelled or failed
		if goalStatus == "cancelled" || goalStatus == "failed" {
			WriteJSONBadRequest(w, fmt.Sprintf("Cannot create expense for a %s goal", goalStatus))
			return
		}

		// Check if expense amount matches goal target amount
		if req.Amount != goalTargetAmount {
			WriteJSONError(w, fmt.Errorf("expense amount (%d) must match goal target amount (%d)", req.Amount, goalTargetAmount), http.StatusBadRequest)
			return
		}

		if goalBudgetID.Valid && goalBudgetID.Int64 > 0 {
			budgetID = int(goalBudgetID.Int64)
		} else {
			// Goal has no budget - use default budget
			defaultBudget, err := FindOrCreateDefaultBudget()
			if err != nil {
				WriteJSONError(w, fmt.Errorf("failed to get default budget: %w", err), http.StatusInternalServerError)
				return
			}
			budgetID = defaultBudget.ID
		}
		goalID = req.GoalID
	} else if req.BudgetLimitID != nil && *req.BudgetLimitID > 0 {
		// Explicit budget provided
		budgetID = *req.BudgetLimitID
	} else {
		// No goal or budget - use default budget
		defaultBudget, err := FindOrCreateDefaultBudget()
		if err != nil {
			WriteJSONError(w, fmt.Errorf("failed to get default budget: %w", err), http.StatusInternalServerError)
			return
		}
		budgetID = defaultBudget.ID
	}

	// Step 2: Check if budget can afford this expense
	checkResp, err := CheckBudgetAffordability(budgetID, req.Amount)
	if err != nil {
		WriteJSONError(w, fmt.Errorf("error checking budget: %w", err), http.StatusInternalServerError)
		return
	}

	if !checkResp.CanAfford {
		// Budget cannot afford this expense - reject with helpful message
		respondWithJSON(w, http.StatusBadRequest, map[string]interface{}{
			"status":  false,
			"message": "Expense cannot be created: budget limit exceeded",
			"data": map[string]interface{}{
				"budget_limit":      checkResp.BudgetLimit,
				"spent_amount":      checkResp.SpentAmount,
				"remaining":         checkResp.Remaining,
				"requested_amount":  checkResp.RequestedAmount,
				"excess_amount":     checkResp.ExcessAmount,
				"would_exceed":      checkResp.WouldExceed,
				"usage_before":      checkResp.UsageBefore,
				"usage_after":       checkResp.UsageAfter,
				"reason":            checkResp.Reason,
				"suggestions": []string{
					"Reduce the expense amount to fit within the budget",
					"Increase the budget limit to accommodate this expense",
					"Wait until the next budget period",
					"Choose a different budget with more available funds",
				},
			},
		})
		return
	}

	// Step 3: Budget can afford - create the expense
	// Generate reference if not provided
	reference := req.Reference
	if reference == "" {
		reference = fmt.Sprintf("EXP_%d", time.Now().Unix())
	}

	// Insert expense with budget tracking
	query := `
		INSERT INTO expenses (
			recipient_code, recipient_name, amount, currency, category,
			narration, reference, status, notes, goal_id, budget_limit_id,
			created_at, updated_at
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
	`

	now := time.Now()
	result, err := database.DB.Exec(
		query,
		req.RecipientCode,
		recipientName,
		req.Amount,
		req.Currency,
		req.Category,
		req.Narration,
		reference,
		req.Notes,
		goalID,
		budgetID,
		now,
		now,
	)

	if err != nil {
		WriteJSONError(w, fmt.Errorf("failed to create expense: %w", err), http.StatusInternalServerError)
		return
	}

	expenseID, _ := result.LastInsertId()

	// Step 4: Update budget spent amount
	err = UpdateBudgetSpending(budgetID, req.Amount)
	if err != nil {
		// Rollback expense creation
		database.DB.Exec("DELETE FROM expenses WHERE id = ?", expenseID)
		WriteJSONError(w, fmt.Errorf("failed to update budget: %w", err), http.StatusInternalServerError)
		return
	}

	// Step 5: Auto-achieve goal if goal_id provided
	if goalID != nil && *goalID > 0 {
		achieveQuery := `
			UPDATE goals
			SET status = 'achieved',
			    achieved_at = ?,
			    achieved_by_expense_id = ?,
			    updated_at = ?
			WHERE id = ?
		`
		_, err = database.DB.Exec(achieveQuery, now, expenseID, now, *goalID)
		if err != nil {
			// Log error but don't fail the entire request
			fmt.Printf("Warning: Failed to mark goal as achieved: %v\n", err)
		}
	}

	// Step 6: Return created expense with budget info
	expense := Expense{
		ID:            int(expenseID),
		RecipientCode: req.RecipientCode,
		RecipientName: recipientName,
		Amount:        req.Amount,
		Currency:      req.Currency,
		Category:      req.Category,
		Narration:     req.Narration,
		Reference:     reference,
		Status:        "pending",
		Notes:         req.Notes,
		GoalID:        goalID,
		BudgetLimitID: &budgetID,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	// Include budget information in response
	responseData := map[string]interface{}{
		"expense": expense,
		"budget_info": map[string]interface{}{
			"budget_id":          budgetID,
			"budget_limit":       checkResp.BudgetLimit,
			"previous_spent":     checkResp.SpentAmount,
			"new_spent":          checkResp.SpentAmount + req.Amount,
			"remaining":          checkResp.Remaining - req.Amount,
			"usage_before":       checkResp.UsageBefore,
			"usage_after":        checkResp.UsageAfter,
		},
	}

	if goalID != nil {
		responseData["goal_achieved"] = true
		responseData["goal_id"] = *goalID
	}

	WriteJSONSuccess(w, responseData)
}

// List lists expenses with optional filters
func (h *ExpenseHandler) List(w http.ResponseWriter, r *http.Request) {
	var req ListExpensesRequest
	if r.Body != http.NoBody {
		json.NewDecoder(r.Body).Decode(&req)
	}

	// Build query with filters
	query := `SELECT id, recipient_code, recipient_name, amount, currency, category, narration, reference, status, payment_date, notes, goal_id, budget_limit_id, created_at, updated_at FROM expenses WHERE 1=1`
	args := []interface{}{}

	// Add filters
	if req.RecipientCode != "" {
		query += " AND recipient_code = ?"
		args = append(args, req.RecipientCode)
	}

	if req.Category != "" {
		query += " AND category = ?"
		args = append(args, req.Category)
	}

	if req.Status != "" {
		query += " AND status = ?"
		args = append(args, req.Status)
	}

	if req.From != "" {
		query += " AND created_at >= ?"
		args = append(args, req.From)
	}

	if req.To != "" {
		query += " AND created_at <= ?"
		args = append(args, req.To)
	}

	// Add ordering
	query += " ORDER BY created_at DESC"

	// Add pagination
	if req.Count > 0 {
		query += " LIMIT ? OFFSET ?"
		args = append(args, req.Count, req.Offset)
	}

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		WriteJSONError(w, fmt.Errorf("failed to query expenses: %w", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	expenses := []Expense{}
	for rows.Next() {
		var expense Expense
		var category, notes sql.NullString
		var paymentDate sql.NullTime
		var goalID, budgetLimitID sql.NullInt64

		err := rows.Scan(
			&expense.ID,
			&expense.RecipientCode,
			&expense.RecipientName,
			&expense.Amount,
			&expense.Currency,
			&category,
			&expense.Narration,
			&expense.Reference,
			&expense.Status,
			&paymentDate,
			&notes,
			&goalID,
			&budgetLimitID,
			&expense.CreatedAt,
			&expense.UpdatedAt,
		)
		if err != nil {
			WriteJSONError(w, fmt.Errorf("failed to scan expense: %w", err), http.StatusInternalServerError)
			return
		}

		if category.Valid {
			expense.Category = category.String
		}
		if notes.Valid {
			expense.Notes = notes.String
		}
		if paymentDate.Valid {
			expense.PaymentDate = &paymentDate.Time
		}
		if goalID.Valid {
			gid := int(goalID.Int64)
			expense.GoalID = &gid
		}
		if budgetLimitID.Valid {
			bid := int(budgetLimitID.Int64)
			expense.BudgetLimitID = &bid
		}

		expenses = append(expenses, expense)
	}

	if err = rows.Err(); err != nil {
		WriteJSONError(w, fmt.Errorf("error iterating expenses: %w", err), http.StatusInternalServerError)
		return
	}

	WriteJSONSuccess(w, expenses)
}

// Get retrieves a specific expense by ID
func (h *ExpenseHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		WriteJSONBadRequest(w, "id is required")
		return
	}

	query := `
		SELECT id, recipient_code, recipient_name, amount, currency, category, narration, reference, status, payment_date, notes, goal_id, budget_limit_id, created_at, updated_at
		FROM expenses
		WHERE id = ?
	`

	var expense Expense
	var category, notes sql.NullString
	var paymentDate sql.NullTime
	var goalID, budgetLimitID sql.NullInt64

	err := database.DB.QueryRow(query, id).Scan(
		&expense.ID,
		&expense.RecipientCode,
		&expense.RecipientName,
		&expense.Amount,
		&expense.Currency,
		&category,
		&expense.Narration,
		&expense.Reference,
		&expense.Status,
		&paymentDate,
		&notes,
		&goalID,
		&budgetLimitID,
		&expense.CreatedAt,
		&expense.UpdatedAt,
	)

	if err != nil {
		WriteJSONError(w, fmt.Errorf("expense not found: %s", id), http.StatusNotFound)
		return
	}

	if category.Valid {
		expense.Category = category.String
	}
	if notes.Valid {
		expense.Notes = notes.String
	}
	if paymentDate.Valid {
		expense.PaymentDate = &paymentDate.Time
	}
	if goalID.Valid {
		gid := int(goalID.Int64)
		expense.GoalID = &gid
	}
	if budgetLimitID.Valid {
		bid := int(budgetLimitID.Int64)
		expense.BudgetLimitID = &bid
	}

	WriteJSONSuccess(w, expense)
}

// Update updates an existing expense
func (h *ExpenseHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		WriteJSONBadRequest(w, "id is required")
		return
	}

	var req UpdateExpenseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteJSONBadRequest(w, "Invalid request body")
		return
	}

	// Build dynamic update query
	updates := []string{}
	args := []interface{}{}

	if req.Category != "" {
		updates = append(updates, "category = ?")
		args = append(args, req.Category)
	}

	if req.Narration != "" {
		updates = append(updates, "narration = ?")
		args = append(args, req.Narration)
	}

	if req.Status != "" {
		updates = append(updates, "status = ?")
		args = append(args, req.Status)
	}

	if req.PaymentDate != nil {
		updates = append(updates, "payment_date = ?")
		args = append(args, req.PaymentDate)
	}

	if req.Notes != "" {
		updates = append(updates, "notes = ?")
		args = append(args, req.Notes)
	}

	if len(updates) == 0 {
		WriteJSONBadRequest(w, "no fields to update")
		return
	}

	// Add updated_at
	updates = append(updates, "updated_at = ?")
	args = append(args, time.Now())

	// Add id to args
	args = append(args, id)

	query := fmt.Sprintf("UPDATE expenses SET %s WHERE id = ?", joinStrings(updates, ", "))

	result, err := database.DB.Exec(query, args...)
	if err != nil {
		WriteJSONError(w, fmt.Errorf("failed to update expense: %w", err), http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		WriteJSONError(w, fmt.Errorf("expense not found: %s", id), http.StatusNotFound)
		return
	}

	// Retrieve updated expense
	h.Get(w, r)
}


// Helper function to join strings
func joinStrings(strs []string, sep string) string {
	if len(strs) == 0 {
		return ""
	}
	result := strs[0]
	for i := 1; i < len(strs); i++ {
		result += sep + strs[i]
	}
	return result
}
