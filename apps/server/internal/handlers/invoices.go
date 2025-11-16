// Package handlers implements HTTP handlers for the moniewave financial management system.
//
// Invoices Handler - Income Management
//
// OBJECTIVES:
// Users need to request payments from customers.
//
// PURPOSE:
// - Create and track payment requests
// - Store invoice metadata (customer, amount, status)
// - Verify invoice payments through Paystack
// - Maintain invoice history for accounting
//
// KEY WORKFLOW:
// Create Invoice → Generate Payment Request → Customer Pays →
// Verify Payment → Update Invoice Status → Record Transaction
//
// DESIGN DECISIONS:
// - Invoices store both local metadata and Paystack references
// - Status tracking enables invoice lifecycle management
// - Verification endpoint confirms payment completion
// - Line items support for detailed invoice breakdown
// - Local database cache for quick invoice lookups
package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"paystack.mpc.proxy/internal/database"
	"paystack.mpc.proxy/internal/paystack"

	"github.com/go-chi/chi/v5"
)

type InvoiceHandler struct {
	client *paystack.Client
}

func NewInvoiceHandler(client *paystack.Client) *InvoiceHandler {
	return &InvoiceHandler{client: client}
}

type CreateInvoiceRequest struct {
	Customer         string                `json:"customer"`
	Amount           int                   `json:"amount"`
	Description      string                `json:"description,omitempty"`
	LineItems        []paystack.LineItem   `json:"line_items,omitempty"`
	DueDate          string                `json:"due_date,omitempty"`
	SendNotification bool                  `json:"send_notification,omitempty"`
	Draft            bool                  `json:"draft,omitempty"`
	HasInvoice       bool                  `json:"has_invoice,omitempty"`
	InvoiceNumber    int                   `json:"invoice_number,omitempty"`
	Currency         string                `json:"currency,omitempty"`
}

type ListInvoicesRequest struct {
	CustomerID string `json:"customer_id"`
	Status     string `json:"status,omitempty"`
	From       string `json:"from,omitempty"`
	To         string `json:"to,omitempty"`
	Count      int    `json:"count,omitempty"`
	Offset     int    `json:"offset,omitempty"`
}

type Invoice struct {
	ID           int       `json:"id"`
	InvoiceCode  string    `json:"invoice_code"`
	CustomerID   string    `json:"customer_id"`
	CustomerName string    `json:"customer_name"`
	Amount       int       `json:"amount"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Create creates a new invoice
func (h *InvoiceHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateInvoiceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteJSONBadRequest(w, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Customer == "" {
		WriteJSONBadRequest(w, "customer is required")
		return
	}

	if req.Amount <= 0 {
		WriteJSONBadRequest(w, "amount must be greater than 0")
		return
	}

	// Verify customer exists in Paystack
	customer, err := h.client.Customer.Get(req.Customer)
	if err != nil {
		WriteJSONError(w, fmt.Errorf("customer not found: %w", err), http.StatusBadRequest)
		return
	}

	// Extract customer name
	customerName := customer.FirstName
	if customer.LastName != "" {
		if customerName != "" {
			customerName += " " + customer.LastName
		} else {
			customerName = customer.LastName
		}
	}
	if customerName == "" {
		customerName = customer.Email
	}

	// Create payment request in Paystack
	paymentReq := &paystack.PaymentRequest{
		Customer:         req.Customer,
		Amount:           req.Amount,
		Description:      req.Description,
		LineItems:        req.LineItems,
		DueDate:          req.DueDate,
		SendNotification: req.SendNotification,
		Draft:            req.Draft,
		HasInvoice:       req.HasInvoice,
		InvoiceNumber:    req.InvoiceNumber,
		Currency:         req.Currency,
	}

	result, err := h.client.CreatePaymentRequest(paymentReq)
	if err != nil {
		WriteJSONError(w, fmt.Errorf("failed to create payment request: %w", err), http.StatusInternalServerError)
		return
	}

	// Extract response fields
	requestCode, _ := result["request_code"].(string)
	status, _ := result["status"].(string)

	// Insert into SQLite
	query := `
		INSERT INTO invoices (invoice_code, customer_id, customer_name, amount, status, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`
	now := time.Now()
	_, err = database.DB.Exec(query, requestCode, req.Customer, customerName, req.Amount, status, now, now)
	if err != nil {
		// Log the error but still return the Paystack response
		fmt.Printf("Warning: Failed to cache invoice in database: %v\n", err)
	}

	// Return full Paystack response
	WriteJSONSuccess(w, result)
}

// List lists invoices from SQLite cache
func (h *InvoiceHandler) List(w http.ResponseWriter, r *http.Request) {
	var req ListInvoicesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteJSONBadRequest(w, "Invalid request body")
		return
	}

	// Validate required field
	if req.CustomerID == "" {
		WriteJSONBadRequest(w, "customer_id is required")
		return
	}

	// Build query with filters
	query := `SELECT id, invoice_code, customer_id, customer_name, amount, status, created_at, updated_at FROM invoices WHERE customer_id = ?`
	args := []interface{}{req.CustomerID}

	// Add optional filters
	if req.Status != "" {
		query += " AND status = ?"
		args = append(args, req.Status)
	}

	if req.From != "" {
		query += " AND created_at >= ?"
		args = append(args, req.From)
	}

	if req.To != "" {
		query += " AND created_at <= ?"
		args = append(args, req.To)
	}

	// Add ordering
	query += " ORDER BY created_at DESC"

	// Add pagination
	if req.Count > 0 {
		query += " LIMIT ? OFFSET ?"
		args = append(args, req.Count, req.Offset)
	}

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		WriteJSONError(w, fmt.Errorf("failed to query invoices: %w", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	invoices := []Invoice{}
	for rows.Next() {
		var invoice Invoice
		err := rows.Scan(
			&invoice.ID,
			&invoice.InvoiceCode,
			&invoice.CustomerID,
			&invoice.CustomerName,
			&invoice.Amount,
			&invoice.Status,
			&invoice.CreatedAt,
			&invoice.UpdatedAt,
		)
		if err != nil {
			WriteJSONError(w, fmt.Errorf("failed to scan invoice: %w", err), http.StatusInternalServerError)
			return
		}
		invoices = append(invoices, invoice)
	}

	if err = rows.Err(); err != nil {
		WriteJSONError(w, fmt.Errorf("error iterating invoices: %w", err), http.StatusInternalServerError)
		return
	}

	WriteJSONSuccess(w, invoices)
}

// Get fetches a single invoice from Paystack
func (h *InvoiceHandler) Get(w http.ResponseWriter, r *http.Request) {
	idOrCode := chi.URLParam(r, "id_or_code")
	if idOrCode == "" {
		WriteJSONBadRequest(w, "id_or_code is required")
		return
	}

	result, err := h.client.GetPaymentRequest(idOrCode)
	if err != nil {
		WriteJSONError(w, fmt.Errorf("failed to get payment request: %w", err), http.StatusInternalServerError)
		return
	}

	WriteJSONSuccess(w, result)
}

// Verify verifies a payment request and updates local cache
func (h *InvoiceHandler) Verify(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")
	if code == "" {
		WriteJSONBadRequest(w, "code is required")
		return
	}

	result, err := h.client.VerifyPaymentRequest(code)
	if err != nil {
		WriteJSONError(w, fmt.Errorf("failed to verify payment request: %w", err), http.StatusInternalServerError)
		return
	}

	// Extract status from response
	status, _ := result["status"].(string)

	// Update local cache
	query := `UPDATE invoices SET status = ?, updated_at = ? WHERE invoice_code = ?`
	_, err = database.DB.Exec(query, status, time.Now(), code)
	if err != nil {
		// Log the error but still return the Paystack response
		fmt.Printf("Warning: Failed to update invoice status in database: %v\n", err)
	}

	WriteJSONSuccess(w, result)
}
