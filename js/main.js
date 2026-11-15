import * as THREE from '../vendor/three.module.min.js';
import { BOLGE_ADLARI } from './world.js';
import { koyuOlustur } from './worldgen.js';
import { Player } from './player.js';

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

const kamera = new THREE.PerspectiveCamera(72, 1, 0.1, 300);

const dunya = koyuOlustur();
dunya.tumunuOr();
sahne.add(dunya.grup);

const oyuncu = new Player(dunya, kamera);
const b = dunya.baslangic;
oyuncu.isinla(b.x, b.y, b.z, b.yon);
sahne.add(oyuncu.avatar);

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
function bolgeyiRenklendir(no, acik = true) {
  hedefDoygunluk[no] = acik ? 1 : 0.12;
}

// ---------- Oyun durumu ve girdiler ----------
let oynuyor = false;
let surukleModu = false; // fare kilidi kullanılamıyorsa: basılı tutup sürükleyerek bakılır
let hataAyiklama = false;

function baslat() {
  const istek = tuval.requestPointerLock?.();
  if (istek && istek.catch) istek.catch(surukleModunaGec);
}
function surukleModunaGec() {
  surukleModu = true;
  oynuyor = true;
  arayuzuGuncelle();
}
function arayuzuGuncelle() {
  $('giris').classList.toggle('gizli', oynuyor);
  $('hud').classList.toggle('gizli', !oynuyor);
  $('surukle-ipucu').classList.toggle('gizli', !surukleModu);
  if (!oynuyor) {
    oyuncu.tuslar.clear();
    $('basla').textContent = oynandi ? 'Devam Et' : 'Oyuna Başla';
  }
}
let oynandi = false;

$('basla').addEventListener('click', baslat);
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
  if (document.pointerLockElement === tuval || (surukleModu && e.buttons & 1)) {
    oyuncu.bak(e.movementX, e.movementY);
  }
});
tuval.addEventListener('contextmenu', (e) => e.preventDefault());

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
    oynuyor = false;
    surukleModu = false;
    arayuzuGuncelle();
    return;
  }
  if (e.code === 'KeyV' && !e.repeat) oyuncu.ucuncuSahis = !oyuncu.ucuncuSahis;
  // Deneme kısayolu (yalnızca F3 açıkken): 1-4 bölgeleri, 0 meydanı renklendirir
  if (hataAyiklama && !e.repeat && /^Digit[0-4]$/.test(e.code)) {
    const no = Number(e.code.slice(5));
    bolgeyiRenklendir(no, hedefDoygunluk[no] < 1);
  }
  oyuncu.tuslar.add(e.code);
});
document.addEventListener('keyup', (e) => oyuncu.tuslar.delete(e.code));
window.addEventListener('blur', () => oyuncu.tuslar.clear());

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
let bildirimZamanlayici = 0;
function bolgeBildir(no) {
  $('bolge-adi').textContent = BOLGE_ADLARI[no];
  const kutu = $('bolge-bildirim');
  kutu.textContent = BOLGE_ADLARI[no];
  kutu.classList.add('gorunur');
  clearTimeout(bildirimZamanlayici);
  bildirimZamanlayici = setTimeout(() => kutu.classList.remove('gorunur'), 2600);
}

// ---------- Ana döngü ----------
let onceki = performance.now();
let fpsSayac = 0;
let fpsZaman = 0;
let fps = 0;

function kare(simdi) {
  const dt = Math.min(0.05, (simdi - onceki) / 1000);
  onceki = simdi;

  oyuncu.guncelle(dt, oynuyor);

  // Renklenme geçişi ve gökyüzü
  const d = dunya.doygunluk.value;
  let toplam = 0;
  for (let i = 0; i < 5; i++) {
    d[i] += (hedefDoygunluk[i] - d[i]) * Math.min(1, dt * 1.6);
    toplam += d[i];
  }
  const oran = Math.max(0, (toplam / 5 - 0.12) / 0.88);
  sahne.background.copy(GRI_GOK).lerp(MAVI_GOK, oran);
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
        `Bölge: ${BOLGE_ADLARI[bolge]}\nDeneme: 1-4 bölge, 0 meydan renklendirir`;
    }
  }

  cizici.render(sahne, kamera);
  requestAnimationFrame(kare);
}
requestAnimationFrame(kare);

// Sonraki aşamalar ve denemeler için dışa açılan nesne
window.degerlerKoyu = { dunya, oyuncu, sahne, kamera, bolgeyiRenklendir, surukleModunaGec };
