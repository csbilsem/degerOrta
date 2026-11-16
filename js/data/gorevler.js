// On iki görevin tanımı ve metinleri (tasarım belgesi, bölüm 5).
//
// Her görev: { kimlik, bolge, ad, kim, hedefler, diyalog(k, c), insa?, sonSoz?, tamamlaninca? }
//   hedefler : ışıkla gösterilecek karakter kimlikleri
//   diyalog  : karakter k ile konuşulunca gösterilecek konuşma (yoksa null)
//   insa     : blok yerleştirme adımı { hedefler:[[x,y,z,id]], varsayilan, merkez, adim, bitis }
//   sonSoz   : görev bittikten sonra karakterlerin söyleyeceği söz
// c (bağlam): karar(soru, secim, dogru), tamamla(), insaBaslat(), okundu(kimlik), okunanSayisi()

import { B } from '../blocks.js';
import {
  DUVAR_BOSLUKLARI,
  KEDI_KAPLARI,
  DIREK_HEDEFLERI,
  ANIT_HEDEFLERI,
} from '../worldgen.js';

const ANLATICI = 'Anlatıcı';

// Bir karar sorusunu düğümlere çevirir. Yanlış seçimde açıklama gösterilir ve
// soruya geri dönülür; doğru seçimde tepki gösterilip `sonra` düğümüne geçilir.
function soru(c, dugumler, ad, { konusan, metin, secenekler, sonra, dogruGiris, ozet }) {
  dugumler[ad] = {
    konusan,
    metin,
    secenekler: secenekler.map((s, i) => ({
      metin: s.metin,
      git: s.dogru ? `${ad}_dogru` : `${ad}_yanlis${i}`,
      etki: () => c.karar(ad, i, !!s.dogru, ozet || (Array.isArray(metin) ? metin.join(' ') : metin), s.metin),
    })),
  };
  secenekler.forEach((s, i) => {
    if (s.dogru) dugumler[`${ad}_dogru`] = { konusan: s.konusan, metin: s.tepki, git: sonra, giris: dogruGiris };
    else dugumler[`${ad}_yanlis${i}`] = { konusan: s.konusan ?? ANLATICI, metin: s.tepki, git: ad };
  });
}

export const GOREVLER = [
  // =====================================================================
  // DOĞRULUK ÇARŞISI
  // =====================================================================
  {
    kimlik: 'd1',
    bolge: 1,
    ad: 'Dürüst Satıcı',
    kim: 'Mehmet Usta, Kemal Amca ve Gülsüm Teyze',
    yonerge: 'Üç satıcının nasıl tarttığını gözlemle, dürüst olanı bul.',
    hedefler: ['hasan', 'kemal', 'zehra'],
    diyalog(k, c) {
      const gozlem = {
        hasan: [
          'Mehmet Usta\'dan bir kilo elma istiyorsun.',
          'Elmaları teraziye koyuyor ve ibrenin durmasını bekliyor. İbre tam bir kiloyu gösteriyor. Teraziyi sana çevirip "Bak evlat, tam bir kilo" diyor.',
        ],
        kemal: [
          'Kemal Amca\'dan bir kilo elma istiyorsun.',
          'Elmaları tartarken parmağıyla kefeye hafifçe bastırdığını fark ediyorsun. İbre bir kiloyu gösteriyor ama poşet eline hafif geliyor.',
        ],
        zehra: [
          'Gülsüm Teyze\'den bir kilo elma istiyorsun.',
          'Acelesi var; elmaları hiç tartmadan, göz kararı poşete dolduruyor. "Bir kilo vardır yavrum" diyor ama teraziye bakmıyor bile.',
        ],
      }[k.kimlik];
      if (!gozlem) return null;
      const yanlis = {
        kemal:
          'Bir daha düşün: Kemal Amca tartarken parmağıyla kefeye bastırıyordu. Eksik tartmak, müşterinin hakkını almaktır. Diğer satıcıları da gözlemle.',
        zehra:
          'Bir daha düşün: Gülsüm Teyze elmaları hiç tartmadı. Tartmadan satınca kimin hakkının kime geçtiği bilinemez. Diğer satıcıları da gözlemle.',
      }[k.kimlik];
      return {
        baslangic: 'gozlem',
        dugumler: {
          gozlem: { konusan: ANLATICI, metin: gozlem, git: 'sor' },
          sor: {
            konusan: ANLATICI,
            metin: 'Terazisini doğru tartan dürüst satıcı bu mu?',
            secenekler: [
              {
                metin: 'Evet, dürüst satıcı bu!',
                git: k.kimlik === 'hasan' ? 'dogru' : 'yanlis',
                etki: () => c.karar('d1_satici', 0, k.kimlik === 'hasan', 'Terazisini doğru tartan dürüst satıcı hangisi?', k.ad),
              },
              { metin: 'Emin değilim; diğer satıcılara da bakayım.' },
            ],
          },
          yanlis: { konusan: ANLATICI, metin: yanlis },
          dogru: {
            metin: [
              'Doğru bildin! Ölçüyü ve tartıyı tam yapmak, doğru sözlü olmanın çarşıdaki hâlidir.',
              'Dürüst esnafın müşterisi de bereketi de eksik olmaz.',
            ],
            giris: c.tamamla,
          },
        },
      };
    },
    sonSoz: {
      hasan: 'Terazim de sözüm de doğrudur evlat. Yine beklerim!',
      kemal: 'Yaptığımın yanlış olduğunu anladım. Bundan sonra terazime parmağımı değil, vicdanımı koyacağım.',
      zehra: 'Haklısın yavrum; acelem olsa da tartmadan satmayacağım artık.',
    },
  },
  {
    kimlik: 'd2',
    bolge: 1,
    ad: 'Kırık Vazo',
    kim: 'Tahir Bey',
    yonerge: 'Tahir Bey\'in dükkânına uğra.',
    hedefler: ['nuri'],
    diyalog(k, c) {
      if (k.kimlik !== 'nuri') return null;
      const d = {
        giris: {
          metin: 'Hoş geldin! Rafları dilediğin gibi incele; ben arka tarafta siparişleri hazırlıyorum.',
          git: 'olay',
        },
        olay: {
          konusan: ANLATICI,
          metin: [
            'Rafları incelerken dirseğin bir vazoya çarpıyor. Şangır! Vazo yere düşüp kırılıyor.',
            'Tahir Bey\'in arkası dönük; hiçbir şey görmedi.',
          ],
          git: 'vazo',
        },
        son: { metin: 'Kırılan vazo yerine konur; kırılan güven ise kolay kolay yerine gelmez. Aferin sana!', giris: c.tamamla },
      };
      soru(c, d, 'vazo', {
        ozet: 'Dükkânda yanlışlıkla bir vazo kırdın; satıcı görmedi. Ne yaparsın?',
        konusan: ANLATICI,
        metin: 'Ne yaparsın?',
        sonra: 'son',
        secenekler: [
          {
            metin: 'Tahir Bey\'e gidip vazoyu yanlışlıkla kırdığımı söyler, özür dilerim.',
            dogru: true,
            tepki: 'Vazoya üzüldüm ama doğruyu söylemene çok sevindim. Hatasını söyleyebilen insan güvenilir insandır.',
          },
          {
            metin: 'Kimse görmedi; parçaları rafın arkasına saklayıp uzaklaşırım.',
            tepki:
              'Bir daha düşün: Tahir Bey vazoyu aradığında kimin kırdığını bilemeyecek, belki başkasından şüphelenecek. Hatayı saklamak onu yok etmez; içindeki huzursuzluğu büyütür.',
          },
          {
            metin: '"Kedi devirdi" derim.',
            tepki:
              'Bir daha düşün: Bu hem yalan söylemek hem de suçsuz birine iftira atmaktır. Doğru sözlü insan, hatasını başkasının üzerine atmaz.',
          },
        ],
      });
      return { baslangic: 'giris', dugumler: d };
    },
    sonSoz: { nuri: 'Doğru sözlü müşterimi her zaman beklerim. Dükkânım sana açık!' },
  },
  {
    kimlik: 'd3',
    bolge: 1,
    ad: 'Fazla Para Üstü',
    kim: 'Taha Abi',
    yonerge: 'Taha Abi\'nin tezgâhından bir simit al.',
    hedefler: ['murat'],
    diyalog(k, c) {
      if (k.kimlik !== 'murat') return null;
      const d = {
        giris: { metin: 'Buyur! Sıcacık simit, tanesi beş lira.', git: 'olay' },
        olay: {
          konusan: ANLATICI,
          metin: [
            'Bir simit alıp yirmi lira veriyorsun. Tezgâh çok kalabalık.',
            'Taha Abi dalgınlıkla sana on beş lira yerine yirmi beş lira para üstü veriyor.',
          ],
          git: 'para',
        },
        son: { metin: 'Senin gibi dürüst insanlar oldukça bu çarşının bereketi eksilmez!', giris: c.tamamla },
      };
      soru(c, d, 'para', {
        konusan: ANLATICI,
        metin: 'Elinde on lira fazla var. Ne yaparsın?',
        sonra: 'son',
        secenekler: [
          {
            metin: '"Taha Abi, bana on lira fazla verdin" deyip fazlasını geri veririm.',
            dogru: true,
            tepki: 'Vay, hiç fark etmemiştim! Akşam kasam eksik çıkacaktı. Çok teşekkür ederim.',
          },
          {
            metin: 'Sesimi çıkarmam, fazla parayı cebime koyarım.',
            tepki:
              'Bir daha düşün: O para senin değil. Akşam kasasını saydığında Taha Abi\'nin parası eksik çıkacak. Hakkın olmayanı almak, kimse görmese de doğru değildir.',
          },
          {
            metin: 'Hata onun; ben istemedim ki, bende kalabilir.',
            tepki:
              'Bir daha düşün: Hatayı o yapmış olsa da paranın sahibi belli. Yanlışlıkla eline geçen bir şeyi sahibine geri vermek, güvenilir insanın davranışıdır.',
          },
        ],
      });
      return { baslangic: 'giris', dugumler: d };
    },
    sonSoz: { murat: 'Hoş geldin dürüst arkadaşım! Bugün simitler benden.' },
  },

  // =====================================================================
  // MERHAMET BAHÇESİ
  // =====================================================================
  {
    kimlik: 'm1',
    bolge: 2,
    ad: 'Yaralı Kedi',
    kim: 'Pamuk (kedi)',
    yonerge: 'Bahçedeki kedi Pamuk\'a bak.',
    hedefler: ['pamuk'],
    diyalog(k, c) {
      if (k.kimlik !== 'pamuk') return null;
      const d = {
        giris: {
          konusan: ANLATICI,
          metin: 'Pamuk çalıların dibinde titriyor. Ön patisi incinmiş; aç ve susuz görünüyor.',
          git: 'kedi',
        },
      };
      soru(c, d, 'kedi', {
        ozet: 'Bahçede yaralı, aç bir kedi gördün. Ne yaparsın?',
        konusan: ANLATICI,
        metin: 'Ne yaparsın?',
        dogruGiris: c.insaBaslat,
        secenekler: [
          {
            metin: 'Ona su ve mama getirir, yanında kalırım.',
            dogru: true,
            konusan: ANLATICI,
            tepki: [
              'Çok güzel! Bahçe kulübesinden bir su kabı ve bir mama kabı aldın.',
              'Kapları çantandan seç ve Pamuk\'un yanındaki işaretli yerlere yerleştir.',
            ],
          },
          {
            metin: 'Pis görünüyor; "pist!" deyip kovalarım.',
            tepki:
              'Bir daha düşün: Pamuk yaralı ve korkuyor. Hayvanlar da acı çeker; onlara eziyet etmek değil, şefkat göstermek gerekir.',
          },
          {
            metin: 'Nasılsa başka biri ilgilenir; yoluma devam ederim.',
            tepki:
              'Bir daha düşün: Herkes böyle düşünürse Pamuk\'a kimse yardım etmez. Merhamet, yardıma muhtaç olanı görünce harekete geçmektir.',
          },
        ],
      });
      return { baslangic: 'giris', dugumler: d };
    },
    insa: {
      hedefler: KEDI_KAPLARI,
      merkez: { x: 31.5, y: 11, z: 65.5 },
      adim: (n, t) => `Su ve mama kaplarını Pamuk'un yanına koy: ${n}/${t}`,
      hatirlatma: 'Pamuk sana umutla bakıyor. Su ve mama kaplarını işaretli yerlere koy.',
      bitis: 'Pamuk suyunu içti, mamasını yedi. Sana sürtünüp mırıldanıyor. Bütün canlılar merhameti hak eder.',
    },
    sonSoz: { pamuk: 'Mırrr... (Pamuk karnı tok, mutlu mutlu sana bakıyor.)' },
  },
  {
    kimlik: 'm2',
    bolge: 2,
    ad: 'Komşunun Evi',
    kim: 'Emine Nine',
    yonerge: 'Bahçenin kuzeydoğusundaki evin önünde Emine Nine ile konuş.',
    hedefler: ['ayse'],
    diyalog(k, c) {
      if (k.kimlik !== 'ayse') return null;
      const d = {
        giris: {
          metin: [
            'Ah yavrum... Dün geceki fırtına evimin güney duvarını yıktı.',
            'Rüzgâr içeri doluyor. Bu yaşta tek başıma nasıl onaracağım, bilemiyorum.',
          ],
          git: 'ev',
        },
      };
      soru(c, d, 'ev', {
        ozet: 'Yaşlı komşunun evinin duvarı fırtınada yıkıldı. Ne yaparsın?',
        konusan: ANLATICI,
        metin: 'Ne yaparsın?',
        dogruGiris: c.insaBaslat,
        secenekler: [
          {
            metin: '"Merak etme Emine Nine, duvarını ben onarırım" derim.',
            dogru: true,
            tepki: [
              'Allah senden razı olsun yavrum! Al, bu sıva bloklarını kullan.',
              'Evin güney duvarındaki işaretli boşlukları doldurman yeter.',
            ],
          },
          {
            metin: 'Çok işim var; başka zaman bakarım.',
            tepki:
              'Bir daha düşün: Emine Nine bu gece de soğukta kalacak. Yardım, ihtiyaç olduğu anda yapılınca kıymetlidir.',
          },
          {
            metin: 'Bu benim işim değil; ustalar yapsın.',
            tepki:
              'Bir daha düşün: Komşunun derdi hepimizin derdidir. Elinden gelen bir iyiliği başkasına bırakmak merhamete yakışmaz.',
          },
        ],
      });
      return { baslangic: 'giris', dugumler: d };
    },
    insa: {
      hedefler: DUVAR_BOSLUKLARI,
      varsayilan: B.DUVAR,
      merkez: { x: 46, y: 11, z: 50.5 },
      adim: (n, t) => `Emine Nine'nin duvarını onar: ${n}/${t}`,
      hatirlatma: 'Evin güney duvarındaki işaretli boşlukları sıva bloklarıyla doldurabilir misin yavrum?',
      bitis: 'Emine Nine: "Evim yeniden sıcacık oldu! Komşusuna yardım edenin gönlü de güzelleşir."',
      koru: 'Emine Nine\'nin duvarını yeni onardın; yerinde kalsın.',
    },
    sonSoz: { ayse: 'Sayende bu gece rahat uyuyacağım. Elin dert görmesin yavrum.' },
  },
  {
    kimlik: 'm3',
    bolge: 2,
    ad: 'Dışlanan Arkadaş',
    kim: 'Deniz, Elif ve Can',
    yonerge: 'Bahçede oynayan çocukların yanına git.',
    hedefler: ['deniz', 'elif', 'can'],
    diyalog(k, c) {
      const ilk = {
        deniz: 'Ben de oynamak istiyordum ama "sen yavaşsın" deyip beni almadılar...',
        elif: 'Biz yakalamaca oynuyoruz! Deniz çok yavaş koşuyor, o yüzden onu almadık.',
        can: 'Takımlar tamam. Deniz mi? O kenarda dursun, zaten yetişemiyor.',
      }[k.kimlik];
      if (!ilk) return null;
      const d = {
        giris: { metin: ilk, git: 'arkadas' },
        deniz: { konusan: 'Deniz', metin: 'Teşekkür ederim! Beni fark ettiğin için çok mutlu oldum.', git: 'son' },
        son: {
          konusan: ANLATICI,
          metin: 'Çocuklar hep birlikte oynamaya başladı. Kimsenin dışarıda kalmadığı oyun, en güzel oyundur.',
          giris: c.tamamla,
        },
      };
      soru(c, d, 'arkadas', {
        konusan: ANLATICI,
        metin: 'Elif ile Can oyun oynuyor; Deniz kenarda tek başına, üzgün duruyor. Ne yaparsın?',
        sonra: 'deniz',
        secenekler: [
          {
            metin: 'Elif ile Can\'a "Deniz\'i de alalım; herkes oynayınca oyun daha güzel olur" derim.',
            dogru: true,
            konusan: 'Elif',
            tepki: 'Haklısın... Deniz\'in üzüleceğini hiç düşünmemiştik. Deniz, gel! Sen de bizim takımdasın.',
          },
          {
            metin: 'Ben oyuna katılırım; Deniz kendine başka oyun bulsun.',
            tepki:
              'Bir daha düşün: Sen eğlenirken Deniz hâlâ yalnız ve üzgün olacak. Kendini onun yerine koy: dışlanan sen olsaydın ne hissederdin?',
          },
          {
            metin: 'Bu onların meselesi; karışmam.',
            tepki:
              'Bir daha düşün: Bir arkadaşının üzüldüğünü görüp sessiz kalmak onu daha da yalnızlaştırır. Merhamet, başkasının üzüntüsünü fark edip el uzatmaktır.',
          },
        ],
      });
      return { baslangic: 'giris', dugumler: d };
    },
    sonSoz: {
      deniz: 'Artık ben de takımdayım! Yakalamaca çok eğlenceliymiş.',
      elif: 'Deniz saklanmada hepimizden iyiymiş! İyi ki çağırmışız.',
      can: 'Bundan sonra kimseyi oyunun dışında bırakmayacağız.',
    },
  },

  // =====================================================================
  // ADAP KONAĞI
  // =====================================================================
  {
    kimlik: 'a1',
    bolge: 3,
    ad: 'Selam Kapısı',
    kim: 'Zehra Hanım',
    yonerge: 'Konağın kapısındaki Zehra Hanım ile konuş.',
    hedefler: ['hatice'],
    diyalog(k, c) {
      if (k.kimlik !== 'hatice') return null;
      const d = {
        giris: { metin: 'Konağımıza hoş geldin. Bu kapı güzel sözle açılır.', git: 'selam' },
        son: {
          metin: 'Selam vermek, karşındakine esenlik dilemektir; izin istemek de ev sahibine saygıdır. Kapımız sana açık!',
          giris: c.tamamla,
        },
      };
      soru(c, d, 'selam', {
        metin: 'Bir eve girerken nasıl davranırsın?',
        sonra: 'son',
        secenekler: [
          {
            metin: 'Kapıyı çalar, "Selamün aleyküm, müsaade var mı?" diye izin isterim.',
            dogru: true,
            tepki: 'Ve aleyküm selam, buyur evladım! Ne güzel selam verdin.',
          },
          {
            metin: 'Kapı açıksa çalmadan içeri girerim.',
            konusan: 'Zehra Hanım',
            tepki:
              'Bir daha düşün evladım: İzin almadan girmek ev halkını rahatsız eder. Önce kapı çalınır, selam verilir, izin istenir.',
          },
          {
            metin: 'Kapıya vurup "Açın kapıyı!" diye seslenirim.',
            konusan: 'Zehra Hanım',
            tepki: 'Bir daha düşün evladım: Kaba söz kapıları kapatır. Nazik bir selam ise hem kapıyı hem gönülleri açar.',
          },
        ],
      });
      return { baslangic: 'giris', dugumler: d };
    },
    sonSoz: { hatice: 'Selamün aleyküm evladım! İçeri buyur; Tuğba Teyze ile Beytullah Amca seni bekliyor.' },
  },
  {
    kimlik: 'a2',
    bolge: 3,
    ad: 'Sofra Odası',
    kim: 'Tuğba Teyze (konağın içinde)',
    yonerge: 'Konağın içinde, Tuğba Teyze\'nin sofrasına otur.',
    hedefler: ['fatma'],
    diyalog(k, c) {
      if (k.kimlik !== 'fatma') return null;
      const d = {
        giris: { metin: 'Tam vaktinde geldin! Sofra hazır. Bakalım sofra adabını ne kadar biliyorsun?', git: 'sofra1' },
        son: {
          metin: [
            'Büyükleri beklemek, besmeleyle başlamak, israf etmemek... Hepsini bildin!',
            'Yemekten sonra "Elhamdülillah" deyip sofrayı hazırlayana teşekkür etmeyi de unutma. Afiyet olsun!',
          ],
          giris: c.tamamla,
        },
      };
      soru(c, d, 'sofra1', {
        metin: 'Karnın çok aç ama büyükler henüz sofraya oturmadı. Ne yaparsın?',
        sonra: 'sofra2',
        secenekler: [
          {
            metin: 'Büyüklerin gelip yemeğe başlamasını beklerim.',
            dogru: true,
            tepki: 'Aferin! Sofraya birlikte oturmak ve büyükleri beklemek, onlara gösterdiğimiz saygıdır.',
          },
          {
            metin: 'Yemek soğumasın; hemen yemeye başlarım.',
            konusan: 'Tuğba Teyze',
            tepki: 'Bir daha düşün: Sofra birlikte güzeldir. Herkes gelmeden yemeye başlamak sofradakilere saygısızlık olur.',
          },
        ],
      });
      soru(c, d, 'sofra2', {
        metin: 'Herkes sofrada. Yemeğe nasıl başlarsın?',
        sonra: 'sofra3',
        secenekler: [
          {
            metin: '"Bismillah" diyerek, besmeleyle başlarım.',
            dogru: true,
            tepki: 'Çok güzel! Her lokma bir nimettir; yemeğe besmeleyle başlarız.',
          },
          {
            metin: 'Hiçbir şey demeden hızlıca yemeye koyulurum.',
            konusan: 'Tuğba Teyze',
            tepki:
              'Bir daha düşün: Önümüzdeki yemek bir nimettir. Besmeleyle başlamak, bu nimetin kıymetini bildiğimizi gösterir.',
          },
        ],
      });
      soru(c, d, 'sofra3', {
        metin: 'Tencerede en sevdiğin yemek var. Tabağına ne kadar alırsın?',
        sonra: 'son',
        secenekler: [
          {
            metin: 'Yiyebileceğim kadar alırım; bitirince istersem yine alırım.',
            dogru: true,
            tepki: 'İşte bu! Tabağında yemek bırakmayan, nimete ve emeğe saygı gösterir.',
          },
          {
            metin: 'Tabağımı tepeleme doldururum; yiyemezsem kalsın.',
            konusan: 'Tuğba Teyze',
            tepki: 'Bir daha düşün: Tabakta kalan yemek çöpe gider. İsraf, nimetin kıymetini bilmemektir; ihtiyacın kadarını almalısın.',
          },
        ],
      });
      return { baslangic: 'giris', dugumler: d };
    },
    sonSoz: { fatma: 'Sofra adabını bilen misafir, sofranın süsüdür. Yine bekleriz!' },
  },
  {
    kimlik: 'a3',
    bolge: 3,
    ad: 'Misafir Odası',
    kim: 'Beytullah Amca (konağın içinde)',
    yonerge: 'Konağın içinde Beytullah Amca ile konuş.',
    hedefler: ['ibrahim'],
    diyalog(k, c) {
      if (k.kimlik !== 'ibrahim') return null;
      const d = {
        giris: {
          metin: 'Buyur evladım. Birazdan misafirimiz gelecek; bakalım misafir ağırlamayı biliyor musun?',
          git: 'misafir1',
        },
        son: {
          metin: 'Güler yüz, ikram ve güzel dinlemek... Misafir, evin bereketidir; sen onu ağırlamayı çok iyi biliyorsun.',
          giris: c.tamamla,
        },
      };
      soru(c, d, 'misafir1', {
        metin: 'Kapı çaldı. Gelen, uzun zamandır görmediğiniz bir aile dostu. Ne yaparsın?',
        sonra: 'misafir2',
        secenekler: [
          {
            metin: 'Güler yüzle "Hoş geldiniz, buyurun" deyip içeri davet ederim.',
            dogru: true,
            tepki: 'Güzel! Misafiri güler yüzle karşılamak, ikramın ilk adımıdır.',
          },
          {
            metin: 'Kapıyı açar, bir şey demeden odama giderim.',
            konusan: 'Beytullah Amca',
            tepki: 'Bir daha düşün: Misafir kendini istenmiyor sanır. Güler yüz ve "hoş geldiniz" demek en kolay, en değerli ikramdır.',
          },
        ],
      });
      soru(c, d, 'misafir2', {
        metin: 'Mutfakta bir tabak kurabiye var. Ne yaparsın?',
        sonra: 'misafir3',
        secenekler: [
          {
            metin: 'Önce misafire ikram ederim.',
            dogru: true,
            tepki: 'Aferin! İkramda öncelik misafirindir; paylaştıkça bereket artar.',
          },
          {
            metin: 'En güzellerini kendime ayırır, kalanını götürürüm.',
            konusan: 'Beytullah Amca',
            tepki: 'Bir daha düşün: İkramın güzeli misafire sunulur. Kendimiz için istediğimizi misafirimiz için de istemeliyiz.',
          },
        ],
      });
      soru(c, d, 'misafir3', {
        metin: 'Misafir bir anısını anlatıyor. Ne yaparsın?',
        sonra: 'son',
        secenekler: [
          {
            metin: 'Sözünü kesmeden, yüzüne bakarak dinlerim.',
            dogru: true,
            tepki: 'Çok doğru! Konuşanı dinlemek, ona "sen değerlisin" demenin en nazik yoludur.',
          },
          {
            metin: 'O anlatırken telefonumla oynarım.',
            konusan: 'Beytullah Amca',
            tepki: 'Bir daha düşün: Konuşan kişi önemsenmediğini düşünür. Nezaket, karşındakine dikkatini vermektir.',
          },
          {
            metin: 'Sözünü kesip kendi anımı anlatırım.',
            konusan: 'Beytullah Amca',
            tepki: 'Bir daha düşün: Söz kesmek kabalıktır. Önce dinler, sıramız gelince konuşuruz.',
          },
        ],
      });
      return { baslangic: 'giris', dugumler: d };
    },
    sonSoz: { ibrahim: 'Misafirperver evladım, hoş geldin! Çayımız her zaman demli.' },
  },

  // =====================================================================
  // VATAN TEPESİ
  // =====================================================================
  {
    kimlik: 'v1',
    bolge: 4,
    ad: 'Bilgi Blokları',
    kim: 'Yamaçtaki üç altın bilgi bloğu',
    yonerge: 'Tepenin yamacındaki üç altın bilgi bloğunu oku.',
    hedefler: ['bilgi-canakkale', 'bilgi-kurtulus', 'bilgi-15temmuz'],
    okunacak: ['bilgi-canakkale', 'bilgi-kurtulus', 'bilgi-15temmuz'],
    adim: (n, t) => `Bilgi bloklarını oku: ${n}/${t}`,
    bitis: 'Üç bilgi bloğunu da okudun. Şimdi tepedeki Sezgin Öğretmen\'in yanına çık!',
  },
  {
    kimlik: 'v2',
    bolge: 4,
    ad: 'Bilgi Kapısı',
    kim: 'Sezgin Öğretmen (tepenin üstünde)',
    yonerge: 'Tepenin üstündeki Sezgin Öğretmen\'in üç sorusunu cevapla.',
    hedefler: ['selim'],
    diyalog(k, c) {
      if (k.kimlik !== 'selim') return null;
      const d = {
        giris: {
          metin: 'Bilgi bloklarını okumuşsun, aferin! Bilgi Kapısı\'ndan geçmek için üç soruma cevap ver bakalım.',
          git: 'sinav1',
        },
        son: {
          metin: 'Üçünü de bildin! Geçmişini bilen, vatanının kıymetini de bilir. Bilgi Kapısı sana açıldı.',
          giris: c.tamamla,
        },
      };
      soru(c, d, 'sinav1', {
        metin: 'Çanakkale Zaferi hangi yıl kazanıldı?',
        sonra: 'sinav2',
        secenekler: [
          { metin: '1915', dogru: true, tepki: 'Doğru! 18 Mart 1915\'te düşman donanması boğazda durduruldu. "Çanakkale geçilmez!"' },
          { metin: '1922', konusan: 'Sezgin Öğretmen', tepki: 'Bir daha düşün: 1922, Büyük Taarruz\'un yılıdır. Çanakkale Zaferi ondan daha önce, Birinci Dünya Savaşı sırasında kazanıldı.' },
          { metin: '2016', konusan: 'Sezgin Öğretmen', tepki: 'Bir daha düşün: 2016, 15 Temmuz\'un yılıdır. Çanakkale Zaferi yüz yıldan fazla bir süre önce kazanıldı.' },
        ],
      });
      soru(c, d, 'sinav2', {
        metin: 'Mustafa Kemal Paşa, Millî Mücadele\'yi başlatmak için 19 Mayıs 1919\'da hangi şehre çıktı?',
        sonra: 'sinav3',
        secenekler: [
          { metin: 'İzmir', konusan: 'Sezgin Öğretmen', tepki: 'Bir daha düşün: İzmir, 9 Eylül 1922\'de işgalden kurtuldu. Millî Mücadele ise Karadeniz kıyısındaki bir şehirden başladı.' },
          { metin: 'Samsun', dogru: true, tepki: 'Doğru! 19 Mayıs 1919\'da Samsun\'a çıkıldı. Bu yüzden 19 Mayıs\'ı bayram olarak kutlarız.' },
          { metin: 'Ankara', konusan: 'Sezgin Öğretmen', tepki: 'Bir daha düşün: Ankara\'da 23 Nisan 1920\'de Meclis açıldı. Yolculuk ise deniz yoluyla varılan bir şehirden başladı.' },
        ],
      });
      soru(c, d, 'sinav3', {
        metin: '15 Temmuz 2016 gecesi milletimiz ne yaptı?',
        sonra: 'son',
        secenekler: [
          { metin: 'Evlerine kapanıp olanların bitmesini bekledi.', konusan: 'Sezgin Öğretmen', tepki: 'Bir daha düşün: O gece milletimiz beklemedi. Bilgi bloğunda insanların nereye çıktığını hatırla.' },
          { metin: 'Meydanlara çıkarak vatanına ve demokrasisine sahip çıktı.', dogru: true, tepki: 'Doğru! Milletimiz birlik olup darbe girişimini durdurdu. 15 Temmuz, Demokrasi ve Millî Birlik Günü\'dür.' },
        ],
      });
      return { baslangic: 'giris', dugumler: d };
    },
    sonSoz: {},
  },
  {
    kimlik: 'v3',
    bolge: 4,
    ad: 'Bayrak ve Anıt',
    kim: 'Sezgin Öğretmen (tepenin üstünde)',
    yonerge: 'Sezgin Öğretmen ile konuş; bayrak direğini ve anıtı dik.',
    hedefler: ['selim'],
    diyalog(k, c) {
      if (k.kimlik !== 'selim') return null;
      const d = {
        giris: {
          metin: [
            'Fırtına, tepemizdeki bayrak direğini yıktı. Bayrağımızı yeniden göndere çekmek ve şehitlerimiz için küçük bir anıt dikmek istiyorum.',
            'Ama önce bir sorum var.',
          ],
          git: 'vatan',
        },
      };
      soru(c, d, 'vatan', {
        metin: 'Sence vatanını seven bir öğrenci ne yapar?',
        dogruGiris: c.insaBaslat,
        secenekler: [
          {
            metin: 'Derslerine çalışır, çevresini temiz tutar, görevlerini en iyi şekilde yapar.',
            dogru: true,
            tepki: [
              'Çok doğru! Vatan sevgisi her gün çalışarak, üreterek ve çevremizi koruyarak gösterilir.',
              'Al bakalım: dört direk bloğu ve üç anıt taşı. Onları tepedeki işaretli yerlere yerleştir; bayrağımız yükselsin!',
            ],
          },
          {
            metin: 'Yalnızca bayramlarda bayrak asar; gerisi büyüklerin işidir.',
            konusan: 'Sezgin Öğretmen',
            tepki: 'Bir daha düşün: Vatan sevgisi yalnızca bayramlarda hatırlanmaz. Her gün görevini iyi yapmak, çalışmak ve çevreni korumak da vatan sevgisidir.',
          },
        ],
      });
      return { baslangic: 'giris', dugumler: d };
    },
    insa: {
      hedefler: [...DIREK_HEDEFLERI, ...ANIT_HEDEFLERI],
      merkez: { x: 64.5, y: 23, z: 26.5 },
      adim: (n, t) => `Bayrak direğini ve anıtı dik: ${n}/${t}`,
      hatirlatma: 'Direk bloklarını mermerin üstüne, anıt taşlarını yandaki işaretli yere üst üste koy.',
      bitis: 'Bayrağımız yeniden dalgalanıyor! Vatanı sevmek; onu korumak, çalışmak ve güzelleştirmektir.',
      koru: 'Bu anıt şehitlerimizin hatırasıdır; yerinde kalmalı.',
    },
    sonSoz: { selim: 'Bayrağımız senin emeğinle dalgalanıyor. Seninle gurur duyuyorum!' },
  },
];
