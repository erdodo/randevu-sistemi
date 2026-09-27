import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, Bell, Smartphone, Users } from "lucide-react";
import { getSession } from "@/lib/session";
import { CAMPAIGN_END_LABEL } from "@/lib/campaign";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: CalendarCheck, title: "Online randevu", text: "Müşterileriniz size özel adresten boş saatleri görüp randevu alır." },
  { icon: Bell, title: "Anlık bildirim", text: "Yeni randevular panelinize düşer; tek dokunuşla onaylayın." },
  { icon: Users, title: "Müşteri listesi", text: "Kim, ne zaman, kaç kez geldi; hepsi otomatik tutulur." },
  { icon: Smartphone, title: "Telefona kurulur", text: "Uygulama gibi ana ekrana eklenir, kurulum gerektirmez." },
];

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect(`/${session.slug}/admin`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
      <div className="mx-auto max-w-md px-5 py-14">
        <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80">
          {CAMPAIGN_END_LABEL} tarihine kadar ücretsiz
        </div>
        <h1 className="mt-6 text-4xl font-bold leading-tight">İşletmeniz için online randevu sistemi</h1>
        <p className="mt-4 text-base text-white/60">
          Kuaför, berber, güzellik salonu, klinik, diyetisyen… Birkaç dakikada kendi randevu sayfanızı açın, müşterileriniz 7/24 randevu alsın.
        </p>

        <div className="mt-8 grid gap-3">
          <Link href="/register" className="rounded-2xl bg-white py-4 text-center font-bold text-indigo-950 shadow-lg transition active:scale-[0.98]">
            Ücretsiz üye ol
          </Link>
          <Link href="/login" className="rounded-2xl border border-white/20 py-4 text-center font-semibold text-white/90 transition hover:bg-white/10">
            İşletme girişi
          </Link>
        </div>

        <div className="mt-12 grid gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <f.icon className="h-6 w-6 shrink-0 text-indigo-300" />
              <div>
                <p className="font-semibold">{f.title}</p>
                <p className="mt-1 text-sm text-white/55">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
