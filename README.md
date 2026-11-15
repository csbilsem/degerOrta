# Değerler Köyü

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
| Sol tık | Hedeflenen bloğu kır (çantaya eklenir) |
| Sağ tık | Seçili bloğu yerleştir |
| 1–9 / fare tekerleği | Çantadan blok seç |
| V | Birinci / üçüncü şahıs kamera |
| Esc | Duraklat |
| F3 | Bilgi ekranı (açıkken 1-4 ve 0 tuşları bölgeleri renklendirmeyi dener) |

### Tablet / telefon (dokunmatik)

Dokunmatik cihazlarda ekran kumandaları kendiliğinden açılır: sol alttaki kol yürütür, ekranı kaydırmak etrafa baktırır, **Kır / Koy / Zıpla** düğmeleri ve alttaki blok kutuları dokunarak kullanılır; **II** duraklatır.

## Aşamalar

- [x] **1. aşama:** blok dünyası, hareket ve kamera
- [x] **2. aşama:** blok kırma / yerleştirme, blok çantası
- [ ] Karakterler ve konuşma (E)
- [ ] Görevler, ahlaki ikilemler, değer puanı ve değer blokları
- [ ] Anıt inşası ve köyün renklenmesi

## Dosya yapısı

- `index.html`, `css/style.css` — sayfa ve arayüz
- `js/blocks.js` — blok türleri ve renkleri
- `js/world.js` — blok verisi, parça (chunk) örme, bölge renklendirme
- `js/worldgen.js` — köyün ve dört bölgenin kurulumu
- `js/player.js` — hareket, çarpışma, kamera
- `js/interact.js` — hedefleme, blok kırma/yerleştirme, blok çantası
- `js/main.js` — ana döngü, girdiler, gösterge
- `vendor/` — Three.js (MIT lisanslı)
