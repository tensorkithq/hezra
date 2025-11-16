package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds application configuration
type Config struct {
	PaystackSecretKey string
	ServerPort        string
	DatabasePath      string
}

// Load loads configuration from environment variables
// Automatically loads .env file if it exists
func Load() *Config {
	// Load .env file if it exists (silent fail if not found)
	// This allows the app to work in environments where .env doesn't exist
	// (e.g., production with real environment variables)
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	apiKey := os.Getenv("PAYSTACK_SECRET_KEY")
	if apiKey == "" {
		log.Fatal("PAYSTACK_SECRET_KEY environment variable is required")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}

	dbPath := os.Getenv("DATABASE_PATH")
	if dbPath == "" {
		dbPath = "./data/moniewave.db"
	}

	return &Config{
		PaystackSecretKey: apiKey,
		ServerPort:        port,
		DatabasePath:      dbPath,
	}
}
