# Kalbin Kahramanları

6. sınıf Din Kültürü ve Ahlak Bilgisi dersi, **Ahlaki Davranışlar** ünitesi için tarayıcıda çalışan, Three.js ile yazılmış blok tabanlı eğitsel oyun. Doğru sözlülük, merhamet, adap ve vatan sevgisi değerlerini işler.

## Çalıştırma

Derleme adımı yoktur. Klasörü herhangi bir statik sunucuyla açmak yeterlidir:

```bash
python3 sunucu.py
# sonra tarayıcıda: http://localhost:8000
```

(Dosyaya çift tıklayarak açmak çalışmaz; tarayıcılar JavaScript modüllerini `file://` üzerinden yüklemez.)

## Kontroller

| Tuş | İşlev |
| --- | --- |
| W A S D | Yürü |
| Fare | Etrafa bak |
| Boşluk | Zıpla (tek blokluk basamaklar kendiliğinden çıkılır) |
| Shift | Koş |
| E | Yakındaki karakterle konuş; konuşmada ilerle |
| Sol tık | Hedeflenen bloğu kır (çantaya eklenir) |
| Sağ tık | Seçili bloğu yerleştir |
| 1–9 / fare tekerleği | Çantadan blok seç |
| M | Harita görünümü: bütün köy / yakın / büyük harita |
| V | Birinci / üçüncü şahıs kamera |
| Esc | Duraklat |
| F3 | Bilgi ekranı (açıkken 1-4 ve 0 tuşları bölgeleri renklendirmeyi dener) |

### Tablet / telefon (dokunmatik)

Dokunmatik cihazlarda ekran kumandaları kendiliğinden açılır: sol alttaki kol yürütür, ekranı kaydırmak etrafa baktırır, **Kır / Koy / Zıpla** düğmeleri ve alttaki blok kutuları dokunarak kullanılır; **II** duraklatır.

## Aşamalar (tasarım belgesine göre)

- [x] 1. Blok dünyası, hareket ve kamera
- [x] 2. Köy haritası ve dört bölgenin yerleşimi (blok kırma / yerleştirme dahil)
- [x] 3. Karakterler ve diyalog sistemi
- [x] 4. Görevler ve karar sistemi (12 görev, görev paneli, mini harita, ışıklı yön işaretleri, tarayıcıya kayıt)
- [x] 5. Değer puanı, değer blokları ve anıt inşası (takma ad, tam kayıt, sıfırlama, harita yakınlaştırma)
- [ ] 6. Renklenme efekti, ses ve son ekran
- [ ] 7. Öğrencilerle deneme oynanışı ve düzeltmeler

## Dosya yapısı

- `index.html`, `css/style.css` — sayfa ve arayüz
- `js/blocks.js` — blok türleri ve renkleri
- `js/world.js` — blok verisi, parça (chunk) örme, bölge renklendirme
- `js/worldgen.js` — köyün ve dört bölgenin kurulumu
- `js/player.js` — hareket, çarpışma, kamera
- `js/interact.js` — hedefleme, blok kırma/yerleştirme, blok çantası
- `js/npc.js` — karakter modelleri, ad etiketleri, yakınlık algılama
- `js/dialog.js` — konuşma kutusu ve seçenekler
- `js/data/karakterler.js` — karakterler ve konuşma metinleri
- `js/quests.js` — görev durumu, kararlar, puan, yön işaretleri, kayıt
- `js/minimap.js` — mini harita
- `js/data/gorevler.js` — on iki görevin metinleri ve seçenekleri
- `js/main.js` — ana döngü, girdiler, gösterge
- `vendor/` — Three.js (MIT lisanslı)
