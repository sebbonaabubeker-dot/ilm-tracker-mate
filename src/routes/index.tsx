import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GraduationCap,
  Lock,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  Check,
  X,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Loader2,
} from "lucide-react";
import {
  talebeleriDinle,
  talebeEkle,
  talebeGuncelle,
  talebeSil,
  type Talebe,
  type SayfaKaydi,
} from "@/lib/talebeler";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Talebe Takip — Hocaefendi Paneli" },
      {
        name: "description",
        content:
          "Talebelerin kıraat ve Kur'an-ı Kerim ilerlemesini takip edin.",
      },
    ],
  }),
  component: Index,
});

// (Talebe / SayfaKaydi tipleri ve veri katmanı '@/lib/talebeler' içindedir)

const SAYFA_BASINA_CUZ = 20;
const HOCA_OTURUM_KEY = "talebe-takip-hoca-oturum";
const HOCA_AD_KEY = "talebe-takip-hoca-ad";
const TALEBE_CACHE_KEY = "talebe-takip-cache-v1";
const HOCA_PAROLA_KEY = "talebe-takip-hoca-parola";
const VARSAYILAN_PAROLA = "siec0998";

function mevcutParola(): string {
  try {
    const kayitli = localStorage.getItem(HOCA_PAROLA_KEY);
    // Eski parolayı temizle, herkes yeni varsayılan ile girebilsin
    if (kayitli && kayitli !== VARSAYILAN_PAROLA) {
      localStorage.removeItem(HOCA_PAROLA_KEY);
      return VARSAYILAN_PAROLA;
    }
    return kayitli || VARSAYILAN_PAROLA;
  } catch {
    return VARSAYILAN_PAROLA;
  }
}

function cuzHesapla(sayfa: number) {
  if (sayfa < 1) return 1;
  if (sayfa > 604) return 30;
  return Math.min(30, Math.floor((sayfa - 1) / SAYFA_BASINA_CUZ) + 1);
}

function gunBaslangici(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

// Pazartesi başlangıçlı hafta
function haftaBaslangici(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const gun = (x.getDay() + 6) % 7; // Pzt=0
  x.setDate(x.getDate() - gun);
  return x.getTime();
}

function sayfaOnceFn(t: Talebe, esik: number) {
  const oncekiler = t.gecmis.filter((g) => g.t < esik);
  return oncekiler.length > 0
    ? oncekiler[oncekiler.length - 1].sayfa
    : t.gecmis[0]?.sayfa ?? t.sayfa;
}


function haftaEtiket(baslangic: number) {
  const b = new Date(baslangic);
  const s = new Date(baslangic + 6 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
  return `${fmt(b)} – ${fmt(s)}`;
}

const GUN_KISA = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Pzr"] as const;
const GUN_UZUN = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
] as const;

function bugununGunu(): number {
  return (new Date().getDay() + 6) % 7; // Pzt=0
}

function getKiraatGunler(t: Talebe, haftaBas: number): number[] {
  const k = t.kiraatGunler?.[String(haftaBas)];
  return Array.isArray(k) ? [...k].sort((a, b) => a - b) : [];
}

function toggleGun(mevcut: number[], gun: number): number[] {
  return mevcut.includes(gun)
    ? mevcut.filter((g) => g !== gun)
    : [...mevcut, gun].sort((a, b) => a - b);
}

function Index() {
  const [hoca, setHoca] = useState("Hocaefendi");
  const [talebeler, setTalebeler] = useState<Talebe[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(TALEBE_CACHE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Talebe[]) : [];
    } catch {
      return [];
    }
  });
  const [yuklendi, setYuklendi] = useState(false);
  const [yuklemeHata, setYuklemeHata] = useState<string | null>(null);

  const [hocaModu, setHocaModu] = useState(false);
  const [girisAcik, setGirisAcik] = useState(false);
  const [parolaTaslak, setParolaTaslak] = useState("");
  const [parolaHata, setParolaHata] = useState<string | null>(null);

  const [duzenlenen, setDuzenlenen] = useState<Talebe | null>(null);
  const [hocaDuzenle, setHocaDuzenle] = useState(false);
  const [hocaTaslak, setHocaTaslak] = useState(hoca);
  const [seciliHafta, setSeciliHafta] = useState<number>(() => haftaBaslastik());
  const [seciliGun, setSeciliGun] = useState<number>(() => bugununGunu());

  const [parolaDegistirAcik, setParolaDegistirAcik] = useState(false);
  const [eskiParola, setEskiParola] = useState("");
  const [yeniParola, setYeniParola] = useState("");
  const [yeniParolaTekrar, setYeniParolaTekrar] = useState("");
  const [parolaDegistirHata, setParolaDegistirHata] = useState<string | null>(null);

  function haftaBaslastik() {
    return haftaBaslangici();
  }

  const HAFTA_MS = 7 * 24 * 60 * 60 * 1000;
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

  // Yerel UI tercihleri (hoca adı + oturum) localStorage'da kalır
  useEffect(() => {
    try {
      const ad = localStorage.getItem(HOCA_AD_KEY);
      if (ad) setHoca(ad);
      if (sessionStorage.getItem(HOCA_OTURUM_KEY) === "1") setHocaModu(true);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(HOCA_AD_KEY, hoca);
    } catch {}
  }, [hoca]);

  // Firestore canlı veri
  useEffect(() => {
    const unsub = talebeleriDinle(
      (liste) => {
        setTalebeler(liste);
        setYuklendi(true);
        try {
          localStorage.setItem(TALEBE_CACHE_KEY, JSON.stringify(liste));
        } catch {}
      },
      (e) => {
        setYuklemeHata(e.message);
        setYuklendi(true);
      },
    );
    return () => unsub();
  }, []);

  const guncelle = (id: string, alan: Partial<Talebe>) => {
    const mevcut = talebeler.find((t) => t.id === id);
    if (!mevcut) return;
    const patch: Partial<Talebe> = { ...alan };
    if (alan.sayfa !== undefined && alan.sayfa !== mevcut.sayfa) {
      patch.gecmis = [
        ...mevcut.gecmis,
        { t: Date.now(), sayfa: alan.sayfa },
      ];
    }
    void talebeGuncelle(id, patch);
  };

  const sil = (id: string) => {
    void talebeSil(id);
  };

  const kiraatGunToggle = (t: Talebe, gun: number) => {
    const key = String(seciliHafta);
    const mevcut = getKiraatGunler(t, seciliHafta);
    const yeni = toggleGun(mevcut, gun);
    const harita = { ...(t.kiraatGunler ?? {}), [key]: yeni };
    void talebeGuncelle(t.id, {
      kiraatGunler: harita,
      kiraat: yeni.length > 0,
    });
  };

  const ekle = () => {
    const yeniNo = talebeler.length + 1;
    const enBuyukSira = talebeler.reduce(
      (m, t) => Math.max(m, t.sira ?? 0),
      0,
    );
    void talebeEkle({
      isim: `Talebe ${yeniNo}`,
      kiraat: false,
      sayfa: 1,
      gecmis: [{ t: Date.now(), sayfa: 1 }],
      sira: enBuyukSira + 1,
    });
  };


  const ozet = useMemo(() => {
    const toplam = talebeler.length;
    const kiraatSayi = talebeler.filter(
      (t) => getKiraatGunler(t, seciliHafta).length > 0,
    ).length;
    return { toplam, kiraatSayi };
  }, [talebeler, seciliHafta]);


  const girisYap = () => {
    if (parolaTaslak === mevcutParola()) {
      setHocaModu(true);
      sessionStorage.setItem(HOCA_OTURUM_KEY, "1");
      setGirisAcik(false);
      setParolaTaslak("");
      setParolaHata(null);
    } else {
      setParolaHata("Parola hatalı");
    }
  };

  const cikisYap = () => {
    setHocaModu(false);
    sessionStorage.removeItem(HOCA_OTURUM_KEY);
  };

  const parolaDegistir = () => {
    if (eskiParola !== mevcutParola()) {
      setParolaDegistirHata("Mevcut parola hatalı");
      return;
    }
    if (yeniParola.length < 3) {
      setParolaDegistirHata("Yeni parola en az 3 karakter olmalı");
      return;
    }
    if (yeniParola !== yeniParolaTekrar) {
      setParolaDegistirHata("Yeni parolalar eşleşmiyor");
      return;
    }
    try {
      localStorage.setItem(HOCA_PAROLA_KEY, yeniParola);
    } catch {}
    setParolaDegistirAcik(false);
    setEskiParola("");
    setYeniParola("");
    setYeniParolaTekrar("");
    setParolaDegistirHata(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-3 py-8 sm:px-6 sm:py-12">
        <header className="mb-8 flex flex-col items-center gap-4 text-center sm:mb-10">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              SİEC DESSİE KURSU
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Talebe Başarı Paneli
            </p>
          </div>
        </header>

        <Card className="mb-6 border-accent/40 bg-secondary/40">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Hocaefendi
              </span>
              {hocaModu && hocaDuzenle ? (
                <>
                  <Input
                    autoFocus
                    value={hocaTaslak}
                    onChange={(e) => setHocaTaslak(e.target.value.slice(0, 60))}
                    className="h-9 w-48"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      setHoca(hocaTaslak.trim() || "Hocaefendi");
                      setHocaDuzenle(false);
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setHocaDuzenle(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-base font-medium text-foreground">
                    {hoca}
                  </span>
                  {hocaModu && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => {
                        setHocaTaslak(hoca);
                        setHocaDuzenle(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {hocaModu ? (
                <>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Düzenleme modu
                  </span>
              <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEskiParola("");
                      setYeniParola("");
                      setYeniParolaTekrar("");
                      setParolaDegistirHata(null);
                      setParolaDegistirAcik(true);
                    }}
                  >
                    Parola
                  </Button>
                  <Button size="sm" variant="outline" onClick={cikisYap}>
                    <LogOut className="h-4 w-4" /> Çıkış
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setGirisAcik(true)}
                >
                  <Lock className="h-4 w-4" /> Hocaefendi Girişi
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <OzetKart etiket="Toplam Talebe" deger={ozet.toplam} />
          <OzetKart
            etiket="Kıraat"
            deger={`${ozet.kiraatSayi}/${ozet.toplam}`}
          />
        </div>


        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 bg-secondary/30 px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">{haftaBasligi}</span>
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

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Talebe</TableHead>
                  <TableHead className="text-center">
                    <Select
                      value={String(seciliGun)}
                      onValueChange={(v) => setSeciliGun(Number(v))}
                    >
                      <SelectTrigger className="mx-auto h-7 w-[120px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GUN_UZUN.map((isim, i) => (
                          <SelectItem key={i} value={String(i)} className="text-xs">
                            Kıraat · {isim}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableHead>
                  <TableHead className="text-center">Sayfa</TableHead>
                  <TableHead className="text-center">Cüz</TableHead>
                  {hocaModu && (
                    <TableHead className="w-24 text-right">İşlem</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {talebeler.map((t, i) => (
                  <TableRow key={t.id} className="hover:bg-muted/30">
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-medium">{t.isim}</TableCell>
                    <TableCell className="text-center">
                      <GunDurum
                        verdi={getKiraatGunler(t, seciliHafta).includes(seciliGun)}
                        duzenlenebilir={hocaModu}
                        onToggle={() => kiraatGunToggle(t, seciliGun)}
                      />
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {t.sayfa}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-muted-foreground">
                      {cuzHesapla(t.sayfa)}
                    </TableCell>
                    {hocaModu && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setDuzenlenen(t)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => sil(t.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {!yuklendi && talebeler.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={hocaModu ? 7 : 6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Veriler yükleniyor…
                      </span>
                    </TableCell>
                  </TableRow>
                )}
                {yuklendi && yuklemeHata && (
                  <TableRow>
                    <TableCell
                      colSpan={hocaModu ? 7 : 6}
                      className="py-10 text-center text-sm text-destructive"
                    >
                      Bağlantı hatası: {yuklemeHata}
                    </TableCell>
                  </TableRow>
                )}
                {yuklendi && !yuklemeHata && talebeler.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={hocaModu ? 7 : 6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      Henüz talebe yok.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {hocaModu && (
          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={ekle}>
              <Plus className="h-4 w-4" /> Talebe Ekle
            </Button>
          </div>
        )}
      </div>

      <Dialog
        open={girisAcik}
        onOpenChange={(o) => {
          setGirisAcik(o);
          if (!o) {
            setParolaTaslak("");
            setParolaHata(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Hocaefendi Girişi</DialogTitle>
            <DialogDescription>
              Düzenleme yapabilmek için parola giriniz.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Parola</Label>
            <Input
              type="password"
              value={parolaTaslak}
              onChange={(e) => {
                setParolaTaslak(e.target.value.slice(0, 50));
                setParolaHata(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") girisYap();
              }}
              autoFocus
              aria-invalid={parolaHata ? true : undefined}
              className={
                parolaHata ? "border-destructive focus-visible:ring-destructive" : ""
              }
            />
            {parolaHata && (
              <p className="text-xs text-destructive">{parolaHata}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setGirisAcik(false)}>
              İptal
            </Button>
            <Button onClick={girisYap}>Giriş Yap</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={parolaDegistirAcik}
        onOpenChange={(o) => {
          setParolaDegistirAcik(o);
          if (!o) {
            setEskiParola("");
            setYeniParola("");
            setYeniParolaTekrar("");
            setParolaDegistirHata(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Parola Değiştir</DialogTitle>
            <DialogDescription>
              Yeni parolanızı belirleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Mevcut parola</Label>
              <Input
                type="password"
                value={eskiParola}
                onChange={(e) => {
                  setEskiParola(e.target.value.slice(0, 50));
                  setParolaDegistirHata(null);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label>Yeni parola</Label>
              <Input
                type="password"
                value={yeniParola}
                onChange={(e) => {
                  setYeniParola(e.target.value.slice(0, 50));
                  setParolaDegistirHata(null);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label>Yeni parola (tekrar)</Label>
              <Input
                type="password"
                value={yeniParolaTekrar}
                onChange={(e) => {
                  setYeniParolaTekrar(e.target.value.slice(0, 50));
                  setParolaDegistirHata(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") parolaDegistir();
                }}
              />
            </div>
            {parolaDegistirHata && (
              <p className="text-xs text-destructive">{parolaDegistirHata}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setParolaDegistirAcik(false)}>
              İptal
            </Button>
            <Button onClick={parolaDegistir}>Değiştir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DuzenleDiyalog
        talebe={duzenlenen}
        onClose={() => setDuzenlenen(null)}
        onKaydet={(p) => {
          if (duzenlenen) guncelle(duzenlenen.id, p);
          setDuzenlenen(null);
        }}
      />
    </div>
  );
}

function OzetKart({ etiket, deger }: { etiket: string; deger: number | string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="px-3 py-3 text-center sm:px-4 sm:py-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {etiket}
        </div>
        <div className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
          {deger}
        </div>
      </CardContent>
    </Card>
  );
}

function KiraatGunler({
  gunler,
  duzenlenebilir,
  onToggle,
}: {
  gunler: number[];
  duzenlenebilir: boolean;
  onToggle: (g: number) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-1">
      {GUN_KISA.map((isim, i) => {
        const aktif = gunler.includes(i);
        const sinif = aktif
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-muted/40 text-muted-foreground border-border";
        if (duzenlenebilir) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onToggle(i)}
              className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition-colors hover:bg-primary/80 hover:text-primary-foreground ${sinif}`}
              title={isim}
            >
              {isim[0]}
            </button>
          );
        }
        return (
          <span
            key={i}
            className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${sinif}`}
            title={isim}
          >
            {isim[0]}
          </span>
        );
      })}
    </div>
  );
}

function GunDurum({
  verdi,
  duzenlenebilir,
  onToggle,
}: {
  verdi: boolean;
  duzenlenebilir: boolean;
  onToggle: () => void;
}) {
  const sinif = verdi
    ? "bg-primary text-primary-foreground border-primary"
    : "bg-muted/40 text-muted-foreground border-border";
  const etiket = verdi ? "Verdi" : "Vermedi";
  if (duzenlenebilir) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={`rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors hover:opacity-90 ${sinif}`}
      >
        {etiket}
      </button>
    );
  }
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium ${sinif}`}
    >
      {etiket}
    </span>
  );
}


function DuzenleDiyalog({
  talebe,
  onClose,
  onKaydet,
}: {
  talebe: Talebe | null;
  onClose: () => void;
  onKaydet: (p: Partial<Talebe>) => void;
}) {
  const [isim, setIsim] = useState("");
  
  const [sayfaTaslak, setSayfaTaslak] = useState("1");
  const [sayfaHata, setSayfaHata] = useState<string | null>(null);

  useEffect(() => {
    if (talebe) {
      setIsim(talebe.isim);
      setSayfaTaslak(String(talebe.sayfa));
      setSayfaHata(null);
    }
  }, [talebe]);

  const sayfaDogrula = (deger: string): number | null => {
    if (deger.trim() === "") {
      setSayfaHata("Sayfa boş olamaz");
      return null;
    }
    if (!/^\d+$/.test(deger)) {
      setSayfaHata("Yalnızca rakam giriniz");
      return null;
    }
    const n = Number(deger);
    if (n < 1 || n > 604) {
      setSayfaHata("Sayfa 1 ile 604 arasında olmalı");
      return null;
    }
    setSayfaHata(null);
    return n;
  };

  const kaydet = () => {
    const sayfa = sayfaDogrula(sayfaTaslak);
    if (sayfa === null) return;
    const temizIsim = isim.trim().slice(0, 60);
    if (!temizIsim) return;
    onKaydet({ isim: temizIsim, sayfa });
  };

  const cuz = /^\d+$/.test(sayfaTaslak)
    ? cuzHesapla(Math.max(1, Math.min(604, Number(sayfaTaslak))))
    : "—";

  return (
    <Dialog open={!!talebe} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Talebeyi Düzenle</DialogTitle>
          <DialogDescription>
            İsim, ders ve Kur'an-ı Kerim ilerlemesi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>İsim</Label>
            <Input
              value={isim}
              onChange={(e) => setIsim(e.target.value.slice(0, 60))}
              maxLength={60}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Kıraat günlerini ana tablodaki gün rozetlerinden işaretleyebilirsiniz.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Sayfa (1-604)
              </Label>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={604}
                value={sayfaTaslak}
                onChange={(e) => {
                  setSayfaTaslak(e.target.value);
                  sayfaDogrula(e.target.value);
                }}
                aria-invalid={sayfaHata ? true : undefined}
                className={
                  sayfaHata
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cüz (otomatik)</Label>
              <div className="flex h-9 items-center rounded-md border border-input bg-secondary/40 px-3 text-sm font-medium text-secondary-foreground">
                {cuz}{typeof cuz === "number" ? ". cüz" : ""}
              </div>
            </div>
          </div>
          {sayfaHata && <p className="text-xs text-destructive">{sayfaHata}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            İptal
          </Button>
          <Button
            onClick={kaydet}
            disabled={!!sayfaHata || !isim.trim()}
          >
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
