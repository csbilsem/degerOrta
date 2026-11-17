import * as THREE from '../vendor/three.module.min.js';
import { ZEMIN } from './worldgen.js';

const TEN = 0xf1c9a5;

function kutu(grup, gx, gy, gz, renk, x, y, z) {
  const geo = new THREE.BoxGeometry(gx, gy, gz);
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: renk }));
  m.position.set(x, y, z);
  grup.add(m);
  return m;
}

// Küplerden yapılmış özgün köylü modeli. Yüz +z yönüne bakar; ayaklar y=0'dadır.
function insanModeli(g) {
  const grup = new THREE.Group();
  const kadin = g.tur === 'kadin' || g.kiz; // kadınlar ve kız çocuklar etekli
  // bacaklar ya da uzun etek
  if (kadin) kutu(grup, 0.56, 0.7, 0.4, g.alt, 0, 0.35, 0);
  else {
    kutu(grup, 0.22, 0.7, 0.24, g.alt, -0.13, 0.35, 0);
    kutu(grup, 0.22, 0.7, 0.24, g.alt, 0.13, 0.35, 0);
  }
  kutu(grup, 0.52, 0.62, 0.3, g.ust, 0, 1.01, 0); // gövde
  kutu(grup, 0.16, 0.58, 0.2, g.ust, -0.35, 1.02, 0); // kollar
  kutu(grup, 0.16, 0.58, 0.2, g.ust, 0.35, 1.02, 0);
  if (g.onluk) kutu(grup, 0.4, 0.7, 0.04, g.onluk, 0, 0.85, 0.17);
  const bas = new THREE.Group();
  bas.position.y = 1.57;
  grup.add(bas);
  kutu(bas, 0.48, 0.48, 0.48, TEN, 0, 0, 0);
  kutu(bas, 0.07, 0.07, 0.03, 0x2b2b2b, -0.11, 0.04, 0.245); // gözler
  kutu(bas, 0.07, 0.07, 0.03, 0x2b2b2b, 0.11, 0.04, 0.245);
  if (g.ortu) {
    kutu(bas, 0.54, 0.2, 0.54, g.ortu, 0, 0.19, 0); // başörtüsü
    kutu(bas, 0.54, 0.5, 0.12, g.ortu, 0, -0.05, -0.23);
    kutu(bas, 0.06, 0.42, 0.44, g.ortu, -0.25, -0.06, -0.02);
    kutu(bas, 0.06, 0.42, 0.44, g.ortu, 0.25, -0.06, -0.02);
  } else if (g.sac !== undefined) {
    kutu(bas, 0.5, 0.14, 0.5, g.sac, 0, 0.22, 0);
    kutu(bas, 0.5, 0.3, 0.1, g.sac, 0, 0.08, -0.22);
    if (g.orgu) {
      kutu(bas, 0.1, 0.4, 0.1, g.sac, -0.28, -0.22, -0.05);
      kutu(bas, 0.1, 0.4, 0.1, g.sac, 0.28, -0.22, -0.05);
    }
  }
  if (g.sapka !== undefined) kutu(bas, 0.5, 0.14, 0.5, g.sapka, 0, 0.28, 0);
  if (g.sakal !== undefined) kutu(bas, 0.4, 0.22, 0.08, g.sakal, 0, -0.2, 0.25);
  if (g.tur === 'yasli') kutu(grup, 0.06, 1.0, 0.06, 0x5a3d22, 0.48, 0.5, 0.12); // baston
  if (g.tur === 'cocuk') grup.scale.setScalar(0.72);
  if (g.yasli) grup.scale.setScalar(0.92);
  grup.userData.bas = bas;
  return grup;
}

function kediModeli(g) {
  const grup = new THREE.Group();
  kutu(grup, 0.28, 0.24, 0.6, g.renk, 0, 0.3, 0);
  for (const [x, z] of [[-0.09, 0.22], [0.09, 0.22], [-0.09, -0.22], [0.09, -0.22]])
    kutu(grup, 0.08, 0.2, 0.08, g.renk, x, 0.1, z);
  const bas = new THREE.Group();
  bas.position.set(0, 0.46, 0.34);
  grup.add(bas);
  kutu(bas, 0.3, 0.26, 0.26, g.renk, 0, 0, 0);
  kutu(bas, 0.08, 0.1, 0.06, g.renk, -0.1, 0.17, 0); // kulaklar
  kutu(bas, 0.08, 0.1, 0.06, g.renk, 0.1, 0.17, 0);
  kutu(bas, 0.05, 0.05, 0.02, 0x2b2b2b, -0.07, 0.02, 0.135);
  kutu(bas, 0.05, 0.05, 0.02, 0x2b2b2b, 0.07, 0.02, 0.135);
  kutu(bas, 0.05, 0.04, 0.02, 0xe58aa0, 0, -0.05, 0.135); // burun
  const kuyruk = kutu(grup, 0.07, 0.4, 0.07, g.renk, 0, 0.5, -0.32);
  kuyruk.rotation.x = -0.5;
  grup.userData.bas = bas;
  grup.userData.kuyruk = kuyruk;
  return grup;
}

// Vatan Tepesi'ndeki bilgi bloğu: taş ayak üstünde dönen altın küp
function bilgiModeli() {
  const grup = new THREE.Group();
  kutu(grup, 0.5, 0.7, 0.5, 0x8d9499, 0, 0.35, 0);
  const kup = new THREE.Group();
  kup.position.y = 1.2;
  grup.add(kup);
  kutu(kup, 0.5, 0.5, 0.5, 0xf0b429, 0, 0, 0);
  kutu(kup, 0.1, 0.24, 0.52, 0xffffff, 0, -0.06, 0);
  kutu(kup, 0.1, 0.1, 0.52, 0xffffff, 0, 0.16, 0);
  grup.userData.bas = new THREE.Group();
  grup.userData.kup = kup;
  return grup;
}

function adEtiketi(ad) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const yazi = 'bold 44px "Trebuchet MS", "Segoe UI", sans-serif';
  g.font = yazi;
  c.width = Math.ceil(g.measureText(ad).width) + 44;
  c.height = 68;
  g.font = yazi;
  g.fillStyle = 'rgba(30,36,46,0.72)';
  g.beginPath();
  g.roundRect(0, 0, c.width, c.height, 16);
  g.fill();
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(ad, c.width / 2, c.height / 2 + 2);
  const doku = new THREE.CanvasTexture(c);
  doku.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: doku, depthWrite: false }));
  s.scale.set((c.width / c.height) * 0.36, 0.36, 1);
  return s;
}

export class Karakterler {
  bul(kimlik) {
    return this.liste.find((k) => k.kimlik === kimlik);
  }

  constructor(dunya, tanimlar) {
    this.grup = new THREE.Group();
    this.liste = tanimlar.map((t) => {
      const kedi = t.gorunum.tur === 'kedi';
      const bilgi = t.gorunum.tur === 'bilgi';
      const model = kedi ? kediModeli(t.gorunum) : bilgi ? bilgiModeli() : insanModeli(t.gorunum);
      const y = t.zeminden ? dunya.tepe(Math.floor(t.x), Math.floor(t.z)) + 1 : t.y ?? ZEMIN + 1;
      model.position.set(t.x, y, t.z);
      model.rotation.y = t.bakis ?? 0;
      const boy = kedi ? 0.75 : bilgi ? 1.5 : 1.85 * model.scale.y;
      const etiket = adEtiketi(t.ad);
      etiket.position.set(t.x, y + boy + 0.38, t.z);
      this.grup.add(model, etiket);
      return { ...t, y, boy, kedi, bilgi, model, etiket, durusYonu: t.bakis ?? 0, evre: Math.random() * 6 };
    });
  }

  // Oyuncunun konuşabileceği en yakın karakter (yakında ve bakış yönündeyse)
  yakindaki(oyuncu) {
    const goz = oyuncu.gozKonumu();
    const yon = oyuncu.bakisYonu();
    let en = null;
    let enUzak = 3.4;
    for (const k of this.liste) {
      const dx = k.x - goz.x;
      const dz = k.z - goz.z;
      const dy = k.y + k.boy * 0.6 - goz.y;
      const uzak = Math.hypot(dx, dz);
      if (uzak > enUzak || Math.abs(k.y - oyuncu.konum.y) > 2.5) continue;
      const nokta = (dx * yon.x + dy * yon.y + dz * yon.z) / Math.max(0.001, Math.hypot(dx, dy, dz));
      if (nokta < 0.45 && uzak > 1.2) continue;
      en = k;
      enUzak = uzak;
    }
    return en;
  }

  guncelle(dt, oyuncu, konusulan) {
    for (const k of this.liste) {
      k.evre += dt;
      k.etiket.visible = k !== konusulan; // konuşurken ad zaten kutuda yazıyor
      const dx = oyuncu.konum.x - k.x;
      const dz = oyuncu.konum.z - k.z;
      const uzak = Math.hypot(dx, dz);
      if (k.bilgi) {
        k.model.userData.kup.rotation.y += dt * 1.2;
        k.model.userData.kup.position.y = 1.2 + Math.sin(k.evre * 2) * 0.08;
        continue;
      }
      // Oyuncu yaklaşınca ona döner, uzaklaşınca eski duruşuna geri döner
      const hedef = uzak < 5 || k === konusulan ? Math.atan2(dx, dz) : k.durusYonu;
      let fark = hedef - k.model.rotation.y;
      fark = Math.atan2(Math.sin(fark), Math.cos(fark));
      k.model.rotation.y += fark * Math.min(1, dt * 5);
      const bas = k.model.userData.bas;
      bas.rotation.x = Math.sin(k.evre * 0.9) * 0.05 + (k === konusulan ? Math.sin(k.evre * 7) * 0.05 : 0);
      if (k.model.userData.kuyruk) k.model.userData.kuyruk.rotation.z = Math.sin(k.evre * 2.2) * 0.35;

      // Oyuncu karakterin içinden geçemesin
      const yaricap = k.kedi ? 0.45 : 0.62;
      if (uzak < yaricap && uzak > 0.001 && Math.abs(oyuncu.konum.y - k.y) < 1.6) {
        const it = (yaricap - uzak) / uzak;
        oyuncu._ilerle('x', dx * it);
        oyuncu._ilerle('z', dz * it);
      }
    }
  }
}
