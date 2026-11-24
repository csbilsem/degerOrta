import { B } from './blocks.js';
import { World } from './world.js';

export const ZEMIN = 10; // düz köy zemininin en üst blok yüksekliği

function rastgeleUret(tohum) {
  let s = tohum >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gurultu2(x, z) {
  const h = (ix, iz) => {
    let n = (ix * 374761393 + iz * 668265263) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const fx = x - x0;
  const fz = z - z0;
  const sx = fx * fx * (3 - 2 * fx);
  const sz = fz * fz * (3 - 2 * fz);
  const a = h(x0, z0) + (h(x0 + 1, z0) - h(x0, z0)) * sx;
  const b = h(x0, z0 + 1) + (h(x0 + 1, z0 + 1) - h(x0, z0 + 1)) * sx;
  return a + (b - a) * sz;
}

// ---------- Görevlerin kullandığı konumlar ----------
const G0 = ZEMIN;
export const DUVAR_BOSLUKLARI = [];
// Emine Nine'nin evi bahçe kapısının yanında (x 44-50, z 55-60); fırtına yola bakan güney duvarı yıktı
for (const x of [45, 46]) for (const y of [G0 + 1, G0 + 2, G0 + 3]) DUVAR_BOSLUKLARI.push([x, y, 60]);
export const KONAK_KAPISI = [];
for (const x of [63, 64, 65]) for (const y of [G0 + 1, G0 + 2, G0 + 3]) KONAK_KAPISI.push([x, y, 93]);
export const KEDI_KAPLARI = [
  [30, G0 + 1, 65, B.SU_KABI],
  [32, G0 + 1, 65, B.MAMA],
];
const TEPE = { x: 64, y: G0 + 12, z: 26 };
// Oyuncunun dikeceği direk blokları ve küçük anıt
export const DIREK_HEDEFLERI = [2, 3, 4, 5].map((dy) => [TEPE.x, TEPE.y + dy, TEPE.z, B.DIREK]);
export const ANIT_HEDEFLERI = [1, 2, 3].map((dy) => [61, TEPE.y + dy, 24, B.ANIT_TASI]);
// Direk tamamlanınca kendiliğinden yükselen üst kısım ve bayrak
export function bayrakBloklari() {
  const liste = [];
  for (let dy = 6; dy <= 11; dy++) liste.push([TEPE.x, TEPE.y + dy, TEPE.z, B.DIREK]);
  const desen = ['KKKKKKK', 'KBBKKKK', 'KBKKBKK', 'KBBKKKK', 'KKKKKKK'];
  desen.forEach((satir, i) => {
    [...satir].forEach((h, j) => {
      liste.push([TEPE.x + 1 + j, TEPE.y + 11 - i, TEPE.z, h === 'B' ? B.BAYRAK_BEYAZ : B.BAYRAK_KIRMIZI]);
    });
  });
  return liste;
}

export function koyuOlustur() {
  const W = 128;
  const H = 48;
  const D = 128;
  const w = new World(W, H, D);
  const mx = 64;
  const mz = 64;
  const G = ZEMIN;
  const rnd = rastgeleUret(2024);
  const tepeMerkez = { x: 64, z: 26 };
  const ayrilmis = []; // ağaç dikilmeyecek dikdörtgenler
  const ayir = (x0, z0, x1, z1) => ayrilmis.push([x0, z0, x1, z1]);
  const ayrilmisMi = (x, z) => ayrilmis.some((r) => x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3]);

  const doldur = (x0, y0, z0, x1, y1, z1, id) => {
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) w.koy(x, y, z, id);
  };
  const yuzey = (x, z, id) => w.koy(x, w.tepe(x, z), z, id);

  // ---------- Arazi ----------
  const tepeYuksekligi = (x, z) => {
    const d = Math.hypot(x - tepeMerkez.x, z - tepeMerkez.z);
    if (d < 5) return 12;
    if (d < 24) return Math.round(12 * (0.5 + 0.5 * Math.cos((Math.PI * (d - 5)) / 19)));
    return 0;
  };
  for (let z = 0; z < D; z++) {
    for (let x = 0; x < W; x++) {
      let h = G + tepeYuksekligi(x, z);
      const c = Math.max(Math.abs(x - mx), Math.abs(z - mz));
      if (c > 50) h += Math.round(gurultu2(x / 9, z / 9) * 3 * Math.min(1, (c - 50) / 6));
      const kenar = Math.min(x, z, W - 1 - x, D - 1 - z);
      if (kenar < 8) h += Math.round((8 - kenar) * 1.6);
      for (let y = 0; y <= h; y++) {
        let id = B.TAS;
        if (kenar >= 4) {
          if (y === h) id = B.CIM;
          else if (y > h - 4) id = B.TOPRAK;
        }
        w.koy(x, y, z, id);
      }
    }
  }

  // ---------- Yollar ----------
  for (let z = 26; z <= 98; z++) for (let x = 63; x <= 65; x++) yuzey(x, z, B.YOL);
  for (let x = 30; x <= 98; x++) for (let z = 63; z <= 65; z++) yuzey(x, z, B.YOL);
  ayir(62, 20, 66, 100);
  ayir(28, 62, 100, 66);

  // ---------- Köy Meydanı ----------
  for (let z = mz - 13; z <= mz + 13; z++) {
    for (let x = mx - 13; x <= mx + 13; x++) {
      const d = Math.hypot(x - mx, z - mz);
      if (d <= 12.5) w.koy(x, G, z, d > 11.3 || (d > 5.5 && d < 6.5) ? B.ACIK_TAS : B.YOL);
    }
  }
  ayir(mx - 14, mz - 14, mx + 14, mz + 14);
  // Anıt Alanı: değer bloklarıyla anıt buraya inşa edilecek
  doldur(mx - 2, G + 1, mz - 2, mx + 2, G + 1, mz + 2, B.MERMER);
  doldur(mx - 1, G + 2, mz - 1, mx + 1, G + 2, mz + 1, B.MERMER);
  for (const [dx, dz] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]) {
    doldur(mx + dx, G + 1, mz + dz, mx + dx, G + 3, mz + dz, B.KUTUK);
    w.koy(mx + dx, G + 4, mz + dz, B.FENER);
  }

  // ---------- Yardımcı yapılar ----------
  const agac = (x, z, boy = 4) => {
    const y0 = w.tepe(x, z) + 1;
    for (let dy = boy - 2; dy <= boy + 1; dy++) {
      const yari = dy < boy ? 2 : 1;
      for (let dz = -yari; dz <= yari; dz++)
        for (let dx = -yari; dx <= yari; dx++) {
          if (yari === 2 && Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
          if (dy === boy + 1 && dx !== 0 && dz !== 0) continue;
          w.koy(x + dx, y0 + dy, z + dz, B.YAPRAK);
        }
    }
    doldur(x, y0, z, x, y0 + boy - 1, z, B.KUTUK);
  };

  // Kapısı verilen yöne bakan basit ev. yon: 'k','g','d','b' (kuzey, güney, doğu, batı)
  const ev = (x0, z0, gen, der, yuk, yon) => {
    const x1 = x0 + gen - 1;
    const z1 = z0 + der - 1;
    ayir(x0 - 2, z0 - 2, x1 + 2, z1 + 2);
    doldur(x0, G, z0, x1, G, z1, B.TAHTA);
    for (let y = G + 1; y <= G + yuk; y++) {
      for (let z = z0; z <= z1; z++)
        for (let x = x0; x <= x1; x++) {
          const kx = x === x0 || x === x1;
          const kz = z === z0 || z === z1;
          if (!kx && !kz) continue;
          let id = kx && kz ? B.KUTUK : B.DUVAR;
          // pencereler
          const py = (y - G) % 4 === 2;
          if (py && kz && !kx && (x - x0) % 3 === 2 && x < x1 - 1) id = B.HAVA;
          if (py && kx && !kz && (z - z0) % 3 === 2 && z < z1 - 1) id = B.HAVA;
          w.koy(x, y, z, id);
        }
    }
    // kapı
    const ox = Math.floor((x0 + x1) / 2);
    const oz = Math.floor((z0 + z1) / 2);
    const kapi = { k: [ox, z0], g: [ox, z1], d: [x1, oz], b: [x0, oz] }[yon];
    doldur(kapi[0], G + 1, kapi[1], kapi[0], G + 2, kapi[1], B.HAVA);
    // kademeli kiremit çatı
    for (let k = 0; ; k++) {
      const ax = x0 - 1 + k;
      const bx = x1 + 1 - k;
      const az = z0 - 1 + k;
      const bz = z1 + 1 - k;
      if (ax > bx || az > bz) break;
      doldur(ax, G + yuk + 1 + k, az, bx, G + yuk + 1 + k, bz, B.CATI);
    }
  };

  // Meydanın çaprazlarındaki köy evleri
  ev(42, 43, 7, 6, 3, 'd');
  ev(44, 55, 7, 6, 3, 'g'); // Emine Nine'nin evi
  ev(80, 43, 7, 6, 3, 'b');
  ev(42, 80, 7, 6, 3, 'd');
  ev(80, 80, 7, 6, 3, 'b');

  // ---------- Doğruluk Çarşısı (doğu) ----------
  doldur(86, G, 52, 110, G, 76, B.YOL);
  for (let x = 86; x <= 110; x++) {
    w.koy(x, G, 52, B.ACIK_TAS);
    w.koy(x, G, 76, B.ACIK_TAS);
  }
  ayir(84, 50, 112, 78);
  const tezgah = (x0, z0, onZ, kumas) => {
    // 5x3 tezgâh; onZ: tezgâhın alışveriş yapılan ön sırası
    for (const [x, z] of [[x0, z0], [x0 + 4, z0], [x0, z0 + 2], [x0 + 4, z0 + 2]])
      doldur(x, G + 1, z, x, G + 3, z, B.KUTUK);
    for (let x = x0 - 1; x <= x0 + 5; x++)
      for (let z = z0 - 1; z <= z0 + 3; z++)
        w.koy(x, G + 4, z, (x - x0) % 2 === 0 ? kumas : B.KUMAS_BEYAZ);
    doldur(x0 + 1, G + 1, onZ, x0 + 3, G + 1, onZ, B.TAHTA);
    const arkaZ = onZ === z0 ? z0 + 2 : z0;
    w.koy(x0 + 1, G + 1, arkaZ, B.SANDIK);
    w.koy(x0 + 3, G + 1, arkaZ, B.SANDIK);
    w.koy(x0 + 3, G + 2, arkaZ, B.SANDIK);
  };
  const kumaslar = [B.KUMAS_KIRMIZI, B.KUMAS_MAVI, B.KUMAS_SARI];
  [88, 95, 102].forEach((x, i) => {
    tezgah(x, 55, 57, kumaslar[i]);
    tezgah(x, 71, 71, kumaslar[(i + 1) % 3]);
  });

  // ---------- Merhamet Bahçesi (batı) ----------
  ayir(16, 50, 44, 78);
  for (let x = 18; x <= 42; x++)
    for (let z = 52; z <= 76; z++) {
      const cit = x === 18 || x === 42 || z === 52 || z === 76;
      const kapi = x === 42 && z >= 63 && z <= 65;
      if (cit && !kapi) w.koy(x, G + 1, z, B.CIT);
    }
  // gölet
  for (let x = 21; x <= 29; x++)
    for (let z = 54; z <= 61; z++) {
      const d = Math.hypot((x - 25) / 4, (z - 57.5) / 3.5);
      if (d <= 0.85) {
        w.koy(x, G, z, B.SU);
        w.koy(x, G - 1, z, B.KUM);
      } else if (d <= 1.2) w.koy(x, G, z, B.KUM);
    }
  // çiçek tarhları
  const tarh = (x0, z0, x1, z1, id) => doldur(x0, G, z0, x1, G, z1, id);
  tarh(33, 55, 38, 56, B.CICEK_PEMBE);
  tarh(33, 58, 38, 59, B.CICEK_SARI);
  tarh(21, 71, 26, 72, B.CICEK_MOR);
  tarh(21, 68, 26, 69, B.CICEK_PEMBE);
  tarh(34, 72, 39, 73, B.CICEK_SARI);
  agac(21, 65, 5);
  agac(31, 70, 4);
  agac(39, 67, 5);
  agac(31, 59, 4);
  agac(39, 61, 4);
  // bank
  doldur(27, G + 1, 63, 29, G + 1, 63, B.TAHTA);

  // ---------- Adap Konağı (güney) ----------
  ayir(50, 86, 78, 108);
  doldur(52, G, 88, 76, G, 106, B.YOL);
  for (let x = 52; x <= 76; x++)
    for (let z = 88; z <= 106; z++) {
      const kenar = x === 52 || x === 76 || z === 88 || z === 106;
      const giris = z === 88 && x >= 63 && x <= 65;
      if (kenar && !giris) w.koy(x, G + 1, z, B.ACIK_TAS);
    }
  {
    const x0 = 56;
    const x1 = 72;
    const z0 = 93;
    const z1 = 103;
    const yuk = 8;
    doldur(x0, G, z0, x1, G, z1, B.TAHTA);
    for (let y = G + 1; y <= G + yuk; y++)
      for (let z = z0; z <= z1; z++)
        for (let x = x0; x <= x1; x++) {
          const kx = x === x0 || x === x1;
          const kz = z === z0 || z === z1;
          if (!kx && !kz) continue;
          let id = (kx && kz) || y === G + 5 ? B.KUTUK : B.DUVAR;
          const py = y === G + 2 || y === G + 3 || y === G + 7;
          // Konağın pencereleri camlı: kapı kapalıyken içeri pencereden girilmesin
          if (py && kz && !kx && (x - x0) % 4 === 2) id = B.CAM;
          if (py && kx && !kz && (z - z0) % 4 === 2) id = B.CAM;
          w.koy(x, y, z, id);
        }
    // büyük giriş kapısı (kuzeye, meydana bakar)
    doldur(63, G + 1, z0, 65, G + 3, z0, B.HAVA);
    // beşik çatı
    for (let k = 0; k <= 6; k++) {
      const az = z0 - 1 + k;
      const bz = z1 + 1 - k;
      if (az > bz) break;
      doldur(x0 - 1, G + yuk + 1 + k, az, x1 + 1, G + yuk + 1 + k, bz, B.CATI);
    }
    // sundurma
    doldur(62, G + 1, z0 - 3, 62, G + 3, z0 - 3, B.KUTUK);
    doldur(66, G + 1, z0 - 3, 66, G + 3, z0 - 3, B.KUTUK);
    doldur(61, G + 4, z0 - 4, 67, G + 4, z0 - 1, B.CATI);
  }

  // ---------- Vatan Tepesi (kuzey) ----------
  ayir(40, 2, 88, 50);
  {
    const tx = tepeMerkez.x;
    const tz = tepeMerkez.z;
    const ty = G + 12;
    for (let x = tx - 4; x <= tx + 4; x++)
      for (let z = tz - 4; z <= tz + 4; z++) {
        const d = Math.hypot(x - tx, z - tz);
        if (d <= 4.3) w.koy(x, ty, z, d > 3.3 ? B.ACIK_TAS : B.YOL);
      }
    doldur(tx - 1, ty + 1, tz - 1, tx + 1, ty + 1, tz + 1, B.MERMER);
    // yamaçta birkaç ağaç
    for (const [x, z] of [[50, 30], [78, 30], [52, 16], [76, 14], [47, 22], [81, 22]]) agac(x, z, 4);
  }

  // ---------- Çevreye serpiştirilmiş ağaçlar ----------
  for (let i = 0; i < 260; i++) {
    const x = 8 + Math.floor(rnd() * (W - 16));
    const z = 8 + Math.floor(rnd() * (D - 16));
    if (ayrilmisMi(x, z)) continue;
    const t = w.tepe(x, z);
    if (w.al(x, t, z) !== B.CIM) continue;
    agac(x, z, 4 + Math.floor(rnd() * 2));
    ayir(x - 3, z - 3, x + 3, z + 3);
  }

  // ---------- Görevlerle ilgili başlangıç durumu ----------
  // Fırtına Ayşe Nine'nin evinin güney duvarında boşluk açmış
  for (const [x, y, z] of DUVAR_BOSLUKLARI) w.koy(x, y, z, B.HAVA);
  // Adap Konağı'nın kapısı kapalı; doğru selamla açılır
  for (const [x, y, z] of KONAK_KAPISI) w.koy(x, y, z, B.KAPI);

  w.baslangic = { x: 64.5, y: G + 1, z: 73.5, yon: 0 };
  return w;
}
