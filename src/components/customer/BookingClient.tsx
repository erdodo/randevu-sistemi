"use client";

import { useState, useEffect, useCallback } from "react";
import { Business, Service, Appointment } from "@/types";
import { SectorTemplate } from "@/lib/templates";
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  Loader2,
  X,
  CalendarDays,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { formatDayHeader } from "@/lib/calendar";
import { getStatusLabel } from "@/lib/utils";

interface BookingClientProps {
  business: Business & { services: Service[] };
  template: SectorTemplate;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const STORAGE_KEY = "randevu_user_info";
const APPT_STORAGE_KEY = "randevu_appointments";
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

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function buildCalendar(year: number, month: number): (number | null)[] {
  const total = new Date(year, month + 1, 0).getDate();
  const firstJS = new Date(year, month, 1).getDay();
  const firstTR = (firstJS + 6) % 7;
  const cells: (number | null)[] = Array(firstTR).fill(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
}

function getCurrentMonthStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function BookingClient({
  business,
  template,
}: BookingClientProps) {
  const now = new Date();
  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());

  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isReturning, setIsReturning] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{
    date: string;
    time: string;
  } | null>(null);

  // Current month appointment tracking
  const [currentMonthAppt, setCurrentMonthAppt] = useState<Appointment | null>(
    null,
  );
  const [loadingAppt, setLoadingAppt] = useState(true);
  const [showBooking, setShowBooking] = useState(false);

  const workingDays = business.workingDays.split(",").map(Number);
  const primaryColor = business.primaryColor;

  // Load user info + check current month appointment
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const info = JSON.parse(stored);
        if (info.name && info.phone) {
          setName(info.name);
          setPhone(info.phone);
          setIsReturning(true);

          // Check for current month appointment
          const currentMonth = getCurrentMonthStr();
          fetch(`/api/appointments?slug=${business.slug}&month=${currentMonth}`)
            .then((res) => res.json())
            .then((data: Appointment[]) => {
              if (Array.isArray(data)) {
                const myAppt = data.find(
                  (a) =>
                    a.customerPhone === info.phone && a.status !== "cancelled",
                );
                if (myAppt) {
                  setCurrentMonthAppt(myAppt);
                } else {
                  setShowBooking(true);
                }
              } else {
                setShowBooking(true);
              }
            })
            .catch(() => setShowBooking(true))
            .finally(() => setLoadingAppt(false));
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setLoadingAppt(false);
    setShowBooking(true);
  }, [business.slug]);

  // Also store appointment id in localStorage
  useEffect(() => {
    if (successData) {
      try {
        const stored = localStorage.getItem(APPT_STORAGE_KEY);
        const appts: string[] = stored ? JSON.parse(stored) : [];
        appts.push(`${successData.date}_${successData.time}`);
        localStorage.setItem(APPT_STORAGE_KEY, JSON.stringify(appts));
      } catch {
        /* ignore */
      }
    }
  }, [successData]);

  const fetchSlots = useCallback(
    async (dateStr: string) => {
      setLoadingSlots(true);
      setTimeSlots([]);
      try {
        const res = await fetch(
          `/api/timeslots?slug=${business.slug}&date=${dateStr}`,
        );
        const data = await res.json();
        setTimeSlots(data.slots ?? []);
      } catch {
        setTimeSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    },
    [business.slug],
  );

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedTime(null);
    setShowSheet(false);
    fetchSlots(dateStr);
    setTimeout(() => {
      document
        .getElementById("time-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleTimeClick = (time: string) => {
    setSelectedTime(time);
    setShowSheet(true);
    setError("");
  };

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      setError("İsim ve telefon numarası gerekli");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Geçerli bir telefon girin");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      );
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          date: selectedDate,
          time: selectedTime,
          serviceId: selectedServiceId || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Hata oluştu");
      }
      setSuccessData({ date: selectedDate!, time: selectedTime! });
      setShowSheet(false);
      setIsReturning(true);
      setEditingInfo(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  const goToPrevMonth = () => {
    if (year === now.getFullYear() && month === now.getMonth()) return;
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
    setSelectedDate(null);
    setSelectedTime(null);
    setTimeSlots([]);
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
    setSelectedDate(null);
    setSelectedTime(null);
    setTimeSlots([]);
  };

  const calendarCells = buildCalendar(year, month);
  const isAtMinMonth = year === now.getFullYear() && month === now.getMonth();
  const showForm = !isReturning || editingInfo;

  // Loading state
  if (loadingAppt) {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br ${template.heroGradient} flex items-center justify-center`}
      >
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  // Success screen
  if (successData) {
    return (
      <SuccessScreen
        name={name}
        date={successData.date}
        time={successData.time}
        business={business}
        template={template}
        onNewBooking={() => {
          setSuccessData(null);
          setSelectedDate(null);
          setSelectedTime(null);
          setTimeSlots([]);
          setCurrentMonthAppt(null);
          setShowBooking(true);
        }}
      />
    );
  }

  // Current month appointment status card
  if (currentMonthAppt && !showBooking) {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br ${template.heroGradient} relative`}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 -left-20 w-80 h-80 bg-white/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 -right-20 w-60 h-60 bg-white/5 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-sm mx-auto px-5 pt-16 pb-12 flex flex-col items-center min-h-screen">
          {/* Business header */}
          <div className="text-center mb-8">
            {business.logo ? (
              <img
                src={business.logo}
                alt={business.name}
                className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3 shadow-xl"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl mx-auto mb-3 shadow-xl">
                {template.emoji}
              </div>
            )}
            <h1 className="text-xl font-bold text-white">{business.name}</h1>
          </div>

          {/* Status card */}
          <div className="w-full bg-white/10 backdrop-blur-sm rounded-3xl border border-white/15 p-6 mb-6">
            <div className="flex items-center gap-2 mb-5">
              {currentMonthAppt.status === "pending" && (
                <AlertCircle className="w-5 h-5 text-amber-400" />
              )}
              {currentMonthAppt.status === "approved" && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
              {currentMonthAppt.status === "cancelled" && (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
              {currentMonthAppt.status === "completed" && (
                <CheckCircle2 className="w-5 h-5 text-sky-400" />
              )}
              <h2 className="text-white font-bold text-lg">Randevunuz</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <CalendarDays className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/50 text-xs">Tarih & Saat</p>
                  <p className="text-white font-semibold">
                    {formatDayHeader(currentMonthAppt.date)} ·{" "}
                    {currentMonthAppt.time}
                  </p>
                </div>
              </div>

              {currentMonthAppt.service && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">{template.emoji}</span>
                  </div>
                  <div>
                    <p className="text-white/50 text-xs">Hizmet</p>
                    <p className="text-white font-semibold">
                      {currentMonthAppt.service.name}
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <div
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold ${
                    currentMonthAppt.status === "pending"
                      ? "bg-amber-400/20 text-amber-300"
                      : currentMonthAppt.status === "approved"
                        ? "bg-emerald-400/20 text-emerald-300"
                        : currentMonthAppt.status === "cancelled"
                          ? "bg-red-400/20 text-red-300"
                          : "bg-sky-400/20 text-sky-300"
                  }`}
                >
                  {currentMonthAppt.status === "pending" && (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                  {currentMonthAppt.status === "approved" && (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  {getStatusLabel(currentMonthAppt.status)}
                </div>
              </div>
            </div>
          </div>

          {/* Contact info */}
          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              className="w-full bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 px-5 py-4 flex items-center gap-3 mb-4 transition-all active:scale-[0.98]"
            >
              <Phone className="w-5 h-5 text-white/60" />
              <div>
                <p className="text-white/50 text-xs">İletişim</p>
                <p className="text-white font-semibold text-sm">
                  {business.phone}
                </p>
              </div>
            </a>
          )}

          <button
            onClick={() => setShowBooking(true)}
            className="w-full py-4 rounded-2xl bg-white font-bold text-base transition-all active:scale-[0.98] shadow-lg mt-auto"
            style={{ color: primaryColor }}
          >
            Yeni Randevu Al
          </button>
        </div>
      </div>
    );
  }

  // Booking flow
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div
        className={`bg-gradient-to-br ${template.heroGradient} px-5 pt-12 pb-8`}
      >
        <div className="max-w-sm mx-auto">
          <div className="flex items-center gap-4">
            {business.logo ? (
              <img
                src={business.logo}
                alt={business.name}
                className="w-16 h-16 rounded-2xl object-cover shadow-xl flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-xl flex-shrink-0">
                {template.emoji}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-bold text-2xl leading-tight">
                {business.name}
              </h1>
              {business.description && (
                <p className="text-white/70 text-sm mt-0.5 leading-snug">
                  {business.description}
                </p>
              )}
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className="text-white/80 text-xs flex items-center gap-1 hover:text-white"
                  >
                    <Phone className="w-3 h-3" />
                    {business.phone}
                  </a>
                )}
                {business.address && (
                  <span className="text-white/70 text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {business.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-white flex-shrink-0" />
            <p className="text-white font-medium text-sm">
              Randevu almak için takvimden bir gün seçin
            </p>
          </div>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="max-w-sm mx-auto px-4 -mt-2">
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-5 mt-4">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={goToPrevMonth}
              disabled={isAtMinMonth}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors disabled:opacity-30"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <ChevronLeft
                className="w-5 h-5"
                style={{ color: primaryColor }}
              />
            </button>
            <div className="text-center">
              <p className="font-bold text-gray-900 text-lg leading-tight">
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
              const isPast = dateStr < todayStr;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const jsDay = new Date(year, month, day).getDay();
              const isWorking = workingDays.includes(jsDay);
              const isClickable = !isPast && isWorking;

              return (
                <button
                  key={i}
                  onClick={() => isClickable && handleDayClick(dateStr)}
                  disabled={!isClickable}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-semibold transition-all
                    ${isSelected ? "text-white scale-110 shadow-lg" : ""}
                    ${!isSelected && isToday ? "ring-2 ring-offset-1 text-gray-900 bg-white" : ""}
                    ${!isSelected && !isToday && isClickable ? "text-gray-800 hover:text-white active:scale-95" : ""}
                    ${isPast ? "text-gray-300 cursor-not-allowed" : ""}
                    ${!isWorking && !isPast ? "text-gray-300 cursor-not-allowed" : ""}
                  `}
                  style={
                    isSelected
                      ? { backgroundColor: primaryColor }
                      : isToday
                        ? {
                            outline: `2px solid ${primaryColor}`,
                            outlineOffset: "2px",
                          }
                        : isClickable
                          ? {}
                          : {}
                  }
                  onMouseEnter={(e) => {
                    if (isClickable && !isSelected) {
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = primaryColor;
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "white";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isClickable && !isSelected) {
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = "";
                      (e.currentTarget as HTMLButtonElement).style.color = "";
                    }
                  }}
                >
                  {day}
                  {isToday && !isSelected && (
                    <span
                      className="w-1 h-1 rounded-full mt-0.5"
                      style={{ backgroundColor: primaryColor }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Çalışma günleri:{" "}
            {TR_DAYS_SHORT.filter((_, i) => {
              const jsDay = i === 6 ? 0 : i + 1;
              return workingDays.includes(jsDay);
            }).join(" · ")}
            {" · "}
            {business.openTime}–{business.closeTime}
          </p>
        </div>

        {/* Time Slots */}
        {selectedDate && (
          <div
            id="time-section"
            className="bg-white rounded-3xl shadow-md border border-gray-100 p-5 mt-4 animate-in"
          >
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: primaryColor }}
              />
              <h3 className="font-bold text-gray-900">
                {formatDayHeader(selectedDate)}
              </h3>
            </div>

            {loadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2
                  className="w-7 h-7 animate-spin"
                  style={{ color: primaryColor }}
                />
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 font-medium">
                  Bu gün için boş saat yok
                </p>
                <p className="text-gray-300 text-sm mt-1">
                  Başka bir gün seçebilirsiniz
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((slot) => {
                    const isBooked = !slot.available;
                    const isSel = slot.time === selectedTime;
                    return (
                      <button
                        key={slot.time}
                        onClick={() => !isBooked && handleTimeClick(slot.time)}
                        disabled={isBooked}
                        className={`py-3.5 rounded-2xl text-sm font-bold transition-all
                          ${isBooked ? "bg-gray-100 text-gray-300 cursor-not-allowed" : ""}
                          ${!isBooked && !isSel ? "bg-gray-50 text-gray-700 border border-gray-200 hover:text-white active:scale-95" : ""}
                          ${isSel ? "text-white scale-105 shadow-md" : ""}
                        `}
                        style={
                          isSel
                            ? { backgroundColor: primaryColor }
                            : isBooked
                              ? {}
                              : {}
                        }
                        onMouseEnter={(e) => {
                          if (!isBooked && !isSel) {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.backgroundColor = primaryColor;
                            (e.currentTarget as HTMLButtonElement).style.color =
                              "white";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isBooked && !isSel) {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.backgroundColor = "";
                            (e.currentTarget as HTMLButtonElement).style.color =
                              "";
                          }
                        }}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
                <p className="text-center text-xs text-gray-400 mt-3">
                  Bir saate dokunun, randevunuzu alın
                </p>
              </>
            )}
          </div>
        )}

        {!selectedDate && (
          <div className="text-center mt-8 mb-4">
            <p className="text-gray-400 text-sm">Takvimde bir gün seçin</p>
          </div>
        )}

        <div className="h-8" />
      </div>

      {/* Booking Bottom Sheet */}
      {showSheet && selectedDate && selectedTime && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowSheet(false);
              setSelectedTime(null);
            }}
          />
          <div className="relative w-full bg-white rounded-t-3xl shadow-2xl max-w-sm mx-auto animate-slide-up">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3" />

            <div className="flex items-start justify-between px-6 pt-4 pb-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Randevu Al</h2>
                <p className="text-gray-500 text-sm mt-0.5">
                  {formatDayHeader(selectedDate)} · {selectedTime}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSheet(false);
                  setSelectedTime(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl -mt-1 -mr-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pb-8 pt-2">
              {showForm ? (
                <div className="space-y-3 mb-5">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ad Soyad"
                    autoFocus
                    className="w-full px-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 text-base placeholder-gray-400 focus:outline-none focus:ring-2"
                    style={
                      {
                        "--tw-ring-color": `${primaryColor}40`,
                      } as React.CSSProperties
                    }
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Telefon Numarası (05xx...)"
                    className="w-full px-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 text-base placeholder-gray-400 focus:outline-none focus:ring-2"
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-4 mb-5">
                  <div>
                    <p className="font-bold text-gray-900 text-base">{name}</p>
                    <p className="text-gray-500 text-sm">{phone}</p>
                  </div>
                  <button
                    onClick={() => setEditingInfo(true)}
                    className="text-sm font-medium underline"
                    style={{ color: primaryColor }}
                  >
                    Değiştir
                  </button>
                </div>
              )}

              {/* Service selection */}
              {business.services && business.services.length > 0 && (
                <div className="mb-5">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Hizmet seçin{" "}
                    <span className="text-gray-400 font-normal">
                      (opsiyonel)
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {business.services.map((s) => (
                      <button
                        key={s.id}
                        onClick={() =>
                          setSelectedServiceId((prev) =>
                            prev === s.id ? null : s.id,
                          )
                        }
                        className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all active:scale-95 ${
                          selectedServiceId === s.id
                            ? "text-white border-transparent shadow-sm"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
                        }`}
                        style={
                          selectedServiceId === s.id
                            ? { backgroundColor: primaryColor }
                            : {}
                        }
                      >
                        {s.name}
                        {s.price != null && (
                          <span className="text-xs opacity-70 ml-1">
                            ₺{s.price}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <p className="text-red-500 text-sm text-center bg-red-50 rounded-xl px-3 py-2 mb-4">
                  {error}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-[0.98] shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Gönderiliyor...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> Randevuyu Onayla
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SuccessScreen({
  name,
  date,
  time,
  business,
  template,
  onNewBooking,
}: {
  name: string;
  date: string;
  time: string;
  business: Business;
  template: SectorTemplate;
  onNewBooking: () => void;
}) {
  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${template.heroGradient} flex flex-col items-center justify-center px-6 text-center`}
    >
      <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 shadow-2xl">
        <CheckCircle2 className="w-12 h-12 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-2">Harika!</h1>
      <p className="text-white/80 text-lg mb-8">
        Randevunuz alındı, onay bekleniyor
      </p>

      <div className="bg-white/15 backdrop-blur-sm rounded-3xl p-6 w-full max-w-xs text-left space-y-4 mb-8 border border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white/60 text-xs">Tarih & Saat</p>
            <p className="text-white font-semibold">
              {formatDayHeader(date)} · {time}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">{template.emoji}</span>
          </div>
          <div>
            <p className="text-white/60 text-xs">İşletme</p>
            <p className="text-white font-semibold">{business.name}</p>
            {business.phone && (
              <p className="text-white/70 text-sm">{business.phone}</p>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={onNewBooking}
        className="w-full max-w-xs py-4 rounded-2xl bg-white font-bold text-base transition-all active:scale-[0.98] shadow-lg"
        style={{ color: business.primaryColor }}
      >
        Yeni Randevu Al
      </button>
    </div>
  );
}
