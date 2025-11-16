// Package handlers implements HTTP handlers for the moniewave financial management system.
//
// Service Providers Handler - Payment Infrastructure
//
// OBJECTIVES:
// Users need a marketplace to discover and pay for services.
//
// PURPOSE:
// - List available service providers with pricing
// - Enable category-based discovery (technology, beauty, pets)
// - Provide transparent pricing before purchase
// - Simplify service payments through default recipient
//
// KEY WORKFLOW:
// Browse Providers → Filter by Category → View Services & Prices →
// Create Expense for Service → Payment to Default Recipient
//
// DESIGN DECISIONS:
// - All service providers share one recipient (RCP_serviceprovider) for simplified payment routing
// - Pricing is embedded in the service data (no separate pricing table)
// - Mock data allows system to function without external provider APIs
// - Categories enable quick filtering and discovery
// - Services include detailed pricing in kobo with nested Service struct
// - Search functionality filters by name and category
package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
)

// ServiceProviderHandler handles service provider requests
type ServiceProviderHandler struct{}

// NewServiceProviderHandler creates a new service provider handler
func NewServiceProviderHandler() *ServiceProviderHandler {
	return &ServiceProviderHandler{}
}

// Service represents a service with pricing
type Service struct {
	Name  string `json:"name"`
	Price int    `json:"price"` // Price in kobo
}

// ServiceProvider represents a service provider
type ServiceProvider struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Category    string    `json:"category"`
	Services    []Service `json:"services"`
	Description string    `json:"description"`
	Location    string    `json:"location"`
	Rating      float64   `json:"rating"`
	Contact     string    `json:"contact"`
	RecipientID string    `json:"recipient_id"` // Paystack recipient code
}

// ListServiceProvidersRequest represents the request to list service providers
type ListServiceProvidersRequest struct {
	Category string `json:"category,omitempty"`
	Search   string `json:"search,omitempty"`
	Limit    int    `json:"limit,omitempty"`
	Offset   int    `json:"offset,omitempty"`
}

// ServiceProvidersResponse represents the response for listing service providers
type ServiceProvidersResponse struct {
	Status  bool `json:"status"`
	Message string `json:"message"`
	Data    struct {
		Providers  []ServiceProvider `json:"providers"`
		TotalCount int               `json:"total_count"`
		Limit      int               `json:"limit"`
		Offset     int               `json:"offset"`
	} `json:"data"`
}

// mockServiceProviders returns mock service provider data
func mockServiceProviders() []ServiceProvider {
	// Default recipient for all service providers
	defaultRecipient := "RCP_serviceprovider"

	return []ServiceProvider{
		{
			ID:       1,
			Name:     "TechHub Electronics",
			Category: "technology",
			Services: []Service{
				{Name: "Professional Cameras", Price: 50000000},  // ₦500,000
				{Name: "Gaming Laptops", Price: 35000000},        // ₦350,000
				{Name: "Desktop Computers", Price: 25000000},     // ₦250,000
				{Name: "Graphics Cards (GPU)", Price: 15000000},  // ₦150,000
				{Name: "Networking Equipment", Price: 8000000},   // ₦80,000
				{Name: "Gaming Accessories", Price: 3500000},     // ₦35,000
			},
			Description: "Your one-stop shop for all technology and gaming equipment needs",
			Location:    "Victoria Island, Lagos",
			Rating:      4.8,
			Contact:     "+234 803 123 4567",
			RecipientID: defaultRecipient,
		},
		{
			ID:       2,
			Name:     "ProGear Solutions",
			Category: "technology",
			Services: []Service{
				{Name: "Professional Cameras", Price: 60000000},    // ₦600,000
				{Name: "Camera Lenses", Price: 25000000},           // ₦250,000
				{Name: "Lighting Equipment", Price: 15000000},      // ₦150,000
				{Name: "Video Production Gear", Price: 45000000},   // ₦450,000
				{Name: "Audio Equipment", Price: 20000000},         // ₦200,000
				{Name: "Studio Setup", Price: 100000000},           // ₦1,000,000
			},
			Description: "Professional photography and videography equipment supplier",
			Location:    "Lekki Phase 1, Lagos",
			Rating:      4.9,
			Contact:     "+234 806 234 5678",
			RecipientID: defaultRecipient,
		},
		{
			ID:       3,
			Name:     "GPU Masters",
			Category: "technology",
			Services: []Service{
				{Name: "RTX 4090 Graphics Card", Price: 200000000},        // ₦2,000,000
				{Name: "RTX 4080 Graphics Card", Price: 150000000},        // ₦1,500,000
				{Name: "Mining Rig Setup", Price: 300000000},              // ₦3,000,000
				{Name: "Workstation Build", Price: 250000000},             // ₦2,500,000
				{Name: "GPU Consulting", Price: 5000000},                  // ₦50,000
			},
			Description: "Specialized in high-performance graphics cards and computing solutions",
			Location:    "Computer Village, Ikeja",
			Rating:      4.6,
			Contact:     "+234 809 345 6789",
			RecipientID: defaultRecipient,
		},
		{
			ID:       4,
			Name:     "NetworkPro Systems",
			Category: "technology",
			Services: []Service{
				{Name: "Enterprise Router", Price: 50000000},              // ₦500,000
				{Name: "Network Switch (24-port)", Price: 30000000},       // ₦300,000
				{Name: "Cat6 Cabling (per meter)", Price: 100000},         // ₦1,000
				{Name: "Server Setup", Price: 100000000},                  // ₦1,000,000
				{Name: "Network Installation", Price: 20000000},           // ₦200,000
				{Name: "Network Audit", Price: 15000000},                  // ₦150,000
			},
			Description: "Enterprise networking solutions and equipment provider",
			Location:    "Ikoyi, Lagos",
			Rating:      4.7,
			Contact:     "+234 802 456 7890",
			RecipientID: defaultRecipient,
		},
		{
			ID:       5,
			Name:     "Glamour Beauty Spa",
			Category: "beauty",
			Services: []Service{
				{Name: "Classic Pedicure", Price: 1500000},                // ₦15,000
				{Name: "Luxury Manicure", Price: 2000000},                 // ₦20,000
				{Name: "Full Spa Session (2hrs)", Price: 5000000},         // ₦50,000
				{Name: "Facial Treatment", Price: 3500000},                // ₦35,000
				{Name: "Swedish Massage (1hr)", Price: 4000000},           // ₦40,000
				{Name: "Body Treatment Package", Price: 8000000},          // ₦80,000
			},
			Description: "Luxury spa and beauty services for relaxation and rejuvenation",
			Location:    "Banana Island, Lagos",
			Rating:      4.9,
			Contact:     "+234 805 567 8901",
			RecipientID: defaultRecipient,
		},
		{
			ID:       6,
			Name:     "Elegance Nail Studio",
			Category: "beauty",
			Services: []Service{
				{Name: "Classic Manicure", Price: 800000},                 // ₦8,000
				{Name: "Classic Pedicure", Price: 1000000},                // ₦10,000
				{Name: "Gel Nails", Price: 1500000},                       // ₦15,000
				{Name: "Nail Art (per nail)", Price: 200000},              // ₦2,000
				{Name: "Nail Extensions", Price: 2500000},                 // ₦25,000
				{Name: "Nail Care Treatment", Price: 1200000},             // ₦12,000
			},
			Description: "Professional nail care and artistry services",
			Location:    "Surulere, Lagos",
			Rating:      4.5,
			Contact:     "+234 807 678 9012",
			RecipientID: defaultRecipient,
		},
		{
			ID:       7,
			Name:     "Serenity Wellness Spa",
			Category: "beauty",
			Services: []Service{
				{Name: "Spa Day Package", Price: 7000000},                 // ₦70,000
				{Name: "Aromatherapy Session", Price: 4500000},            // ₦45,000
				{Name: "Hot Stone Massage", Price: 5500000},               // ₦55,000
				{Name: "Body Scrub", Price: 3000000},                      // ₦30,000
				{Name: "Sauna Access (1hr)", Price: 1500000},              // ₦15,000
				{Name: "Steam Bath", Price: 1200000},                      // ₦12,000
			},
			Description: "Holistic wellness and spa treatments for mind and body",
			Location:    "Victoria Island, Lagos",
			Rating:      4.8,
			Contact:     "+234 808 789 0123",
			RecipientID: defaultRecipient,
		},
		{
			ID:       8,
			Name:     "Paws & Whiskers Pet Store",
			Category: "pets",
			Services: []Service{
				{Name: "Premium Cat Food (5kg)", Price: 2500000},          // ₦25,000
				{Name: "Premium Dog Food (10kg)", Price: 3500000},         // ₦35,000
				{Name: "Pet Toys Assorted", Price: 500000},                // ₦5,000
				{Name: "Pet Grooming Session", Price: 1500000},            // ₦15,000
				{Name: "Pet Accessories Bundle", Price: 2000000},          // ₦20,000
				{Name: "Pet Supplies Package", Price: 4000000},            // ₦40,000
			},
			Description: "Complete pet care supplies and accessories for your furry friends",
			Location:    "Ajah, Lagos",
			Rating:      4.7,
			Contact:     "+234 801 890 1234",
			RecipientID: defaultRecipient,
		},
		{
			ID:       9,
			Name:     "Feline Care Veterinary Clinic",
			Category: "pets",
			Services: []Service{
				{Name: "Cat Health Checkup", Price: 1000000},              // ₦10,000
				{Name: "Vaccination (per shot)", Price: 500000},           // ₦5,000
				{Name: "Minor Surgery", Price: 5000000},                   // ₦50,000
				{Name: "Dental Cleaning", Price: 2500000},                 // ₦25,000
				{Name: "Emergency Care", Price: 10000000},                 // ₦100,000
				{Name: "Consultation", Price: 500000},                     // ₦5,000
			},
			Description: "Specialized veterinary services for cats with experienced vets",
			Location:    "Yaba, Lagos",
			Rating:      4.9,
			Contact:     "+234 804 901 2345",
			RecipientID: defaultRecipient,
		},
		{
			ID:       10,
			Name:     "Premium Pet Supplies",
			Category: "pets",
			Services: []Service{
				{Name: "Organic Cat Food (3kg)", Price: 3000000},          // ₦30,000
				{Name: "Cat Litter (10L)", Price: 800000},                 // ₦8,000
				{Name: "Premium Scratching Post", Price: 1500000},         // ₦15,000
				{Name: "Cat Bed Deluxe", Price: 2500000},                  // ₦25,000
				{Name: "Cat Carrier", Price: 2000000},                     // ₦20,000
				{Name: "Cat Care Bundle", Price: 6000000},                 // ₦60,000
			},
			Description: "Premium quality cat supplies and food for discerning pet owners",
			Location:    "Lekki Phase 2, Lagos",
			Rating:      4.6,
			Contact:     "+234 810 012 3456",
			RecipientID: defaultRecipient,
		},
		{
			ID:       11,
			Name:     "PetMed Veterinary Hospital",
			Category: "pets",
			Services: []Service{
				{Name: "Comprehensive Pet Checkup", Price: 1500000},       // ₦15,000
				{Name: "Major Surgery", Price: 15000000},                  // ₦150,000
				{Name: "Diagnostic X-Ray", Price: 3000000},                // ₦30,000
				{Name: "Lab Tests", Price: 2000000},                       // ₦20,000
				{Name: "Pet Boarding (per day)", Price: 500000},           // ₦5,000
				{Name: "Professional Grooming", Price: 2000000},           // ₦20,000
			},
			Description: "Full-service veterinary hospital with modern facilities",
			Location:    "Ikeja GRA, Lagos",
			Rating:      4.8,
			Contact:     "+234 813 123 4567",
			RecipientID: defaultRecipient,
		},
		{
			ID:       12,
			Name:     "Digital Solutions Hub",
			Category: "technology",
			Services: []Service{
				{Name: "Business Laptop", Price: 20000000},                // ₦200,000
				{Name: "Desktop Computer", Price: 15000000},               // ₦150,000
				{Name: "Tablet Device", Price: 12000000},                  // ₦120,000
				{Name: "Computer Repair", Price: 2500000},                 // ₦25,000
				{Name: "Software Installation", Price: 1500000},           // ₦15,000
				{Name: "IT Support (monthly)", Price: 5000000},            // ₦50,000
			},
			Description: "Comprehensive computer sales and IT support services",
			Location:    "Maryland, Lagos",
			Rating:      4.5,
			Contact:     "+234 816 234 5678",
			RecipientID: defaultRecipient,
		},
		{
			ID:       13,
			Name:     "Royal Beauty Palace",
			Category: "beauty",
			Services: []Service{
				{Name: "Pedicure & Manicure Combo", Price: 1500000},       // ₦15,000
				{Name: "Brazilian Waxing", Price: 2000000},                // ₦20,000
				{Name: "Professional Makeup", Price: 3500000},             // ₦35,000
				{Name: "Hairstyling", Price: 2500000},                     // ₦25,000
				{Name: "Bridal Makeup Package", Price: 15000000},          // ₦150,000
				{Name: "Bridal Complete Package", Price: 30000000},        // ₦300,000
			},
			Description: "Complete beauty salon services for all occasions",
			Location:    "Gbagada, Lagos",
			Rating:      4.6,
			Contact:     "+234 819 345 6789",
			RecipientID: defaultRecipient,
		},
		{
			ID:       14,
			Name:     "Gaming Gear Paradise",
			Category: "technology",
			Services: []Service{
				{Name: "Mechanical Gaming Keyboard", Price: 4500000},      // ₦45,000
				{Name: "Gaming Mouse (RGB)", Price: 3000000},              // ₦30,000
				{Name: "Gaming Headset", Price: 3500000},                  // ₦35,000
				{Name: "Gaming Chair", Price: 15000000},                   // ₦150,000
				{Name: "Gaming Monitor (27\" 144Hz)", Price: 25000000},    // ₦250,000
				{Name: "Complete Gaming Setup", Price: 50000000},          // ₦500,000
			},
			Description: "Everything you need for the ultimate gaming setup",
			Location:    "Computer Village, Ikeja",
			Rating:      4.7,
			Contact:     "+234 822 456 7890",
			RecipientID: defaultRecipient,
		},
		{
			ID:       15,
			Name:     "Whiskers & Paws Vet Clinic",
			Category: "pets",
			Services: []Service{
				{Name: "Pet Wellness Exam", Price: 1200000},               // ₦12,000
				{Name: "Spay/Neuter Surgery", Price: 8000000},             // ₦80,000
				{Name: "Microchipping", Price: 1500000},                   // ₦15,000
				{Name: "Deworming", Price: 300000},                        // ₦3,000
				{Name: "Pet Nutrition Counseling", Price: 800000},         // ₦8,000
				{Name: "Behavioral Consultation", Price: 1500000},         // ₦15,000
			},
			Description: "Compassionate veterinary care for all your pets",
			Location:    "Magodo, Lagos",
			Rating:      4.8,
			Contact:     "+234 825 567 8901",
			RecipientID: defaultRecipient,
		},
	}
}

// List returns a list of service providers with optional filters
func (h *ServiceProviderHandler) List(w http.ResponseWriter, r *http.Request) {
	var req ListServiceProvidersRequest

	// Try to parse JSON body for POST, or query params for GET
	if r.Method == http.MethodPost && r.Body != nil {
		json.NewDecoder(r.Body).Decode(&req)
	} else {
		// Parse query parameters for GET request
		query := r.URL.Query()
		req.Category = query.Get("category")
		req.Search = query.Get("search")
	}

	// Get all mock providers
	allProviders := mockServiceProviders()

	// Apply filters
	var filteredProviders []ServiceProvider

	for _, provider := range allProviders {
		// Category filter
		if req.Category != "" && strings.ToLower(provider.Category) != strings.ToLower(req.Category) {
			continue
		}

		// Search filter (search in name, description, and services)
		if req.Search != "" {
			searchLower := strings.ToLower(req.Search)
			found := false

			// Search in name
			if strings.Contains(strings.ToLower(provider.Name), searchLower) {
				found = true
			}

			// Search in description
			if !found && strings.Contains(strings.ToLower(provider.Description), searchLower) {
				found = true
			}

			// Search in services
			if !found {
				for _, service := range provider.Services {
					if strings.Contains(strings.ToLower(service.Name), searchLower) {
						found = true
						break
					}
				}
			}

			if !found {
				continue
			}
		}

		filteredProviders = append(filteredProviders, provider)
	}

	// Get total count before pagination
	totalCount := len(filteredProviders)

	// Apply pagination
	limit := req.Limit
	if limit <= 0 {
		limit = 20
	}

	offset := req.Offset
	if offset < 0 {
		offset = 0
	}

	// Calculate pagination bounds
	start := offset
	if start > len(filteredProviders) {
		start = len(filteredProviders)
	}

	end := start + limit
	if end > len(filteredProviders) {
		end = len(filteredProviders)
	}

	// Get paginated results
	paginatedProviders := []ServiceProvider{}
	if start < len(filteredProviders) {
		paginatedProviders = filteredProviders[start:end]
	}

	// Build response
	var response ServiceProvidersResponse
	response.Status = true
	response.Message = "Service providers retrieved successfully"
	response.Data.Providers = paginatedProviders
	response.Data.TotalCount = totalCount
	response.Data.Limit = limit
	response.Data.Offset = offset

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
