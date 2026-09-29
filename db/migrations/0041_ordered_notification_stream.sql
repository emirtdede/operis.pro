CREATE TABLE notification_stream_counters (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_sequence bigint NOT NULL DEFAULT 0
);
ALTER TABLE notification_stream_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ADD COLUMN stream_sequence bigint;
--> statement-breakpoint
-- The migration runner wraps migrations in a transaction. Block writers during the
-- short backfill/trigger handover: old binaries are covered by the same trigger.
LOCK TABLE notifications IN ACCESS EXCLUSIVE MODE;
WITH numbered AS (
 SELECT id,row_number() OVER (PARTITION BY user_id ORDER BY created_at,id) AS seq FROM notifications
)
UPDATE notifications n SET stream_sequence=numbered.seq FROM numbered WHERE n.id=numbered.id;
INSERT INTO notification_stream_counters(user_id,last_sequence)
SELECT user_id,max(stream_sequence) FROM notifications GROUP BY user_id;
CREATE UNIQUE INDEX notifications_user_sequence_idx ON notifications(user_id,stream_sequence);
--> statement-breakpoint
CREATE FUNCTION allocate_notification_sequence() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE existing_sequence bigint;
BEGIN
  INSERT INTO notification_stream_counters(user_id) VALUES(NEW.user_id) ON CONFLICT DO NOTHING;
  PERFORM 1 FROM notification_stream_counters WHERE user_id=NEW.user_id FOR UPDATE;
  IF NEW.delivery_key IS NOT NULL THEN
    SELECT stream_sequence INTO existing_sequence FROM notifications
    WHERE delivery_key=NEW.delivery_key AND user_id=NEW.user_id;
    IF FOUND THEN NEW.stream_sequence:=existing_sequence; RETURN NEW; END IF;
  END IF;
  UPDATE notification_stream_counters SET last_sequence=last_sequence+1
  WHERE user_id=NEW.user_id RETURNING last_sequence INTO NEW.stream_sequence;
  RETURN NEW;
END $$;
CREATE TRIGGER notifications_assign_sequence BEFORE INSERT ON notifications
FOR EACH ROW EXECUTE FUNCTION allocate_notification_sequence();
ALTER TABLE notifications ALTER COLUMN stream_sequence SET DEFAULT 0;
ALTER TABLE notifications ALTER COLUMN stream_sequence SET NOT NULL;
