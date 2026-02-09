-- Sanghavi Jewellers Recovery Node Schema v3.1
-- Optimized for MySQL 8.0+

CREATE DATABASE IF NOT EXISTS sanghavi_recovery;
USE sanghavi_recovery;

-- 1. Customers / Entities
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255),
    address TEXT,
    tax_number VARCHAR(50),
    group_id VARCHAR(100) DEFAULT 'Retail Client',
    unique_payment_code VARCHAR(20) UNIQUE NOT NULL,
    current_balance DECIMAL(15, 2) DEFAULT 0.00,
    current_gold_balance DECIMAL(15, 3) DEFAULT 0.000,
    credit_limit DECIMAL(15, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (unique_payment_code),
    INDEX (phone)
);

-- 2. Transactions Ledger (Double Entry Ready)
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    type ENUM('credit', 'debit') NOT NULL,
    unit ENUM('money', 'gold') NOT NULL DEFAULT 'money',
    amount DECIMAL(15, 3) NOT NULL,
    method VARCHAR(50) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    staff_id VARCHAR(50),
    balance_after DECIMAL(15, 3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX (customer_id, date)
);

-- 3. Communication Logs
CREATE TABLE IF NOT EXISTS communication_logs (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    type ENUM('sms', 'whatsapp', 'call', 'visit') NOT NULL,
    content TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    duration INT DEFAULT 0, -- Seconds
    outcome VARCHAR(100),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX (customer_id, timestamp)
);

-- 4. Dynamic Grade Rules (Autoheal™ Engine)
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
    template_id VARCHAR(50),
    frequency_days INT DEFAULT 30
);

-- 5. Digital Fingerprints
CREATE TABLE IF NOT EXISTS digital_fingerprints (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_type VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    device_model VARCHAR(100),
    os VARCHAR(50),
    browser VARCHAR(50),
    city VARCHAR(100),
    country VARCHAR(100),
    provider VARCHAR(50),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Seed Default Rules
INSERT INTO grade_rules (id, label, color, priority, min_balance, days_since_payment, days_since_contact, anti_spam_threshold, anti_spam_unit, whatsapp, sms, template_id, frequency_days)
VALUES 
('D', 'Critical / NPA', 'rose', 1, 50000.00, 90, 15, 48, 'hours', TRUE, TRUE, 'TPL_003', 2),
('C', 'High Risk', 'amber', 2, 20000.00, 45, 7, 3, 'days', TRUE, TRUE, 'TPL_002', 3),
('B', 'Moderate Watch', 'blue', 3, 5000.00, 15, 30, 7, 'days', TRUE, FALSE, 'TPL_001', 7),
('A', 'Standard / Safe', 'emerald', 4, 0.00, 0, 0, 15, 'days', TRUE, FALSE, 'TPL_001', 30)
ON DUPLICATE KEY UPDATE label=VALUES(label);
