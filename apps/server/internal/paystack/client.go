package paystack

import (
	"fmt"
	"time"

	"github.com/borderlesshq/paystack-go"
)

// Client wraps the Paystack SDK client
type Client struct {
	*paystack.Client
}

// NewClient creates a new Paystack client
func NewClient(apiKey string) *Client {
	return &Client{
		Client: paystack.NewClient(apiKey, nil),
	}
}

// SafeCheckBalance wraps CheckBalance with proper error handling
func (c *Client) SafeCheckBalance() (paystack.Response, error) {
	// Recover from SDK panic
	defer func() {
		if r := recover(); r != nil {
			// Return empty response on panic
		}
	}()

	resp := paystack.Response{}
	err := c.Call("GET", "balance", nil, &resp)
	if err != nil {
		return nil, err
	}

	// Safely extract balance data
	data, ok := resp["data"]
	if !ok {
		return nil, fmt.Errorf("invalid response: missing 'data' field")
	}

	// Handle both array and object responses
	switch v := data.(type) {
	case []interface{}:
		if len(v) > 0 {
			if balance, ok := v[0].(map[string]interface{}); ok {
				return balance, nil
			}
		}
		return nil, fmt.Errorf("invalid response: empty or malformed data array")
	case map[string]interface{}:
		return v, nil
	default:
		return nil, fmt.Errorf("invalid response: unexpected data type")
	}
}

// PaymentRequest represents a Paystack payment request (invoice)
type PaymentRequest struct {
	Customer        string      `json:"customer"`
	Amount          int         `json:"amount"`
	Description     string      `json:"description,omitempty"`
	LineItems       []LineItem  `json:"line_items,omitempty"`
	DueDate         string      `json:"due_date,omitempty"`
	SendNotification bool       `json:"send_notification,omitempty"`
	Draft           bool        `json:"draft,omitempty"`
	HasInvoice      bool        `json:"has_invoice,omitempty"`
	InvoiceNumber   int         `json:"invoice_number,omitempty"`
	Currency        string      `json:"currency,omitempty"`
}

// LineItem represents a line item in an invoice
type LineItem struct {
	Name     string `json:"name"`
	Amount   int    `json:"amount"`
	Quantity int    `json:"quantity"`
}

// PaymentRequestResponse represents the response from payment request operations
type PaymentRequestResponse struct {
	ID               int                    `json:"id"`
	RequestCode      string                 `json:"request_code"`
	Amount           int                    `json:"amount"`
	Status           string                 `json:"status"`
	Description      string                 `json:"description"`
	Customer         map[string]interface{} `json:"customer"`
	OfflineReference string                 `json:"offline_reference"`
	CreatedAt        time.Time              `json:"created_at"`
}

// CreatePaymentRequest creates a new payment request (invoice)
func (c *Client) CreatePaymentRequest(req *PaymentRequest) (paystack.Response, error) {
	resp := paystack.Response{}
	err := c.Call("POST", "paymentrequest", req, &resp)
	if err != nil {
		return nil, fmt.Errorf("API call failed: %w", err)
	}

	// The SDK Call method already unwraps the response and returns just the data field
	return resp, nil
}

// GetPaymentRequest fetches a payment request by ID or code
func (c *Client) GetPaymentRequest(idOrCode string) (paystack.Response, error) {
	resp := paystack.Response{}
	err := c.Call("GET", fmt.Sprintf("paymentrequest/%s", idOrCode), nil, &resp)
	if err != nil {
		return nil, err
	}

	// The SDK Call method already unwraps the response and returns just the data field
	return resp, nil
}

// VerifyPaymentRequest verifies a payment request by code
func (c *Client) VerifyPaymentRequest(code string) (paystack.Response, error) {
	resp := paystack.Response{}
	err := c.Call("GET", fmt.Sprintf("paymentrequest/verify/%s", code), nil, &resp)
	if err != nil {
		return nil, err
	}

	// The SDK Call method already unwraps the response and returns just the data field
	return resp, nil
}
