// Bütün sesler ve müzik tarayıcıda (Web Audio) üretilir; ses dosyası kullanılmaz.

const AYAR_ANAHTARI = 'kalbinKahramanlari.ses.v1';
const NOTA = (n) => 440 * Math.pow(2, (n - 69) / 12); // MIDI numarası -> frekans

// Akor dizileri (MIDI notaları). Köy griyken hüzünlü, renklendikçe neşeli.
const GRI_AKORLAR = [
  [57, 60, 64], // La minör
  [53, 57, 60], // Fa
  [57, 60, 64],
  [52, 55, 59], // Mi minör
];
const RENKLI_AKORLAR = [
  [60, 64, 67], // Do
  [57, 60, 64], // La minör
  [53, 57, 60], // Fa
  [55, 59, 62], // Sol
];
const PENTATONIK = [0, 2, 4, 7, 9];

export class Ses {
  constructor() {
    this.ayar = { muzik: true, efekt: true };
    try {
      Object.assign(this.ayar, JSON.parse(localStorage.getItem(AYAR_ANAHTARI) || '{}'));
    } catch {
      /* varsayılan ayarlar */
    }
    this.katman = 0; // renklenen bölge sayısı; müziği zenginleştirir
    this.adim = 0;
    this.sonNota = 2;
  }

  // Tarayıcılar sesi ancak kullanıcı bir düğmeye bastıktan sonra açar
  baslat() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.ana = this.ctx.createGain();
      this.ana.gain.value = 0.9;
      this.ana.connect(this.ctx.destination);
      this.muzikYolu = this.ctx.createGain();
      this.muzikYolu.gain.value = this.ayar.muzik ? 1 : 0;
      this.muzikYolu.connect(this.ana);
      this.efektYolu = this.ctx.createGain();
      this.efektYolu.connect(this.ana);
      this.sonraki = this.ctx.currentTime + 0.2;
      setInterval(() => this._muzikPlanla(), 120);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  ayarla(ad, deger) {
    this.ayar[ad] = deger;
    try {
      localStorage.setItem(AYAR_ANAHTARI, JSON.stringify(this.ayar));
    } catch {
      /* yok say */
    }
    if (ad === 'muzik' && this.ctx) {
      this.muzikYolu.gain.setTargetAtTime(deger ? 1 : 0, this.ctx.currentTime, 0.15);
    }
  }

  // Tek bir nota: yumuşak giriş ve sönüş
  _nota(yol, frekans, zaman, sure, { tur = 'sine', guc = 0.1, giris = 0.01, kayma = 0 } = {}) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = tur;
    o.frequency.setValueAtTime(frekans, zaman);
    if (kayma) o.frequency.exponentialRampToValueAtTime(kayma, zaman + sure);
    g.gain.setValueAtTime(0.0001, zaman);
    g.gain.linearRampToValueAtTime(guc, zaman + giris);
    g.gain.exponentialRampToValueAtTime(0.0001, zaman + sure);
    o.connect(g);
    g.connect(yol);
    o.start(zaman);
    o.stop(zaman + sure + 0.05);
  }

  _gurultu(zaman, sure, guc, kesim) {
    const n = Math.floor(this.ctx.sampleRate * sure);
    const tampon = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const v = tampon.getChannelData(0);
    for (let i = 0; i < n; i++) v[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const k = this.ctx.createBufferSource();
    k.buffer = tampon;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = kesim;
    const g = this.ctx.createGain();
    g.gain.value = guc;
    k.connect(f);
    f.connect(g);
    g.connect(this.efektYolu);
    k.start(zaman);
  }

  // Ses efektleri. gecikme: saniye
  cal(ad, gecikme = 0) {
    if (!this.ctx || !this.ayar.efekt) return;
    const t = this.ctx.currentTime + gecikme + 0.01;
    const e = this.efektYolu;
    const dizi = (notalar, aralik, sure, secenek) =>
      notalar.forEach((n, i) => this._nota(e, NOTA(n), t + i * aralik, sure, secenek));
    switch (ad) {
      case 'tik':
        this._nota(e, 700, t, 0.06, { guc: 0.05 });
        break;
      case 'gez':
        this._nota(e, 520, t, 0.04, { guc: 0.04 });
        break;
      case 'konus':
        dizi([69, 74], 0.08, 0.14, { tur: 'triangle', guc: 0.07 });
        break;
      case 'dogru':
        dizi([72, 76, 79], 0.09, 0.22, { tur: 'triangle', guc: 0.11 });
        break;
      case 'yanlis': // cezalandırmayan, yumuşak bir "bir daha düşün" sesi
        this._nota(e, 330, t, 0.18, { guc: 0.08 });
        this._nota(e, 262, t + 0.16, 0.3, { guc: 0.08 });
        break;
      case 'koy':
        this._nota(e, 170, t, 0.1, { tur: 'triangle', guc: 0.16, kayma: 95 });
        break;
      case 'kir':
        this._gurultu(t, 0.12, 0.2, 900);
        this._nota(e, 120, t, 0.08, { tur: 'triangle', guc: 0.08, kayma: 70 });
        break;
      case 'gorev':
        dizi([72, 76, 79, 84], 0.11, 0.35, { tur: 'triangle', guc: 0.11 });
        this._nota(e, NOTA(96), t + 0.44, 0.5, { guc: 0.04 });
        break;
      case 'bolge':
        dizi([67, 72, 76, 79], 0.14, 0.3, { tur: 'triangle', guc: 0.11 });
        [72, 76, 79, 84].forEach((n) => this._nota(e, NOTA(n), t + 0.6, 1.4, { tur: 'triangle', guc: 0.07, giris: 0.03 }));
        break;
      case 'anit':
        dizi([60, 64, 67, 72, 76, 79], 0.13, 0.35, { tur: 'triangle', guc: 0.1 });
        [72, 76, 79, 84].forEach((n) => this._nota(e, NOTA(n), t + 0.85, 0.7, { tur: 'triangle', guc: 0.07 }));
        [65, 69, 72, 77].forEach((n) => this._nota(e, NOTA(n), t + 1.6, 0.7, { tur: 'triangle', guc: 0.07 }));
        [67, 72, 76, 79, 84, 88].forEach((n) => this._nota(e, NOTA(n), t + 2.35, 2.2, { tur: 'triangle', guc: 0.06, giris: 0.04 }));
        break;
      default:
    }
  }

  // Arka plan müziği: sakin, kendini tekrar etmeyen bir ezgi.
  // Sekizlik adımlarla ilerler; her ölçü 8 adımdır.
  _muzikPlanla() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const adimSuresi = 0.36;
    if (this.sonraki < this.ctx.currentTime) this.sonraki = this.ctx.currentTime + 0.05;
    while (this.sonraki < this.ctx.currentTime + 0.4) {
      const t = this.sonraki;
      const olcu = Math.floor(this.adim / 8) % 4;
      const vurus = this.adim % 8;
      const renkli = this.katman >= 2;
      const akor = (renkli ? RENKLI_AKORLAR : GRI_AKORLAR)[olcu];
      const y = this.muzikYolu;

      if (vurus === 0) {
        // dolgu akoru
        for (const n of akor) this._nota(y, NOTA(n), t, adimSuresi * 8.5, { guc: 0.028, giris: 0.5 });
      }
      if (this.katman >= 1 && (vurus === 0 || vurus === 4)) {
        this._nota(y, NOTA(akor[0] - 12), t, adimSuresi * 3.5, { guc: 0.07, giris: 0.03 });
      }
      if (this.katman >= 3) {
        const n = akor[vurus % 3] + 12;
        this._nota(y, NOTA(n), t, adimSuresi * 0.9, { tur: 'triangle', guc: 0.018 });
      }
      // ezgi: pentatonik dizide küçük adımlarla gezinir
      const olasilik = [0.3, 0.42, 0.5, 0.58, 0.66, 0.7][Math.min(5, this.katman)];
      if (vurus % 2 === 0 ? Math.random() < olasilik + 0.2 : Math.random() < olasilik - 0.2) {
        this.sonNota = Math.max(0, Math.min(9, this.sonNota + Math.floor(Math.random() * 5) - 2));
        const kok = renkli ? 72 : 69;
        const n = kok + PENTATONIK[this.sonNota % 5] + 12 * Math.floor(this.sonNota / 5);
        this._nota(y, NOTA(n), t, adimSuresi * 2.2, { tur: 'triangle', guc: 0.045, giris: 0.02 });
        if (this.katman >= 5) this._nota(y, NOTA(n + 12), t, adimSuresi * 1.6, { guc: 0.014 });
      }
      this.adim++;
      this.sonraki += adimSuresi;
    }
  }
}
