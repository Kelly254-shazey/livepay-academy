-- Global Payment Platform Enhancements for Java Service
-- Adds payment methods, provider configuration, and comprehensive audit logging

-- Add country and location data to users table (if not exists)
ALTER TABLE user_account ADD COLUMN IF NOT EXISTS country VARCHAR(2) COMMENT 'ISO 3166-1 alpha-2 country code';
ALTER TABLE user_account ADD COLUMN IF NOT EXISTS country_detected_at DATETIME COMMENT 'When country was last detected';
ALTER TABLE user_account ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45) COMMENT 'Last known IP address';
ALTER TABLE user_account ADD COLUMN IF NOT EXISTS preferred_currency VARCHAR(3) COMMENT 'User preferred currency (ISO 4217)';

-- Create Payment Methods table for global payment processing
CREATE TABLE IF NOT EXISTS payment_methods (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type VARCHAR(50) NOT NULL COMMENT 'credit_card, debit_card, paypal, bank_transfer, mobile_money, etc',
  provider VARCHAR(50) NOT NULL COMMENT 'stripe, paypal, wise, mpesa, etc',
  country VARCHAR(2) COMMENT 'ISO country code where method is valid',
  last_four VARCHAR(4) COMMENT 'Last 4 digits for cards',
  brand VARCHAR(50) COMMENT 'Visa, Mastercard, etc',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  expires_at DATETIME COMMENT 'For cards and tokens',
  metadata JSON COMMENT 'Provider-specific metadata',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_country (country),
  UNIQUE KEY unique_provider_token (user_id, provider, type, last_four)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Payment Providers Configuration
CREATE TABLE IF NOT EXISTS payment_provider_configs (
  id VARCHAR(36) PRIMARY KEY,
  provider VARCHAR(50) NOT NULL UNIQUE COMMENT 'stripe, paypal, wise, etc',
  countries JSON NOT NULL COMMENT 'List of supported countries',
  payment_types JSON NOT NULL COMMENT 'List of supported payment types',
  fees JSON NOT NULL COMMENT '{"fixed": 0.30, "percentage": 2.9}',
  settings_override JSON COMMENT 'Provider-specific settings',
  is_active BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_provider_active (provider, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Session Audit Logs for comprehensive session tracking
CREATE TABLE IF NOT EXISTS session_audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  session_id VARCHAR(36) NOT NULL,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  country VARCHAR(2),
  action VARCHAR(50) NOT NULL COMMENT 'LOGIN, LOGOUT, TIMEOUT, SUSPICIOUS_ACTIVITY, etc',
  device VARCHAR(50) COMMENT 'mobile, web, desktop',
  login_timestamp DATETIME,
  logout_timestamp DATETIME,
  duration_seconds BIGINT,
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE,
  INDEX idx_user_session (user_id, session_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Payment Audit Logs for comprehensive payment tracking and fraud detection
CREATE TABLE IF NOT EXISTS payment_audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  payment_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  action VARCHAR(50) NOT NULL COMMENT 'INITIATED, AUTHORIZED, CAPTURED, REFUNDED, DECLINED, FAILED, SUSPICIOUS_DETECTED',
  status VARCHAR(50) NOT NULL COMMENT 'Payment status',
  amount DECIMAL(19, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  payment_method VARCHAR(50),
  payment_provider VARCHAR(50),
  country VARCHAR(2),
  ip_address VARCHAR(45),
  provider_reference VARCHAR(255),
  risk_level VARCHAR(20) NOT NULL DEFAULT 'LOW' COMMENT 'LOW, MEDIUM, HIGH, CRITICAL',
  fraud_score DOUBLE,
  is_successful BOOLEAN,
  error_message VARCHAR(500),
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE,
  INDEX idx_payment_user (payment_id, user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Content Access Audit Logs for tracking library and course access
CREATE TABLE IF NOT EXISTS content_access_audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  content_id VARCHAR(36) NOT NULL,
  content_type VARCHAR(50) NOT NULL COMMENT 'course, library, video, etc',
  access_type VARCHAR(50) NOT NULL COMMENT 'VIEW, DOWNLOAD, STREAM, PURCHASE, SHARE, REPORT, ANALYTICS_VIEW',
  ip_address VARCHAR(45),
  country VARCHAR(2),
  device_type VARCHAR(50) COMMENT 'mobile, web, desktop',
  duration_seconds BIGINT,
  watch_progress INT COMMENT '0-100 percentage',
  is_completed BOOLEAN,
  role VARCHAR(50) NOT NULL COMMENT 'creator, viewer, staff',
  requires_payment BOOLEAN,
  payment_verified BOOLEAN,
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE,
  INDEX idx_user_content (user_id, content_id),
  INDEX idx_created_at (created_at),
  INDEX idx_access_type (access_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create views for audit summaries
CREATE OR REPLACE VIEW payment_audit_summary AS
SELECT 
  DATE(created_at) as audit_date,
  COUNT(*) as total_transactions,
  SUM(CASE WHEN is_successful = true THEN 1 ELSE 0 END) as successful_count,
  SUM(CASE WHEN is_successful = false THEN 1 ELSE 0 END) as failed_count,
  SUM(CASE WHEN risk_level IN ('HIGH', 'CRITICAL') THEN 1 ELSE 0 END) as suspicious_count,
  SUM(amount) as total_amount,
  AVG(fraud_score) as avg_fraud_score
FROM payment_audit_logs
GROUP BY DATE(created_at);

CREATE OR REPLACE VIEW session_audit_summary AS
SELECT 
  user_id,
  DATE(created_at) as session_date,
  COUNT(*) as session_count,
  SUM(CASE WHEN action = 'LOGIN' THEN 1 ELSE 0 END) as login_count,
  SUM(CASE WHEN action = 'SUSPICIOUS_ACTIVITY' THEN 1 ELSE 0 END) as suspicious_count
FROM session_audit_logs
GROUP BY user_id, DATE(created_at);
