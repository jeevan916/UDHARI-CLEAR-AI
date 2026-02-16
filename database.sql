-- Sanghavi Jewellers Enterprise Recovery Master Schema
-- Optimized for Gold Weight (mg precision) and Financial Liability

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role ENUM('admin', 'staff', 'auditor') DEFAULT 'staff',
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    tax_number VARCHAR(50),
    group_id VARCHAR(100) DEFAULT 'Retail Client',
    unique_payment_code VARCHAR(20) UNIQUE NOT NULL,
    
    current_balance DECIMAL(15, 2) DEFAULT 0.00,
    current_gold_balance DECIMAL(15, 3) DEFAULT 0.000, -- 3 decimals for mg precision
    credit_limit DECIMAL(15, 2) DEFAULT 0.00,
    
    is_active BOOLEAN DEFAULT TRUE,
    status VARCHAR(50) DEFAULT 'active',
    grade VARCHAR(5) DEFAULT 'A',
    
    last_call_date DATETIME,
    last_whatsapp_date DATETIME,
    last_sms_date DATETIME,
    
    deepvue_data JSON, 
    fingerprints JSON, 
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_upc (unique_payment_code),
    INDEX idx_phone (phone),
    INDEX idx_name (name)
);

CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    type ENUM('credit', 'debit') NOT NULL,
    unit ENUM('money', 'gold') NOT NULL DEFAULT 'money',
    amount DECIMAL(15, 3) NOT NULL, -- Unified to 15,3 to handle grams accurately
    method VARCHAR(50) NOT NULL, 
    description TEXT,
    date DATE NOT NULL,
    staff_id VARCHAR(50),
    balance_after DECIMAL(15, 3),
    particular VARCHAR(100), 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_cust_date (customer_id, date),
    INDEX idx_global_date (date)
);

CREATE TABLE IF NOT EXISTS communication_logs (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    type ENUM('sms', 'whatsapp', 'call', 'visit') NOT NULL,
    content TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50), 
    duration INT DEFAULT 0,
    outcome VARCHAR(100),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS grade_rules (
    id VARCHAR(5) PRIMARY KEY, 
    label VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT 'slate',
    priority INT NOT NULL,
    min_balance DECIMAL(15, 2) DEFAULT 0.00,
    days_since_payment INT DEFAULT 0,
    days_since_contact INT DEFAULT 0,
    anti_spam_threshold INT DEFAULT 24,
    anti_spam_unit ENUM('hours', 'days') DEFAULT 'hours',
    whatsapp BOOLEAN DEFAULT FALSE,
    sms BOOLEAN DEFAULT FALSE,
    whatsapp_template_id VARCHAR(50),
    sms_template_id VARCHAR(50),
    frequency_days INT DEFAULT 30
);

INSERT INTO grade_rules (id, label, color, priority, min_balance, days_since_payment, days_since_contact, anti_spam_threshold, anti_spam_unit, whatsapp, sms, frequency_days)
VALUES 
('D', 'Critical / NPA', 'rose', 1, 50000.00, 90, 15, 48, 'hours', TRUE, TRUE, 2),
('C', 'High Risk', 'amber', 2, 20000.00, 45, 7, 3, 'days', TRUE, TRUE, 3),
('B', 'Moderate Watch', 'blue', 3, 5000.00, 15, 30, 7, 'days', TRUE, FALSE, 7),
('A', 'Safe Zone', 'emerald', 4, 0.00, 0, 0, 15, 'days', TRUE, FALSE, 30)
ON DUPLICATE KEY UPDATE label=VALUES(label);