// Package handlers implements HTTP handlers for the moniewave financial management system.
//
// Customers Handler - Paystack Integration Layer
//
// OBJECTIVES:
// Manage customer profiles for payment collection.
//
// PURPOSE:
// - Create customer records in Paystack
// - List and retrieve customer information
// - Enable transaction association with customers
//
// KEY WORKFLOW:
// Create Customer → Store in Paystack → Use in Transactions → Track Payment History
//
// DESIGN DECISIONS:
// - All customer data stored in Paystack (no local cache)
// - Email is the primary identifier for customers
// - Optional fields (first_name, last_name, phone) for flexible customer profiles
// - Direct passthrough to Paystack SDK for consistency
package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"paystack.mpc.proxy/internal/paystack"

	paystackSDK "github.com/borderlesshq/paystack-go"
)

type CustomerHandler struct {
	client *paystack.Client
}

func NewCustomerHandler(client *paystack.Client) *CustomerHandler {
	return &CustomerHandler{client: client}
}

type CreateCustomerRequest struct {
	Email     string `json:"email"`
	FirstName string `json:"first_name,omitempty"`
	LastName  string `json:"last_name,omitempty"`
	Phone     string `json:"phone,omitempty"`
}

type ListRequest struct {
	Count  int `json:"count,omitempty"`
	Offset int `json:"offset,omitempty"`
}

func (h *CustomerHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateCustomerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteJSONBadRequest(w, "Invalid request body")
		return
	}

	if req.Email == "" {
		WriteJSONBadRequest(w, "email is required")
		return
	}

	customer := &paystackSDK.Customer{
		Email:     req.Email,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Phone:     req.Phone,
	}

	result, err := h.client.Customer.Create(customer)
	if err != nil {
		WriteJSONError(w, err, http.StatusInternalServerError)
		return
	}
	WriteJSONSuccess(w, result)
}

func (h *CustomerHandler) List(w http.ResponseWriter, r *http.Request) {
	var req ListRequest
	if r.Body != http.NoBody {
		json.NewDecoder(r.Body).Decode(&req)
	}

	if req.Count > 0 {
		result, err := h.client.Customer.ListN(req.Count, req.Offset)
		if err != nil {
			WriteJSONError(w, err, http.StatusInternalServerError)
			return
		}
		WriteJSONSuccess(w, result)
		return
	}

	result, err := h.client.Customer.List()
	if err != nil {
		WriteJSONError(w, fmt.Errorf("failed to list customers: %w", err), http.StatusInternalServerError)
		return
	}
	WriteJSONSuccess(w, result)
}
