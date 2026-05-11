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
  GraduationCap,
  Lock,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  Check,
  X,
  BookOpen,
} from "lucide-react";

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

type Talebe = {
  id: string;
  isim: string;
  kiraat: boolean;
  sayfa: number;
};

const SAYFA_BASINA_CUZ = 20;
const STORAGE_KEY = "talebe-takip-v2";
const HOCA_OTURUM_KEY = "talebe-takip-hoca-oturum";
const VARSAYILAN_PAROLA = "1453";

function cuzHesapla(sayfa: number) {
  if (sayfa < 1) return 1;
  if (sayfa > 604) return 30;
  return Math.min(30, Math.floor((sayfa - 1) / SAYFA_BASINA_CUZ) + 1);
}

function varsayilanTalebeler(): Talebe[] {
  return Array.from({ length: 42 }, (_, i) => ({
    id: `t-${i + 1}`,
    isim: `Talebe ${i + 1}`,
    kiraat: false,
    sayfa: 1,
  }));
}

function Index() {
  const [hoca, setHoca] = useState("Hocaefendi");
  const [talebeler, setTalebeler] = useState<Talebe[]>(varsayilanTalebeler);
  const [yuklendi, setYuklendi] = useState(false);

  const [hocaModu, setHocaModu] = useState(false);
  const [girisAcik, setGirisAcik] = useState(false);
  const [parolaTaslak, setParolaTaslak] = useState("");
  const [parolaHata, setParolaHata] = useState<string | null>(null);

  const [duzenlenen, setDuzenlenen] = useState<Talebe | null>(null);
  const [hocaDuzenle, setHocaDuzenle] = useState(false);
  const [hocaTaslak, setHocaTaslak] = useState(hoca);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        if (typeof v.hoca === "string") setHoca(v.hoca);
        if (Array.isArray(v.talebeler) && v.talebeler.length > 0) {
          setTalebeler(
            v.talebeler.map((t: any) => ({
              id: t.id,
              isim: t.isim,
              kiraat: !!t.kiraat,
              sayfa: typeof t.sayfa === "number" ? t.sayfa : 1,
            })),
          );
        }
      }
      if (sessionStorage.getItem(HOCA_OTURUM_KEY) === "1") {
        setHocaModu(true);
      }
    } catch {}
    setYuklendi(true);
  }, []);

  useEffect(() => {
    if (!yuklendi) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ hoca, talebeler }));
  }, [hoca, talebeler, yuklendi]);

  const guncelle = (id: string, alan: Partial<Talebe>) => {
    setTalebeler((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...alan } : t)),
    );
  };

  const sil = (id: string) => {
    setTalebeler((prev) => prev.filter((t) => t.id !== id));
  };

  const ekle = () => {
    const yeniNo = talebeler.length + 1;
    setTalebeler((prev) => [
      ...prev,
      {
        id: `t-${Date.now()}`,
        isim: `Talebe ${yeniNo}`,
        kiraat: false,
        sayfa: 1,
      },
    ]);
  };

  const ozet = useMemo(() => {
    const toplam = talebeler.length;
    const kiraatSayi = talebeler.filter((t) => t.kiraat).length;
    return { toplam, kiraatSayi };
  }, [talebeler]);

  const girisYap = () => {
    if (parolaTaslak === VARSAYILAN_PAROLA) {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-3 py-8 sm:px-6 sm:py-12">
        <header className="mb-8 flex flex-col items-center gap-4 text-center sm:mb-10">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Talebe Takip Defteri
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kıraat ve Kur'an-ı Kerim ilerlemesi
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

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Talebe</TableHead>
                  <TableHead className="text-center">Kıraat</TableHead>
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
                      <DurumRozet verildi={t.kiraat} />
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
                {talebeler.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={hocaModu ? 6 : 5}
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

        <p className="mt-8 text-center text-xs text-muted-foreground">
          1 cüz ≈ 20 sayfa (604 sayfa / 30 cüz). Veriler bu cihazda saklanır.
        </p>
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
              Düzenleme yapabilmek için parola giriniz. Varsayılan:{" "}
              <span className="font-mono">{VARSAYILAN_PAROLA}</span>
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

function DurumRozet({ verildi }: { verildi: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        verildi
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          verildi ? "bg-primary" : "bg-muted-foreground/40"
        }`}
      />
      {verildi ? "Verdi" : "Vermedi"}
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
  const [kiraat, setKiraat] = useState(false);
  const [sayfaTaslak, setSayfaTaslak] = useState("1");
  const [sayfaHata, setSayfaHata] = useState<string | null>(null);

  useEffect(() => {
    if (talebe) {
      setIsim(talebe.isim);
      setKiraat(talebe.kiraat);
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
    onKaydet({ isim: temizIsim, kiraat, sayfa });
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

          <DersKutu etiket="Kıraat" verildi={kiraat} onChange={setKiraat} />

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
          <Button onClick={kaydet} disabled={!!sayfaHata || !isim.trim()}>
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DersKutu({
  etiket,
  verildi,
  onChange,
}: {
  etiket: string;
  verildi: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center justify-between rounded-md border px-3 py-2.5 transition-colors ${
        verildi
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-card hover:bg-muted/50"
      }`}
    >
      <span className="text-sm font-medium text-foreground">{etiket}</span>
      <div className="flex items-center gap-2">
        <span
          className={`text-xs ${verildi ? "text-primary" : "text-muted-foreground"}`}
        >
          {verildi ? "Verdi" : "Vermedi"}
        </span>
        <Checkbox
          checked={verildi}
          onCheckedChange={(v) => onChange(Boolean(v))}
        />
      </div>
    </label>
  );
}
