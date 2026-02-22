export type Sector = "barber" | "dentist" | "psychologist" | "spa" | "nail" | "fitness";

export interface SectorTemplate {
  id: Sector;
  label: string;
  emoji: string;
  heroGradient: string;
  cardBg: string;
  primaryColor: string;
  accentColor: string;
  buttonClass: string;
  badgeClass: string;
  textOnPrimary: string;
  defaultServices: string[];
  tagline: string;
  font?: string;
}

export const SECTOR_TEMPLATES: Record<Sector, SectorTemplate> = {
  barber: {
    id: "barber",
    label: "Kuaför & Berber",
    emoji: "✂️",
    heroGradient: "from-zinc-900 via-neutral-900 to-stone-900",
    cardBg: "bg-zinc-800/90",
    primaryColor: "#c9a227",
    accentColor: "#1a1a2e",
    buttonClass: "bg-amber-500 hover:bg-amber-400 text-zinc-900",
    badgeClass: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    textOnPrimary: "text-zinc-900",
    defaultServices: ["Saç Kesimi", "Sakal Düzeltme", "Fön", "Boya", "Keratin"],
    tagline: "Tarzınız, Ustalığımız",
  },
  dentist: {
    id: "dentist",
    label: "Diş Hekimi",
    emoji: "🦷",
    heroGradient: "from-sky-600 via-cyan-600 to-teal-600",
    cardBg: "bg-white/95",
    primaryColor: "#0284c7",
    accentColor: "#e0f2fe",
    buttonClass: "bg-sky-600 hover:bg-sky-500 text-white",
    badgeClass: "bg-sky-100 text-sky-700 border-sky-200",
    textOnPrimary: "text-white",
    defaultServices: ["Genel Muayene", "Diş Temizleme", "Dolgu", "Kanal Tedavisi", "İmplant Konsültasyon"],
    tagline: "Sağlıklı Gülüşler İçin",
  },
  psychologist: {
    id: "psychologist",
    label: "Psikolog",
    emoji: "🧠",
    heroGradient: "from-violet-700 via-purple-700 to-fuchsia-700",
    cardBg: "bg-white/95",
    primaryColor: "#7c3aed",
    accentColor: "#ede9fe",
    buttonClass: "bg-violet-600 hover:bg-violet-500 text-white",
    badgeClass: "bg-violet-100 text-violet-700 border-violet-200",
    textOnPrimary: "text-white",
    defaultServices: ["Bireysel Terapi", "Çift Terapisi", "Çocuk & Ergen", "Kariyer Danışmanlığı", "Online Seans"],
    tagline: "İyilik Halinize Doğru",
  },
  spa: {
    id: "spa",
    label: "Güzellik & Spa",
    emoji: "💆",
    heroGradient: "from-rose-500 via-pink-500 to-fuchsia-500",
    cardBg: "bg-white/95",
    primaryColor: "#e11d48",
    accentColor: "#fff1f2",
    buttonClass: "bg-rose-500 hover:bg-rose-400 text-white",
    badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
    textOnPrimary: "text-white",
    defaultServices: ["Klasik Masaj", "Aromaterapi", "Cilt Bakımı", "Kalıcı Makyaj", "Epilasyon"],
    tagline: "Kendinize Zaman Ayırın",
  },
  nail: {
    id: "nail",
    label: "Nail Studio",
    emoji: "💅",
    heroGradient: "from-fuchsia-600 via-pink-600 to-rose-500",
    cardBg: "bg-white/95",
    primaryColor: "#c026d3",
    accentColor: "#fdf4ff",
    buttonClass: "bg-fuchsia-600 hover:bg-fuchsia-500 text-white",
    badgeClass: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
    textOnPrimary: "text-white",
    defaultServices: ["Kalıcı Oje", "Nail Art", "Manikür", "Pedikür", "Tırnak Uzatma"],
    tagline: "Her El Bir Sanat Eseri",
  },
  fitness: {
    id: "fitness",
    label: "Fitness & PT",
    emoji: "💪",
    heroGradient: "from-orange-600 via-red-600 to-rose-700",
    cardBg: "bg-zinc-900/90",
    primaryColor: "#f97316",
    accentColor: "#1c1c1c",
    buttonClass: "bg-orange-500 hover:bg-orange-400 text-white",
    badgeClass: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    textOnPrimary: "text-white",
    defaultServices: ["PT Seansı", "Beslenme Danışmanlığı", "Grup Dersi", "Vücut Analizi", "Program Hazırlama"],
    tagline: "Limitlerini Yeniden Belirle",
  },
};

export function getTemplate(sector: string): SectorTemplate {
  return SECTOR_TEMPLATES[sector as Sector] ?? SECTOR_TEMPLATES.barber;
}

export const SECTOR_LIST = Object.values(SECTOR_TEMPLATES);
