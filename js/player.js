import * as THREE from '../vendor/three.module.min.js';

const GENISLIK = 0.6;
const BOY = 1.8;
const GOZ = 1.62;
const YERCEKIMI = 28;
const ZIPLAMA = 8.6;
const YURUME = 4.6;
const KOSMA = 7.2;
const EPS = 1e-4;

export class Player {
  constructor(world, kamera) {
    this.w = world;
    this.kamera = kamera;
    this.konum = new THREE.Vector3();
    this.hiz = new THREE.Vector3();
    this.yon = 0; // sağa-sola bakış (yaw)
    this.egim = 0; // yukarı-aşağı bakış (pitch)
    this.yerde = false;
    this.ucuncuSahis = false;
    this.tuslar = new Set();
    this.analog = { x: 0, y: 0 }; // dokunmatik kumanda kolu (-1..1)
    this.adim = 0;
    this.avatar = this._avatarOlustur();
    this.avatar.visible = false;
  }

  _avatarOlustur() {
    const g = new THREE.Group();
    const kutu = (gx, gy, gz, renk, x, y, z) => {
      const geo = new THREE.BoxGeometry(gx, gy, gz);
      geo.translate(0, -gy / 2, 0); // üstten asılı: uzuvlar omuzdan/kalçadan sallanır
      const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: renk }));
      m.position.set(x, y, z);
      g.add(m);
      return m;
    };
    kutu(0.5, 0.5, 0.5, 0xf1c9a5, 0, 1.8, 0); // baş
    kutu(0.52, 0.14, 0.52, 0x4a3324, 0, 1.84, 0); // saç
    kutu(0.5, 0.65, 0.28, 0x2f8f83, 0, 1.3, 0); // gövde
    this.solKol = kutu(0.16, 0.6, 0.2, 0x2f8f83, -0.34, 1.28, 0);
    this.sagKol = kutu(0.16, 0.6, 0.2, 0x2f8f83, 0.34, 1.28, 0);
    this.solBacak = kutu(0.22, 0.65, 0.24, 0x3b4a6b, -0.13, 0.65, 0);
    this.sagBacak = kutu(0.22, 0.65, 0.24, 0x3b4a6b, 0.13, 0.65, 0);
    return g;
  }

  isinla(x, y, z, yon = 0) {
    this.konum.set(x, y, z);
    this.hiz.set(0, 0, 0);
    this.yon = yon;
    this.egim = 0;
  }

  bak(dx, dy) {
    const h = 0.0023;
    this.yon -= dx * h;
    this.egim -= dy * h;
    const sinir = Math.PI / 2 - 0.02;
    this.egim = Math.max(-sinir, Math.min(sinir, this.egim));
  }

  _carpisiyor(p) {
    const y0 = Math.floor(p.y + EPS);
    const y1 = Math.floor(p.y + BOY - EPS);
    const x0 = Math.floor(p.x - GENISLIK / 2 + EPS);
    const x1 = Math.floor(p.x + GENISLIK / 2 - EPS);
    const z0 = Math.floor(p.z - GENISLIK / 2 + EPS);
    const z1 = Math.floor(p.z + GENISLIK / 2 - EPS);
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (this.w.kati(x, y, z)) return true;
    return false;
  }

  gozKonumu() {
    return new THREE.Vector3(this.konum.x, this.konum.y + GOZ, this.konum.z);
  }

  bakisYonu() {
    return new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(this.egim, this.yon, 0, 'YXZ'));
  }

  // Verilen blok hücresi oyuncunun gövdesiyle kesişiyor mu?
  hucreyleKesisir(x, y, z) {
    const p = this.konum;
    return (
      x + 1 > p.x - GENISLIK / 2 && x < p.x + GENISLIK / 2 &&
      y + 1 > p.y && y < p.y + BOY &&
      z + 1 > p.z - GENISLIK / 2 && z < p.z + GENISLIK / 2
    );
  }

  // Tek eksende ilerler; çarparsa bloğun yüzüne yaslar. Çarptıysa true döner.
  _ilerle(eksen, miktar) {
    if (miktar === 0) return false;
    const p = this.konum;
    const eski = p[eksen];
    p[eksen] += miktar;
    if (!this._carpisiyor(p)) return false;
    const yari = eksen === 'y' ? 0 : GENISLIK / 2;
    if (miktar > 0) {
      const ust = eksen === 'y' ? BOY : yari;
      p[eksen] = Math.floor(p[eksen] + ust) - ust - EPS;
    } else {
      p[eksen] = Math.floor(p[eksen] - yari) + 1 + yari + EPS;
    }
    if (this._carpisiyor(p)) p[eksen] = eski;
    return true;
  }

  guncelle(dt, etkin) {
    const t = this.tuslar;
    let ileri = 0;
    let yana = 0;
    if (etkin) {
      if (t.has('KeyW') || t.has('ArrowUp')) ileri += 1;
      if (t.has('KeyS') || t.has('ArrowDown')) ileri -= 1;
      if (t.has('KeyD') || t.has('ArrowRight')) yana += 1;
      if (t.has('KeyA') || t.has('ArrowLeft')) yana -= 1;
      ileri -= this.analog.y;
      yana += this.analog.x;
    }
    const hareketli = ileri !== 0 || yana !== 0;
    const surat = etkin && (t.has('ShiftLeft') || t.has('ShiftRight')) ? KOSMA : YURUME;
    const sin = Math.sin(this.yon);
    const cos = Math.cos(this.yon);
    let hx = 0;
    let hz = 0;
    if (hareketli) {
      const boy = Math.max(1, Math.hypot(ileri, yana));
      hx = ((-sin * ileri + cos * yana) / boy) * surat;
      hz = ((-cos * ileri - sin * yana) / boy) * surat;
    }
    // Yumuşak hızlanma / durma
    const k = Math.min(1, dt * (this.yerde ? 14 : 5));
    this.hiz.x += (hx - this.hiz.x) * k;
    this.hiz.z += (hz - this.hiz.z) * k;
    this.hiz.y = Math.max(-40, this.hiz.y - YERCEKIMI * dt);

    if (etkin && t.has('Space') && this.yerde) {
      this.hiz.y = ZIPLAMA;
      this.yerde = false;
    }

    const carptiX = this._ilerle('x', this.hiz.x * dt);
    const carptiZ = this._ilerle('z', this.hiz.z * dt);
    if (carptiX) this.hiz.x = 0;
    if (carptiZ) this.hiz.z = 0;

    // Otomatik zıplama: önünde tek blokluk basamak varsa kendiliğinden çıkar
    if ((carptiX || carptiZ) && this.yerde && hareketli) {
      const boy = Math.hypot(hx, hz);
      const ox = this.konum.x + (hx / boy) * 0.7;
      const oz = this.konum.z + (hz / boy) * 0.7;
      const y = this.konum.y + 0.1;
      if (this.w.kati(ox, y, oz) && !this.w.kati(ox, y + 1, oz) && !this.w.kati(ox, y + 2, oz) &&
          !this.w.kati(this.konum.x, y + 2, this.konum.z)) {
        this.hiz.y = ZIPLAMA;
        this.yerde = false;
      }
    }

    const dy = this.hiz.y * dt;
    const carptiY = this._ilerle('y', dy);
    if (carptiY) {
      this.yerde = dy < 0;
      this.hiz.y = 0;
    } else {
      this.yerde = false;
    }

    // Dünya sınırı ve boşluğa düşme güvenliği
    this.konum.x = Math.max(1.5, Math.min(this.w.W - 1.5, this.konum.x));
    this.konum.z = Math.max(1.5, Math.min(this.w.D - 1.5, this.konum.z));
    if (this.konum.y < -10) {
      const b = this.w.baslangic;
      this.isinla(b.x, b.y, b.z, b.yon);
    }

    this._kamerayiGuncelle(dt, hareketli);
  }

  _kamerayiGuncelle(dt, hareketli) {
    const yatayHiz = Math.hypot(this.hiz.x, this.hiz.z);
    if (this.yerde && hareketli) this.adim += dt * yatayHiz * 2.2;
    const salinim = this.yerde ? Math.sin(this.adim) * Math.min(1, yatayHiz / YURUME) : 0;

    const goz = new THREE.Vector3(this.konum.x, this.konum.y + GOZ, this.konum.z);
    const kam = this.kamera;
    kam.rotation.set(this.egim, this.yon, 0, 'YXZ');

    if (!this.ucuncuSahis) {
      kam.position.copy(goz);
      kam.position.y += Math.abs(salinim) * 0.045;
      this.avatar.visible = false;
      return;
    }

    // Üçüncü şahıs: kamerayı arkaya çek, araya blok girerse yaklaştır
    const geri = new THREE.Vector3(0, 0, 1).applyEuler(kam.rotation);
    const hedefUzaklik = 4.5;
    let uzaklik = hedefUzaklik;
    for (let d = 0.2; d <= hedefUzaklik; d += 0.15) {
      if (this.w.kati(goz.x + geri.x * d, goz.y + 0.2 + geri.y * d, goz.z + geri.z * d)) {
        uzaklik = Math.max(0.3, d - 0.3);
        break;
      }
    }
    kam.position.set(goz.x + geri.x * uzaklik, goz.y + 0.2 + geri.y * uzaklik, goz.z + geri.z * uzaklik);
    this.avatar.visible = uzaklik > 0.8;
    this.avatar.position.copy(this.konum);
    this.avatar.rotation.y = this.yon + Math.PI;
    const s = salinim * 0.7;
    this.solBacak.rotation.x = s;
    this.sagBacak.rotation.x = -s;
    this.solKol.rotation.x = -s;
    this.sagKol.rotation.x = s;
  }
}
