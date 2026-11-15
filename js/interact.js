import * as THREE from '../vendor/three.module.min.js';
import { B, BLOKLAR, DEGER_BLOKLARI, katiMi } from './blocks.js';

export const ERISIM = 5.5; // oyuncunun uzanabildiği mesafe (blok)

// Blok ızgarasında ışın izleme. İlk katı bloğu ve ışının girdiği yüzün
// yönünü (n) döndürür; yoksa null.
export function isinIzle(dunya, baslangic, yon, menzil) {
  let x = Math.floor(baslangic.x);
  let y = Math.floor(baslangic.y);
  let z = Math.floor(baslangic.z);
  const adim = [Math.sign(yon.x), Math.sign(yon.y), Math.sign(yon.z)];
  const o = [baslangic.x, baslangic.y, baslangic.z];
  const d = [yon.x, yon.y, yon.z];
  const h = [x, y, z];
  const tMaks = [0, 0, 0];
  const tDelta = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    if (d[i] === 0) {
      tMaks[i] = tDelta[i] = Infinity;
    } else {
      const sinir = adim[i] > 0 ? h[i] + 1 : h[i];
      tMaks[i] = (sinir - o[i]) / d[i];
      tDelta[i] = Math.abs(1 / d[i]);
    }
  }
  const n = [0, 0, 0];
  let t = 0;
  while (t <= menzil) {
    if (katiMi(dunya.al(h[0], h[1], h[2])) && dunya.sinirda(h[0], h[1], h[2])) {
      return { x: h[0], y: h[1], z: h[2], nx: n[0], ny: n[1], nz: n[2], uzaklik: t };
    }
    const i = tMaks[0] < tMaks[1] ? (tMaks[0] < tMaks[2] ? 0 : 2) : tMaks[1] < tMaks[2] ? 1 : 2;
    t = tMaks[i];
    tMaks[i] += tDelta[i];
    h[i] += adim[i];
    n[0] = n[1] = n[2] = 0;
    n[i] = -adim[i];
  }
  return null;
}

// Dokuz yuvalı blok çantası. İlk dört yuva değer bloklarına ayrılmıştır.
export class Envanter {
  constructor(kok, adEtiketi) {
    this.kok = kok;
    this.adEtiketi = adEtiketi;
    this.yuvalar = [];
    for (let i = 0; i < 9; i++) {
      this.yuvalar.push(i < 4 ? { id: DEGER_BLOKLARI[i], adet: 0, sabit: true } : { id: 0, adet: 0 });
    }
    this.secili = 4;
    // Yuvaya dokunarak / tıklayarak seçim (tablet için)
    kok.addEventListener('pointerdown', (e) => {
      const el = e.target.closest('.yuva');
      if (!el) return;
      e.preventDefault();
      this.sec(Number(el.dataset.i));
    });
    this.ciz();
  }

  get seciliYuva() {
    return this.yuvalar[this.secili];
  }

  sec(i) {
    this.secili = ((i % 9) + 9) % 9;
    this.ciz();
  }

  // Bloğu çantaya ekler; yer yoksa false döner.
  ekle(id, adet = 1) {
    let y = this.yuvalar.find((v) => v.id === id && (v.adet > 0 || v.sabit));
    if (!y) y = this.yuvalar.find((v) => !v.sabit && v.adet === 0);
    if (!y) return false;
    y.id = id;
    y.adet += adet;
    this.ciz();
    return true;
  }

  // Seçili yuvadan bir blok harcar; blok kimliğini döndürür (yoksa 0).
  harca() {
    const y = this.seciliYuva;
    if (y.adet <= 0) return 0;
    y.adet--;
    const id = y.id;
    if (y.adet === 0 && !y.sabit) y.id = 0;
    this.ciz();
    return id;
  }

  ciz() {
    this.kok.innerHTML = '';
    this.yuvalar.forEach((y, i) => {
      const el = document.createElement('div');
      el.className = 'yuva';
      el.dataset.i = i;
      if (i === this.secili) el.classList.add('secili');
      if (y.sabit) el.classList.add('deger', y.adet > 0 ? 'var' : 'bos-deger');
      let ic = `<span class="tus">${i + 1}</span>`;
      if (y.id) {
        const renk = '#' + BLOKLAR[y.id].renk.toString(16).padStart(6, '0');
        ic += `<span class="kup" style="background:${renk}"></span>`;
        ic += `<span class="adet">${y.adet}</span>`;
      }
      el.innerHTML = ic;
      this.kok.appendChild(el);
    });
    const s = this.seciliYuva;
    this.adEtiketi.textContent = !s.id
      ? 'Boş yuva'
      : s.sabit && s.adet === 0
        ? `${BLOKLAR[s.id].ad} — görevlerle kazanılır`
        : BLOKLAR[s.id].ad;
  }
}

// Hedef bloğu gösteren çerçeve, blok kırma ve yerleştirme
export class Etkilesim {
  constructor(dunya, oyuncu, envanter, mesajGoster) {
    this.dunya = dunya;
    this.oyuncu = oyuncu;
    this.envanter = envanter;
    this.mesaj = mesajGoster;
    this.hedef = null;
    const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004, 1.004, 1.004));
    this.cerceve = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x111111 }));
    this.cerceve.visible = false;
  }

  guncelle(etkin) {
    this.hedef = etkin
      ? isinIzle(this.dunya, this.oyuncu.gozKonumu(), this.oyuncu.bakisYonu(), ERISIM)
      : null;
    this.cerceve.visible = !!this.hedef;
    if (this.hedef) this.cerceve.position.set(this.hedef.x + 0.5, this.hedef.y + 0.5, this.hedef.z + 0.5);
  }

  kir() {
    const h = this.hedef;
    if (!h) return false;
    const id = this.dunya.al(h.x, h.y, h.z);
    const tur = BLOKLAR[id];
    if (tur.kirilmaz) return this.mesaj(tur.kirilmaz), false;
    if (h.y <= 1) return this.mesaj('Daha derine kazılamaz.'), false;
    if (!this.envanter.ekle(id)) {
      return this.mesaj('Çantan dolu! Önce elindeki bloklardan birkaçını yerleştir.'), false;
    }
    this.dunya.koy(h.x, h.y, h.z, B.HAVA);
    this.dunya.blokDegisti(h.x, h.z);
    return true;
  }

  yerlestir() {
    const h = this.hedef;
    if (!h) return false;
    const x = h.x + h.nx;
    const y = h.y + h.ny;
    const z = h.z + h.nz;
    if (!this.dunya.sinirda(x, y, z) || y >= this.dunya.H - 2) return this.mesaj('Buraya blok konulamaz.'), false;
    const s = this.envanter.seciliYuva;
    if (s.adet <= 0) {
      this.mesaj(
        s.sabit
          ? `${BLOKLAR[s.id].ad} henüz yok. Değer bloklarını görevlerde doğru kararlar vererek kazanırsın.`
          : 'Bu yuva boş. Blok kırarak toplayabilirsin.'
      );
      return false;
    }
    if (katiMi(this.dunya.al(x, y, z))) return false;
    if (this.oyuncu.hucreyleKesisir(x, y, z)) return false;
    const id = this.envanter.harca();
    this.dunya.koy(x, y, z, id);
    this.dunya.blokDegisti(x, z);
    return true;
  }
}
