package integration

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"testing"
	"time"
)

const (
	baseURL = "http://localhost:4000/api/v1"
)

// Response represents the standard API response
type Response struct {
	Status  bool            `json:"status"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data"`
	Error   string          `json:"error,omitempty"`
}

// Customer represents a Paystack customer
type Customer struct {
	ID           int    `json:"id"`
	Email        string `json:"email"`
	FirstName    string `json:"first_name"`
	LastName     string `json:"last_name"`
	CustomerCode string `json:"customer_code"`
}

// Invoice represents an invoice record
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

// PaymentRequest represents a Paystack payment request
type PaymentRequest struct {
	ID               int                    `json:"id"`
	RequestCode      string                 `json:"request_code"`
	Amount           int                    `json:"amount"`
	Status           string                 `json:"status"`
	Description      string                 `json:"description"`
	Customer         interface{}            `json:"customer"`
	OfflineReference string                 `json:"offline_reference"`
	CreatedAt        string                 `json:"created_at"`
}

// makeRequest is a helper function to make HTTP requests
func makeRequest(t *testing.T, method, endpoint string, body interface{}) *Response {
	var bodyReader io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("Failed to marshal request body: %v", err)
		}
		bodyReader = bytes.NewBuffer(jsonBody)
	}

	req, err := http.NewRequest(method, baseURL+endpoint, bodyReader)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	defer resp.Body.Close()

	var response Response
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	return &response
}

// TestInvoiceIntegrationFlow tests the complete invoice workflow
func TestInvoiceIntegrationFlow(t *testing.T) {
	// Skip if PAYSTACK_SECRET_KEY is not set
	if os.Getenv("PAYSTACK_SECRET_KEY") == "" {
		t.Skip("PAYSTACK_SECRET_KEY not set, skipping integration test")
	}

	// Wait for server to be ready
	time.Sleep(1 * time.Second)

	// Generate unique email for this test run
	testEmail := fmt.Sprintf("test-invoice-%d@example.com", time.Now().Unix())

	// Shared test data
	var customerCode string
	var invoiceCode string

	t.Run("Step1_CreateCustomer", func(t *testing.T) {
		reqBody := map[string]string{
			"email":      testEmail,
			"first_name": "Integration",
			"last_name":  "Test",
			"phone":      "+2348012345678",
		}

		resp := makeRequest(t, "POST", "/customers/create", reqBody)

		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		var customer Customer
		if err := json.Unmarshal(resp.Data, &customer); err != nil {
			t.Fatalf("Failed to unmarshal customer: %v", err)
		}

		if customer.CustomerCode == "" {
			t.Fatal("Customer code is empty")
		}

		if customer.Email != testEmail {
			t.Fatalf("Expected email %s, got %s", testEmail, customer.Email)
		}

		t.Logf("✓ Customer created: %s", customer.CustomerCode)

		// Store customer code for next steps
		customerCode = customer.CustomerCode
	})

	t.Run("Step2_CreateInvoice", func(t *testing.T) {
		if customerCode == "" {
			t.Fatal("Customer code not found from previous step")
		}

		reqBody := map[string]interface{}{
			"customer":    customerCode,
			"amount":      500000, // ₦5,000.00
			"description": "Integration Test Invoice",
			"due_date":    "2025-12-31",
		}

		resp := makeRequest(t, "POST", "/invoices/create", reqBody)

		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		var paymentReq PaymentRequest
		if err := json.Unmarshal(resp.Data, &paymentReq); err != nil {
			t.Fatalf("Failed to unmarshal payment request: %v", err)
		}

		if paymentReq.RequestCode == "" {
			t.Fatal("Request code is empty")
		}

		if paymentReq.Amount != 500000 {
			t.Fatalf("Expected amount 500000, got %d", paymentReq.Amount)
		}

		if paymentReq.Status != "pending" {
			t.Fatalf("Expected status pending, got %s", paymentReq.Status)
		}

		if paymentReq.OfflineReference == "" {
			t.Fatal("Offline reference is empty")
		}

		t.Logf("✓ Invoice created: %s (offline ref: %s)", paymentReq.RequestCode, paymentReq.OfflineReference)

		// Store for next steps
		invoiceCode = paymentReq.RequestCode
	})

	t.Run("Step3_ListInvoices", func(t *testing.T) {
		if customerCode == "" {
			t.Fatal("Customer code not found")
		}

		reqBody := map[string]string{
			"customer_id": customerCode,
		}

		resp := makeRequest(t, "POST", "/invoices/list", reqBody)

		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		var invoices []Invoice
		if err := json.Unmarshal(resp.Data, &invoices); err != nil {
			t.Fatalf("Failed to unmarshal invoices: %v", err)
		}

		if len(invoices) == 0 {
			t.Fatal("Expected at least 1 invoice, got 0")
		}

		invoice := invoices[0]
		if invoice.CustomerID != customerCode {
			t.Fatalf("Expected customer_id %s, got %s", customerCode, invoice.CustomerID)
		}

		if invoice.Amount != 500000 {
			t.Fatalf("Expected amount 500000, got %d", invoice.Amount)
		}

		if invoice.Status != "pending" {
			t.Fatalf("Expected status pending, got %s", invoice.Status)
		}

		if invoice.CustomerName != "Integration Test" {
			t.Fatalf("Expected customer_name 'Integration Test', got '%s'", invoice.CustomerName)
		}

		t.Logf("✓ List returned %d invoice(s) from SQLite cache", len(invoices))
	})

	t.Run("Step4_GetInvoiceDetails", func(t *testing.T) {
		if invoiceCode == "" {
			t.Fatal("Invoice code not found")
		}

		resp := makeRequest(t, "POST", fmt.Sprintf("/invoices/get/%s", invoiceCode), nil)

		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		var paymentReq PaymentRequest
		if err := json.Unmarshal(resp.Data, &paymentReq); err != nil {
			t.Fatalf("Failed to unmarshal payment request: %v", err)
		}

		if paymentReq.RequestCode != invoiceCode {
			t.Fatalf("Expected request_code %s, got %s", invoiceCode, paymentReq.RequestCode)
		}

		if paymentReq.OfflineReference == "" {
			t.Fatal("Offline reference is empty in full details")
		}

		t.Logf("✓ Get returned full invoice details from Paystack")
	})

	t.Run("Step5_VerifyInvoice", func(t *testing.T) {
		if invoiceCode == "" {
			t.Fatal("Invoice code not found")
		}

		resp := makeRequest(t, "POST", fmt.Sprintf("/invoices/verify/%s", invoiceCode), nil)

		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		var paymentReq PaymentRequest
		if err := json.Unmarshal(resp.Data, &paymentReq); err != nil {
			t.Fatalf("Failed to unmarshal verification response: %v", err)
		}

		if paymentReq.Status == "" {
			t.Fatal("Status is empty in verification response")
		}

		t.Logf("✓ Verify returned status: %s", paymentReq.Status)
	})

	t.Run("Step6_VerifyStatusUpdatedInCache", func(t *testing.T) {
		if customerCode == "" {
			t.Fatal("Customer code not found")
		}

		reqBody := map[string]string{
			"customer_id": customerCode,
		}

		resp := makeRequest(t, "POST", "/invoices/list", reqBody)

		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		var invoices []Invoice
		if err := json.Unmarshal(resp.Data, &invoices); err != nil {
			t.Fatalf("Failed to unmarshal invoices: %v", err)
		}

		if len(invoices) == 0 {
			t.Fatal("Expected at least 1 invoice")
		}

		// Status should still be pending (or updated if payment was made)
		invoice := invoices[0]
		if invoice.Status == "" {
			t.Fatal("Status is empty in cached invoice")
		}

		t.Logf("✓ Cache updated successfully. Current status: %s", invoice.Status)
	})

	t.Log("\n✅ All invoice integration tests passed!")
}

// TestInvoiceListWithFilters tests list operation with various filters
func TestInvoiceListWithFilters(t *testing.T) {
	if os.Getenv("PAYSTACK_SECRET_KEY") == "" {
		t.Skip("PAYSTACK_SECRET_KEY not set, skipping integration test")
	}

	// Create a test customer for this test
	testEmail := fmt.Sprintf("test-filters-%d@example.com", time.Now().Unix())
	reqBody := map[string]string{
		"email":      testEmail,
		"first_name": "Filter",
		"last_name":  "Test",
	}

	resp := makeRequest(t, "POST", "/customers/create", reqBody)
	if !resp.Status {
		t.Fatalf("Failed to create customer: %s", resp.Error)
	}

	var customer Customer
	if err := json.Unmarshal(resp.Data, &customer); err != nil {
		t.Fatalf("Failed to unmarshal customer: %v", err)
	}

	customerCode := customer.CustomerCode

	t.Run("FilterByStatus", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"customer_id": customerCode,
			"status":      "pending",
		}

		resp := makeRequest(t, "POST", "/invoices/list", reqBody)

		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		var invoices []Invoice
		if err := json.Unmarshal(resp.Data, &invoices); err != nil {
			t.Fatalf("Failed to unmarshal invoices: %v", err)
		}

		for _, inv := range invoices {
			if inv.Status != "pending" {
				t.Fatalf("Expected all invoices to have status 'pending', found '%s'", inv.Status)
			}
		}

		t.Logf("✓ Status filter working. Found %d pending invoice(s)", len(invoices))
	})

	t.Run("WithPagination", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"customer_id": customerCode,
			"count":       10,
			"offset":      0,
		}

		resp := makeRequest(t, "POST", "/invoices/list", reqBody)

		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		var invoices []Invoice
		if err := json.Unmarshal(resp.Data, &invoices); err != nil {
			t.Fatalf("Failed to unmarshal invoices: %v", err)
		}

		if len(invoices) > 10 {
			t.Fatalf("Expected max 10 invoices, got %d", len(invoices))
		}

		t.Logf("✓ Pagination working. Returned %d invoice(s)", len(invoices))
	})
}

// TestInvoiceValidation tests validation errors
func TestInvoiceValidation(t *testing.T) {
	if os.Getenv("PAYSTACK_SECRET_KEY") == "" {
		t.Skip("PAYSTACK_SECRET_KEY not set, skipping integration test")
	}

	t.Run("CreateInvoice_MissingCustomer", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"amount":      500000,
			"description": "Missing customer test",
		}

		resp := makeRequest(t, "POST", "/invoices/create", reqBody)

		if resp.Status {
			t.Fatal("Expected status false for missing customer, got true")
		}

		if resp.Error == "" {
			t.Fatal("Expected error message for missing customer")
		}

		t.Logf("✓ Validation works: %s", resp.Error)
	})

	t.Run("CreateInvoice_InvalidAmount", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"customer":    "CUS_test",
			"amount":      0,
			"description": "Invalid amount test",
		}

		resp := makeRequest(t, "POST", "/invoices/create", reqBody)

		if resp.Status {
			t.Fatal("Expected status false for invalid amount, got true")
		}

		t.Logf("✓ Amount validation works: %s", resp.Error)
	})

	t.Run("ListInvoices_MissingCustomerID", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"status": "pending",
		}

		resp := makeRequest(t, "POST", "/invoices/list", reqBody)

		if resp.Status {
			t.Fatal("Expected status false for missing customer_id, got true")
		}

		t.Logf("✓ Customer ID validation works: %s", resp.Error)
	})
}
