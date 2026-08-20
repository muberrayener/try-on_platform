# Smart Mirror Frontend

Bu klasörü mevcut `tryon-platform/frontend` klasörünün yerine koyun.

## Davranış
- İlk yüklenen, arka planı kaldırılmış ve `ready` durumundaki insan görseli temel görüntüdür.
- Temel görüntü ana aynada tam boy gösterilir.
- Aynı görüntünün baş/omuz kadrajı sol üstte CSS ile kırpılır.
- Try-on tamamlanınca sonuç otomatik gösterilir.
- Kullanıcı `Orijinale dön` ve `Sonucu göster` düğmeleriyle iki görüntü arasında geçiş yapar.

## Backend sözleşmesi
- `GET /api/v1/person-images`
- `GET /api/v1/person-images/{id}/preview`
- `GET /api/v1/garments`
- `GET /api/v1/tryons`
- `POST /api/v1/tryons`
- `GET /api/v1/tryons/{id}/result`

## Docker
```bash
docker compose stop frontend
docker compose rm -f frontend
docker compose build --no-cache frontend
docker compose up -d frontend
```
