"use client";

import { useState } from "react";
import { Business, Service } from "@/types";
import { SectorTemplate } from "@/lib/templates";
import { X, Upload, Palette, Clock, Calendar, Lock, Save, Loader2, Plus, Trash2 } from "lucide-react";

interface BrandingModalProps {
  business: Business & { services: Service[] };
  template: SectorTemplate;
  onClose: () => void;
  onSave: (updated: Business & { services: Service[] }) => void;
}

export default function BrandingModal({ business, template, onClose, onSave }: BrandingModalProps) {
  const [name, setName] = useState(business.name);
  const [description, setDescription] = useState(business.description ?? "");
  const [address, setAddress] = useState(business.address ?? "");
  const [phone, setPhone] = useState(business.phone ?? "");
  const [logo, setLogo] = useState(business.logo ?? "");
  const [primaryColor, setPrimaryColor] = useState(business.primaryColor);
  const [openTime, setOpenTime] = useState(business.openTime);
  const [closeTime, setCloseTime] = useState(business.closeTime);
  const [slotDuration, setSlotDuration] = useState(business.slotDuration);
  const [workingDays, setWorkingDays] = useState(business.workingDays.split(",").map(Number));
  const [newPassword, setNewPassword] = useState("");
  const [services, setServices] = useState<{ name: string; duration: number; price: string }[]>(
    business.services.map((s) => ({ name: s.name, duration: s.duration, price: s.price ? String(s.price) : "" }))
  );
  const [activeTab, setActiveTab] = useState<"brand" | "hours" | "services" | "security">("brand");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const DAYS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

  const toggleDay = (day: number) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/businesses/${business.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminPassword: business.adminPassword,
          name,
          description,
          address,
          phone,
          logo: logo || null,
          primaryColor,
          openTime,
          closeTime,
          slotDuration,
          workingDays: workingDays.join(","),
          newPassword: newPassword || undefined,
          services: services.filter((s) => s.name.trim()).map((s) => ({
            name: s.name.trim(),
            duration: s.duration,
            price: s.price ? parseFloat(s.price) : null,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Kayıt başarısız");
      }

      const updated = await res.json();
      onSave(updated);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteFlow = () => {
    setDeleteError("");
    setDeletePassword("");
    setShowDeletePassword(false);
    setShowDeleteConfirm(true);
  };

  const handleDeleteBusiness = async () => {
    if (!deletePassword) {
      setDeleteError("Şifre gerekli");
      return;
    }

    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/setup/reset", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Şirket silinemedi");
      }

      sessionStorage.removeItem("admin_auth");
      window.location.href = "/";
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Hata oluştu");
      setDeleting(false);
    }
  };

  const tabs = [
    { id: "brand", label: "Marka", icon: <Palette className="w-4 h-4" /> },
    { id: "hours", label: "Saatler", icon: <Clock className="w-4 h-4" /> },
    { id: "services", label: "Hizmetler", icon: <Calendar className="w-4 h-4" /> },
    { id: "security", label: "Güvenlik", icon: <Lock className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-bold text-gray-900 text-xl">İşletme Ayarları</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-1 px-6 py-3 border-b border-gray-100 flex-shrink-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${
                activeTab === tab.id ? "text-white" : "text-gray-500 hover:bg-gray-100"
              }`}
              style={activeTab === tab.id ? { backgroundColor: business.primaryColor } : {}}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4">
          {activeTab === "brand" && (
            <div className="space-y-4">
              <Field label="İşletme Adı">
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="İşletme adı" />
              </Field>
              <Field label="Açıklama">
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputClass} resize-none`} rows={2} placeholder="Kısa tanıtım" />
              </Field>
              <Field label="Adres">
                <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} placeholder="İşletme adresi" />
              </Field>
              <Field label="Telefon">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="0xxx xxx xx xx" type="tel" />
              </Field>
              <Field label="Logo URL">
                <div className="flex gap-2">
                  <input value={logo} onChange={(e) => setLogo(e.target.value)} className={`${inputClass} flex-1`} placeholder="https://... veya boş bırakın" />
                  {logo && (
                    <img src={logo} alt="" className="w-10 h-10 rounded-xl object-cover border border-gray-200" onError={() => setLogo("")} />
                  )}
                </div>
              </Field>
              <Field label="Ana Renk">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-10 rounded-xl cursor-pointer border-none p-0.5"
                  />
                  <input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className={`${inputClass} flex-1 font-mono uppercase`}
                    placeholder="#6366f1"
                    maxLength={7}
                  />
                  <div className="w-10 h-10 rounded-xl shadow-sm" style={{ backgroundColor: primaryColor }} />
                </div>
              </Field>
            </div>
          )}

          {activeTab === "hours" && (
            <div className="space-y-5">
              <Field label="Çalışma Günleri">
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => toggleDay(i)}
                      className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                        workingDays.includes(i) ? "text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                      style={workingDays.includes(i) ? { backgroundColor: business.primaryColor } : {}}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Açılış">
                  <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Kapanış">
                  <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className={inputClass} />
                </Field>
              </div>

              <Field label="Randevu Süresi (dk)">
                <select value={slotDuration} onChange={(e) => setSlotDuration(Number(e.target.value))} className={inputClass}>
                  {[15, 20, 30, 45, 50, 60, 90, 120].map((d) => (
                    <option key={d} value={d}>{d} dakika</option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          {activeTab === "services" && (
            <div className="space-y-3">
              {services.map((service, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <input
                      value={service.name}
                      onChange={(e) => setServices((prev) => prev.map((s, idx) => idx === i ? { ...s, name: e.target.value } : s))}
                      className={`${inputClass} text-sm`}
                      placeholder="Hizmet adı"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={service.duration}
                        onChange={(e) => setServices((prev) => prev.map((s, idx) => idx === i ? { ...s, duration: Number(e.target.value) } : s))}
                        className={`${inputClass} text-sm w-20`}
                        placeholder="Süre (dk)"
                        min={5}
                      />
                      <input
                        type="number"
                        value={service.price}
                        onChange={(e) => setServices((prev) => prev.map((s, idx) => idx === i ? { ...s, price: e.target.value } : s))}
                        className={`${inputClass} text-sm flex-1`}
                        placeholder="Fiyat (₺, opsiyonel)"
                        min={0}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setServices((prev) => prev.filter((_, idx) => idx !== i))}
                    className="p-2.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all mt-0.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setServices((prev) => [...prev, { name: "", duration: 30, price: "" }])}
                className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 flex items-center justify-center gap-2 text-sm font-medium transition-all"
              >
                <Plus className="w-4 h-4" /> Hizmet Ekle
              </button>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-4">
              <Field label="Yeni Şifre">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Boş bırakırsanız değişmez"
                />
              </Field>
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-amber-700 text-sm">Şifreyi değiştirmek için yeni şifreyi girin ve kaydedin.</p>
              </div>
            </div>
          )}
        </div>

        {error && <p className="px-6 text-red-500 text-sm">{error}</p>}

        <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg disabled:opacity-70"
            style={{ backgroundColor: business.primaryColor }}
          >
            {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Kaydediliyor...</> : <><Save className="w-5 h-5" /> Kaydet</>}
          </button>
        </div>
        <button
          onClick={openDeleteFlow}
          className="absolute bottom-2 right-2 px-1.5 py-1 rounded-md text-[10px] font-semibold text-red-600 border border-red-300 bg-red-50 hover:bg-red-100 leading-none"
          title="Tehlikeli işlem"
        >
          Şirketi Sil
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-red-100">
            <p className="font-bold text-gray-900">Emin misin?</p>
            <p className="text-sm text-gray-500 mt-1">
              Bu işlem tüm veritabanı verilerini geri alınamaz şekilde siler.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setShowDeletePassword(true);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold"
              >
                Eminim
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeletePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => {
              if (deleting) return;
              setShowDeletePassword(false);
            }}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-red-100">
            <p className="font-bold text-gray-900">Şifre Onayı</p>
            <p className="text-sm text-gray-500 mt-1">
              Silme işlemi için yönetici şifresini girin.
            </p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className={`${inputClass} mt-3`}
              placeholder="Yönetici şifresi"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !deleting) handleDeleteBusiness();
              }}
              autoFocus
            />
            {deleteError && (
              <p className="text-red-500 text-xs mt-2">{deleteError}</p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowDeletePassword(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium disabled:opacity-50"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteBusiness}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-70 flex items-center justify-center gap-1.5"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Verileri Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-0 text-gray-900 bg-gray-50 text-sm transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
