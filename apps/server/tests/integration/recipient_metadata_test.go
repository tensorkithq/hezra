package integration

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"testing"
	"time"
)

// TestRecipientMetadataFlow tests recipient management with categorization metadata
func TestRecipientMetadataFlow(t *testing.T) {
	if os.Getenv("PAYSTACK_SECRET_KEY") == "" {
		t.Skip("PAYSTACK_SECRET_KEY not set, skipping integration test")
	}

	time.Sleep(1 * time.Second)

	// Test 1: Create recipient with contractor category
	t.Run("CreateContractorRecipient", func(t *testing.T) {
		payload := map[string]interface{}{
			"type":           "nuban",
			"name":           "John Contractor",
			"account_number": "0123456789",
			"bank_code":      "058",
			"description":    "Freelance designer",
			"metadata": map[string]interface{}{
				"category":     "contractor",
				"tags":         []string{"freelance", "design"},
				"relationship": "business",
				"notes":        "Monthly retainer payment",
			},
		}

		resp := makeRequest(t, "POST", "/recipients/create", payload)
		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		var result map[string]interface{}
		if err := json.Unmarshal(resp.Data, &result); err != nil {
			t.Fatalf("Failed to unmarshal recipient: %v", err)
		}

		if result["recipient_code"] == nil {
			t.Fatal("Expected recipient_code in response")
		}

		t.Logf("✓ Created contractor recipient with metadata: %s", result["recipient_code"])
	})

	// Test 2: Create recipient with family category
	t.Run("CreateFamilyRecipient", func(t *testing.T) {
		payload := map[string]interface{}{
			"type":           "nuban",
			"name":           "Jane Sibling",
			"account_number": "9876543210",
			"bank_code":      "033",
			"description":    "Sister",
			"metadata": map[string]interface{}{
				"category":     "family",
				"relationship": "sibling",
				"notes":        "Emergency fund transfers",
			},
		}

		resp := makeRequest(t, "POST", "/recipients/create", payload)
		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		t.Logf("✓ Created family recipient")
	})

	// Test 3: Create recipient with friend category
	t.Run("CreateFriendRecipient", func(t *testing.T) {
		payload := map[string]interface{}{
			"type":           "nuban",
			"name":           "Mike Friend",
			"account_number": "1122334455",
			"bank_code":      "058",
			"description":    "Colleague from university",
			"metadata": map[string]interface{}{
				"category":     "friend",
				"relationship": "colleague",
				"tags":         []string{"university", "tech"},
			},
		}

		resp := makeRequest(t, "POST", "/recipients/create", payload)
		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		t.Logf("✓ Created friend recipient")
	})

	// Test 4: List recipients and verify metadata is cached
	t.Run("ListRecipientsWithMetadata", func(t *testing.T) {
		req, err := http.NewRequest("GET", baseURL+"/recipients/list", nil)
		if err != nil {
			t.Fatalf("Failed to create request: %v", err)
		}

		client := &http.Client{Timeout: 10 * time.Second}
		httpResp, err := client.Do(req)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		defer httpResp.Body.Close()

		var resp Response
		if err := json.NewDecoder(httpResp.Body).Decode(&resp); err != nil {
			t.Fatalf("Failed to decode response: %v", err)
		}

		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		var recipients []map[string]interface{}
		if err := json.Unmarshal(resp.Data, &recipients); err != nil {
			t.Fatalf("Failed to unmarshal recipients: %v", err)
		}

		if len(recipients) == 0 {
			t.Fatal("Expected at least one recipient in the list")
		}

		// Verify that metadata exists in at least one recipient
		hasMetadata := false
		for _, recipient := range recipients {
			if recipient["metadata"] != nil {
				hasMetadata = true
				metadata := recipient["metadata"].(map[string]interface{})
				if category, ok := metadata["category"].(string); ok {
					t.Logf("✓ Found recipient with category: %s", category)
				}
			}
		}

		if !hasMetadata {
			t.Fatal("Expected at least one recipient with metadata")
		}

		t.Logf("✓ Listed %d recipients with metadata", len(recipients))
	})

	// Test 5: Create recipient without metadata (should still work)
	t.Run("CreateRecipientWithoutMetadata", func(t *testing.T) {
		payload := map[string]interface{}{
			"type":           "nuban",
			"name":           "Simple Recipient",
			"account_number": "5544332211",
			"bank_code":      "033",
		}

		resp := makeRequest(t, "POST", "/recipients/create", payload)
		if !resp.Status {
			t.Fatalf("Expected status true, got false. Error: %s", resp.Error)
		}

		t.Logf("✓ Created recipient without metadata")
	})
}

// TestRecipientCategories tests various recipient categorization scenarios
func TestRecipientCategories(t *testing.T) {
	if os.Getenv("PAYSTACK_SECRET_KEY") == "" {
		t.Skip("PAYSTACK_SECRET_KEY not set, skipping integration test")
	}

	testCases := []struct {
		name     string
		category string
		metadata map[string]interface{}
	}{
		{
			name:     "Vendor",
			category: "vendor",
			metadata: map[string]interface{}{
				"category":      "vendor",
				"company":       "Office Supplies Ltd",
				"relationship":  "business",
				"payment_terms": "NET30",
			},
		},
		{
			name:     "Employee",
			category: "employee",
			metadata: map[string]interface{}{
				"category":    "employee",
				"department":  "Engineering",
				"position":    "Senior Developer",
				"employee_id": "EMP001",
			},
		},
		{
			name:     "Supplier",
			category: "supplier",
			metadata: map[string]interface{}{
				"category": "supplier",
				"industry": "Manufacturing",
				"priority": "high",
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			payload := map[string]interface{}{
				"type":           "nuban",
				"name":           fmt.Sprintf("%s Test", tc.name),
				"account_number": "1234567890",
				"bank_code":      "058",
				"description":    fmt.Sprintf("Test %s recipient", tc.category),
				"metadata":       tc.metadata,
			}

			resp := makeRequest(t, "POST", "/recipients/create", payload)
			if !resp.Status {
				t.Fatalf("Expected status true for category %s, got false. Error: %s", tc.category, resp.Error)
			}

			var result map[string]interface{}
			if err := json.Unmarshal(resp.Data, &result); err != nil {
				t.Fatalf("Failed to unmarshal response: %v", err)
			}

			t.Logf("✓ Created %s recipient with category: %s", tc.name, tc.category)
		})
	}
}

// TestFlexibleMetadata tests that metadata accepts any valid JSON structure
func TestFlexibleMetadata(t *testing.T) {
	if os.Getenv("PAYSTACK_SECRET_KEY") == "" {
		t.Skip("PAYSTACK_SECRET_KEY not set, skipping integration test")
	}

	t.Run("ComplexMetadataStructure", func(t *testing.T) {
		payload := map[string]interface{}{
			"type":           "nuban",
			"name":           "Complex Metadata Recipient",
			"account_number": "1234567890",
			"bank_code":      "058",
			"metadata": map[string]interface{}{
				"custom_field_1": "value1",
				"custom_field_2": 123,
				"custom_field_3": true,
				"nested": map[string]interface{}{
					"key": "value",
				},
				"array": []string{"item1", "item2"},
			},
		}

		resp := makeRequest(t, "POST", "/recipients/create", payload)
		if !resp.Status {
			t.Fatalf("Expected status true for flexible metadata, got false. Error: %s", resp.Error)
		}

		t.Logf("✓ Metadata accepts flexible JSON structure")
	})
}
