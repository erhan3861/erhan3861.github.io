// Araç formu (#arac/<id>): tek ekran, kaydırmasız. Aracın bölümleri adım olur (1 Müfredat · 2 Ayarlar …); kart ekran yüksekliğinde,
// sağda araç kartı + canlı özet + ana düğme. Müfredat adımı whitelabel uygulamasındaki gibi: sınıf → ders → ünite/tema (çoklu) →
// öğrenme çıktıları (tema seçilince hepsi seçili gelir, istenmeyen kaldırılır). Veri assets/mufredat/g<N>.json (uygulamanın müfredat
// API'sinden salt okunur çekildi). Üretimden sonra demo çıktı + "Koleksiyona kaydet". Öğrenci ve öğretmen panelleri aynı modülü kullanır.
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ic = (id) => `<svg class="icon" aria-hidden="true"><use href="#${id}" /></svg>`;
const MAARIF = [1, 2, 5, 6, 9, 10];   // uygulamanın sınıf listesinde "(Maarif)" yazanlar
const CUR = {};
const loadCur = (g) => (CUR[g] ||= fetch(`assets/mufredat/g${g}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null));
const grade = () => ({ k: "sinif", type: "grade", label: "Sınıf seviyesi", req: true });
const mufredat = (extra = [], { tema = true, title = "Ayarlar", icon = "i-wand" } = {}) => [
  { t: "Müfredat", icon: "i-book", mf: true, fields: [grade(), { k: "ders", type: "ders", label: "Ders", req: true }, { k: "tema", type: "tema", label: "Ünite / tema", req: tema, opt: !tema }, { k: "kaz", type: "kaz", label: "Öğrenme çıktıları" }] },
  ...(extra.length ? [{ t: title, icon, fields: extra }] : []),
];

// alan tipleri: grade, ders, tema, kaz, seg (tek seçim), multi (çoklu), number (adım), text, textarea, counters, file, qmode
export const SCHEMAS = {
  /* ---------- öğretmen ---------- */
  "lesson-plan": { verb: "Planı oluştur", sections: [...mufredat([{ k: "yontem", type: "multi", label: "Kullanılacak yöntemler", opts: ["Anlatım", "Tartışma", "Örnek olay", "Soru-cevap", "Beyin fırtınası", "Gösterip yaptırma", "Bireysel çalışma", "Grup çalışması"], def: ["Anlatım", "Soru-cevap"], req: true }], { title: "Öğrenme yöntemleri", icon: "i-layers" }),
    { t: "Ek bilgiler", icon: "i-wand", opt: true, fields: [{ k: "fark", type: "textarea", label: "Farklılaştırma", ph: "Özel ihtiyaçlar için uyarlamalar…", half: true }, { k: "tekno", type: "textarea", label: "Teknoloji entegrasyonu", ph: "Kullanılacak dijital araçlar…", half: true }, { k: "ai", type: "textarea", label: "Yapay zekâ asistanı entegrasyonu", ph: "Derste yapay zekâyı nasıl kullanmayı planlıyorsunuz?" }] }] },
  mix_exam_generator: { verb: "Karma sınav üret", sections: [...mufredat([{ k: "sure", type: "number", label: "Süre (dakika)", def: 40, min: 10, max: 120, step: 5, half: true }, { k: "zorluk", type: "seg", label: "Zorluk", opts: ["Kolay", "Orta", "Zor"], def: "Orta", half: true }, { k: "bloom", type: "seg", label: "Bloom basamağı", opts: ["Hatırlama", "Anlama", "Uygulama", "Analiz", "Değerlendirme", "Yaratma"], def: "Anlama" }], { title: "Sınav ayarları" }),
    { t: "Soru dağılımı", icon: "i-layers", fields: [{ k: "dagilim", type: "counters", label: "Soru türü dağılımı", opts: [["Çoktan seçmeli", 5], ["Boşluk doldurma", 0], ["Doğru / yanlış", 0], ["Açık uçlu", 0], ["Bağlam temelli", 0]], req: true }] }] },
  "basic-assumptions-guide": { verb: "Soru setini oluştur", sections: mufredat([{ k: "hazir", type: "seg", label: "Hazırbulunuşluk seviyesi", opts: ["Hazır", "Kısmen hazır", "Hazır değil"], def: "Kısmen hazır" }]) },
  "story-drama": { verb: "Sihri başlat", sections: [
    { t: "Plan", icon: "i-book", fields: [{ k: "tur", type: "seg", label: "Plan türü", opts: ["Hikâye", "Drama", "Kısa tiyatro", "Masal"], req: true }, { k: "deger", type: "text", label: "Anlatılacak değer / erdem", ph: "Örn: Sabır, dürüstlük, yardımlaşma", req: true }, { k: "mekan", type: "text", label: "Mekân", ph: "Örn: Sınıf, orman, uzay istasyonu" }] },
    { t: "Karakter ve mesaj", icon: "i-user", fields: [{ k: "ad", type: "text", label: "Ana karakterin adı", ph: "Örn: Elif", half: true }, { k: "ozellik", type: "text", label: "Özelliği", ph: "Örn: Meraklı", half: true }, { k: "mesaj", type: "textarea", label: "Ana mesaj", ph: "Hikâyenin sonunda verilmek istenen ders nedir?", rows: 4 }] }] },
  "parent-meeting-report": { verb: "Raporu hazırla", sections: [...mufredat([], { tema: false }),
    { t: "Rapor", icon: "i-doc", fields: [{ k: "rtur", type: "seg", label: "Rapor türü", opts: ["Bireysel öğrenci", "Sınıf geneli"], req: true }, { k: "pdf", type: "file", label: "Analiz dosyası (PDF)", accept: ".pdf", req: true, hint: "Deneme ya da sınav analiz çıktısı" }] }] },
  "rapor-ozetleme-asistani": { verb: "Özeti çıkar", sections: [{ t: "Gelişim raporu", icon: "i-doc", fields: [grade(), { k: "pdf", type: "file", label: "Gelişim raporu (PDF)", accept: ".pdf", req: true }] }] },
  yasanti_temelli_ogrenme_ogretmen: { verb: "Yaşantıyı tasarla", sections: mufredat([{ k: "ortam", type: "seg", label: "Ortam", opts: ["Sınıf içi", "Okul bahçesi", "Ev / aile"], def: "Sınıf içi" }]) },
  deneyle_anlat: { verb: "Etkinliği oluştur", sections: mufredat([{ k: "sure", type: "seg", label: "Süre", opts: ["20 dk", "40 dk", "80 dk"], def: "40 dk", half: true }, { k: "grup", type: "seg", label: "Çalışma", opts: ["Bireysel", "İkili", "Grup"], def: "Grup", half: true }]) },
  performans_odevi_olustur: { verb: "Ödevi oluştur", sections: mufredat([{ k: "sure", type: "seg", label: "Teslim süresi", opts: ["1 hafta", "2 hafta", "1 ay"], def: "2 hafta" }, { k: "urun", type: "multi", label: "Ürün türü", opts: ["Poster", "Sunum", "Video", "Model", "Rapor"], def: ["Poster"] }]) },
  ogrenme_kanitlari_uret: { verb: "Kanıtları üret", sections: mufredat() },
  "simulation-test": { verb: "Simülasyonu oluştur", sections: mufredat() },
  exam_reader: { verb: "Sınavları oku", sections: [{ t: "Dosyalar", icon: "i-folder", fields: [
    { k: "anahtar", type: "file", label: "Öğretmen cevap anahtarı (PDF)", accept: ".pdf", req: true, hint: "Yalnızca PDF, 1 dosya" },
    { k: "kagit", type: "file", label: "Öğrenci cevap kâğıtları (PDF)", accept: ".pdf", multi: true, req: true, hint: "Birden fazla PDF seçebilirsiniz" }] }] },
  bilisim_ders_plani: { verb: "Planı oluştur", sections: [{ t: "Ders", icon: "i-code", fields: [grade(), { k: "konsept", type: "seg", label: "Konsept", opts: ["Scratch", "Tinkercad", "Python", "Web tasarımı", "Yapay zekâ", "Görüntü işleme", "Arduino & robotik", "App Inventor", "Kodu Game Lab", "Veri tabanı (SQL)"], req: true }, { k: "konu", type: "text", label: "Konu", ph: "Örn: Döngüler", opt: true }] }] },
  /* ---------- öğrenci ---------- */
  deneyle_ogren: { verb: "Deneyi tasarla", sections: mufredat([{ k: "malzeme", type: "seg", label: "Malzeme", opts: ["Evdeki malzemeler", "Okul laboratuvarı"], def: "Evdeki malzemeler" }]) },
  sehirle_anlat: { verb: "Şehirle anlat", sections: mufredat([{ k: "sehir", type: "text", label: "Şehir", ph: "Örn: İstanbul", req: true }]) },
  rutinimle_eslestir: { verb: "Eşleştir", sections: mufredat([{ k: "rutin", type: "textarea", label: "Günlük rutinin", ph: "Örn: Sabah okul, öğleden sonra futbol, akşam kitap…", req: true, rows: 4 }]) },
  soru_cozucu: { verb: "Çözümü başlat", sections: [...mufredat([], { tema: false }),
    { t: "Soru", icon: "i-chat", fields: [{ k: "soru", type: "qmode", label: "Soruyu nasıl vereceksin?", req: true }, { k: "durum", type: "seg", label: "Durum", opts: ["Ders içi", "Ödev"], def: "Ödev" }] }] },
  gelecekten_mektup_al: { verb: "Mektubu getir", sections: mufredat([{ k: "yil", type: "seg", label: "Kaç yıl sonrasından?", opts: ["5 yıl", "10 yıl", "20 yıl"], def: "10 yıl" }]) },
  bugunku_calisma_pusulam: { verb: "Pusulamı çiz", sections: mufredat([{ k: "sure", type: "seg", label: "Bugün ne kadar vaktin var?", opts: ["30 dk", "1 saat", "2 saat"], def: "1 saat" }, { k: "enerji", type: "seg", label: "Enerjin nasıl?", opts: ["Düşük", "Orta", "Yüksek"], def: "Orta" }]) },
  hobilerle_bagla: { verb: "Hobilerimle bağla", sections: mufredat([{ k: "hobi", type: "multi", label: "Hobilerin", opts: ["Futbol", "Resim", "Müzik", "Oyun", "Dans", "Kodlama", "Kitap", "Doğa"], req: true, max: 3 }], { title: "Hobilerin", icon: "i-heart" }) },
  konu_anlamadim_modu: { verb: "Bana anlat", sections: mufredat([{ k: "nerede", type: "textarea", label: "Nerede takıldın?", ph: "Örn: Payda eşitlemeyi anlamadım", req: true, rows: 3 }, { k: "nasil", type: "seg", label: "Nasıl anlatılsın?", opts: ["Örnekle", "Adım adım", "Hikâyeyle", "Çizimle"], def: "Adım adım" }], { title: "Takıldığın yer", icon: "i-chat" }) },
  /* ---------- üretim araçları (ortak) ---------- */
  gorsel: { verb: "Görseli oluştur", sections: [{ t: "Görsel", icon: "i-image", fields: [{ k: "prompt", type: "textarea", label: "Ne görmek istiyorsun?", ph: "Örn: Yıldızlar arasında yüzen bir balina, pastel renkler", req: true, rows: 4 }, { k: "stil", type: "seg", label: "Stil", opts: ["3D", "Çizgi film", "Suluboya", "Fotoğraf", "Piksel"], def: "3D" }, { k: "oran", type: "seg", label: "Oran", opts: ["Kare", "Yatay", "Dikey"], def: "Kare" }] }] },
  video: { verb: "Videoyu oluştur", sections: [{ t: "Sahne", icon: "i-video", fields: [{ k: "prompt", type: "textarea", label: "Ne olsun?", ph: "Örn: Bir tohumun filizlenip ağaca dönüşmesi", req: true, rows: 4 }, { k: "sure", type: "seg", label: "Süre", opts: ["5 sn", "8 sn"], def: "5 sn", half: true }, { k: "oran", type: "seg", label: "Oran", opts: ["Yatay", "Dikey"], def: "Yatay", half: true }] }] },
  muzik: { verb: "Müziği oluştur", sections: [{ t: "Müzik", icon: "i-music", fields: [{ k: "prompt", type: "textarea", label: "Nasıl bir müzik?", ph: "Örn: Ders çalışırken dinlenecek sakin piyano", req: true, rows: 4 }, { k: "tur", type: "seg", label: "Tür", opts: ["Sakin", "Neşeli", "Epik", "Elektronik"], def: "Sakin" }] }] },
  kod: { verb: "Kodu yaz", sections: [{ t: "Proje", icon: "i-code", fields: [{ k: "dil", type: "seg", label: "Dil", opts: ["Python", "Scratch", "HTML/CSS", "JavaScript"], def: "Python" }, { k: "prompt", type: "textarea", label: "Ne yapsın?", ph: "Örn: Altın toplayan bir karakter oyunu", req: true, rows: 4 }] }] },
  sunum: { verb: "Sunumu hazırla", sections: mufredat([{ k: "slayt", type: "number", label: "Slayt sayısı", def: 8, min: 3, max: 20, step: 1 }]) },
  ozet: { verb: "Özeti çıkar", sections: [{ t: "Metin", icon: "i-doc", fields: [{ k: "metin", type: "textarea", label: "Özetlenecek metin", ph: "Metni buraya yapıştır…", req: true, rows: 7 }, { k: "uzunluk", type: "seg", label: "Uzunluk", opts: ["Kısa", "Orta", "Ayrıntılı"], def: "Kısa" }] }] },
  ses: { verb: "Seslendir", sections: [{ t: "Metin", icon: "i-mic", fields: [{ k: "metin", type: "textarea", label: "Seslendirilecek metin", ph: "Metni yaz…", req: true, rows: 6 }, { k: "ses", type: "seg", label: "Ses", opts: ["Kadın", "Erkek", "Çocuk"], def: "Kadın" }] }] },
};

const fieldsOf = (s) => s.sections.flatMap((x) => x.fields);
const filled = (f, v) => f.type === "qmode" ? !!(v && (v.mode === "gorsel" ? v.file : v.text?.trim())) : f.type === "counters" ? Object.values(v || {}).some((n) => n > 0)
  : Array.isArray(v) ? v.length > 0 : f.type === "file" ? !!(v && v.length) : v !== undefined && v !== null && String(v).trim() !== "";
const show = (f, v) => f.type === "counters" ? Object.entries(v || {}).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${k.toLocaleLowerCase("tr")}`).join(", ")
  : f.type === "file" ? (v || []).map((x) => x.name).join(", ") : f.type === "qmode" ? (v ? (v.mode === "gorsel" ? `Görsel: ${v.file}` : `“${v.text.slice(0, 40)}${v.text.length > 40 ? "…" : ""}”`) : "")
  : f.type === "grade" ? `${v}. sınıf${MAARIF.includes(+v) ? " (Maarif)" : ""}` : f.type === "kaz" ? `${v.length} kazanım` : Array.isArray(v) ? v.join(", ") : String(v ?? "");

export function mountToolForm(root, { find, back = "#araclar", onSave, preset = {} }) {   // preset: öğrencinin sınıfı gibi baştan dolu gelen değerler
  let tool = null, S = null, vals = {}, out = null, step = 0, cur = null;
  const $ = (s) => root.querySelector(s);
  const F = (k) => fieldsOf(S).find((x) => x.k === k);
  const defaults = () => { vals = {}; fieldsOf(S).forEach((f) => {
    if (f.type === "counters") vals[f.k] = Object.fromEntries(f.opts.map(([k, n]) => [k, n]));
    else if (f.type === "multi" || f.type === "tema" || f.type === "kaz") vals[f.k] = [...(f.def || [])];
    else if (f.def !== undefined) vals[f.k] = f.def;
    if (preset[f.k] !== undefined) vals[f.k] = preset[f.k];
  }); };
  const lessons = () => (cur ? Object.keys(cur.lessons) : []);
  const units = () => (cur && vals.ders ? Object.keys(cur.lessons[vals.ders] || {}) : []);
  const outs = (t) => (cur?.lessons[vals.ders]?.[t] || []).map(([code, txt], i) => ({ id: `${t}|${i}`, code, txt }));
  const chip = (k, o, on, multi, extra = "") => `<button type="button" class="fc${on ? " on" : ""}" role="${multi ? "checkbox" : "radio"}" aria-checked="${on}" data-k="${k}" data-v="${esc(o)}">${esc(o)}${extra}</button>`;
  const wait = (t) => `<p class="ff-wait">${t}</p>`;
  const field = (f) => {
    const v = vals[f.k], lab = `<span class="ff-l">${f.label}${f.req ? '<i class="ff-req">*</i>' : f.opt ? "<em>isteğe bağlı</em>" : ""}${f.type === "tema" && v.length ? `<b class="ff-n">${v.length} seçili</b>` : ""}</span>`;
    let ctl = "";
    if (f.type === "grade") ctl = `<div class="fgrade" role="radiogroup" aria-label="${f.label}">${[[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]].map((gs) => `<div>${gs.map((g) => chip(f.k, String(g), String(v) === String(g), false, MAARIF.includes(g) ? '<i class="mf-dot" title="Maarif"></i>' : "")).join("")}</div>`).join("")}<small class="fg-key"><i class="mf-dot"></i>Maarif modeli</small></div>`;
    else if (f.type === "ders") ctl = !vals.sinif ? wait("Önce sınıf seviyesini seçin.") : !cur ? wait("Dersler yükleniyor…") : `<div class="fchips" role="radiogroup">${lessons().map((d) => chip(f.k, d, v === d)).join("")}</div>`;
    else if (f.type === "tema") ctl = !vals.ders ? wait("Önce dersi seçin.") : `<div class="fchips cap" role="group">${units().map((u) => chip(f.k, u, v.includes(u), true)).join("")}</div>`;
    else if (f.type === "kaz") { const temas = vals.tema || [];
      ctl = !temas.length ? `<div class="kz-empty">${ic("i-book")}<b>Tema seçince öğrenme çıktıları burada</b><small>Seçtiğiniz her temanın kazanımları otomatik seçili gelir; istemediklerinizi kaldırabilirsiniz.</small></div>`
        : `<div class="kz">${temas.map((t) => { const os = outs(t), n = os.filter((o) => v.includes(o.id)).length;
          return `<details class="kz-g" open><summary><span>${esc(t)}</span><b>${n}/${os.length}</b><button type="button" class="kz-all" data-kz-all="${esc(t)}">${n === os.length ? "Hiçbiri" : "Tümü"}</button>${ic("i-down")}</summary>
            <ul>${os.map((o) => `<li><label><input type="checkbox" data-kz="${esc(o.id)}"${v.includes(o.id) ? " checked" : ""}><span>${o.code ? `<code>${esc(o.code)}</code>` : ""}${esc(o.txt)}</span></label></li>`).join("")}</ul></details>`; }).join("")}</div>`; }
    else if (f.type === "seg") ctl = `<div class="fchips${f.opts.length <= 4 ? " seg" : ""}" role="radiogroup">${f.opts.map((o) => chip(f.k, o, v === o)).join("")}</div>`;
    else if (f.type === "multi") ctl = `<div class="fchips" role="group">${f.opts.map((o) => chip(f.k, o, (v || []).includes(o), true)).join("")}</div>${f.max ? `<small class="ff-h">En çok ${f.max} tane</small>` : ""}`;
    else if (f.type === "number") ctl = `<div class="fstep"><button type="button" aria-label="Azalt" data-step="-1" data-k="${f.k}">−</button><input type="number" inputmode="numeric" min="${f.min}" max="${f.max}" step="${f.step}" value="${v}" data-in="${f.k}" aria-label="${f.label}"><button type="button" aria-label="Artır" data-step="1" data-k="${f.k}">+</button></div>`;
    else if (f.type === "text") ctl = `<input class="fin" type="text" placeholder="${esc(f.ph || "")}" value="${esc(v || "")}" data-in="${f.k}" aria-label="${f.label}">`;
    else if (f.type === "textarea") ctl = `<textarea class="fin" rows="${f.rows || 3}" placeholder="${esc(f.ph || "")}" data-in="${f.k}" aria-label="${f.label}">${esc(v || "")}</textarea>`;
    else if (f.type === "counters") { const tot = Object.values(v).reduce((a, b) => a + b, 0);
      ctl = `<div class="fcount">${f.opts.map(([k]) => `<div class="fcn${v[k] ? " on" : ""}"><span>${k}</span><div><button type="button" aria-label="${k} azalt" data-cnt="${esc(k)}" data-d="-1" data-k="${f.k}">−</button><b>${v[k]}</b><button type="button" aria-label="${k} artır" data-cnt="${esc(k)}" data-d="1" data-k="${f.k}">+</button></div></div>`).join("")}<div class="fcn tot"><span>Toplam</span><b>${tot} soru</b></div></div>`; }
    else if (f.type === "file") ctl = `<label class="fdrop${filled(f, v) ? " on" : ""}" data-drop="${f.k}"><input type="file" accept="${f.accept}" ${f.multi ? "multiple" : ""} data-file="${f.k}" hidden>${ic("i-folder")}<span>${filled(f, v) ? `<b>${esc(show(f, v))}</b><small>Değiştirmek için tıklayın</small>` : `<b>Tıklayın ya da dosyayı sürükleyin</b><small>${f.hint || "PDF"}</small>`}</span></label>`;
    else if (f.type === "qmode") { const m = v?.mode || "yaz";
      ctl = `<div class="fchips seg" role="radiogroup"><button type="button" class="fc${m === "gorsel" ? " on" : ""}" data-qm="gorsel">${ic("i-camera")}Görsel yükle</button><button type="button" class="fc${m === "yaz" ? " on" : ""}" data-qm="yaz">${ic("i-type")}Soruyu yaz</button></div>
        ${m === "gorsel" ? `<label class="fdrop${v?.file ? " on" : ""}"><input type="file" accept="image/*" data-qfile hidden>${ic("i-image")}<span><b>${v?.file ? esc(v.file) : "Sorunun fotoğrafını seç"}</b><small>${v?.file ? "Değiştirmek için tıklayın" : "Fotoğraf ya da ekran görüntüsü"}</small></span></label>`
        : `<textarea class="fin" rows="4" placeholder="Soruyu buraya yaz…" data-qtext aria-label="Soru">${esc(v?.text || "")}</textarea>`}`; }
    return `<div class="ff${f.half ? " half" : ""}${f.type === "kaz" ? " ff-kz" : ""}" data-f="${f.k}">${lab}${ctl}</div>`;
  };
  const reqs = () => fieldsOf(S).filter((f) => f.req);
  const ok = () => reqs().every((f) => filled(f, vals[f.k]));
  const secDone = (s) => s.fields.filter((f) => f.req).every((f) => filled(f, vals[f.k]));
  const renderSum = () => {
    const rows = fieldsOf(S).filter((f) => filled(f, vals[f.k]) && f.type !== "textarea").map((f) => `<li><span>${f.label}</span><b>${esc(show(f, vals[f.k]))}</b></li>`).join("");
    const done = reqs().filter((f) => filled(f, vals[f.k])).length;
    $("[data-tf-sum]").innerHTML = rows || `<li class="none">Seçtiklerin burada görünecek.</li>`;
    $("[data-tf-prog]").innerHTML = `<i style="--p:${reqs().length ? done / reqs().length * 100 : 100}%"></i><span>${done}/${reqs().length} zorunlu alan</span>`;
    $("[data-tf-go]").disabled = !ok();
    root.querySelectorAll("[data-goto]").forEach((b) => b.classList.toggle("done", secDone(S.sections[+b.dataset.goto])));
  };
  const renderStep = () => {
    const s = S.sections[step], n = S.sections.length;
    $("[data-tf-steps]").innerHTML = n > 1 ? S.sections.map((x, i) => `<button type="button" class="tfst${i === step ? " on" : ""}" data-goto="${i}" aria-current="${i === step ? "step" : "false"}"><span class="tfs-n">${i + 1}</span>${x.t}${x.opt ? "<em>isteğe bağlı</em>" : ""}</button>`).join("")
      : `<p class="tfst on solo">${ic(s.icon)}${s.t}</p>`;
    $("[data-tf-body]").innerHTML = `<div class="tfs-b${s.mf ? " mf" : ""}">${s.fields.map(field).join("")}</div>`;
    $("[data-tf-foot]").innerHTML = n > 1 ? `<button type="button" class="btn-ghost sm" data-tf-prev${step ? "" : " hidden"}>Geri</button><span class="tf-dots">${S.sections.map((_, i) => `<i${i === step ? ' class="on"' : ""}></i>`).join("")}</span>${step < n - 1 ? `<button type="button" class="btn-primary sm tf-next" data-tf-next>Devam${ic("i-arrow")}</button>` : "<span></span>"}` : "";
    $("[data-tf-foot]").hidden = n < 2;
    renderSum();
  };
  const rerenderField = (k) => { const f = F(k), el = $(`[data-f="${k}"]`); if (f && el) el.outerHTML = field(f); renderSum(); };
  const setGrade = (g) => {
    cur = null; rerenderField("ders");
    loadCur(g).then((c) => { if (String(vals.sinif) !== String(g)) return; cur = c;
      if (vals.ders && !lessons().includes(vals.ders)) { delete vals.ders; vals.tema = []; vals.kaz = []; }
      ["ders", "tema", "kaz"].forEach((k) => F(k) && rerenderField(k)); });
  };
  const open = (id) => {
    tool = find(id); if (!tool) { location.hash = back.slice(1); return false; }
    S = SCHEMAS[tool.schema || tool.id]; defaults(); out = null; step = 0; cur = null; root.classList.remove("has-out");
    root.innerHTML = `<div class="tf-grid"><div class="tf-main"><form class="tf-card" novalidate>
        <nav class="tf-steps" aria-label="Adımlar" data-tf-steps></nav><div class="tf-body" data-tf-body></div><div class="tf-foot" data-tf-foot></div></form>
        <div class="tf-out" data-tf-out hidden></div></div>
      <aside class="tf-side"><div class="tf-hero" style="--hue:${tool.hue};--tint:${tool.tint}"><span class="tf-art"><img src="assets/araclar/t${String(tool.art).padStart(2, "0")}.png" alt=""></span><div><h1 id="tf-h">${esc(tool.name)}</h1><p>${esc(tool.desc)}</p></div></div>
        <div class="tf-sumbox"><p class="tf-sh">Özet</p><ul class="tf-sum" data-tf-sum></ul><div class="tf-prog" data-tf-prog></div></div>
        <button type="button" class="tf-go" data-tf-go disabled>${ic("i-spark")}${S.verb}</button></aside></div>`;
    renderStep(); if (vals.sinif && F("ders")) setGrade(vals.sinif);
    return tool.name;
  };
  // etkileşim
  root.addEventListener("click", (e) => {
    if (e.target.closest("[data-kz-all]")) { e.preventDefault(); const t = e.target.closest("[data-kz-all]").dataset.kzAll, ids = outs(t).map((o) => o.id), all = ids.every((i) => vals.kaz.includes(i));
      vals.kaz = all ? vals.kaz.filter((i) => !ids.includes(i)) : [...new Set([...vals.kaz, ...ids])]; rerenderField("kaz"); return; }
    const c = e.target.closest(".fc[data-k]");
    if (c) { const f = F(c.dataset.k), v = c.dataset.v;
      if (f.type === "multi") { const a = vals[f.k] ||= []; if (a.includes(v)) a.splice(a.indexOf(v), 1); else if (!f.max || a.length < f.max) a.push(v); rerenderField(f.k); }
      else if (f.type === "tema") { const ids = outs(v).map((o) => o.id);
        if (vals.tema.includes(v)) { vals.tema = vals.tema.filter((x) => x !== v); vals.kaz = vals.kaz.filter((i) => !ids.includes(i)); }
        else { vals.tema.push(v); vals.kaz.push(...ids); }   // uygulamadaki gibi: temanın tüm kazanımları seçili gelir
        rerenderField("tema"); rerenderField("kaz"); }
      else if (f.type === "ders") { if (vals.ders !== v) { vals.ders = v; vals.tema = []; vals.kaz = []; } ["ders", "tema", "kaz"].forEach(rerenderField); }
      else if (f.type === "grade") { if (String(vals.sinif) !== v) { vals.sinif = v; rerenderField("sinif"); if (F("ders")) setGrade(v); } }
      else { vals[f.k] = v; rerenderField(f.k); }
      return; }
    const st = e.target.closest("[data-step]");
    if (st) { const f = F(st.dataset.k); vals[f.k] = Math.min(f.max, Math.max(f.min, (+vals[f.k] || 0) + f.step * +st.dataset.step)); rerenderField(f.k); return; }
    const cn = e.target.closest("[data-cnt]");
    if (cn) { const o = vals[cn.dataset.k]; o[cn.dataset.cnt] = Math.max(0, Math.min(30, o[cn.dataset.cnt] + +cn.dataset.d)); rerenderField(cn.dataset.k); return; }
    const qm = e.target.closest("[data-qm]");
    if (qm) { const f = fieldsOf(S).find((x) => x.type === "qmode"); vals[f.k] = qm.dataset.qm === "gorsel" ? { mode: "gorsel", file: vals[f.k]?.file || "" } : { mode: "yaz", text: vals[f.k]?.text || "" }; rerenderField(f.k); return; }
    const gt = e.target.closest("[data-goto]"); if (gt) { step = +gt.dataset.goto; renderStep(); return; }
    if (e.target.closest("[data-tf-next]")) { step = Math.min(S.sections.length - 1, step + 1); renderStep(); return; }
    if (e.target.closest("[data-tf-prev]")) { step = Math.max(0, step - 1); renderStep(); return; }
    if (e.target.closest("[data-tf-go]")) return generate();
    if (e.target.closest("[data-tf-edit]")) { $("[data-tf-out]").hidden = true; root.classList.remove("has-out"); return; }
    if (e.target.closest("[data-tf-again]")) return generate();
    if (e.target.closest("[data-tf-save]")) { onSave?.(tool, vals, out); e.target.closest("[data-tf-save]").outerHTML = `<a class="btn-primary tfo-saved" href="${back}/koleksiyon">${ic("i-check")}Kaydedildi · Koleksiyonda gör</a>`; return; }
  });
  root.addEventListener("change", (e) => {
    const kz = e.target.dataset.kz;
    if (kz) { vals.kaz = e.target.checked ? [...vals.kaz, kz] : vals.kaz.filter((i) => i !== kz);
      const g = e.target.closest(".kz-g"), t = kz.split("|")[0], os = outs(t), n = os.filter((o) => vals.kaz.includes(o.id)).length;
      g.querySelector("summary b").textContent = `${n}/${os.length}`; g.querySelector(".kz-all").textContent = n === os.length ? "Hiçbiri" : "Tümü"; renderSum(); return; }
    const k = e.target.dataset.file; if (k) { vals[k] = [...e.target.files].map((f) => ({ name: f.name })); rerenderField(k); return; }
    if (e.target.matches("[data-qfile]") && e.target.files[0]) { const f = fieldsOf(S).find((x) => x.type === "qmode"); vals[f.k] = { mode: "gorsel", file: e.target.files[0].name }; rerenderField(f.k); }
  });
  root.addEventListener("input", (e) => {
    const k = e.target.dataset.in; if (k) { vals[k] = F(k).type === "number" ? +e.target.value : e.target.value; renderSum(); return; }
    if (e.target.matches("[data-qtext]")) { const f = fieldsOf(S).find((x) => x.type === "qmode"); vals[f.k] = { mode: "yaz", text: e.target.value }; renderSum(); }
  });
  root.addEventListener("dragover", (e) => { const d = e.target.closest("[data-drop]"); if (d) { e.preventDefault(); d.classList.add("hover"); } });
  root.addEventListener("dragleave", (e) => { const d = e.target.closest("[data-drop]"); if (d) d.classList.remove("hover"); });
  root.addEventListener("drop", (e) => { const d = e.target.closest("[data-drop]"); if (!d) return; e.preventDefault(); vals[d.dataset.drop] = [...e.dataTransfer.files].map((f) => ({ name: f.name })); rerenderField(d.dataset.drop); });
  // demo üretim
  const generate = () => {
    if (!ok()) return;
    const box = $("[data-tf-out]"); box.hidden = false; root.classList.add("has-out");
    box.innerHTML = `<div class="tfo-card"><div class="tfo-load"><span class="tf-spin"></span><b>${esc(tool.name)} hazırlanıyor…</b><small>Yapay zekâ girdilerinizi işliyor</small></div></div>`;
    setTimeout(() => {
      const ctx = [vals.sinif && `${vals.sinif}. sınıf`, vals.ders, vals.tema?.length === 1 ? vals.tema[0] : vals.tema?.length ? `${vals.tema.length} tema` : vals.konu].filter(Boolean).join(" · ");
      const lines = fieldsOf(S).filter((f) => filled(f, vals[f.k])).map((f) => `<li><span>${f.label}</span>${esc(show(f, vals[f.k]))}</li>`).join("");
      out = { title: `${tool.name}${ctx ? " · " + ctx : ""}` };
      box.innerHTML = `<div class="tfo-card"><div class="tfo-h"><span class="tf-art sm" style="--tint:${tool.tint}"><img src="assets/araclar/t${String(tool.art).padStart(2, "0")}.png" alt=""></span><div><small>Hazır</small><h2>${esc(out.title)}</h2></div></div>
        <div class="tfo-body"><p class="tfo-note">Bu demo sürümünde içerik üretilmez; gerçek uygulamada çıktı burada açılır. Kullanılan girdiler:</p><ul class="tfo-in">${lines}</ul></div>
        <div class="tfo-act"><button type="button" class="btn-ghost" data-tf-edit>${ic("i-pen")}Girdileri düzenle</button><button type="button" class="btn-ghost" data-tf-again>${ic("i-undo")}Yeniden üret</button><button type="button" class="btn-primary" data-tf-save>${ic("i-folder")}Koleksiyona kaydet</button></div></div>`;
    }, 1300);
  };
  return { open };
}
