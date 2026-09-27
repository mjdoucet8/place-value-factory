-- Derived response facts only. Immutable questions/answers remain authoritative.
CREATE TABLE pvf_report_order (
  order_id TEXT PRIMARY KEY REFERENCES pvf_order(id) ON DELETE CASCADE,
  response_n INTEGER NOT NULL CHECK(response_n > 0),
  first_at TIMESTAMPTZ NOT NULL,
  first_sequence INTEGER NOT NULL,
  last_at TIMESTAMPTZ NOT NULL,
  first_objective BOOLEAN NOT NULL,
  first_value BOOLEAN NOT NULL,
  accepted BOOLEAN NOT NULL,
  change_id UUID NOT NULL DEFAULT gen_random_uuid()
);

CREATE FUNCTION pvf_refresh_report_order(selected_order TEXT) RETURNS VOID LANGUAGE sql AS $$
  DELETE FROM pvf_report_order WHERE order_id=selected_order;
  INSERT INTO pvf_report_order(order_id,response_n,first_at,first_sequence,last_at,first_objective,first_value,accepted)
  SELECT order_id,count(*)::int,min(committed_at),
    (array_agg(sequence ORDER BY committed_at,sequence))[1],max(committed_at),
    (array_agg((validation->>'objectiveMet')::boolean ORDER BY committed_at,sequence))[1],
    (array_agg((validation->>'valueMatches')::boolean ORDER BY committed_at,sequence))[1],
    bool_or((validation->>'shipmentAccepted')::boolean)
  FROM pvf_response WHERE order_id=selected_order GROUP BY order_id;
$$;

CREATE FUNCTION pvf_track_report_response() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO pvf_report_order AS f(order_id,response_n,first_at,first_sequence,last_at,first_objective,first_value,accepted)
    VALUES(NEW.order_id,1,NEW.committed_at,NEW.sequence,NEW.committed_at,
      (NEW.validation->>'objectiveMet')::boolean,(NEW.validation->>'valueMatches')::boolean,(NEW.validation->>'shipmentAccepted')::boolean)
    ON CONFLICT(order_id) DO UPDATE SET response_n=f.response_n+1,change_id=gen_random_uuid(),
      first_objective=CASE WHEN (EXCLUDED.first_at,EXCLUDED.first_sequence)<(f.first_at,f.first_sequence) THEN EXCLUDED.first_objective ELSE f.first_objective END,
      first_value=CASE WHEN (EXCLUDED.first_at,EXCLUDED.first_sequence)<(f.first_at,f.first_sequence) THEN EXCLUDED.first_value ELSE f.first_value END,
      first_sequence=CASE WHEN (EXCLUDED.first_at,EXCLUDED.first_sequence)<(f.first_at,f.first_sequence) THEN EXCLUDED.first_sequence ELSE f.first_sequence END,
      first_at=least(f.first_at,EXCLUDED.first_at),last_at=greatest(f.last_at,EXCLUDED.last_at),accepted=f.accepted OR EXCLUDED.accepted;
    RETURN NEW;
  END IF;
  PERFORM pvf_refresh_report_order(OLD.order_id);
  IF TG_OP='UPDATE' AND NEW.order_id<>OLD.order_id THEN
    PERFORM pvf_refresh_report_order(NEW.order_id);
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER pvf_report_response_changed AFTER INSERT OR UPDATE OR DELETE ON pvf_response
  FOR EACH ROW EXECUTE FUNCTION pvf_track_report_response();

-- Backfill and administrator rebuild use the same authoritative aggregation.
-- SHARE locks apply only to explicit rebuild maintenance, not request handling.
CREATE FUNCTION pvf_rebuild_report_orders() RETURNS BIGINT LANGUAGE plpgsql AS $$
DECLARE rebuilt BIGINT;
BEGIN
  LOCK TABLE pvf_response IN SHARE MODE;
  DELETE FROM pvf_report_order;
  INSERT INTO pvf_report_order(order_id,response_n,first_at,first_sequence,last_at,first_objective,first_value,accepted)
  SELECT order_id,count(*)::int,min(committed_at),
    (array_agg(sequence ORDER BY committed_at,sequence))[1],max(committed_at),
    (array_agg((validation->>'objectiveMet')::boolean ORDER BY committed_at,sequence))[1],
    (array_agg((validation->>'valueMatches')::boolean ORDER BY committed_at,sequence))[1],
    bool_or((validation->>'shipmentAccepted')::boolean)
  FROM pvf_response GROUP BY order_id;
  GET DIAGNOSTICS rebuilt = ROW_COUNT;
  RETURN rebuilt;
END;
$$;
SELECT pvf_rebuild_report_orders();
CREATE INDEX pvf_order_student_history ON pvf_order(student_id,attempt_id,id);
CREATE INDEX pvf_response_objective_miss ON pvf_response(order_id) WHERE NOT (validation->>'objectiveMet')::boolean;
