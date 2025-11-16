// Package handlers implements HTTP handlers for the moniewave financial management system.
//
// Plans Handler - Paystack Integration Layer
//
// OBJECTIVES:
// Manage recurring payment plans.
//
// PURPOSE:
// - List subscription plans available for customers
// - Define pricing and billing intervals
// - Enable subscription-based revenue
//
// KEY WORKFLOW:
// Create Plan → Customer Subscribes → Recurring Charges → Track Subscriptions
//
// DESIGN DECISIONS:
// - Plans stored in Paystack (no local cache)
// - Pagination support for large plan lists
// - Direct passthrough to Paystack SDK
package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"paystack.mpc.proxy/internal/paystack"
)

type PlanHandler struct {
	client *paystack.Client
}

func NewPlanHandler(client *paystack.Client) *PlanHandler {
	return &PlanHandler{client: client}
}

func (h *PlanHandler) List(w http.ResponseWriter, r *http.Request) {
	var req ListRequest
	if r.Body != http.NoBody {
		json.NewDecoder(r.Body).Decode(&req)
	}

	if req.Count > 0 {
		result, err := h.client.Plan.ListN(req.Count, req.Offset)
		if err != nil {
			WriteJSONError(w, err, http.StatusInternalServerError)
			return
		}
		WriteJSONSuccess(w, result)
		return
	}

	result, err := h.client.Plan.List()
	if err != nil {
		WriteJSONError(w, fmt.Errorf("failed to list plans: %w", err), http.StatusInternalServerError)
		return
	}
	WriteJSONSuccess(w, result)
}
