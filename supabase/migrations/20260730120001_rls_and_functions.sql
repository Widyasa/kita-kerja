-- RLS policies and selesaikan_pekerjaan function (PROMPT Bagian 7)
-- Note: pekerjaan rows are only mutated via the security-definer function
-- selesaikan_pekerjaan; no direct INSERT/UPDATE/DELETE policies exist for it.

-- Enable RLS
ALTER TABLE pengguna ENABLE ROW LEVEL SECURITY;
ALTER TABLE kartu_kerja ENABLE ROW LEVEL SECURITY;
ALTER TABLE kartu_keahlian ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesi_wawancara ENABLE ROW LEVEL SECURITY;
ALTER TABLE lowongan ENABLE ROW LEVEL SECURITY;
ALTER TABLE lowongan_keahlian ENABLE ROW LEVEL SECURITY;
ALTER TABLE saringan_aman ENABLE ROW LEVEL SECURITY;
ALTER TABLE lamaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE kesepakatan_kerja ENABLE ROW LEVEL SECURITY;
ALTER TABLE pekerjaan ENABLE ROW LEVEL SECURITY;
ALTER TABLE penilaian ENABLE ROW LEVEL SECURITY;
ALTER TABLE lapor_upah ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_ai ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to allow re-run during local reset
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'pengguna','kartu_kerja','kartu_keahlian','sesi_wawancara',
        'lowongan','lowongan_keahlian','saringan_aman','lamaran',
        'kesepakatan_kerja','pekerjaan','penilaian','lapor_upah','log_ai'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- pengguna
CREATE POLICY "pengguna_select_own" ON pengguna FOR SELECT USING (auth.uid() = id);
CREATE POLICY "pengguna_update_own" ON pengguna FOR UPDATE USING (auth.uid() = id);

-- kartu_kerja
CREATE POLICY "kartu_kerja_select_own" ON kartu_kerja FOR SELECT USING (auth.uid() = pekerja_id);
CREATE POLICY "kartu_kerja_insert_own" ON kartu_kerja FOR INSERT WITH CHECK (auth.uid() = pekerja_id);
CREATE POLICY "kartu_kerja_update_own" ON kartu_kerja FOR UPDATE USING (auth.uid() = pekerja_id);
CREATE POLICY "kartu_kerja_delete_own" ON kartu_kerja FOR DELETE USING (auth.uid() = pekerja_id);

-- kartu_keahlian (via kartu_kerja ownership)
CREATE POLICY "kartu_keahlian_select_own" ON kartu_keahlian FOR SELECT USING (
  EXISTS (SELECT 1 FROM kartu_kerja WHERE kartu_kerja.id = kartu_keahlian.kartu_id AND kartu_kerja.pekerja_id = auth.uid())
);
CREATE POLICY "kartu_keahlian_insert_own" ON kartu_keahlian FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM kartu_kerja WHERE kartu_kerja.id = kartu_keahlian.kartu_id AND kartu_kerja.pekerja_id = auth.uid())
);
CREATE POLICY "kartu_keahlian_update_own" ON kartu_keahlian FOR UPDATE USING (
  EXISTS (SELECT 1 FROM kartu_kerja WHERE kartu_kerja.id = kartu_keahlian.kartu_id AND kartu_kerja.pekerja_id = auth.uid())
);
CREATE POLICY "kartu_keahlian_delete_own" ON kartu_keahlian FOR DELETE USING (
  EXISTS (SELECT 1 FROM kartu_kerja WHERE kartu_kerja.id = kartu_keahlian.kartu_id AND kartu_kerja.pekerja_id = auth.uid())
);

-- sesi_wawancara
CREATE POLICY "sesi_wawancara_own" ON sesi_wawancara FOR ALL USING (auth.uid() = pekerja_id);

-- lowongan
CREATE POLICY "lowongan_select_public" ON lowongan FOR SELECT USING (status = 'tayang');
CREATE POLICY "lowongan_select_own" ON lowongan FOR SELECT USING (auth.uid() = pemberi_kerja_id);
CREATE POLICY "lowongan_insert_own" ON lowongan FOR INSERT WITH CHECK (auth.uid() = pemberi_kerja_id);
CREATE POLICY "lowongan_update_own" ON lowongan FOR UPDATE USING (auth.uid() = pemberi_kerja_id);
CREATE POLICY "lowongan_delete_own" ON lowongan FOR DELETE USING (auth.uid() = pemberi_kerja_id);

-- lowongan_keahlian
CREATE POLICY "lowongan_keahlian_select_public" ON lowongan_keahlian FOR SELECT USING (
  EXISTS (SELECT 1 FROM lowongan WHERE lowongan.id = lowongan_keahlian.lowongan_id AND lowongan.status = 'tayang')
);
CREATE POLICY "lowongan_keahlian_own" ON lowongan_keahlian FOR ALL USING (
  EXISTS (SELECT 1 FROM lowongan WHERE lowongan.id = lowongan_keahlian.lowongan_id AND lowongan.pemberi_kerja_id = auth.uid())
);

-- saringan_aman
CREATE POLICY "saringan_aman_select_public" ON saringan_aman FOR SELECT USING (
  EXISTS (SELECT 1 FROM lowongan WHERE lowongan.id = saringan_aman.lowongan_id AND lowongan.status = 'tayang')
);
CREATE POLICY "saringan_aman_own" ON saringan_aman FOR ALL USING (
  EXISTS (SELECT 1 FROM lowongan WHERE lowongan.id = saringan_aman.lowongan_id AND lowongan.pemberi_kerja_id = auth.uid())
);

-- lamaran
CREATE POLICY "lamaran_select_pekerja" ON lamaran FOR SELECT USING (auth.uid() = pekerja_id);
CREATE POLICY "lamaran_select_employer" ON lamaran FOR SELECT USING (
  EXISTS (SELECT 1 FROM lowongan WHERE lowongan.id = lamaran.lowongan_id AND lowongan.pemberi_kerja_id = auth.uid())
);
CREATE POLICY "lamaran_insert_pekerja" ON lamaran FOR INSERT WITH CHECK (auth.uid() = pekerja_id);
CREATE POLICY "lamaran_update_pekerja" ON lamaran FOR UPDATE USING (auth.uid() = pekerja_id);
CREATE POLICY "lamaran_update_employer" ON lamaran FOR UPDATE USING (
  EXISTS (SELECT 1 FROM lowongan WHERE lowongan.id = lamaran.lowongan_id AND lowongan.pemberi_kerja_id = auth.uid())
);

-- kesepakatan_kerja
CREATE POLICY "kesepakatan_kerja_parties" ON kesepakatan_kerja FOR ALL USING (
  auth.uid() = pekerja_id OR auth.uid() = pemberi_kerja_id
);

-- pekerjaan: SELECT only for parties; NO INSERT/UPDATE/DELETE policies
CREATE POLICY "pekerjaan_select_parties" ON pekerjaan FOR SELECT USING (
  auth.uid() = pekerja_id OR auth.uid() = pemberi_kerja_id
);

-- penilaian
CREATE POLICY "penilaian_select_all" ON penilaian FOR SELECT USING (true);
CREATE POLICY "penilaian_insert_employer" ON penilaian FOR INSERT WITH CHECK (
  auth.uid() = pemberi_kerja_id
  AND EXISTS (
    SELECT 1 FROM pekerjaan
    WHERE pekerjaan.id = penilaian.pekerjaan_id
      AND pekerjaan.pemberi_kerja_id = auth.uid()
      AND pekerjaan.selesai_pada IS NOT NULL
  )
);
-- No UPDATE/DELETE policy => immutable

-- lapor_upah
CREATE POLICY "lapor_upah_select_own" ON lapor_upah FOR SELECT USING (auth.uid() = pekerja_id);
CREATE POLICY "lapor_upah_insert_own" ON lapor_upah FOR INSERT WITH CHECK (auth.uid() = pekerja_id);

-- log_ai
CREATE POLICY "log_ai_select_own" ON log_ai FOR SELECT USING (auth.uid() = pengguna_id);

-- selesaikan_pekerjaan function
CREATE OR REPLACE FUNCTION selesaikan_pekerjaan(
  p_kesepakatan_id uuid,
  p_pihak text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kesepakatan record;
  v_pekerjaan_id uuid;
BEGIN
  SELECT * INTO v_kesepakatan
  FROM kesepakatan_kerja
  WHERE id = p_kesepakatan_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kesepakatan tidak ditemukan';
  END IF;

  IF v_kesepakatan.status != 'berjalan' THEN
    RAISE EXCEPTION 'Kesepakatan harus dalam status berjalan';
  END IF;

  IF v_kesepakatan.otp_pekerja_pada IS NULL OR v_kesepakatan.otp_pemberi_pada IS NULL THEN
    RAISE EXCEPTION 'Kedua OTP harus dikonfirmasi';
  END IF;

  IF p_pihak NOT IN ('pekerja', 'pemberi_kerja') THEN
    RAISE EXCEPTION 'Pihak tidak valid';
  END IF;

  IF p_pihak = 'pekerja' AND auth.uid() != v_kesepakatan.pekerja_id THEN
    RAISE EXCEPTION 'Bukan pekerja terkait';
  END IF;

  IF p_pihak = 'pemberi_kerja' AND auth.uid() != v_kesepakatan.pemberi_kerja_id THEN
    RAISE EXCEPTION 'Bukan pemberi kerja terkait';
  END IF;

  INSERT INTO pekerjaan (
    kesepakatan_id, pekerja_id, pemberi_kerja_id
  ) VALUES (
    p_kesepakatan_id, v_kesepakatan.pekerja_id, v_kesepakatan.pemberi_kerja_id
  )
  ON CONFLICT (kesepakatan_id) DO NOTHING
  RETURNING id INTO v_pekerjaan_id;

  IF v_pekerjaan_id IS NULL THEN
    SELECT id INTO v_pekerjaan_id
    FROM pekerjaan
    WHERE kesepakatan_id = p_kesepakatan_id;
  END IF;

  IF p_pihak = 'pekerja' THEN
    UPDATE pekerjaan
    SET dikonfirmasi_selesai_pekerja = true
    WHERE id = v_pekerjaan_id;
  ELSE
    UPDATE pekerjaan
    SET dikonfirmasi_selesai_pemberi = true
    WHERE id = v_pekerjaan_id;
  END IF;

  UPDATE pekerjaan
  SET selesai_pada = now()
  WHERE id = v_pekerjaan_id
    AND dikonfirmasi_selesai_pekerja = true
    AND dikonfirmasi_selesai_pemberi = true;

  UPDATE kesepakatan_kerja
  SET status = 'selesai'
  WHERE id = p_kesepakatan_id
    AND EXISTS (
      SELECT 1 FROM pekerjaan
      WHERE pekerjaan.kesepakatan_id = p_kesepakatan_id
        AND pekerjaan.selesai_pada IS NOT NULL
    );

  RETURN v_pekerjaan_id;
END;
$$;
