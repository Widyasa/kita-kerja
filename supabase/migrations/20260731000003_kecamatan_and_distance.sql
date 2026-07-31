-- supabase/migrations/20260731000003_kecamatan_and_distance.sql
-- Kecamatan-centroid table for offline distance approximation (ADR-0002).
-- No live geocoding call — workers and employers pick from a seeded list.

CREATE TABLE IF NOT EXISTS kecamatan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  wilayah_id uuid NOT NULL REFERENCES wilayah(id) ON DELETE CASCADE,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  UNIQUE (nama, wilayah_id)
);

ALTER TABLE lowongan ADD COLUMN IF NOT EXISTS kecamatan_id uuid REFERENCES kecamatan(id);
ALTER TABLE pengguna ADD COLUMN IF NOT EXISTS kecamatan_id uuid REFERENCES kecamatan(id);

-- Publicly readable list, same as wilayah/keahlian_baku — no RLS needed
-- (matches the existing no-RLS pattern on reference/taxonomy tables).

CREATE INDEX IF NOT EXISTS idx_kecamatan_wilayah ON kecamatan(wilayah_id);
