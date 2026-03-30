-- Live schema alignment patch
-- Safe, additive changes for existing MariaDB databases.

-- =========================
-- livegate_nodejs
-- =========================
USE livegate_nodejs;

ALTER TABLE `User`
    MODIFY COLUMN `passwordHash` VARCHAR(191) NULL,
    MODIFY COLUMN `username` VARCHAR(191) NOT NULL;

ALTER TABLE `User` ADD COLUMN IF NOT EXISTS `avatarUrl` VARCHAR(191) NULL;
ALTER TABLE `User` ADD COLUMN IF NOT EXISTS `dateOfBirth` DATE NULL;
ALTER TABLE `User` ADD COLUMN IF NOT EXISTS `gender` VARCHAR(191) NULL;
ALTER TABLE `User` ADD COLUMN IF NOT EXISTS `customGender` VARCHAR(191) NULL;
ALTER TABLE `User` ADD COLUMN IF NOT EXISTS `emailVerifiedAt` DATETIME(3) NULL;
ALTER TABLE `User` ADD COLUMN IF NOT EXISTS `profileCompletedAt` DATETIME(3) NULL;
ALTER TABLE `User` ADD COLUMN IF NOT EXISTS `lastLoginAt` DATETIME(3) NULL;

ALTER TABLE `RefreshToken` ADD COLUMN IF NOT EXISTS `ipAddress` VARCHAR(191) NULL;
ALTER TABLE `RefreshToken` ADD COLUMN IF NOT EXISTS `userAgent` VARCHAR(191) NULL;
ALTER TABLE `RefreshToken` ADD COLUMN IF NOT EXISTS `lastUsedAt` DATETIME(3) NULL;

CREATE TABLE IF NOT EXISTS `OneTimeCode` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `purpose` ENUM('email_verification', 'password_reset') NOT NULL,
    `codeHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `consumedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `OneTimeCode_userId_purpose_expiresAt_idx` (`userId`, `purpose`, `expiresAt`),
    INDEX `OneTimeCode_purpose_codeHash_idx` (`purpose`, `codeHash`),
    CONSTRAINT `OneTimeCode_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `AuditLog` ADD COLUMN IF NOT EXISTS `actionCategory` ENUM('auth', 'payment', 'content_access', 'session', 'security', 'moderation', 'admin') NOT NULL DEFAULT 'admin';
ALTER TABLE `AuditLog` ADD COLUMN IF NOT EXISTS `resourceType` VARCHAR(191) NULL;
ALTER TABLE `AuditLog` ADD COLUMN IF NOT EXISTS `status` VARCHAR(191) NOT NULL DEFAULT 'success';
ALTER TABLE `AuditLog` ADD COLUMN IF NOT EXISTS `statusCode` INT NULL;
ALTER TABLE `AuditLog` ADD COLUMN IF NOT EXISTS `description` VARCHAR(191) NULL;
ALTER TABLE `AuditLog` ADD COLUMN IF NOT EXISTS `userAgent` VARCHAR(191) NULL;
ALTER TABLE `AuditLog` ADD COLUMN IF NOT EXISTS `changes` JSON NULL;
ALTER TABLE `AuditLog` ADD COLUMN IF NOT EXISTS `errorMessage` VARCHAR(191) NULL;
ALTER TABLE `AuditLog` ADD COLUMN IF NOT EXISTS `duration` INT NULL;
ALTER TABLE `AuditLog` ADD COLUMN IF NOT EXISTS `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

UPDATE `AuditLog`
SET
    `resourceType` = COALESCE(`resourceType`, `resource`),
    `timestamp` = COALESCE(`timestamp`, `createdAt`),
    `status` = COALESCE(NULLIF(`status`, ''), 'success'),
    `actionCategory` = CASE
        WHEN LOWER(`action`) LIKE 'auth.%' THEN 'auth'
        WHEN LOWER(`action`) LIKE 'payment.%' OR LOWER(COALESCE(`resourceType`, `resource`, '')) LIKE '%payment%' OR LOWER(COALESCE(`resourceType`, `resource`, '')) LIKE '%wallet%' THEN 'payment'
        WHEN LOWER(COALESCE(`resourceType`, `resource`, '')) LIKE '%session%' THEN 'session'
        WHEN LOWER(`action`) LIKE 'moderation.%' OR LOWER(COALESCE(`resourceType`, `resource`, '')) LIKE '%report%' OR LOWER(COALESCE(`resourceType`, `resource`, '')) LIKE '%moderation%' THEN 'moderation'
        WHEN LOWER(`action`) LIKE 'security.%' OR LOWER(`action`) LIKE '%password%' OR LOWER(`action`) LIKE '%token%' THEN 'security'
        WHEN LOWER(COALESCE(`resourceType`, `resource`, '')) LIKE '%content%' OR LOWER(COALESCE(`resourceType`, `resource`, '')) LIKE '%class%' OR LOWER(COALESCE(`resourceType`, `resource`, '')) LIKE '%lesson%' OR LOWER(COALESCE(`resourceType`, `resource`, '')) LIKE '%live_session%' THEN 'content_access'
        ELSE COALESCE(`actionCategory`, 'admin')
    END;

CREATE INDEX IF NOT EXISTS `AuditLog_actorId_timestamp_idx` ON `AuditLog` (`actorId`, `timestamp`);
CREATE INDEX IF NOT EXISTS `AuditLog_action_timestamp_idx` ON `AuditLog` (`action`, `timestamp`);
CREATE INDEX IF NOT EXISTS `AuditLog_actionCategory_status_idx` ON `AuditLog` (`actionCategory`, `status`);
CREATE INDEX IF NOT EXISTS `AuditLog_resourceType_resourceId_idx` ON `AuditLog` (`resourceType`, `resourceId`);
CREATE INDEX IF NOT EXISTS `AuditLog_status_idx` ON `AuditLog` (`status`);
CREATE INDEX IF NOT EXISTS `AuditLog_timestamp_idx` ON `AuditLog` (`timestamp`);

CREATE INDEX IF NOT EXISTS `AuthIdentity_email_idx` ON `AuthIdentity` (`email`);
CREATE UNIQUE INDEX IF NOT EXISTS `AuthIdentity_provider_providerUserId_key` ON `AuthIdentity` (`provider`, `providerUserId`);
CREATE UNIQUE INDEX IF NOT EXISTS `AuthIdentity_userId_provider_key` ON `AuthIdentity` (`userId`, `provider`);

CREATE INDEX IF NOT EXISTS `PaymentMethod_userId_isActive_idx` ON `PaymentMethod` (`userId`, `isActive`);
CREATE INDEX IF NOT EXISTS `PaymentMethod_type_country_idx` ON `PaymentMethod` (`type`, `country`);
CREATE INDEX IF NOT EXISTS `PaymentProviderConfig_isActive_idx` ON `PaymentProviderConfig` (`isActive`);
CREATE INDEX IF NOT EXISTS `SessionAuditLog_userId_eventType_idx` ON `SessionAuditLog` (`userId`, `eventType`);
CREATE INDEX IF NOT EXISTS `SessionAuditLog_eventType_timestamp_idx` ON `SessionAuditLog` (`eventType`, `timestamp`);
CREATE INDEX IF NOT EXISTS `SessionAuditLog_isSuspicious_idx` ON `SessionAuditLog` (`isSuspicious`);
CREATE INDEX IF NOT EXISTS `SessionAuditLog_userId_timestamp_idx` ON `SessionAuditLog` (`userId`, `timestamp`);
CREATE INDEX IF NOT EXISTS `PaymentAuditLog_paymentId_timestamp_idx` ON `PaymentAuditLog` (`paymentId`, `timestamp`);
CREATE INDEX IF NOT EXISTS `PaymentAuditLog_userId_action_idx` ON `PaymentAuditLog` (`userId`, `action`);
CREATE INDEX IF NOT EXISTS `PaymentAuditLog_action_timestamp_idx` ON `PaymentAuditLog` (`action`, `timestamp`);
CREATE INDEX IF NOT EXISTS `PaymentAuditLog_userId_timestamp_idx` ON `PaymentAuditLog` (`userId`, `timestamp`);
CREATE INDEX IF NOT EXISTS `ContentAccessAuditLog_userId_contentType_idx` ON `ContentAccessAuditLog` (`userId`, `contentType`);
CREATE INDEX IF NOT EXISTS `ContentAccessAuditLog_contentType_contentId_idx` ON `ContentAccessAuditLog` (`contentType`, `contentId`);
CREATE INDEX IF NOT EXISTS `ContentAccessAuditLog_creatorId_timestamp_idx` ON `ContentAccessAuditLog` (`creatorId`, `timestamp`);
CREATE INDEX IF NOT EXISTS `ContentAccessAuditLog_userId_timestamp_idx` ON `ContentAccessAuditLog` (`userId`, `timestamp`);

INSERT INTO `PaymentProviderConfig` (`id`, `provider`, `countries`, `paymentTypes`, `fees`, `settingsOverride`, `isActive`, `createdAt`, `updatedAt`)
VALUES
    (UUID(), 'stripe', '["US","GB","CA","AU","NZ","DE","FR","IT","ES","NL","CH","SE","NO","DK","SG","JP"]', '["credit_card","debit_card"]', '{"fixed":0.30,"percentage":2.9}', NULL, TRUE, NOW(), NOW()),
    (UUID(), 'paypal', '["US","GB","CA","AU","NZ","DE","FR","IT","ES","NL","CH","SE","BR","MX","AR","SG","JP","CN","IN","NG","ZA"]', '["paypal"]', '{"fixed":0.49,"percentage":3.49}', NULL, TRUE, NOW(), NOW()),
    (UUID(), 'wise', '["US","GB","CA","AU","NZ","DE","FR","IT","ES","NL","CH","SE","NO","DK","PL","CZ","HU","RO","SG","JP","BR","MX","ZA"]', '["bank_transfer"]', '{"fixed":0.0,"percentage":0.7}', NULL, TRUE, NOW(), NOW()),
    (UUID(), 'flutterwave', '["NG","GH","KE","ZA","TN","EG","UG","RW","TZ","CM"]', '["credit_card","mobile_money","bank_transfer"]', '{"fixed":0.0,"percentage":1.4}', NULL, TRUE, NOW(), NOW()),
    (UUID(), 'razorpay', '["IN","BD","PK"]', '["credit_card","debit_card","upi","bank_transfer"]', '{"fixed":0.0,"percentage":2.0}', NULL, TRUE, NOW(), NOW()),
    (UUID(), 'mpesa', '["KE"]', '["mobile_money"]', '{"fixed":0.0,"percentage":0.0}', NULL, TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    `countries` = VALUES(`countries`),
    `paymentTypes` = VALUES(`paymentTypes`),
    `fees` = VALUES(`fees`),
    `settingsOverride` = VALUES(`settingsOverride`),
    `isActive` = VALUES(`isActive`),
    `updatedAt` = NOW();

INSERT INTO `Category` (`id`, `slug`, `name`, `description`, `icon`, `status`, `createdById`, `createdAt`, `updatedAt`)
VALUES
    (UUID(), 'education', 'Education', 'Structured learning, tutoring, and subject mastery.', NULL, 'active', NULL, NOW(3), NOW(3)),
    (UUID(), 'trading-education', 'Trading Education', 'High-signal market teaching, analysis, and guided sessions.', NULL, 'active', NULL, NOW(3), NOW(3)),
    (UUID(), 'business-entrepreneurship', 'Business & Entrepreneurship', 'Operators, founders, and mentors building revenue skills.', NULL, 'active', NULL, NOW(3), NOW(3)),
    (UUID(), 'career-coaching', 'Career Coaching', 'Interview prep, positioning, growth, and leadership support.', NULL, 'active', NULL, NOW(3), NOW(3)),
    (UUID(), 'mentorship', 'Mentorship', 'Paid access to personal guidance and long-term expertise.', NULL, 'active', NULL, NOW(3), NOW(3)),
    (UUID(), 'fitness-wellness', 'Fitness & Wellness', 'Live classes, routines, and premium wellbeing programs.', NULL, 'active', NULL, NOW(3), NOW(3)),
    (UUID(), 'creative-skills', 'Creative Skills', 'Design, music, editing, storytelling, and maker craft.', NULL, 'active', NULL, NOW(3), NOW(3)),
    (UUID(), 'events-workshops', 'Events & Workshops', 'Time-bound intensives, launches, cohorts, and expert sessions.', NULL, 'active', NULL, NOW(3), NOW(3)),
    (UUID(), 'premium-tutorials', 'Premium Tutorials', 'High-value locked lessons, replays, and downloadable resources.', NULL, 'active', NULL, NOW(3), NOW(3)),
    (UUID(), 'entertainment-live', 'Entertainment Live', 'Paid live moments, performances, commentary, and audience access.', NULL, 'active', NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
    `name` = VALUES(`name`),
    `description` = VALUES(`description`),
    `status` = VALUES(`status`),
    `updatedAt` = NOW(3);

CREATE OR REPLACE VIEW `AuditLogSummary` AS
SELECT
    DATE(COALESCE(`timestamp`, `createdAt`)) AS `date`,
    `actionCategory`,
    `status`,
    COUNT(*) AS `event_count`,
    COUNT(DISTINCT `actorId`) AS `unique_users`,
    AVG(CAST(`duration` AS UNSIGNED)) AS `avg_duration_ms`
FROM `AuditLog`
WHERE COALESCE(`timestamp`, `createdAt`) >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(COALESCE(`timestamp`, `createdAt`)), `actionCategory`, `status`;

CREATE OR REPLACE VIEW `SessionSecuritySummary` AS
SELECT
    DATE(`timestamp`) AS `date`,
    `eventType`,
    COUNT(*) AS `event_count`,
    COUNT(DISTINCT `userId`) AS `unique_users`,
    SUM(CASE WHEN `isSuspicious` = 1 THEN 1 ELSE 0 END) AS `suspicious_count`
FROM `SessionAuditLog`
WHERE `timestamp` >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(`timestamp`), `eventType`;

-- =========================
-- livegate_java
-- =========================
USE livegate_java;

CREATE TABLE IF NOT EXISTS `user_account` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `first_name` VARCHAR(191) NOT NULL,
    `last_name` VARCHAR(191) NOT NULL,
    `role` VARCHAR(32) NOT NULL DEFAULT 'viewer',
    `country` VARCHAR(2) NULL,
    `country_detected_at` DATETIME NULL,
    `ip_address` VARCHAR(45) NULL,
    `preferred_currency` VARCHAR(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_user_account_email` (`email`),
    KEY `idx_user_account_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `user_account` ADD COLUMN IF NOT EXISTS `country` VARCHAR(2) NULL;
ALTER TABLE `user_account` ADD COLUMN IF NOT EXISTS `country_detected_at` DATETIME NULL;
ALTER TABLE `user_account` ADD COLUMN IF NOT EXISTS `ip_address` VARCHAR(45) NULL;
ALTER TABLE `user_account` ADD COLUMN IF NOT EXISTS `preferred_currency` VARCHAR(3) NULL;

INSERT INTO `livegate_java`.`user_account` (`id`, `email`, `first_name`, `last_name`, `role`, `country`, `country_detected_at`, `ip_address`, `preferred_currency`, `created_at`, `updated_at`)
SELECT
    LEFT(`id`, 36),
    `email`,
    `firstName`,
    `lastName`,
    CAST(`role` AS CHAR),
    `country`,
    `countryDetectedAt`,
    LEFT(`ipAddress`, 45),
    `preferredCurrency`,
    `createdAt`,
    `updatedAt`
FROM `livegate_nodejs`.`User`
ON DUPLICATE KEY UPDATE
    `email` = VALUES(`email`),
    `first_name` = VALUES(`first_name`),
    `last_name` = VALUES(`last_name`),
    `role` = VALUES(`role`),
    `country` = VALUES(`country`),
    `country_detected_at` = VALUES(`country_detected_at`),
    `ip_address` = VALUES(`ip_address`),
    `preferred_currency` = VALUES(`preferred_currency`),
    `updated_at` = VALUES(`updated_at`);

DROP TRIGGER IF EXISTS `livegate_nodejs`.`trg_user_sync_to_java_insert`;
DROP TRIGGER IF EXISTS `livegate_nodejs`.`trg_user_sync_to_java_update`;
DROP TRIGGER IF EXISTS `livegate_nodejs`.`trg_user_sync_to_java_delete`;

DELIMITER $$
CREATE TRIGGER `livegate_nodejs`.`trg_user_sync_to_java_insert`
AFTER INSERT ON `livegate_nodejs`.`User`
FOR EACH ROW
BEGIN
    INSERT INTO `livegate_java`.`user_account` (
        `id`, `email`, `first_name`, `last_name`, `role`,
        `country`, `country_detected_at`, `ip_address`, `preferred_currency`,
        `created_at`, `updated_at`
    )
    VALUES (
        LEFT(NEW.`id`, 36),
        NEW.`email`,
        NEW.`firstName`,
        NEW.`lastName`,
        CAST(NEW.`role` AS CHAR),
        NEW.`country`,
        NEW.`countryDetectedAt`,
        LEFT(NEW.`ipAddress`, 45),
        NEW.`preferredCurrency`,
        NEW.`createdAt`,
        NEW.`updatedAt`
    )
    ON DUPLICATE KEY UPDATE
        `email` = VALUES(`email`),
        `first_name` = VALUES(`first_name`),
        `last_name` = VALUES(`last_name`),
        `role` = VALUES(`role`),
        `country` = VALUES(`country`),
        `country_detected_at` = VALUES(`country_detected_at`),
        `ip_address` = VALUES(`ip_address`),
        `preferred_currency` = VALUES(`preferred_currency`),
        `updated_at` = VALUES(`updated_at`);
END$$

CREATE TRIGGER `livegate_nodejs`.`trg_user_sync_to_java_update`
AFTER UPDATE ON `livegate_nodejs`.`User`
FOR EACH ROW
BEGIN
    INSERT INTO `livegate_java`.`user_account` (
        `id`, `email`, `first_name`, `last_name`, `role`,
        `country`, `country_detected_at`, `ip_address`, `preferred_currency`,
        `created_at`, `updated_at`
    )
    VALUES (
        LEFT(NEW.`id`, 36),
        NEW.`email`,
        NEW.`firstName`,
        NEW.`lastName`,
        CAST(NEW.`role` AS CHAR),
        NEW.`country`,
        NEW.`countryDetectedAt`,
        LEFT(NEW.`ipAddress`, 45),
        NEW.`preferredCurrency`,
        NEW.`createdAt`,
        NEW.`updatedAt`
    )
    ON DUPLICATE KEY UPDATE
        `email` = VALUES(`email`),
        `first_name` = VALUES(`first_name`),
        `last_name` = VALUES(`last_name`),
        `role` = VALUES(`role`),
        `country` = VALUES(`country`),
        `country_detected_at` = VALUES(`country_detected_at`),
        `ip_address` = VALUES(`ip_address`),
        `preferred_currency` = VALUES(`preferred_currency`),
        `updated_at` = VALUES(`updated_at`);
END$$

CREATE TRIGGER `livegate_nodejs`.`trg_user_sync_to_java_delete`
AFTER DELETE ON `livegate_nodejs`.`User`
FOR EACH ROW
BEGIN
    DELETE FROM `livegate_java`.`user_account`
    WHERE `id` = LEFT(OLD.`id`, 36);
END$$
DELIMITER ;

CREATE TABLE IF NOT EXISTS `payment_methods` (
    `id` VARCHAR(36) PRIMARY KEY,
    `user_id` VARCHAR(36) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `provider` VARCHAR(50) NOT NULL,
    `country` VARCHAR(2) NULL,
    `last_four` VARCHAR(4) NULL,
    `brand` VARCHAR(50) NULL,
    `is_default` BOOLEAN DEFAULT false,
    `is_active` BOOLEAN DEFAULT true,
    `expires_at` DATETIME NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_provider_token` (`user_id`, `provider`, `type`, `last_four`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_type` (`type`),
    INDEX `idx_country` (`country`),
    CONSTRAINT `fk_payment_methods_user_account` FOREIGN KEY (`user_id`) REFERENCES `user_account`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payment_provider_configs` (
    `id` VARCHAR(36) PRIMARY KEY,
    `provider` VARCHAR(50) NOT NULL UNIQUE,
    `countries` JSON NOT NULL,
    `payment_types` JSON NOT NULL,
    `fees` JSON NOT NULL,
    `settings_override` JSON NULL,
    `is_active` BOOLEAN DEFAULT true,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_provider_active` (`provider`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `session_audit_logs` (
    `id` VARCHAR(36) PRIMARY KEY,
    `user_id` VARCHAR(36) NOT NULL,
    `session_id` VARCHAR(36) NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(500) NULL,
    `country` VARCHAR(2) NULL,
    `action` VARCHAR(50) NOT NULL,
    `device` VARCHAR(50) NULL,
    `login_timestamp` DATETIME NULL,
    `logout_timestamp` DATETIME NULL,
    `duration_seconds` BIGINT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user_session` (`user_id`, `session_id`),
    INDEX `idx_created_at` (`created_at`),
    CONSTRAINT `fk_session_audit_logs_user_account` FOREIGN KEY (`user_id`) REFERENCES `user_account`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payment_audit_logs` (
    `id` VARCHAR(36) PRIMARY KEY,
    `payment_id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `amount` DECIMAL(19, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL,
    `payment_method` VARCHAR(50) NULL,
    `payment_provider` VARCHAR(50) NULL,
    `country` VARCHAR(2) NULL,
    `ip_address` VARCHAR(45) NULL,
    `provider_reference` VARCHAR(255) NULL,
    `risk_level` VARCHAR(20) NOT NULL DEFAULT 'LOW',
    `fraud_score` DOUBLE NULL,
    `is_successful` BOOLEAN NULL,
    `error_message` VARCHAR(500) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_payment_user` (`payment_id`, `user_id`),
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_status` (`status`),
    CONSTRAINT `fk_payment_audit_logs_user_account` FOREIGN KEY (`user_id`) REFERENCES `user_account`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `content_access_audit_logs` (
    `id` VARCHAR(36) PRIMARY KEY,
    `user_id` VARCHAR(36) NOT NULL,
    `content_id` VARCHAR(36) NOT NULL,
    `content_type` VARCHAR(50) NOT NULL,
    `access_type` VARCHAR(50) NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `country` VARCHAR(2) NULL,
    `device_type` VARCHAR(50) NULL,
    `duration_seconds` BIGINT NULL,
    `watch_progress` INT NULL,
    `is_completed` BOOLEAN NULL,
    `role` VARCHAR(50) NOT NULL,
    `requires_payment` BOOLEAN NULL,
    `payment_verified` BOOLEAN NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user_content` (`user_id`, `content_id`),
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_access_type` (`access_type`),
    CONSTRAINT `fk_content_access_audit_logs_user_account` FOREIGN KEY (`user_id`) REFERENCES `user_account`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `payment_provider_configs` (`id`, `provider`, `countries`, `payment_types`, `fees`, `settings_override`, `is_active`, `created_at`, `updated_at`)
VALUES
    (UUID(), 'STRIPE', '["US","CA","GB","AU","SG","JP","DE","FR","IE","NL","AT","BE","ES","IT"]', '["CREDIT_CARD","DEBIT_CARD","BANK_TRANSFER","DIGITAL_WALLET"]', '{"fixed":0.30,"percentage":2.9}', NULL, TRUE, NOW(), NOW()),
    (UUID(), 'PAYPAL', '["US","CA","GB","AU","DE","FR","JP","CN","BR","MX","IN"]', '["PAYPAL","CREDIT_CARD","BANK_TRANSFER"]', '{"fixed":0.49,"percentage":3.49}', NULL, TRUE, NOW(), NOW()),
    (UUID(), 'WISE', '["GB","US","AU","NZ","SG","JP","CA","EU"]', '["BANK_TRANSFER","DEBIT_CARD"]', '{"fixed":0.0,"percentage":0.71}', NULL, TRUE, NOW(), NOW()),
    (UUID(), 'FLUTTERWAVE', '["NG","KE","GH","ZA","TZ","UG","RW","SN","CM","CI","BW"]', '["MOBILE_MONEY","CARD","BANK_TRANSFER","USSD"]', '{"fixed":0.0,"percentage":1.4}', NULL, TRUE, NOW(), NOW()),
    (UUID(), 'RAZORPAY', '["IN","BD","LK","AF"]', '["CARD","UPI","BANK_TRANSFER","MOBILE_MONEY","WALLET"]', '{"fixed":0.0,"percentage":2.0}', NULL, TRUE, NOW(), NOW()),
    (UUID(), 'MPESA', '["KE","TZ","UG","RW","DZ"]', '["MOBILE_MONEY"]', '{"fixed":0.0,"percentage":2.5}', NULL, TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    `countries` = VALUES(`countries`),
    `payment_types` = VALUES(`payment_types`),
    `fees` = VALUES(`fees`),
    `settings_override` = VALUES(`settings_override`),
    `is_active` = VALUES(`is_active`),
    `updated_at` = NOW();

CREATE OR REPLACE VIEW `payment_audit_summary` AS
SELECT
    DATE(`created_at`) AS `audit_date`,
    COUNT(*) AS `total_transactions`,
    SUM(CASE WHEN `is_successful` = true THEN 1 ELSE 0 END) AS `successful_count`,
    SUM(CASE WHEN `is_successful` = false THEN 1 ELSE 0 END) AS `failed_count`,
    SUM(CASE WHEN `risk_level` IN ('HIGH', 'CRITICAL') THEN 1 ELSE 0 END) AS `suspicious_count`,
    SUM(`amount`) AS `total_amount`,
    AVG(`fraud_score`) AS `avg_fraud_score`
FROM `payment_audit_logs`
GROUP BY DATE(`created_at`);

CREATE OR REPLACE VIEW `session_audit_summary` AS
SELECT
    `user_id`,
    DATE(`created_at`) AS `session_date`,
    COUNT(*) AS `session_count`,
    SUM(CASE WHEN `action` = 'LOGIN' THEN 1 ELSE 0 END) AS `login_count`,
    SUM(CASE WHEN `action` = 'SUSPICIOUS_ACTIVITY' THEN 1 ELSE 0 END) AS `suspicious_count`
FROM `session_audit_logs`
GROUP BY `user_id`, DATE(`created_at`);

-- =========================
-- livegate_python
-- =========================
USE livegate_python;

CREATE TABLE IF NOT EXISTS `analytics_snapshots` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `snapshot_type` VARCHAR(64) NOT NULL,
    `payload` JSON NOT NULL,
    `generated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_analytics_snapshots_type_generated` (`snapshot_type`, `generated_at`)
);

CREATE TABLE IF NOT EXISTS `recommendation_snapshots` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `subject_id` VARCHAR(191) NOT NULL,
    `recommendation_scope` VARCHAR(64) NOT NULL,
    `payload` JSON NOT NULL,
    `generated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_recommendation_snapshots_scope_generated` (`recommendation_scope`, `generated_at`),
    INDEX `idx_recommendation_snapshots_subject_scope_generated` (`subject_id`, `recommendation_scope`, `generated_at`)
);

CREATE TABLE IF NOT EXISTS `ranking_snapshots` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `ranking_scope` VARCHAR(64) NOT NULL,
    `subject_id` VARCHAR(191) NULL,
    `payload` JSON NOT NULL,
    `generated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_ranking_snapshots_scope_generated` (`ranking_scope`, `generated_at`),
    INDEX `idx_ranking_snapshots_subject_generated` (`subject_id`, `generated_at`)
);

CREATE TABLE IF NOT EXISTS `trend_snapshots` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `trend_scope` VARCHAR(64) NOT NULL,
    `period_key` VARCHAR(64) NOT NULL,
    `payload` JSON NOT NULL,
    `generated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_trend_snapshots_scope_period_generated` (`trend_scope`, `period_key`, `generated_at`)
);

CREATE TABLE IF NOT EXISTS `creator_insight_snapshots` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `creator_id` VARCHAR(191) NOT NULL,
    `insight_type` VARCHAR(64) NOT NULL,
    `payload` JSON NOT NULL,
    `generated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_creator_insight_creator_type_generated` (`creator_id`, `insight_type`, `generated_at`)
);

CREATE TABLE IF NOT EXISTS `fraud_events` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `event_type` VARCHAR(64) NOT NULL,
    `risk_score` DECIMAL(5,2) NOT NULL,
    `decision` VARCHAR(32) NOT NULL,
    `payload` JSON NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_fraud_events_type_created` (`event_type`, `created_at`)
);

CREATE TABLE IF NOT EXISTS `moderation_events` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `content_type` VARCHAR(64) NOT NULL,
    `risk_score` DECIMAL(5,2) NOT NULL,
    `severity` VARCHAR(32) NOT NULL,
    `payload` JSON NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_moderation_events_type_created` (`content_type`, `created_at`)
);

CREATE TABLE IF NOT EXISTS `job_runs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `job_name` VARCHAR(128) NOT NULL,
    `status` VARCHAR(32) NOT NULL,
    `details` JSON NULL,
    `started_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `finished_at` TIMESTAMP NULL,
    INDEX `idx_job_runs_name_started` (`job_name`, `started_at`)
);
