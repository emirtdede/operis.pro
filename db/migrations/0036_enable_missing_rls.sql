-- Migration 0036: Enable RLS and lockdown PostgREST access on 5 neglected public tables
-- Fixes HIGH-002 from Operis Production Critical Audit

ALTER TABLE "public"."offer_counter_proposals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."engagement_reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."engagement_handovers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."engagement_contract_packages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."search_trends" ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
	tbl text;
	new_tables text[] := ARRAY[
		'offer_counter_proposals',
		'engagement_reviews',
		'engagement_handovers',
		'engagement_contract_packages',
		'search_trends'
	];
BEGIN
	IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
		FOREACH tbl IN ARRAY new_tables LOOP
			EXECUTE format('GRANT ALL ON TABLE "public".%I TO service_role;', tbl);
			EXECUTE format('DROP POLICY IF EXISTS "service_role_manage_all" ON "public".%I;', tbl);
			EXECUTE format('CREATE POLICY "service_role_manage_all" ON "public".%I FOR ALL TO service_role USING (true) WITH CHECK (true);', tbl);
		END LOOP;
	END IF;

	IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
		FOREACH tbl IN ARRAY new_tables LOOP
			EXECUTE format('REVOKE ALL ON TABLE "public".%I FROM anon;', tbl);
		END LOOP;
	END IF;

	IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
		FOREACH tbl IN ARRAY new_tables LOOP
			EXECUTE format('REVOKE ALL ON TABLE "public".%I FROM authenticated;', tbl);
		END LOOP;
	END IF;
END $$;
