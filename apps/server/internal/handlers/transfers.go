// Package handlers implements HTTP handlers for the moniewave financial management system.
//
// Transfers Handler - Paystack Integration Layer
//
// OBJECTIVES:
// Initiate bank transfers to recipients.
//
// PURPOSE:
// - Create transfer recipients with bank account details
// - Initiate transfers from Paystack balance to bank accounts
// - Track transfer status and history
//
// KEY WORKFLOW:
// Create Recipient → Initiate Transfer → Verify Transfer → Complete Transaction
//
// DESIGN DECISIONS:
// - Recipients created via Paystack API before transfers
// - All transfers go through Paystack (no direct bank integration)
// - Currency defaults to NGN (Nigerian Naira)
// - Reason field for transfer narration and tracking
package handlers

import (
	"encoding/json"
	"net/http"

	"paystack.mpc.proxy/internal/paystack"

	paystackSDK "github.com/borderlesshq/paystack-go"
)

type TransferHandler struct {
	client *paystack.Client
}

func NewTransferHandler(client *paystack.Client) *TransferHandler {
	return &TransferHandler{client: client}
}

type CreateRecipientRequest struct {
	Type          string `json:"type"`
	Name          string `json:"name"`
	AccountNumber string `json:"account_number"`
	BankCode      string `json:"bank_code"`
	Currency      string `json:"currency,omitempty"`
}

type InitiateTransferRequest struct {
	Source    string  `json:"source"`
	Amount    float32 `json:"amount"`
	Recipient string  `json:"recipient"`
	Reason    string  `json:"reason,omitempty"`
}

func (h *TransferHandler) CreateRecipient(w http.ResponseWriter, r *http.Request) {
	var req CreateRecipientRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteJSONBadRequest(w, "Invalid request body")
		return
	}

	if req.Type == "" || req.Name == "" || req.AccountNumber == "" || req.BankCode == "" {
		WriteJSONBadRequest(w, "type, name, account_number, and bank_code are required")
		return
	}

	if req.Currency == "" {
		req.Currency = "NGN"
	}

	recipient := &paystackSDK.TransferRecipient{
		Type:          req.Type,
		Name:          req.Name,
		AccountNumber: req.AccountNumber,
		BankCode:      req.BankCode,
		Currency:      req.Currency,
	}

	result, err := h.client.Transfer.CreateRecipient(recipient)
	if err != nil {
		WriteJSONError(w, err, http.StatusInternalServerError)
		return
	}
	WriteJSONSuccess(w, result)
}

func (h *TransferHandler) Initiate(w http.ResponseWriter, r *http.Request) {
	var req InitiateTransferRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteJSONBadRequest(w, "Invalid request body")
		return
	}

	if req.Source == "" || req.Amount == 0 || req.Recipient == "" {
		WriteJSONBadRequest(w, "source, amount, and recipient are required")
		return
	}

	transferReq := &paystackSDK.TransferRequest{
		Source:    req.Source,
		Amount:    req.Amount,
		Recipient: req.Recipient,
		Reason:    req.Reason,
	}

	result, err := h.client.Transfer.Initiate(transferReq)
	if err != nil {
		WriteJSONError(w, err, http.StatusInternalServerError)
		return
	}
	WriteJSONSuccess(w, result)
}
