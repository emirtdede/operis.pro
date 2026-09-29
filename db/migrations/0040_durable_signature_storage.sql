CREATE TABLE signature_storage_jobs (
  key text PRIMARY KEY, engagement_id uuid NOT NULL, package_id uuid, package_version integer,
  status text NOT NULL DEFAULT 'UPLOADING', attempt_count integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(), lease_token uuid, lease_until timestamptz,
  last_error text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX signature_storage_due_idx ON signature_storage_jobs(status,next_attempt_at);
ALTER TABLE signature_storage_jobs ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
INSERT INTO signature_storage_jobs(key,engagement_id,package_id,package_version,status)
SELECT key,p.engagement_id,p.id,p.version,CASE WHEN p.status='FULLY_SIGNED' THEN 'PENDING' ELSE 'ATTACHED' END
FROM engagement_contract_packages p CROSS JOIN LATERAL
unnest(ARRAY[p.client_signature_r2_key,p.freelancer_signature_r2_key]) key
WHERE key IS NOT NULL ON CONFLICT DO NOTHING;
--> statement-breakpoint
CREATE FUNCTION track_signature_storage() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE object_key text; previous_keys text[]; current_keys text[];
BEGIN
  IF TG_OP='DELETE' THEN
    UPDATE signature_storage_jobs SET status='PENDING',next_attempt_at=now(),lease_token=NULL,lease_until=NULL
    WHERE key=ANY(ARRAY[OLD.client_signature_r2_key,OLD.freelancer_signature_r2_key]);
    RETURN OLD;
  END IF;
  current_keys := array_remove(ARRAY[NEW.client_signature_r2_key,NEW.freelancer_signature_r2_key],NULL);
  previous_keys := CASE WHEN TG_OP='UPDATE' THEN array_remove(ARRAY[OLD.client_signature_r2_key,OLD.freelancer_signature_r2_key],NULL) ELSE ARRAY[]::text[] END;
  FOREACH object_key IN ARRAY current_keys LOOP
    IF NOT object_key=ANY(previous_keys) THEN
      UPDATE signature_storage_jobs SET status='ATTACHED',package_id=NEW.id,package_version=NEW.version,
        lease_token=NULL,lease_until=NULL
      WHERE key=object_key AND engagement_id=NEW.engagement_id AND status='UPLOADING';
      IF NOT FOUND THEN RAISE EXCEPTION 'Signature upload intent unavailable'; END IF;
    END IF;
  END LOOP;
  UPDATE signature_storage_jobs SET status='PENDING',next_attempt_at=now(),lease_token=NULL,lease_until=NULL
    WHERE key=ANY(previous_keys) AND NOT key=ANY(current_keys);
  IF NEW.status='FULLY_SIGNED' AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    UPDATE signature_storage_jobs SET status='PENDING',package_id=NEW.id,package_version=NEW.version,
      next_attempt_at=now(),lease_token=NULL,lease_until=NULL WHERE key=ANY(current_keys);
    NEW.ephemeral_cleaned_at := NULL;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER contract_signature_storage BEFORE INSERT OR UPDATE OR DELETE ON engagement_contract_packages
FOR EACH ROW EXECUTE FUNCTION track_signature_storage();
