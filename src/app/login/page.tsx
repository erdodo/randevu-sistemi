"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Kullanıcı tam adresi yapıştırırsa son parçayı al
        body: JSON.stringify({ slug: slug.trim().replace(/\/+$/, "").split("/").pop(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Giriş yapılamadı");
      window.location.href = `/${data.slug}/admin`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş yapılamadı");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center px-5">
      <form onSubmit={submit} className="w-full max-w-xs">
        <h1 className="text-center text-2xl font-bold text-white">İşletme Girişi</h1>
        <p className="mt-1 text-center text-sm text-white/50">Randevu sayfanızın adresi ve şifrenizle girin</p>
        <div className="mt-8 space-y-3 rounded-3xl bg-white p-6 shadow-2xl">
          <input
            name="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="isletme-adiniz"
            autoCapitalize="none"
            required
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-center font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre"
            required
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {error && <p className="text-center text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-indigo-600 py-4 font-bold text-white shadow-lg transition active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
          </button>
        </div>
        <p className="mt-6 text-center text-sm text-white/60">
          Henüz üye değil misiniz?{" "}
          <Link href="/register" className="font-semibold text-white underline underline-offset-4">
            Ücretsiz üye olun
          </Link>
        </p>
      </form>
    </div>
  );
}
