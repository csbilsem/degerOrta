import { BLOKLAR } from './blocks.js';
import { BOLGE_RENKLERI } from './quests.js';

// Köyün kuşbakışı küçük haritası: kuzey yukarıda, oyuncu ok ile, görev
// yerleri bölge renginde yanıp sönen noktalarla gösterilir.
export class Harita {
  constructor(tuval, dunya) {
    this.tuval = tuval;
    this.dunya = dunya;
    this.g = tuval.getContext('2d');
    this.taban = document.createElement('canvas');
    this.taban.width = dunya.W;
    this.taban.height = dunya.D;
    this.tabanCiz();
  }

  // Her sütunun en üst bloğunun rengiyle taban resmini üretir.
  // doygunluk: bölgelerin renk miktarı (gri köy -> renkli köy)
  tabanCiz(doygunluk = [0.12, 0.12, 0.12, 0.12, 0.12]) {
    const { W, D } = this.dunya;
    const g = this.taban.getContext('2d');
    const resim = g.createImageData(W, D);
    for (let z = 0; z < D; z++) {
      for (let x = 0; x < W; x++) {
        const y = this.dunya.tepe(x, z);
        const id = this.dunya.al(x, y, z);
        const renk = BLOKLAR[id].renk;
        let r = (renk >> 16) & 255;
        let gr = (renk >> 8) & 255;
        let b = renk & 255;
        const s = BLOKLAR[id].deger ? 1 : Math.min(1, doygunluk[this.dunya.bolge(x, z)] + 0.25);
        const gri = 0.299 * r + 0.587 * gr + 0.114 * b;
        const isik = 0.82 + Math.min(0.18, Math.max(-0.12, (y - 10) * 0.012));
        r = (gri + (r - gri) * s) * isik;
        gr = (gri + (gr - gri) * s) * isik;
        b = (gri + (b - gri) * s) * isik;
        const i = (x + z * W) * 4;
        resim.data[i] = r;
        resim.data[i + 1] = gr;
        resim.data[i + 2] = b;
        resim.data[i + 3] = 255;
      }
    }
    g.putImageData(resim, 0, 0);
  }

  // Görünüm: 0 = bütün köy, 1 = yakın (oyuncuyu izler), 2 = büyük harita
  gorunumDegistir() {
    this.gorunum = ((this.gorunum || 0) + 1) % 3;
    const buyuk = this.gorunum === 2;
    this.tuval.classList.toggle('buyuk', buyuk);
    this.tuval.width = this.tuval.height = buyuk ? 760 : 340;
    return this.gorunum;
  }

  ciz(oyuncu, isaretler, zaman) {
    const g = this.g;
    const boyut = this.tuval.width;
    const gorunum = this.gorunum || 0;
    const yakin = gorunum === 1;
    const buyuk = gorunum === 2;
    const olcek = (boyut / this.dunya.W) * (yakin ? 3 : 1);
    // haritanın sol üst köşesine denk gelen dünya koordinatı
    let ox = 0;
    let oz = 0;
    if (yakin) {
      const yari = boyut / olcek / 2;
      ox = Math.max(0, Math.min(this.dunya.W - 2 * yari, oyuncu.konum.x - yari));
      oz = Math.max(0, Math.min(this.dunya.D - 2 * yari, oyuncu.konum.z - yari));
    }
    const k = buyuk ? 1.6 : 1; // işaret büyüklüğü
    g.imageSmoothingEnabled = false;
    g.drawImage(this.taban, -ox * olcek, -oz * olcek, this.dunya.W * olcek, this.dunya.D * olcek);

    if (buyuk) {
      g.font = 'bold 22px "Trebuchet MS", sans-serif';
      g.textAlign = 'center';
      g.lineWidth = 5;
      g.strokeStyle = 'rgba(30,36,46,0.85)';
      g.fillStyle = '#fff';
      for (const [ad, x, z] of [
        ['Köy Meydanı', 64, 80], ['Doğruluk Çarşısı', 98, 48], ['Merhamet Bahçesi', 30, 48],
        ['Adap Konağı', 64, 113], ['Vatan Tepesi', 64, 8],
      ]) {
        g.strokeText(ad, x * olcek, z * olcek);
        g.fillText(ad, x * olcek, z * olcek);
      }
    }

    // görev noktaları (yakın görünümde harita dışında kalanlar kenarda gösterilir)
    const nabiz = 1 + 0.25 * Math.sin(zaman * 5);
    for (const n of isaretler) {
      let x = (n.x - ox) * olcek;
      let y = (n.z - oz) * olcek;
      const disarida = x < 8 || y < 8 || x > boyut - 8 || y > boyut - 8;
      x = Math.max(9, Math.min(boyut - 9, x));
      y = Math.max(9, Math.min(boyut - 9, y));
      g.beginPath();
      g.arc(x, y, (disarida ? 5 : 7 * nabiz) * k, 0, Math.PI * 2);
      g.fillStyle = '#' + BOLGE_RENKLERI[n.bolge].toString(16).padStart(6, '0');
      g.fill();
      g.lineWidth = 2.5 * k;
      g.strokeStyle = '#fff';
      g.stroke();
    }

    // oyuncu oku
    g.save();
    g.translate((oyuncu.konum.x - ox) * olcek, (oyuncu.konum.z - oz) * olcek);
    g.rotate(-oyuncu.yon);
    g.scale(k, k);
    g.beginPath();
    g.moveTo(0, -10);
    g.lineTo(7, 8);
    g.lineTo(0, 4);
    g.lineTo(-7, 8);
    g.closePath();
    g.fillStyle = '#fff';
    g.strokeStyle = '#1e242e';
    g.lineWidth = 2.5;
    g.stroke();
    g.fill();
    g.restore();

    // kuzey işareti
    g.font = `bold ${15 * k}px "Trebuchet MS", sans-serif`;
    g.textAlign = 'center';
    g.lineWidth = 3;
    g.strokeStyle = 'rgba(30,36,46,0.8)';
    g.fillStyle = '#fff';
    g.strokeText('K', boyut / 2, 16 * k);
    g.fillText('K', boyut / 2, 16 * k);
  }
}
