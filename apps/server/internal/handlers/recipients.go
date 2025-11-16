// Package handlers implements HTTP handlers for the moniewave financial management system.
//
// Recipients Handler - Payment Infrastructure
//
// OBJECTIVES:
// Before you can send money, you need to know where it's going.
//
// PURPOSE:
// - Cache Paystack transfer recipient data locally
// - Provide fast recipient lookups without API calls
// - Support expense creation with validated recipients
// - Maintain default recipients (e.g., service providers)
//
// KEY WORKFLOW:
// Create Recipient → Call Paystack API → Cache Locally →
// Reference in Expenses → Validate Before Transfer
//
// DESIGN DECISIONS:
// - Recipients are cached to reduce API calls and improve performance
// - Default recipient (RCP_serviceprovider) enables unified service provider payments
// - Local cache ensures expenses can reference recipients that exist
// - All recipient creation goes through Paystack first, then cached locally
// - Bank name extracted from Paystack response for display purposes
package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"paystack.mpc.proxy/internal/database"
	"paystack.mpc.proxy/internal/paystack"

	paystackSDK "github.com/borderlesshq/paystack-go"
)

type RecipientHandler struct {
	client *paystack.Client
}

func NewRecipientHandler(client *paystack.Client) *RecipientHandler {
	return &RecipientHandler{client: client}
}

// Recipient represents a cached transfer recipient
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

type CreateRecipientWithCacheRequest struct {
	Type          string `json:"type"`
	Name          string `json:"name"`
	AccountNumber string `json:"account_number"`
	BankCode      string `json:"bank_code"`
	Currency      string `json:"currency,omitempty"`
	Description   string `json:"description,omitempty"`
}

// Create creates a new transfer recipient in Paystack and caches it locally
func (h *RecipientHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateRecipientWithCacheRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteJSONBadRequest(w, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Type == "" {
		WriteJSONBadRequest(w, "type is required")
		return
	}

	if req.Name == "" {
		WriteJSONBadRequest(w, "name is required")
		return
	}

	if req.AccountNumber == "" {
		WriteJSONBadRequest(w, "account_number is required")
		return
	}

	if req.BankCode == "" {
		WriteJSONBadRequest(w, "bank_code is required")
		return
	}

	// Set default currency
	if req.Currency == "" {
		req.Currency = "NGN"
	}

	// Create recipient in Paystack
	recipient := &paystackSDK.TransferRecipient{
		Type:          req.Type,
		Name:          req.Name,
		AccountNumber: req.AccountNumber,
		BankCode:      req.BankCode,
		Currency:      req.Currency,
	}

	result, err := h.client.Transfer.CreateRecipient(recipient)
	if err != nil {
		WriteJSONError(w, fmt.Errorf("failed to create recipient in Paystack: %w", err), http.StatusInternalServerError)
		return
	}

	// Extract response data
	recipientCode := result.RecipientCode
	bankName := ""
	if result.Details != nil {
		if bn, ok := result.Details["bank_name"].(string); ok {
			bankName = bn
		}
	}

	// Cache in SQLite
	query := `
		INSERT INTO recipients (recipient_code, type, name, account_number, bank_code, bank_name, currency, description, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	now := time.Now()
	_, err = database.DB.Exec(
		query,
		recipientCode,
		req.Type,
		req.Name,
		req.AccountNumber,
		req.BankCode,
		bankName,
		req.Currency,
		req.Description,
		now,
		now,
	)
	if err != nil {
		// Log error but still return Paystack response
		fmt.Printf("Warning: Failed to cache recipient in database: %v\n", err)
	}

	// Return Paystack response
	WriteJSONSuccess(w, result)
}

// List lists all cached recipients from SQLite
func (h *RecipientHandler) List(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT id, recipient_code, type, name, account_number, bank_code, bank_name, currency, description, created_at, updated_at
		FROM recipients
		ORDER BY created_at DESC
	`

	rows, err := database.DB.Query(query)
	if err != nil {
		WriteJSONError(w, fmt.Errorf("failed to query recipients: %w", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	recipients := []Recipient{}
	for rows.Next() {
		var recipient Recipient
		var bankName, description sql.NullString

		err := rows.Scan(
			&recipient.ID,
			&recipient.RecipientCode,
			&recipient.Type,
			&recipient.Name,
			&recipient.AccountNumber,
			&recipient.BankCode,
			&bankName,
			&recipient.Currency,
			&description,
			&recipient.CreatedAt,
			&recipient.UpdatedAt,
		)
		if err != nil {
			WriteJSONError(w, fmt.Errorf("failed to scan recipient: %w", err), http.StatusInternalServerError)
			return
		}

		if bankName.Valid {
			recipient.BankName = bankName.String
		}
		if description.Valid {
			recipient.Description = description.String
		}

		recipients = append(recipients, recipient)
	}

	if err = rows.Err(); err != nil {
		WriteJSONError(w, fmt.Errorf("error iterating recipients: %w", err), http.StatusInternalServerError)
		return
	}

	WriteJSONSuccess(w, recipients)
}

// Get retrieves a specific recipient by recipient_code
func (h *RecipientHandler) Get(w http.ResponseWriter, r *http.Request) {
	recipientCode := r.URL.Query().Get("recipient_code")
	if recipientCode == "" {
		WriteJSONBadRequest(w, "recipient_code query parameter is required")
		return
	}

	query := `
		SELECT id, recipient_code, type, name, account_number, bank_code, bank_name, currency, description, created_at, updated_at
		FROM recipients
		WHERE recipient_code = ?
	`

	var recipient Recipient
	var bankName, description sql.NullString

	err := database.DB.QueryRow(query, recipientCode).Scan(
		&recipient.ID,
		&recipient.RecipientCode,
		&recipient.Type,
		&recipient.Name,
		&recipient.AccountNumber,
		&recipient.BankCode,
		&bankName,
		&recipient.Currency,
		&description,
		&recipient.CreatedAt,
		&recipient.UpdatedAt,
	)

	if err != nil {
		WriteJSONError(w, fmt.Errorf("recipient not found: %s", recipientCode), http.StatusNotFound)
		return
	}

	if bankName.Valid {
		recipient.BankName = bankName.String
	}
	if description.Valid {
		recipient.Description = description.String
	}

	WriteJSONSuccess(w, recipient)
}
