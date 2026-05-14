# Firebase ve Firestore Entegrasyonu

Verdiğin config ile Firebase'i projeye ekleyip talebe verilerini Firestore'da saklayacağım. Şu an veriler `localStorage`'da tutuluyor; bunu Firestore ile senkronize edeceğim.

> Not: Lovable'ın yerleşik backend'i (Lovable Cloud) de aynı işi yapabilir ve ekstra kurulum gerektirmez. Yine de açıkça Firebase istediğin için onunla devam edeceğim.

## Yapılacaklar

1. **Bağımlılık kurulumu**
   - `bun add firebase`

2. **Firebase init dosyası** — `src/lib/firebase.ts`
   - `initializeApp(firebaseConfig)` ile app oluştur
   - `getFirestore(app)` export et
   - `getAnalytics` yalnızca tarayıcıda (`typeof window !== "undefined"` ve `isSupported()` kontrolüyle) çağrılacak — SSR sırasında patlamasın

3. **Veri katmanı** — `src/lib/talebeler.ts`
   - `talebeler` koleksiyonu için CRUD helper'ları:
     - `talebeleriDinle(callback)` → `onSnapshot` ile gerçek zamanlı stream
     - `talebeEkle(t)`, `talebeGuncelle(id, patch)`, `talebeSil(id)`
     - `ilerlemeEkle(id, kayit)` → `gecmis` array'ine `arrayUnion`
     - `topluHedefGuncelle(n)` → batched write

4. **`src/routes/index.tsx` güncellemesi**
   - `localStorage` okuma/yazma bloklarını kaldır
   - `useEffect` içinde `talebeleriDinle` ile state'i besle
   - `DuzenleDiyalog` kaydet → `talebeGuncelle`
   - İlerleme ekleme butonu → `ilerlemeEkle`
   - Toplu hedef → `topluHedefGuncelle`
   - Yükleme durumu için kısa bir skeleton/spinner

## Teknik notlar

- `firebaseConfig` ve `measurementId` public değerler; doğrudan `src/lib/firebase.ts` içine yazılacak (Firebase web config'inin gizli olması beklenmez; güvenlik Firestore Rules ile sağlanır).
- Firestore koleksiyon şeması:
  ```
  talebeler/{autoId}
    isim: string
    hedefHaftalik: number
    gecmis: [{ t: number, sayfa: number }]
  ```
- Şu an auth yok, dolayısıyla başlangıçta Firestore Rules'u **test mode** (30 gün açık) varsayıyorum. Production'a almadan önce auth + kurallar şart — bunu istersen ayrı bir adımda ekleriz.

## Onayından sonra ihtiyacım olabilecek

- Firebase Console'da **Firestore Database**'i (henüz açmadıysan) oluşturman gerek — "Start in test mode" seçip bölgeyi seçmen yeterli. Hazırsan onayla, başlayayım.
