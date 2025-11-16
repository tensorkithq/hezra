// Package handlers implements HTTP handlers for the moniewave financial management system.
//
// Budgets Handler - Financial Management Core
//
// OBJECTIVES:
// Users need guardrails to prevent overspending.
//
// PURPOSE:
// - Set spending limits for specific categories or time periods
// - Track real-time budget utilization
// - Provide alerts when approaching limits
// - Enable proactive financial planning
//
// KEY WORKFLOW:
// Create Budget → Set Period & Limit → Track Expenses → Calculate Usage % →
// Check Alert Threshold → Notify if Exceeded
//
// DESIGN DECISIONS:
// - Budgets track 'spent_amount' automatically when expenses are created
// - Alert thresholds (e.g., 80%) warn users before they exceed limits
// - Multiple budget types (category, general, default) allow flexible spending controls
// - Default budgets are auto-created for users without explicit budgets
// - Usage percentage is calculated in real-time for immediate feedback
// - Remaining amount is always computed (amount - spent_amount)
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

type BudgetHandler struct{}

func NewBudgetHandler() *BudgetHandler {
	return &BudgetHandler{}
}

// BudgetLimit represents a spending limit
type BudgetLimit struct {
	ID           int       `json:"id"`
	Name         string    `json:"name"`
	LimitType    string    `json:"limit_type"`
	Amount       int       `json:"amount"`
	PeriodStart  time.Time `json:"period_start"`
	PeriodEnd    time.Time `json:"period_end"`
	SpentAmount  int       `json:"spent_amount"`
	Remaining    int       `json:"remaining"`
	Status       string    `json:"status"`
	Notes        string    `json:"notes"`
	UsagePercent float64   `json:"usage_percentage"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type CreateBudgetLimitRequest struct {
	Name          string `json:"name"`
	LimitType     string `json:"limit_type"`
	Amount        int    `json:"amount"`
	PeriodStart   string `json:"period_start"`
	PeriodEnd     string `json:"period_end"`
	AlertThreshold int   `json:"alert_threshold,omitempty"`
	Notes         string `json:"notes,omitempty"`
}

type UpdateBudgetLimitRequest struct {
	Name           string `json:"name,omitempty"`
	Amount         int    `json:"amount,omitempty"`
	AlertThreshold int    `json:"alert_threshold,omitempty"`
	Status         string `json:"status,omitempty"`
	Notes          string `json:"notes,omitempty"`
}

type CheckLimitResponse struct {
	CanAfford      bool     `json:"can_afford"`
	RequestedAmount int     `json:"requested_amount"`
	BudgetLimit    int      `json:"budget_limit"`
	SpentAmount    int      `json:"spent_amount"`
	Remaining      int      `json:"remaining"`
	WouldExceed    bool     `json:"would_exceed"`
	ExcessAmount   int      `json:"excess_amount,omitempty"`
	UsageBefore    float64  `json:"usage_before"`
	UsageAfter     float64  `json:"usage_after"`
	Reason         string   `json:"reason"`
}

type ListBudgetLimitsRequest struct {
	LimitType string `json:"limit_type,omitempty"`
	Status    string `json:"status,omitempty"`
	Active    bool   `json:"active,omitempty"`
	Count     int    `json:"count,omitempty"`
	Offset    int    `json:"offset,omitempty"`
}

// Helper: FindOrCreateDefaultBudget gets or creates default budget for current period
func FindOrCreateDefaultBudget() (*BudgetLimit, error) {
	now := time.Now()

	// Look for existing default budget for current month
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	endOfMonth := startOfMonth.AddDate(0, 1, -1)

	query := `
		SELECT id, name, limit_type, amount, period_start, period_end, spent_amount, status, notes, created_at, updated_at
		FROM budget_limits
		WHERE limit_type = 'default'
		AND period_start <= ?
		AND period_end >= ?
		AND status = 'active'
		LIMIT 1
	`

	var budget BudgetLimit
	var notes sql.NullString

	err := database.DB.QueryRow(query, now, now).Scan(
		&budget.ID,
		&budget.Name,
		&budget.LimitType,
		&budget.Amount,
		&budget.PeriodStart,
		&budget.PeriodEnd,
		&budget.SpentAmount,
		&budget.Status,
		&notes,
		&budget.CreatedAt,
		&budget.UpdatedAt,
	)

	if err == nil {
		if notes.Valid {
			budget.Notes = notes.String
		}
		budget.Remaining = budget.Amount - budget.SpentAmount
		if budget.Amount > 0 {
			budget.UsagePercent = (float64(budget.SpentAmount) / float64(budget.Amount)) * 100
		}
		return &budget, nil
	}

	// No existing default budget - create one
	defaultAmount := 5000000 // ₦50,000 default
	budgetName := fmt.Sprintf("Default Budget - %s %d", now.Month().String(), now.Year())

	insertQuery := `
		INSERT INTO budget_limits (name, limit_type, amount, period_start, period_end, status, created_at, updated_at)
		VALUES (?, 'default', ?, ?, ?, 'active', ?, ?)
	`

	result, err := database.DB.Exec(insertQuery, budgetName, defaultAmount, startOfMonth, endOfMonth, now, now)
	if err != nil {
		return nil, fmt.Errorf("failed to create default budget: %w", err)
	}

	id, _ := result.LastInsertId()

	return &BudgetLimit{
		ID:           int(id),
		Name:         budgetName,
		LimitType:    "default",
		Amount:       defaultAmount,
		PeriodStart:  startOfMonth,
		PeriodEnd:    endOfMonth,
		SpentAmount:  0,
		Remaining:    defaultAmount,
		Status:       "active",
		UsagePercent: 0,
		CreatedAt:    now,
		UpdatedAt:    now,
	}, nil
}

// Helper: CheckBudgetAffordability validates if budget can afford amount
func CheckBudgetAffordability(budgetID int, amount int) (*CheckLimitResponse, error) {
	query := `SELECT id, name, limit_type, amount, period_start, period_end, spent_amount, status FROM budget_limits WHERE id = ?`

	var budget BudgetLimit
	err := database.DB.QueryRow(query, budgetID).Scan(
		&budget.ID,
		&budget.Name,
		&budget.LimitType,
		&budget.Amount,
		&budget.PeriodStart,
		&budget.PeriodEnd,
		&budget.SpentAmount,
		&budget.Status,
	)

	if err != nil {
		return nil, fmt.Errorf("budget not found: %d", budgetID)
	}

	// Check if budget is active
	now := time.Now()
	if budget.Status != "active" {
		return &CheckLimitResponse{
			CanAfford:       false,
			RequestedAmount: amount,
			BudgetLimit:     budget.Amount,
			SpentAmount:     budget.SpentAmount,
			Remaining:       budget.Amount - budget.SpentAmount,
			WouldExceed:     false,
			Reason:          fmt.Sprintf("Budget is %s", budget.Status),
		}, nil
	}

	// Check if within period
	if now.Before(budget.PeriodStart) || now.After(budget.PeriodEnd) {
		return &CheckLimitResponse{
			CanAfford:       false,
			RequestedAmount: amount,
			BudgetLimit:     budget.Amount,
			SpentAmount:     budget.SpentAmount,
			Remaining:       budget.Amount - budget.SpentAmount,
			WouldExceed:     false,
			Reason:          "Budget period is not active",
		}, nil
	}

	// Calculate affordability
	remaining := budget.Amount - budget.SpentAmount
	newSpentAmount := budget.SpentAmount + amount
	wouldExceed := newSpentAmount > budget.Amount
	canAfford := !wouldExceed

	usageBefore := float64(0)
	usageAfter := float64(0)
	if budget.Amount > 0 {
		usageBefore = (float64(budget.SpentAmount) / float64(budget.Amount)) * 100
		usageAfter = (float64(newSpentAmount) / float64(budget.Amount)) * 100
	}

	response := &CheckLimitResponse{
		CanAfford:       canAfford,
		RequestedAmount: amount,
		BudgetLimit:     budget.Amount,
		SpentAmount:     budget.SpentAmount,
		Remaining:       remaining,
		WouldExceed:     wouldExceed,
		UsageBefore:     usageBefore,
		UsageAfter:      usageAfter,
	}

	if wouldExceed {
		response.ExcessAmount = newSpentAmount - budget.Amount
		response.Reason = fmt.Sprintf("Spending ₦%d would exceed budget limit by ₦%d (remaining: ₦%d)",
			amount/100, response.ExcessAmount/100, remaining/100)
	} else {
		response.Reason = fmt.Sprintf("Spending ₦%d is within budget (remaining: ₦%d after transaction)",
			amount/100, (remaining-amount)/100)
	}

	return response, nil
}

// Helper: UpdateBudgetSpending increments spent_amount
func UpdateBudgetSpending(budgetID int, amount int) error {
	query := `UPDATE budget_limits SET spent_amount = spent_amount + ?, updated_at = ? WHERE id = ?`
	_, err := database.DB.Exec(query, amount, time.Now(), budgetID)
	if err != nil {
		return fmt.Errorf("failed to update budget spending: %w", err)
	}
	return nil
}

// Create creates a new budget limit
func (h *BudgetHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateBudgetLimitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteJSONBadRequest(w, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Name == "" {
		WriteJSONBadRequest(w, "name is required")
		return
	}

	if req.LimitType == "" {
		WriteJSONBadRequest(w, "limit_type is required (monthly, quarterly, yearly, emergency_fund, default)")
		return
	}

	if req.Amount <= 0 {
		WriteJSONBadRequest(w, "amount must be greater than 0")
		return
	}

	if req.PeriodStart == "" {
		WriteJSONBadRequest(w, "period_start is required")
		return
	}

	if req.PeriodEnd == "" {
		WriteJSONBadRequest(w, "period_end is required")
		return
	}

	// Parse dates
	periodStart, err := time.Parse("2006-01-02", req.PeriodStart)
	if err != nil {
		WriteJSONBadRequest(w, "Invalid period_start format. Use YYYY-MM-DD")
		return
	}

	periodEnd, err := time.Parse("2006-01-02", req.PeriodEnd)
	if err != nil {
		WriteJSONBadRequest(w, "Invalid period_end format. Use YYYY-MM-DD")
		return
	}

	if periodEnd.Before(periodStart) {
		WriteJSONBadRequest(w, "period_end must be after period_start")
		return
	}

	// Set default alert threshold
	alertThreshold := req.AlertThreshold
	if alertThreshold == 0 {
		alertThreshold = 80
	}

	// Insert budget limit
	query := `
		INSERT INTO budget_limits (name, limit_type, amount, period_start, period_end, alert_threshold, notes, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	result, err := database.DB.Exec(
		query,
		req.Name,
		req.LimitType,
		req.Amount,
		periodStart,
		periodEnd,
		alertThreshold,
		req.Notes,
		now,
		now,
	)

	if err != nil {
		WriteJSONError(w, fmt.Errorf("failed to create budget limit: %w", err), http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()

	// Return created budget limit
	budget := BudgetLimit{
		ID:           int(id),
		Name:         req.Name,
		LimitType:    req.LimitType,
		Amount:       req.Amount,
		PeriodStart:  periodStart,
		PeriodEnd:    periodEnd,
		SpentAmount:  0,
		Remaining:    req.Amount,
		Status:       "active",
		Notes:        req.Notes,
		UsagePercent: 0.0,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	WriteJSONSuccess(w, budget)
}

// List lists budget limits with optional filters
func (h *BudgetHandler) List(w http.ResponseWriter, r *http.Request) {
	var req ListBudgetLimitsRequest
	if r.Body != http.NoBody {
		json.NewDecoder(r.Body).Decode(&req)
	}

	// Build query with filters
	query := `SELECT id, name, limit_type, amount, period_start, period_end, spent_amount, status, notes, created_at, updated_at FROM budget_limits WHERE 1=1`
	args := []interface{}{}

	// Add filters
	if req.LimitType != "" {
		query += " AND limit_type = ?"
		args = append(args, req.LimitType)
	}

	if req.Status != "" {
		query += " AND status = ?"
		args = append(args, req.Status)
	}

	// Filter for active budgets (within current period)
	if req.Active {
		now := time.Now()
		query += " AND period_start <= ? AND period_end >= ? AND status = 'active'"
		args = append(args, now, now)
	}

	// Add ordering
	query += " ORDER BY period_start DESC"

	// Add pagination
	if req.Count > 0 {
		query += " LIMIT ? OFFSET ?"
		args = append(args, req.Count, req.Offset)
	}

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		WriteJSONError(w, fmt.Errorf("failed to query budget limits: %w", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	budgets := []BudgetLimit{}
	for rows.Next() {
		var budget BudgetLimit
		var notes sql.NullString

		err := rows.Scan(
			&budget.ID,
			&budget.Name,
			&budget.LimitType,
			&budget.Amount,
			&budget.PeriodStart,
			&budget.PeriodEnd,
			&budget.SpentAmount,
			&budget.Status,
			&notes,
			&budget.CreatedAt,
			&budget.UpdatedAt,
		)
		if err != nil {
			WriteJSONError(w, fmt.Errorf("failed to scan budget limit: %w", err), http.StatusInternalServerError)
			return
		}

		if notes.Valid {
			budget.Notes = notes.String
		}

		// Calculate remaining and usage percentage
		budget.Remaining = budget.Amount - budget.SpentAmount
		if budget.Amount > 0 {
			budget.UsagePercent = (float64(budget.SpentAmount) / float64(budget.Amount)) * 100
		}

		budgets = append(budgets, budget)
	}

	if err = rows.Err(); err != nil {
		WriteJSONError(w, fmt.Errorf("error iterating budget limits: %w", err), http.StatusInternalServerError)
		return
	}

	WriteJSONSuccess(w, budgets)
}

// Get retrieves a specific budget limit by ID
func (h *BudgetHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		WriteJSONBadRequest(w, "id is required")
		return
	}

	query := `
		SELECT id, name, limit_type, amount, period_start, period_end, spent_amount, status, notes, created_at, updated_at
		FROM budget_limits
		WHERE id = ?
	`

	var budget BudgetLimit
	var notes sql.NullString

	err := database.DB.QueryRow(query, id).Scan(
		&budget.ID,
		&budget.Name,
		&budget.LimitType,
		&budget.Amount,
		&budget.PeriodStart,
		&budget.PeriodEnd,
		&budget.SpentAmount,
		&budget.Status,
		&notes,
		&budget.CreatedAt,
		&budget.UpdatedAt,
	)

	if err != nil {
		WriteJSONError(w, fmt.Errorf("budget limit not found: %s", id), http.StatusNotFound)
		return
	}

	if notes.Valid {
		budget.Notes = notes.String
	}

	// Calculate remaining and usage percentage
	budget.Remaining = budget.Amount - budget.SpentAmount
	if budget.Amount > 0 {
		budget.UsagePercent = (float64(budget.SpentAmount) / float64(budget.Amount)) * 100
	}

	WriteJSONSuccess(w, budget)
}

// Update updates an existing budget limit
func (h *BudgetHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		WriteJSONBadRequest(w, "id is required")
		return
	}

	var req UpdateBudgetLimitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteJSONBadRequest(w, "Invalid request body")
		return
	}

	// Build dynamic update query
	updates := []string{}
	args := []interface{}{}

	if req.Name != "" {
		updates = append(updates, "name = ?")
		args = append(args, req.Name)
	}

	if req.Amount > 0 {
		updates = append(updates, "amount = ?")
		args = append(args, req.Amount)
	}

	if req.AlertThreshold > 0 {
		updates = append(updates, "alert_threshold = ?")
		args = append(args, req.AlertThreshold)
	}

	if req.Status != "" {
		updates = append(updates, "status = ?")
		args = append(args, req.Status)
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

	query := fmt.Sprintf("UPDATE budget_limits SET %s WHERE id = ?", joinStrings(updates, ", "))

	result, err := database.DB.Exec(query, args...)
	if err != nil {
		WriteJSONError(w, fmt.Errorf("failed to update budget limit: %w", err), http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		WriteJSONError(w, fmt.Errorf("budget limit not found: %s", id), http.StatusNotFound)
		return
	}

	// Retrieve updated budget limit
	h.Get(w, r)
}

// CheckLimit checks if a spending amount would exceed the budget limit
func (h *BudgetHandler) CheckLimit(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		WriteJSONBadRequest(w, "id is required")
		return
	}

	amount := chi.URLParam(r, "amount")
	if amount == "" {
		WriteJSONBadRequest(w, "amount is required")
		return
	}

	var amountInt int
	fmt.Sscanf(amount, "%d", &amountInt)

	if amountInt <= 0 {
		WriteJSONBadRequest(w, "amount must be greater than 0")
		return
	}

	var budgetID int
	fmt.Sscanf(id, "%d", &budgetID)

	response, err := CheckBudgetAffordability(budgetID, amountInt)
	if err != nil {
		WriteJSONError(w, err, http.StatusNotFound)
		return
	}

	WriteJSONSuccess(w, response)
}

// GetActiveBudgets returns all currently active budget limits
func (h *BudgetHandler) GetActiveBudgets(w http.ResponseWriter, r *http.Request) {
	now := time.Now()
	query := `
		SELECT id, name, limit_type, amount, period_start, period_end, spent_amount, status, notes, created_at, updated_at
		FROM budget_limits
		WHERE status = 'active' AND period_start <= ? AND period_end >= ?
		ORDER BY period_start DESC
	`

	rows, err := database.DB.Query(query, now, now)
	if err != nil {
		WriteJSONError(w, fmt.Errorf("failed to query active budgets: %w", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	budgets := []BudgetLimit{}
	for rows.Next() {
		var budget BudgetLimit
		var notes sql.NullString

		err := rows.Scan(
			&budget.ID,
			&budget.Name,
			&budget.LimitType,
			&budget.Amount,
			&budget.PeriodStart,
			&budget.PeriodEnd,
			&budget.SpentAmount,
			&budget.Status,
			&notes,
			&budget.CreatedAt,
			&budget.UpdatedAt,
		)
		if err != nil {
			WriteJSONError(w, fmt.Errorf("failed to scan budget: %w", err), http.StatusInternalServerError)
			return
		}

		if notes.Valid {
			budget.Notes = notes.String
		}

		// Calculate remaining and usage percentage
		budget.Remaining = budget.Amount - budget.SpentAmount
		if budget.Amount > 0 {
			budget.UsagePercent = (float64(budget.SpentAmount) / float64(budget.Amount)) * 100
		}

		budgets = append(budgets, budget)
	}

	if err = rows.Err(); err != nil {
		WriteJSONError(w, fmt.Errorf("error iterating budgets: %w", err), http.StatusInternalServerError)
		return
	}

	WriteJSONSuccess(w, budgets)
}
