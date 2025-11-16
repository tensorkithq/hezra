// Package handlers implements HTTP handlers for the moniewave financial management system.
//
// Transactions Handler - Income Management
//
// OBJECTIVES:
// Track all incoming payments.
//
// PURPOSE:
// - Initialize payment transactions
// - Verify payment completion
// - List transaction history
// - Process customer charges
//
// KEY WORKFLOW:
// Initialize Transaction → Get Payment URL → Customer Pays →
// Verify Transaction → Update Status → Record Revenue
//
// DESIGN DECISIONS:
// - All transactions go through Paystack API (no local storage)
// - Reference is used to track transaction state
// - Verification is required before considering payment complete
// - List supports pagination for large transaction histories
package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"paystack.mpc.proxy/internal/paystack"

	paystackSDK "github.com/borderlesshq/paystack-go"
)

type TransactionHandler struct {
	client *paystack.Client
}

func NewTransactionHandler(client *paystack.Client) *TransactionHandler {
	return &TransactionHandler{client: client}
}

type InitializeTransactionRequest struct {
	Email       string  `json:"email"`
	Amount      float64 `json:"amount"`
	Reference   string  `json:"reference,omitempty"`
	CallbackURL string  `json:"callback_url,omitempty"`
	Currency    string  `json:"currency,omitempty"`
}

type VerifyTransactionRequest struct {
	Reference string `json:"reference"`
}

func (h *TransactionHandler) Initialize(w http.ResponseWriter, r *http.Request) {
	var req InitializeTransactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteJSONBadRequest(w, "Invalid request body")
		return
	}

	if req.Email == "" || req.Amount == 0 {
		WriteJSONBadRequest(w, "email and amount are required")
		return
	}

	txn := &paystackSDK.TransactionRequest{
		Email:       req.Email,
		Amount:      req.Amount,
		Reference:   req.Reference,
		CallbackURL: req.CallbackURL,
		Currency:    req.Currency,
	}

	result, err := h.client.Transaction.Initialize(txn)
	if err != nil {
		WriteJSONError(w, err, http.StatusInternalServerError)
		return
	}
	WriteJSONSuccess(w, result)
}

func (h *TransactionHandler) Verify(w http.ResponseWriter, r *http.Request) {
	var req VerifyTransactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteJSONBadRequest(w, "Invalid request body")
		return
	}

	if req.Reference == "" {
		WriteJSONBadRequest(w, "reference is required")
		return
	}

	result, err := h.client.Transaction.Verify(req.Reference)
	if err != nil {
		WriteJSONError(w, err, http.StatusInternalServerError)
		return
	}
	WriteJSONSuccess(w, result)
}

func (h *TransactionHandler) List(w http.ResponseWriter, r *http.Request) {
	var req ListRequest
	if r.Body != http.NoBody {
		json.NewDecoder(r.Body).Decode(&req)
	}

	if req.Count > 0 {
		result, err := h.client.Transaction.ListN(req.Count, req.Offset)
		if err != nil {
			WriteJSONError(w, err, http.StatusInternalServerError)
			return
		}
		WriteJSONSuccess(w, result)
		return
	}

	result, err := h.client.Transaction.List()
	if err != nil {
		WriteJSONError(w, fmt.Errorf("failed to list transactions: %w", err), http.StatusInternalServerError)
		return
	}
	WriteJSONSuccess(w, result)
}
