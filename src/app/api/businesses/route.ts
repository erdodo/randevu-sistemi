import { NextResponse } from "next/server";

// Eskiden tüm işletmeleri (şifreleriyle birlikte) listeliyordu; kaldırıldı.
// Yeni işletme kaydı için /api/setup kullanılır.
export async function GET() {
  return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
}
