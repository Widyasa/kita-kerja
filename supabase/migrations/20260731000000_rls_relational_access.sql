-- Relational read access + derived-aggregate functions.
-- Policy chains are acyclic: pengguna -> lamaran -> lowongan -> auth.uid().

-- ============ PENGGUNA ============
DROP POLICY IF EXISTS "pengguna_select_pelamar" ON pengguna;
CREATE POLICY "pengguna_select_pelamar" ON pengguna FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM lamaran l
    JOIN lowongan lo ON lo.id = l.lowongan_id
    WHERE l.pekerja_id = pengguna.id AND lo.pemberi_kerja_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "pengguna_select_pemberi_tayang" ON pengguna;
CREATE POLICY "pengguna_select_pemberi_tayang" ON pengguna FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM lowongan lo
    WHERE lo.pemberi_kerja_id = pengguna.id AND lo.status = 'tayang'
  )
);

DROP POLICY IF EXISTS "pengguna_select_mitra_kesepakatan" ON pengguna;
CREATE POLICY "pengguna_select_mitra_kesepakatan" ON pengguna FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM kesepakatan_kerja k
    WHERE (k.pekerja_id = pengguna.id AND k.pemberi_kerja_id = auth.uid())
       OR (k.pemberi_kerja_id = pengguna.id AND k.pekerja_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "pengguna_select_dampingan" ON pengguna;
CREATE POLICY "pengguna_select_dampingan" ON pengguna FOR SELECT USING (
  didampingi_oleh = auth.uid()
);

DROP POLICY IF EXISTS "pengguna_update_dampingan" ON pengguna;
CREATE POLICY "pengguna_update_dampingan" ON pengguna FOR UPDATE USING (
  didampingi_oleh = auth.uid()
);

-- ============ KARTU KERJA ============
DROP POLICY IF EXISTS "kartu_kerja_select_pelamar" ON kartu_kerja;
CREATE POLICY "kartu_kerja_select_pelamar" ON kartu_kerja FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM lamaran l
    JOIN lowongan lo ON lo.id = l.lowongan_id
    WHERE l.pekerja_id = kartu_kerja.pekerja_id AND lo.pemberi_kerja_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "kartu_kerja_select_dampingan" ON kartu_kerja;
CREATE POLICY "kartu_kerja_select_dampingan" ON kartu_kerja FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM pengguna p
    WHERE p.id = kartu_kerja.pekerja_id AND p.didampingi_oleh = auth.uid()
  )
);

-- ============ KARTU KEAHLIAN ============
DROP POLICY IF EXISTS "kartu_keahlian_select_pelamar" ON kartu_keahlian;
CREATE POLICY "kartu_keahlian_select_pelamar" ON kartu_keahlian FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM kartu_kerja kk
    JOIN lamaran l ON l.pekerja_id = kk.pekerja_id
    JOIN lowongan lo ON lo.id = l.lowongan_id
    WHERE kk.id = kartu_keahlian.kartu_id AND lo.pemberi_kerja_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "kartu_keahlian_select_dampingan" ON kartu_keahlian;
CREATE POLICY "kartu_keahlian_select_dampingan" ON kartu_keahlian FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM kartu_kerja kk
    JOIN pengguna p ON p.id = kk.pekerja_id
    WHERE kk.id = kartu_keahlian.kartu_id AND p.didampingi_oleh = auth.uid()
  )
);

-- ============ AGREGAT TURUNAN (SECURITY DEFINER) ============
-- Mengembalikan HANYA angka agregat, tidak pernah baris mentah.

CREATE OR REPLACE FUNCTION rekam_jejak_pemberi(p_pemberi uuid)
RETURNS TABLE (pekerjaan_selesai int, laporan_terbuka int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT count(*)::int FROM pekerjaan
      WHERE pemberi_kerja_id = p_pemberi AND selesai_pada IS NOT NULL),
    (SELECT count(*)::int FROM laporan_masalah lm
       JOIN pekerjaan pk ON pk.id = lm.pekerjaan_id
      WHERE pk.pemberi_kerja_id = p_pemberi AND lm.status <> 'selesai');
$$;

CREATE OR REPLACE FUNCTION rekam_jejak_pekerja(p_pekerja uuid)
RETURNS TABLE (pekerjaan_selesai int, rata_penilaian numeric, jumlah_penilai int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT count(*)::int FROM pekerjaan
      WHERE pekerja_id = p_pekerja AND selesai_pada IS NOT NULL),
    COALESCE((SELECT avg(pn.skor) FROM penilaian pn
       JOIN pekerjaan pk ON pk.id = pn.pekerjaan_id
      WHERE pk.pekerja_id = p_pekerja), 0)::numeric,
    (SELECT count(*)::int FROM penilaian pn
       JOIN pekerjaan pk ON pk.id = pn.pekerjaan_id
      WHERE pk.pekerja_id = p_pekerja);
$$;

-- Lapis kepercayaan diturunkan dari riwayat, TIDAK PERNAH disimpan.
CREATE OR REPLACE FUNCTION lapis_keahlian_pekerja(p_pekerja uuid)
RETURNS TABLE (keahlian_id uuid, lapis text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT lk.keahlian_id,
         CASE
           WHEN bool_or(pk.selesai_pada IS NOT NULL
                        AND pk.dikonfirmasi_selesai_pekerja
                        AND pk.dikonfirmasi_selesai_pemberi) THEN 'terverifikasi'
           WHEN bool_or(pn.id IS NOT NULL) THEN 'dinilai'
           ELSE 'diklaim'
         END AS lapis
  FROM pekerjaan pk
  JOIN kesepakatan_kerja kk ON kk.id = pk.kesepakatan_id
  JOIN lowongan_keahlian lk ON lk.lowongan_id = kk.lowongan_id
  LEFT JOIN penilaian pn ON pn.pekerjaan_id = pk.id
  WHERE pk.pekerja_id = p_pekerja
  GROUP BY lk.keahlian_id;
$$;

GRANT EXECUTE ON FUNCTION rekam_jejak_pemberi(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION rekam_jejak_pekerja(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION lapis_keahlian_pekerja(uuid) TO authenticated;
