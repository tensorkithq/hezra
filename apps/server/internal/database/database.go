package database

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

// DB is the global database instance
var DB *sql.DB

// Initialize initializes the database connection and runs migrations
func Initialize(dbPath string) error {
	// Ensure the directory exists
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	// Open database connection
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return err
	}

	// Test connection
	if err := db.Ping(); err != nil {
		return err
	}

	DB = db
	log.Printf("Database initialized at: %s", dbPath)

	// Run migrations
	if err := runMigrations(); err != nil {
		return err
	}

	return nil
}

// Close closes the database connection
func Close() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}
