// Ekranın altında, büyük yazıyla gösterilen konuşma kutusu.
// Düğüm alanları: metin, secenekler [{metin, git, etki}], git, konusan, giris().
// Sayfa sayfa ilerler; seçenekler sayı tuşları, W/S + E ya da dokunarak seçilir.

export class Diyalog {
  constructor(kok) {
    this.kok = kok;
    this.adEl = kok.querySelector('.d-ad');
    this.metinEl = kok.querySelector('.d-metin');
    this.secenekEl = kok.querySelector('.d-secenekler');
    this.ipucuEl = kok.querySelector('.d-ipucu');
    this.acik = false;
    this.karakter = null;
    this.secili = 0;
    this.kapaninca = null;
    this.acildigiAn = 0;

    this.secenekEl.addEventListener('pointerdown', (e) => {
      const el = e.target.closest('.d-secenek');
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      this.sec(Number(el.dataset.i));
    });
    kok.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.ilerle();
    });
  }

  baslat(karakter, diyalog = karakter.diyalog) {
    this.karakter = karakter;
    this.diyalog = diyalog;
    this.acik = true;
    this.acildigiAn = performance.now();
    this.kok.classList.remove('gizli');
    this._dugumeGit(diyalog.baslangic);
  }

  kapat() {
    if (!this.acik) return;
    this.acik = false;
    this.karakter = null;
    this.kok.classList.add('gizli');
    if (this.kapaninca) this.kapaninca();
  }

  _dugumeGit(ad) {
    const d = ad && this.diyalog.dugumler[ad];
    if (!d) return this.kapat();
    this.dugum = d;
    this.sayfalar = Array.isArray(d.metin) ? d.metin : [d.metin];
    this.sayfa = 0;
    this.secili = 0;
    this._ciz();
    if (d.giris) d.giris();
  }

  get seceneklerGorunur() {
    return this.acik && this.sayfa === this.sayfalar.length - 1 && !!this.dugum.secenekler;
  }

  // E / tık / dokunma: sonraki sayfa, seçili seçenek ya da kapanış
  ilerle() {
    if (!this.acik || performance.now() - this.acildigiAn < 250) return;
    if (this.sayfa < this.sayfalar.length - 1) {
      this.sayfa++;
      this._ciz();
    } else if (this.dugum.secenekler) {
      this.sec(this.secili);
    } else {
      this._dugumeGit(this.dugum.git);
    }
  }

  sec(i) {
    if (!this.seceneklerGorunur) return;
    const s = this.dugum.secenekler[i];
    if (!s) return;
    if (s.etki) s.etki();
    this._dugumeGit(s.git);
  }

  secimiKaydir(yon) {
    if (!this.seceneklerGorunur) return;
    const n = this.dugum.secenekler.length;
    this.secili = (this.secili + yon + n) % n;
    this._ciz();
  }

  _ciz() {
    const adKoy = (m) => m.replaceAll('{ad}', this.oyuncuAdi || 'evladım');
    this.adEl.textContent = this.dugum.konusan || this.karakter.ad;
    this.kok.classList.toggle('anlatici', this.dugum.konusan === 'Anlatıcı');
    this.metinEl.textContent = adKoy(this.sayfalar[this.sayfa]);
    this.secenekEl.innerHTML = '';
    const secenekli = this.seceneklerGorunur;
    if (secenekli) {
      this.dugum.secenekler.forEach((s, i) => {
        const el = document.createElement('button');
        el.className = 'd-secenek' + (i === this.secili ? ' secili' : '');
        el.dataset.i = i;
        el.innerHTML = `<span class="d-no">${i + 1}</span>`;
        el.appendChild(document.createTextNode(adKoy(s.metin)));
        this.secenekEl.appendChild(el);
      });
    }
    const dokunmatik = document.body.classList.contains('dokunmatik');
    this.ipucuEl.textContent = secenekli
      ? dokunmatik ? 'Bir seçeneğe dokun' : 'Seçmek için sayı tuşuna bas (ya da W/S ile gez, E ile seç)'
      : dokunmatik ? 'Devam etmek için dokun ▸' : 'Devam etmek için E ▸';
  }
}
