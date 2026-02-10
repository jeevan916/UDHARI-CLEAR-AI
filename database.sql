-- Sanghavi Jewellers Enterprise Recovery Core v7.0
-- Master Schema Definition
-- Target: MySQL 8.0+ / MariaDB 10.5+

CREATE DATABASE IF NOT EXISTS sanghavi_recovery;
USE sanghavi_recovery;

-- 1. IDENTITY & ACCESS MANAGEMENT
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role ENUM('admin', 'staff', 'auditor') DEFAULT 'staff',
    password_hash VARCHAR(255) NOT NULL, -- BCrypt Hash
    avatar_url TEXT,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ENTITY MASTER (CUSTOMERS)
-- Includes JSON columns for deep forensic data storage
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    tax_number VARCHAR(50),
    group_id VARCHAR(100) DEFAULT 'Retail Client',
    unique_payment_code VARCHAR(20) UNIQUE NOT NULL,
    
    -- Ledger Balances
    current_balance DECIMAL(15, 2) DEFAULT 0.00,
    current_gold_balance DECIMAL(15, 3) DEFAULT 0.000,
    credit_limit DECIMAL(15, 2) DEFAULT 0.00,
    
    -- Status Flags
    is_active BOOLEAN DEFAULT TRUE,
    status VARCHAR(50) DEFAULT 'active',
    grade VARCHAR(5) DEFAULT 'A',
    
    -- Engagement Metrics
    last_call_date DATETIME,
    last_whatsapp_date DATETIME,
    last_sms_date DATETIME,
    
    -- Forensic Data (JSON)
    deepvue_data JSON, -- Stores KYC, Bureau Report, Asset Registry
    fingerprints JSON, -- Stores Device IPs, Geo-location history
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_upc (unique_payment_code),
    INDEX idx_phone (phone),
    INDEX idx_name (name)
);

-- 3. FINANCIAL LEDGER (DOUBLE ENTRY)
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    type ENUM('credit', 'debit') NOT NULL,
    unit ENUM('money', 'gold') NOT NULL DEFAULT 'money',
    amount DECIMAL(15, 3) NOT NULL,
    method VARCHAR(50) NOT NULL, -- cash, rtgs, gold_bar, adjustment
    description TEXT,
    date DATE NOT NULL,
    staff_id VARCHAR(50),
    balance_after DECIMAL(15, 3),
    particular VARCHAR(100), -- Bill No / Receipt No
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_cust_date (customer_id, date),
    INDEX idx_global_date (date),
    INDEX idx_type_unit (type, unit)
);

-- 4. COMMUNICATION VAULT
CREATE TABLE IF NOT EXISTS communication_logs (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    type ENUM('sms', 'whatsapp', 'call', 'visit') NOT NULL,
    content TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50), -- sent, delivered, read, failed
    duration INT DEFAULT 0, -- For calls
    outcome VARCHAR(100), -- Connected, No Answer, Promised to Pay
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_cust_ts (customer_id, timestamp)
);

-- 5. RISK ENGINE RULES
CREATE TABLE IF NOT EXISTS grade_rules (
    id VARCHAR(5) PRIMARY KEY, -- A, B, C, D
    label VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT 'slate',
    priority INT NOT NULL,
    
    -- Logic Gates
    min_balance DECIMAL(15, 2) DEFAULT 0.00,
    days_since_payment INT DEFAULT 0,
    days_since_contact INT DEFAULT 0,
    
    -- Anti-Spam & Automation
    anti_spam_threshold INT DEFAULT 24,
    anti_spam_unit ENUM('hours', 'days') DEFAULT 'hours',
    whatsapp BOOLEAN DEFAULT FALSE,
    sms BOOLEAN DEFAULT FALSE,
    whatsapp_template_id VARCHAR(50),
    sms_template_id VARCHAR(50),
    frequency_days INT DEFAULT 30
);

-- 6. TEMPLATE ARCHITECT
CREATE TABLE IF NOT EXISTS templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL, -- Meta Template Name / DLT ID
    label VARCHAR(255), -- Internal Display Name
    channel ENUM('whatsapp', 'sms') NOT NULL,
    category VARCHAR(50) DEFAULT 'UTILITY',
    status VARCHAR(50) DEFAULT 'draft', -- active, draft, approved, rejected
    content TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'en_US',
    
    -- WhatsApp Rich Media Structures
    wa_header JSON, -- { type: 'IMAGE', content: 'url' }
    wa_footer VARCHAR(255),
    wa_buttons JSON, -- Array of buttons
    
    -- SMS DLT Specifics
    dlt_template_id VARCHAR(100),
    sender_id VARCHAR(20),
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. INTEGRATION INFRASTRUCTURE
CREATE TABLE IF NOT EXISTS integrations (
    id VARCHAR(50) PRIMARY KEY, -- razorpay, setu, msg91, gemini
    name VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    status ENUM('online', 'offline', 'idle', 'maintenance') DEFAULT 'idle',
    latency VARCHAR(20) DEFAULT '0ms',
    config JSON, -- Encrypted credentials and settings
    last_health_check TIMESTAMP
);

-- SEED DATA: Default Grade Rules
INSERT INTO grade_rules (id, label, color, priority, min_balance, days_since_payment, days_since_contact, anti_spam_threshold, anti_spam_unit, whatsapp, sms, frequency_days)
VALUES 
('D', 'Critical / NPA', 'rose', 1, 50000.00, 90, 15, 48, 'hours', TRUE, TRUE, 2),
('C', 'High Risk', 'amber', 2, 20000.00, 45, 7, 3, 'days', TRUE, TRUE, 3),
('B', 'Moderate Watch', 'blue', 3, 5000.00, 15, 30, 7, 'days', TRUE, FALSE, 7),
('A', 'Safe Zone', 'emerald', 4, 0.00, 0, 0, 15, 'days', TRUE, FALSE, 30)
ON DUPLICATE KEY UPDATE label=VALUES(label);