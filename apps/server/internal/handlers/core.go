// Package handlers implements HTTP handlers for the moniewave financial management system.
//
// Core Handler - Paystack Integration Layer
//
// OBJECTIVES:
// Provide essential Paystack account operations.
//
// PURPOSE:
// - Check account balance via Paystack API
// - Monitor available funds for transfers and operations
//
// KEY WORKFLOW:
// Check Balance → Call Paystack API → Return Balance Info
//
// DESIGN DECISIONS:
// - Uses SafeCheckBalance for error-resistant balance checks
// - No local caching (always fetches fresh data from Paystack)
package handlers

import (
	"fmt"
	"net/http"

	"paystack.mpc.proxy/internal/paystack"
)

type CoreHandler struct {
	client *paystack.Client
}

func NewCoreHandler(client *paystack.Client) *CoreHandler {
	return &CoreHandler{client: client}
}

func (h *CoreHandler) CheckBalance(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.SafeCheckBalance()
	if err != nil {
		WriteJSONError(w, fmt.Errorf("failed to check balance: %w", err), http.StatusInternalServerError)
		return
	}
	WriteJSONSuccess(w, resp)
}
