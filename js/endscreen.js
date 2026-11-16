// Son ekran (oyuncu için) ve öğretmen özeti (karar istatistikleri).
// Araştırma etiği gereği özet ve dışa aktarılan veri öğrenci adını içermez.

import { BOLGE_ADLARI } from './world.js';

const DEGERLER = [
  null,
  { ad: 'Doğru sözlülük', renk: '#2f7fe0', ders: 'Sözünde ve davranışında doğru olan insana herkes güvenir.' },
  { ad: 'Merhamet', renk: '#22b455', ders: 'İnsanlara ve bütün canlılara şefkatle yaklaşmak kalbi güzelleştirir.' },
  { ad: 'Adap', renk: '#8e5bd6', ders: 'Selam, güzel söz ve nezaket gönül kapılarını açar.' },
  { ad: 'Vatan sevgisi', renk: '#e02a2a', ders: 'Vatanını seven; çalışır, korur ve güzelleştirir.' },
];

const kacis = (m) =>
  String(m ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function sureYaz(saniye) {
  const dk = Math.floor((saniye || 0) / 60);
  const sn = Math.floor((saniye || 0) % 60);
  return dk ? `${dk} dk ${sn} sn` : `${sn} sn`;
}

// Kararları soru bazında toplar: ilk seçim, ilk denemede doğru mu, kaç deneme
export function ozetVerisi(gorevler) {
  const sorular = new Map();
  for (const k of gorevler.kayit.kararlar) {
    let s = sorular.get(k.soru);
    if (!s) {
      const q = gorevler.gorevler.find((g) => g.kimlik === k.gorev);
      s = {
        bolge: q ? q.bolge : 0,
        gorev: q ? q.ad : k.gorev,
        soru: k.soruMetni || k.soru,
        ilkSecim: k.secimMetni || `Seçenek ${k.secim + 1}`,
        ilkDogru: !!k.dogru,
        deneme: 0,
        cozuldu: false,
      };
      sorular.set(k.soru, s);
    }
    s.deneme++;
    if (k.dogru) s.cozuldu = true;
  }
  const liste = [...sorular.values()].sort((a, b) => a.bolge - b.bolge);
  const bolgeler = [1, 2, 3, 4].map((b) => {
    const sl = liste.filter((s) => s.bolge === b);
    return {
      bolge: b,
      ad: BOLGE_ADLARI[b],
      deger: DEGERLER[b].ad,
      soru: sl.length,
      ilkDogru: sl.filter((s) => s.ilkDogru).length,
      yanlisDeneme: sl.reduce((t, s) => t + s.deneme - (s.cozuldu ? 1 : 0), 0),
      puan: gorevler.kayit.puan[b],
    };
  });
  return {
    liste,
    bolgeler,
    soru: liste.length,
    ilkDogru: liste.filter((s) => s.ilkDogru).length,
    gorev: gorevler.kayit.biten.length,
    anit: gorevler.kayit.anit,
    sure: gorevler.kayit.sure || 0,
  };
}

export function sonEkraniDoldur(el, gorevler) {
  const o = ozetVerisi(gorevler);
  const ad = gorevler.kayit.ad;
  el.querySelector('.son-baslik').textContent = ad ? `Tebrikler ${ad}!` : 'Tebrikler!';
  el.querySelector('.son-degerler').innerHTML = [1, 2, 3, 4]
    .map(
      (b) => `<div class="son-deger" style="border-color:${DEGERLER[b].renk}">
        <span class="son-kup" style="background:${DEGERLER[b].renk}"></span>
        <div><b>${DEGERLER[b].ad}</b><br>${DEGERLER[b].ders}</div></div>`
    )
    .join('');
  el.querySelector('.son-sayilar').textContent =
    `${o.gorev} görev tamamlandı · ${o.soru} kararın ${o.ilkDogru} tanesi ilk denemede doğru · Süre: ${sureYaz(o.sure)}`;
}

export function ozetiDoldur(el, gorevler) {
  const o = ozetVerisi(gorevler);
  const tarih = new Date().toLocaleDateString('tr-TR');
  let h = `<p class="ozet-ust">Tarih: ${tarih} · Oynama süresi: ${sureYaz(o.sure)} · Tamamlanan görev: ${o.gorev}/12 ·
    Değerler Anıtı: ${o.anit ? 'tamamlandı' : 'tamamlanmadı'}</p>
    <table class="ozet-tablo"><thead><tr><th>Değer</th><th>Karar sayısı</th><th>İlk denemede doğru</th><th>Yanlış deneme</th><th>Değer puanı</th></tr></thead><tbody>`;
  for (const b of o.bolgeler) {
    h += `<tr><td><b>${b.deger}</b> <small>(${b.ad})</small></td><td>${b.soru}</td><td>${b.ilkDogru}</td><td>${b.yanlisDeneme}</td><td>${b.puan}</td></tr>`;
  }
  h += `<tr class="toplam"><td>Toplam</td><td>${o.soru}</td><td>${o.ilkDogru}</td><td>${o.bolgeler.reduce((t, b) => t + b.yanlisDeneme, 0)}</td><td>${o.bolgeler.reduce((t, b) => t + b.puan, 0)}</td></tr></tbody></table>`;
  if (!o.liste.length) h += '<p>Henüz kayıtlı bir karar yok.</p>';
  else {
    h += `<h3>Kararların ayrıntısı</h3><table class="ozet-tablo ayrinti"><thead><tr><th>Görev</th><th>Soru</th><th>İlk seçim</th><th>İlk denemede</th><th>Deneme</th></tr></thead><tbody>`;
    for (const s of o.liste) {
      h += `<tr><td>${kacis(s.gorev)}<br><small>${kacis(BOLGE_ADLARI[s.bolge])}</small></td><td>${kacis(s.soru)}</td><td>${kacis(s.ilkSecim)}</td>
        <td class="${s.ilkDogru ? 'iyi' : 'kotu'}">${s.ilkDogru ? 'Doğru' : 'Yanlış'}</td><td>${s.deneme}${s.cozuldu ? '' : ' (çözülmedi)'}</td></tr>`;
    }
    h += '</tbody></table>';
  }
  h += '<p class="ozet-not">Bu özet öğrenci adını içermez. Veriler yalnızca bu cihazın tarayıcısında saklanır.</p>';
  el.querySelector('.ozet-icerik').innerHTML = h;
}

// Excel'de açılabilen, noktalı virgülle ayrılmış veri (ad içermez)
export function csvUret(gorevler) {
  const o = ozetVerisi(gorevler);
  const h = (m) => '"' + String(m).replace(/"/g, '""') + '"';
  const satirlar = [['bolge', 'gorev', 'soru', 'ilk_secim', 'ilk_denemede_dogru', 'deneme_sayisi'].join(';')];
  for (const s of o.liste) {
    satirlar.push([h(BOLGE_ADLARI[s.bolge]), h(s.gorev), h(s.soru), h(s.ilkSecim), s.ilkDogru ? 1 : 0, s.deneme].join(';'));
  }
  satirlar.push('', ['sure_saniye', Math.round(o.sure)].join(';'), ['tamamlanan_gorev', o.gorev].join(';'), ['anit', o.anit ? 1 : 0].join(';'));
  return '﻿' + satirlar.join('\r\n');
}
