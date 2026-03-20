CREATE TABLE IF NOT EXISTS payment_transactions (
    id VARCHAR(64) PRIMARY KEY,
    idempotency_key VARCHAR(128) NOT NULL,
    provider_reference VARCHAR(128) NOT NULL,
    buyer_id VARCHAR(64) NOT NULL,
    creator_id VARCHAR(64) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    target_id VARCHAR(64) NOT NULL,
    gross_amount DECIMAL(19,2) NOT NULL,
    platform_commission_amount DECIMAL(19,2) NOT NULL,
    creator_share_amount DECIMAL(19,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(32) NOT NULL,
    recorded_at TIMESTAMP NOT NULL,
    creator_funds_released_at TIMESTAMP NULL,
    CONSTRAINT uq_payment_transactions_idempotency UNIQUE (idempotency_key),
    CONSTRAINT uq_payment_transactions_provider_reference UNIQUE (provider_reference),
    CONSTRAINT chk_payment_transactions_amounts_non_negative CHECK (
        gross_amount >= 0 AND
        platform_commission_amount >= 0 AND
        creator_share_amount >= 0
    ),
    CONSTRAINT chk_payment_transactions_split CHECK (
        platform_commission_amount + creator_share_amount = gross_amount
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS commission_records (
    id VARCHAR(64) PRIMARY KEY,
    payment_transaction_id VARCHAR(64) NOT NULL,
    platform_rate DECIMAL(5,4) NOT NULL,
    creator_rate DECIMAL(5,4) NOT NULL,
    platform_amount DECIMAL(19,2) NOT NULL,
    creator_amount DECIMAL(19,2) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_commission_records_payment_transaction UNIQUE (payment_transaction_id),
    CONSTRAINT chk_commission_records_rates CHECK (
        platform_rate >= 0 AND
        creator_rate >= 0 AND
        platform_rate + creator_rate = 1.0000
    ),
    CONSTRAINT chk_commission_records_amounts_non_negative CHECK (
        platform_amount >= 0 AND
        creator_amount >= 0
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS creator_wallets (
    creator_id VARCHAR(64) PRIMARY KEY,
    currency VARCHAR(3) NOT NULL,
    pending_balance DECIMAL(19,2) NOT NULL,
    available_balance DECIMAL(19,2) NOT NULL,
    lifetime_gross DECIMAL(19,2) NOT NULL,
    lifetime_platform_commission DECIMAL(19,2) NOT NULL,
    lifetime_creator_earnings DECIMAL(19,2) NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT chk_creator_wallets_balances_non_negative CHECK (
        pending_balance >= 0 AND
        available_balance >= 0 AND
        lifetime_gross >= 0 AND
        lifetime_platform_commission >= 0 AND
        lifetime_creator_earnings >= 0
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wallet_ledger_entries (
    id VARCHAR(64) PRIMARY KEY,
    creator_id VARCHAR(64) NOT NULL,
    payment_transaction_id VARCHAR(64) NULL,
    payout_request_id VARCHAR(64) NULL,
    refund_id VARCHAR(64) NULL,
    adjustment_id VARCHAR(64) NULL,
    entry_type VARCHAR(64) NOT NULL,
    balance_bucket VARCHAR(32) NOT NULL,
    direction VARCHAR(32) NOT NULL,
    amount DECIMAL(19,2) NOT NULL,
    balance_after DECIMAL(19,2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT chk_wallet_ledger_entries_amounts_non_negative CHECK (
        amount >= 0 AND balance_after >= 0
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payout_requests (
    id VARCHAR(64) PRIMARY KEY,
    creator_id VARCHAR(64) NOT NULL,
    amount DECIMAL(19,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(32) NOT NULL,
    requested_at TIMESTAMP NOT NULL,
    approved_at TIMESTAMP NULL,
    rejected_at TIMESTAMP NULL,
    processed_at TIMESTAMP NULL,
    rejection_reason VARCHAR(500) NULL,
    CONSTRAINT chk_payout_requests_amount_positive CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payout_transactions (
    id VARCHAR(64) PRIMARY KEY,
    payout_request_id VARCHAR(64) NOT NULL,
    creator_id VARCHAR(64) NOT NULL,
    amount DECIMAL(19,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    provider_reference VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL,
    processed_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_payout_transactions_payout_request UNIQUE (payout_request_id),
    CONSTRAINT uq_payout_transactions_provider_reference UNIQUE (provider_reference),
    CONSTRAINT chk_payout_transactions_amount_positive CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS refunds (
    id VARCHAR(64) PRIMARY KEY,
    payment_transaction_id VARCHAR(64) NOT NULL,
    creator_id VARCHAR(64) NOT NULL,
    amount DECIMAL(19,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(32) NOT NULL,
    reason VARCHAR(500) NOT NULL,
    processed_at TIMESTAMP NOT NULL,
    CONSTRAINT chk_refunds_amount_positive CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS adjustments (
    id VARCHAR(64) PRIMARY KEY,
    creator_id VARCHAR(64) NOT NULL,
    payment_transaction_id VARCHAR(64) NULL,
    amount DECIMAL(19,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    type VARCHAR(64) NOT NULL,
    reason VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT chk_adjustments_amount_positive CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reconciliation_reports (
    id VARCHAR(64) PRIMARY KEY,
    report_date DATE NOT NULL,
    gross_revenue DECIMAL(19,2) NOT NULL,
    platform_commission DECIMAL(19,2) NOT NULL,
    creator_earnings DECIMAL(19,2) NOT NULL,
    total_transactions BIGINT NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_reconciliation_reports_report_date UNIQUE (report_date),
    CONSTRAINT chk_reconciliation_reports_amounts_non_negative CHECK (
        gross_revenue >= 0 AND
        platform_commission >= 0 AND
        creator_earnings >= 0 AND
        total_transactions >= 0
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    actor_id VARCHAR(64) NOT NULL,
    actor_type VARCHAR(32) NOT NULL,
    action VARCHAR(128) NOT NULL,
    resource_type VARCHAR(128) NOT NULL,
    resource_id VARCHAR(64) NOT NULL,
    details_json TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE commission_records
    ADD CONSTRAINT fk_commission_records_payment_transaction
    FOREIGN KEY (payment_transaction_id) REFERENCES payment_transactions(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE wallet_ledger_entries
    ADD CONSTRAINT fk_wallet_ledger_entries_creator_wallet
    FOREIGN KEY (creator_id) REFERENCES creator_wallets(creator_id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE wallet_ledger_entries
    ADD CONSTRAINT fk_wallet_ledger_entries_payment_transaction
    FOREIGN KEY (payment_transaction_id) REFERENCES payment_transactions(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE wallet_ledger_entries
    ADD CONSTRAINT fk_wallet_ledger_entries_payout_request
    FOREIGN KEY (payout_request_id) REFERENCES payout_requests(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE payout_transactions
    ADD CONSTRAINT fk_payout_transactions_payout_request
    FOREIGN KEY (payout_request_id) REFERENCES payout_requests(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE refunds
    ADD CONSTRAINT fk_refunds_payment_transaction
    FOREIGN KEY (payment_transaction_id) REFERENCES payment_transactions(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE adjustments
    ADD CONSTRAINT fk_adjustments_payment_transaction
    FOREIGN KEY (payment_transaction_id) REFERENCES payment_transactions(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE wallet_ledger_entries
    ADD CONSTRAINT fk_wallet_ledger_entries_refund
    FOREIGN KEY (refund_id) REFERENCES refunds(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE wallet_ledger_entries
    ADD CONSTRAINT fk_wallet_ledger_entries_adjustment
    FOREIGN KEY (adjustment_id) REFERENCES adjustments(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX idx_payment_transactions_creator_recorded
    ON payment_transactions (creator_id, recorded_at);

CREATE INDEX idx_payment_transactions_buyer_recorded
    ON payment_transactions (buyer_id, recorded_at);

CREATE INDEX idx_payment_transactions_target
    ON payment_transactions (target_type, target_id);

CREATE INDEX idx_payment_transactions_status_recorded
    ON payment_transactions (status, recorded_at);

CREATE INDEX idx_commission_records_created
    ON commission_records (created_at);

CREATE INDEX idx_wallet_ledger_entries_creator_created
    ON wallet_ledger_entries (creator_id, created_at);

CREATE INDEX idx_wallet_ledger_entries_payment_transaction
    ON wallet_ledger_entries (payment_transaction_id);

CREATE INDEX idx_wallet_ledger_entries_payout_request
    ON wallet_ledger_entries (payout_request_id);

CREATE INDEX idx_wallet_ledger_entries_refund
    ON wallet_ledger_entries (refund_id);

CREATE INDEX idx_wallet_ledger_entries_adjustment
    ON wallet_ledger_entries (adjustment_id);

CREATE INDEX idx_payout_requests_creator_status_requested
    ON payout_requests (creator_id, status, requested_at);

CREATE INDEX idx_payout_transactions_creator_processed
    ON payout_transactions (creator_id, processed_at);

CREATE INDEX idx_refunds_payment_processed
    ON refunds (payment_transaction_id, processed_at);

CREATE INDEX idx_refunds_creator_processed
    ON refunds (creator_id, processed_at);

CREATE INDEX idx_adjustments_creator_created
    ON adjustments (creator_id, created_at);

CREATE INDEX idx_reconciliation_reports_status_date
    ON reconciliation_reports (status, report_date);

CREATE INDEX idx_audit_resource_created
    ON audit_logs (resource_type, resource_id, created_at);

CREATE INDEX idx_audit_actor_created
    ON audit_logs (actor_id, created_at);

CREATE INDEX idx_audit_action_created
    ON audit_logs (action, created_at);
