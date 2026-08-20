# Secure Virtual Try-On Platform

React + TypeScript, FastAPI, Celery, Redis, MongoDB, MinIO ve Mailpit kullanan güvenlik odaklı çalışır başlangıç projesi.

> AI worker şu anda açıkça işaretlenmiş bir **mock pipeline** kullanır. Gerçek bir sanal giydirme modeli bağlanmamıştır. `ai-worker/worker/tasks.py` içindeki mock blok, seçilecek model/provider ile değiştirilmelidir.

## Güvenlik özellikleri

- Argon2 parola hashleme
- A256GCM ile şifreli JWE access cookie
- HttpOnly oturum cookie'si ve double-submit CSRF kontrolü
- E-posta doğrulama ve tek kullanımlık parola sıfırlama tokenları
- Tokenlar MongoDB'de yalnız SHA-256 özetiyle saklanır
- Rol tabanlı admin kontrolü ve nesne bazlı sahiplik kontrolü
- Private MinIO bucket
- JPEG/PNG/WebP decode, EXIF temizleme ve WebP yeniden encode
- Dosya byte ve piksel sınırı
- Celery yalnız JSON serializer, worker API tokenlarına erişmez
- Redis, MongoDB ve MinIO API host'a açılmaz
- Container'lar root olmayan kullanıcıyla çalışır
- Dar CORS allowlist, güvenlik header'ları ve sonuçlarda `no-store`
- Kullanıcı başına en fazla iki aktif try-on işi

## Kurulum

1. `.env` içindeki admin, MinIO ve JWE secret değerlerini değiştirin.
2. JWE anahtarı üretin:

```bash
openssl rand -base64 32 | tr '+/' '-_' | tr -d '='
```

3. Başlatın:

```bash
docker compose up --build
```

4. Adresler:

- React: http://localhost:3000
- Swagger: http://localhost:3000/api/docs
- Mailpit: http://localhost:8025
- MinIO Console: http://localhost:9001
- Flower: http://localhost:5555

Geliştirme admini `.env` içindeki `ADMIN_*` değerleridir. Varsayılan parola üretimde kullanılmamalıdır.

## Demo akışı

1. Admin ile giriş yapın.
2. Bir kişi fotoğrafı yükleyin.
3. Admin olarak kıyafet ekleyin.
4. “ile dene” butonuna basın.
5. Celery job ilerleyerek mock sonucu üretir.

## Üretim notları

- TLS reverse proxy kullanın ve `ENV=production` ayarlayın. Böylece cookie `Secure` olur.
- MinIO, MongoDB ve Redis için ayrı düşük yetkili servis hesapları oluşturun.
- Worker'ın mock pipeline'ını lisansı ve veri işleme şartları incelenmiş gerçek bir VTON modeliyle değiştirin.
- Giriş, kayıt, e-posta ve inference uçlarına dağıtık rate limiter ekleyin.
- Malware tarama/sandbox, merkezi audit log, secret manager, yedekleme ve veri saklama/silme politikalarını ekleyin.
- CSP şu an API response'ları için katıdır; frontend CSP'yi reverse proxy'de React build gereksinimlerine göre ayrıca tanımlayın.
