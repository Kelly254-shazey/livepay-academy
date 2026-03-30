-- Global Platform Enhancements
-- Adds country detection, payment methods, and comprehensive audit logging

USE livegate_nodejs;

-- Add country and location data to User table
ALTER TABLE User ADD COLUMN IF NOT EXISTS country VARCHAR(2) COMMENT 'ISO 3166-1 alpha-2 country code';
ALTER TABLE User ADD COLUMN IF NOT EXISTS countryDetectedAt DATETIME COMMENT 'When country was last detected';
ALTER TABLE User ADD COLUMN IF NOT EXISTS ipAddress VARCHAR(45) COMMENT 'Last known IP address';
ALTER TABLE User ADD COLUMN IF NOT EXISTS preferredCurrency VARCHAR(3) COMMENT 'User preferred currency (ISO 4217)';

-- Create Payment Methods table for global payment processing
CREATE TABLE IF NOT EXISTS PaymentMethod (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  type VARCHAR(50) NOT NULL COMMENT 'credit_card, debit_card, paypal, bank_transfer, mobile_money, etc',
  provider VARCHAR(50) NOT NULL COMMENT 'stripe, paypal, wise, mpesa, etc',
  country VARCHAR(2) COMMENT 'ISO country code where method is valid',
  lastFour VARCHAR(4) COMMENT 'Last 4 digits for cards',
  brand VARCHAR(50) COMMENT 'Visa, Mastercard, etc',
  isDefault BOOLEAN DEFAULT false,
  isActive BOOLEAN DEFAULT true,
  expiresAt DATETIME COMMENT 'For cards and tokens',
  metadata JSON COMMENT 'Provider-specific metadata',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  INDEX idx_user_id (userId),
  INDEX idx_type (type),
  INDEX idx_country (country),
  UNIQUE KEY unique_provider_token (userId, provider, type, lastFour)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Payment Providers Configuration
CREATE TABLE IF NOT EXISTS PaymentProviderConfig (
  id VARCHAR(36) PRIMARY KEY,
  provider VARCHAR(50) NOT NULL UNIQUE COMMENT 'stripe, paypal, wise, etc',
  countries JSON NOT NULL COMMENT 'List of supported countries',
  paymentTypes JSON NOT NULL COMMENT 'List of supported payment types',
  fees JSON NOT NULL COMMENT '{"fixed": 0.30, "percentage": 2.9}',
  settingsOverride JSON COMMENT 'Provider-specific settings',
  isActive BOOLEAN DEFAULT true,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_active (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Comprehensive Audit Logs for all activities
CREATE TABLE IF NOT EXISTS AuditLog (
  id VARCHAR(36) PRIMARY KEY,
  actorId VARCHAR(36) COMMENT 'User who performed the action',
  actorRole VARCHAR(20) COMMENT 'viewer, creator, admin, moderator',
  action VARCHAR(100) NOT NULL COMMENT 'auth.login, payment.create, content.access, etc',
  actionCategory VARCHAR(50) NOT NULL COMMENT 'auth, payment, content_access, session, security',
  resourceType VARCHAR(50) COMMENT 'user, payment, liveSession, content, etc',
  resourceId VARCHAR(36) COMMENT 'ID of the resource being acted upon',
  status VARCHAR(20) NOT NULL DEFAULT 'success' COMMENT 'success, failure, pending',
  statusCode INT COMMENT 'HTTP status code or error code',
  description TEXT COMMENT 'Human readable description',
  ipAddress VARCHAR(45) COMMENT 'IP address of the request',
  userAgent TEXT COMMENT 'User agent string',
  metadata JSON COMMENT 'Additional context data',
  changes JSON COMMENT 'What changed: {before: {}, after: {}}',
  errorMessage VARCHAR(500) COMMENT 'If status is failure',
  duration INT COMMENT 'Duration in milliseconds',
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_actor_id (actorId),
  INDEX idx_action (action),
  INDEX idx_action_category (actionCategory),
  INDEX idx_resource (resourceType, resourceId),
  INDEX idx_status (status),
  INDEX idx_timestamp (timestamp),
  INDEX idx_actor_action (actorId, action, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Session Audit Logs (for compliance)
CREATE TABLE IF NOT EXISTS SessionAuditLog (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  sessionId VARCHAR(36) COMMENT 'JWT jti claim',
  eventType VARCHAR(50) NOT NULL COMMENT 'login_success, login_failure, logout, token_refresh, session_expired, suspicious_activity',
  ipAddress VARCHAR(45) NOT NULL,
  userAgent TEXT NOT NULL,
  country VARCHAR(2),
  city VARCHAR(100),
  isSuspicious BOOLEAN DEFAULT false,
  metadata JSON,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  INDEX idx_user_id (userId),
  INDEX idx_event_type (eventType),
  INDEX idx_timestamp (timestamp),
  INDEX idx_suspicious (isSuspicious),
  INDEX idx_user_timestamp (userId, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment Transaction Audit Trail
CREATE TABLE IF NOT EXISTS PaymentAuditLog (
  id VARCHAR(36) PRIMARY KEY,
  paymentId VARCHAR(64) NOT NULL,
  userId VARCHAR(36) NOT NULL,
  paymentType VARCHAR(50) NOT NULL COMMENT 'purchase, refund, payout, adjustment',
  action VARCHAR(100) NOT NULL COMMENT 'initiated, processing, completed, failed, refunded',
  previousStatus VARCHAR(50),
  newStatus VARCHAR(50),
  amount DECIMAL(19,2),
  currency VARCHAR(3),
  paymentMethod VARCHAR(50),
  paymentProvider VARCHAR(50),
  failureReason VARCHAR(500),
  ipAddress VARCHAR(45),
  metadata JSON,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  INDEX idx_payment_id (paymentId),
  INDEX idx_user_id (userId),
  INDEX idx_action (action),
  INDEX idx_timestamp (timestamp),
  INDEX idx_user_timestamp (userId, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Content Access Audit Log (for library/premium content)
CREATE TABLE IF NOT EXISTS ContentAccessAuditLog (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  contentType VARCHAR(50) NOT NULL COMMENT 'live_session, premium_content, class, lesson',
  contentId VARCHAR(36) NOT NULL,
  creatorId VARCHAR(36),
  accessType VARCHAR(50) NOT NULL COMMENT 'view, stream, download, share',
  accessDuration INT COMMENT 'Duration in seconds',
  bytesTransferred INT COMMENT 'Data transferred in bytes',
  ipAddress VARCHAR(45),
  userAgent TEXT,
  metadata JSON,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  INDEX idx_user_id (userId),
  INDEX idx_content (contentType, contentId),
  INDEX idx_timestamp (timestamp),
  INDEX idx_creator_id (creatorId),
  INDEX idx_user_timestamp (userId, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Extend User table for Clerk integration
ALTER TABLE User ADD COLUMN IF NOT EXISTS clerkId VARCHAR(255) UNIQUE COMMENT 'Clerk user ID for OAuth';
ALTER TABLE User ADD COLUMN IF NOT EXISTS clerkMetadata JSON COMMENT 'Clerk user metadata';

-- Extend Identity to support more providers
ALTER TABLE Identity MODIFY provider VARCHAR(50) COMMENT 'local, google, clerk, clerk-google, etc';

-- Payment reconciliation by country
CREATE TABLE IF NOT EXISTS CountryPaymentReconciliation (
  id VARCHAR(36) PRIMARY KEY,
  country VARCHAR(2) NOT NULL,
  month INT NOT NULL COMMENT '1-12',
  year INT NOT NULL,
  grossRevenue DECIMAL(19,2) NOT NULL DEFAULT 0,
  platformCommission DECIMAL(19,2) NOT NULL DEFAULT 0,
  creatorEarnings DECIMAL(19,2) NOT NULL DEFAULT 0,
  totalTransactions BIGINT NOT NULL DEFAULT 0,
  failedTransactions BIGINT NOT NULL DEFAULT 0,
  refundedAmount DECIMAL(19,2) NOT NULL DEFAULT 0,
  averageTransactionValue DECIMAL(19,2),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_country_month (country, month, year),
  INDEX idx_country (country),
  INDEX idx_date (year, month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create view for real-time audit dashboard
CREATE OR REPLACE VIEW AuditLogSummary AS
SELECT 
  DATE(timestamp) as date,
  actionCategory,
  status,
  COUNT(*) as event_count,
  COUNT(DISTINCT actorId) as unique_users,
  AVG(CAST(duration AS UNSIGNED)) as avg_duration_ms
FROM AuditLog
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(timestamp), actionCategory, status;

-- Create view for session security monitoring
CREATE OR REPLACE VIEW SessionSecuritySummary AS
SELECT 
  DATE(timestamp) as date,
  eventType,
  COUNT(*) as event_count,
  COUNT(DISTINCT userId) as unique_users,
  SUM(CASE WHEN isSuspicious = 1 THEN 1 ELSE 0 END) as suspicious_count
FROM SessionAuditLog
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(timestamp), eventType;

-- Create indexes for performance optimization
CREATE INDEX idx_audit_log_timestamp_status ON AuditLog(timestamp DESC, status);
CREATE INDEX idx_session_audit_user_time ON SessionAuditLog(userId, timestamp DESC);
CREATE INDEX idx_payment_audit_user_time ON PaymentAuditLog(userId, timestamp DESC);
CREATE INDEX idx_content_audit_user_time ON ContentAccessAuditLog(userId, timestamp DESC);
