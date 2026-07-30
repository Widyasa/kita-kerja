-- Close anon/PUBLIC execute hole on trust-aggregate RPCs.
-- Postgres grants EXECUTE to PUBLIC by default on function creation; the prior
-- migration granted to `authenticated` but never revoked the PUBLIC default,
-- so unauthenticated (anon) callers could enumerate any user's derived
-- trust/reputation aggregates. These functions take a plain uuid and never
-- check auth.uid() internally, so PUBLIC execute must be revoked explicitly.

REVOKE EXECUTE ON FUNCTION rekam_jejak_pemberi(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION rekam_jejak_pekerja(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION lapis_keahlian_pekerja(uuid) FROM PUBLIC;

-- Supabase also grants EXECUTE to `anon` directly via ALTER DEFAULT PRIVILEGES
-- on the public schema, independent of the PUBLIC pseudo-role. Verified live
-- that REVOKE ... FROM PUBLIC alone left anon with EXECUTE, so it must be
-- revoked explicitly here too.
REVOKE EXECUTE ON FUNCTION rekam_jejak_pemberi(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION rekam_jejak_pekerja(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION lapis_keahlian_pekerja(uuid) FROM anon;
