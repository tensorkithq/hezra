// Package handlers implements HTTP handlers for the moniewave financial management system.
//
// Goals Handler - Financial Management Core
//
// OBJECTIVES:
// Users need motivation and tracking for financial objectives.
//
// PURPOSE:
// - Define financial targets (savings, spending reductions, etc.)
// - Track progress through linked expenses
// - Mark goals as achieved when targets are met
// - Provide visibility into goal completion status
//
// KEY WORKFLOW:
// Create Goal → Set Target & Frequency → Link Expenses/Budgets →
// Track Progress → Mark Achieved When Target Met
//
// DESIGN DECISIONS:
// - Goals can be linked to budgets (spend X on category Y)
// - Goals can be linked to specific expenses (achieve goal through expense)
// - Frequency-based goals (monthly, quarterly) enable recurring targets
// - Budget affordability is validated before goal creation
// - Priority levels (low, medium, high) help users focus on important goals
// - Achieved goals cannot be modified or deleted (historical record)
package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"paystack.mpc.proxy/internal/database"

	"github.com/go-chi/chi/v5"
)

// Goal represents a financial goal
type Goal struct {
	ID                  int       `json:"id"`
	Title               string    `json:"title"`
	Description         string    `json:"description,omitempty"`
	GoalType            string    `json:"goal_type"`
	TargetAmount        int       `json:"target_amount"`
	BudgetLimitID       *int      `json:"budget_limit_id,omitempty"`
	Frequency           string    `json:"frequency"`
	StartDate           time.Time `json:"start_date"`
	EndDate             *time.Time `json:"end_date,omitempty"`
	Status              string    `json:"status"`
	AchievedAt          *time.Time `json:"achieved_at,omitempty"`
	AchievedByExpenseID *int      `json:"achieved_by_expense_id,omitempty"`
	Category            string    `json:"category,omitempty"`
	Priority            string    `json:"priority"`
	Notes               string    `json:"notes,omitempty"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

// GoalHandler handles goal-related requests
type GoalHandler struct{}

// NewGoalHandler creates a new goal handler
func NewGoalHandler() *GoalHandler {
	return &GoalHandler{}
}

// CreateGoalRequest represents the request to create a goal
type CreateGoalRequest struct {
	Title         string    `json:"title"`
	Description   string    `json:"description,omitempty"`
	GoalType      string    `json:"goal_type"`
	TargetAmount  int       `json:"target_amount"`
	BudgetLimitID *int      `json:"budget_limit_id,omitempty"`
	Frequency     string    `json:"frequency"`
	StartDate     time.Time `json:"start_date"`
	EndDate       *time.Time `json:"end_date,omitempty"`
	Category      string    `json:"category,omitempty"`
	Priority      string    `json:"priority,omitempty"`
	Notes         string    `json:"notes,omitempty"`
}

// UpdateGoalRequest represents the request to update a goal
type UpdateGoalRequest struct {
	Title         *string    `json:"title,omitempty"`
	Description   *string    `json:"description,omitempty"`
	TargetAmount  *int       `json:"target_amount,omitempty"`
	BudgetLimitID *int       `json:"budget_limit_id,omitempty"`
	EndDate       *time.Time `json:"end_date,omitempty"`
	Status        *string    `json:"status,omitempty"`
	Category      *string    `json:"category,omitempty"`
	Priority      *string    `json:"priority,omitempty"`
	Notes         *string    `json:"notes,omitempty"`
}

// ListGoalsRequest represents the request to list goals
type ListGoalsRequest struct {
	Status        string `json:"status,omitempty"`
	BudgetLimitID *int   `json:"budget_limit_id,omitempty"`
	GoalType      string `json:"goal_type,omitempty"`
	Category      string `json:"category,omitempty"`
	Priority      string `json:"priority,omitempty"`
	Active        bool   `json:"active,omitempty"`
	Limit         int    `json:"limit,omitempty"`
	Offset        int    `json:"offset,omitempty"`
}

// GoalResponse represents the response for goal operations
type GoalResponse struct {
	Status  bool        `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// GoalListResponse represents the response for listing goals
type GoalListResponse struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
	Data    struct {
		Goals      []Goal `json:"goals"`
		TotalCount int    `json:"total_count"`
		Limit      int    `json:"limit"`
		Offset     int    `json:"offset"`
	} `json:"data"`
}

// Create creates a new financial goal
func (h *GoalHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateGoalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteJSONBadRequest(w, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Title == "" {
		WriteJSONBadRequest(w, "Title is required")
		return
	}

	if req.GoalType == "" {
		WriteJSONBadRequest(w, "Goal type is required (recurring_expense, investment, purchase, emergency)")
		return
	}

	if req.TargetAmount <= 0 {
		WriteJSONBadRequest(w, "Target amount must be greater than 0")
		return
	}

	if req.Frequency == "" {
		WriteJSONBadRequest(w, "Frequency is required (once, daily, weekly, monthly, quarterly, yearly)")
		return
	}

	if req.StartDate.IsZero() {
		WriteJSONBadRequest(w, "Start date is required")
		return
	}

	// Set default priority if not provided
	priority := req.Priority
	if priority == "" {
		priority = "medium"
	}

	// If budget_limit_id is provided, validate it exists and can afford the goal
	if req.BudgetLimitID != nil && *req.BudgetLimitID > 0 {
		checkResp, err := CheckBudgetAffordability(*req.BudgetLimitID, req.TargetAmount)
		if err != nil {
			WriteJSONError(w, fmt.Errorf("error checking budget: %w", err), http.StatusBadRequest)
			return
		}

		if !checkResp.CanAfford {
			respondWithJSON(w, http.StatusBadRequest, GoalResponse{
				Status:  false,
				Message: "This goal cannot be achieved within the budget period",
				Data: map[string]interface{}{
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
						"Reduce the goal target amount to fit within the budget",
						"Increase the budget limit to accommodate this goal",
						"Choose a different budget with more available funds",
					},
				},
			})
			return
		}
	}

	// Insert goal into database
	query := `
		INSERT INTO goals (
			title, description, goal_type, target_amount, budget_limit_id,
			frequency, start_date, end_date, status, category, priority, notes,
			created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	result, err := database.DB.Exec(
		query,
		req.Title,
		req.Description,
		req.GoalType,
		req.TargetAmount,
		req.BudgetLimitID,
		req.Frequency,
		req.StartDate,
		req.EndDate,
		"pending",
		req.Category,
		priority,
		req.Notes,
		now,
		now,
	)

	if err != nil {
		WriteJSONError(w, fmt.Errorf("failed to create goal: %w", err), http.StatusInternalServerError)
		return
	}

	goalID, _ := result.LastInsertId()

	// Fetch the created goal
	goal, err := getGoalByID(int(goalID))
	if err != nil {
		WriteJSONError(w, fmt.Errorf("LGoal created but failed to retrieve: : %w", err), http.StatusInternalServerError)
		return
	}

	respondWithJSON(w, http.StatusCreated, GoalResponse{
		Status:  true,
		Message: "Goal created successfully",
		Data:    goal,
	})
}

// List returns a list of goals based on filters
func (h *GoalHandler) List(w http.ResponseWriter, r *http.Request) {
	var req ListGoalsRequest

	// Try to parse JSON body, but don't fail if empty
	if r.Body != nil {
		json.NewDecoder(r.Body).Decode(&req)
	}

	// Build query
	query := `
		SELECT id, title, description, goal_type, target_amount, budget_limit_id,
		       frequency, start_date, end_date, status, achieved_at, achieved_by_expense_id,
		       category, priority, notes, created_at, updated_at
		FROM goals
		WHERE 1=1
	`

	var args []interface{}

	// Apply filters
	if req.Status != "" {
		query += " AND status = ?"
		args = append(args, req.Status)
	}

	if req.BudgetLimitID != nil && *req.BudgetLimitID > 0 {
		query += " AND budget_limit_id = ?"
		args = append(args, *req.BudgetLimitID)
	}

	if req.GoalType != "" {
		query += " AND goal_type = ?"
		args = append(args, req.GoalType)
	}

	if req.Category != "" {
		query += " AND category = ?"
		args = append(args, req.Category)
	}

	if req.Priority != "" {
		query += " AND priority = ?"
		args = append(args, req.Priority)
	}

	if req.Active {
		query += " AND status = 'pending' AND start_date <= ? AND (end_date IS NULL OR end_date >= ?)"
		now := time.Now()
		args = append(args, now, now)
	}

	// Get total count
	countQuery := "SELECT COUNT(*) FROM (" + query + ") as counted"
	var totalCount int
	err := database.DB.QueryRow(countQuery, args...).Scan(&totalCount)
	if err != nil {
		WriteJSONError(w, fmt.Errorf("LFailed to count goals: : %w", err), http.StatusInternalServerError)
		return
	}

	// Add ordering
	query += " ORDER BY created_at DESC"

	// Apply pagination
	limit := req.Limit
	if limit <= 0 {
		limit = 50
	}
	offset := req.Offset
	if offset < 0 {
		offset = 0
	}

	query += " LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	// Execute query
	rows, err := database.DB.Query(query, args...)
	if err != nil {
		WriteJSONError(w, fmt.Errorf("LFailed to fetch goals: : %w", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var goals []Goal
	for rows.Next() {
		var goal Goal
		err := rows.Scan(
			&goal.ID,
			&goal.Title,
			&goal.Description,
			&goal.GoalType,
			&goal.TargetAmount,
			&goal.BudgetLimitID,
			&goal.Frequency,
			&goal.StartDate,
			&goal.EndDate,
			&goal.Status,
			&goal.AchievedAt,
			&goal.AchievedByExpenseID,
			&goal.Category,
			&goal.Priority,
			&goal.Notes,
			&goal.CreatedAt,
			&goal.UpdatedAt,
		)
		if err != nil {
			WriteJSONError(w, fmt.Errorf("LFailed to scan goal: : %w", err), http.StatusInternalServerError)
			return
		}
		goals = append(goals, goal)
	}

	if goals == nil {
		goals = []Goal{}
	}

	var response GoalListResponse
	response.Status = true
	response.Message = "Goals retrieved successfully"
	response.Data.Goals = goals
	response.Data.TotalCount = totalCount
	response.Data.Limit = limit
	response.Data.Offset = offset

	respondWithJSON(w, http.StatusOK, response)
}

// Get retrieves a specific goal by ID
func (h *GoalHandler) Get(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		WriteJSONBadRequest(w, "Invalid goal ID")
		return
	}

	goal, err := getGoalByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			WriteJSONError(w, fmt.Errorf("goal not found"), http.StatusNotFound)
			return
		}
		WriteJSONError(w, fmt.Errorf("LFailed to fetch goal: : %w", err), http.StatusInternalServerError)
		return
	}

	respondWithJSON(w, http.StatusOK, GoalResponse{
		Status:  true,
		Message: "Goal retrieved successfully",
		Data:    goal,
	})
}

// Update updates an existing goal
func (h *GoalHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		WriteJSONBadRequest(w, "Invalid goal ID")
		return
	}

	// Check if goal exists
	existingGoal, err := getGoalByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			WriteJSONError(w, fmt.Errorf("goal not found"), http.StatusNotFound)
			return
		}
		WriteJSONError(w, fmt.Errorf("LFailed to fetch goal: : %w", err), http.StatusInternalServerError)
		return
	}

	// Cannot update achieved goals
	if existingGoal.Status == "achieved" {
		WriteJSONBadRequest(w, "Cannot update an achieved goal")
		return
	}

	var req UpdateGoalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteJSONBadRequest(w, "Invalid request body")
		return
	}

	// Build dynamic update query
	updates := []string{}
	args := []interface{}{}

	if req.Title != nil {
		updates = append(updates, "title = ?")
		args = append(args, *req.Title)
	}

	if req.Description != nil {
		updates = append(updates, "description = ?")
		args = append(args, *req.Description)
	}

	if req.TargetAmount != nil {
		if *req.TargetAmount <= 0 {
			WriteJSONBadRequest(w, "Target amount must be greater than 0")
			return
		}

		// If budget is linked, check if new target amount is affordable
		if existingGoal.BudgetLimitID != nil && *existingGoal.BudgetLimitID > 0 {
			checkResp, err := CheckBudgetAffordability(*existingGoal.BudgetLimitID, *req.TargetAmount)
			if err != nil {
				WriteJSONBadRequest(w, "Error checking budget: "+err.Error())
				return
			}

			if !checkResp.CanAfford {
				respondWithJSON(w, http.StatusBadRequest, GoalResponse{
					Status:  false,
					Message: "Updated target amount cannot be achieved within the budget period",
					Data: map[string]interface{}{
						"budget_limit":      checkResp.BudgetLimit,
						"spent_amount":      checkResp.SpentAmount,
						"remaining":         checkResp.Remaining,
						"requested_amount":  *req.TargetAmount,
						"excess_amount":     checkResp.ExcessAmount,
						"would_exceed":      checkResp.WouldExceed,
						"usage_before":      checkResp.UsageBefore,
						"usage_after":       checkResp.UsageAfter,
						"reason":            checkResp.Reason,
					},
				})
				return
			}
		}

		updates = append(updates, "target_amount = ?")
		args = append(args, *req.TargetAmount)
	}

	if req.BudgetLimitID != nil {
		// Validate budget exists and can afford the goal
		if *req.BudgetLimitID > 0 {
			checkResp, err := CheckBudgetAffordability(*req.BudgetLimitID, existingGoal.TargetAmount)
			if err != nil {
				WriteJSONBadRequest(w, "Error checking budget: "+err.Error())
				return
			}

			if !checkResp.CanAfford {
				respondWithJSON(w, http.StatusBadRequest, GoalResponse{
					Status:  false,
					Message: "This goal cannot be achieved within the selected budget period",
					Data: map[string]interface{}{
						"budget_limit":      checkResp.BudgetLimit,
						"spent_amount":      checkResp.SpentAmount,
						"remaining":         checkResp.Remaining,
						"excess_amount":     checkResp.ExcessAmount,
						"would_exceed":      checkResp.WouldExceed,
						"usage_before":      checkResp.UsageBefore,
						"usage_after":       checkResp.UsageAfter,
						"reason":            checkResp.Reason,
					},
				})
				return
			}
		}

		updates = append(updates, "budget_limit_id = ?")
		args = append(args, *req.BudgetLimitID)
	}

	if req.EndDate != nil {
		updates = append(updates, "end_date = ?")
		args = append(args, *req.EndDate)
	}

	if req.Status != nil {
		// Validate status
		validStatuses := map[string]bool{
			"pending":   true,
			"achieved":  true,
			"cancelled": true,
			"failed":    true,
		}
		if !validStatuses[*req.Status] {
			WriteJSONBadRequest(w, "Invalid status. Must be one of: pending, achieved, cancelled, failed")
			return
		}

		updates = append(updates, "status = ?")
		args = append(args, *req.Status)
	}

	if req.Category != nil {
		updates = append(updates, "category = ?")
		args = append(args, *req.Category)
	}

	if req.Priority != nil {
		updates = append(updates, "priority = ?")
		args = append(args, *req.Priority)
	}

	if req.Notes != nil {
		updates = append(updates, "notes = ?")
		args = append(args, *req.Notes)
	}

	if len(updates) == 0 {
		WriteJSONBadRequest(w, "No fields to update")
		return
	}

	// Add updated_at
	updates = append(updates, "updated_at = ?")
	args = append(args, time.Now())

	// Add ID to args
	args = append(args, id)

	// Build and execute query
	query := "UPDATE goals SET "
	for i, update := range updates {
		if i > 0 {
			query += ", "
		}
		query += update
	}
	query += " WHERE id = ?"

	_, err = database.DB.Exec(query, args...)
	if err != nil {
		WriteJSONError(w, fmt.Errorf("LFailed to update goal: : %w", err), http.StatusInternalServerError)
		return
	}

	// Fetch updated goal
	goal, err := getGoalByID(id)
	if err != nil {
		WriteJSONError(w, fmt.Errorf("LGoal updated but failed to retrieve: : %w", err), http.StatusInternalServerError)
		return
	}

	respondWithJSON(w, http.StatusOK, GoalResponse{
		Status:  true,
		Message: "Goal updated successfully",
		Data:    goal,
	})
}

// Delete cancels or deletes a goal
func (h *GoalHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		WriteJSONBadRequest(w, "Invalid goal ID")
		return
	}

	// Check if goal exists
	goal, err := getGoalByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			WriteJSONError(w, fmt.Errorf("goal not found"), http.StatusNotFound)
			return
		}
		WriteJSONError(w, fmt.Errorf("LFailed to fetch goal: : %w", err), http.StatusInternalServerError)
		return
	}

	// Cannot delete achieved goals
	if goal.Status == "achieved" {
		WriteJSONBadRequest(w, "Cannot delete an achieved goal. You can only cancel pending goals.")
		return
	}

	// Check if any expenses are linked to this goal
	var expenseCount int
	err = database.DB.QueryRow("SELECT COUNT(*) FROM expenses WHERE goal_id = ?", id).Scan(&expenseCount)
	if err != nil {
		WriteJSONError(w, fmt.Errorf("LFailed to check linked expenses: : %w", err), http.StatusInternalServerError)
		return
	}

	if expenseCount > 0 {
		WriteJSONBadRequest(w, "Cannot delete goal with linked expenses. Cancel the goal instead or remove expense associations first.")
		return
	}

	// Delete the goal
	query := "DELETE FROM goals WHERE id = ?"
	_, err = database.DB.Exec(query, id)
	if err != nil {
		WriteJSONError(w, fmt.Errorf("LFailed to delete goal: : %w", err), http.StatusInternalServerError)
		return
	}

	respondWithJSON(w, http.StatusOK, GoalResponse{
		Status:  true,
		Message: "Goal deleted successfully",
	})
}

// getGoalByID is a helper function to fetch a goal by ID
func getGoalByID(id int) (*Goal, error) {
	query := `
		SELECT id, title, description, goal_type, target_amount, budget_limit_id,
		       frequency, start_date, end_date, status, achieved_at, achieved_by_expense_id,
		       category, priority, notes, created_at, updated_at
		FROM goals
		WHERE id = ?
	`

	var goal Goal
	err := database.DB.QueryRow(query, id).Scan(
		&goal.ID,
		&goal.Title,
		&goal.Description,
		&goal.GoalType,
		&goal.TargetAmount,
		&goal.BudgetLimitID,
		&goal.Frequency,
		&goal.StartDate,
		&goal.EndDate,
		&goal.Status,
		&goal.AchievedAt,
		&goal.AchievedByExpenseID,
		&goal.Category,
		&goal.Priority,
		&goal.Notes,
		&goal.CreatedAt,
		&goal.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &goal, nil
}
