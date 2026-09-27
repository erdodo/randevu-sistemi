import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// İşletme yöneticisi oturumu: imzalı çerez (şifre asla istemciye gönderilmez)
const COOKIE = "rs-session";
const key = new TextEncoder().encode(process.env.AUTH_SECRET || "randevu-dev-secret-change-in-production");

export interface Session {
  businessId: string;
  slug: string;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

/** Eski kayıtlarda şifre düz metin tutuluyordu; ikisini de destekler. */
export async function checkPassword(password: string, stored: string) {
  if (stored.startsWith("$2")) return bcrypt.compare(password, stored);
  return password === stored;
}

export async function setSession(res: NextResponse, session: Session) {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(key);
  res.cookies.set({
    name: COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export function clearSession(res: NextResponse) {
  res.cookies.delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    if (!payload.businessId || !payload.slug) return null;
    return { businessId: String(payload.businessId), slug: String(payload.slug) };
  } catch {
    return null;
  }
}

/** API route'ları için: oturumu açık işletmeyi döndürür, yoksa 401 yanıtı. */
export async function requireBusiness() {
  const session = await getSession();
  const business = session ? await prisma.business.findUnique({ where: { id: session.businessId } }) : null;
  if (!business) {
    return { error: NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 }) } as const;
  }
  return { business } as const;
}

/** Türkçe karakterleri sadeleştirip URL'de kullanılabilir kısa ad üretir. */
export function slugify(text: string): string {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşüâîû]/g, (c) => map[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// Uygulamanın kendi sayfalarıyla çakışan adresler işletmeye verilmez
export const RESERVED_SLUGS = new Set(["admin", "api", "login", "register", "kayit", "giris", "_next", "favicon.ico", "manifest.json"]);

/** İşletmenin herkese açık görünümü (şifre alanı çıkarılır). */
export function publicBusiness<T extends { adminPassword?: string }>(b: T): Omit<T, "adminPassword"> {
  const { adminPassword: _omit, ...rest } = b;
  return rest;
}

/** Yazma işlemleri için: oturum + kampanya sonrası salt okunur kontrolü. */
export async function requireWritableBusiness() {
  const r = await requireBusiness();
  if (r.error) return r;
  const { isTenantReadOnly, READ_ONLY_MESSAGE } = await import("@/lib/campaign");
  if (isTenantReadOnly(r.business.slug)) {
    return { error: NextResponse.json({ error: READ_ONLY_MESSAGE, readOnly: true }, { status: 402 }) } as const;
  }
  return r;
}
