# MirrorDashboard – Best Practice Refactor

Bu paket, verilen `MirrorDashboard` sayfasını davranışı mümkün olduğunca koruyarak küçük component ve custom hook'lara ayırır.

## Yapı

```text
MirrorDashboard.tsx
components/
├── MirrorHeader.tsx
├── MirrorLeftColumn.tsx
├── MirrorStage.tsx
├── OutfitCard.tsx
├── WardrobePanel.tsx
├── WardrobeManagementModal.tsx
└── common/
    └── MirrorToast.tsx
hooks/
├── useAccessories.ts
├── useClock.ts
├── useDailyPlans.ts
├── useGarments.ts
├── useJobs.ts
├── usePersonImages.ts
├── usePersonUpload.ts
├── useToast.ts
├── useTryOn.ts
└── useWeather.ts
```

## Projene ekleme

Bu klasörü, mevcut `MirrorDashboard.tsx` dosyanın bulunduğu klasöre kopyala. Relative import'lar şu mevcut dosyaların aynı yerlerde kalmasını bekler:

- `../api/client`
- `../components/AccessoryModal`
- `../components/DailyPlanModal`
- `../components/WeatherIcon`
- `./mirrorDashboard.types`
- `./mirrorDashboard.constants`

CSS class isimleri değiştirilmediği için mevcut Mirror Dashboard CSS'in kullanılmaya devam etmesi amaçlandı.

## Önemli davranışlar

- React Query server-state yönetimi hook'lara taşındı.
- Try-on job polling ayrı `useJobs` hook'una taşındı.
- Fotoğraf upload ayrı hook'a taşındı.
- Toast timeout yönetimi `useToast` içinde merkezi hale getirildi.
- Gardırop yönetim modalı ayrı component oldu ve kendi form/preview UI state'ini yönetiyor.
- Aksesuar ve günlük plan API işlemleri mutation hook'larına taşındı.
- `MirrorDashboard` artık ağırlıklı olarak orchestration/layout görevi görüyor.

## Not

`AccessoryModal` ve `DailyPlanModal` mevcut projendeki componentler olarak bırakıldı; verilen kaynakta bunların implementasyonu bulunmadığı için yeniden yazılmadı. Mevcut prop sözleşmeleri, gönderdiğin `MirrorDashboard` kodundaki kullanımla korunmuştur.

Paket, mevcut proje bağımlılıklarını ayrıca kurmaz; mevcut React, React Query ve lucide-react kurulumunu kullanır.
