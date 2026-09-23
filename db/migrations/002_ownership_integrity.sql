-- Preserve existing records while making ownership a database invariant.
ALTER TABLE pvf_attempt ADD CONSTRAINT pvf_attempt_owner UNIQUE (id, student_id);
ALTER TABLE pvf_order ADD COLUMN student_id TEXT;
UPDATE pvf_order AS orders SET student_id = attempts.student_id
  FROM pvf_attempt AS attempts WHERE orders.attempt_id = attempts.id;
ALTER TABLE pvf_order ALTER COLUMN student_id SET NOT NULL;
ALTER TABLE pvf_order ADD CONSTRAINT pvf_order_attempt_owner
  FOREIGN KEY (attempt_id, student_id) REFERENCES pvf_attempt(id, student_id) ON DELETE CASCADE;
ALTER TABLE pvf_order ADD CONSTRAINT pvf_order_owner UNIQUE (id, student_id);
ALTER TABLE pvf_skill_evidence ADD CONSTRAINT pvf_evidence_order_owner
  FOREIGN KEY (order_id, student_id) REFERENCES pvf_order(id, student_id) ON DELETE CASCADE;
