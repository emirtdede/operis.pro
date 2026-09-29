ALTER TABLE users ADD COLUMN sessions_invalid_before timestamptz;
--> statement-breakpoint
CREATE TABLE clerk_revocation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clerk_user_id text NOT NULL, auth_version integer NOT NULL, cutoff timestamptz NOT NULL,
  preserve_session_id text,
  status text NOT NULL DEFAULT 'PENDING', attempt_count integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(), lease_token uuid, lease_until timestamptz,
  last_error text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX clerk_revocation_user_version_idx ON clerk_revocation_jobs(user_id, auth_version);
CREATE INDEX clerk_revocation_due_idx ON clerk_revocation_jobs(status, next_attempt_at);
ALTER TABLE clerk_revocation_jobs ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
-- All auth-version writers, including 2FA/admin/privacy, share this atomic boundary.
CREATE FUNCTION queue_clerk_security_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.auth_version IS DISTINCT FROM OLD.auth_version THEN
    IF NEW.auth_version <= OLD.auth_version THEN
      RAISE EXCEPTION 'auth_version must increase';
    END IF;
    NEW.sessions_invalid_before := clock_timestamp();
    IF NEW.clerk_user_id IS NOT NULL THEN
      INSERT INTO clerk_revocation_jobs(user_id, clerk_user_id, auth_version, cutoff)
      VALUES (NEW.id, NEW.clerk_user_id, NEW.auth_version, NEW.sessions_invalid_before);
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER users_security_change BEFORE UPDATE OF auth_version ON users
FOR EACH ROW EXECUTE FUNCTION queue_clerk_security_change();
--> statement-breakpoint
-- Conservative upgrade: historical security changes have no trustworthy cutoff.
UPDATE users SET sessions_invalid_before = clock_timestamp() WHERE auth_version > 1;
INSERT INTO clerk_revocation_jobs(user_id, clerk_user_id, auth_version, cutoff)
SELECT id, clerk_user_id, auth_version, sessions_invalid_before FROM users
WHERE auth_version > 1 AND clerk_user_id IS NOT NULL;
