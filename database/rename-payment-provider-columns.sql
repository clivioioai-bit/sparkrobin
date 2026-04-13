-- Normalize provider-specific payment column names.
-- Safe to run multiple times.

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS external_payment_id VARCHAR(255);

UPDATE payments
SET external_payment_id = COALESCE(external_payment_id, creem_payment_id, payment_id)
WHERE external_payment_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_payments_external_payment_id
ON payments(external_payment_id);

COMMENT ON COLUMN payments.external_payment_id IS 'Canonical external payment identifier from the payment provider';

-- Optional cleanup after application rollout and verification:
-- ALTER TABLE payments DROP COLUMN creem_payment_id;
