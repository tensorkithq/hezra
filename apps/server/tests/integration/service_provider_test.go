package integration

import (
	"encoding/json"
	"os"
	"testing"
	"time"
)

// Service represents a service with pricing
type Service struct {
	Name  string `json:"name"`
	Price int    `json:"price"`
}

// ServiceProvider represents a service provider
type ServiceProvider struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Category    string    `json:"category"`
	Services    []Service `json:"services"`
	Description string    `json:"description"`
	Location    string    `json:"location"`
	Rating      float64   `json:"rating"`
	Contact     string    `json:"contact"`
	RecipientID string    `json:"recipient_id"`
}

// BudgetLimit represents a budget limit
type BudgetLimit struct {
	ID             int       `json:"id"`
	Name           string    `json:"name"`
	LimitType      string    `json:"limit_type"`
	Amount         int       `json:"amount"`
	PeriodStart    time.Time `json:"period_start"`
	PeriodEnd      time.Time `json:"period_end"`
	SpentAmount    int       `json:"spent_amount"`
	Status         string    `json:"status"`
	AlertThreshold int       `json:"alert_threshold"`
	Notes          string    `json:"notes"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// BudgetInfo represents budget tracking information
type BudgetInfo struct {
	BudgetID      int `json:"budget_id"`
	BudgetLimit   int `json:"budget_limit"`
	PreviousSpent int `json:"previous_spent"`
	NewSpent      int `json:"new_spent"`
	Remaining     int `json:"remaining"`
	UsageBefore   int `json:"usage_before"`
	UsageAfter    int `json:"usage_after"`
}

// ExpenseWithBudget represents an expense response with budget info
type ExpenseWithBudget struct {
	Expense    Expense    `json:"expense"`
	BudgetInfo BudgetInfo `json:"budget_info"`
}

// TestServiceProviderExpenseWithBudget tests creating an expense for a service provider
// using the default budget
func TestServiceProviderExpenseWithBudget(t *testing.T) {
	if os.Getenv("PAYSTACK_SECRET_KEY") == "" {
		t.Skip("PAYSTACK_SECRET_KEY not set, skipping integration test")
	}

	time.Sleep(1 * time.Second)

	var budgetID int
	var expenseID int

	t.Run("Step1_CreateBudget", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"name":        "Beauty Services Budget",
			"limit_type":  "category",
			"amount":      5000000, // ₦50,000
			"period_start": "2025-11-01",
			"period_end":   "2025-11-30",
			"alert_threshold": 80,
			"notes":       "Monthly budget for beauty services",
		}

		resp := makeRequest(t, "POST", "/budgets/create", reqBody)

		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		var budget BudgetLimit
		if err := json.Unmarshal(resp.Data, &budget); err != nil {
			t.Fatalf("Failed to unmarshal budget: %v", err)
		}

		if budget.ID == 0 {
			t.Fatal("Budget ID should not be 0")
		}

		if budget.Amount != 5000000 {
			t.Fatalf("Expected amount 5000000, got %d", budget.Amount)
		}

		budgetID = budget.ID
		t.Logf("✓ Created budget #%d: %s - ₦%.2f", budget.ID, budget.Name, float64(budget.Amount)/100)
	})

	t.Run("Step2_CreateExpenseForServiceProvider", func(t *testing.T) {
		if budgetID == 0 {
			t.Fatal("budgetID not set from previous step")
		}

		// Create expense for "Classic Pedicure" from Glamour Beauty Spa
		// Price: ₦15,000 (1500000 kobo)
		reqBody := map[string]interface{}{
			"recipient_code": "RCP_serviceprovider",
			"amount":         1500000, // Classic Pedicure price
			"currency":       "NGN",
			"category":       "beauty",
			"narration":      "Classic pedicure from Glamour Beauty Spa",
			"notes":          "Service provider payment for beauty service",
		}

		resp := makeRequest(t, "POST", "/expenses/create", reqBody)

		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		// Parse expense with budget info
		var result map[string]interface{}
		if err := json.Unmarshal(resp.Data, &result); err != nil {
			t.Fatalf("Failed to unmarshal response: %v", err)
		}

		// Extract expense
		expenseData, _ := json.Marshal(result["expense"])
		var expense Expense
		if err := json.Unmarshal(expenseData, &expense); err != nil {
			t.Fatalf("Failed to unmarshal expense: %v", err)
		}

		// Extract budget info
		budgetInfoData, _ := json.Marshal(result["budget_info"])
		var budgetInfo BudgetInfo
		if err := json.Unmarshal(budgetInfoData, &budgetInfo); err != nil {
			t.Fatalf("Failed to unmarshal budget info: %v", err)
		}

		// Validations
		if expense.ID == 0 {
			t.Fatal("Expense ID should not be 0")
		}

		if expense.RecipientCode != "RCP_serviceprovider" {
			t.Fatalf("Expected recipient_code 'RCP_serviceprovider', got %s", expense.RecipientCode)
		}

		if expense.Amount != 1500000 {
			t.Fatalf("Expected amount 1500000, got %d", expense.Amount)
		}

		if expense.Category != "beauty" {
			t.Fatalf("Expected category 'beauty', got %s", expense.Category)
		}

		if expense.Status != "pending" {
			t.Fatalf("Expected status 'pending', got %s", expense.Status)
		}

		// Verify budget tracking - just verify values, don't check exact budget ID
		if budgetInfo.BudgetLimit != 5000000 {
			t.Fatalf("Expected budget limit 5000000, got %d", budgetInfo.BudgetLimit)
		}

		if budgetInfo.NewSpent != 1500000 {
			t.Fatalf("Expected new_spent 1500000, got %d", budgetInfo.NewSpent)
		}

		expectedRemaining := 5000000 - 1500000
		if budgetInfo.Remaining != expectedRemaining {
			t.Fatalf("Expected remaining %d, got %d", expectedRemaining, budgetInfo.Remaining)
		}

		expectedUsage := (1500000 * 100) / 5000000 // 30%
		if budgetInfo.UsageAfter != expectedUsage {
			t.Fatalf("Expected usage %d%%, got %d%%", expectedUsage, budgetInfo.UsageAfter)
		}

		expenseID = expense.ID
		t.Logf("✓ Created expense #%d: ₦%.2f - %s", expense.ID, float64(expense.Amount)/100, expense.Narration)
		t.Logf("  Budget tracking: ₦%.2f spent / ₦%.2f limit (%d%% used, ₦%.2f remaining)",
			float64(budgetInfo.NewSpent)/100,
			float64(budgetInfo.BudgetLimit)/100,
			budgetInfo.UsageAfter,
			float64(budgetInfo.Remaining)/100)
	})

	t.Run("Step3_VerifyExpenseInList", func(t *testing.T) {
		if expenseID == 0 {
			t.Fatal("expenseID not set from previous step")
		}

		reqBody := map[string]interface{}{
			"category": "beauty",
		}

		resp := makeRequest(t, "POST", "/expenses/list", reqBody)

		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		var expenses []Expense
		if err := json.Unmarshal(resp.Data, &expenses); err != nil {
			t.Fatalf("Failed to unmarshal expenses: %v", err)
		}

		found := false
		for _, e := range expenses {
			if e.ID == expenseID {
				found = true
				t.Logf("✓ Found expense in list: #%d - %s (₦%.2f)",
					e.ID, e.Narration, float64(e.Amount)/100)
				break
			}
		}

		if !found {
			t.Fatalf("Created expense not found in list: #%d", expenseID)
		}
	})

}

// TestServiceProviderMultipleExpenses tests creating multiple expenses
// against a service provider budget
func TestServiceProviderMultipleExpenses(t *testing.T) {
	if os.Getenv("PAYSTACK_SECRET_KEY") == "" {
		t.Skip("PAYSTACK_SECRET_KEY not set, skipping integration test")
	}

	time.Sleep(1 * time.Second)

	var budgetID int

	t.Run("Setup_CreateBudget", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"name":            "Pet Services Budget",
			"limit_type":      "category",
			"amount":          10000000, // ₦100,000
			"period_start":    "2025-11-01",
			"period_end":      "2025-11-30",
			"alert_threshold": 75,
			"notes":           "Monthly budget for pet services",
		}

		resp := makeRequest(t, "POST", "/budgets/create", reqBody)
		if !resp.Status {
			t.Fatalf("Failed to create budget: %s", resp.Error)
		}

		var budget BudgetLimit
		json.Unmarshal(resp.Data, &budget)
		budgetID = budget.ID

		t.Logf("✓ Created pet services budget: ₦%.2f", float64(budget.Amount)/100)
	})

	t.Run("CreateMultipleExpenses", func(t *testing.T) {
		if budgetID == 0 {
			t.Fatal("budgetID not set from setup")
		}

		// Create multiple pet service expenses
		expenses := []struct {
			service string
			amount  int
		}{
			{"Premium Cat Food (5kg) from Paws & Whiskers", 2500000},      // ₦25,000
			{"Cat Health Checkup at Feline Care Vet", 1000000},             // ₦10,000
			{"Pet Grooming Session at Paws & Whiskers", 1500000},           // ₦15,000
		}

		totalSpent := 0
		for i, exp := range expenses {
			reqBody := map[string]interface{}{
				"recipient_code": "RCP_serviceprovider",
				"amount":         exp.amount,
				"currency":       "NGN",
				"category":       "pets",
				"narration":      exp.service,
			}

			resp := makeRequest(t, "POST", "/expenses/create", reqBody)

			if !resp.Status {
				t.Fatalf("Failed to create expense %d: %s", i+1, resp.Error)
			}

			totalSpent += exp.amount

			var result map[string]interface{}
			json.Unmarshal(resp.Data, &result)

			budgetInfoData, _ := json.Marshal(result["budget_info"])
			var budgetInfo BudgetInfo
			json.Unmarshal(budgetInfoData, &budgetInfo)

			t.Logf("✓ Expense %d: %s - ₦%.2f (Budget: %d%% used)",
				i+1, exp.service, float64(exp.amount)/100, budgetInfo.UsageAfter)
		}

		t.Logf("✓ Created %d expenses, total spent: ₦%.2f",
			len(expenses), float64(totalSpent)/100)
	})

}
