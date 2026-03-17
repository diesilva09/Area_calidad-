-- Migration: Add status column to production_records table
-- Date: 2026-02-03

-- Add status column to production_records table
ALTER TABLE production_records 
ADD COLUMN status VARCHAR(20) DEFAULT 'completed';

-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_production_records_status ON production_records(status);

-- Update existing records to have 'completed' status by default
UPDATE production_records 
SET status = 'completed' 
WHERE status IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN production_records.status IS 'Status of the production record: pending or completed';
