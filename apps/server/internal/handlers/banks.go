// Package handlers implements HTTP handlers for the moniewave financial management system.
//
// Banks Handler - Paystack Integration Layer
//
// OBJECTIVES:
// Provide bank information for Nigerian banking operations.
//
// PURPOSE:
// - List Nigerian banks and their codes
// - Resolve account numbers to verify account ownership
// - Enable accurate recipient creation for transfers
//
// KEY WORKFLOW:
// List Banks → User Selects Bank → Resolve Account Number → Verify Account Details
//
// DESIGN DECISIONS:
// - Bank list fetched from Paystack for up-to-date information
// - Account resolution validates account ownership before transfers
// - No local caching (banks list is small and changes infrequently)
package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"paystack.mpc.proxy/internal/paystack"
)

type BankHandler struct {
	client *paystack.Client
}

func NewBankHandler(client *paystack.Client) *BankHandler {
	return &BankHandler{client: client}
}

type ResolveAccountRequest struct {
	AccountNumber string `json:"account_number"`
	BankCode      string `json:"bank_code"`
}

func (h *BankHandler) List(w http.ResponseWriter, r *http.Request) {
	result, err := h.client.Bank.List()
	if err != nil {
		WriteJSONError(w, fmt.Errorf("failed to list banks: %w", err), http.StatusInternalServerError)
		return
	}
	WriteJSONSuccess(w, result)
}

func (h *BankHandler) ResolveAccount(w http.ResponseWriter, r *http.Request) {
	var req ResolveAccountRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteJSONBadRequest(w, "Invalid request body")
		return
	}

	if req.AccountNumber == "" || req.BankCode == "" {
		WriteJSONBadRequest(w, "account_number and bank_code are required")
		return
	}

	result, err := h.client.Bank.ResolveAccountNumber(req.AccountNumber, req.BankCode)
	if err != nil {
		WriteJSONError(w, err, http.StatusInternalServerError)
		return
	}
	WriteJSONSuccess(w, result)
}
