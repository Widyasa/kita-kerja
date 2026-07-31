"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import type { PilihanKecamatan, PilihanWilayah, ProfilTampil } from "@/lib/data/profil";

export function ProfilForm({
  profil,
  daftarWilayah,
}: {
  profil: ProfilTampil;
  daftarWilayah: PilihanWilayah[];
}) {
  const router = useRouter();
  const [nama, setNama] = useState(profil.nama);
  const [wilayahId, setWilayahId] = useState(profil.wilayah_id ?? "");
  const [kecamatanId, setKecamatanId] = useState(profil.kecamatan_id ?? "");
  const [daftarKecamatan, setDaftarKecamatan] = useState<PilihanKecamatan[]>([]);
  const [menyimpan, setMenyimpan] = useState(false);

  const namaValid = nama.trim().length >= 3;

  useEffect(() => {
    let dibatalkan = false;
    (async () => {
      try {
        const qs = wilayahId ? `?wilayah_id=${wilayahId}` : "";
        const res = await fetch(`/api/kecamatan${qs}`);
        const json = await res.json();
        if (!dibatalkan && res.ok) setDaftarKecamatan(json.data.kecamatan as PilihanKecamatan[]);
      } catch {
        // gagal diam-diam — select tetap tampil kosong
      }
    })();
    return () => {
      dibatalkan = true;
    };
  }, [wilayahId]);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!namaValid || menyimpan) return;
    setMenyimpan(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: nama.trim(),
          wilayah_id: wilayahId || null,
          kecamatan_id: kecamatanId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || "Gagal menyimpan profil.");
      toast.success("Profil tersimpan.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={simpan}>
      <div className="flex flex-col gap-2">
        <label htmlFor="nama" className="text-label text-tanah-800">
          Nama lengkap
        </label>
        <Input
          id="nama"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          className="h-14 text-body-lg"
          disabled={menyimpan}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="wilayah" className="text-label text-tanah-800">
          Wilayah tempat Anda biasa bekerja
        </label>
        <select
          id="wilayah"
          value={wilayahId}
          onChange={(e) => setWilayahId(e.target.value)}
          disabled={menyimpan}
          className="h-14 w-full rounded-md border border-input bg-tanah-0 px-4 text-body-lg shadow-1 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="">Belum dipilih</option>
          {daftarWilayah.map((w) => (
            <option key={w.id} value={w.id}>
              {w.nama}, {w.provinsi}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="kecamatan" className="text-label text-tanah-800">
          Kecamatan tempat tinggal (untuk perkiraan jarak ke lowongan)
        </label>
        <select
          id="kecamatan"
          value={kecamatanId}
          onChange={(e) => setKecamatanId(e.target.value)}
          disabled={menyimpan}
          className="h-14 w-full rounded-md border border-input bg-tanah-0 px-4 text-body-lg shadow-1 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="">Belum dipilih</option>
          {daftarKecamatan.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" size="lg" variant="aksen" disabled={!namaValid || menyimpan}>
        {menyimpan ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
        Simpan perubahan
      </Button>
    </form>
  );
}
