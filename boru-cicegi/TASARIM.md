# Boru Çiçeği: Oyun Tasarım Belgesi (prototip v0.1)

## Fikir
Az kazanan bir işçi, geçmişinde "olaylar" yaşanmış bu yüzden çok ucuza satılan bir ev alır. Evin suyu bahçedeki depodan gelir. Deponun dibinde kendiliğinden bitmiş bir **tatula (boru çiçeği, *Datura stramonium*)** vardır. Poleni ve çiçekleri, çatlak kapaktan depoya düşer. Evde yaşayanlar bu suyu içtikçe halüsinasyon görür. Oyuncu, gittikçe kötüleşen halüsinasyonların arasında **nedeni bulur, kanıtlar ve kaynağı ortadan kaldırır**.

Tür: 2D tepeden bakış, keşif / araştırma, psikolojik gerilim. Hedef oynanış: 20–40 dakika.

## Çekirdek döngü
1. **Keşfet**: evi ve bahçeyi gez, nesnelerle etkileş (E).
2. **Hayatta kal**: susuzluk sürekli artar. Su içmek zorundasın.
   - Musluk suyu bedava ama zehirli (her gün biraz daha güçlü: `12 + 3 × gün`).
   - Şişe su güvenli ama parayla alınır (6 şişe 80 TL). Para az ve 3. gün kredi taksiti kesilir.
3. **Kanıt topla**: deftere ipuçları düşer.
4. **Çıkarım yap**: belirli ipucu çiftleri otomatik olarak çıkarım açar.
5. **Çöz**: kaynağı kes ve suyu temizle.

## Sistemler
| Sistem | Değer | Not |
|---|---|---|
| Zaman | 1 sn = 3 oyun dakikası | Etkileşimler ek süre harcar. Saat 01:00'de bayılırsın. |
| Susuzluk | 0–100, saatte +6 | 90 üstünde yavaşlarsın, 100'de zorla içersin (şişe varsa şişe, yoksa musluk). |
| Zihin (zehir) | 0–100, saatte −0,6, gecede −6 | 100 olursa kötü son. |
| Para | 900 TL başlangıç | Su, branda (150 TL), medyum (600 TL, işe yaramaz tuzak). |
| Süre sınırı | 7 gün | 8. güne çözülmemiş girersen "Kaçış" sonu. |

### Halüsinasyon kademeleri (Zihin değerine göre)
| Eşik | Etki |
|---|---|
| 20+ | Kenar kararması (vinyet) |
| 25+ | Fısıltılar (stereo, rastgele yönden) |
| 30+ | Renk kayması, aynada belirtiler görünür |
| 35+ | "Küçük kız" (Elif) görünür ve konuşur |
| 40+ | Ekran dalgalanması |
| 45+ | Gölge figürler dolaşır, dokunursa korku ve zaman kaybı |
| 50+ | Yerde kanlı ayak izleri |
| 55+ | Duvarda "BU EV SENİ İSTİYOR" yazısı, ağaç kıpırdar |
| 70+ | Gölgeler kovalar, çift görme, kalp atışı sesi |
| 85+ | Kontroller kayar |

Halüsinasyonlar defterde ayrı bir bölümde ("Gördüklerim") tutulur. Oyuncu zehirlendiğini anlayınca bu kayıtların üstü çizilir. Elif'in gerçekte yaşadığı ve taburcu edildiği, ikinci gazete haberiyle ortaya çıkar.

## İpuçları ve çıkarımlar
| Çıkarım | Gereken ipuçları |
|---|---|
| **Zehirleniyorum** | Aynadaki belirtiler + (Günlük s.2 **veya** internette belirti araması) |
| **Bitki tatula** | Çiçek örneği + (Ansiklopedi **veya** internette çiçek araması **veya** Nermin Teyze) |
| **Kaynak su deposu** | Deponun içi (merdiven gerekir) + (Su faturası **veya** sözleşme **veya** Günlük s.2) |

İpucu yerleri: komodin (günlük s.1), eski sandık (günlük s.2 ve gazete), banyo dolabı (günlük s.3), taşınma kolisi (sözleşme), posta kutusu (2. günden sonra fatura), kitaplık, dizüstü bilgisayar, ayna, ağaç, depo ve komşu.

## Çözüm
Üç çıkarım tamamlanınca açılır:
- **Depoyu boşalt ve temizle** (2 saat). Bu zorunlu.
- **Ve** aşağıdakilerden biri:
  - **Ağacı kes** (balta, 3 saat)
  - **Kapağı brandayla ört** (marketten 150 TL)

Depo temizlenip kaynak kesilmezse polen bir gecede depoyu yeniden doldurur. Çözümden sonra musluk suyu güvenlidir. Zihin 15'in altına inince iyi son gelir.

## Sonlar
1. **Temiz Su** (iyi son): kaynak çözüldü, zehir atıldı.
2. **Beyaz Çiçekler** (kötü son): zihin 100'e ulaştı, ev yeniden satılığa çıktı.
3. **Kaçış** (nötr son): 7 gün içinde çözülemedi, ev zararına satıldı.

## Harita
Yatak odası, depo odası, salon, banyo, mutfak (bahçeye arka kapı), yan bahçe (su deposu ve tatula), ön bahçe (posta kutusu, komşu, bahçe kapısıyla market).

## Unity'ye geçiş önerileri
- **Görünüm**: 2D URP + Tilemap (tepeden bakış) ya da 3D birinci şahıs. Birinci şahıs, halüsinasyonlar için çok daha güçlü olur.
- **Halüsinasyon**: Post-processing Volume ağırlığı = `toxin / 100` (Chromatic Aberration, Lens Distortion, Vignette, Color Adjustments hue shift). Gölgeler NavMesh agent olur.
- **Veri**: İpuçları ve çıkarımlar `ScriptableObject` olarak tanımlanır (`ClueSO`, `DeductionSO` içinde `List<ClueSO>` gereksinimleri). Prototipteki `CLUES`/`DEDS` tabloları birebir taşınabilir.
- **Ses**: Toxin değerine bağlı AudioMixer snapshot geçişleri (drone, fısıltı, kalp atışı).
- **Genişletme**: Elif'in hikâyesi (hastanede ziyaret), belediyeyle şebeke bağlantısı yan görevi, tatulanın tohumlarının başka yerlerde de filizlenmesi (ikinci perde).

## Gerçeklik notu
Tatula gerçekten çok zehirli bir bitkidir (atropin, skopolamin) ve halüsinasyon, ağız kuruluğu, büyük gözbebekleri gibi belirtiler doğrudur. Ancak polenin bir su deposunda bu düzeyde zehirlenme yaratması **kurgusal bir abartıdır**. Oyunun sonunda ya da açılışında bunu belirten kısa bir not eklemek iyi olur.
