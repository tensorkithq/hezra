package server

import (
	"log"
	"net/http"
	"time"

	"paystack.mpc.proxy/internal/config"
	"paystack.mpc.proxy/internal/handlers"
	"paystack.mpc.proxy/internal/paystack"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

// Server wraps the HTTP server
type Server struct {
	router *chi.Mux
	config *config.Config
}

// New creates a new HTTP server instance with Chi router
func New(cfg *config.Config) *Server {
	// Create Paystack client
	client := paystack.NewClient(cfg.PaystackSecretKey)

	// Create Chi router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	// CORS configuration
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// Initialize handlers
	coreHandler := handlers.NewCoreHandler(client)
	customerHandler := handlers.NewCustomerHandler(client)
	transactionHandler := handlers.NewTransactionHandler(client)
	transferHandler := handlers.NewTransferHandler(client)
	planHandler := handlers.NewPlanHandler(client)
	subscriptionHandler := handlers.NewSubscriptionHandler(client)
	bankHandler := handlers.NewBankHandler(client)
	subAccountHandler := handlers.NewSubAccountHandler(client)
	invoiceHandler := handlers.NewInvoiceHandler(client)
	verdictHandler := handlers.NewVerdictHandler()
	recipientHandler := handlers.NewRecipientHandler(client)
	expenseHandler := handlers.NewExpenseHandler()
	budgetHandler := handlers.NewBudgetHandler()
	goalHandler := handlers.NewGoalHandler()
	serviceProviderHandler := handlers.NewServiceProviderHandler()

	// Routes
	r.Route("/api/v1", func(r chi.Router) {
		// Core routes
		r.Post("/balance", coreHandler.CheckBalance)

		// Customer routes
		r.Post("/customers/create", customerHandler.Create)
		r.Post("/customers/list", customerHandler.List)

		// Transaction routes
		r.Post("/transactions/initialize", transactionHandler.Initialize)
		r.Post("/transactions/verify", transactionHandler.Verify)
		r.Post("/transactions/list", transactionHandler.List)

		// Transfer routes
		r.Post("/transfers/recipient/create", transferHandler.CreateRecipient)
		r.Post("/transfers/initiate", transferHandler.Initiate)

		// Plan routes
		r.Post("/plans/list", planHandler.List)

		// Subscription routes
		r.Post("/subscriptions/list", subscriptionHandler.List)

		// Bank routes
		r.Post("/banks/list", bankHandler.List)
		r.Post("/banks/resolve", bankHandler.ResolveAccount)

		// SubAccount routes
		r.Post("/subaccounts/list", subAccountHandler.List)

		// Invoice routes
		r.Post("/invoices/create", invoiceHandler.Create)
		r.Post("/invoices/list", invoiceHandler.List)
		r.Post("/invoices/get/{id_or_code}", invoiceHandler.Get)
		r.Post("/invoices/verify/{code}", invoiceHandler.Verify)

		// Verdict routes (credit check / affordability)
		r.Post("/verdict/check", verdictHandler.CheckAffordability)
		r.Get("/verdict/profile", verdictHandler.GetFinancialProfile)
		r.Get("/verdict/profiles", verdictHandler.ListProfiles)

		// Recipient routes (transfer recipients)
		r.Post("/recipients/create", recipientHandler.Create)
		r.Get("/recipients/list", recipientHandler.List)
		r.Get("/recipients/get", recipientHandler.Get)

		// Expense routes
		r.Post("/expenses/create", expenseHandler.Create)
		r.Post("/expenses/list", expenseHandler.List)
		r.Get("/expenses/get/{id}", expenseHandler.Get)
		r.Put("/expenses/update/{id}", expenseHandler.Update)

		// Budget routes
		r.Post("/budgets/create", budgetHandler.Create)
		r.Post("/budgets/list", budgetHandler.List)
		r.Get("/budgets/{id}", budgetHandler.Get)
		r.Put("/budgets/{id}", budgetHandler.Update)
		r.Get("/budgets/{id}/check/{amount}", budgetHandler.CheckLimit)
		r.Get("/budgets/active", budgetHandler.GetActiveBudgets)

		// Goal routes
		r.Post("/goals/create", goalHandler.Create)
		r.Post("/goals/list", goalHandler.List)
		r.Get("/goals/{id}", goalHandler.Get)
		r.Put("/goals/{id}", goalHandler.Update)
		r.Delete("/goals/{id}", goalHandler.Delete)

		// Service Provider routes
		r.Get("/service_providers", serviceProviderHandler.List)
	})

	// Health check endpoint
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	return &Server{
		router: r,
		config: cfg,
	}
}

// ServeHTTP makes Server compatible with http.Handler
func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.router.ServeHTTP(w, r)
}

// Start starts the HTTP server
func (s *Server) Start() error {
	addr := ":" + s.config.ServerPort
	log.Printf("Starting Paystack HTTP Server on %s", addr)
	return http.ListenAndServe(addr, s.router)
}
