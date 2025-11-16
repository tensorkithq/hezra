package dto

import (
	"time"
)

// Response is the base response structure for all API responses
type Response struct {
	Status  bool        `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
	Error   string `json:"error,omitempty"`
}

// BalanceResponse represents a balance check response
type BalanceResponse struct {
	Balance  float64 `json:"balance"`
	Currency string  `json:"currency"`
}

// CustomerResponse represents a customer
type CustomerResponse struct {
	ID           int64     `json:"id"`
	Email        string    `json:"email"`
	FirstName    string    `json:"first_name,omitempty"`
	LastName     string    `json:"last_name,omitempty"`
	Phone        string    `json:"phone,omitempty"`
	CustomerCode string    `json:"customer_code"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// TransactionResponse represents a transaction
type TransactionResponse struct {
	ID              int64     `json:"id"`
	Reference       string    `json:"reference"`
	Amount          float64   `json:"amount"`
	Currency        string    `json:"currency"`
	Status          string    `json:"status"`
	Email           string    `json:"email"`
	AuthorizationURL string   `json:"authorization_url,omitempty"`
	AccessCode      string    `json:"access_code,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
}

// TransferResponse represents a transfer
type TransferResponse struct {
	ID            int64     `json:"id"`
	Amount        float64   `json:"amount"`
	Currency      string    `json:"currency"`
	Status        string    `json:"status"`
	Reference     string    `json:"reference"`
	Recipient     string    `json:"recipient"`
	TransferCode  string    `json:"transfer_code"`
	CreatedAt     time.Time `json:"created_at"`
}

// BankResponse represents a bank
type BankResponse struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	Code     string `json:"code"`
	Currency string `json:"currency"`
	Country  string `json:"country"`
}

// PlanResponse represents a subscription plan
type PlanResponse struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	PlanCode    string `json:"plan_code"`
	Amount      int64  `json:"amount"`
	Interval    string `json:"interval"`
	Currency    string `json:"currency"`
	Description string `json:"description,omitempty"`
}

// SubscriptionResponse represents a subscription
type SubscriptionResponse struct {
	ID                 int64     `json:"id"`
	SubscriptionCode   string    `json:"subscription_code"`
	EmailToken         string    `json:"email_token"`
	Amount             int64     `json:"amount"`
	Status             string    `json:"status"`
	NextPaymentDate    time.Time `json:"next_payment_date"`
	CreatedAt          time.Time `json:"created_at"`
}

// PaginatedResponse represents a paginated list response
type PaginatedResponse struct {
	Status  bool        `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
	Meta    MetaData    `json:"meta"`
}

// MetaData represents pagination metadata
type MetaData struct {
	Total     int `json:"total"`
	Page      int `json:"page"`
	PageCount int `json:"page_count"`
}
