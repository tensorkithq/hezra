package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"paystack.mpc.proxy/internal/config"
	"paystack.mpc.proxy/internal/database"
	"paystack.mpc.proxy/internal/server"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize database
	if err := database.Initialize(cfg.DatabasePath); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.Close()

	// Setup graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-sigChan
		log.Println("Shutting down gracefully...")
		database.Close()
		os.Exit(0)
	}()

	// Create and start server
	srv := server.New(cfg)
	if err := srv.Start(); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
