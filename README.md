# Değerler Köyü

6. sınıf Din Kültürü ve Ahlak Bilgisi dersi, **Ahlaki Davranışlar** ünitesi için tarayıcıda çalışan, Three.js ile yazılmış blok tabanlı eğitsel oyun. Doğru sözlülük, merhamet, adap ve vatan sevgisi değerlerini işler.

## Çalıştırma

Derleme adımı yoktur. Klasörü herhangi bir statik sunucuyla açmak yeterlidir:

```bash
python3 -m http.server 8000
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
| V | Birinci / üçüncü şahıs kamera |
| Esc | Duraklat |
| F3 | Bilgi ekranı (açıkken 1-4 ve 0 tuşları bölgeleri renklendirmeyi dener) |

## Aşamalar

- [x] **1. aşama:** blok dünyası, hareket ve kamera
- [ ] Blok kırma / yerleştirme
- [ ] Karakterler ve konuşma (E)
- [ ] Görevler, ahlaki ikilemler, değer puanı ve değer blokları
- [ ] Anıt inşası ve köyün renklenmesi

## Dosya yapısı

- `index.html`, `css/style.css` — sayfa ve arayüz
- `js/blocks.js` — blok türleri ve renkleri
- `js/world.js` — blok verisi, parça (chunk) örme, bölge renklendirme
- `js/worldgen.js` — köyün ve dört bölgenin kurulumu
- `js/player.js` — hareket, çarpışma, kamera
- `js/main.js` — ana döngü, girdiler, gösterge
- `vendor/` — Three.js (MIT lisanslı)
