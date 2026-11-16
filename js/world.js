import * as THREE from '../vendor/three.module.min.js';
import { B, BLOKLAR, katiMi, opakMi } from './blocks.js';

export const PARCA = 16; // bir parçanın (chunk) yatay kenarı

// Bölge numaraları
export const BOLGE = { MEYDAN: 0, DOGRULUK: 1, MERHAMET: 2, ADAP: 3, VATAN: 4 };
export const BOLGE_ADLARI = [
  'Köy Meydanı',
  'Doğruluk Çarşısı',
  'Merhamet Bahçesi',
  'Adap Konağı',
  'Vatan Tepesi',
];

// Yüz tanımları: eksen, yön, gölge çarpanı
const YUZLER = [
  { a: 0, s: 1, golge: 0.82 },
  { a: 0, s: -1, golge: 0.82 },
  { a: 1, s: 1, golge: 1.0 },
  { a: 1, s: -1, golge: 0.55 },
  { a: 2, s: 1, golge: 0.68 },
  { a: 2, s: -1, golge: 0.68 },
];
const AO_CARPAN = [0.55, 0.72, 0.87, 1.0];

function karma(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export class World {
  constructor(W, H, D) {
    this.W = W;
    this.H = H;
    this.D = D;
    this.veri = new Uint8Array(W * H * D);
    this.merkezX = W / 2;
    this.merkezZ = D / 2;
    this.parcalar = new Map(); // "px,pz" -> Mesh
    this.grup = new THREE.Group();
    // Bölge renk doygunlukları (0 = gri, 1 = tam renk); shader'a gider.
    // 6. değer (dizin 5) hep 1'dir: değer blokları her zaman renklidir.
    this.doygunluk = { value: new Float32Array([0.12, 0.12, 0.12, 0.12, 0.12, 1]) };
    this.dalga = { value: new THREE.Vector4(0, 0, -1, -1) }; // renk dalgası: merkez x, z, yarıçap, bölge
    this.malzeme = this._malzemeOlustur();
    this._renkler = BLOKLAR.map((b) => new THREE.Color(b.renk));
    this.korumalar = new Map(); // "x,y,z" -> kırılamama açıklaması
  }

  sinirda(x, y, z) {
    return x >= 0 && x < this.W && y >= 0 && y < this.H && z >= 0 && z < this.D;
  }

  al(x, y, z) {
    if (y >= this.H) return B.HAVA;
    if (x < 0 || x >= this.W || z < 0 || z >= this.D || y < 0) return B.TAS;
    return this.veri[x + z * this.W + y * this.W * this.D];
  }

  koy(x, y, z, id) {
    if (!this.sinirda(x, y, z)) return;
    this.veri[x + z * this.W + y * this.W * this.D] = id;
  }

  kati(x, y, z) {
    return katiMi(this.al(Math.floor(x), Math.floor(y), Math.floor(z)));
  }

  // (x,z) sütunundaki en üst dolu bloğun y değeri
  tepe(x, z) {
    for (let y = this.H - 1; y >= 0; y--) if (this.al(x, y, z) !== B.HAVA) return y;
    return -1;
  }

  bolge(x, z) {
    const dx = x - this.merkezX;
    const dz = z - this.merkezZ;
    if (dx * dx + dz * dz < 16 * 16) return BOLGE.MEYDAN;
    if (Math.abs(dx) > Math.abs(dz)) return dx > 0 ? BOLGE.DOGRULUK : BOLGE.MERHAMET;
    return dz > 0 ? BOLGE.ADAP : BOLGE.VATAN;
  }

  _malzemeOlustur() {
    // Bloklara hafif "piksel" dokusu veren özgün, yordamsal doku
    const c = document.createElement('canvas');
    c.width = c.height = 16;
    const g = c.getContext('2d');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const kenar = x === 0 || y === 0 || x === 15 || y === 15;
        const v = Math.floor((kenar ? 196 : 222) + karma(x, y, 7) * 33);
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.fillRect(x, y, 1, 1);
      }
    }
    const doku = new THREE.CanvasTexture(c);
    doku.magFilter = THREE.NearestFilter;
    doku.minFilter = THREE.NearestMipmapLinearFilter;
    doku.colorSpace = THREE.SRGBColorSpace;

    const m = new THREE.MeshBasicMaterial({ map: doku, vertexColors: true });
    const doygunluk = this.doygunluk;
    const dalga = this.dalga;
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uDoygunluk = doygunluk;
      sh.uniforms.uDalga = dalga;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float bolge;\nuniform float uDoygunluk[6];\nuniform vec4 uDalga;')
        .replace(
          '#include <color_vertex>',
          `#include <color_vertex>
           float dk_gri = dot(vColor.rgb, vec3(0.299, 0.587, 0.114));
           float dk_s = uDoygunluk[int(bolge + 0.5)];
           float dk_bant = 0.0;
           if (abs(bolge - uDalga.w) < 0.5) {
             // Bölge tamamlanınca merkezden yayılan renk dalgası ve parlak ön kenarı
             float dk_u = distance(position.xz, uDalga.xy);
             dk_s = max(dk_s, 1.0 - smoothstep(uDalga.z - 5.0, uDalga.z, dk_u));
             dk_bant = 1.0 - smoothstep(0.0, 2.5, abs(dk_u - uDalga.z + 1.5));
           }
           vColor.rgb = mix(vec3(dk_gri), vColor.rgb, dk_s) + vec3(dk_bant * 0.28);`
        );
    };
    return m;
  }

  tumunuOr() {
    for (let pz = 0; pz < this.D / PARCA; pz++)
      for (let px = 0; px < this.W / PARCA; px++) this.parcaOr(px, pz);
  }

  // Birçok bloğu birden değiştirir ve etkilenen parçaları bir kez örer.
  // liste: [x, y, z, id] dizileri
  topluDegistir(liste) {
    const parcalar = new Set();
    for (const [x, y, z, id] of liste) {
      this.koy(x, y, z, id);
      for (let dz = -1; dz <= 1; dz++)
        for (let dx = -1; dx <= 1; dx++)
          parcalar.add(Math.floor((x + dx) / PARCA) + ',' + Math.floor((z + dz) / PARCA));
    }
    for (const a of parcalar) {
      const [px, pz] = a.split(',').map(Number);
      this.parcaOr(px, pz);
    }
  }

  koru(x, y, z, aciklama) {
    this.korumalar.set(x + ',' + y + ',' + z, aciklama);
  }

  // Bir blok değişince onu içeren ve ona komşu parçaları yeniden örer
  blokDegisti(x, z) {
    const yapilan = new Set();
    for (let dz = -1; dz <= 1; dz++)
      for (let dx = -1; dx <= 1; dx++) {
        const px = Math.floor((x + dx) / PARCA);
        const pz = Math.floor((z + dz) / PARCA);
        const a = px + ',' + pz;
        if (yapilan.has(a)) continue;
        yapilan.add(a);
        this.parcaOr(px, pz);
      }
  }

  parcaOr(px, pz) {
    if (px < 0 || pz < 0 || px >= this.W / PARCA || pz >= this.D / PARCA) return;
    const anahtar = px + ',' + pz;
    const konum = [];
    const renk = [];
    const uv = [];
    const bolgeler = [];
    const dizin = [];
    const p = [0, 0, 0];
    const n = [0, 0, 0];
    const ao = [0, 0, 0, 0];
    const KOSE = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];

    for (let y = 0; y < this.H; y++) {
      for (let z = pz * PARCA; z < (pz + 1) * PARCA; z++) {
        for (let x = px * PARCA; x < (px + 1) * PARCA; x++) {
          const id = this.al(x, y, z);
          if (id === B.HAVA) continue;
          const r = this._renkler[id];
          const oynama = 0.94 + karma(x, y, z) * 0.12;
          const blg = BLOKLAR[id].deger || BLOKLAR[id].renkli ? 5 : this.bolge(x, z);
          for (const f of YUZLER) {
            n[0] = n[1] = n[2] = 0;
            n[f.a] = f.s;
            const komsu = this.al(x + n[0], y + n[1], z + n[2]);
            if (opakMi(komsu) || komsu === id) continue;
            const u = (f.a + 1) % 3;
            const v = (f.a + 2) % 3;
            const taban = konum.length / 3;
            for (let k = 0; k < 4; k++) {
              const cu = KOSE[k][0];
              const cv = KOSE[k][1];
              p[0] = x;
              p[1] = y;
              p[2] = z;
              p[f.a] += f.s > 0 ? 1 : 0;
              p[u] += cu;
              p[v] += cv;
              konum.push(p[0], p[1], p[2]);
              uv.push(cu, cv);
              bolgeler.push(blg);
              // Köşe karartması (ambient occlusion)
              const q = [x + n[0], y + n[1], z + n[2]];
              const du = cu ? 1 : -1;
              const dv = cv ? 1 : -1;
              q[u] += du;
              const s1 = opakMi(this.al(q[0], q[1], q[2])) ? 1 : 0;
              q[v] += dv;
              const kk = opakMi(this.al(q[0], q[1], q[2])) ? 1 : 0;
              q[u] -= du;
              const s2 = opakMi(this.al(q[0], q[1], q[2])) ? 1 : 0;
              ao[k] = s1 && s2 ? 0 : 3 - (s1 + s2 + kk);
              const c = f.golge * oynama * AO_CARPAN[ao[k]];
              renk.push(r.r * c, r.g * c, r.b * c);
            }
            // Sarım yönü: +eksen için 0,1,2,3 saat yönünün tersidir
            const cevir = ao[0] + ao[2] < ao[1] + ao[3];
            let sira = cevir ? [1, 2, 3, 1, 3, 0] : [0, 1, 2, 0, 2, 3];
            if (f.s < 0) sira = sira.slice().reverse();
            for (const i of sira) dizin.push(taban + i);
          }
        }
      }
    }

    let ag = this.parcalar.get(anahtar);
    if (ag) ag.geometry.dispose();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(konum, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(renk, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setAttribute('bolge', new THREE.Float32BufferAttribute(bolgeler, 1));
    geo.setIndex(dizin);
    geo.computeBoundingSphere();
    if (ag) {
      ag.geometry = geo;
    } else {
      ag = new THREE.Mesh(geo, this.malzeme);
      this.parcalar.set(anahtar, ag);
      this.grup.add(ag);
    }
  }
}
