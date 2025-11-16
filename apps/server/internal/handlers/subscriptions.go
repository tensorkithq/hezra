// Package handlers implements HTTP handlers for the moniewave financial management system.
//
// Subscriptions Handler - Paystack Integration Layer
//
// OBJECTIVES:
// Track active and past subscriptions.
//
// PURPOSE:
// - List customer subscriptions
// - Monitor subscription status (active, cancelled, expired)
// - Track recurring revenue
//
// KEY WORKFLOW:
// Customer Subscribes to Plan → Track Subscription → Process Recurring Payments → Monitor Status
//
// DESIGN DECISIONS:
// - Subscriptions managed entirely through Paystack
// - Pagination support for subscription history
// - No local state (always fetch from Paystack for accuracy)
package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"paystack.mpc.proxy/internal/paystack"
)

type SubscriptionHandler struct {
	client *paystack.Client
}

func NewSubscriptionHandler(client *paystack.Client) *SubscriptionHandler {
	return &SubscriptionHandler{client: client}
}

func (h *SubscriptionHandler) List(w http.ResponseWriter, r *http.Request) {
	var req ListRequest
	if r.Body != http.NoBody {
		json.NewDecoder(r.Body).Decode(&req)
	}

	if req.Count > 0 {
		result, err := h.client.Subscription.ListN(req.Count, req.Offset)
		if err != nil {
			WriteJSONError(w, err, http.StatusInternalServerError)
			return
		}
		WriteJSONSuccess(w, result)
		return
	}

	result, err := h.client.Subscription.List()
	if err != nil {
		WriteJSONError(w, fmt.Errorf("failed to list subscriptions: %w", err), http.StatusInternalServerError)
		return
	}
	WriteJSONSuccess(w, result)
}
