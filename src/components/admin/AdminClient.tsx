"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Business,
  Service,
  Appointment,
  Notification,
  Customer,
  Webhook,
} from "@/types";
import { SectorTemplate } from "@/lib/templates";
import { formatDayHeader } from "@/lib/calendar";
import { getStatusLabel, getStatusColor, getTodayString } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  Settings,
  LogOut,
  Check,
  X,
  Loader2,
  Phone,
  Clock,
  RefreshCw,
  Eye,
  Users,
  CalendarDays,
  User,
  Webhook as WebhookIcon,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import BrandingModal from "./BrandingModal";

interface AdminClientProps {
  business: Business & { services: Service[] };
  template: SectorTemplate;
}

interface CustomerWithCount extends Customer {
  appointmentCount: number;
  lastAppointmentDate: string | null;
}

const TR_MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];
const TR_DAYS_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const ADMIN_KEY = "admin_auth";

function buildCalendar(year: number, month: number): (number | null)[] {
  const total = new Date(year, month + 1, 0).getDate();
  const firstJS = new Date(year, month, 1).getDay();
  const firstTR = (firstJS + 6) % 7;
  const cells: (number | null)[] = Array(firstTR).fill(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
}

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

type Tab = "calendar" | "customers" | "webhooks";

export default function AdminClient({ business, template }: AdminClientProps) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [currentBusiness, setCurrentBusiness] = useState(business);
  const [activeTab, setActiveTab] = useState<Tab>("calendar");

  const now = new Date();
  const todayStr = getTodayString();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [monthAppointments, setMonthAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showBranding, setShowBranding] = useState(false);
  const [customers, setCustomers] = useState<CustomerWithCount[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [newWhUrl, setNewWhUrl] = useState("");
  const [newWhEvent, setNewWhEvent] = useState<
    "appointment_created" | "appointment_approved"
  >("appointment_created");
  const [newWhSecret, setNewWhSecret] = useState("");
  const [addingWh, setAddingWh] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const primaryColor = currentBusiness.primaryColor;
  const workingDays = currentBusiness.workingDays.split(",").map(Number);

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_KEY);
    if (stored === "true") setIsAuthed(true);
  }, []);

  const fetchMonthData = useCallback(
    async (y: number, m: number) => {
      setLoadingMonth(true);
      try {
        const monthStr = `${y}-${String(m + 1).padStart(2, "0")}`;
        const res = await fetch(
          `/api/appointments?slug=${business.slug}&month=${monthStr}`,
        );
        const data = await res.json();
        setMonthAppointments(Array.isArray(data) ? data : []);
      } catch {
        /* ignore */
      } finally {
        setLoadingMonth(false);
      }
    },
    [business.slug],
  );

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?slug=${business.slug}`);
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      /* ignore */
    }
  }, [business.slug]);

  const fetchCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch {
      /* ignore */
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthed) return;
    fetchMonthData(year, month);
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, 30000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isAuthed, year, month, fetchMonthData, fetchNotifications]);

  const fetchWebhooks = useCallback(async () => {
    setLoadingWebhooks(true);
    try {
      const res = await fetch("/api/webhooks");
      const data = await res.json();
      setWebhooks(Array.isArray(data) ? data : []);
    } catch {
      /* ignore */
    } finally {
      setLoadingWebhooks(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthed && activeTab === "customers") fetchCustomers();
    if (isAuthed && activeTab === "webhooks") fetchWebhooks();
  }, [isAuthed, activeTab, fetchCustomers, fetchWebhooks]);

  const handleAddWebhook = async () => {
    if (!newWhUrl.trim()) return;
    setAddingWh(true);
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newWhUrl.trim(),
          event: newWhEvent,
          secret: newWhSecret.trim() || undefined,
        }),
      });
      if (res.ok) {
        const wh = await res.json();
        setWebhooks((prev) => [wh, ...prev]);
        setNewWhUrl("");
        setNewWhSecret("");
      }
    } catch {
      /* ignore */
    } finally {
      setAddingWh(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    await fetch(`/api/webhooks?id=${id}`, { method: "DELETE" });
  };

  const handleToggleWebhook = async (id: string, isActive: boolean) => {
    setWebhooks((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isActive } : w)),
    );
    await fetch("/api/webhooks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive }),
    });
  };

  const handleLogin = () => {
    if (password === currentBusiness.adminPassword) {
      sessionStorage.setItem(ADMIN_KEY, "true");
      setIsAuthed(true);
      setAuthError("");
    } else {
      setAuthError("Şifre hatalı");
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setMonthAppointments((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: status as Appointment["status"] } : a,
        ),
      );
      fetchNotifications();
    } catch {
      /* ignore */
    } finally {
      setUpdatingId(null);
    }
  };

  const markAllRead = async () => {
    await fetch(`/api/notifications/all`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: business.id }),
    });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const goToPrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
    setSelectedDate(null);
  };
  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
    setSelectedDate(null);
  };

  const calendarCells = buildCalendar(year, month);

  const byDate: Record<string, Appointment[]> = {};
  for (const a of monthAppointments) {
    if (!byDate[a.date]) byDate[a.date] = [];
    byDate[a.date].push(a);
  }

  const selectedDayAppointments = selectedDate
    ? (byDate[selectedDate] ?? []).sort((a, b) => a.time.localeCompare(b.time))
    : [];
  const todayCount = (byDate[todayStr] ?? []).length;
  const pendingCount = monthAppointments.filter(
    (a) => a.status === "pending",
  ).length;

  if (!isAuthed) {
    return (
      <LoginView
        password={password}
        setPassword={setPassword}
        error={authError}
        onLogin={handleLogin}
        business={currentBusiness}
        template={template}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div
        className={`bg-gradient-to-r ${template.heroGradient} px-4 pt-10 pb-5 sticky top-0 z-20`}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentBusiness.logo ? (
              <img
                src={currentBusiness.logo}
                alt={currentBusiness.name}
                className="w-10 h-10 rounded-xl object-cover shadow"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shadow">
                {template.emoji}
              </div>
            )}
            <div>
              <p className="text-white font-bold text-base leading-tight">
                {currentBusiness.name}
              </p>
              <p className="text-white/60 text-xs">Yönetim Paneli</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                fetchMonthData(year, month);
                fetchNotifications();
              }}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <RefreshCw
                className={`w-4 h-4 ${loadingMonth ? "animate-spin" : ""}`}
              />
            </button>
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifs(!showNotifs);
                  if (!showNotifs && unreadCount > 0) markAllRead();
                }}
                className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {showNotifs && (
                <NotifDropdown
                  notifications={notifications}
                  onClose={() => setShowNotifs(false)}
                />
              )}
            </div>
            <button
              onClick={() => setShowBranding(true)}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem(ADMIN_KEY);
                setIsAuthed(false);
              }}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-lg mx-auto grid grid-cols-2 gap-2 mt-4">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3">
            <p className="text-white/60 text-xs font-medium">Bugün</p>
            <p className="text-white text-2xl font-bold">{todayCount}</p>
            <p className="text-white/60 text-xs">randevu</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3">
            <p className="text-white/60 text-xs font-medium">Onay Bekleyen</p>
            <p className="text-white text-2xl font-bold">{pendingCount}</p>
            <p className="text-white/60 text-xs">bu ay</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="max-w-lg mx-auto flex gap-1 mt-4 bg-white/10 rounded-2xl p-1">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "calendar"
                ? "bg-white text-gray-900 shadow"
                : "text-white/70 hover:text-white"
            }`}
          >
            <CalendarDays className="w-4 h-4" /> Takvim
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "customers"
                ? "bg-white text-gray-900 shadow"
                : "text-white/70 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" /> Müşteriler
          </button>
          <button
            onClick={() => setActiveTab("webhooks")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "webhooks"
                ? "bg-white text-gray-900 shadow"
                : "text-white/70 hover:text-white"
            }`}
          >
            <WebhookIcon className="w-4 h-4" /> Webhook
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 pb-16">
        {activeTab === "calendar" && (
          <div className="animate-in">
            {/* Calendar */}
            <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-5">
                <button
                  onClick={goToPrevMonth}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <ChevronLeft
                    className="w-5 h-5"
                    style={{ color: primaryColor }}
                  />
                </button>
                <div className="text-center">
                  <p className="font-bold text-gray-900 text-lg">
                    {TR_MONTHS[month]}
                  </p>
                  <p className="text-gray-400 text-sm">{year}</p>
                </div>
                <button
                  onClick={goToNextMonth}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <ChevronRight
                    className="w-5 h-5"
                    style={{ color: primaryColor }}
                  />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {TR_DAYS_SHORT.map((d) => (
                  <div
                    key={d}
                    className="text-center text-xs font-semibold text-gray-400 py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((day, i) => {
                  if (!day) return <div key={i} />;
                  const dateStr = toDateStr(year, month, day);
                  const isPast = dateStr < getTodayString();
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;
                  const dayAppts = byDate[dateStr] ?? [];
                  const apptCount = dayAppts.length;
                  const hasPending = dayAppts.some(
                    (a) => a.status === "pending",
                  );

                  return (
                    <button
                      key={i}
                      onClick={() =>
                        setSelectedDate(isSelected ? null : dateStr)
                      }
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-95
                        ${isSelected ? "text-white shadow-lg scale-110" : "hover:bg-gray-50"}
                        ${!isSelected && isToday ? "ring-2 ring-offset-1" : ""}
                        ${isPast && !isSelected ? "opacity-50" : ""}
                      `}
                      style={
                        isSelected
                          ? { backgroundColor: primaryColor }
                          : isToday
                            ? {
                                outline: `2px solid ${primaryColor}`,
                                outlineOffset: "2px",
                              }
                            : {}
                      }
                    >
                      <span
                        className={`text-sm font-bold ${isSelected ? "text-white" : isPast ? "text-gray-400" : "text-gray-800"}`}
                      >
                        {day}
                      </span>
                      {apptCount > 0 && (
                        <span
                          className={`text-[9px] font-bold leading-none px-1 rounded-full mt-0.5 ${isSelected ? "bg-white/30 text-white" : ""}`}
                          style={
                            !isSelected
                              ? { color: hasPending ? "#f59e0b" : primaryColor }
                              : {}
                          }
                        >
                          {apptCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 mt-4 px-1">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Onay
                  bekliyor
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  />{" "}
                  Onaylı
                </span>
              </div>
            </div>

            {/* Day appointments */}
            {selectedDate && (
              <div className="mt-4 animate-in">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="font-bold text-gray-900">
                    {formatDayHeader(selectedDate)}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {selectedDayAppointments.length} randevu
                  </span>
                </div>

                {selectedDayAppointments.length === 0 ? (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
                    <p className="text-gray-400 font-medium">
                      Bu gün randevu yok
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDayAppointments.map((appt) => (
                      <AppointmentItem
                        key={appt.id}
                        appt={appt}
                        onUpdate={handleStatusUpdate}
                        updatingId={updatingId}
                        primaryColor={primaryColor}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {!selectedDate && (
              <div className="text-center mt-8">
                <p className="text-gray-400 text-sm">
                  Randevuları görmek için takvimden bir gün seçin
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "customers" && (
          <div className="animate-in">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="font-bold text-gray-900">Müşteri Listesi</h3>
              <span className="text-sm text-gray-500">
                {customers.length} kişi
              </span>
            </div>

            {loadingCustomers ? (
              <div className="flex justify-center py-12">
                <Loader2
                  className="w-7 h-7 animate-spin"
                  style={{ color: primaryColor }}
                />
              </div>
            ) : customers.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 text-center">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">Henüz müşteri yok</p>
                <p className="text-gray-300 text-sm mt-1">
                  İlk randevu ile müşteriler otomatik oluşur
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {customers.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3"
                  >
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">
                        {c.name}
                      </p>
                      <a
                        href={`tel:${c.phone}`}
                        className="text-gray-500 text-sm flex items-center gap-1 hover:text-gray-700"
                      >
                        <Phone className="w-3 h-3" />
                        {c.phone}
                      </a>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className="text-lg font-bold"
                        style={{ color: primaryColor }}
                      >
                        {c.appointmentCount}
                      </p>
                      <p className="text-gray-400 text-xs">randevu</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "webhooks" && (
          <div className="animate-in">
            {/* Add webhook form */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-4">
              <p className="font-bold text-gray-900 mb-3">Yeni Webhook Ekle</p>
              <div className="space-y-3">
                <input
                  type="url"
                  value={newWhUrl}
                  onChange={(e) => setNewWhUrl(e.target.value)}
                  placeholder="https://example.com/webhook"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewWhEvent("appointment_created")}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      newWhEvent === "appointment_created"
                        ? "text-white border-transparent"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                    style={
                      newWhEvent === "appointment_created"
                        ? { backgroundColor: primaryColor }
                        : {}
                    }
                  >
                    Randevu Oluşturuldu
                  </button>
                  <button
                    onClick={() => setNewWhEvent("appointment_approved")}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      newWhEvent === "appointment_approved"
                        ? "text-white border-transparent"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                    style={
                      newWhEvent === "appointment_approved"
                        ? { backgroundColor: primaryColor }
                        : {}
                    }
                  >
                    Randevu Onaylandı
                  </button>
                </div>
                <input
                  type="text"
                  value={newWhSecret}
                  onChange={(e) => setNewWhSecret(e.target.value)}
                  placeholder="Secret key (opsiyonel)"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2"
                />
                <button
                  onClick={handleAddWebhook}
                  disabled={addingWh || !newWhUrl.trim()}
                  className="w-full py-3 rounded-2xl font-bold text-white text-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  {addingWh ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Ekle
                </button>
              </div>
            </div>

            {/* Webhook list */}
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-bold text-gray-900">Kayıtlı Webhook'lar</h3>
              <span className="text-sm text-gray-500">
                {webhooks.length} adet
              </span>
            </div>

            {loadingWebhooks ? (
              <div className="flex justify-center py-12">
                <Loader2
                  className="w-7 h-7 animate-spin"
                  style={{ color: primaryColor }}
                />
              </div>
            ) : webhooks.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 text-center">
                <WebhookIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">Henüz webhook yok</p>
                <p className="text-gray-300 text-sm mt-1">
                  Yukarıdan yeni bir webhook ekleyin
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {webhooks.map((wh) => (
                  <div
                    key={wh.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          wh.isActive
                            ? "text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                        style={
                          wh.isActive ? { backgroundColor: primaryColor } : {}
                        }
                      >
                        <WebhookIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-mono break-all ${wh.isActive ? "text-gray-900" : "text-gray-400 line-through"}`}
                        >
                          {wh.url}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              wh.event === "appointment_created"
                                ? "bg-blue-50 text-blue-600"
                                : "bg-green-50 text-green-600"
                            }`}
                          >
                            {wh.event === "appointment_created"
                              ? "Oluşturuldu"
                              : "Onaylandı"}
                          </span>
                          {wh.secret && (
                            <span className="text-xs text-gray-400">
                              🔑 Secret
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() =>
                            handleToggleWebhook(wh.id, !wh.isActive)
                          }
                          className="p-2 rounded-xl hover:bg-gray-50 transition-colors"
                          title={
                            wh.isActive ? "Devre dışı bırak" : "Aktifleştir"
                          }
                        >
                          {wh.isActive ? (
                            <ToggleRight
                              className="w-5 h-5"
                              style={{ color: primaryColor }}
                            />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-gray-300" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteWebhook(wh.id)}
                          className="p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-gray-50 rounded-2xl p-4 mt-4">
              <p className="text-gray-500 text-xs leading-relaxed">
                <strong>Webhook Payload:</strong> Her tetiklemede POST isteği
                gönderilir.
                <br />
                Header:{" "}
                <code className="bg-gray-200 px-1 rounded">
                  Content-Type: application/json
                </code>
                <br />
                Secret varsa:{" "}
                <code className="bg-gray-200 px-1 rounded">
                  X-Webhook-Secret: ***
                </code>
                <br />
                Body:{" "}
                <code className="bg-gray-200 px-1 rounded">
                  {'{"event", "timestamp", "data": {…}}'}
                </code>
              </p>
            </div>
          </div>
        )}
      </div>

      {showBranding && (
        <BrandingModal
          business={currentBusiness}
          template={template}
          onClose={() => setShowBranding(false)}
          onSave={(updated) => {
            setCurrentBusiness(updated as Business & { services: Service[] });
            fetchMonthData(year, month);
          }}
        />
      )}
    </div>
  );
}

function LoginView({
  password,
  setPassword,
  error,
  onLogin,
  business,
  template,
}: {
  password: string;
  setPassword: (v: string) => void;
  error: string;
  onLogin: () => void;
  business: Business;
  template: SectorTemplate;
}) {
  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${template.heroGradient} flex items-center justify-center px-5`}
    >
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          {business.logo ? (
            <img
              src={business.logo}
              alt={business.name}
              className="w-20 h-20 rounded-3xl object-cover mx-auto mb-4 shadow-2xl"
            />
          ) : (
            <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl mx-auto mb-4 shadow-2xl">
              {template.emoji}
            </div>
          )}
          <h1 className="text-2xl font-bold text-white">{business.name}</h1>
          <p className="text-white/60 mt-1 text-sm">Yönetim Paneli</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre"
              className="w-full px-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 text-base focus:outline-none focus:ring-2 text-center tracking-widest"
              onKeyDown={(e) => e.key === "Enter" && onLogin()}
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
            <button
              onClick={onLogin}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-[0.98] shadow-lg"
              style={{ backgroundColor: business.primaryColor }}
            >
              Giriş Yap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppointmentItem({
  appt,
  onUpdate,
  updatingId,
  primaryColor,
}: {
  appt: Appointment;
  onUpdate: (id: string, status: string) => void;
  updatingId: string | null;
  primaryColor: string;
}) {
  const isUpdating = updatingId === appt.id;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-bold text-lg shadow-sm"
          style={{ backgroundColor: primaryColor }}
        >
          {appt.time.replace(":", "")}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-900 text-base">
              {appt.customerName}
            </p>
            <span
              className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusColor(appt.status)}`}
            >
              {getStatusLabel(appt.status)}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
            <a
              href={`tel:${appt.customerPhone}`}
              className="text-sm text-gray-500 flex items-center gap-1 hover:text-gray-700"
            >
              <Phone className="w-3 h-3" />
              {appt.customerPhone}
            </a>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {appt.time}
            </span>
            {appt.service && (
              <span className="text-sm text-gray-500">{appt.service.name}</span>
            )}
          </div>
        </div>

        {appt.status === "pending" && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => onUpdate(appt.id, "approved")}
              disabled={isUpdating}
              className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => onUpdate(appt.id, "cancelled")}
              disabled={isUpdating}
              className="w-11 h-11 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {appt.status === "approved" && (
          <button
            onClick={() => onUpdate(appt.id, "completed")}
            disabled={isUpdating}
            className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
            style={{
              backgroundColor: `${primaryColor}15`,
              color: primaryColor,
            }}
          >
            {isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function NotifDropdown({
  notifications,
  onClose,
}: {
  notifications: Notification[];
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="font-semibold text-gray-900 text-sm">Bildirimler</p>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-6 text-center text-gray-400 text-sm">
              Bildirim yok
            </div>
          ) : (
            notifications.slice(0, 15).map((n) => (
              <div
                key={n.id}
                className={`px-4 py-3 border-b border-gray-50 ${!n.isRead ? "bg-blue-50/60" : ""}`}
              >
                <p
                  className={`text-sm ${!n.isRead ? "font-semibold text-gray-900" : "text-gray-600"}`}
                >
                  {n.message}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(n.createdAt).toLocaleString("tr-TR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
