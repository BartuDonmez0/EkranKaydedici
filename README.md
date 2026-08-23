# Ekran ve Ses Kaydedici

Kameraya gerek olmadan ekranınızı, mikrofonunuzu ve isterseniz sistem/sekme sesini kaydeden; tamamen yerelde çalışan, tek dosyalık, bağımlılıksız bir araç. Hiçbir veri internete gitmez.

![Status](https://img.shields.io/badge/status-active-white?style=flat-square&labelColor=0a0a0a) ![License](https://img.shields.io/badge/license-MIT-white?style=flat-square&labelColor=0a0a0a)

## Neden

Ekran kaydı için ağır, hesap gerektiren veya reklamlı programlar kurmak yerine — tarayıcının kendi native API'lerini kullanan, açıp kapatması saniyeler süren, verinizin hiç dışarı çıkmadığı basit bir araç.

## Özellikler

- **Kamerasız** — yalnızca ekran + ses.
- **Mikrofon + sistem/sekme sesi karıştırma** — ikisini aynı anda, tek dosyaya kaydeder (Web Audio API ile).
- **Otomatik klasöre kayıt** — seçtiğiniz klasöre doğrudan yazılır, indirilenler klasörüne karışmaz. Klasör seçimi bir kez yapılır, tarayıcı hatırlar.
- **Yerleşik oynatıcı** — kayıtlarınızı uygulamadan çıkmadan izleyip yönetebilirsiniz (oynat/sil).
- **Sıfır bağımlılık** — sadece Node.js'in kendi `http` modülüyle yazılmış tek dosyalık bir sunucu; `npm install` bile gerekmez.
- **Tamamen çevrimdışı ve yerel** — hiçbir istek üçüncü bir sunucuya gitmez.

## Kullanım

```bash
node server.js
```

veya Windows'ta `Baslat.bat` dosyasına çift tıklayın — tarayıcı otomatik açılır.

1. **Kayıt klasörü seç** — kayıtların kaydedileceği klasörü seçin.
2. **Kaydı Başlat** — açılan pencerede ekranı/sekmeyi seçin; sistem sesini de istiyorsanız paylaşım penceresindeki **"Sesi paylaş"** kutusunu işaretleyin.
3. **Kaydı Durdur** — dosya otomatik olarak `.webm` formatında seçilen klasöre yazılır.
4. **Kayıtlarım** listesinden geçmiş kayıtları oynatın veya silin.

## Gereksinimler

- Node.js
- Chrome veya Edge (masaüstü). Klasöre otomatik kaydetme, [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API)'ye dayanır ve şu an yalnızca Chromium tabanlı tarayıcılarda destekleniyor.

## Nasıl çalışır

Üç tarayıcı native API'sinin bir araya getirilmesi:

- [`getDisplayMedia`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia) — ekran/sekme görüntüsü (ve varsa sistem sesi)
- [`getUserMedia`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) — mikrofon
- `AudioContext` — ekran sesi ile mikrofonu tek ses akışında karıştırır
- [`MediaRecorder`](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) — karışık akışı `.webm` olarak kaydeder
- [`showDirectoryPicker`](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker) — kaydı doğrudan seçilen klasöre yazar, klasör tercihi IndexedDB'de saklanır

Sunucu (`server.js`) yalnızca bu statik dosyayı `http://localhost` üzerinden sunar — çünkü bu API'ler güvenlik gereği `file://` üzerinden çalışmaz, `localhost` bir güvenli bağlam (secure context) sayılır.

## Dosya formatı

Kayıtlar `.webm` (VP9/Opus) olarak kaydedilir — VLC, Windows Media Player ve modern tarayıcılar doğrudan açar. Başka bir yerde `.mp4` gerekiyorsa:

```bash
ffmpeg -i kayit-....webm kayit.mp4
```

## Lisans

MIT
