import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/server";
import { cocokkanPekerja, cocokkanLowongan } from "@/lib/engine/matching";

export async function GET(request: Request) {
  const userOrResponse = await requireSession();
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  const { searchParams } = new URL(request.url);
  const pekerja = searchParams.get("pekerja");
  const lowongan = searchParams.get("lowongan");

  if (pekerja) {
    const hasil = await cocokkanPekerja(pekerja);
    return NextResponse.json({ ok: true, data: hasil });
  }

  if (lowongan) {
    const hasil = await cocokkanLowongan(lowongan);
    return NextResponse.json({ ok: true, data: hasil });
  }

  return NextResponse.json(
    { ok: false, pesan: "Parameter pekerja atau lowongan wajib diisi." },
    { status: 400 }
  );
}
