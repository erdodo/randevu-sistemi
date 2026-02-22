"use client";

import { useState } from "react";
import { SECTOR_TEMPLATES, SectorTemplate, Sector } from "@/lib/templates";
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
  Store,
  Lock,
} from "lucide-react";

const SECTORS = Object.values(SECTOR_TEMPLATES);

type Step = "template" | "info" | "password";

export default function SetupWizard() {
  const [step, setStep] = useState<Step>("template");
  const [selectedSector, setSelectedSector] = useState<SectorTemplate | null>(
    null,
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleTemplateSelect = (sector: SectorTemplate) => {
    setSelectedSector(sector);
    setStep("info");
  };

  const handleInfoNext = () => {
    if (!name.trim()) {
      setError("Dükkan adı gerekli");
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      setError("Geçerli bir telefon numarası girin");
      return;
    }
    setError("");
    setStep("password");
  };

  const handleSubmit = async () => {
    if (!password || password.length < 4) {
      setError("Şifre en az 4 karakter olmalı");
      return;
    }
    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sector: selectedSector!.id,
          name: name.trim(),
          phone: phone.trim(),
          password,
          address: address.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Kurulum başarısız");
      }
      window.location.href = "/";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-violet-600/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-pink-600/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Progress dots */}
      <div className="relative flex justify-center gap-2 pt-10 pb-4">
        {(["template", "info", "password"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              s === step
                ? "w-8 bg-white"
                : i < ["template", "info", "password"].indexOf(step)
                  ? "w-4 bg-white/50"
                  : "w-4 bg-white/20"
            }`}
          />
        ))}
      </div>

      <div className="relative max-w-md mx-auto px-5 pb-12">
        {/* Step: Template Selection */}
        {step === "template" && (
          <div className="animate-in fade-in">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white/80 text-sm mb-5 border border-white/10">
                <Sparkles className="w-4 h-4" />
                <span>Hoşgeldiniz</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">
                Dükkanınızı Kuralım
              </h1>
              <p className="text-white/50 text-base">
                İşletmenize uygun bir şablon seçin
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {SECTORS.map((sector) => (
                <button
                  key={sector.id}
                  onClick={() => handleTemplateSelect(sector)}
                  className={`group bg-gradient-to-br ${sector.heroGradient} rounded-2xl p-5 text-left transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] shadow-lg hover:shadow-xl border border-white/10`}
                >
                  <div className="text-3xl mb-3">{sector.emoji}</div>
                  <p className="text-white font-bold text-sm leading-tight">
                    {sector.label}
                  </p>
                  <p className="text-white/50 text-xs mt-1 leading-snug">
                    {sector.tagline}
                  </p>
                  <div className="flex items-center gap-1 mt-3 text-white/40 group-hover:text-white/70 transition-colors">
                    <span className="text-xs font-medium">Seç</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Business Info */}
        {step === "info" && (
          <div className="animate-in fade-in">
            <button
              onClick={() => setStep("template")}
              className="flex items-center gap-1 text-white/50 hover:text-white/80 text-sm mb-6 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Geri
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-3xl mx-auto mb-4 border border-white/10">
                <Store className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Dükkan Bilgileri
              </h2>
              <p className="text-white/50 text-sm">
                {selectedSector?.emoji} {selectedSector?.label}
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Dükkan Adı *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Studio Güzel"
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-white/30 text-base focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Telefon *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05xx xxx xx xx"
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-white/30 text-base focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Adres <span className="text-white/30">(opsiyonel)</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="İlçe, Şehir"
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-white/30 text-base focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Açıklama <span className="text-white/30">(opsiyonel)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kısa bir tanıtım yazısı"
                  rows={2}
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-white/30 text-base focus:outline-none focus:ring-2 focus:ring-white/20 transition-all resize-none"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <button
                onClick={handleInfoNext}
                className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
                style={{
                  backgroundColor: selectedSector?.primaryColor ?? "#6366f1",
                }}
              >
                Devam Et
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step: Password */}
        {step === "password" && (
          <div className="animate-in fade-in">
            <button
              onClick={() => {
                setStep("info");
                setError("");
              }}
              className="flex items-center gap-1 text-white/50 hover:text-white/80 text-sm mb-6 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Geri
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-white/10">
                <Lock className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Yönetim Şifresi
              </h2>
              <p className="text-white/50 text-sm">
                Admin paneline giriş için bir şifre belirleyin
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Şifre *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="En az 4 karakter"
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-white/30 text-base focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-center tracking-widest"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Şifre Tekrar *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Şifrenizi tekrar girin"
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-white/30 text-base focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-center tracking-widest"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-[0.98] shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: selectedSector?.primaryColor ?? "#6366f1",
                }}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Kurulum
                    Yapılıyor...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" /> Dükkanı Oluştur
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
