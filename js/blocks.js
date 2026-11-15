// Blok türleri. Her bloğun tam rengi burada tanımlıdır; köy griyken
// renkler ekran kartında (shader) griye çevrilir, bölge tamamlandıkça açılır.

export const B = {
  HAVA: 0,
  CIM: 1,
  TOPRAK: 2,
  TAS: 3,
  YOL: 4,
  TAHTA: 5,
  KUTUK: 6,
  YAPRAK: 7,
  CATI: 8,
  DUVAR: 9,
  SU: 10,
  KUM: 11,
  MERMER: 12,
  FENER: 13,
  CIT: 14,
  DIREK: 15,
  BAYRAK_KIRMIZI: 16,
  BAYRAK_BEYAZ: 17,
  KUMAS_KIRMIZI: 18,
  KUMAS_MAVI: 19,
  KUMAS_SARI: 20,
  KUMAS_BEYAZ: 21,
  CICEK_PEMBE: 22,
  CICEK_SARI: 23,
  CICEK_MOR: 24,
  SANDIK: 25,
  ACIK_TAS: 26,
};

// kati: oyuncu içinden geçemez. opak: arkasındaki yüzleri gizler.
const T = (ad, renk, kati = true, opak = true) => ({ ad, renk, kati, opak });

export const BLOKLAR = [];
BLOKLAR[B.HAVA] = T('Hava', 0x000000, false, false);
BLOKLAR[B.CIM] = T('Çim', 0x6fbf4a);
BLOKLAR[B.TOPRAK] = T('Toprak', 0x8a5a3c);
BLOKLAR[B.TAS] = T('Taş', 0x8d9499);
BLOKLAR[B.YOL] = T('Yol taşı', 0xc9b48a);
BLOKLAR[B.TAHTA] = T('Tahta', 0xc8934f);
BLOKLAR[B.KUTUK] = T('Kütük', 0x7a5230);
BLOKLAR[B.YAPRAK] = T('Yaprak', 0x3f9b3a);
BLOKLAR[B.CATI] = T('Kiremit', 0xc4553a);
BLOKLAR[B.DUVAR] = T('Sıva duvar', 0xf2e6cf);
BLOKLAR[B.SU] = T('Su', 0x3f9fe0, false, false);
BLOKLAR[B.KUM] = T('Kum', 0xe6d59a);
BLOKLAR[B.MERMER] = T('Mermer', 0xf4f2ee);
BLOKLAR[B.FENER] = T('Fener', 0xffd86b);
BLOKLAR[B.CIT] = T('Çit', 0x2f7d3b);
BLOKLAR[B.DIREK] = T('Direk', 0xd9dde0);
BLOKLAR[B.BAYRAK_KIRMIZI] = T('Bayrak (kırmızı)', 0xe30a17);
BLOKLAR[B.BAYRAK_BEYAZ] = T('Bayrak (beyaz)', 0xffffff);
BLOKLAR[B.KUMAS_KIRMIZI] = T('Kumaş (kırmızı)', 0xd9483b);
BLOKLAR[B.KUMAS_MAVI] = T('Kumaş (mavi)', 0x3b7dd9);
BLOKLAR[B.KUMAS_SARI] = T('Kumaş (sarı)', 0xf0b429);
BLOKLAR[B.KUMAS_BEYAZ] = T('Kumaş (beyaz)', 0xf5f1e8);
BLOKLAR[B.CICEK_PEMBE] = T('Çiçek tarhı (pembe)', 0xf07ab0);
BLOKLAR[B.CICEK_SARI] = T('Çiçek tarhı (sarı)', 0xf7d038);
BLOKLAR[B.CICEK_MOR] = T('Çiçek tarhı (mor)', 0x9b6be0);
BLOKLAR[B.SANDIK] = T('Sandık', 0xa9783f);
BLOKLAR[B.ACIK_TAS] = T('Açık taş', 0xb9bfc4);

export const katiMi = (id) => BLOKLAR[id].kati;
export const opakMi = (id) => BLOKLAR[id].opak;
