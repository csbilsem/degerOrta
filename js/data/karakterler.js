// Köy karakterleri ve tanışma konuşmaları.
// Diyalog biçimi: { baslangic, dugumler: { ad: { metin, secenekler | git } } }
//   metin: tek metin ya da sırayla gösterilecek sayfalar dizisi
//   secenekler: [{ metin, git }]  — git yoksa konuşma biter
// Konum: x, z blok koordinatı; y verilmezse düz köy zeminine oturtulur.

const basit = (...sayfalar) => ({ baslangic: 'a', dugumler: { a: { metin: sayfalar } } });

export const KARAKTERLER = [
  // ---------- Köy Meydanı ----------
  {
    kimlik: 'dede',
    ad: 'Dede',
    x: 62.5, z: 69.5, bakis: 0.6,
    gorunum: { tur: 'yasli', ust: 0x6b4f3a, alt: 0x4a4a4a, sapka: 0xf1ede2, sakal: 0xf4f4f4 },
    diyalog: {
      baslangic: 'karsilama',
      dugumler: {
        karsilama: {
          metin: [
            'Hoş geldin {ad}! Ben bu köyün Dedesiyim.',
            'Köyümüz bir zamanlar rengârenkti. İnsanlar doğruluğu, merhameti, adabı ve vatan sevgisini unutunca renklerimiz de soldu.',
            'Köyü yeniden canlandırmak için senin gibi bir kalp kahramanına ihtiyacımız var.',
          ],
          git: 'menu',
        },
        menu: {
          metin: 'Sana nasıl yardımcı olayım?',
          secenekler: [
            { metin: 'Ne yapmam gerekiyor?', git: 'gorev' },
            { metin: 'Bölgeleri anlatır mısın?', git: 'bolgeler' },
            { metin: 'Anıt nedir?', git: 'anit' },
            { metin: 'Nereye gideceğimi nasıl bulurum?', git: 'yol' },
            { metin: 'Hazırım, gidiyorum!', git: 'veda' },
          ],
        },
        gorev: {
          metin: [
            'Köyde dört bölge var. Her bölgede seni bekleyen üç görev bulunuyor.',
            'Görevlerde köylülerle konuşacak, bazen de zor kararlar vereceksin. Doğru karar verdiğinde o değerin puanı artar.',
            'Yanlış bir seçim yaparsan üzülme; kimse seni cezalandırmaz. Karşındaki sana nedenini anlatır, sen de bir daha düşünürsün.',
            'Bir bölgenin üç görevini bitirdiğinde o bölge yeniden renklenir ve sana özel bir değer bloğu verilir.',
          ],
          git: 'menu',
        },
        bolgeler: {
          metin: [
            'Doğuda Doğruluk Çarşısı var; orada doğru sözlü olmayı öğrenirsin. Bloğu mavidir.',
            'Batıda Merhamet Bahçesi var; insanlara ve tüm canlılara şefkat göstermeyi öğrenirsin. Bloğu yeşildir.',
            'Güneyde Adap Konağı var; selamlaşmayı, sofra adabını ve misafir ağırlamayı öğrenirsin. Bloğu mordur.',
            'Kuzeyde Vatan Tepesi var; vatanımızı ve onu koruyanları tanırsın. Bloğu kırmızıdır.',
          ],
          git: 'menu',
        },
        anit: {
          metin: [
            'Meydanın ortasındaki beyaz mermer alanı görüyor musun? Orası Anıt Alanı; Değerler Anıtı orada yükselecek.',
            'Kazandığın değer bloklarını Anıt Alanı\'nın üzerine yerleştireceksin. Anıt tamamlandığında köyün bütün renkleri geri gelecek.',
            'O gün sana "Kalbin Kahramanı" diyeceğiz!',
          ],
          git: 'menu',
        },
        yol: {
          metin: [
            'Ekranın sağ üstündeki haritaya bak. Görev seni bekleyen yerler haritada renkli noktalarla gösterilir.',
            'Köyde de o yerlerden gökyüzüne renkli bir ışık yükselir. Işığa doğru yürü, oradaki kişiyle konuş.',
            'Sol üstteki görev listesi, hangi bölgede hangi görevin sırada olduğunu söyler. İstediğin bölgeden başlayabilirsin.',
          ],
          git: 'menu',
        },
        veda: { metin: 'Yolun açık olsun evladım. Köylülerle konuşmayı unutma; hepsi seni bekliyor.' },
      },
    },
  },

  // ---------- Doğruluk Çarşısı ----------
  {
    kimlik: 'hasan', ad: 'Hasan Usta', x: 90.5, z: 56.5, bakis: 0,
    gorunum: { tur: 'yetiskin', ust: 0xb5562f, alt: 0x3a3a3a, sac: 0x2b2b2b, onluk: 0xf1ede2 },
    diyalog: basit(
      'Buyur evlat, hoş geldin! En taze elmalar bende.',
      'Terazim her zaman doğru tartar. Müşterimin hakkı bana emanettir.'
    ),
  },
  {
    kimlik: 'kemal', ad: 'Kemal Amca', x: 97.5, z: 56.5, bakis: 0,
    gorunum: { tur: 'yetiskin', ust: 0x3b6ea8, alt: 0x2f2f38, sac: 0x5a4632, sapka: 0x444444 },
    diyalog: basit(
      'Gel gel, bu fiyata başka yerde bulamazsın!',
      'Terazi mi? Aman canım, birkaç gram eksik olmuş, kim fark edecek...'
    ),
  },
  {
    kimlik: 'zehra', ad: 'Zehra Teyze', x: 104.5, z: 56.5, bakis: 0,
    gorunum: { tur: 'kadin', ust: 0x8a4f7d, alt: 0x5c3454, ortu: 0xe6d3a8 },
    diyalog: basit(
      'Hoş geldin yavrum. Baharat mı bakmıştın?',
      'Çarşıda işler eskisi gibi değil. Kimin sözüne güveneceğimizi şaşırdık.'
    ),
  },
  {
    kimlik: 'nuri', ad: 'Nuri Bey', x: 90.5, z: 72.5, bakis: Math.PI,
    gorunum: { tur: 'yetiskin', ust: 0x4f7d5a, alt: 0x33302c, sac: 0x7a7a7a, sakal: 0x7a7a7a },
    diyalog: basit(
      'Dükkânıma hoş geldin. Vazolarım el emeğidir, dikkatli bak olur mu?',
      'İnsan hata yapabilir; önemli olan hatasını gizlememesidir.'
    ),
  },
  {
    kimlik: 'murat', ad: 'Murat Abi', x: 104.5, z: 72.5, bakis: Math.PI,
    gorunum: { tur: 'yetiskin', ust: 0xd9a531, alt: 0x3b4a6b, sac: 0x1f1f1f },
    diyalog: basit(
      'Selam! Simit, ayran, ne istersen var.',
      'Bugün çok kalabalıktı, para üstlerini karıştırıp duruyorum.'
    ),
  },

  // ---------- Merhamet Bahçesi ----------
  {
    kimlik: 'pamuk', ad: 'Pamuk', x: 31.5, z: 64.5, bakis: Math.PI / 2,
    gorunum: { tur: 'kedi', renk: 0xf2f2f2 },
    diyalog: basit('Miyav... (Pamuk topallıyor. Patisi incinmiş gibi görünüyor.)'),
  },
  {
    kimlik: 'ayse', ad: 'Ayşe Nine', x: 50.5, z: 46.5, bakis: Math.PI / 2,
    gorunum: { tur: 'kadin', yasli: true, ust: 0x5d6f8a, alt: 0x3e4a5c, ortu: 0xf4f4f4 },
    diyalog: basit(
      'Ah yavrum, hoş geldin. Dün geceki fırtına evimin güney duvarını yıktı.',
      'Bu yaşta tek başıma nasıl onaracağım, bilemiyorum...'
    ),
  },
  {
    kimlik: 'elif', ad: 'Elif', x: 35.5, z: 66.5, bakis: 1.2,
    gorunum: { tur: 'cocuk', ust: 0xe8548f, alt: 0x5a3d7a, sac: 0x4a2c1a, orgu: true },
    diyalog: basit('Biz burada yakalamaca oynuyoruz!', 'Deniz mi? O çok yavaş koşuyor, takıma almadık.'),
  },
  {
    kimlik: 'can', ad: 'Can', x: 37.0, z: 65.3, bakis: -1.2,
    gorunum: { tur: 'cocuk', ust: 0x2f8f83, alt: 0x33415c, sac: 0x1f1f1f },
    diyalog: basit('Sen de oynamak ister misin?', 'Ama takımlar dolu... Galiba.'),
  },
  {
    kimlik: 'deniz', ad: 'Deniz', x: 40.5, z: 71.5, bakis: -2.4,
    gorunum: { tur: 'cocuk', ust: 0xf0b429, alt: 0x4a4a4a, sac: 0x6b4423 },
    diyalog: basit('Merhaba...', 'Ben de oynamak istiyordum ama beni çağırmadılar.'),
  },

  // ---------- Adap Konağı ----------
  {
    kimlik: 'hatice', ad: 'Hatice Hanım', x: 60.5, z: 91.5, bakis: Math.PI,
    gorunum: { tur: 'kadin', ust: 0x7a4bb5, alt: 0x4d2f75, ortu: 0xd9c9ef },
    diyalog: basit(
      'Konağımıza hoş geldin. Bu kapıdan güzel sözle girilir.',
      'Bir eve girerken ilk yapılacak şey nedir, hiç düşündün mü?'
    ),
  },
  {
    kimlik: 'fatma', ad: 'Fatma Teyze', x: 59.5, z: 99.5, bakis: Math.PI,
    gorunum: { tur: 'kadin', ust: 0xb5562f, alt: 0x6e3a22, ortu: 0xf1e0c5, onluk: 0xf4f4f4 },
    diyalog: basit(
      'Sofra odasına hoş geldin. Yemek birazdan hazır.',
      'Sofrada herkesin dikkat ettiği güzel alışkanlıklar vardır; yakında birlikte hatırlayacağız.'
    ),
  },
  {
    kimlik: 'ibrahim', ad: 'İbrahim Amca', x: 69.5, z: 99.5, bakis: Math.PI,
    gorunum: { tur: 'yasli', ust: 0x3e5c4a, alt: 0x3a3a3a, sapka: 0x6b4f3a, sakal: 0xdcdcdc },
    diyalog: basit(
      'Buyur evladım, misafir odamız burası.',
      'Misafir, evin bereketidir. Onu güler yüzle karşılamak gerekir.'
    ),
  },

  // ---------- Vatan Tepesi ----------
  {
    kimlik: 'selim', ad: 'Selim Öğretmen', x: 61.5, y: 23, z: 28.5, bakis: 2.6,
    gorunum: { tur: 'yetiskin', ust: 0xc0392b, alt: 0x2c3e50, sac: 0x3b2a1a },
    diyalog: basit(
      'Tepeye hoş geldin! Buradan bütün köy görünür.',
      'Yamaçtaki altın renkli bilgi bloklarını gördün mü? Önce onları oku, sonra yanıma gel.'
    ),
  },
  {
    kimlik: 'bilgi-canakkale', ad: 'Bilgi: Çanakkale Zaferi', x: 67.5, z: 45.5, zeminden: true,
    ipucu: 'Bilgi bloğunu oku', gorunum: { tur: 'bilgi' },
    diyalog: {
      baslangic: 'a',
      dugumler: {
        a: {
          konusan: 'Çanakkale Zaferi (1915)',
          metin: [
            'Birinci Dünya Savaşı\'nda düşman donanması Çanakkale Boğazı\'nı geçip İstanbul\'a ulaşmak istedi.',
            '18 Mart 1915\'te düşman gemileri boğazda durduruldu. Karada da askerlerimiz aylarca kahramanca savaştı; Mustafa Kemal bu cephede büyük başarı gösterdi.',
            'On binlerce askerimiz şehit oldu ama düşman geçemedi. Bu yüzden "Çanakkale geçilmez!" deriz. Her yıl 18 Mart\'ta şehitlerimizi anarız.',
          ],
        },
      },
    },
  },
  {
    kimlik: 'bilgi-kurtulus', ad: 'Bilgi: Kurtuluş Savaşı', x: 60.5, z: 38.5, zeminden: true,
    ipucu: 'Bilgi bloğunu oku', gorunum: { tur: 'bilgi' },
    diyalog: {
      baslangic: 'a',
      dugumler: {
        a: {
          konusan: 'Kurtuluş Savaşı (1919-1922)',
          metin: [
            'Birinci Dünya Savaşı\'ndan sonra vatanımızın birçok yeri işgal edildi.',
            'Mustafa Kemal Paşa 19 Mayıs 1919\'da Samsun\'a çıkarak Millî Mücadele\'yi başlattı. 23 Nisan 1920\'de Ankara\'da Türkiye Büyük Millet Meclisi açıldı.',
            'Kadın, erkek, genç, yaşlı bütün millet el ele verdi. 30 Ağustos 1922\'de Büyük Taarruz zaferle sonuçlandı ve vatanımız işgalden kurtuldu.',
            '29 Ekim 1923\'te Cumhuriyet ilan edildi.',
          ],
        },
      },
    },
  },
  {
    kimlik: 'bilgi-15temmuz', ad: 'Bilgi: 15 Temmuz', x: 67.5, z: 32.5, zeminden: true,
    ipucu: 'Bilgi bloğunu oku', gorunum: { tur: 'bilgi' },
    diyalog: {
      baslangic: 'a',
      dugumler: {
        a: {
          konusan: '15 Temmuz (2016)',
          metin: [
            '15 Temmuz 2016 gecesi, silah zoruyla ülkenin yönetimini ele geçirmek isteyen bir grup darbe girişiminde bulundu.',
            'Milletimiz o gece sokaklara ve meydanlara çıktı; tankların önünde durarak vatanına, bayrağına ve demokrasisine sahip çıktı.',
            'O gece 251 vatandaşımız şehit oldu, binlercesi gazi oldu. Darbe girişimi milletin birliği sayesinde başarısız oldu.',
            'Her yıl 15 Temmuz\'u Demokrasi ve Millî Birlik Günü olarak anarız.',
          ],
        },
      },
    },
  },
];
