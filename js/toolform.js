// Araç formu: her aracın girdileri tek tip, şık bir formla alınır (#arac/<id>). Alanlar whitelabel uygulamasındaki araç formlarından:
// sınıf seviyesi, ders, araca özel ayarlar (süre, zorluk, Bloom, soru dağılımı, plan türü, PDF yükleme...). Solda form, sağda canlı özet
// ve ana düğme; üretimden sonra demo çıktı + "Koleksiyona kaydet". Öğrenci ve öğretmen panelleri aynı modülü kendi araç listeleriyle kullanır.
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ic = (id) => `<svg class="icon" aria-hidden="true"><use href="#${id}" /></svg>`;
const DERS = {
  ilk: ["Türkçe", "Matematik", "Hayat Bilgisi", "Fen Bilimleri", "İngilizce"],
  orta: ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din Kültürü", "Bilişim Teknolojileri"],
  lise: ["Türk Dili ve Edebiyatı", "Matematik", "Fizik", "Kimya", "Biyoloji", "Tarih", "Coğrafya", "İngilizce", "Felsefe"],
};
const lvl = (g) => (+g <= 4 ? "ilk" : +g <= 8 ? "orta" : "lise");
const grade = (req = true) => ({ k: "sinif", type: "grade", label: "Sınıf seviyesi", req });
const ders = (req = true) => ({ k: "ders", type: "ders", label: "Ders", req });
const konu = () => ({ k: "konu", type: "text", label: "Konu / kazanım", ph: "Örn: Kesirlerle toplama", opt: true });
const mufredat = (extra = []) => ({ t: "Müfredat bilgileri", icon: "i-book", fields: [grade(), ders(), konu(), ...extra] });

// alan tipleri: grade, ders, seg (tek seçim), multi (çoklu), number (adım), text, textarea, counters, file, qmode
export const SCHEMAS = {
  /* ---------- öğretmen ---------- */
  "lesson-plan": { verb: "Planı oluştur", sections: [mufredat(),
    { t: "Öğrenme yöntemleri", icon: "i-layers", fields: [{ k: "yontem", type: "multi", label: "Kullanılacak yöntemler", opts: ["Anlatım", "Tartışma", "Örnek olay", "Soru-cevap", "Beyin fırtınası", "Gösterip yaptırma", "Bireysel çalışma", "Grup çalışması"], def: ["Soru-cevap", "Grup çalışması"] }] },
    { t: "Ek ayrıntılar", icon: "i-wand", opt: true, fields: [{ k: "fark", type: "textarea", label: "Farklılaştırma", ph: "Özel ihtiyaçlar için uyarlamalar…", opt: true }, { k: "tekno", type: "textarea", label: "Teknoloji entegrasyonu", ph: "Kullanılacak dijital araçlar…", opt: true }, { k: "ai", type: "textarea", label: "Yapay zekâ asistanı", ph: "Derste yapay zekâyı nasıl kullanmayı planlıyorsunuz?", opt: true }] }] },
  mix_exam_generator: { verb: "Karma sınav üret", sections: [mufredat(),
    { t: "Sınav ayarları", icon: "i-wand", fields: [{ k: "sure", type: "number", label: "Süre (dakika)", def: 40, min: 10, max: 120, step: 5 }, { k: "zorluk", type: "seg", label: "Zorluk", opts: ["Kolay", "Orta", "Zor"], def: "Orta" }, { k: "bloom", type: "seg", label: "Bloom basamağı", opts: ["Hatırlama", "Anlama", "Uygulama", "Analiz", "Değerlendirme", "Yaratma"], def: "Anlama" }] },
    { t: "Soru türü dağılımı", icon: "i-layers", fields: [{ k: "dagilim", type: "counters", label: "Soru sayıları", opts: [["Çoktan seçmeli", 5], ["Boşluk doldurma", 0], ["Doğru / yanlış", 0], ["Açık uçlu", 0], ["Bağlam temelli", 0]], req: true }] }] },
  "basic-assumptions-guide": { verb: "Soru setini oluştur", sections: [mufredat([{ k: "hazir", type: "seg", label: "Hazırbulunuşluk", opts: ["Başlangıç", "Orta", "İleri"], def: "Orta" }])] },
  "story-drama": { verb: "Sihri başlat", sections: [
    { t: "Plan", icon: "i-book", fields: [{ k: "tur", type: "seg", label: "Plan türü", opts: ["Hikâye", "Drama", "Kısa tiyatro", "Masal"], req: true }, { k: "deger", type: "text", label: "Anlatılacak değer / erdem", ph: "Örn: Sabır, dürüstlük, yardımlaşma", req: true }, { k: "mekan", type: "text", label: "Mekân", ph: "Örn: Sınıf, orman, uzay istasyonu" }] },
    { t: "Ana karakter", icon: "i-user", fields: [{ k: "ad", type: "text", label: "Adı", ph: "Örn: Elif", half: true }, { k: "ozellik", type: "text", label: "Özelliği", ph: "Örn: Meraklı", half: true }] },
    { t: "Mesaj", icon: "i-heart", fields: [{ k: "mesaj", type: "textarea", label: "Ana mesaj", ph: "Hikâyenin sonunda verilmek istenen ders nedir?", opt: true }] }] },
  "parent-meeting-report": { verb: "Raporu hazırla", sections: [
    { t: "Rapor", icon: "i-doc", fields: [{ k: "rtur", type: "seg", label: "Rapor türü", opts: ["Bireysel öğrenci", "Sınıf geneli"], req: true }, grade(), ders()] },
    { t: "Analiz dosyası", icon: "i-folder", fields: [{ k: "pdf", type: "file", label: "Analiz dosyası (PDF)", accept: ".pdf", req: true, hint: "Deneme ya da sınav analiz çıktısı" }] }] },
  "rapor-ozetleme-asistani": { verb: "Özeti çıkar", sections: [{ t: "Öğrenci", icon: "i-user", fields: [grade()] },
    { t: "Gelişim raporu", icon: "i-folder", fields: [{ k: "pdf", type: "file", label: "Gelişim raporu (PDF)", accept: ".pdf", req: true }] }] },
  yasanti_temelli_ogrenme_ogretmen: { verb: "Yaşantıyı tasarla", sections: [mufredat([{ k: "ortam", type: "seg", label: "Ortam", opts: ["Sınıf içi", "Okul bahçesi", "Ev / aile"], def: "Sınıf içi" }])] },
  deneyle_anlat: { verb: "Etkinliği oluştur", sections: [mufredat([{ k: "sure", type: "seg", label: "Süre", opts: ["20 dk", "40 dk", "80 dk"], def: "40 dk" }, { k: "grup", type: "seg", label: "Çalışma", opts: ["Bireysel", "İkili", "Grup"], def: "Grup" }])] },
  performans_odevi_olustur: { verb: "Ödevi oluştur", sections: [mufredat([{ k: "sure", type: "seg", label: "Teslim süresi", opts: ["1 hafta", "2 hafta", "1 ay"], def: "2 hafta" }, { k: "urun", type: "multi", label: "Ürün türü", opts: ["Poster", "Sunum", "Video", "Model", "Rapor"], def: ["Poster"] }])] },
  ogrenme_kanitlari_uret: { verb: "Kanıtları üret", sections: [mufredat()] },
  "simulation-test": { verb: "Simülasyonu oluştur", sections: [mufredat()] },
  exam_reader: { verb: "Sınavları oku", sections: [
    { t: "Öğretmen cevap anahtarı", icon: "i-key", fields: [{ k: "anahtar", type: "file", label: "Cevap anahtarı (PDF)", accept: ".pdf", req: true, hint: "Yalnızca PDF, 1 dosya" }] },
    { t: "Öğrenci cevap kâğıtları", icon: "i-people", fields: [{ k: "kagit", type: "file", label: "Cevap kâğıtları (PDF)", accept: ".pdf", multi: true, req: true, hint: "Birden fazla PDF seçebilirsiniz" }] }] },
  bilisim_ders_plani: { verb: "Planı oluştur", sections: [{ t: "Ders", icon: "i-book", fields: [grade(), { k: "konsept", type: "seg", label: "Konsept", opts: ["Scratch", "Tinkercad", "Python", "Web tasarımı", "Yapay zekâ", "Görüntü işleme", "Arduino & robotik", "App Inventor", "Kodu Game Lab", "Veri tabanı (SQL)"], req: true }, konu()] }] },
  /* ---------- öğrenci ---------- */
  deneyle_ogren: { verb: "Deneyi tasarla", sections: [mufredat([{ k: "malzeme", type: "seg", label: "Malzeme", opts: ["Evdeki malzemeler", "Okul laboratuvarı"], def: "Evdeki malzemeler" }])] },
  sehirle_anlat: { verb: "Şehirle anlat", sections: [mufredat([{ k: "sehir", type: "text", label: "Şehir", ph: "Örn: İstanbul", req: true }])] },
  rutinimle_eslestir: { verb: "Eşleştir", sections: [mufredat([{ k: "rutin", type: "textarea", label: "Günlük rutinin", ph: "Örn: Sabah okul, öğleden sonra futbol, akşam kitap…", req: true }])] },
  soru_cozucu: { verb: "Çözümü başlat", sections: [{ t: "Ders", icon: "i-book", fields: [grade(), ders(), { k: "durum", type: "seg", label: "Durum", opts: ["Ders içi", "Ödev"], def: "Ödev" }] },
    { t: "Soru", icon: "i-chat", fields: [{ k: "soru", type: "qmode", label: "Soruyu nasıl vereceksin?", req: true }, { k: "ek", type: "textarea", label: "Ek bilgi", ph: "Soruyla ilgili ek bilgi ya da bağlam…", opt: true }] }] },
  gelecekten_mektup_al: { verb: "Mektubu getir", sections: [mufredat([{ k: "yil", type: "seg", label: "Kaç yıl sonrasından?", opts: ["5 yıl", "10 yıl", "20 yıl"], def: "10 yıl" }])] },
  bugunku_calisma_pusulam: { verb: "Pusulamı çiz", sections: [mufredat([{ k: "sure", type: "seg", label: "Bugün ne kadar vaktin var?", opts: ["30 dk", "1 saat", "2 saat"], def: "1 saat" }, { k: "enerji", type: "seg", label: "Enerjin nasıl?", opts: ["Düşük", "Orta", "Yüksek"], def: "Orta" }])] },
  hobilerle_bagla: { verb: "Hobilerimle bağla", sections: [mufredat([{ k: "hobi", type: "multi", label: "Hobilerin", opts: ["Futbol", "Resim", "Müzik", "Oyun", "Dans", "Kodlama", "Kitap", "Doğa"], req: true, max: 3 }])] },
  konu_anlamadim_modu: { verb: "Bana anlat", sections: [mufredat([{ k: "nerede", type: "textarea", label: "Nerede takıldın?", ph: "Örn: Payda eşitlemeyi anlamadım", req: true }, { k: "nasil", type: "seg", label: "Nasıl anlatılsın?", opts: ["Örnekle", "Adım adım", "Hikâyeyle", "Çizimle"], def: "Adım adım" }])] },
  /* ---------- üretim araçları (ortak) ---------- */
  gorsel: { verb: "Görseli oluştur", sections: [{ t: "Ne görmek istiyorsun?", icon: "i-image", fields: [{ k: "prompt", type: "textarea", label: "Tarif", ph: "Örn: Yıldızlar arasında yüzen bir balina, pastel renkler", req: true }, { k: "stil", type: "seg", label: "Stil", opts: ["3D", "Çizgi film", "Suluboya", "Fotoğraf", "Piksel"], def: "3D" }, { k: "oran", type: "seg", label: "Oran", opts: ["Kare", "Yatay", "Dikey"], def: "Kare" }] }] },
  video: { verb: "Videoyu oluştur", sections: [{ t: "Sahne", icon: "i-video", fields: [{ k: "prompt", type: "textarea", label: "Ne olsun?", ph: "Örn: Bir tohumun filizlenip ağaca dönüşmesi", req: true }, { k: "sure", type: "seg", label: "Süre", opts: ["5 sn", "8 sn"], def: "5 sn" }, { k: "oran", type: "seg", label: "Oran", opts: ["Yatay", "Dikey"], def: "Yatay" }] }] },
  muzik: { verb: "Müziği oluştur", sections: [{ t: "Müzik", icon: "i-music", fields: [{ k: "prompt", type: "textarea", label: "Nasıl bir müzik?", ph: "Örn: Ders çalışırken dinlenecek sakin piyano", req: true }, { k: "tur", type: "seg", label: "Tür", opts: ["Sakin", "Neşeli", "Epik", "Elektronik"], def: "Sakin" }] }] },
  kod: { verb: "Kodu yaz", sections: [{ t: "Proje", icon: "i-code", fields: [{ k: "dil", type: "seg", label: "Dil", opts: ["Python", "Scratch", "HTML/CSS", "JavaScript"], def: "Python" }, { k: "prompt", type: "textarea", label: "Ne yapsın?", ph: "Örn: Altın toplayan bir karakter oyunu", req: true }] }] },
  sunum: { verb: "Sunumu hazırla", sections: [mufredat([{ k: "slayt", type: "number", label: "Slayt sayısı", def: 8, min: 3, max: 20, step: 1 }])] },
  ozet: { verb: "Özeti çıkar", sections: [{ t: "Metin", icon: "i-doc", fields: [{ k: "metin", type: "textarea", label: "Özetlenecek metin", ph: "Metni buraya yapıştır…", req: true, rows: 6 }, { k: "uzunluk", type: "seg", label: "Uzunluk", opts: ["Kısa", "Orta", "Ayrıntılı"], def: "Kısa" }] }] },
  ses: { verb: "Seslendir", sections: [{ t: "Metin", icon: "i-mic", fields: [{ k: "metin", type: "textarea", label: "Seslendirilecek metin", ph: "Metni yaz…", req: true }, { k: "ses", type: "seg", label: "Ses", opts: ["Kadın", "Erkek", "Çocuk"], def: "Kadın" }] }] },
};

const fieldsOf = (s) => s.sections.flatMap((x) => x.fields);
const filled = (f, v) => f.type === "qmode" ? !!(v && (v.mode === "gorsel" ? v.file : v.text?.trim())) : f.type === "counters" ? Object.values(v || {}).some((n) => n > 0) : Array.isArray(v) ? v.length > 0 : f.type === "file" ? !!(v && v.length) : v !== undefined && v !== null && String(v).trim() !== "";
const show = (f, v) => f.type === "counters" ? Object.entries(v || {}).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${k.toLocaleLowerCase("tr")}`).join(", ")
  : f.type === "file" ? (v || []).map((x) => x.name).join(", ") : f.type === "qmode" ? (v ? (v.mode === "gorsel" ? `Görsel: ${v.file}` : `“${v.text.slice(0, 40)}${v.text.length > 40 ? "…" : ""}”`) : "")
  : f.type === "grade" ? `${v}. sınıf` : Array.isArray(v) ? v.join(", ") : String(v ?? "");

export function mountToolForm(root, { find, back = "#araclar", onSave, preset = {} }) {   // preset: öğrencinin sınıfı gibi baştan dolu gelen değerler
  let tool = null, S = null, vals = {}, out = null;
  const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
  const defaults = () => { vals = {}; fieldsOf(S).forEach((f) => {
    if (f.type === "counters") vals[f.k] = Object.fromEntries(f.opts.map(([k, n]) => [k, n]));
    else if (f.type === "multi") vals[f.k] = [...(f.def || [])];
    else if (f.def !== undefined) vals[f.k] = f.def;
    if (preset[f.k] !== undefined) vals[f.k] = preset[f.k];
  }); };
  const chip = (k, o, on, multi) => `<button type="button" class="fc${on ? " on" : ""}" role="${multi ? "checkbox" : "radio"}" aria-checked="${on}" data-k="${k}" data-v="${esc(o)}">${esc(o)}</button>`;
  const field = (f) => {
    const v = vals[f.k], lab = `<span class="ff-l">${f.label}${f.req ? '<i class="ff-req">*</i>' : f.opt ? '<em>isteğe bağlı</em>' : ""}</span>`;
    let ctl = "";
    if (f.type === "grade") ctl = `<div class="fgrade" role="radiogroup" aria-label="${f.label}">${[["İlkokul", [1, 2, 3, 4]], ["Ortaokul", [5, 6, 7, 8]], ["Lise", [9, 10, 11, 12]]].map(([n, gs]) => `<div class="fg-grp"><small>${n}</small><div>${gs.map((g) => chip(f.k, String(g), String(v) === String(g))).join("")}</div></div>`).join("")}</div>`;
    else if (f.type === "ders") ctl = vals.sinif ? `<div class="fchips" role="radiogroup">${DERS[lvl(vals.sinif)].map((d) => chip(f.k, d, v === d)).join("")}</div>` : `<p class="ff-wait">Önce sınıf seviyesini seçin.</p>`;
    else if (f.type === "seg") ctl = `<div class="fchips${f.opts.length <= 4 ? " seg" : ""}" role="radiogroup">${f.opts.map((o) => chip(f.k, o, v === o)).join("")}</div>`;
    else if (f.type === "multi") ctl = `<div class="fchips" role="group">${f.opts.map((o) => chip(f.k, o, (v || []).includes(o), true)).join("")}</div>${f.max ? `<small class="ff-h">En çok ${f.max} tane</small>` : ""}`;
    else if (f.type === "number") ctl = `<div class="fstep"><button type="button" aria-label="Azalt" data-step="-1" data-k="${f.k}">−</button><input type="number" inputmode="numeric" min="${f.min}" max="${f.max}" step="${f.step}" value="${v}" data-in="${f.k}"><button type="button" aria-label="Artır" data-step="1" data-k="${f.k}">+</button></div>`;
    else if (f.type === "text") ctl = `<input class="fin" type="text" placeholder="${esc(f.ph || "")}" value="${esc(v || "")}" data-in="${f.k}">`;
    else if (f.type === "textarea") ctl = `<textarea class="fin" rows="${f.rows || 3}" placeholder="${esc(f.ph || "")}" data-in="${f.k}">${esc(v || "")}</textarea>`;
    else if (f.type === "counters") { const tot = Object.values(v).reduce((a, b) => a + b, 0);
      ctl = `<div class="fcount">${f.opts.map(([k]) => `<div class="fcn${v[k] ? " on" : ""}"><span>${k}</span><div><button type="button" aria-label="${k} azalt" data-cnt="${esc(k)}" data-d="-1" data-k="${f.k}">−</button><b>${v[k]}</b><button type="button" aria-label="${k} artır" data-cnt="${esc(k)}" data-d="1" data-k="${f.k}">+</button></div></div>`).join("")}</div><small class="ff-h">Toplam <b>${tot}</b> soru</small>`; }
    else if (f.type === "file") ctl = `<label class="fdrop${filled(f, v) ? " on" : ""}" data-drop="${f.k}"><input type="file" accept="${f.accept}" ${f.multi ? "multiple" : ""} data-file="${f.k}" hidden>${ic("i-folder")}<span>${filled(f, v) ? `<b>${esc(show(f, v))}</b><small>Değiştirmek için tıklayın</small>` : `<b>Tıklayın ya da dosyayı sürükleyin</b><small>${f.hint || "PDF"}</small>`}</span></label>`;
    else if (f.type === "qmode") { const m = v?.mode || "yaz";
      ctl = `<div class="fchips seg" role="radiogroup"><button type="button" class="fc${m === "gorsel" ? " on" : ""}" data-qm="gorsel">${ic("i-camera")}Görsel yükle</button><button type="button" class="fc${m === "yaz" ? " on" : ""}" data-qm="yaz">${ic("i-type")}Soruyu yaz</button></div>
        ${m === "gorsel" ? `<label class="fdrop${v?.file ? " on" : ""}"><input type="file" accept="image/*" data-qfile hidden>${ic("i-image")}<span><b>${v?.file ? esc(v.file) : "Sorunun fotoğrafını seç"}</b><small>${v?.file ? "Değiştirmek için tıklayın" : "Fotoğraf ya da ekran görüntüsü"}</small></span></label>`
        : `<textarea class="fin" rows="4" placeholder="Soruyu buraya yaz…" data-qtext>${esc(v?.text || "")}</textarea>`}`; }
    return `<div class="ff${f.half ? " half" : ""}" data-f="${f.k}">${lab}${ctl}</div>`;
  };
  const reqs = () => fieldsOf(S).filter((f) => f.req);
  const ok = () => reqs().every((f) => filled(f, vals[f.k]));
  const renderSum = () => {
    const rows = fieldsOf(S).filter((f) => filled(f, vals[f.k]) && f.type !== "textarea").map((f) => `<li><span>${f.label}</span><b>${esc(show(f, vals[f.k]))}</b></li>`).join("");
    const done = reqs().filter((f) => filled(f, vals[f.k])).length;
    $("[data-tf-sum]").innerHTML = rows || `<li class="none">Seçtiklerin burada görünecek.</li>`;
    $("[data-tf-prog]").innerHTML = `<i style="--p:${reqs().length ? done / reqs().length * 100 : 100}%"></i><span>${done}/${reqs().length} zorunlu alan</span>`;
    $("[data-tf-go]").disabled = !ok();
  };
  const renderForm = () => {
    $("[data-tf-form]").innerHTML = S.sections.map((s, i) => `<section class="tfs${s.opt ? " opt" : ""}">
      ${s.opt ? `<details${S._open ? " open" : ""}><summary><h3>${ic(s.icon)}${s.t}<em>isteğe bağlı</em></h3>${ic("i-down")}</summary><div class="tfs-b">${s.fields.map(field).join("")}</div></details>`
      : `<h3><span class="tfs-n">${i + 1}</span>${s.t}</h3><div class="tfs-b">${s.fields.map(field).join("")}</div>`}</section>`).join("");
    renderSum();
  };
  const rerenderField = (k) => { const f = fieldsOf(S).find((x) => x.k === k), el = $(`[data-f="${k}"]`); if (f && el) el.outerHTML = field(f); renderSum(); };
  const open = (id) => {
    tool = find(id); if (!tool) { location.hash = back.slice(1); return false; }
    S = SCHEMAS[tool.schema || tool.id]; defaults(); out = null; root.classList.remove("has-out");
    root.innerHTML = `<div class="tf-top"><a class="tani-back" href="${back}">${ic("i-arrow")}Araçlar</a></div>
      <div class="tf-grid"><div class="tf-main"><form class="tf-card" data-tf-form novalidate></form><div class="tf-out" data-tf-out hidden></div></div>
      <aside class="tf-side"><div class="tf-hero" style="--hue:${tool.hue};--tint:${tool.tint}"><span class="tf-art"><img src="assets/araclar/t${String(tool.art).padStart(2, "0")}.png" alt=""></span><div><h1 id="tf-h">${esc(tool.name)}</h1><p>${esc(tool.desc)}</p></div></div>
        <div class="tf-sumbox"><p class="tf-sh">Özet</p><ul class="tf-sum" data-tf-sum></ul><div class="tf-prog" data-tf-prog></div></div>
        <button type="button" class="tf-go" data-tf-go disabled>${ic("i-spark")}${S.verb}</button>
        <p class="tf-terms">Üretilen içeriği kullanmadan önce gözden geçirin · <a href="#" onclick="return false">Kullanım şartları</a></p></aside></div>`;
    renderForm(); return tool.name;
  };
  // etkileşim
  root.addEventListener("click", (e) => {
    const c = e.target.closest(".fc[data-k]");
    if (c) { const f = fieldsOf(S).find((x) => x.k === c.dataset.k), v = c.dataset.v;
      if (f.type === "multi") { const a = vals[f.k] ||= []; if (a.includes(v)) a.splice(a.indexOf(v), 1); else if (!f.max || a.length < f.max) a.push(v); }
      else { vals[f.k] = v; if (f.k === "sinif" && vals.ders && !DERS[lvl(v)].includes(vals.ders)) delete vals.ders; }
      rerenderField(f.k); if (f.k === "sinif") rerenderField("ders"); return; }
    const st = e.target.closest("[data-step]");
    if (st) { const f = fieldsOf(S).find((x) => x.k === st.dataset.k); vals[f.k] = Math.min(f.max, Math.max(f.min, (+vals[f.k] || 0) + f.step * +st.dataset.step)); rerenderField(f.k); return; }
    const cn = e.target.closest("[data-cnt]");
    if (cn) { const o = vals[cn.dataset.k]; o[cn.dataset.cnt] = Math.max(0, Math.min(30, o[cn.dataset.cnt] + +cn.dataset.d)); rerenderField(cn.dataset.k); return; }
    const qm = e.target.closest("[data-qm]");
    if (qm) { const f = fieldsOf(S).find((x) => x.type === "qmode"); vals[f.k] = qm.dataset.qm === "gorsel" ? { mode: "gorsel", file: vals[f.k]?.file || "" } : { mode: "yaz", text: vals[f.k]?.text || "" }; if (!vals[f.k].file && !vals[f.k].text) vals[f.k] = qm.dataset.qm === "gorsel" ? { mode: "gorsel", file: "" } : { mode: "yaz", text: "" }; rerenderField(f.k); return; }
    if (e.target.closest("[data-tf-go]")) return generate();
    if (e.target.closest("[data-tf-edit]")) { $("[data-tf-out]").hidden = true; root.classList.remove("has-out"); return; }
    if (e.target.closest("[data-tf-again]")) return generate();
    if (e.target.closest("[data-tf-save]")) { onSave?.(tool, vals, out); e.target.closest("[data-tf-save]").outerHTML = `<a class="btn-primary tfo-saved" href="${back}/koleksiyon">${ic("i-check")}Kaydedildi · Koleksiyonda gör</a>`; return; }
  });
  root.addEventListener("input", (e) => {
    const k = e.target.dataset.in; if (k) { const f = fieldsOf(S).find((x) => x.k === k); vals[k] = f.type === "number" ? +e.target.value : e.target.value; renderSum(); return; }
    if (e.target.matches("[data-qtext]")) { const f = fieldsOf(S).find((x) => x.type === "qmode"); vals[f.k] = { mode: "yaz", text: e.target.value }; renderSum(); }
  });
  root.addEventListener("change", (e) => {
    const k = e.target.dataset.file; if (k) { vals[k] = [...e.target.files].map((f) => ({ name: f.name })); rerenderField(k); return; }
    if (e.target.matches("[data-qfile]") && e.target.files[0]) { const f = fieldsOf(S).find((x) => x.type === "qmode"); vals[f.k] = { mode: "gorsel", file: e.target.files[0].name }; rerenderField(f.k); }
  });
  root.addEventListener("dragover", (e) => { const d = e.target.closest("[data-drop]"); if (d) { e.preventDefault(); d.classList.add("hover"); } });
  root.addEventListener("dragleave", (e) => { const d = e.target.closest("[data-drop]"); if (d) d.classList.remove("hover"); });
  root.addEventListener("drop", (e) => { const d = e.target.closest("[data-drop]"); if (!d) return; e.preventDefault(); vals[d.dataset.drop] = [...e.dataTransfer.files].map((f) => ({ name: f.name })); rerenderField(d.dataset.drop); });
  // demo üretim
  const generate = () => {
    if (!ok()) return;
    const box = $("[data-tf-out]"); box.hidden = false; root.classList.add("has-out"); root.closest(".page")?.scrollTo({ top: 0, behavior: "smooth" });
    box.innerHTML = `<div class="tfo-card"><div class="tfo-load"><span class="tf-spin"></span><b>${esc(tool.name)} hazırlanıyor…</b><small>Yapay zekâ girdilerinizi işliyor</small></div></div>`;
    setTimeout(() => {
      const ctx = [vals.sinif && `${vals.sinif}. sınıf`, vals.ders, vals.konu].filter(Boolean).join(" · ");
      const lines = fieldsOf(S).filter((f) => filled(f, vals[f.k])).map((f) => `<li><span>${f.label}</span>${esc(show(f, vals[f.k]))}</li>`).join("");
      out = { title: `${tool.name}${ctx ? " · " + ctx : ""}` };
      box.innerHTML = `<div class="tfo-card"><div class="tfo-h"><span class="tf-art sm" style="--tint:${tool.tint}"><img src="assets/araclar/t${String(tool.art).padStart(2, "0")}.png" alt=""></span><div><small>Hazır</small><h2>${esc(out.title)}</h2></div></div>
        <div class="tfo-body"><p class="tfo-note">Bu demo sürümünde içerik üretilmez; gerçek uygulamada çıktı burada açılır. Kullanılan girdiler:</p><ul class="tfo-in">${lines}</ul></div>
        <div class="tfo-act"><button type="button" class="btn-ghost" data-tf-edit>${ic("i-pen")}Girdileri düzenle</button><button type="button" class="btn-ghost" data-tf-again>${ic("i-undo")}Yeniden üret</button><button type="button" class="btn-primary" data-tf-save>${ic("i-folder")}Koleksiyona kaydet</button></div></div>`;
    }, 1300);
  };
  return { open };
}
