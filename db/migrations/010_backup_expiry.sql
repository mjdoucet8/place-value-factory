ALTER TABLE pvf_operations_audit ADD COLUMN backup_expiry_at TIMESTAMPTZ;
CREATE INDEX pvf_operations_audit_backup_expiry ON pvf_operations_audit(backup_expiry_at) WHERE backup_expiry_at IS NOT NULL;
