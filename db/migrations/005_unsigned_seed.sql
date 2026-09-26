-- V1 xorshift seeds use the full nonzero uint32 range (up to 4,294,967,295).
ALTER TABLE pvf_attempt ALTER COLUMN seed TYPE BIGINT;
