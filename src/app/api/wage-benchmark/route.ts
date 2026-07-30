import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/server";
import { hitungAcuanUpah } from "@/lib/mesin/acuan-upah";

export async function GET(request: Request) {
  const userOrResponse = await requireSession();
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  const { searchParams } = new URL(request.url);
  const keahlian = searchParams.get("keahlian");
  const wilayah = searchParams.get("wilayah");

  if (!keahlian || !wilayah) {
    return NextResponse.json(
      { ok: false, pesan: "Parameter keahlian dan wilayah wajib diisi." },
      { status: 400 }
    );
  }

  const hasil = await hitungAcuanUpah(keahlian, wilayah);

  if (!hasil) {
    return NextResponse.json(
      { ok: false, pesan: "Data acuan tidak ditemukan." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, data: hasil });
}
