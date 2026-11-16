import * as THREE from '../vendor/three.module.min.js';
import { BLOKLAR, DEGER_BLOKLARI, katiMi } from './blocks.js';
import { ZEMIN } from './worldgen.js';
import { BOLGE_ADLARI } from './world.js';
import { KONAK_KAPISI, bayrakBloklari } from './worldgen.js';
import { GOREVLER } from './data/gorevler.js';

const KAYIT_ANAHTARI = 'kalbinKahramanlari.kayit.v1';
export const BOLGE_RENKLERI = [0xf0b429, 0x2f7fe0, 0x22b455, 0x8e5bd6, 0xe02a2a];
const BOLGE_YONLERI = ['', 'doğu', 'batı', 'güney', 'kuzey'];
const KARAR_PUANI = 10;
const GOREV_PUANI = 10;

const anahtar = (x, y, z) => x + ',' + y + ',' + z;

// Anıt Alanı: meydandaki mermerin üstündeki hacim
const ANIT = { x0: 62, x1: 66, z0: 62, z1: 66, y0: ZEMIN + 2, y1: ZEMIN + 14 };
// Değer bloklarının oturacağı işaretli yerler: üçü yan yana, biri tepede
const ANIT_YERLERI = [
  [63, ZEMIN + 3, 64],
  [64, ZEMIN + 3, 64],
  [65, ZEMIN + 3, 64],
  [64, ZEMIN + 4, 64],
];
const anitAlanindaMi = (x, y, z) =>
  x >= ANIT.x0 && x <= ANIT.x1 && z >= ANIT.z0 && z <= ANIT.z1 && y >= ANIT.y0 && y <= ANIT.y1;

// Görevlerin durumunu, kararları, yön işaretlerini ve görev panelini yönetir.
export class Gorevler {
  constructor(o) {
    Object.assign(this, o); // dunya, karakterler, envanter, etkilesim, sahne, mesaj, bildir, renklendir, panel
    this.gorevler = GOREVLER;
    this.kayit = { ad: '', dede: false, anit: false, biten: [], insa: [], okunan: [], puan: [0, 0, 0, 0, 0], sorular: [], kararlar: [], dunya: {}, canta: null, konum: null };
    this.anitSayisi = 0;
    this.isaretGrubu = new THREE.Group();
    this.hayaletGrubu = new THREE.Group();
    this.sahne.add(this.isaretGrubu, this.hayaletGrubu);
    this.isaretler = [];
    this.bildirimKuyrugu = [];

    this.etkilesim.degisince = () => {
      this.insaKontrol();
      this.anitKontrol();
    };
    this.etkilesim.kaydedici = (x, y, z, id) => {
      this.kayit.dunya[anahtar(x, y, z)] = id;
    };
    this.etkilesim.yerlestirmeKontrol = (x, y, z, id) => this.yerlestirmeKontrol(x, y, z, id);
    this.etkilesim.yerDuzelt = (x, y, z, id) => this.yerDuzelt(x, y, z, id);

    this.yukle();
    this.anitKontrol(true);
    this.yenile();
    // Çanta her değiştiğinde kaydedilir; değer bloğu eldeyse Anıt Alanı işaretlenir
    this.envanter.degisti = () => {
      this.kaydet();
      const eldeVar = this.degerBloguEldeMi();
      if (eldeVar !== this._eldeVardi) this.yenile();
    };
  }

  // ---------- Durum ----------
  bitti(q) {
    return this.kayit.biten.includes(q.kimlik);
  }
  insaEdiliyor(q) {
    return this.kayit.insa.includes(q.kimlik);
  }
  bolgeGorevleri(b) {
    return this.gorevler.filter((q) => q.bolge === b);
  }
  bolgeBitti(b) {
    return this.bolgeGorevleri(b).every((q) => this.bitti(q));
  }
  // Her bölgede sıradaki (henüz bitmemiş ilk) görev
  siradakiler() {
    return [1, 2, 3, 4].map((b) => this.bolgeGorevleri(b).find((q) => !this.bitti(q))).filter(Boolean);
  }
  hepsiBitti() {
    return this.gorevler.every((q) => this.bitti(q));
  }

  baglam(q) {
    return {
      karar: (soru, secim, dogru) => this.karar(q, soru, secim, dogru),
      tamamla: () => this.tamamla(q),
      insaBaslat: () => this.insaBaslat(q),
    };
  }

  // ---------- Konuşma yönlendirme ----------
  diyalogBul(k) {
    if (k.kimlik === 'dede') return this.dedeDiyalogu(k);
    const siradaki = this.siradakiler();
    for (const q of siradaki) {
      if (this.insaEdiliyor(q) && q.hedefler.includes(k.kimlik)) {
        this.malzemeVer(q); // bloklar bittiyse yeniden verilir
        return { baslangic: 'a', dugumler: { a: { metin: q.insa.hatirlatma } } };
      }
      if (q.okunacak && q.okunacak.includes(k.kimlik)) return this.bilgiDiyalogu(k, q);
      const d = q.diyalog && q.diyalog(k, this.baglam(q));
      if (d) return d;
    }
    // Biten görevlerden bu karakterin son sözü (en son biten önce)
    for (const kimlik of [...this.kayit.biten].reverse()) {
      const q = this.gorevler.find((g) => g.kimlik === kimlik);
      const soz = q && q.sonSoz && q.sonSoz[k.kimlik];
      if (soz) return { baslangic: 'a', dugumler: { a: { metin: soz } } };
    }
    return k.diyalog;
  }

  dedeDiyalogu(k) {
    const d = { baslangic: k.diyalog.baslangic, dugumler: { ...k.diyalog.dugumler } };
    if (this.kayit.dede) d.baslangic = 'menu';
    d.dugumler.menu = {
      ...d.dugumler.menu,
      giris: () => {
        if (this.kayit.dede) return;
        this.kayit.dede = true;
        this.kaydet();
        this.yenile();
      },
    };
    if (this.kayit.anit) {
      d.baslangic = 'bitti';
      d.dugumler.bitti = {
        metin: [
          'Değerler Anıtı yükseldi, köyümüz yeniden rengârenk!',
          'Doğruluğu, merhameti, adabı ve vatan sevgisini kalbinde taşıdıkça renklerimiz hiç solmayacak.',
          'Artık sen bir Kalbin Kahramanısın, {ad}!',
        ],
      };
    } else if (this.hepsiBitti()) {
      d.baslangic = 'bitti';
      d.dugumler.bitti = {
        metin: [
          'Maşallah {ad}! Dört bölgeyi de yeniden renklendirdin.',
          'Çantandaki dört değer bloğunu meydandaki Anıt Alanı\'na yerleştir; Değerler Anıtı yükselsin!',
        ],
      };
    }
    return d;
  }

  bilgiDiyalogu(k, q) {
    const asil = k.diyalog.dugumler.a;
    return {
      baslangic: 'a',
      dugumler: { a: { ...asil, git: 'son' }, son: { konusan: asil.konusan, metin: 'Bu bilgiyi aklında tut; Selim Öğretmen sorabilir!', giris: () => this.okundu(q, k.kimlik) } },
    };
  }

  okundu(q, kimlik) {
    if (!this.kayit.okunan.includes(kimlik)) this.kayit.okunan.push(kimlik);
    if (q.okunacak.every((o) => this.kayit.okunan.includes(o))) this.tamamla(q);
    else {
      this.kaydet();
      this.yenile();
    }
  }

  // ---------- Kararlar ve puan ----------
  karar(q, soru, secim, dogru) {
    const onceki = this.kayit.kararlar.filter((k) => k.soru === soru).length;
    this.kayit.kararlar.push({ gorev: q.kimlik, soru, secim, dogru, deneme: onceki + 1, zaman: Date.now() });
    if (dogru && !this.kayit.sorular.includes(soru)) {
      this.kayit.sorular.push(soru);
      this.kayit.puan[q.bolge] += KARAR_PUANI;
    }
    this.kaydet();
    this.panelCiz();
  }

  // ---------- İnşa adımı ----------
  insaBaslat(q) {
    if (this.bitti(q) || this.insaEdiliyor(q)) return;
    this.kayit.insa.push(q.kimlik);
    this.malzemeVer(q);
    this.kaydet();
    this.yenile();
  }

  hedefDolu(q, h) {
    const id = this.dunya.al(h[0], h[1], h[2]);
    return h[3] ? id === h[3] : katiMi(id);
  }

  // Eksik hedefler için gereken blokları çantaya koyar
  malzemeVer(q) {
    const gerek = new Map();
    for (const h of q.insa.hedefler) {
      if (this.hedefDolu(q, h)) continue;
      const id = h[3] || q.insa.varsayilan;
      gerek.set(id, (gerek.get(id) || 0) + 1);
    }
    for (const [id, adet] of gerek) {
      const eksik = adet - this.envanter.adet(id);
      if (eksik > 0) this.envanter.zorlaEkle(id, eksik);
    }
  }

  insaKontrol() {
    let degisti = false;
    for (const q of this.gorevler) {
      if (!this.insaEdiliyor(q)) continue;
      degisti = true;
      if (q.insa.hedefler.every((h) => this.hedefDolu(q, h))) {
        this.mesaj(q.insa.bitis, 6000);
        this.tamamla(q);
      }
    }
    if (degisti) this.yenile();
  }

  // Görev bloğu işaretli yerin yakınına konmak istenirse, en alttaki boş işaretli yere oturtur
  yerDuzelt(x, y, z, id) {
    if (BLOKLAR[id].deger) {
      // Değer bloğu meydanın ortasına doğru konursa anıttaki sıradaki boş yere oturur
      if (Math.hypot(x - 64, z - 64) > 7) return null;
      const bos = ANIT_YERLERI.find(([ax, ay, az]) => !katiMi(this.dunya.al(ax, ay, az)));
      return bos || null;
    }
    if (!BLOKLAR[id].gorevBlogu) return null;
    let en = null;
    for (const q of this.gorevler) {
      if (!this.insaEdiliyor(q)) continue;
      for (const h of q.insa.hedefler) {
        if (h[3] !== id || this.hedefDolu(q, h)) continue;
        if (Math.hypot(h[0] - x, h[2] - z) > 3 || Math.abs(h[1] - y) > 5) continue;
        if (!en || h[1] < en[1]) en = h;
      }
    }
    return en ? [en[0], en[1], en[2]] : null;
  }

  yerlestirmeKontrol(x, y, z, id) {
    let hedef = null;
    for (const q of this.gorevler) {
      if (!this.insaEdiliyor(q)) continue;
      const h = q.insa.hedefler.find((t) => t[0] === x && t[1] === y && t[2] === z);
      if (h) hedef = h;
    }
    if (hedef && hedef[3] && hedef[3] !== id) return `Buraya ${BLOKLAR[hedef[3]].ad.toLocaleLowerCase('tr')} konmalı.`;
    if (BLOKLAR[id].gorevBlogu && !(hedef && hedef[3] === id)) return `${BLOKLAR[id].ad} yalnızca işaretli yere konabilir.`;
    if (BLOKLAR[id].deger && !anitAlanindaMi(x, y, z)) return 'Değer blokları yalnızca meydandaki Anıt Alanı\'na, beyaz mermerin üstüne konabilir.';
    return null;
  }

  // ---------- Tamamlama ----------
  tamamla(q) {
    if (this.bitti(q)) return;
    this.kayit.biten.push(q.kimlik);
    this.kayit.insa = this.kayit.insa.filter((k) => k !== q.kimlik);
    this.kayit.puan[q.bolge] += GOREV_PUANI;
    this.dunyaEtkisi(q);
    if (q.insa) {
      // Artan görev blokları çantadan alınır
      for (const h of q.insa.hedefler) if (h[3] && BLOKLAR[h[3]].gorevBlogu) this.envanter.cikar(h[3]);
    }
    this.bildirimKuyrugu.push(`Görev tamamlandı: ${q.ad}`);
    if (q.bitis) this.mesaj(q.bitis, 6000);
    if (this.bolgeBitti(q.bolge)) {
      this.renklendir(q.bolge, false);
      const blok = DEGER_BLOKLARI[q.bolge - 1];
      this.envanter.ekle(blok, 1);
      this.bildirimKuyrugu.push(`${BOLGE_ADLARI[q.bolge]} renklendi! ${BLOKLAR[blok].ad} kazandın.`);
    }
    if (this.hepsiBitti()) this.bildirimKuyrugu.push('Bütün görevler tamam! Değer bloklarını meydandaki Anıt Alanı\'na yerleştir.');
    this.kaydet();
    this.yenile();
    this.siradakiBildirim();
  }

  siradakiBildirim() {
    if (this.bildirimSuruyor || !this.bildirimKuyrugu.length) return;
    this.bildirimSuruyor = true;
    this.bildir(this.bildirimKuyrugu.shift(), 3200);
    setTimeout(() => {
      this.bildirimSuruyor = false;
      this.siradakiBildirim();
    }, 3500);
  }

  // Görevin dünyada bıraktığı kalıcı iz (kayıt yüklenince de uygulanır)
  dunyaEtkisi(q) {
    const liste = [];
    if (q.insa) {
      for (const h of q.insa.hedefler) {
        if (!this.hedefDolu(q, h)) liste.push([h[0], h[1], h[2], h[3] || q.insa.varsayilan]);
        if (q.insa.koru) this.dunya.koru(h[0], h[1], h[2], q.insa.koru);
      }
    }
    if (q.kimlik === 'a1') for (const [x, y, z] of KONAK_KAPISI) liste.push([x, y, z, 0]);
    if (q.kimlik === 'v3') liste.push(...bayrakBloklari());
    if (liste.length) this.dunya.topluDegistir(liste);
  }

  // ---------- Değerler Anıtı ----------
  degerBloguEldeMi() {
    return DEGER_BLOKLARI.some((id) => this.envanter.adet(id) > 0);
  }

  // Anıt Alanı'na konmuş farklı değer bloklarını sayar; dördü de varsa anıt tamamlanır
  anitKontrol(sessiz = false) {
    const bulunan = new Map();
    for (let y = ANIT.y0; y <= ANIT.y1; y++)
      for (let z = ANIT.z0; z <= ANIT.z1; z++)
        for (let x = ANIT.x0; x <= ANIT.x1; x++) {
          const id = this.dunya.al(x, y, z);
          if (BLOKLAR[id].deger && !bulunan.has(id)) bulunan.set(id, [x, y, z]);
        }
    const onceki = this.anitSayisi;
    this.anitSayisi = bulunan.size;
    if (this.kayit.anit || bulunan.size === 4) {
      for (const [x, y, z] of bulunan.values()) this.dunya.koru(x, y, z, 'Değerler Anıtı köyün emanetidir; yerinde kalmalı.');
    }
    if (bulunan.size === 4 && !this.kayit.anit) {
      this.kayit.anit = true;
      this.kayit.bitisZamani = Date.now();
      this.renklendir(0, sessiz);
      if (!sessiz) {
        const ad = this.kayit.ad ? `, ${this.kayit.ad}` : '';
        this.bildirimKuyrugu.push('Değerler Anıtı tamamlandı!', 'Köy yeniden rengârenk!', `Artık sen bir Kalbin Kahramanısın${ad}!`);
        this.siradakiBildirim();
      }
      this.kaydet();
      this.yenile();
    } else if (!sessiz && onceki !== this.anitSayisi) {
      this.yenile();
    }
  }

  // ---------- Kayıt ----------
  konumKaydet(oyuncu) {
    const p = oyuncu.konum;
    this.kayit.konum = [+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2), +oyuncu.yon.toFixed(2)];
    this.kaydet();
  }

  adKoy(ad) {
    this.kayit.ad = ad;
    this.kaydet();
  }

  kaydet() {
    if (this.yukleniyor) return;
    this.kayit.canta = this.envanter.disaAktar();
    try {
      localStorage.setItem(KAYIT_ANAHTARI, JSON.stringify(this.kayit));
    } catch {
      /* kayıt kullanılamıyorsa oyun yine de sürer */
    }
  }

  yukle() {
    this.yukleniyor = true;
    try {
      const veri = JSON.parse(localStorage.getItem(KAYIT_ANAHTARI) || 'null');
      if (veri && Array.isArray(veri.biten)) this.kayit = { ...this.kayit, ...veri };
    } catch {
      /* bozuk kayıt: baştan başlanır */
    }
    // Oyuncunun kırdığı / koyduğu bloklar
    const duzen = Object.entries(this.kayit.dunya || {}).map(([k, id]) => [...k.split(',').map(Number), id]);
    if (duzen.length) this.dunya.topluDegistir(duzen);
    const cantaYuklendi = this.envanter.yukle(this.kayit.canta);
    for (const q of this.gorevler) {
      if (this.bitti(q)) this.dunyaEtkisi(q);
      else if (this.insaEdiliyor(q)) this.malzemeVer(q);
    }
    for (const b of [1, 2, 3, 4]) {
      if (!this.bolgeBitti(b)) continue;
      this.renklendir(b, true);
      if (!cantaYuklendi) this.envanter.ekle(DEGER_BLOKLARI[b - 1], 1);
    }
    if (this.kayit.anit) this.renklendir(0, true);
    this.yukleniyor = false;
  }

  kayitVarMi() {
    return !!this.kayit.ad || this.kayit.dede || this.kayit.biten.length > 0 || this.kayit.kararlar.length > 0 || Object.keys(this.kayit.dunya).length > 0;
  }

  sifirla() {
    try {
      localStorage.removeItem(KAYIT_ANAHTARI);
    } catch {
      /* yok say */
    }
  }

  // ---------- Yön işaretleri, hayalet bloklar, panel ----------
  yenile() {
    this.isaretleriKur();
    this.hayaletleriKur();
    this.panelCiz();
    if (this.degisince) this.degisince();
  }

  isaretleriKur() {
    const noktalar = [];
    this._eldeVardi = this.degerBloguEldeMi();
    if (this._eldeVardi && !this.kayit.anit) noktalar.push({ x: 64.5, y: ZEMIN + 2, z: 64.5, boy: 1.2, bolge: 0 });
    if (this.kayit.anit) {
      /* oyun bitti: işaret yok */
    } else if (!this.kayit.dede) {
      const d = this.karakterler.bul('dede');
      noktalar.push({ x: d.x, y: d.y, z: d.z, boy: d.boy, bolge: 0 });
    } else if (!this.hepsiBitti()) {
      for (const q of this.siradakiler()) {
        if (this.insaEdiliyor(q)) {
          noktalar.push({ ...q.insa.merkez, boy: 1.6, bolge: q.bolge });
          continue;
        }
        for (const kimlik of q.hedefler) {
          if (q.okunacak && this.kayit.okunan.includes(kimlik)) continue;
          const k = this.karakterler.bul(kimlik);
          if (k) noktalar.push({ x: k.x, y: k.y, z: k.z, boy: k.boy, bolge: q.bolge });
        }
      }
    }
    this.isaretler = noktalar;

    for (const c of [...this.isaretGrubu.children]) {
      this.isaretGrubu.remove(c);
      c.geometry.dispose();
      c.material.dispose();
    }
    for (const n of noktalar) {
      const renk = BOLGE_RENKLERI[n.bolge];
      // Uzaktan görünen ışık sütunu
      const sutun = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 34, 0.45),
        new THREE.MeshBasicMaterial({ color: renk, transparent: true, opacity: 0.4, depthWrite: false, fog: false })
      );
      sutun.position.set(n.x, n.y + n.boy + 1.5 + 17, n.z);
      // Hedefin üstünde dönen elmas
      const elmas = new THREE.Mesh(new THREE.OctahedronGeometry(0.24), new THREE.MeshBasicMaterial({ color: renk, fog: false }));
      elmas.position.set(n.x, n.y + n.boy + 1.0, n.z);
      elmas.userData.elmas = n.y + n.boy + 1.0;
      this.isaretGrubu.add(sutun, elmas);
    }
  }

  hayaletleriKur() {
    for (const c of [...this.hayaletGrubu.children]) {
      this.hayaletGrubu.remove(c);
      c.geometry.dispose();
      c.material.dispose();
    }
    const hedefler = [];
    for (const q of this.gorevler) {
      if (!this.insaEdiliyor(q)) continue;
      for (const h of q.insa.hedefler) {
        if (!this.hedefDolu(q, h)) hedefler.push([h[0], h[1], h[2], BLOKLAR[h[3] || q.insa.varsayilan].renk]);
      }
    }
    if (this.degerBloguEldeMi() && !this.kayit.anit) {
      for (const [x, y, z] of ANIT_YERLERI) if (!katiMi(this.dunya.al(x, y, z))) hedefler.push([x, y, z, BOLGE_RENKLERI[0]]);
    }
    for (const h of hedefler) {
      const dolgu = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.9, 0.9),
        new THREE.MeshBasicMaterial({ color: h[3], transparent: true, opacity: 0.35, depthWrite: false })
      );
      const cizgi = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(0.98, 0.98, 0.98)),
        new THREE.LineBasicMaterial({ color: 0xfff27a })
      );
      dolgu.position.set(h[0] + 0.5, h[1] + 0.5, h[2] + 0.5);
      cizgi.position.copy(dolgu.position);
      this.hayaletGrubu.add(dolgu, cizgi);
    }
  }

  guncelle(zaman) {
    for (const c of this.isaretGrubu.children) {
      if (c.userData.elmas === undefined) continue;
      c.position.y = c.userData.elmas + Math.sin(zaman * 3) * 0.12;
      c.rotation.y = zaman * 2;
    }
    const nabiz = 0.25 + 0.15 * Math.sin(zaman * 4);
    for (const c of this.hayaletGrubu.children) if (c.isMesh) c.material.opacity = nabiz;
  }

  yonerge() {
    if (this.kayit.anit) return '<b>Tebrikler, Kalbin Kahramanı!</b> Değerler Anıtı tamamlandı, köy yeniden rengârenk. Dede ile konuşabilirsin.';
    if (!this.kayit.dede) return 'Meydandaki <b>Dede</b> ile konuş. Sarı ışığı takip et.';
    if (this.hepsiBitti()) return 'Bütün görevler tamam! Dört değer bloğunu meydandaki <b>Anıt Alanı</b>\'na yerleştir.';
    const insa = this.gorevler.find((q) => this.insaEdiliyor(q));
    if (insa) {
      const t = insa.insa.hedefler.length;
      const n = insa.insa.hedefler.filter((h) => this.hedefDolu(insa, h)).length;
      return `<b>${insa.insa.adim(n, t)}</b><br>Bloğu çantandan seç, sarı çerçeveli yere yerleştir.`;
    }
    return 'Bir bölge seç. Haritadaki renkli noktaya, köydeki <b>ışık sütununa</b> git ve oradaki kişiyle konuş.';
  }

  panelCiz() {
    let h = `<div class="g-baslik">Görevler</div><div class="g-yonerge">${this.yonerge()}</div>`;
    for (const b of [1, 2, 3, 4]) {
      const gorevler = this.bolgeGorevleri(b);
      const biten = gorevler.filter((q) => this.bitti(q)).length;
      const q = gorevler.find((g) => !this.bitti(g));
      const renk = '#' + BOLGE_RENKLERI[b].toString(16).padStart(6, '0');
      let alt = '✓ Tamamlandı';
      if (q) {
        alt = `${q.ad}: ${q.yonerge}`;
        if (q.okunacak) {
          const n = q.okunacak.filter((o) => this.kayit.okunan.includes(o)).length;
          alt = `${q.ad}: ${q.adim(n, q.okunacak.length)}`;
        }
      }
      h += `<div class="g-satir${q ? '' : ' bitti'}">
        <div class="g-ust"><span class="g-nokta" style="background:${renk}"></span>
          <span class="g-bolge">${BOLGE_ADLARI[b]} <small>(${BOLGE_YONLERI[b]})</small></span>
          <span class="g-sayi">${biten}/3 · ${this.kayit.puan[b]} puan</span></div>
        <div class="g-cubuk"><i style="width:${(biten / 3) * 100}%;background:${renk}"></i></div>
        <div class="g-alt">${alt}</div>
      </div>`;
    }
    const anitRenk = '#' + BOLGE_RENKLERI[0].toString(16).padStart(6, '0');
    const anitAlt = this.kayit.anit
      ? '✓ Tamamlandı'
      : this.degerBloguEldeMi()
        ? 'Değer bloğunu çantandan seç (1-4), meydandaki sarı çerçeveli yere yerleştir.'
        : 'Her bölgeyi bitirince bir değer bloğu kazanırsın; dördünü Anıt Alanı\'na yerleştir.';
    h += `<div class="g-satir${this.kayit.anit ? ' bitti' : ''}">
      <div class="g-ust"><span class="g-nokta" style="background:${anitRenk}"></span>
        <span class="g-bolge">Değerler Anıtı <small>(meydan)</small></span>
        <span class="g-sayi">${this.anitSayisi}/4</span></div>
      <div class="g-cubuk"><i style="width:${(this.anitSayisi / 4) * 100}%;background:${anitRenk}"></i></div>
      <div class="g-alt">${anitAlt}</div>
    </div>`;
    this.panel.innerHTML = h;
  }
}
