import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
} from "lucide-react";
import { talebeleriDinle, type Talebe } from "@/lib/talebeler";

export const Route = createFileRoute("/talebe/$id")({
  head: () => ({
    meta: [
      { title: "Talebe Profili — SİEC JİGJİGA KURSU" },
      {
        name: "description",
        content:
          "Talebenin kıraat günleri, Kur'an-ı Kerim sayfası, cüzü ve ilerleme geçmişi.",
      },
      { property: "og:title", content: "Talebe Profili — SİEC JİGJİGA KURSU" },
      {
        property: "og:description",
        content:
          "Talebenin kıraat günleri, Kur'an-ı Kerim sayfası, cüzü ve ilerleme geçmişi.",
      },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Talebe Profili — SİEC JİGJİGA KURSU" },
      {
        name: "twitter:description",
        content:
          "Talebenin kıraat günleri, Kur'an-ı Kerim sayfası, cüzü ve ilerleme geçmişi.",
      },
    ],
  }),
  component: TalebeProfil,
});

const SAYFA_BASINA_CUZ = 20;
const TALEBE_CACHE_KEY = "talebe-takip-cache-v1";
const HAFTA_MS = 7 * 24 * 60 * 60 * 1000;

const GUN_KISA = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Pzr"] as const;

function cuzHesapla(sayfa: number) {
  if (sayfa < 1) return 1;
  if (sayfa > 604) return 30;
  return Math.min(30, Math.floor((sayfa - 1) / SAYFA_BASINA_CUZ) + 1);
}

function haftaBaslangici(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const gun = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - gun);
  return x.getTime();
}

function haftaEtiket(baslangic: number) {
  const b = new Date(baslangic);
  const s = new Date(baslangic + 6 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
  return `${fmt(b)} – ${fmt(s)}`;
}

function tarihSaat(t: number) {
  return new Date(t).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function TalebeProfil() {
  const { id } = Route.useParams();
  const [talebeler, setTalebeler] = useState<Talebe[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(TALEBE_CACHE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? (parsed as Talebe[]) : [];
    } catch {
      return [];
    }
  });
  const [yuklendi, setYuklendi] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [seciliHafta, setSeciliHafta] = useState<number>(() =>
    haftaBaslangici(),
  );

  useEffect(() => {
    const unsub = talebeleriDinle(
      (liste) => {
        setTalebeler(liste);
        setYuklendi(true);
      },
      (e) => {
        setHata(e.message);
        setYuklendi(true);
      },
    );
    return () => unsub();
  }, []);

  const talebe = talebeler.find((t) => t.id === id) ?? null;

  const buHafta = haftaBaslangici();
  const haftaFarki = Math.round((seciliHafta - buHafta) / HAFTA_MS);
  const haftaBasligi =
    haftaFarki === 0
      ? "Bu hafta"
      : haftaFarki === -1
        ? "Geçen hafta"
        : haftaFarki === 1
          ? "Gelecek hafta"
          : haftaFarki < 0
            ? `${-haftaFarki} hafta önce`
            : `${haftaFarki} hafta sonra`;

  const gunler = useMemo(() => {
    const k = talebe?.kiraatGunler?.[String(seciliHafta)];
    return Array.isArray(k) ? k : [];
  }, [talebe, seciliHafta]);

  const haftaIlerleme = useMemo(() => {
    if (!talebe) return 0;
    const oncekiler = talebe.gecmis.filter((g) => g.t < seciliHafta);
    const bas =
      oncekiler.length > 0
        ? oncekiler[oncekiler.length - 1].sayfa
        : (talebe.gecmis[0]?.sayfa ?? talebe.sayfa);
    const icinde = talebe.gecmis.filter(
      (g) => g.t >= seciliHafta && g.t < seciliHafta + HAFTA_MS,
    );
    const son = icinde.length > 0 ? icinde[icinde.length - 1].sayfa : bas;
    return Math.max(0, son - bas);
  }, [talebe, seciliHafta]);

  const gecmisTers = useMemo(
    () => (talebe ? [...talebe.gecmis].reverse().slice(0, 20) : []),
    [talebe],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-3 py-8 sm:px-6 sm:py-12">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" /> Tabloya dön
          </Link>
        </Button>

        {!talebe && !yuklendi && (
          <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…
          </div>
        )}

        {!talebe && yuklendi && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {hata ? `Bağlantı hatası: ${hata}` : "Talebe bulunamadı."}
            </CardContent>
          </Card>
        )}

        {talebe && (
          <>
            <header className="mb-6 flex items-center gap-4">
              <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <GraduationCap className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {talebe.isim}
                </h1>
                <p className="text-sm text-muted-foreground">
                  SİEC JİGJİGA KURSU · Talebe Profili
                </p>
              </div>
            </header>

            <div className="mb-6 grid grid-cols-3 gap-3">
              <Bilgi etiket="Sayfa" deger={talebe.sayfa} />
              <Bilgi etiket="Cüz" deger={cuzHesapla(talebe.sayfa)} />
              <Bilgi etiket="Bu hafta" deger={`${haftaIlerleme} sf`} />
            </div>

            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 bg-secondary/30 px-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">
                  {haftaBasligi}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="tabular-nums text-muted-foreground">
                  {haftaEtiket(seciliHafta)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setSeciliHafta((h) => h - HAFTA_MS)}
                  aria-label="Önceki hafta"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSeciliHafta(haftaBaslangici())}
                  disabled={haftaFarki === 0}
                >
                  Bu hafta
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setSeciliHafta((h) => h + HAFTA_MS)}
                  aria-label="Sonraki hafta"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Card className="mb-6">
              <CardContent className="py-4">
                <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                  Kıraat günleri
                </div>
                <div className="flex flex-wrap gap-2">
                  {GUN_KISA.map((isim, i) => {
                    const aktif = gunler.includes(i);
                    return (
                      <span
                        key={i}
                        className={`rounded-md border px-2 py-1 text-xs font-medium ${
                          aktif
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        {isim}
                      </span>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {gunler.length > 0
                    ? `${gunler.length} gün kıraat verdi.`
                    : "Bu hafta kıraat kaydı yok."}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <BookOpen className="h-3.5 w-3.5" /> İlerleme geçmişi
                </div>
                {gecmisTers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Henüz kayıt yok.
                  </p>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {gecmisTers.map((g, i) => (
                      <li
                        key={`${g.t}-${i}`}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <span className="text-muted-foreground">
                          {tarihSaat(g.t)}
                        </span>
                        <span className="tabular-nums font-medium text-foreground">
                          {g.sayfa}. sayfa · {cuzHesapla(g.sayfa)}. cüz
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function Bilgi({
  etiket,
  deger,
}: {
  etiket: string;
  deger: number | string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="px-3 py-3 text-center">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {etiket}
        </div>
        <div className="mt-1 text-xl font-semibold text-foreground">
          {deger}
        </div>
      </CardContent>
    </Card>
  );
}
