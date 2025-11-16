// Package handlers implements HTTP handlers for the moniewave financial management system.
//
// Verdict Handler - Credit Assessment
//
// OBJECTIVES:
// Before extending credit, we need to assess affordability.
//
// PURPOSE:
// - Evaluate credit profiles (credit score, income, debt)
// - Calculate maximum affordable amounts
// - Provide approval/denial recommendations
// - Assess risk levels
//
// KEY WORKFLOW:
// Check Affordability → Look up Credit Profile → Analyze Financials →
// Calculate Max Amount → Determine Risk Level → Return Verdict
//
// DESIGN DECISIONS:
// - Mock credit profiles enable testing without real credit bureaus
// - Verdict system considers multiple factors (income, debt, payment history)
// - Risk levels (low, medium, high) inform lending decisions
// - Seeded data includes diverse profiles (approved, review, denied)
// - All amounts in kobo for consistency with rest of system
// - Profiles are looked up by email for customer identification
package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"paystack.mpc.proxy/internal/database"
)

type VerdictHandler struct{}

func NewVerdictHandler() *VerdictHandler {
	return &VerdictHandler{}
}

// CreditProfile represents a credit profile from the database
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

// AffordabilityCheckRequest represents a request to check affordability
type AffordabilityCheckRequest struct {
	Email  string `json:"email"`
	Amount int    `json:"amount"`
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
		Name         string `json:"name"`
		ProfileType  string `json:"profile_type"`
		CreditScore  int    `json:"credit_score"`
		MonthlyIncome int   `json:"monthly_income"`
	} `json:"profile_summary"`
}

// CheckAffordability checks if a customer can afford a specific amount
func (h *VerdictHandler) CheckAffordability(w http.ResponseWriter, r *http.Request) {
	var req AffordabilityCheckRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteJSONBadRequest(w, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Email == "" {
		WriteJSONBadRequest(w, "email is required")
		return
	}

	if req.Amount <= 0 {
		WriteJSONBadRequest(w, "amount must be greater than 0")
		return
	}

	// Query credit profile by email
	query := `
		SELECT id, name, email, phone, profile_type, credit_score, monthly_income,
		       total_debt, employment_status, payment_history_score, account_age_months,
		       verdict, risk_level, max_affordable_amount, notes, created_at, updated_at
		FROM credit_profiles
		WHERE email = ?
	`

	var profile CreditProfile
	err := database.DB.QueryRow(query, req.Email).Scan(
		&profile.ID,
		&profile.Name,
		&profile.Email,
		&profile.Phone,
		&profile.ProfileType,
		&profile.CreditScore,
		&profile.MonthlyIncome,
		&profile.TotalDebt,
		&profile.EmploymentStatus,
		&profile.PaymentHistoryScore,
		&profile.AccountAgeMonths,
		&profile.Verdict,
		&profile.RiskLevel,
		&profile.MaxAffordableAmount,
		&profile.Notes,
		&profile.CreatedAt,
		&profile.UpdatedAt,
	)

	if err != nil {
		WriteJSONError(w, fmt.Errorf("credit profile not found for email: %s", req.Email), http.StatusNotFound)
		return
	}

	// Build response
	response := AffordabilityCheckResponse{
		CanAfford:           req.Amount <= profile.MaxAffordableAmount && profile.Verdict != "denied",
		RequestedAmount:     req.Amount,
		MaxAffordableAmount: profile.MaxAffordableAmount,
		Verdict:             profile.Verdict,
		RiskLevel:           profile.RiskLevel,
	}

	response.ProfileSummary.Name = profile.Name
	response.ProfileSummary.ProfileType = profile.ProfileType
	response.ProfileSummary.CreditScore = profile.CreditScore
	response.ProfileSummary.MonthlyIncome = profile.MonthlyIncome

	// Determine reason
	if profile.Verdict == "denied" {
		response.Reason = fmt.Sprintf("Profile verdict is denied. %s", profile.Notes)
	} else if req.Amount > profile.MaxAffordableAmount {
		response.Reason = fmt.Sprintf("Requested amount (₦%d) exceeds maximum affordable amount (₦%d)", req.Amount/100, profile.MaxAffordableAmount/100)
	} else if profile.Verdict == "review" {
		response.Reason = fmt.Sprintf("Profile requires manual review. %s", profile.Notes)
	} else {
		response.Reason = "Profile approved and amount is within affordability limit"
	}

	WriteJSONSuccess(w, response)
}

// GetFinancialProfile retrieves the complete financial profile for a customer
func (h *VerdictHandler) GetFinancialProfile(w http.ResponseWriter, r *http.Request) {
	email := r.URL.Query().Get("email")
	if email == "" {
		WriteJSONBadRequest(w, "email query parameter is required")
		return
	}

	query := `
		SELECT id, name, email, phone, profile_type, credit_score, monthly_income,
		       total_debt, employment_status, payment_history_score, account_age_months,
		       verdict, risk_level, max_affordable_amount, notes, created_at, updated_at
		FROM credit_profiles
		WHERE email = ?
	`

	var profile CreditProfile
	err := database.DB.QueryRow(query, email).Scan(
		&profile.ID,
		&profile.Name,
		&profile.Email,
		&profile.Phone,
		&profile.ProfileType,
		&profile.CreditScore,
		&profile.MonthlyIncome,
		&profile.TotalDebt,
		&profile.EmploymentStatus,
		&profile.PaymentHistoryScore,
		&profile.AccountAgeMonths,
		&profile.Verdict,
		&profile.RiskLevel,
		&profile.MaxAffordableAmount,
		&profile.Notes,
		&profile.CreatedAt,
		&profile.UpdatedAt,
	)

	if err != nil {
		WriteJSONError(w, fmt.Errorf("credit profile not found for email: %s", email), http.StatusNotFound)
		return
	}

	WriteJSONSuccess(w, profile)
}

// ListProfiles lists all credit profiles (for testing/admin purposes)
func (h *VerdictHandler) ListProfiles(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT id, name, email, phone, profile_type, credit_score, monthly_income,
		       total_debt, employment_status, payment_history_score, account_age_months,
		       verdict, risk_level, max_affordable_amount, notes, created_at, updated_at
		FROM credit_profiles
		ORDER BY created_at DESC
	`

	rows, err := database.DB.Query(query)
	if err != nil {
		WriteJSONError(w, fmt.Errorf("failed to query profiles: %w", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	profiles := []CreditProfile{}
	for rows.Next() {
		var profile CreditProfile
		err := rows.Scan(
			&profile.ID,
			&profile.Name,
			&profile.Email,
			&profile.Phone,
			&profile.ProfileType,
			&profile.CreditScore,
			&profile.MonthlyIncome,
			&profile.TotalDebt,
			&profile.EmploymentStatus,
			&profile.PaymentHistoryScore,
			&profile.AccountAgeMonths,
			&profile.Verdict,
			&profile.RiskLevel,
			&profile.MaxAffordableAmount,
			&profile.Notes,
			&profile.CreatedAt,
			&profile.UpdatedAt,
		)
		if err != nil {
			WriteJSONError(w, fmt.Errorf("failed to scan profile: %w", err), http.StatusInternalServerError)
			return
		}
		profiles = append(profiles, profile)
	}

	if err = rows.Err(); err != nil {
		WriteJSONError(w, fmt.Errorf("error iterating profiles: %w", err), http.StatusInternalServerError)
		return
	}

	WriteJSONSuccess(w, profiles)
}
