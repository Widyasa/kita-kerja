"use client";

import { useEffect, useState } from "react";

import { Input } from "@/component/ui/input";
import { cn } from "@/lib/utils";
import type { JenisKerja, SatuanUpah } from "@/lib/mock";
import type { PilihanKecamatan, PilihanWilayah } from "@/lib/data/profil";
import {
  LABEL_JENIS_KERJA,
  LABEL_SATUAN_UPAH,
  type BidangLowongan,
} from "./ekstraksi";

/**
 * RingkasanEkstraksi — hasil ekstraksi sebagai BIDANG YANG DAPAT DIEDIT.
 * Tidak ada formulir terpisah: bidang ini ADALAH hasil bacaan dari tulisan
 * pemberi kerja, dan setiap bidang boleh diperbaiki sebelum tayang.
 */

const kelasSelect = cn(
  "h-12 w-full rounded-md border border-input bg-tanah-0 px-4 text-body shadow-1 outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
);

function Bidang({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-label font-semibold text-tanah-700">
        {label}
      </label>
      {children}
    </div>
  );
}

export function RingkasanEkstraksi({
  bidang,
  onUbah,
  className,
}: {
  bidang: BidangLowongan;
  /** patch sebagian bidang */
  onUbah: (patch: Partial<BidangLowongan>) => void;
  className?: string;
}) {
  const [daftarWilayah, setDaftarWilayah] = useState<PilihanWilayah[]>([]);
  const [daftarKecamatan, setDaftarKecamatan] = useState<PilihanKecamatan[]>([]);

  useEffect(() => {
    let dibatalkan = false;
    (async () => {
      try {
        const res = await fetch("/api/wilayah");
        const json = await res.json();
        if (!dibatalkan && res.ok) setDaftarWilayah(json.data.wilayah as PilihanWilayah[]);
      } catch {
        // gagal diam-diam — select tetap tampil kosong
      }
    })();
    return () => {
      dibatalkan = true;
    };
  }, []);

  useEffect(() => {
    let dibatalkan = false;
    (async () => {
      try {
        const qs = bidang.wilayahId ? `?wilayah_id=${bidang.wilayahId}` : "";
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
  }, [bidang.wilayahId]);

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-5 rounded-2xl border border-tanah-200 bg-tanah-0 p-5 shadow-1 sm:grid-cols-2",
        className,
      )}
    >
      <div className="sm:col-span-2">
        <Bidang label="Judul lowongan" htmlFor="re-judul">
          <Input
            id="re-judul"
            value={bidang.judul}
            onChange={(e) => onUbah({ judul: e.target.value })}
            placeholder="mis. Tukang renovasi dapur, Sukun"
          />
        </Bidang>
      </div>

      <Bidang label="Jenis kerja" htmlFor="re-jenis">
        <select
          id="re-jenis"
          value={bidang.jenisKerja}
          onChange={(e) => onUbah({ jenisKerja: e.target.value as JenisKerja | "" })}
          className={kelasSelect}
        >
          <option value="">Belum jelas — pilih satu</option>
          {(Object.keys(LABEL_JENIS_KERJA) as JenisKerja[]).map((j) => (
            <option key={j} value={j}>
              {LABEL_JENIS_KERJA[j]}
            </option>
          ))}
        </select>
      </Bidang>

      <Bidang label="Jumlah pekerja" htmlFor="re-jumlah">
        <Input
          id="re-jumlah"
          type="number"
          min={1}
          inputMode="numeric"
          value={bidang.jumlahPekerja}
          onChange={(e) => onUbah({ jumlahPekerja: e.target.value })}
          placeholder="mis. 2"
        />
      </Bidang>

      <div className="sm:col-span-2">
        <Bidang label="Lokasi kerja" htmlFor="re-lokasi">
          <Input
            id="re-lokasi"
            value={bidang.lokasi}
            onChange={(e) => onUbah({ lokasi: e.target.value })}
            placeholder="mis. Sukun, Kota Malang"
          />
        </Bidang>
      </div>

      <div className="sm:col-span-2">
        <Bidang label="Wilayah" htmlFor="re-wilayah">
          <select
            id="re-wilayah"
            value={bidang.wilayahId}
            onChange={(e) => onUbah({ wilayahId: e.target.value })}
            className={kelasSelect}
          >
            <option value="">Belum dipilih</option>
            {daftarWilayah.map((w) => (
              <option key={w.id} value={w.id}>
                {w.nama}
              </option>
            ))}
          </select>
        </Bidang>
      </div>

      <div className="sm:col-span-2">
        <Bidang label="Kecamatan (untuk perkiraan jarak ke pekerja)" htmlFor="re-kecamatan">
          <select
            id="re-kecamatan"
            value={bidang.kecamatanId}
            onChange={(e) => onUbah({ kecamatanId: e.target.value })}
            className={kelasSelect}
          >
            <option value="">Belum dipilih</option>
            {daftarKecamatan.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
        </Bidang>
      </div>

      <Bidang label="Upah (rupiah)" htmlFor="re-upah">
        <Input
          id="re-upah"
          type="number"
          min={0}
          step={1000}
          inputMode="numeric"
          value={bidang.upah}
          onChange={(e) => onUbah({ upah: e.target.value })}
          placeholder="mis. 150000"
        />
      </Bidang>

      <Bidang label="Satuan upah" htmlFor="re-satuan">
        <select
          id="re-satuan"
          value={bidang.satuanUpah}
          onChange={(e) => onUbah({ satuanUpah: e.target.value as SatuanUpah })}
          className={kelasSelect}
        >
          {(Object.keys(LABEL_SATUAN_UPAH) as SatuanUpah[]).map((s) => (
            <option key={s} value={s}>
              {LABEL_SATUAN_UPAH[s]}
            </option>
          ))}
        </select>
      </Bidang>

      <div className="sm:col-span-2">
        <Bidang label="Tanggal mulai" htmlFor="re-mulai">
          <Input
            id="re-mulai"
            type="date"
            value={bidang.mulai}
            onChange={(e) => onUbah({ mulai: e.target.value })}
          />
        </Bidang>
      </div>
    </div>
  );
}
