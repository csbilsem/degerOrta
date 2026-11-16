import * as THREE from '../vendor/three.module.min.js';
import { BOLGE_ADLARI } from './world.js';
import { koyuOlustur } from './worldgen.js';
import { Player } from './player.js';
import { B } from './blocks.js';
import { Envanter, Etkilesim } from './interact.js';
import { Karakterler } from './npc.js';
import { Diyalog } from './dialog.js';
import { KARAKTERLER } from './data/karakterler.js';
import { Gorevler } from './quests.js';
import { Harita } from './minimap.js';
import { Ses } from './audio.js';
import { sonEkraniDoldur, ozetiDoldur, csvUret } from './endscreen.js';
import { BOLGE_RENKLERI } from './quests.js';

const $ = (id) => document.getElementById(id);
const tuval = $('oyun');

const cizici = new THREE.WebGLRenderer({ canvas: tuval, antialias: true });
cizici.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const sahne = new THREE.Scene();
const GRI_GOK = new THREE.Color(0xb4b9bf);
const MAVI_GOK = new THREE.Color(0x8ecdf2);
sahne.background = GRI_GOK.clone();
sahne.fog = new THREE.Fog(sahne.background, 45, 120);
sahne.add(new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 2.2));

const kamera = new THREE.PerspectiveCamera(72, 1, 0.1, 150);

const dunya = koyuOlustur();
dunya.tumunuOr();
sahne.add(dunya.grup);

const oyuncu = new Player(dunya, kamera);
const b = dunya.baslangic;
oyuncu.isinla(b.x, b.y, b.z, b.yon);
sahne.add(oyuncu.avatar);

// ---------- Envanter ve blok etkileşimi ----------
let mesajZamanlayici = 0;
function mesajGoster(metin, sure = 3200) {
  const kutu = $('mesaj');
  kutu.textContent = metin;
  kutu.classList.add('gorunur');
  clearTimeout(mesajZamanlayici);
  mesajZamanlayici = setTimeout(() => kutu.classList.remove('gorunur'), sure);
}
const envanter = new Envanter($('envanter'), $('secili-ad'));
envanter.ekle(B.TAHTA, 12); // başlangıç malzemesi
envanter.ekle(B.TAS, 12);
const ses = new Ses();
const sesCal = (ad, gecikme) => ses.cal(ad, gecikme);
const etkilesim = new Etkilesim(dunya, oyuncu, envanter, mesajGoster);
etkilesim.ses = sesCal;
sahne.add(etkilesim.cerceve);

// ---------- Karakterler ve konuşma ----------
const karakterler = new Karakterler(dunya, KARAKTERLER);
sahne.add(karakterler.grup);
const diyalog = new Diyalog($('diyalog'));
diyalog.ses = sesCal;
let yakinKarakter = null;
let konusulan = null;
diyalog.kapaninca = () => {
  konusulan = null;
  $('hud').classList.remove('konusuyor');
  document.body.classList.remove('konusuyor');
};
function konus() {
  if (diyalog.acik) return diyalog.ilerle();
  if (!yakinKarakter) return;
  konusulan = yakinKarakter;
  oyuncu.tuslar.clear();
  oyuncu.analog.x = oyuncu.analog.y = 0;
  $('hud').classList.add('konusuyor');
  document.body.classList.add('konusuyor');
  diyalog.baslat(konusulan, gorevler.diyalogBul(konusulan));
}

// ---------- Bloklu bulutlar ----------
const bulutlar = new THREE.Group();
{
  const malzeme = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, fog: false });
  let s = 7;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 22; i++) {
    const bulut = new THREE.Group();
    const parca = 2 + Math.floor(r() * 3);
    for (let j = 0; j < parca; j++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(8 + r() * 10, 2, 6 + r() * 8), malzeme);
      m.position.set(j * 6 - 6 + r() * 3, r() * 1.5, r() * 6 - 3);
      bulut.add(m);
    }
    bulut.position.set(r() * 360 - 116, 52 + r() * 10, r() * 360 - 116);
    bulutlar.add(bulut);
  }
}
sahne.add(bulutlar);

// ---------- Bölge renklenmesi ----------
// hedefDoygunluk: her bölgenin ulaşmak istediği renk miktarı (0.12 = gri, 1 = tam renk)
const hedefDoygunluk = [0.12, 0.12, 0.12, 0.12, 0.12];
const BOLGE_MERKEZLERI = [[64, 64], [98, 64], [30, 64], [64, 98], [64, 26]];
let dalga = null; // yayılmakta olan renk dalgası { no, r }
let gokOrani = 0;

// Bir bölgeyi renklendirir. aninda değilse renk, bölgenin merkezinden dalga gibi yayılır.
function bolgeyiRenklendir(no, aninda = false) {
  if (aninda) {
    hedefDoygunluk[no] = 1;
    dunya.doygunluk.value[no] = 1;
    if (harita) harita.tabanCiz(hedefDoygunluk);
    return;
  }
  if (dalga) dalgayiBitir();
  dalga = { no, r: 0 };
  dunya.dalga.value.set(BOLGE_MERKEZLERI[no][0], BOLGE_MERKEZLERI[no][1], 0, no);
}
function dalgayiBitir() {
  hedefDoygunluk[dalga.no] = 1;
  dunya.doygunluk.value[dalga.no] = 1;
  dunya.dalga.value.set(0, 0, -1, -1);
  dalga = null;
  if (harita) harita.tabanCiz(hedefDoygunluk);
}

// ---------- Konfeti ----------
const KONFETI_ADET = 420;
const konfeti = {
  konum: new Float32Array(KONFETI_ADET * 3).fill(-200),
  renk: new Float32Array(KONFETI_ADET * 3),
  hiz: new Float32Array(KONFETI_ADET * 3),
  omur: new Float32Array(KONFETI_ADET),
  sira: 0,
};
const konfetiGeo = new THREE.BufferGeometry();
konfetiGeo.setAttribute('position', new THREE.BufferAttribute(konfeti.konum, 3));
konfetiGeo.setAttribute('color', new THREE.BufferAttribute(konfeti.renk, 3));
const konfetiNoktalar = new THREE.Points(
  konfetiGeo,
  new THREE.PointsMaterial({ size: 0.2, vertexColors: true, fog: false })
);
konfetiNoktalar.frustumCulled = false;
sahne.add(konfetiNoktalar);
function konfetiPatlat(x, y, z, renkler, adet = 140, guc = 7) {
  const c = new THREE.Color();
  for (let n = 0; n < adet; n++) {
    const i = konfeti.sira;
    konfeti.sira = (konfeti.sira + 1) % KONFETI_ADET;
    const aci = Math.random() * Math.PI * 2;
    const yatay = Math.random() * guc * 0.6;
    konfeti.konum.set([x, y, z], i * 3);
    konfeti.hiz.set([Math.cos(aci) * yatay, guc * (0.5 + Math.random() * 0.7), Math.sin(aci) * yatay], i * 3);
    c.setHex(renkler[n % renkler.length]);
    konfeti.renk.set([c.r, c.g, c.b], i * 3);
    konfeti.omur[i] = 2.2 + Math.random() * 1.6;
  }
  konfetiGeo.attributes.color.needsUpdate = true;
}
function konfetiGuncelle(dt) {
  let canli = false;
  for (let i = 0; i < KONFETI_ADET; i++) {
    if (konfeti.omur[i] <= 0) continue;
    canli = true;
    konfeti.omur[i] -= dt;
    const j = i * 3;
    if (konfeti.omur[i] <= 0) {
      konfeti.konum[j + 1] = -200;
      continue;
    }
    konfeti.hiz[j + 1] -= 9 * dt;
    konfeti.konum[j] += konfeti.hiz[j] * dt;
    konfeti.konum[j + 1] += konfeti.hiz[j + 1] * dt;
    konfeti.konum[j + 2] += konfeti.hiz[j + 2] * dt;
  }
  if (canli || konfeti.kirli) konfetiGeo.attributes.position.needsUpdate = true;
  konfeti.kirli = canli;
}
// Bölge ya da anıt tamamlanınca kutlama
function kutla(tur, bolge) {
  if (tur === 'bolge') {
    const p = oyuncu.konum;
    const yon = oyuncu.bakisYonu();
    konfetiPatlat(p.x + yon.x * 7, p.y + 2.5, p.z + yon.z * 7, [BOLGE_RENKLERI[bolge], 0xffffff, 0xf0b429], 160, 8);
  } else {
    const renkler = [BOLGE_RENKLERI[1], BOLGE_RENKLERI[2], BOLGE_RENKLERI[3], BOLGE_RENKLERI[4], 0xf0b429, 0xffffff];
    for (let i = 0; i < 5; i++) {
      setTimeout(() => konfetiPatlat(64.5 + (Math.random() - 0.5) * 6, 15, 64.5 + (Math.random() - 0.5) * 6, renkler, 120, 9), i * 700);
    }
    setTimeout(sonEkraniAc, 11000);
  }
}

// ---------- Bildirim şeridi (bölge adı, görev tamamlandı) ----------
let bildirimZamanlayici = 0;
function bildir(metin, sure = 2600) {
  const kutu = $('bolge-bildirim');
  kutu.textContent = metin;
  kutu.classList.add('gorunur');
  clearTimeout(bildirimZamanlayici);
  bildirimZamanlayici = setTimeout(() => kutu.classList.remove('gorunur'), sure);
}

// ---------- Görevler ve harita ----------
let harita = null;
const gorevler = new Gorevler({
  dunya,
  karakterler,
  envanter,
  etkilesim,
  sahne,
  mesaj: mesajGoster,
  bildir,
  renklendir: (no, aninda) => bolgeyiRenklendir(no, aninda),
  ses: sesCal,
  kutla,
  panel: $('gorev-paneli'),
});
harita = new Harita($('harita'), dunya);
harita.tabanCiz(hedefDoygunluk);
function haritaGorunumu(degistir = true) {
  const g = degistir ? harita.gorunumDegistir() : harita.gorunum || 0;
  $('harita-ipucu').textContent =
    ['Bütün köy', 'Yakın görünüm', 'Büyük harita'][g] + (dokunmatik ? ' · dokun: değiştir' : ' · M: değiştir');
}
$('harita').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  e.stopPropagation();
  haritaGorunumu();
});

// Kaldığı yerden devam: son konum ve oyuncu adı
if (gorevler.kayit.konum) {
  const [kx, ky, kz, kyon] = gorevler.kayit.konum;
  if (!dunya.kati(kx, ky, kz) && !dunya.kati(kx, ky + 1, kz)) oyuncu.isinla(kx, ky, kz, kyon);
}
setInterval(() => {
  if (oynuyor) gorevler.konumKaydet(oyuncu);
}, 3000);
const adKutusu = $('oyuncu-adi');
adKutusu.value = gorevler.kayit.ad || '';
function adiUygula() {
  const ad = adKutusu.value.trim().replace(/[<>{}]/g, '').slice(0, 14);
  if (ad !== gorevler.kayit.ad) gorevler.adKoy(ad);
  diyalog.oyuncuAdi = ad;
  document.querySelector('.oyun-adi').textContent = ad ? `Kalbin Kahramanları · ${ad}` : 'Kalbin Kahramanları';
}
adiUygula();
adKutusu.addEventListener('keydown', (e) => {
  e.stopPropagation();
  if (e.code === 'Enter') baslat();
});
$('sifirla').classList.toggle('gizli', !gorevler.kayitVarMi());
if (gorevler.kayitVarMi()) $('basla').textContent = 'Kaldığın Yerden Devam Et';
$('sifirla').addEventListener('click', () => {
  bastanBasla();
});
function bastanBasla() {
  if (!window.confirm('Bütün ilerlemen silinecek ve oyun baştan başlayacak. Emin misin?')) return;
  gorevler.sifirla();
  window.location.reload();
}

// ---------- Son ekran, öğretmen özeti, ses ayarları ----------
let katman = 'giris'; // oyun dururken gösterilen ekran: giris | son | ozet
let ozetOncesi = 'giris';
function sonEkraniAc() {
  if (diyalog.acik) return setTimeout(sonEkraniAc, 2500);
  sonEkraniDoldur($('son'), gorevler);
  katman = 'son';
  if (document.pointerLockElement === tuval) document.exitPointerLock();
  else duraklat();
}
function ozetiAc() {
  ozetOncesi = katman === 'ozet' ? ozetOncesi : katman;
  ozetiDoldur($('ozet'), gorevler);
  katman = 'ozet';
  arayuzuGuncelle();
}
$('son-devam').addEventListener('click', () => {
  katman = 'giris';
  baslat();
});
$('son-ozet').addEventListener('click', ozetiAc);
$('son-sifirla').addEventListener('click', bastanBasla);
$('ozet-ac').addEventListener('click', ozetiAc);
$('son-ac').addEventListener('click', sonEkraniAc);
$('ozet-kapat').addEventListener('click', () => {
  katman = ozetOncesi;
  arayuzuGuncelle();
});
$('ozet-yazdir').addEventListener('click', () => window.print());
$('ozet-indir').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csvUret(gorevler)], { type: 'text/csv;charset=utf-8' }));
  a.download = 'kalbin-kahramanlari-kararlar.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});
function sesDugmeleri() {
  $('ses-muzik').textContent = `Müzik: ${ses.ayar.muzik ? 'Açık' : 'Kapalı'}`;
  $('ses-efekt').textContent = `Sesler: ${ses.ayar.efekt ? 'Açık' : 'Kapalı'}`;
  $('ses-muzik').classList.toggle('kapali', !ses.ayar.muzik);
  $('ses-efekt').classList.toggle('kapali', !ses.ayar.efekt);
}
$('ses-muzik').addEventListener('click', () => {
  ses.baslat();
  ses.ayarla('muzik', !ses.ayar.muzik);
  sesDugmeleri();
});
$('ses-efekt').addEventListener('click', () => {
  ses.baslat();
  ses.ayarla('efekt', !ses.ayar.efekt);
  sesDugmeleri();
  ses.cal('dogru');
});
sesDugmeleri();

// ---------- Oyun durumu ve girdiler ----------
let oynuyor = false;
let surukleModu = false; // fare kilidi kullanılamıyorsa: basılı tutup sürükleyerek bakılır
let hataAyiklama = false;

// Dokunmatik cihazlarda (iPad, telefon) fare kilidi yoktur; ekran kumandaları kullanılır.
// Kumandalar, birincil işaretçi parmaksa baştan, değilse ilk dokunuşta açılır.
let dokunmatik = false;
function dokunmatikAc() {
  if (dokunmatik) return;
  dokunmatik = true;
  document.body.classList.add('dokunmatik');
  document.querySelector('.dokunmatik-yardim').classList.remove('gizli');
  document.querySelector('.klavye-yardim').classList.add('gizli');
  if (oynuyor) arayuzuGuncelle();
}
window.addEventListener('touchstart', dokunmatikAc, { capture: true, passive: true });

function baslat() {
  adiUygula();
  adKutusu.blur();
  ses.baslat();
  katman = 'giris';
  if (dokunmatik || !tuval.requestPointerLock) return surukleModunaGec();
  try {
    const istek = tuval.requestPointerLock();
    if (istek && istek.catch) istek.catch(surukleModunaGec);
  } catch {
    surukleModunaGec();
  }
  // Bazı tarayıcılar fare kilidini sessizce yok sayar; o zaman da oyun başlasın.
  setTimeout(() => {
    if (!oynuyor) surukleModunaGec();
  }, 700);
}
function duraklat() {
  oynuyor = false;
  surukleModu = false;
  oyuncu.analog.x = oyuncu.analog.y = 0;
  arayuzuGuncelle();
}
function surukleModunaGec() {
  surukleModu = true;
  oynuyor = true;
  oynandi = true;
  arayuzuGuncelle();
}
function arayuzuGuncelle() {
  for (const ad of ['giris', 'son', 'ozet']) $(ad).classList.toggle('gizli', oynuyor || katman !== ad);
  $('son-ac').classList.toggle('gizli', !gorevler.kayit.anit);
  $('hud').classList.toggle('gizli', !oynuyor);
  $('dokunmatik').classList.toggle('gizli', !(oynuyor && dokunmatik));
  $('surukle-ipucu').classList.toggle('gizli', !surukleModu);
  if (harita) haritaGorunumu(false);
  if (!oynuyor) {
    oyuncu.tuslar.clear();
    $('basla').textContent = oynandi ? 'Devam Et' : gorevler.kayitVarMi() ? 'Kaldığın Yerden Devam Et' : 'Oyuna Başla';
    $('sifirla').classList.toggle('gizli', !gorevler.kayitVarMi());
  }
}
let oynandi = false;
if (!tuval.requestPointerLock || window.matchMedia('(pointer: coarse)').matches) dokunmatikAc();

$('basla').addEventListener('click', baslat);
window.kalbinKahramanlariHazir = true;
document.addEventListener('pointerlockchange', () => {
  const kilitli = document.pointerLockElement === tuval;
  if (kilitli) {
    surukleModu = false;
    oynuyor = true;
    oynandi = true;
  } else if (!surukleModu) {
    oynuyor = false;
  }
  arayuzuGuncelle();
});
document.addEventListener('pointerlockerror', surukleModunaGec);

document.addEventListener('mousemove', (e) => {
  if (!oynuyor) return;
  if (diyalog.acik) return;
  if (document.pointerLockElement === tuval || (surukleModu && e.buttons & 1)) {
    oyuncu.bak(e.movementX, e.movementY);
  }
});
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Sol tık kırar, sağ tık yerleştirir. Sürükleme modunda sol tuş bakmak için de
// kullanıldığından, kırma ancak fare neredeyse hiç kaymadan bırakılırsa yapılır.
let basisX = 0;
let basisY = 0;
document.addEventListener('mousedown', (e) => {
  if (!oynuyor || e.target !== tuval) return;
  const kilitli = document.pointerLockElement === tuval;
  if (diyalog.acik) {
    if (e.button === 0) diyalog.ilerle();
    return;
  }
  if (e.button === 2) etkilesim.yerlestir();
  else if (e.button === 0) {
    if (kilitli) etkilesim.kir();
    else {
      basisX = e.clientX;
      basisY = e.clientY;
    }
  }
});
document.addEventListener('mouseup', (e) => {
  if (!oynuyor || !surukleModu || e.button !== 0 || e.target !== tuval || diyalog.acik) return;
  if (Math.hypot(e.clientX - basisX, e.clientY - basisY) < 5) etkilesim.kir();
});
document.addEventListener(
  'wheel',
  (e) => {
    if (!oynuyor) return;
    if (diyalog.acik) diyalog.secimiKaydir(Math.sign(e.deltaY));
    else envanter.sec(envanter.secili + Math.sign(e.deltaY));
  },
  { passive: true }
);

document.addEventListener('keydown', (e) => {
  if (e.code === 'F3') {
    e.preventDefault();
    hataAyiklama = !hataAyiklama;
    $('bilgi').classList.toggle('gizli', !hataAyiklama);
    return;
  }
  if (!oynuyor) return;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.code === 'Escape' && surukleModu) {
    duraklat();
    return;
  }
  if (diyalog.acik) {
    if (e.repeat) return;
    if (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space') diyalog.ilerle();
    else if (e.code === 'KeyW' || e.code === 'ArrowUp') diyalog.secimiKaydir(-1);
    else if (e.code === 'KeyS' || e.code === 'ArrowDown') diyalog.secimiKaydir(1);
    else if (/^(Digit|Numpad)[1-9]$/.test(e.code)) diyalog.sec(Number(e.code.slice(-1)) - 1);
    return;
  }
  if (e.code === 'KeyE' && !e.repeat) return konus();
  if (e.code === 'KeyM' && !e.repeat) return haritaGorunumu();
  if (e.code === 'KeyV' && !e.repeat) oyuncu.ucuncuSahis = !oyuncu.ucuncuSahis;
  if (!e.repeat && /^Digit[1-9]$/.test(e.code)) {
    envanter.sec(Number(e.code.slice(5)) - 1);
  }
  oyuncu.tuslar.add(e.code);
});
document.addEventListener('keyup', (e) => oyuncu.tuslar.delete(e.code));
window.addEventListener('blur', () => oyuncu.tuslar.clear());

// ---------- Dokunmatik kumandalar ----------
{
  const pasifDegil = { passive: false };
  // Ekranı kaydırarak bakış
  const bakis = new Map();
  tuval.addEventListener('touchstart', (e) => {
    e.preventDefault();
    for (const d of e.changedTouches) bakis.set(d.identifier, { x: d.clientX, y: d.clientY });
  }, pasifDegil);
  tuval.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (const d of e.changedTouches) {
      const o = bakis.get(d.identifier);
      if (!o) continue;
      if (oynuyor && !diyalog.acik) oyuncu.bak((d.clientX - o.x) * 2.2, (d.clientY - o.y) * 2.2);
      o.x = d.clientX;
      o.y = d.clientY;
    }
  }, pasifDegil);
  const bakisBitti = (e) => {
    for (const d of e.changedTouches) bakis.delete(d.identifier);
  };
  tuval.addEventListener('touchend', bakisBitti);
  tuval.addEventListener('touchcancel', bakisBitti);

  // Yürüme kolu
  const kol = $('kol');
  const topuz = $('kol-topuz');
  let kolDokunus = null;
  const kolGuncelle = (d) => {
    const r = kol.getBoundingClientRect();
    const yari = r.width / 2;
    let x = (d.clientX - (r.left + yari)) / (yari * 0.75);
    let y = (d.clientY - (r.top + yari)) / (yari * 0.75);
    const boy = Math.hypot(x, y);
    if (boy > 1) {
      x /= boy;
      y /= boy;
    }
    oyuncu.analog.x = Math.abs(x) < 0.12 ? 0 : x;
    oyuncu.analog.y = Math.abs(y) < 0.12 ? 0 : y;
    topuz.style.transform = `translate(${x * yari * 0.6}px, ${y * yari * 0.6}px)`;
  };
  const kolBirak = () => {
    kolDokunus = null;
    oyuncu.analog.x = oyuncu.analog.y = 0;
    topuz.style.transform = '';
  };
  kol.addEventListener('touchstart', (e) => {
    e.preventDefault();
    kolDokunus = e.changedTouches[0].identifier;
    kolGuncelle(e.changedTouches[0]);
  }, pasifDegil);
  kol.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (const d of e.changedTouches) if (d.identifier === kolDokunus) kolGuncelle(d);
  }, pasifDegil);
  for (const tur of ['touchend', 'touchcancel'])
    kol.addEventListener(tur, (e) => {
      for (const d of e.changedTouches) if (d.identifier === kolDokunus) kolBirak();
    });

  // Düğmeler: pointer olayları hem parmakla hem fareyle çalışır
  const dugme = (id, bas, birak) => {
    const el = $(id);
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      el.classList.add('basili');
      bas();
    });
    for (const tur of ['pointerup', 'pointercancel', 'pointerleave'])
      el.addEventListener(tur, () => {
        el.classList.remove('basili');
        if (birak) birak();
      });
    el.addEventListener('touchstart', (e) => e.preventDefault(), pasifDegil);
  };
  dugme('d-zipla', () => oyuncu.tuslar.add('Space'), () => oyuncu.tuslar.delete('Space'));
  dugme('d-kir', () => etkilesim.kir());
  dugme('d-koy', () => etkilesim.yerlestir());
  dugme('d-kamera', () => (oyuncu.ucuncuSahis = !oyuncu.ucuncuSahis));
  dugme('d-duraklat', () => duraklat());
  dugme('d-konus', () => konus());
}

function boyutlandir() {
  const g = window.innerWidth;
  const y = window.innerHeight;
  cizici.setSize(g, y, false);
  kamera.aspect = g / y;
  kamera.updateProjectionMatrix();
}
window.addEventListener('resize', boyutlandir);
boyutlandir();

// ---------- Bölge adı bildirimi ----------
let sonBolge = -1;
function bolgeBildir(no) {
  $('bolge-adi').textContent = BOLGE_ADLARI[no];
  if (!gorevler.bildirimSuruyor) bildir(BOLGE_ADLARI[no]);
}

// ---------- Ana döngü ----------
let onceki = performance.now();
let fpsSayac = 0;
let fpsZaman = 0;
let fps = 0;

function kare(simdi) {
  const dt = Math.min(0.05, (simdi - onceki) / 1000);
  onceki = simdi;

  const serbest = oynuyor && !diyalog.acik;
  oyuncu.guncelle(dt, serbest);
  etkilesim.guncelle(serbest);
  karakterler.guncelle(dt, oyuncu, konusulan);
  gorevler.guncelle(simdi / 1000);
  if (oynuyor) harita.ciz(oyuncu, gorevler.isaretler, simdi / 1000);
  const yeniYakin = serbest ? karakterler.yakindaki(oyuncu) : null;
  if (yeniYakin !== yakinKarakter) {
    yakinKarakter = yeniYakin;
    const ipucu = $('konus-ipucu');
    ipucu.classList.toggle('gizli', !yakinKarakter);
    $('d-konus').classList.toggle('gizli', !yakinKarakter);
    if (yakinKarakter) {
      const ek = yakinKarakter.ipucu || (yakinKarakter.kedi ? `${yakinKarakter.ad}'a bak` : `${yakinKarakter.ad} ile konuş`);
      ipucu.textContent = dokunmatik ? ek : `E — ${ek}`;
    }
  }

  // Renklenme geçişi ve gökyüzü
  if (dalga) {
    dalga.r += dt * 26;
    dunya.dalga.value.z = dalga.r;
    if (dalga.r > 125) dalgayiBitir();
  }
  konfetiGuncelle(dt);
  // Gökyüzü, renklenen bölge sayısına göre griden maviye döner; müzik de zenginleşir
  let renkli = dalga ? 1 : 0;
  for (let i = 0; i < 5; i++) if (hedefDoygunluk[i] === 1) renkli++;
  ses.katman = renkli;
  gokOrani += (renkli / 5 - gokOrani) * Math.min(1, dt * 0.7);
  sahne.background.copy(GRI_GOK).lerp(MAVI_GOK, gokOrani);
  sahne.fog.color.copy(sahne.background);

  for (const bulut of bulutlar.children) {
    bulut.position.x += dt * 1.2;
    if (bulut.position.x > 244) bulut.position.x = -116;
  }

  const bolge = dunya.bolge(oyuncu.konum.x, oyuncu.konum.z);
  if (bolge !== sonBolge) {
    sonBolge = bolge;
    if (oynuyor) bolgeBildir(bolge);
    else $('bolge-adi').textContent = BOLGE_ADLARI[bolge];
  }

  fpsSayac++;
  fpsZaman += dt;
  if (fpsZaman >= 0.5) {
    fps = Math.round(fpsSayac / fpsZaman);
    fpsSayac = 0;
    fpsZaman = 0;
    if (hataAyiklama) {
      const p = oyuncu.konum;
      $('bilgi').textContent =
        `FPS: ${fps}\nKonum: ${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}\n` +
        `Bölge: ${BOLGE_ADLARI[bolge]}`;
    }
  }

  cizici.render(sahne, kamera);
  requestAnimationFrame(kare);
}
requestAnimationFrame(kare);

// Sonraki aşamalar ve denemeler için dışa açılan nesne
window.kalbinKahramanlari = { dunya, oyuncu, sahne, kamera, bolgeyiRenklendir, surukleModunaGec, envanter, etkilesim, karakterler, diyalog, konus, gorevler, harita, ses, sonEkraniAc, ozetiAc, konfetiPatlat };
