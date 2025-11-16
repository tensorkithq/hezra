// Package handlers implements HTTP handlers for the moniewave financial management system.
//
// SubAccounts Handler - Paystack Integration Layer
//
// OBJECTIVES:
// Manage Paystack sub-accounts for split payments.
//
// PURPOSE:
// - List sub-accounts used for payment splitting
// - Enable marketplace and platform payment distribution
// - Track sub-account balances and transactions
//
// KEY WORKFLOW:
// Create SubAccount → Configure Split → Process Payment → Distribute to SubAccounts
//
// DESIGN DECISIONS:
// - Sub-accounts managed through Paystack API
// - Enables marketplace business models (take fees, split payments)
// - Pagination support for large sub-account lists
package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"paystack.mpc.proxy/internal/paystack"
)

type SubAccountHandler struct {
	client *paystack.Client
}

func NewSubAccountHandler(client *paystack.Client) *SubAccountHandler {
	return &SubAccountHandler{client: client}
}

func (h *SubAccountHandler) List(w http.ResponseWriter, r *http.Request) {
	var req ListRequest
	if r.Body != http.NoBody {
		json.NewDecoder(r.Body).Decode(&req)
	}

	if req.Count > 0 {
		result, err := h.client.SubAccount.ListN(req.Count, req.Offset)
		if err != nil {
			WriteJSONError(w, err, http.StatusInternalServerError)
			return
		}
		WriteJSONSuccess(w, result)
		return
	}

	result, err := h.client.SubAccount.List()
	if err != nil {
		WriteJSONError(w, fmt.Errorf("failed to list subaccounts: %w", err), http.StatusInternalServerError)
		return
	}
	WriteJSONSuccess(w, result)
}
