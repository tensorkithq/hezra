package database

import (
	"log"
)

// runMigrations runs all database migrations
func runMigrations() error {
	// Create users table
	createUsersTable := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT NOT NULL UNIQUE,
		password TEXT NOT NULL,
		full_name TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	if _, err := DB.Exec(createUsersTable); err != nil {
		return err
	}

	log.Println("Users table created successfully")

	// Insert default user if not exists
	insertDefaultUser := `
	INSERT OR IGNORE INTO users (username, password, full_name)
	VALUES ('president', '20201103', 'Presi Dent');`

	if _, err := DB.Exec(insertDefaultUser); err != nil {
		return err
	}

	log.Println("Default user migration completed")

	// Create invoices table
	createInvoicesTable := `
	CREATE TABLE IF NOT EXISTS invoices (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		invoice_code TEXT NOT NULL UNIQUE,
		customer_id TEXT NOT NULL,
		customer_name TEXT NOT NULL,
		amount INTEGER NOT NULL,
		status TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	if _, err := DB.Exec(createInvoicesTable); err != nil {
		return err
	}

	log.Println("Invoices table created successfully")

	// Create indexes for invoices table
	createCustomerIDIndex := `CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);`
	createStatusIndex := `CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);`

	if _, err := DB.Exec(createCustomerIDIndex); err != nil {
		return err
	}

	if _, err := DB.Exec(createStatusIndex); err != nil {
		return err
	}

	log.Println("Invoice indexes created successfully")

	// Create credit_profiles table for verdict system (mock data)
	createCreditProfilesTable := `
	CREATE TABLE IF NOT EXISTS credit_profiles (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		email TEXT NOT NULL UNIQUE,
		phone TEXT,
		profile_type TEXT NOT NULL,
		credit_score INTEGER NOT NULL,
		monthly_income INTEGER NOT NULL,
		total_debt INTEGER NOT NULL,
		employment_status TEXT,
		payment_history_score INTEGER NOT NULL,
		account_age_months INTEGER NOT NULL,
		verdict TEXT NOT NULL,
		risk_level TEXT NOT NULL,
		max_affordable_amount INTEGER NOT NULL,
		notes TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	if _, err := DB.Exec(createCreditProfilesTable); err != nil {
		return err
	}

	log.Println("Credit profiles table created successfully")

	// Create index on email for fast lookups
	createEmailIndex := `CREATE INDEX IF NOT EXISTS idx_credit_profiles_email ON credit_profiles(email);`
	if _, err := DB.Exec(createEmailIndex); err != nil {
		return err
	}

	// Seed mock credit profile data
	if err := seedCreditProfiles(); err != nil {
		return err
	}

	log.Println("Credit profiles seeded successfully")

	// Create recipients table (cache for Paystack transfer recipients)
	createRecipientsTable := `
	CREATE TABLE IF NOT EXISTS recipients (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		recipient_code TEXT NOT NULL UNIQUE,
		type TEXT NOT NULL,
		name TEXT NOT NULL,
		account_number TEXT NOT NULL,
		bank_code TEXT NOT NULL,
		bank_name TEXT,
		currency TEXT DEFAULT 'NGN',
		description TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	if _, err := DB.Exec(createRecipientsTable); err != nil {
		return err
	}

	log.Println("Recipients table created successfully")

	// Create index on recipient_code for fast lookups
	createRecipientCodeIndex := `CREATE INDEX IF NOT EXISTS idx_recipients_code ON recipients(recipient_code);`
	if _, err := DB.Exec(createRecipientCodeIndex); err != nil {
		return err
	}

	// Insert default service provider recipient if not exists
	insertDefaultRecipient := `
	INSERT OR IGNORE INTO recipients (recipient_code, type, name, account_number, bank_code, bank_name, currency, description)
	VALUES ('RCP_serviceprovider', 'nuban', 'Service Provider', '0000000000', '000', 'Default Bank', 'NGN', 'Default recipient for all service provider payments');`

	if _, err := DB.Exec(insertDefaultRecipient); err != nil {
		return err
	}

	log.Println("Default service provider recipient created successfully")

	// Create expenses table
	createExpensesTable := `
	CREATE TABLE IF NOT EXISTS expenses (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		recipient_code TEXT NOT NULL,
		recipient_name TEXT NOT NULL,
		amount INTEGER NOT NULL,
		currency TEXT DEFAULT 'NGN',
		category TEXT,
		narration TEXT,
		reference TEXT UNIQUE,
		status TEXT DEFAULT 'pending',
		payment_date DATETIME,
		notes TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (recipient_code) REFERENCES recipients(recipient_code)
	);`

	if _, err := DB.Exec(createExpensesTable); err != nil {
		return err
	}

	log.Println("Expenses table created successfully")

	// Create indexes for expenses table
	createExpenseRecipientIndex := `CREATE INDEX IF NOT EXISTS idx_expenses_recipient ON expenses(recipient_code);`
	createExpenseStatusIndex := `CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);`
	createExpenseCategoryIndex := `CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);`

	if _, err := DB.Exec(createExpenseRecipientIndex); err != nil {
		return err
	}

	if _, err := DB.Exec(createExpenseStatusIndex); err != nil {
		return err
	}

	if _, err := DB.Exec(createExpenseCategoryIndex); err != nil {
		return err
	}

	log.Println("Expense indexes created successfully")

	// Add goal_id and budget_limit_id to expenses table
	addGoalColumnToExpenses := `ALTER TABLE expenses ADD COLUMN goal_id INTEGER;`
	addBudgetColumnToExpenses := `ALTER TABLE expenses ADD COLUMN budget_limit_id INTEGER;`

	// Try to add columns (will fail silently if already exists)
	DB.Exec(addGoalColumnToExpenses)
	DB.Exec(addBudgetColumnToExpenses)

	// Create indexes for expenses foreign keys
	createExpenseGoalIndex := `CREATE INDEX IF NOT EXISTS idx_expenses_goal ON expenses(goal_id);`
	createExpenseBudgetIndex := `CREATE INDEX IF NOT EXISTS idx_expenses_budget ON expenses(budget_limit_id);`

	if _, err := DB.Exec(createExpenseGoalIndex); err != nil {
		return err
	}

	if _, err := DB.Exec(createExpenseBudgetIndex); err != nil {
		return err
	}

	log.Println("Expense goal and budget columns added successfully")

	// Create goals table (financial goals users want to achieve)
	createGoalsTable := `
	CREATE TABLE IF NOT EXISTS goals (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		description TEXT,
		goal_type TEXT NOT NULL,
		target_amount INTEGER NOT NULL,
		budget_limit_id INTEGER,
		frequency TEXT NOT NULL,
		start_date DATETIME NOT NULL,
		end_date DATETIME,
		status TEXT DEFAULT 'pending',
		achieved_at DATETIME,
		achieved_by_expense_id INTEGER,
		category TEXT,
		priority TEXT DEFAULT 'medium',
		notes TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (budget_limit_id) REFERENCES budget_limits(id),
		FOREIGN KEY (achieved_by_expense_id) REFERENCES expenses(id)
	);`

	if _, err := DB.Exec(createGoalsTable); err != nil {
		return err
	}

	log.Println("Goals table created successfully")

	// Create indexes for goals table
	createGoalStatusIndex := `CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);`
	createGoalBudgetIndex := `CREATE INDEX IF NOT EXISTS idx_goals_budget ON goals(budget_limit_id);`
	createGoalTypeIndex := `CREATE INDEX IF NOT EXISTS idx_goals_type ON goals(goal_type);`
	createGoalFrequencyIndex := `CREATE INDEX IF NOT EXISTS idx_goals_frequency ON goals(frequency);`

	if _, err := DB.Exec(createGoalStatusIndex); err != nil {
		return err
	}

	if _, err := DB.Exec(createGoalBudgetIndex); err != nil {
		return err
	}

	if _, err := DB.Exec(createGoalTypeIndex); err != nil {
		return err
	}

	if _, err := DB.Exec(createGoalFrequencyIndex); err != nil {
		return err
	}

	log.Println("Goal indexes created successfully")

	// Create budget_limits table (spending limits for different periods)
	createBudgetLimitsTable := `
	CREATE TABLE IF NOT EXISTS budget_limits (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		limit_type TEXT NOT NULL,
		amount INTEGER NOT NULL,
		period_start DATETIME NOT NULL,
		period_end DATETIME NOT NULL,
		spent_amount INTEGER DEFAULT 0,
		status TEXT DEFAULT 'active',
		alert_threshold INTEGER DEFAULT 80,
		notes TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	if _, err := DB.Exec(createBudgetLimitsTable); err != nil {
		return err
	}

	log.Println("Budget limits table created successfully")

	// Create indexes for budget_limits table
	createBudgetTypeIndex := `CREATE INDEX IF NOT EXISTS idx_budget_limits_type ON budget_limits(limit_type);`
	createBudgetStatusIndex := `CREATE INDEX IF NOT EXISTS idx_budget_limits_status ON budget_limits(status);`
	createBudgetPeriodIndex := `CREATE INDEX IF NOT EXISTS idx_budget_limits_period ON budget_limits(period_start, period_end);`

	if _, err := DB.Exec(createBudgetTypeIndex); err != nil {
		return err
	}

	if _, err := DB.Exec(createBudgetStatusIndex); err != nil {
		return err
	}

	if _, err := DB.Exec(createBudgetPeriodIndex); err != nil {
		return err
	}

	log.Println("Budget limit indexes created successfully")

	return nil
}

// seedCreditProfiles seeds the database with 10 mock credit profiles
func seedCreditProfiles() error {
	// Check if already seeded
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM credit_profiles").Scan(&count)
	if err != nil {
		return err
	}

	if count > 0 {
		log.Println("Credit profiles already seeded, skipping")
		return nil
	}

	profiles := []struct {
		Name                 string
		Email                string
		Phone                string
		ProfileType          string
		CreditScore          int
		MonthlyIncome        int
		TotalDebt            int
		EmploymentStatus     string
		PaymentHistoryScore  int
		AccountAgeMonths     int
		Verdict              string
		RiskLevel            string
		MaxAffordableAmount  int
		Notes                string
	}{
		{
			Name:                 "John Doe",
			Email:                "john.doe@example.com",
			Phone:                "+2348012345678",
			ProfileType:          "individual",
			CreditScore:          750,
			MonthlyIncome:        500000,  // ₦5,000/month
			TotalDebt:            1000000, // ₦10,000 debt
			EmploymentStatus:     "employed",
			PaymentHistoryScore:  85,
			AccountAgeMonths:     36,
			Verdict:              "approved",
			RiskLevel:            "low",
			MaxAffordableAmount:  2000000, // ₦20,000
			Notes:                "Excellent credit history, stable income",
		},
		{
			Name:                 "Jane Smith",
			Email:                "jane.smith@example.com",
			Phone:                "+2348087654321",
			ProfileType:          "individual",
			CreditScore:          820,
			MonthlyIncome:        800000,
			TotalDebt:            500000,
			EmploymentStatus:     "employed",
			PaymentHistoryScore:  95,
			AccountAgeMonths:     60,
			Verdict:              "approved",
			RiskLevel:            "low",
			MaxAffordableAmount:  5000000,
			Notes:                "Outstanding credit, high income",
		},
		{
			Name:                 "Tech Innovations Ltd",
			Email:                "finance@techinnovations.com",
			Phone:                "+2348011112222",
			ProfileType:          "company",
			CreditScore:          780,
			MonthlyIncome:        5000000,
			TotalDebt:            10000000,
			EmploymentStatus:     "established",
			PaymentHistoryScore:  88,
			AccountAgeMonths:     48,
			Verdict:              "approved",
			RiskLevel:            "low",
			MaxAffordableAmount:  20000000,
			Notes:                "Registered company, good payment history",
		},
		{
			Name:                 "Michael Johnson",
			Email:                "michael.j@example.com",
			Phone:                "+2348033334444",
			ProfileType:          "individual",
			CreditScore:          620,
			MonthlyIncome:        300000,
			TotalDebt:            2000000,
			EmploymentStatus:     "employed",
			PaymentHistoryScore:  65,
			AccountAgeMonths:     24,
			Verdict:              "review",
			RiskLevel:            "medium",
			MaxAffordableAmount:  800000,
			Notes:                "Moderate credit, high debt-to-income ratio",
		},
		{
			Name:                 "Sarah Williams",
			Email:                "sarah.w@example.com",
			Phone:                "+2348055556666",
			ProfileType:          "individual",
			CreditScore:          480,
			MonthlyIncome:        200000,
			TotalDebt:            3000000,
			EmploymentStatus:     "unemployed",
			PaymentHistoryScore:  40,
			AccountAgeMonths:     12,
			Verdict:              "denied",
			RiskLevel:            "high",
			MaxAffordableAmount:  0,
			Notes:                "Poor credit history, currently unemployed",
		},
		{
			Name:                 "Green Energy Solutions",
			Email:                "contact@greenenergy.com",
			Phone:                "+2348077778888",
			ProfileType:          "company",
			CreditScore:          690,
			MonthlyIncome:        2000000,
			TotalDebt:            8000000,
			EmploymentStatus:     "startup",
			PaymentHistoryScore:  70,
			AccountAgeMonths:     18,
			Verdict:              "review",
			RiskLevel:            "medium",
			MaxAffordableAmount:  5000000,
			Notes:                "New company, growing revenue but high debt",
		},
		{
			Name:                 "David Brown",
			Email:                "david.brown@example.com",
			Phone:                "+2348099990000",
			ProfileType:          "individual",
			CreditScore:          710,
			MonthlyIncome:        600000,
			TotalDebt:            1500000,
			EmploymentStatus:     "self-employed",
			PaymentHistoryScore:  78,
			AccountAgeMonths:     42,
			Verdict:              "approved",
			RiskLevel:            "low",
			MaxAffordableAmount:  3000000,
			Notes:                "Good credit, self-employed with stable income",
		},
		{
			Name:                 "Global Trade Corp",
			Email:                "admin@globaltrade.com",
			Phone:                "+2348012341234",
			ProfileType:          "company",
			CreditScore:          850,
			MonthlyIncome:        10000000,
			TotalDebt:            5000000,
			EmploymentStatus:     "established",
			PaymentHistoryScore:  98,
			AccountAgeMonths:     120,
			Verdict:              "approved",
			RiskLevel:            "low",
			MaxAffordableAmount:  50000000,
			Notes:                "Excellent corporate credit, long track record",
		},
		{
			Name:                 "Emma Davis",
			Email:                "emma.davis@example.com",
			Phone:                "+2348056785678",
			ProfileType:          "individual",
			CreditScore:          550,
			MonthlyIncome:        250000,
			TotalDebt:            2500000,
			EmploymentStatus:     "employed",
			PaymentHistoryScore:  55,
			AccountAgeMonths:     15,
			Verdict:              "review",
			RiskLevel:            "medium",
			MaxAffordableAmount:  500000,
			Notes:                "Below average credit, recent financial difficulties",
		},
		{
			Name:                 "Fashion Boutique Ltd",
			Email:                "info@fashionboutique.com",
			Phone:                "+2348098769876",
			ProfileType:          "company",
			CreditScore:          420,
			MonthlyIncome:        800000,
			TotalDebt:            6000000,
			EmploymentStatus:     "struggling",
			PaymentHistoryScore:  35,
			AccountAgeMonths:     30,
			Verdict:              "denied",
			RiskLevel:            "high",
			MaxAffordableAmount:  0,
			Notes:                "Poor payment history, declining revenue",
		},
	}

	insertQuery := `
		INSERT INTO credit_profiles (
			name, email, phone, profile_type, credit_score, monthly_income,
			total_debt, employment_status, payment_history_score, account_age_months,
			verdict, risk_level, max_affordable_amount, notes
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	for _, profile := range profiles {
		_, err := DB.Exec(
			insertQuery,
			profile.Name,
			profile.Email,
			profile.Phone,
			profile.ProfileType,
			profile.CreditScore,
			profile.MonthlyIncome,
			profile.TotalDebt,
			profile.EmploymentStatus,
			profile.PaymentHistoryScore,
			profile.AccountAgeMonths,
			profile.Verdict,
			profile.RiskLevel,
			profile.MaxAffordableAmount,
			profile.Notes,
		)
		if err != nil {
			return err
		}
	}

	return nil
}
