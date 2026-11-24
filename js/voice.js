// Konuşma metinlerini seslendirir. Tarayıcının kendi Türkçe sesini (Web Speech API)
// kullanır; ses dosyası gerekmez. Cihazda Türkçe ses yoksa sessiz kalır.

const AYAR_ANAHTARI = 'kalbinKahramanlari.seslendirme.v1';

export class Seslendirme {
  constructor() {
    this.destek = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    this.acik = true;
    try {
      const kayit = localStorage.getItem(AYAR_ANAHTARI);
      if (kayit !== null) this.acik = kayit === '1';
    } catch {
      /* varsayılan: açık */
    }
    this.ses = null;
    if (this.destek) {
      this._sesSec();
      speechSynthesis.addEventListener?.('voiceschanged', () => this._sesSec());
    }
  }

  // Türkçe sesler arasından en doğal olanı seçer (Edge'in "Online (Natural)" sesleri, iPad'in Yelda'sı vb.)
  _sesSec() {
    const sesler = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('tr'));
    const puan = (v) => (/natural|online|neural/i.test(v.name) ? 3 : 0) + (/google|yelda|emel|ahmet|tolga/i.test(v.name) ? 1 : 0);
    this.ses = sesler.sort((a, b) => puan(b) - puan(a))[0] || null;
    if (this.degisince) this.degisince();
  }

  get turkceVar() {
    return !!this.ses;
  }

  ayarla(acik) {
    this.acik = acik;
    try {
      localStorage.setItem(AYAR_ANAHTARI, acik ? '1' : '0');
    } catch {
      /* yok say */
    }
    if (!acik) this.sus();
  }

  // iPad'de konuşma ilk kez ancak bir dokunuşla başlatılabilir; başlat düğmesinde çağrılır
  kilidiAc() {
    if (!this.destek || this._acildi) return;
    this._acildi = true;
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  }

  oku(metin) {
    if (!this.destek || !this.acik || !this.ses || !metin) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(metin);
    u.voice = this.ses;
    u.lang = this.ses.lang;
    u.rate = 0.95;
    speechSynthesis.speak(u);
  }

  sus() {
    if (this.destek) speechSynthesis.cancel();
  }
}
