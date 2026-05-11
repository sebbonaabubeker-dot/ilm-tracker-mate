import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { BookOpen, GraduationCap, Pencil, Check, X } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Talebe Takip — Hocaefendi Paneli" },
      { name: "description", content: "Talebelerin ilmihal, kıraat ve Kur'an-ı Kerim ilerlemesini takip edin." },
    ],
  }),
  component: Index,
});

type Talebe = {
  id: string;
  isim: string;
  ilmihal: boolean;
  kiraat: boolean;
  sayfa: number;
};

const SAYFA_BASINA_CUZ = 20; // Mushaf-ı Şerif: 604 sayfa / 30 cüz ≈ 20

const VARSAYILAN: { hoca: string; talebeler: Talebe[] } = {
  hoca: "Hocaefendi",
  talebeler: [
    { id: "1", isim: "Talebe 1", ilmihal: false, kiraat: false, sayfa: 1 },
    { id: "2", isim: "Talebe 2", ilmihal: false, kiraat: false, sayfa: 1 },
  ],
};

const STORAGE_KEY = "talebe-takip-v1";

function cuzHesapla(sayfa: number) {
  if (sayfa < 1) return 1;
  if (sayfa > 604) return 30;
  return Math.min(30, Math.floor((sayfa - 1) / SAYFA_BASINA_CUZ) + 1);
}

function Index() {
  const [hoca, setHoca] = useState(VARSAYILAN.hoca);
  const [talebeler, setTalebeler] = useState<Talebe[]>(VARSAYILAN.talebeler);
  const [hocaDuzenle, setHocaDuzenle] = useState(false);
  const [hocaTaslak, setHocaTaslak] = useState(VARSAYILAN.hoca);
  const [yuklendi, setYuklendi] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        if (v.hoca) setHoca(v.hoca);
        if (Array.isArray(v.talebeler)) setTalebeler(v.talebeler);
      }
    } catch {}
    setYuklendi(true);
  }, []);

  useEffect(() => {
    if (!yuklendi) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ hoca, talebeler }));
  }, [hoca, talebeler, yuklendi]);

  const guncelle = (id: string, alan: Partial<Talebe>) => {
    setTalebeler((prev) => prev.map((t) => (t.id === id ? { ...t, ...alan } : t)));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        {/* Başlık */}
        <header className="mb-10 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Talebe Takip Defteri
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            İlmihal, Kıraat ve Kur'an-ı Kerim ilerlemesi
          </p>
        </header>

        {/* Hocaefendi */}
        <Card className="mb-8 border-accent/40 bg-secondary/40">
          <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Hocaefendi
              </span>
              {hocaDuzenle ? (
                <Input
                  autoFocus
                  value={hocaTaslak}
                  onChange={(e) => setHocaTaslak(e.target.value)}
                  className="h-9 w-56"
                />
              ) : (
                <span className="text-lg font-medium text-foreground">{hoca}</span>
              )}
            </div>
            {hocaDuzenle ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setHoca(hocaTaslak.trim() || "Hocaefendi");
                    setHocaDuzenle(false);
                  }}
                >
                  <Check className="h-4 w-4" /> Kaydet
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setHocaDuzenle(false)}>
                  <X className="h-4 w-4" /> İptal
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setHocaTaslak(hoca);
                  setHocaDuzenle(true);
                }}
              >
                <Pencil className="h-4 w-4" /> Değiştir
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Talebeler */}
        <div className="grid gap-6 md:grid-cols-2">
          {talebeler.map((t) => (
            <TalebeKart key={t.id} talebe={t} onChange={(p) => guncelle(t.id, p)} />
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Bilgiler bu cihazda saklanır. 1 cüz ≈ 20 sayfa olarak hesaplanır (604 sayfa / 30 cüz).
        </p>
      </div>
    </div>
  );
}

function TalebeKart({
  talebe,
  onChange,
}: {
  talebe: Talebe;
  onChange: (p: Partial<Talebe>) => void;
}) {
  const [isimDuzenle, setIsimDuzenle] = useState(false);
  const [taslak, setTaslak] = useState(talebe.isim);
  const [sayfaTaslak, setSayfaTaslak] = useState(String(talebe.sayfa));
  const [sayfaHata, setSayfaHata] = useState<string | null>(null);
  const cuz = cuzHesapla(talebe.sayfa);

  useEffect(() => {
    setSayfaTaslak(String(talebe.sayfa));
    setSayfaHata(null);
  }, [talebe.sayfa]);

  const sayfaDegistir = (deger: string) => {
    setSayfaTaslak(deger);
    if (deger.trim() === "") {
      setSayfaHata("Sayfa boş olamaz");
      return;
    }
    if (!/^\d+$/.test(deger)) {
      setSayfaHata("Yalnızca rakam giriniz");
      return;
    }
    const n = Number(deger);
    if (n < 1 || n > 604) {
      setSayfaHata("Sayfa 1 ile 604 arasında olmalı");
      return;
    }
    setSayfaHata(null);
    onChange({ sayfa: n });
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2">
          {isimDuzenle ? (
            <Input
              autoFocus
              value={taslak}
              onChange={(e) => setTaslak(e.target.value)}
              className="h-9"
            />
          ) : (
            <span className="text-xl">{talebe.isim}</span>
          )}
          {isimDuzenle ? (
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  onChange({ isim: taslak.trim() || talebe.isim });
                  setIsimDuzenle(false);
                }}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setIsimDuzenle(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setTaslak(talebe.isim);
                setIsimDuzenle(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Dersler */}
        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Bugünün Dersleri
          </div>
          <DersSatir
            etiket="İlmihal"
            verildi={talebe.ilmihal}
            onChange={(v) => onChange({ ilmihal: v })}
          />
          <DersSatir
            etiket="Kıraat"
            verildi={talebe.kiraat}
            onChange={(v) => onChange({ kiraat: v })}
          />
        </div>

        <Separator />

        {/* Kur'an */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" /> Kur'an-ı Kerim
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Sayfa (1-604)</Label>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={604}
                value={sayfaTaslak}
                onChange={(e) => sayfaDegistir(e.target.value)}
                onBlur={() => {
                  if (sayfaHata) {
                    setSayfaTaslak(String(talebe.sayfa));
                    setSayfaHata(null);
                  }
                }}
                aria-invalid={sayfaHata ? true : undefined}
                className={sayfaHata ? "border-destructive focus-visible:ring-destructive" : ""}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Cüz (otomatik)</Label>
              <div className="flex h-9 items-center rounded-md border border-input bg-secondary/40 px-3 text-sm font-medium text-secondary-foreground">
                {cuz}. cüz
              </div>
            </div>
          </div>
          {sayfaHata && (
            <p className="text-xs text-destructive">{sayfaHata}</p>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() =>
                onChange({ sayfa: Math.max(1, talebe.sayfa - 1) })
              }
            >
              − 1 Sayfa
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() =>
                onChange({ sayfa: Math.min(604, talebe.sayfa + 1) })
              }
            >
              + 1 Sayfa
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DersSatir({
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
          className={`text-xs ${
            verildi ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {verildi ? "Verdi" : "Vermedi"}
        </span>
        <Checkbox checked={verildi} onCheckedChange={(v) => onChange(Boolean(v))} />
      </div>
    </label>
  );
}
