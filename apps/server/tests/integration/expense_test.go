package integration

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"testing"
	"time"
)

// Recipient represents a transfer recipient
type Recipient struct {
	ID            int       `json:"id"`
	RecipientCode string    `json:"recipient_code"`
	Type          string    `json:"type"`
	Name          string    `json:"name"`
	AccountNumber string    `json:"account_number"`
	BankCode      string    `json:"bank_code"`
	BankName      string    `json:"bank_name"`
	Currency      string    `json:"currency"`
	Description   string    `json:"description"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
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
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

// TestRecipientWorkflow tests the complete recipient workflow
func TestRecipientWorkflow(t *testing.T) {
	if os.Getenv("PAYSTACK_SECRET_KEY") == "" {
		t.Skip("PAYSTACK_SECRET_KEY not set, skipping integration test")
	}

	time.Sleep(1 * time.Second)

	var recipientCode string

	t.Run("Step1_CreateRecipient", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"type":           "nuban",
			"name":           "Integration Test Recipient",
			"account_number": "0123456789",
			"bank_code":      "058",
			"currency":       "NGN",
			"narration":    "Test recipient for expenses",
		}

		resp := makeRequest(t, "POST", "/recipients/create", reqBody)

		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		// Parse Paystack response
		var result map[string]interface{}
		if err := json.Unmarshal(resp.Data, &result); err != nil {
			t.Fatalf("Failed to unmarshal recipient: %v", err)
		}

		rc, ok := result["recipient_code"].(string)
		if !ok || rc == "" {
			t.Fatal("Failed to get recipient_code from response")
		}

		recipientCode = rc
		t.Logf("✓ Created recipient: %s", recipientCode)
	})

	t.Run("Step2_ListRecipients", func(t *testing.T) {
		if recipientCode == "" {
			t.Fatal("recipientCode not set from previous step")
		}

		req, err := http.NewRequest("GET", baseURL+"/api/v1/recipients/list", nil)
		if err != nil {
			t.Fatalf("Failed to create request: %v", err)
		}

		client := &http.Client{Timeout: 10 * time.Second}
		httpResp, err := client.Do(req)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		defer httpResp.Body.Close()

		var resp Response
		if err := json.NewDecoder(httpResp.Body).Decode(&resp); err != nil {
			t.Fatalf("Failed to decode response: %v", err)
		}

		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		var recipients []Recipient
		if err := json.Unmarshal(resp.Data, &recipients); err != nil {
			t.Fatalf("Failed to unmarshal recipients: %v", err)
		}

		// Find our created recipient
		found := false
		for _, r := range recipients {
			if r.RecipientCode == recipientCode {
				found = true
				t.Logf("✓ Found recipient in cache: %s (%s)", r.Name, r.RecipientCode)
				break
			}
		}

		if !found {
			t.Fatalf("Created recipient not found in list: %s", recipientCode)
		}
	})

	t.Run("Step3_GetRecipient", func(t *testing.T) {
		if recipientCode == "" {
			t.Fatal("recipientCode not set from previous step")
		}

		url := fmt.Sprintf("%s/api/v1/recipients/get?recipient_code=%s", baseURL, recipientCode)
		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			t.Fatalf("Failed to create request: %v", err)
		}

		client := &http.Client{Timeout: 10 * time.Second}
		httpResp, err := client.Do(req)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		defer httpResp.Body.Close()

		var resp Response
		if err := json.NewDecoder(httpResp.Body).Decode(&resp); err != nil {
			t.Fatalf("Failed to decode response: %v", err)
		}

		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		var recipient Recipient
		if err := json.Unmarshal(resp.Data, &recipient); err != nil {
			t.Fatalf("Failed to unmarshal recipient: %v", err)
		}

		if recipient.RecipientCode != recipientCode {
			t.Fatalf("Expected recipient_code %s, got %s", recipientCode, recipient.RecipientCode)
		}

		t.Logf("✓ Retrieved recipient: %s - %s", recipient.Name, recipient.AccountNumber)
	})
}

// TestExpenseWorkflow tests the complete expense workflow
func TestExpenseWorkflow(t *testing.T) {
	if os.Getenv("PAYSTACK_SECRET_KEY") == "" {
		t.Skip("PAYSTACK_SECRET_KEY not set, skipping integration test")
	}

	time.Sleep(1 * time.Second)

	var recipientCode string
	var expenseID int

	t.Run("Step1_CreateRecipient", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"type":           "nuban",
			"name":           "Expense Test Vendor",
			"account_number": "9876543210",
			"bank_code":      "058",
		}

		resp := makeRequest(t, "POST", "/recipients/create", reqBody)

		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		var result map[string]interface{}
		if err := json.Unmarshal(resp.Data, &result); err != nil {
			t.Fatalf("Failed to unmarshal recipient: %v", err)
		}

		rc, ok := result["recipient_code"].(string)
		if !ok || rc == "" {
			t.Fatal("Failed to get recipient_code from response")
		}

		recipientCode = rc
		t.Logf("✓ Created recipient for expenses: %s", recipientCode)
	})

	t.Run("Step2_CreateExpense", func(t *testing.T) {
		if recipientCode == "" {
			t.Fatal("recipientCode not set from previous step")
		}

		reqBody := map[string]interface{}{
			"recipient_code": recipientCode,
			"amount":         5000000, // ₦50,000
			"currency":       "NGN",
			"category":       "software",
			"narration":    "Monthly SaaS subscription",
			"notes":          "Payment for January 2024",
		}

		resp := makeRequest(t, "POST", "/expenses/create", reqBody)

		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		var expense Expense
		if err := json.Unmarshal(resp.Data, &expense); err != nil {
			t.Fatalf("Failed to unmarshal expense: %v", err)
		}

		if expense.ID == 0 {
			t.Fatal("Expense ID should not be 0")
		}

		if expense.RecipientCode != recipientCode {
			t.Fatalf("Expected recipient_code %s, got %s", recipientCode, expense.RecipientCode)
		}

		if expense.Amount != 5000000 {
			t.Fatalf("Expected amount 5000000, got %d", expense.Amount)
		}

		if expense.Status != "pending" {
			t.Fatalf("Expected status 'pending', got %s", expense.Status)
		}

		if expense.Reference == "" {
			t.Fatal("Reference should not be empty")
		}

		expenseID = expense.ID
		t.Logf("✓ Created expense #%d: ₦%d - %s", expense.ID, expense.Amount/100, expense.Narration)
	})

	t.Run("Step3_ListExpenses", func(t *testing.T) {
		if recipientCode == "" {
			t.Fatal("recipientCode not set from previous step")
		}

		reqBody := map[string]interface{}{
			"recipient_code": recipientCode,
		}

		resp := makeRequest(t, "POST", "/expenses/list", reqBody)

		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		var expenses []Expense
		if err := json.Unmarshal(resp.Data, &expenses); err != nil {
			t.Fatalf("Failed to unmarshal expenses: %v", err)
		}

		if len(expenses) == 0 {
			t.Fatal("Expected at least one expense")
		}

		// Find our expense
		found := false
		for _, e := range expenses {
			if e.ID == expenseID {
				found = true
				t.Logf("✓ Found expense in list: #%d - %s", e.ID, e.Narration)
				break
			}
		}

		if !found {
			t.Fatalf("Created expense not found in list: #%d", expenseID)
		}
	})

	t.Run("Step4_GetExpense", func(t *testing.T) {
		if expenseID == 0 {
			t.Fatal("expenseID not set from previous step")
		}

		url := fmt.Sprintf("%s/api/v1/expenses/get/%d", baseURL, expenseID)
		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			t.Fatalf("Failed to create request: %v", err)
		}

		client := &http.Client{Timeout: 10 * time.Second}
		httpResp, err := client.Do(req)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		defer httpResp.Body.Close()

		var resp Response
		if err := json.NewDecoder(httpResp.Body).Decode(&resp); err != nil {
			t.Fatalf("Failed to decode response: %v", err)
		}

		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		var expense Expense
		if err := json.Unmarshal(resp.Data, &expense); err != nil {
			t.Fatalf("Failed to unmarshal expense: %v", err)
		}

		if expense.ID != expenseID {
			t.Fatalf("Expected expense ID %d, got %d", expenseID, expense.ID)
		}

		t.Logf("✓ Retrieved expense: #%d - %s (Status: %s)", expense.ID, expense.Narration, expense.Status)
	})

	t.Run("Step5_UpdateExpense", func(t *testing.T) {
		if expenseID == 0 {
			t.Fatal("expenseID not set from previous step")
		}

		reqBody := map[string]interface{}{
			"status": "paid",
			"notes":  "Payment completed via bank transfer",
		}

		url := fmt.Sprintf("/expenses/update/%d", expenseID)
		resp := makeRequest(t, "PUT", url, reqBody)

		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		var expense Expense
		if err := json.Unmarshal(resp.Data, &expense); err != nil {
			t.Fatalf("Failed to unmarshal expense: %v", err)
		}

		if expense.Status != "paid" {
			t.Fatalf("Expected status 'paid', got %s", expense.Status)
		}

		t.Logf("✓ Updated expense status to: %s", expense.Status)
	})
}

// TestExpenseValidation tests validation errors
func TestExpenseValidation(t *testing.T) {
	if os.Getenv("PAYSTACK_SECRET_KEY") == "" {
		t.Skip("PAYSTACK_SECRET_KEY not set, skipping integration test")
	}

	time.Sleep(1 * time.Second)

	t.Run("MissingRecipientCode", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"amount":      1000000,
			"narration": "Test expense",
		}

		resp := makeRequest(t, "POST", "/expenses/create", reqBody)

		if resp.Status {
			t.Fatal("Expected status false for missing recipient_code")
		}

		t.Logf("✓ Validation works: %s", resp.Error)
	})

	t.Run("InvalidAmount", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"recipient_code": "RCP_test",
			"amount":         0,
			"narration":    "Test expense",
		}

		resp := makeRequest(t, "POST", "/expenses/create", reqBody)

		if resp.Status {
			t.Fatal("Expected status false for invalid amount")
		}

		t.Logf("✓ Amount validation works: %s", resp.Error)
	})

	t.Run("MissingDescription", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"recipient_code": "RCP_test",
			"amount":         1000000,
		}

		resp := makeRequest(t, "POST", "/expenses/create", reqBody)

		if resp.Status {
			t.Fatal("Expected status false for missing description")
		}

		t.Logf("✓ Description validation works: %s", resp.Error)
	})

	t.Run("NonExistentRecipient", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"recipient_code": "RCP_nonexistent",
			"amount":         1000000,
			"narration":    "Test expense",
		}

		resp := makeRequest(t, "POST", "/expenses/create", reqBody)

		if resp.Status {
			t.Fatal("Expected status false for non-existent recipient")
		}

		t.Logf("✓ Recipient validation works: %s", resp.Error)
	})
}

// TestExpenseFilters tests expense list filtering
func TestExpenseFilters(t *testing.T) {
	if os.Getenv("PAYSTACK_SECRET_KEY") == "" {
		t.Skip("PAYSTACK_SECRET_KEY not set, skipping integration test")
	}

	time.Sleep(1 * time.Second)

	var recipientCode string

	// Create a recipient and multiple expenses
	t.Run("Setup", func(t *testing.T) {
		// Create recipient
		recipientResp := makeRequest(t, "POST", "/recipients/create", map[string]interface{}{
			"type":           "nuban",
			"name":           "Filter Test Vendor",
			"account_number": "1122334455",
			"bank_code":      "058",
		})

		if !recipientResp.Status {
			t.Fatalf("Failed to create recipient: %s", recipientResp.Error)
		}

		var result map[string]interface{}
		json.Unmarshal(recipientResp.Data, &result)
		recipientCode = result["recipient_code"].(string)

		// Create multiple expenses with different categories
		categories := []string{"software", "hardware", "consulting"}
		for _, category := range categories {
			expenseResp := makeRequest(t, "POST", "/expenses/create", map[string]interface{}{
				"recipient_code": recipientCode,
				"amount":         1000000 + (len(category) * 100000),
				"category":       category,
				"narration":    fmt.Sprintf("Test %s expense", category),
			})

			if !expenseResp.Status {
				t.Fatalf("Failed to create expense: %s", expenseResp.Error)
			}
		}

		t.Logf("✓ Created test data with recipient: %s", recipientCode)
	})

	t.Run("FilterByCategory", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"category": "software",
		}

		resp := makeRequest(t, "POST", "/expenses/list", reqBody)

		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		var expenses []Expense
		json.Unmarshal(resp.Data, &expenses)

		// Verify all expenses have the correct category
		for _, e := range expenses {
			if e.Category != "software" {
				t.Fatalf("Expected category 'software', got %s", e.Category)
			}
		}

		t.Logf("✓ Category filter works: found %d software expenses", len(expenses))
	})

	t.Run("FilterByStatus", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"status": "pending",
		}

		resp := makeRequest(t, "POST", "/expenses/list", reqBody)

		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		var expenses []Expense
		json.Unmarshal(resp.Data, &expenses)

		// Verify all expenses have pending status
		for _, e := range expenses {
			if e.Status != "pending" {
				t.Fatalf("Expected status 'pending', got %s", e.Status)
			}
		}

		t.Logf("✓ Status filter works: found %d pending expenses", len(expenses))
	})

	t.Run("FilterByRecipient", func(t *testing.T) {
		if recipientCode == "" {
			t.Fatal("recipientCode not set from setup")
		}

		reqBody := map[string]interface{}{
			"recipient_code": recipientCode,
		}

		resp := makeRequest(t, "POST", "/expenses/list", reqBody)

		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		var expenses []Expense
		json.Unmarshal(resp.Data, &expenses)

		if len(expenses) != 3 {
			t.Fatalf("Expected 3 expenses, got %d", len(expenses))
		}

		// Verify all expenses belong to the same recipient
		for _, e := range expenses {
			if e.RecipientCode != recipientCode {
				t.Fatalf("Expected recipient_code %s, got %s", recipientCode, e.RecipientCode)
			}
		}

		t.Logf("✓ Recipient filter works: found %d expenses", len(expenses))
	})
}
