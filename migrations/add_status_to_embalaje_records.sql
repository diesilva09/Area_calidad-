ALTER TABLE embalaje_records
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed'));

CREATE INDEX IF NOT EXISTS idx_embalaje_records_status ON embalaje_records(status);

UPDATE embalaje_records
SET status = 'completed'
WHERE status IS NULL;
