ALTER TABLE payout_requests
    ADD COLUMN hold_until TIMESTAMP NULL AFTER requested_at;

CREATE INDEX idx_payout_requests_hold_until
    ON payout_requests (hold_until);
