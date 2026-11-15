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

  ciz(oyuncu, isaretler, zaman) {
    const g = this.g;
    const boyut = this.tuval.width;
    const olcek = boyut / this.dunya.W;
    g.imageSmoothingEnabled = false;
    g.drawImage(this.taban, 0, 0, boyut, boyut);

    // görev noktaları
    const nabiz = 1 + 0.25 * Math.sin(zaman * 5);
    for (const n of isaretler) {
      const x = n.x * olcek;
      const y = n.z * olcek;
      g.beginPath();
      g.arc(x, y, 7 * nabiz, 0, Math.PI * 2);
      g.fillStyle = '#' + BOLGE_RENKLERI[n.bolge].toString(16).padStart(6, '0');
      g.fill();
      g.lineWidth = 2.5;
      g.strokeStyle = '#fff';
      g.stroke();
    }

    // oyuncu oku
    g.save();
    g.translate(oyuncu.konum.x * olcek, oyuncu.konum.z * olcek);
    g.rotate(-oyuncu.yon);
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
    g.font = 'bold 15px "Trebuchet MS", sans-serif';
    g.textAlign = 'center';
    g.lineWidth = 3;
    g.strokeStyle = 'rgba(30,36,46,0.8)';
    g.fillStyle = '#fff';
    g.strokeText('K', boyut / 2, 16);
    g.fillText('K', boyut / 2, 16);
  }
}
