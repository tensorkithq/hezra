package integration

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"testing"
	"time"
)

// CreditProfile represents a credit profile from the verdict system
type CreditProfile struct {
	ID                  int       `json:"id"`
	Name                string    `json:"name"`
	Email               string    `json:"email"`
	Phone               string    `json:"phone"`
	ProfileType         string    `json:"profile_type"`
	CreditScore         int       `json:"credit_score"`
	MonthlyIncome       int       `json:"monthly_income"`
	TotalDebt           int       `json:"total_debt"`
	EmploymentStatus    string    `json:"employment_status"`
	PaymentHistoryScore int       `json:"payment_history_score"`
	AccountAgeMonths    int       `json:"account_age_months"`
	Verdict             string    `json:"verdict"`
	RiskLevel           string    `json:"risk_level"`
	MaxAffordableAmount int       `json:"max_affordable_amount"`
	Notes               string    `json:"notes"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

// AffordabilityCheckResponse represents the affordability check result
type AffordabilityCheckResponse struct {
	CanAfford           bool   `json:"can_afford"`
	RequestedAmount     int    `json:"requested_amount"`
	MaxAffordableAmount int    `json:"max_affordable_amount"`
	Verdict             string `json:"verdict"`
	RiskLevel           string `json:"risk_level"`
	Reason              string `json:"reason"`
	ProfileSummary      struct {
		Name          string `json:"name"`
		ProfileType   string `json:"profile_type"`
		CreditScore   int    `json:"credit_score"`
		MonthlyIncome int    `json:"monthly_income"`
	} `json:"profile_summary"`
}

// TestVerdictListProfiles tests listing all credit profiles
func TestVerdictListProfiles(t *testing.T) {
	if os.Getenv("PAYSTACK_SECRET_KEY") == "" {
		t.Skip("PAYSTACK_SECRET_KEY not set, skipping integration test")
	}

	// Wait for server to be ready
	time.Sleep(1 * time.Second)

	// Make GET request to list profiles
	req, err := http.NewRequest("GET", baseURL+"/verdict/profiles", nil)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	defer resp.Body.Close()

	var response Response
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if !response.Status {
		t.Fatalf("Expected status true, got false. Error: %s", response.Error)
	}

	var profiles []CreditProfile
	if err := json.Unmarshal(response.Data, &profiles); err != nil {
		t.Fatalf("Failed to unmarshal profiles: %v", err)
	}

	// Verify we have the 10 seeded profiles
	if len(profiles) != 10 {
		t.Fatalf("Expected 10 profiles, got %d", len(profiles))
	}

	// Verify profile structure
	profile := profiles[0]
	if profile.ID == 0 {
		t.Fatal("Profile ID should not be 0")
	}
	if profile.Name == "" {
		t.Fatal("Profile name should not be empty")
	}
	if profile.Email == "" {
		t.Fatal("Profile email should not be empty")
	}
	if profile.Verdict == "" {
		t.Fatal("Profile verdict should not be empty")
	}

	// Count verdicts
	approvedCount := 0
	deniedCount := 0
	reviewCount := 0

	for _, p := range profiles {
		switch p.Verdict {
		case "approved":
			approvedCount++
		case "denied":
			deniedCount++
		case "review":
			reviewCount++
		}
	}

	t.Logf("✓ Found 10 profiles: %d approved, %d denied, %d review", approvedCount, deniedCount, reviewCount)

	// Verify we have a mix of verdicts
	if approvedCount == 0 {
		t.Fatal("Expected at least one approved profile")
	}
	if deniedCount == 0 {
		t.Fatal("Expected at least one denied profile")
	}
	if reviewCount == 0 {
		t.Fatal("Expected at least one review profile")
	}
}

// TestVerdictGetFinancialProfile tests getting a specific financial profile
func TestVerdictGetFinancialProfile(t *testing.T) {
	if os.Getenv("PAYSTACK_SECRET_KEY") == "" {
		t.Skip("PAYSTACK_SECRET_KEY not set, skipping integration test")
	}

	time.Sleep(1 * time.Second)

	testCases := []struct {
		name          string
		email         string
		expectError   bool
		expectedName  string
		expectedVerdict string
	}{
		{
			name:            "Get John Doe Profile",
			email:           "john.doe@example.com",
			expectError:     false,
			expectedName:    "John Doe",
			expectedVerdict: "approved",
		},
		{
			name:            "Get Sarah Williams Profile",
			email:           "sarah.w@example.com",
			expectError:     false,
			expectedName:    "Sarah Williams",
			expectedVerdict: "denied",
		},
		{
			name:            "Get Tech Innovations Profile",
			email:           "finance@techinnovations.com",
			expectError:     false,
			expectedName:    "Tech Innovations Ltd",
			expectedVerdict: "approved",
		},
		{
			name:        "Get Non-existent Profile",
			email:       "nonexistent@example.com",
			expectError: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			url := fmt.Sprintf("%s/verdict/profile?email=%s", baseURL, tc.email)
			req, err := http.NewRequest("GET", url, nil)
			if err != nil {
				t.Fatalf("Failed to create request: %v", err)
			}

			client := &http.Client{Timeout: 10 * time.Second}
			resp, err := client.Do(req)
			if err != nil {
				t.Fatalf("Request failed: %v", err)
			}
			defer resp.Body.Close()

			var response Response
			if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
				t.Fatalf("Failed to decode response: %v", err)
			}

			if tc.expectError {
				if response.Status {
					t.Fatal("Expected error but got success")
				}
				t.Logf("✓ Correctly returned error for non-existent email")
				return
			}

			if !response.Status {
				t.Fatalf("Expected status true, got false. Error: %s", response.Error)
			}

			var profile CreditProfile
			if err := json.Unmarshal(response.Data, &profile); err != nil {
				t.Fatalf("Failed to unmarshal profile: %v", err)
			}

			if profile.Name != tc.expectedName {
				t.Fatalf("Expected name %s, got %s", tc.expectedName, profile.Name)
			}

			if profile.Email != tc.email {
				t.Fatalf("Expected email %s, got %s", tc.email, profile.Email)
			}

			if profile.Verdict != tc.expectedVerdict {
				t.Fatalf("Expected verdict %s, got %s", tc.expectedVerdict, profile.Verdict)
			}

			if profile.CreditScore == 0 {
				t.Fatal("Credit score should not be 0")
			}

			if profile.MonthlyIncome == 0 {
				t.Fatal("Monthly income should not be 0")
			}

			t.Logf("✓ Retrieved %s profile: verdict=%s, risk=%s, max_affordable=₦%d",
				profile.Name, profile.Verdict, profile.RiskLevel, profile.MaxAffordableAmount/100)
		})
	}
}

// TestVerdictAffordabilityCheck tests the affordability check endpoint
func TestVerdictAffordabilityCheck(t *testing.T) {
	if os.Getenv("PAYSTACK_SECRET_KEY") == "" {
		t.Skip("PAYSTACK_SECRET_KEY not set, skipping integration test")
	}

	time.Sleep(1 * time.Second)

	testCases := []struct {
		name           string
		email          string
		amount         int
		expectAfford   bool
		expectedVerdict string
		expectedRisk   string
	}{
		{
			name:            "Approved - Within Limit",
			email:           "john.doe@example.com",
			amount:          1500000, // ₦15,000 (max is ₦20,000)
			expectAfford:    true,
			expectedVerdict: "approved",
			expectedRisk:    "low",
		},
		{
			name:            "Approved - Exact Limit",
			email:           "john.doe@example.com",
			amount:          2000000, // ₦20,000 (exactly at max)
			expectAfford:    true,
			expectedVerdict: "approved",
			expectedRisk:    "low",
		},
		{
			name:            "Approved - Exceeds Limit",
			email:           "john.doe@example.com",
			amount:          5000000, // ₦50,000 (exceeds ₦20,000 max)
			expectAfford:    false,
			expectedVerdict: "approved",
			expectedRisk:    "low",
		},
		{
			name:            "Denied Profile - Any Amount",
			email:           "sarah.w@example.com",
			amount:          100000, // ₦1,000 (small amount)
			expectAfford:    false,
			expectedVerdict: "denied",
			expectedRisk:    "high",
		},
		{
			name:            "Review Profile - Within Limit",
			email:           "michael.j@example.com",
			amount:          500000, // ₦5,000 (max is ₦8,000)
			expectAfford:    true,
			expectedVerdict: "review",
			expectedRisk:    "medium",
		},
		{
			name:            "Review Profile - Exceeds Limit",
			email:           "michael.j@example.com",
			amount:          1000000, // ₦10,000 (exceeds ₦8,000 max)
			expectAfford:    false,
			expectedVerdict: "review",
			expectedRisk:    "medium",
		},
		{
			name:            "Company - High Limit",
			email:           "admin@globaltrade.com",
			amount:          30000000, // ₦300,000 (max is ₦500,000)
			expectAfford:    true,
			expectedVerdict: "approved",
			expectedRisk:    "low",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			reqBody := map[string]interface{}{
				"email":  tc.email,
				"amount": tc.amount,
			}

			resp := makeRequest(t, "POST", "/verdict/check", reqBody)

			if !resp.Status {
				t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
			}

			var result AffordabilityCheckResponse
			if err := json.Unmarshal(resp.Data, &result); err != nil {
				t.Fatalf("Failed to unmarshal result: %v", err)
			}

			// Verify can_afford flag
			if result.CanAfford != tc.expectAfford {
				t.Fatalf("Expected can_afford=%v, got %v. Reason: %s",
					tc.expectAfford, result.CanAfford, result.Reason)
			}

			// Verify verdict
			if result.Verdict != tc.expectedVerdict {
				t.Fatalf("Expected verdict %s, got %s", tc.expectedVerdict, result.Verdict)
			}

			// Verify risk level
			if result.RiskLevel != tc.expectedRisk {
				t.Fatalf("Expected risk_level %s, got %s", tc.expectedRisk, result.RiskLevel)
			}

			// Verify requested amount
			if result.RequestedAmount != tc.amount {
				t.Fatalf("Expected requested_amount %d, got %d", tc.amount, result.RequestedAmount)
			}

			// Verify profile summary
			if result.ProfileSummary.Name == "" {
				t.Fatal("Profile summary name should not be empty")
			}

			if result.ProfileSummary.CreditScore == 0 {
				t.Fatal("Profile summary credit score should not be 0")
			}

			// Verify reason is provided
			if result.Reason == "" {
				t.Fatal("Reason should not be empty")
			}

			t.Logf("✓ %s: can_afford=%v, verdict=%s, reason=%s",
				result.ProfileSummary.Name, result.CanAfford, result.Verdict, result.Reason)
		})
	}
}

// TestVerdictAffordabilityValidation tests validation errors
func TestVerdictAffordabilityValidation(t *testing.T) {
	if os.Getenv("PAYSTACK_SECRET_KEY") == "" {
		t.Skip("PAYSTACK_SECRET_KEY not set, skipping integration test")
	}

	time.Sleep(1 * time.Second)

	t.Run("Missing Email", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"amount": 500000,
		}

		resp := makeRequest(t, "POST", "/verdict/check", reqBody)

		if resp.Status {
			t.Fatal("Expected status false for missing email")
		}

		if resp.Error == "" {
			t.Fatal("Expected error message")
		}

		t.Logf("✓ Validation works: %s", resp.Error)
	})

	t.Run("Missing Amount", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"email": "john.doe@example.com",
		}

		resp := makeRequest(t, "POST", "/verdict/check", reqBody)

		if resp.Status {
			t.Fatal("Expected status false for missing amount")
		}

		t.Logf("✓ Amount validation works: %s", resp.Error)
	})

	t.Run("Invalid Amount (Negative)", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"email":  "john.doe@example.com",
			"amount": -1000,
		}

		resp := makeRequest(t, "POST", "/verdict/check", reqBody)

		if resp.Status {
			t.Fatal("Expected status false for negative amount")
		}

		t.Logf("✓ Negative amount validation works: %s", resp.Error)
	})

	t.Run("Invalid Amount (Zero)", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"email":  "john.doe@example.com",
			"amount": 0,
		}

		resp := makeRequest(t, "POST", "/verdict/check", reqBody)

		if resp.Status {
			t.Fatal("Expected status false for zero amount")
		}

		t.Logf("✓ Zero amount validation works: %s", resp.Error)
	})

	t.Run("Non-existent Email", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"email":  "doesnotexist@example.com",
			"amount": 500000,
		}

		resp := makeRequest(t, "POST", "/verdict/check", reqBody)

		if resp.Status {
			t.Fatal("Expected status false for non-existent email")
		}

		t.Logf("✓ Non-existent email handled correctly: %s", resp.Error)
	})
}

// TestVerdictProfileTypes tests different profile types
func TestVerdictProfileTypes(t *testing.T) {
	if os.Getenv("PAYSTACK_SECRET_KEY") == "" {
		t.Skip("PAYSTACK_SECRET_KEY not set, skipping integration test")
	}

	time.Sleep(1 * time.Second)

	// Get all profiles
	req, err := http.NewRequest("GET", baseURL+"/verdict/profiles", nil)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	defer resp.Body.Close()

	var response Response
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	var profiles []CreditProfile
	if err := json.Unmarshal(response.Data, &profiles); err != nil {
		t.Fatalf("Failed to unmarshal profiles: %v", err)
	}

	// Count profile types
	individualCount := 0
	companyCount := 0

	for _, p := range profiles {
		if p.ProfileType == "individual" {
			individualCount++
		} else if p.ProfileType == "company" {
			companyCount++
		}
	}

	if individualCount == 0 {
		t.Fatal("Expected at least one individual profile")
	}

	if companyCount == 0 {
		t.Fatal("Expected at least one company profile")
	}

	t.Logf("✓ Found %d individual profiles and %d company profiles", individualCount, companyCount)

	// Verify companies have higher limits
	var maxIndividual, maxCompany int
	for _, p := range profiles {
		if p.ProfileType == "individual" && p.MaxAffordableAmount > maxIndividual {
			maxIndividual = p.MaxAffordableAmount
		}
		if p.ProfileType == "company" && p.MaxAffordableAmount > maxCompany {
			maxCompany = p.MaxAffordableAmount
		}
	}

	if maxCompany <= maxIndividual {
		t.Logf("Warning: Expected companies to have higher max limits than individuals")
	} else {
		t.Logf("✓ Companies have higher limits: ₦%d vs ₦%d (individual)",
			maxCompany/100, maxIndividual/100)
	}
}
