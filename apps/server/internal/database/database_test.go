package database

import (
	"database/sql"
	"os"
	"testing"
)

func TestInitialize(t *testing.T) {
	// Create a temporary database file
	dbPath := "./test_moniewave.db"
	defer os.Remove(dbPath)

	// Initialize database
	err := Initialize(dbPath)
	if err != nil {
		t.Fatalf("Failed to initialize database: %v", err)
	}
	defer Close()

	// Verify users table exists
	var tableName string
	err = DB.QueryRow("SELECT name FROM sqlite_master WHERE type='table' AND name='users';").Scan(&tableName)
	if err != nil {
		t.Fatalf("Users table not found: %v", err)
	}

	if tableName != "users" {
		t.Fatalf("Expected table name 'users', got '%s'", tableName)
	}

	// Verify default user exists
	var username, password, fullName string
	err = DB.QueryRow("SELECT username, password, full_name FROM users WHERE username = 'president';").
		Scan(&username, &password, &fullName)

	if err == sql.ErrNoRows {
		t.Fatal("Default user 'president' not found")
	} else if err != nil {
		t.Fatalf("Error querying default user: %v", err)
	}

	// Verify user data
	if username != "president" {
		t.Errorf("Expected username 'president', got '%s'", username)
	}
	if password != "20201103" {
		t.Errorf("Expected password '20201103', got '%s'", password)
	}
	if fullName != "Presi Dent" {
		t.Errorf("Expected full name 'Presi Dent', got '%s'", fullName)
	}

	t.Log("Database initialization and migration test passed successfully")
}
