// AI-LA öğretmen paneli. Öğrenci paneliyle aynı görünüm dili (css/panel.css), öğretmene özel bölümler (css/ogretmen.css).
// Menü: Ana Sayfa, Araçlar (+ Koleksiyonum), Ajanlar, Topluluk, Öğrencilerim. Ekosistem sol altta, profil sağ üstte, sohbet sağ altta.
// Tüm öğrenci, sınıf ve rapor verisi simülasyondur.
import { hexToOklch, oklchToHex } from "./oklch.js";
import { mountCat } from "./kedi.js";
import { mountWhiteboard } from "./whiteboard.js";
import { mountToolForm } from "./toolform.js";
import { openRowMenu, MORE } from "./rowmenu.js";
import { mountAgents } from "./agents.js";
import { mountWeek, ARROW as WK_ARROW, ico, ders } from "./week.js";
import { HAFTA } from "./hafta.js";
import { PRODUCTS, AREAS, STUDENTS as SAMPLE } from "./data.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ARROW = '<svg class="icon go" aria-hidden="true"><use href="#i-arrow" /></svg>';
const AREA_COLORS = ["#7cb6ff", "#f58fc5", "#f3b45b", "#5fd3b5", "#b49bff", "#ff8f78"];   // universe.js ile aynı

/* ---------- okul rengi (panel.js ile aynı) ---------- */
const THEMES = { mavi: "#345de0", turkuaz: "#008978", mor: "#914db8", turuncu: "#c9582b", deniz: "#1e8a5a" };
const q = new URLSearchParams(location.search);
const c = THEMES[q.get("renk")] || THEMES.mavi;
const [L, C, H] = hexToOklch(c);
const st = document.documentElement.style;
st.setProperty("--s", c);
st.setProperty("--s-ink", oklchToHex([Math.min(L, 0.45), C, H]));
st.setProperty("--s-tint", oklchToHex([0.965, Math.min(C * 0.18, 0.03), H]));
st.setProperty("--v", oklchToHex([Math.min(L + 0.05, 0.62), Math.max(C, 0.16), H + 38]));
st.setProperty("--v-tint", oklchToHex([0.965, 0.03, H + 38]));
const hues = [0, 14, 26, 38].map((d) => [oklchToHex([0.5, Math.max(C, 0.15), H + d]), oklchToHex([0.955, 0.035, H + d])]);

/* ---------- demo veri: sınıflar ve öğrenciler (tohumlu, her açılışta aynı) ---------- */
const seed = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296; };
const NAMES = {
  "7-A": ["Elif Yılmaz", "Mert Arslan", "Zeynep Kaya", "Can Demir", "Ece Şahin", "Yusuf Çelik", "Defne Aydın", "Ali Öztürk", "Nehir Koç", "Emir Kurt", "Duru Polat", "Kerem Aksoy"],
  "7-B": ["Deniz Kılıç", "Ada Yıldız", "Efe Güneş", "Asya Erdem", "Arda Bulut", "Lina Taş", "Ömer Doğan", "Masal Ateş", "Berk Uçar", "İpek Yalçın", "Kaan Sezer"],
  "8-A": ["Selin Avcı", "Burak Tekin", "Ela Bozkurt", "Onur Karaca", "Melis Uysal", "Tuna Esen", "Ceren Duman", "Barış Akın", "Yaren Öz", "Doruk Işık"],
};
const POOL_NAMES = ["Eylül Aslan", "Batu Coşkun", "Sude Kara", "Alp Tunç", "Mira Şen"];
const ADVICE = {
  kavramsal: "Talent14 problem çözme görevleriyle üst düzey düşünmeyi güçlendirebilir.",
  alan: "İçerik platformundaki ara sorulara düzenli dönüş alan becerisini yükseltir.",
  egilim: "Kendi seçtiği küçük projeler merak ve sebat eğilimini besler.",
  sdo: "Talent Cup takım projelerinde dönüşümlü rol alması sosyal becerilerini geliştirir.",
  okuryazarlik: "Okumino'da kaynak karşılaştırma görevleri bilgi okuryazarlığını güçlendirir.",
  erdem: "AI-GALAXY etik modülleri sorumluluk ve dürüstlük konusunu derinleştirir.",
};
const LOGINS = ["Bugün 09:12", "Bugün 08:40", "Dün 19:05", "Dün 16:22", "2 gün önce", "3 gün önce", "Geçen hafta"];
let N = 0;
const makeStudent = (name, cls) => {
  const r = seed(name), bias = cls === "8-A" ? 4 : cls === "7-B" ? -3 : 0;
  const sub = Object.fromEntries(AREAS.map((a) => [a.id, [0, 1, 2].map(() => Math.round(Math.min(97, 56 + r() * 36 + bias)))]));
  const area = (id) => Math.round(sub[id].reduce((x, y) => x + y, 0) / 3);
  const score = Math.round(AREAS.reduce((s, a) => s + area(a.id), 0) / AREAS.length);
  const weak = AREAS.reduce((m, a) => (area(a.id) < area(m) ? a.id : m), AREAS[0].id);
  const tpl = SAMPLE[N % SAMPLE.length];
  return { id: `o${++N}`, name, short: name.replace(/ (\S)\S*$/, " $1."), cls, no: 100 + N, grade: cls ? `${cls[0]}. Sınıf` : "Sınıfsız",
    sub, score, weak, area, advice: ADVICE[weak], events: tpl.events, sources: 6, login: LOGINS[Math.floor(r() * LOGINS.length)], r };
};
const CLASSES = Object.keys(NAMES);
const STU = [...CLASSES.flatMap((c) => NAMES[c].map((n) => makeStudent(n, c))), ...POOL_NAMES.map((n) => makeStudent(n, null))];
const inClass = (c) => STU.filter((s) => s.cls === c);
const avg = (xs) => Math.round(xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length));
const classArea = (c, id) => avg(inClass(c).map((s) => s.area(id)));
const classAvg = (c) => avg(inClass(c).map((s) => s.score));
const initials = (full) => full.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toLocaleUpperCase("tr")).join("") || "?";
const avColor = (s) => hues[s.no % 4][0];

/* ---------- araçlar: whitelabel uygulamasındaki öğretmen araçları + üretim araçları; kart #arac/<id> formunu açar (js/toolform.js) ---------- */
const TOOLS = [
  [11, "Ders Planı Oluştur", "Yöntemleri seçerek kazanıma uygun ders planı.", "plan", "lesson-plan"],
  [15, "Karışık Sınav Oluştur", "Süre, zorluk, Bloom ve soru türü dağılımıyla sınav.", "olcme", "mix_exam_generator"],
  [16, "Temel Kabuller Soru Seti", "Hazırbulunuşluğu ölçen başlangıç soruları.", "olcme", "basic-assumptions-guide"],
  [3, "Hikâye-Drama Oluştur", "Değer eğitimi için hikâye, drama ya da masal.", "plan", "story-drama"],
  [12, "Veli Toplantısı Raporu", "Analiz dosyasından veliye anlaşılır rapor.", "rapor", "parent-meeting-report"],
  [8, "Performans Gelişim Özeti", "Gelişim raporunu kısa bir özete çevir.", "rapor", "rapor-ozetleme-asistani"],
  [7, "Yaşantı Temelli Öğrenme", "Konuyu gerçek hayattan bir yaşantıyla kur.", "plan", "yasanti_temelli_ogrenme_ogretmen"],
  [9, "Etkinlik Oluştur", "Kazanıma uygun, süresi ayarlı sınıf etkinliği.", "plan", "deneyle_anlat"],
  [10, "Proje Ödevi Oluştur", "Ürün türü ve teslim süresiyle proje ödevi.", "plan", "performans_odevi_olustur"],
  [14, "Öğrenme Kanıtları Üret", "Kazanımın gerçekleştiğini gösteren kanıtlar.", "olcme", "ogrenme_kanitlari_uret"],
  [6, "Simülasyon Aracı", "Konuyu etkileşimli bir simülasyonla göster.", "plan", "simulation-test"],
  [14, "Sınav Okuyucu", "Cevap kâğıtlarını anahtara göre oku ve puanla.", "olcme", "exam_reader"],
  [5, "Bilişim Ders Planı Oluştur", "Scratch'ten Python'a bilişim dersi planı.", "plan", "bilisim_ders_plani"],
  [1, "Görsel Oluştur", "Anlatımı güçlendiren ders görselleri.", "uretim", "gorsel"],
  [2, "Video Oluştur", "Konuyu kısa bir videoyla anlat.", "uretim", "video"],
  [11, "Sunum Hazırla", "Konuyu ver, slaytlar birlikte kurulsun.", "uretim", "sunum"],
  [4, "Müzik Oluştur", "Etkinlikler için kısa müzik.", "uretim", "muzik"],
  [13, "Seslendirme", "Metni doğal bir sesle okut.", "uretim", "ses"],
];
TOOLS.forEach((t, i) => { t.n = i; });
const CATS = [["tum", "Tümü"], ["plan", "Planlama"], ["olcme", "Ölçme"], ["rapor", "Raporlama"], ["uretim", "Üretim"]];
const toolCard = (tool) => {
  const [art, t, d] = tool, [hue, tint] = hues[tool.n % 4];
  return `<li><a class="tool" href="#arac/${tool[4]}" style="--hue:${hue};--tint:${tint}">
    <span class="tool-art"><img src="assets/araclar/t${String(art).padStart(2, "0")}.png" alt="" loading="lazy"></span>
    <strong>${t}</strong><span>${d}</span>${ARROW}</a></li>`;
};
$("[data-tools]").innerHTML = TOOLS.slice(0, 8).map(toolCard).join("");
const allTools = $("[data-all-tools]"), toolsEmpty = $("[data-tools-empty]");
let cat = "tum", term = "";
const norm = (x) => x.toLocaleLowerCase("tr");
const renderTools = () => {
  const list = TOOLS.filter((t) => (cat === "tum" || t[3] === cat) && (!term || norm(t[1] + " " + t[2]).includes(term)));
  allTools.innerHTML = list.map(toolCard).join("");
  toolsEmpty.hidden = list.length > 0;
};
const chips = (host, items, onPick) => {
  host.innerHTML = items.map(([id, label], i) => `<button type="button" class="chip" aria-pressed="${i === 0}" data-id="${id}">${label}</button>`).join("");
  host.addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    $$(".chip", host).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    onPick(b.dataset.id);
  });
};
chips($("[data-tool-chips]"), CATS, (id) => { cat = id; renderTools(); });
renderTools();

// Araçlar / Koleksiyonum sekmeleri
const setTab = (tab) => {
  $$("[data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === tab)));
  $$("[data-pane]").forEach((p) => { p.hidden = p.dataset.pane !== tab; });
};
$$("[data-tab]").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));

/* ---------- koleksiyon: ürettiklerin ----------
   Mevcut uygulamadaki araç türleri, sınıf/ders filtresi, paylaşılanlar ve "Atanabilir" korunur; tek filtre çubuğu,
   kütüphane + klasör menüsü, kartta Aç / Sınıfa ata / Paylaş / Klasör, sayfalama yerine "daha fazla göster". Demo veri. */
const KTOOLS = {
  sinav: ["Karışık Sınav Oluştur", 15], plan: ["Ders Planı Oluştur", 11], kabul: ["Temel Kabuller Soru Seti", 16],
  drama: ["Hikâye-Drama Oluştur", 3], veli: ["Veli Toplantısı Raporu", 12], perf: ["Performans Gelişim Özeti", 8],
  sim: ["Simülasyon Aracı", 6], okuyucu: ["Sınav Okuyucu", 14], gorsel: ["Görsel Oluştur", 1], video: ["Video Oluştur", 2],
};
const DERSLER = ["Fen Bilimleri", "Matematik", "Türkçe", "Sosyal Bilgiler", "İngilizce"];
const KONU = {
  "Fen Bilimleri": ["Elektriğin İletimi ve Direnç", "Işığın Dünyası", "Maddenin Doğası", "Kuvveti Tanıyalım", "Gökyüzündeki Komşularımız", "Hücre ve Bölünmeler"],
  "Matematik": ["Geometrik Şekiller", "Veriden Olasılığa", "Geometrik Nicelikler", "Kesirler", "Doğal Sayılar"],
  "Türkçe": ["Oyun Dünyası", "Erdemler", "Okuma Kültürü", "Millî Kültürümüz"],
  "Sosyal Bilgiler": ["Birey ve Toplum", "Kültür ve Miras"], "İngilizce": ["My Daily Routine", "Festivals"],
};
let folders = ["Fen 5. sınıf", "Matematik 5", "Veli raporları", "Sınavlar"];
const COL = [];
{
  const r = seed("koleksiyon"), keys = Object.keys(KTOOLS);
  for (let i = 0; i < 46; i++) {
    const k = keys[Math.floor(r() * keys.length)], d = k === "veli" || k === "perf" ? null : DERSLER[Math.floor(r() * (r() < .6 ? 2 : DERSLER.length))];
    const grade = k === "veli" ? 8 : 5 + Math.floor(r() * 3);
    const konu = d ? KONU[d][Math.floor(r() * KONU[d].length)] : null;
    const title = k === "veli" ? `${["Kaan Yılmaz", "Ece Şahin", "8-A sınıfı", "Defne Aydın"][i % 4]} veli raporu`
      : k === "perf" ? `${["7-A", "7-B", "8-A"][i % 3]} performans özeti` : k === "plan" ? `${d} (${grade}. sınıf) ders planı`
      : k === "okuyucu" ? `${d} sınav değerlendirmesi` : k === "drama" ? `Drama: ${["sabır", "paylaşmak", "dürüstlük"][i % 3]}`
      : k === "gorsel" ? ["Güneş sistemi posteri", "Bilim şenliği afişi", "Yardımcı robot", "Masal kapağı"][i % 4] : k === "video" ? "Fotosentez özet videosu" : `${d} - ${konu}`;
    const folder = k === "veli" ? "Veli raporları" : k === "sinav" && r() < .5 ? "Sınavlar" : d === "Fen Bilimleri" && r() < .4 ? "Fen 5. sınıf" : d === "Matematik" && r() < .4 ? "Matematik 5" : null;
    const img = k === "gorsel" ? ["uzay", "afis", "robot", "masal"][i % 4] : k === "video" ? "foto" : null;
    COL.push({ id: `c${i}`, t: title, k, ders: d, grade: k === "perf" ? null : grade, folder, d: i * 2 + Math.floor(r() * 2),
      atanabilir: ["sinav", "okuyucu", "kabul", "sim"].includes(k), assigned: [], shared: r() < .14, fromOther: r() < .07 ? ["Gül Arslan", "Hakan Demir"][i % 2] : null, img });
  }
  const asg = COL.filter((x) => x.atanabilir && !x.fromOther);   // yalnız atanabilir üretimler sınıfa gider
  if (asg[0]) asg[0].assigned = ["7-A"]; if (asg[2]) asg[2].assigned = ["7-B", "8-A"];
}
const PAGE = 18;
let colLib = "tum", colFolder = null, colTool = "", colGrade = "", colDers = "", colAssignable = false, colQ = "", colView = "grid", colShown = PAGE;
const LIB = [["tum", "Tüm üretimler", "i-layers"], ["paylasilan", "Benimle paylaşılan", "i-people"], ["paylastigim", "Paylaştıklarım", "i-share"], ["atanan", "Sınıflara atanan", "i-school"]];
const libFilter = { tum: (x) => !x.fromOther, paylasilan: (x) => !!x.fromOther, paylastigim: (x) => x.shared, atanan: (x) => x.assigned.length > 0 };
const ago = (d) => d === 0 ? "Bugün" : d === 1 ? "Dün" : d < 7 ? `${d} gün önce` : d < 30 ? `${Math.round(d / 7)} hafta önce` : `${Math.round(d / 30)} ay önce`;
const colList = () => COL.filter((x) => (colFolder ? x.folder === colFolder && !x.fromOther : libFilter[colLib](x))
  && (!colTool || x.k === colTool) && (!colGrade || String(x.grade) === colGrade) && (!colDers || x.ders === colDers)
  && (!colAssignable || x.atanabilir) && (!colQ || norm(x.t + " " + KTOOLS[x.k][0]).includes(colQ)))
  .sort((a, b) => { const s = $("[data-col-sort]").value; return s === "ad" ? a.t.localeCompare(b.t, "tr") : s === "eski" ? b.d - a.d : a.d - b.d; });
const fillSelects = () => {
  const base = COL.filter((x) => (colFolder ? x.folder === colFolder : libFilter[colLib](x)));
  const cnt = (f) => base.filter(f).length;
  $("[data-col-tool]").innerHTML = `<option value="">Tümü (${base.length})</option>` + Object.entries(KTOOLS).filter(([k]) => cnt((x) => x.k === k)).map(([k, [n]]) => `<option value="${k}"${k === colTool ? " selected" : ""}>${n} (${cnt((x) => x.k === k)})</option>`).join("");
  $("[data-col-grade]").innerHTML = `<option value="">Tümü</option>` + [5, 6, 7, 8].map((g) => `<option value="${g}"${String(g) === colGrade ? " selected" : ""}>${g}. sınıf</option>`).join("");
  $("[data-col-ders]").innerHTML = `<option value="">Tümü</option>` + DERSLER.map((d) => `<option${d === colDers ? " selected" : ""}>${d}</option>`).join("");
};
const renderLib = () => {
  $("[data-col-lib]").innerHTML = LIB.map(([id, label, ic]) => `<li><button type="button" class="col-f" aria-pressed="${!colFolder && id === colLib}" data-lib="${id}"><svg class="icon" aria-hidden="true"><use href="#${ic}" /></svg><span>${label}</span><b>${COL.filter(libFilter[id]).length}</b></button></li>`).join("");
  $("[data-col-folders]").innerHTML = folders.map((f) => `<li><button type="button" class="col-f" aria-pressed="${f === colFolder}" data-f="${esc(f)}"><svg class="icon" aria-hidden="true"><use href="#i-folder" /></svg><span>${esc(f)}</span><b>${COL.filter((x) => x.folder === f).length}</b></button></li>`).join("");
  $("[data-col-count]").textContent = COL.filter(libFilter.tum).length;
};
const renderActive = () => {
  const pills = [colTool && ["tool", KTOOLS[colTool][0]], colGrade && ["grade", `${colGrade}. sınıf`], colDers && ["ders", colDers], colAssignable && ["as", "Atanabilir"], colQ && ["q", `“${$("[data-col-q]").value.trim()}”`]].filter(Boolean);
  $("[data-col-active]").innerHTML = pills.length ? pills.map(([k, l]) => `<button type="button" class="apill" data-rm="${k}">${esc(l)}<svg class="icon" aria-hidden="true"><use href="#i-x" /></svg></button>`).join("") + `<button type="button" class="linkish" data-col-clear>Tümünü temizle</button>` : "";
};
const colCard = (x) => { const [tn, art] = KTOOLS[x.k];
  return `<li class="col-item" data-id="${x.id}">
    <span class="col-shot${x.img ? "" : " doc"}">${x.img ? `<img src="assets/thumbs/${x.img}.jpg" alt="" loading="lazy">` : `<img src="assets/araclar/t${String(art).padStart(2, "0")}.png" alt="">`}${x.k === "video" ? '<svg class="icon play" aria-hidden="true"><use href="#i-video" /></svg>' : ""}
      <span class="col-acts"><button type="button" class="ca" data-act="ac" title="Aç" aria-label="Aç"><svg class="icon"><use href="#i-eye" /></svg></button>${x.atanabilir ? `<button type="button" class="ca" data-act="ata" title="Sınıfa ata" aria-label="Sınıfa ata"><svg class="icon"><use href="#i-school" /></svg></button>` : ""}<button type="button" class="ca" data-act="paylas" title="Paylaş" aria-label="Paylaş"><svg class="icon"><use href="#i-share" /></svg></button><label class="ca" title="Klasöre taşı"><svg class="icon" aria-hidden="true"><use href="#i-folder" /></svg><select aria-label="${esc(x.t)} klasörü" data-move="${x.id}"><option value="">Klasörsüz</option>${folders.map((f) => `<option${f === x.folder ? " selected" : ""}>${esc(f)}</option>`).join("")}</select></label></span></span>
    <span class="col-meta"><strong title="${esc(x.t)}">${esc(x.t)}</strong><span class="col-tool">${tn}</span>
      <span class="col-tags">${x.grade ? `<i>${x.grade}. sınıf</i>` : ""}${x.atanabilir ? `<i class="ok">Atanabilir</i>` : ""}${x.assigned.length ? `<i class="as">${x.assigned.join(", ")} atandı</i>` : ""}${x.shared ? `<i class="sh">Paylaşıldı</i>` : ""}</span>
      <span class="col-foot"><span>${x.fromOther ? `${esc(x.fromOther)} paylaştı · ` : ""}${ago(x.d)}</span>${x.folder ? `<span class="col-fb"><svg class="icon" aria-hidden="true"><use href="#i-folder" /></svg>${esc(x.folder)}</span>` : ""}</span></span>
  </li>`; };
const renderCol = (keep = false) => {
  if (!keep) colShown = PAGE;
  const list = colList(), shown = list.slice(0, colShown);
  const grid = $("[data-col-grid]"); grid.classList.toggle("list", colView === "list");
  grid.innerHTML = shown.map(colCard).join("");
  $("[data-col-empty]").hidden = list.length > 0;
  $("[data-col-more]").innerHTML = list.length > colShown ? `<span>${list.length} üretimden ${shown.length} gösteriliyor</span><button type="button" class="btn-ghost" data-col-moreb>Daha fazla göster</button>` : list.length ? `<span>${list.length} üretim</span>` : "";
  renderActive();
};
const colAll = () => { renderLib(); fillSelects(); renderCol(); };
$("[data-col-lib]").addEventListener("click", (e) => { const b = e.target.closest("[data-lib]"); if (!b) return; colLib = b.dataset.lib; colFolder = null; colAll(); });
$("[data-col-folders]").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (!b) return; colFolder = b.dataset.f; colAll(); });
$("[data-col-tool]").addEventListener("change", (e) => { colTool = e.target.value; renderCol(); });
$("[data-col-grade]").addEventListener("change", (e) => { colGrade = e.target.value; renderCol(); });
$("[data-col-ders]").addEventListener("change", (e) => { colDers = e.target.value; renderCol(); });
$("[data-col-sort]").addEventListener("change", () => renderCol());
$("[data-col-q]").addEventListener("input", (e) => { colQ = norm(e.target.value.trim()); renderCol(); });
$("[data-col-assignable]").addEventListener("click", (e) => { colAssignable = !colAssignable; e.currentTarget.setAttribute("aria-pressed", String(colAssignable)); renderCol(); });
$$("[data-col-view]").forEach((b) => b.addEventListener("click", () => { colView = b.dataset.colView; $$("[data-col-view]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); renderCol(true); }));
const clearCol = () => { colTool = colGrade = colDers = colQ = ""; colAssignable = false; $("[data-col-q]").value = ""; $("[data-col-assignable]").setAttribute("aria-pressed", "false"); fillSelects(); renderCol(); };
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-col-clear]")) clearCol();
  const rm = e.target.closest("[data-rm]");
  if (rm) { ({ tool: () => { colTool = ""; }, grade: () => { colGrade = ""; }, ders: () => { colDers = ""; }, as: () => { colAssignable = false; $("[data-col-assignable]").setAttribute("aria-pressed", "false"); }, q: () => { colQ = ""; $("[data-col-q]").value = ""; } })[rm.dataset.rm](); fillSelects(); renderCol(); }
  if (e.target.closest("[data-col-moreb]")) { colShown += PAGE; renderCol(true); }
});
$("[data-col-grid]").addEventListener("change", (e) => { const s = e.target.closest("[data-move]"); if (!s) return; COL.find((x) => x.id === s.dataset.move).folder = s.value || null; renderLib(); renderCol(true); });
// kart işlemleri: Aç (demo bilgi), Sınıfa ata, Paylaş
const asDlg = $("[data-as-dlg]"); let asItem = null, asMode = null;
$("[data-col-grid]").addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  asItem = COL.find((x) => x.id === b.closest("[data-id]").dataset.id); asMode = b.dataset.act;
  const f = $("[data-as-fields]"); $("[data-as-ok]").hidden = false; $("[data-as-status]").textContent = "";
  if (asMode === "ata") {
    $("[data-as-title]").textContent = "Sınıfa ata"; $("[data-as-text]").textContent = `“${asItem.t}” öğrencilere görev olarak gönderilecek.`; $("[data-as-ok]").textContent = "Ata";
    f.innerHTML = `<div class="as-cls">${CLASSES.map((c) => `<label><input type="checkbox" value="${c}"${asItem.assigned.includes(c) ? " checked" : ""}><span>${c}<small>${inClass(c).length} öğrenci</small></span></label>`).join("")}</div>
      <label class="fld"><span>Son teslim</span><input type="date" data-as-date></label>`;
  } else if (asMode === "paylas") {
    $("[data-as-title]").textContent = "Paylaş"; $("[data-as-text]").textContent = `“${asItem.t}” okulunuzdaki öğretmenlerle paylaşılacak.`; $("[data-as-ok]").textContent = "Paylaş";
    f.innerHTML = `<label class="fld"><span>Kiminle</span><select data-as-who><option>Tüm zümre öğretmenleri</option><option>Gül Arslan</option><option>Hakan Demir</option><option>Seda Kaya</option></select></label>`;
  } else {
    $("[data-as-title]").textContent = asItem.t; $("[data-as-ok]").hidden = true;
    $("[data-as-text]").textContent = `${KTOOLS[asItem.k][0]} ile ${ago(asItem.d).toLocaleLowerCase("tr")} üretildi. Demoda içerik önizlemesi yok; gerçek uygulamada burada açılır.`;
    f.innerHTML = "";
  }
  asDlg.showModal();
});
$("[data-as-form]").addEventListener("submit", (e) => {
  e.preventDefault();
  if (asMode === "ata") {
    const sel = $$(".as-cls input:checked", asDlg).map((i) => i.value);
    if (!sel.length) { $("[data-as-status]").textContent = "En az bir sınıf seçin."; $("[data-as-status]").className = "pf-saved on bad"; return; }
    asItem.assigned = sel;
  } else if (asMode === "paylas") asItem.shared = true;
  asDlg.close(); renderLib(); renderCol(true);
});
$("[data-as-close]").addEventListener("click", () => asDlg.close());
asDlg.addEventListener("click", (e) => { if (e.target === asDlg) asDlg.close(); });
$("[data-col-new]").addEventListener("click", () => {
  const ul = $("[data-col-folders]"); if ($(".col-f-new", ul)) return;
  const li = document.createElement("li"); li.innerHTML = `<input class="col-f-new" placeholder="Klasör adı" maxlength="28" aria-label="Yeni klasör adı">`;
  ul.append(li); const inp = $("input", li); inp.focus();
  const done = () => { const v = inp.value.trim(); if (v && !folders.includes(v)) { folders.push(v); colFolder = v; } colAll(); };
  inp.addEventListener("keydown", (e) => { if (e.key === "Enter") done(); if (e.key === "Escape") renderLib(); });
  inp.addEventListener("blur", done);
});

colAll();

/* ---------- araç formu: üretilen koleksiyonun başına eklenir ---------- */
const COLK = { "lesson-plan": "plan", mix_exam_generator: "sinav", "basic-assumptions-guide": "kabul", "story-drama": "drama", "parent-meeting-report": "veli",
  "rapor-ozetleme-asistani": "perf", "simulation-test": "sim", exam_reader: "okuyucu", gorsel: "gorsel", video: "video" };
const toolForm = mountToolForm($('[data-view="arac"]'), {
  find: (id) => { const t = TOOLS.find((x) => x[4] === id); if (!t) return null; const [hue, tint] = hues[t.n % 4]; return { id, art: t[0], name: t[1], desc: t[2], hue, tint }; },
  onSave: (tool, v, out) => {
    const k = COLK[tool.id] || tool.id; KTOOLS[k] ||= [tool.name, tool.art];
    COL.unshift({ id: `n${Date.now()}`, t: out.title, k, ders: v.ders || null, grade: v.sinif ? +v.sinif : null, folder: null, d: 0,
      atanabilir: ["sinav", "okuyucu", "kabul", "sim"].includes(k), assigned: [], shared: false, fromOther: null, img: k === "gorsel" ? "uzay" : null });
    colAll();
  },
});

/* ---------- ajanlar: yöneticideki yapı (js/agents.js) - planla, kaydet; AI-LA plana göre çalıştırır, çıktı buraya düşer ----------
   Öğretmende tek seferlik üretim işleri Araçlar'da; burada yalnız düzenli tekrar eden üç iş: öğrenci analizi, veli bilgilendirme, ödev takibi. */
const areaName = (id) => AREAS.find((a) => a.id === id).short;
const pick = (v) => STU.filter((s) => v.siniflar.includes(s.cls));
const T_AGENTS = [
  { id: "analiz", art: 16, name: "Öğrenci Analizi Ajanı", desc: "Her hafta sınıflarınızın beceri ve teslim verisini özetler.",
    what: "Sınıflarınızdaki öğrencilerin beceri haritasını, görev teslimlerini ve giriş sıklığını inceler; sınıf ortalamalarını, güçlü ve zayıf alanları ve ilgilenmeniz gereken öğrencileri tek sayfada toplar.",
    reads: "Beceri haritası, haftalık görev teslimleri, AI araç kullanımı, son giriş tarihleri", makes: "Sınıf özeti + ilgilenilmesi gereken öğrenciler + her biri için öneri",
    sched: { f: "haftalik", days: [0], t: "08:00" }, on: true,
    inputs: [["siniflar", "Sınıflar", "checks", CLASSES], ["odak", "Odak", "select", ["Tüm alanlar", ...AREAS.map((a) => a.short)]], ["esik", "Dikkat eşiği (beceri puanı)", "number", 72]],
    run: (v) => { const l = pick(v), low = l.filter((s) => s.score < +v.esik).sort((a, b) => a.score - b.score);
      const cls = v.siniflar.map((c) => `${c}: ortalama ${classAvg(c)}, en zayıf alan ${areaName(AREAS.reduce((m, a) => (classArea(c, a.id) < classArea(c, m.id) ? a : m), AREAS[0]).id)}`);
      return { title: `Haftalık analiz · ${v.siniflar.join(", ") || "sınıf seçilmedi"}`, lines: [...cls, low.length ? `${low.length} öğrenci ${v.esik} puanın altında: ${low.slice(0, 4).map((s) => `${s.short} (${s.score})`).join(", ")}` : `${v.esik} puanın altında öğrenci yok. En düşük üç: ${[...l].sort((a, b) => a.score - b.score).slice(0, 3).map((s) => `${s.short} (${s.score})`).join(", ")}`,
        ...low.slice(0, 2).map((s) => `${s.short} · ${areaName(s.weak)}: ${s.advice}`)] }; } },
  { id: "veli", art: 3, name: "Veli Bilgilendirme Ajanı", desc: "Haftalık sınıf özetinden veli mesajı taslağı hazırlar, onayınızı bekler.",
    what: "Haftanın görevlerini, sınıfın gelişimini ve duyuruları velilere uygun, sade bir dille yazar. Siz onaylamadan hiçbir mesaj gönderilmez.",
    reads: "Öğrenci Analizi Ajanı'nın haftalık özeti, görev teslimleri, okul duyuruları", makes: "Sınıf başına veli mesajı taslağı (onay bekler)",
    sched: { f: "haftalik", days: [4], t: "16:00" }, on: true,
    inputs: [["sinif", "Sınıf", "select", CLASSES], ["ton", "Üslup", "select", ["Sıcak ve kısa", "Resmî"]], ["icerik", "İçerik", "checks", ["Haftanın görevi", "Sınıf gelişimi", "Duyurular", "Evde yapılabilecekler"]], ["onay", "Göndermeden önce onayımı al", "toggle", true]],
    run: (v) => ({ title: `Veli mesajı taslağı · ${v.sinif}`, lines: [
      v.ton === "Resmî" ? `Sayın velimiz, ${v.sinif} sınıfımız bu hafta yapay zekâ destekli görevlerde ortalama ${classAvg(v.sinif)} beceri puanına ulaştı.` : `Merhaba! ${v.sinif} bu hafta harika çalıştı; sınıf ortalaması ${classAvg(v.sinif)} puan oldu.`,
      ...(v.icerik.includes("Haftanın görevi") ? ["Bu haftanın görevi: yapay zekâyla bir oyunun kurallarını yazmak. Teslim oranı %78."] : []),
      ...(v.icerik.includes("Duyurular") ? ["Duyuru: Talent Cup takım projeleri gelecek hafta başlıyor."] : []),
      ...(v.icerik.includes("Evde yapılabilecekler") ? ["Evde: çocuğunuzla akşam yemeğinde günün sorusunu konuşabilirsiniz."] : []),
      v.onay ? "Durum: onayınızı bekliyor." : "Durum: uygulama bildirimiyle gönderildi."] }) },
  { id: "odev", art: 7, name: "Ödev Takip Ajanı", desc: "Teslim tarihi yaklaşan görevlerde teslim etmeyenleri bulur, hatırlatır.",
    what: "Sınıflarınıza atadığınız görevlerin teslim durumunu izler; son tarihe az kala teslim etmeyen öğrencileri listeler ve seçtiğiniz kişilere kısa bir hatırlatma hazırlar.",
    reads: "Atadığınız görevler ve son teslim tarihleri, öğrenci teslimleri", makes: "Teslim etmeyenler listesi + hatırlatma metni",
    sched: { f: "haftaici", days: [0, 1, 2, 3, 4], t: "15:30" }, on: false,
    inputs: [["gun", "Son teslime kaç gün kala", "number", 2], ["kime", "Hatırlatma kime", "select", ["Öğrenciye bildirim", "Öğrenci ve veliye", "Yalnız bana liste"]]],
    run: (v) => { const miss = STU.filter((s) => s.cls && s.r && s.no % 5 === 0).slice(0, 5);
      return { title: `${miss.length} öğrenci görevi henüz teslim etmedi`, lines: [`“Yapay zekâyla oyun kuralı yaz” görevinin son teslimine ${v.gun} gün kaldı.`, ...miss.map((s) => `${s.name} (${s.cls}) · son giriş ${s.login.toLocaleLowerCase("tr")}`), v.kime === "Yalnız bana liste" ? "Hatırlatma gönderilmedi; liste yalnız size." : `Hatırlatma: ${v.kime.toLocaleLowerCase("tr")} gönderilecek.`] }; } },
];
const T_EXAMPLES = { analiz: ["8-A'yı ayrıntılı incele", "Geçen haftayla karşılaştır"], veli: ["Talent Cup duyurusunu ekle", "Kısa tut, 3 cümle"], odev: ["Önce 7-A'yı listele"] };
mountAgents($('[data-view="ajanlar"]'), { agents: T_AGENTS, examples: T_EXAMPLES, hues, key: "aila-ajanlar-ogretmen", runner: "AI-LA" });

/* ---------- ekosistem ve topluluk (öğrenci paneliyle aynı) ---------- */
const ECO = [
  { img: "talent14", logo: "assets/talent14.png", name: "Talent14", text: "Dijital beceri ve teknoloji eğitimi.", feeds: "Kavramsal · Okuryazarlık" },
  { img: "ai-galaxy", logo: "assets/ai-galaxy.png", mono: true, name: "AI-GALAXY", text: "Yapay zekâ okuryazarlığı modülleri ve üretim stüdyosu.", feeds: "Okuryazarlık · Erdem-Değer" },
  { img: "okumino", logo: "assets/okumino-logo.png", name: "Okumino", text: "Hızlı okuma ve anlama egzersizleri.", feeds: "Okuryazarlık · Kavramsal" },
  { img: "codemino", logo: "assets/codemino-logo.png", name: "Codemino", text: "Oyun içinde blok kodlama görevleri.", feeds: "Kavramsal · Alan" },
  { img: "talentcup", logo: "assets/talentcup-mark.png", tc: true, name: "Talent Cup", text: "Öğrenci yarışmaları ve takım projeleri.", feeds: "Sosyal-Duygusal · Eğilimler" },
  { img: "icerik", label: "Dijital İçerik Platformu", name: "Dijital İçerik Platformu", text: "Okulunun kullandığı ders içerikleri ve ara sorular.", feeds: "Alan · Eğilimler" },
];
$("[data-eco]").innerHTML = ECO.map((p) => `<li><a class="eco" href="#">
  <span class="eco-shot"><img src="assets/carousel/${p.img}.jpg" alt="" loading="lazy"></span>
  <span class="eco-body">
    <span class="eco-logo">${p.label ? `<b class="eco-word">${p.label}</b>` : p.tc ? `<span class="eco-tc"><img src="${p.logo}" alt="">TALENT CUP</span>` : `<img src="${p.logo}" alt="${p.name}"${p.mono ? ' class="mono"' : ""}>`}</span>
    <span class="eco-text">${p.text}</span>
    <span class="eco-feeds"><svg class="icon" aria-hidden="true"><use href="#i-compass" /></svg>${p.feeds}</span>
  </span></a></li>`).join("");
const FEED = [
  { img: "masal", who: "Gül Öğretmen", g: "Türkçe", t: "Masal yazma etkinliği kapakları", likes: 48 },
  { img: "robot", who: "Mert A.", g: "7-A", t: "Sınıf robotumuz Pıtır", likes: 36 },
  { img: "afis", who: "Hakan Öğretmen", g: "Fen", t: "Bilim şenliği afiş şablonu", likes: 31 },
  { img: "oyun", who: "Can Y.", g: "6-C", t: "İlk platform oyunum", likes: 27 },
  { img: "uzay", who: "Elif Y.", g: "7-A", t: "Güneş sistemi posteri", likes: 22 },
  { img: "muzik", who: "Seda Öğretmen", g: "Müzik", t: "Ders başı odak müziği", likes: 19 },
];
const thumb = (a, cls) => `<span class="${cls}"><img src="assets/thumbs/${a.img}.jpg" alt="" loading="lazy"></span>`;
$("[data-feed]").innerHTML = FEED.map((f) => `<li><article class="post">${thumb(f, "post-shot")}
  <div class="post-meta"><span class="post-av">${initials(f.who)}</span><span class="post-text"><strong>${f.t}</strong><span>${f.who} · ${f.g}</span></span>
  <button type="button" class="like" aria-pressed="false" aria-label="Beğen"><svg class="icon" aria-hidden="true"><use href="#i-heart" /></svg><b>${f.likes}</b></button></div></article></li>`).join("");
$("[data-feed]").addEventListener("click", (e) => {
  const b = e.target.closest(".like"); if (!b) return;
  const on = b.getAttribute("aria-pressed") !== "true", n = b.querySelector("b");
  b.setAttribute("aria-pressed", String(on)); n.textContent = +n.textContent + (on ? 1 : -1);
});
$("[data-top]").innerHTML = FEED.slice(0, 4).map((f, i) => `<li><span class="rank">${i + 1}</span>${thumb(f, "top-shot")}<span class="top-text"><strong>${f.t}</strong><span>${f.who} · ${f.likes} beğeni</span></span></li>`).join("");

/* ---------- ana sayfa sağ sütun: beceri haritası + sınıfların durumu ---------- */
const allAvg = avg(CLASSES.map(classAvg));
$("[data-all-avg]").textContent = allAvg;
$("[data-kt-bars]").innerHTML = AREAS.map((a) => `<i style="--p:${avg(CLASSES.map((c) => classArea(c, a.id)))}%"></i>`).join("");
$("[data-cls-mini]").innerHTML = CLASSES.map((c) => `<li><a class="clsm" href="#beceri/${c}">
  <span class="clsm-name">${c}</span>
  <span class="clsm-mid"><span class="clsm-bars">${AREAS.map((a, i) => `<i style="--v:${classArea(c, a.id)};--c:${AREA_COLORS[i]}" title="${a.short} ${classArea(c, a.id)}"></i>`).join("")}</span><span>${inClass(c).length} öğrenci</span></span>
  <b>${classAvg(c)}</b></a></li>`).join("");
$("[data-stu-total]").textContent = STU.length;

/* ---------- öğrencilerim: sınıflar + havuz ---------- */
let stuCls = CLASSES[0], stuQ = "";
const scoreBar = (v) => `<span class="sc"><i style="--p:${v}%"></i><b>${v}</b></span>`;
const renderStuSide = () => {
  $("[data-stu-cls]").innerHTML = [...CLASSES.map((c) => [c, c, inClass(c).length, "i-school"]), ["havuz", "Havuz", STU.filter((s) => !s.cls).length, "i-inbox"]].map(([id, label, n, ic]) =>
    `<li><button type="button" class="col-f${id === "havuz" ? " pool" : ""}" aria-pressed="${id === stuCls}" data-cls="${id}"><svg class="icon" aria-hidden="true"><use href="#${ic}" /></svg><span>${label}${id === "havuz" ? "<small>Sınıfı olmayanlar</small>" : ""}</span><b>${n}</b></button></li>`).join("");
};
const renderStu = () => {
  const pool = stuCls === "havuz";
  const list = STU.filter((s) => (pool ? !s.cls : s.cls === stuCls) && (!stuQ || norm(s.name).includes(stuQ)));
  $("[data-stu-head]").innerHTML = pool
    ? `<div><h2>Havuz</h2><p>Henüz bir sınıfa atanmamış öğrenciler. Sınıfa atadığında listeden çıkar.</p></div>`
    : `<div><h2>${stuCls} <span>${inClass(stuCls).length} öğrenci · ortalama ${classAvg(stuCls)}</span></h2><p>Fen Bilimleri · Demo Okulları</p></div><a class="btn-ghost" href="#beceri/${stuCls}"><svg class="icon" aria-hidden="true"><use href="#i-compass" /></svg>Sınıfın beceri haritası</a>`;
  $("[data-stu-body]").innerHTML = list.map((s) => `<div class="stu-row" role="row">
    <span role="cell" class="stu-who"><span class="avatar sm" style="background:${avColor(s)}">${initials(s.name)}</span><span><strong>${esc(s.name)}</strong><small>No ${s.no}</small></span></span>
    <span role="cell">${scoreBar(s.score)}</span>
    <span role="cell" class="stu-login">${s.login}</span>
    <span role="cell" class="r stu-act" data-sid="${s.id}">${pool
      ? `<label class="assign"><select aria-label="${esc(s.name)} için sınıf" data-assign="${s.id}"><option value="">Sınıfa ata…</option>${CLASSES.map((c) => `<option>${c}</option>`).join("")}</select></label>`
      : ""}<a class="btn-ghost sm" href="#beceri/ogr/${s.id}"><svg class="icon" aria-hidden="true"><use href="#i-compass" /></svg>Beceri Haritası</a>${MORE(`${esc(s.name)} için diğer işlemler`)}</span>
  </div>`).join("") || `<p class="empty">Bu aramayla eşleşen öğrenci yok.</p>`;
};
$("[data-stu-cls]").addEventListener("click", (e) => { const b = e.target.closest("[data-cls]"); if (!b) return; stuCls = b.dataset.cls; renderStuSide(); renderStu(); });
$("[data-stu-q]").addEventListener("input", (e) => { stuQ = norm(e.target.value.trim()); renderStu(); });
$("[data-stu-body]").addEventListener("change", (e) => {
  const s = e.target.closest("[data-assign]"); if (!s || !s.value) return;
  STU.find((x) => x.id === s.dataset.assign).cls = s.value; renderStuSide(); renderStu(); renderMini();
});
const renderMini = () => { $$("[data-cls-mini] .clsm").forEach((a, i) => { const cl = CLASSES[i]; a.querySelector(".clsm-mid > span:last-child").textContent = `${inClass(cl).length} öğrenci`; a.querySelector("b").textContent = classAvg(cl); }); };
// parola sıfırla
const rsDlg = $("[data-rs-dlg]"); let rsWho = null;
$("[data-stu-body]").addEventListener("click", (e) => {
  const b = e.target.closest("[data-more]"); if (!b) return;
  const who = STU.find((x) => x.id === b.closest("[data-sid]").dataset.sid);
  openRowMenu(b, [["Parola sıfırla", "i-key", () => openReset(who)]]);
});
const openReset = (who) => {
  rsWho = who;
  $("[data-rs-text]").textContent = `${rsWho.name} için geçici bir parola oluşturulacak. Mevcut parolası geçersiz olur.`;
  $("[data-rs-pass]").hidden = true; $("[data-rs-ok]").hidden = false; rsDlg.showModal();
};
$("[data-rs-ok]").addEventListener("click", () => {
  const code = `${initials(rsWho.name)}-${Math.floor(1000 + rsWho.r() * 9000)}`;
  $("[data-rs-code]").textContent = code; $("[data-rs-pass]").hidden = false; $("[data-rs-ok]").hidden = true;
  $("[data-rs-text]").textContent = `${rsWho.name} için parola sıfırlandı.`;
});
$("[data-rs-close]").addEventListener("click", () => rsDlg.close());
rsDlg.addEventListener("click", (e) => { if (e.target === rsDlg) rsDlg.close(); });
renderStuSide(); renderStu();

/* ---------- beceri haritası: sınıflar -> sınıf -> öğrenci ---------- */
const bmBody = $("[data-bm-body]"), bmMap = $("[data-bm-map]");
let skill = null;
const ring = (v, size = "") => `<span class="ring ${size}" style="--p:${v}"><b>${v}</b></span>`;
const areaBars = (get) => `<ul class="abars">${AREAS.map((a, i) => { const v = get(a.id); return `<li style="--c:${AREA_COLORS[i]}"><span>${a.short}</span><span class="abar"><i style="--p:${v}%"></i></span><b>${v}</b></li>`; }).join("")}</ul>`;
const crumbs = (items) => items.map(([t, h]) => h ? `<a href="${h}">${t}</a>` : `<span>${t}</span>`).join('<svg class="icon" aria-hidden="true"><use href="#i-arrow" /></svg>');
const REPORT = (s) => {
  const r = seed(s.name + "r");
  const n = (a, b) => Math.round(a + r() * (b - a));
  return [
    ["t14", `${n(12, 22)}/24 ders tamamlandı`, n(55, 95), "Kavramsal · Okuryazarlık"],
    ["okumino", `${n(110, 190)} kelime/dk · anlama %${n(70, 95)}`, n(55, 95), "Okuryazarlık · Kavramsal"],
    ["codemino", `Bölüm ${n(3, 8)} · ${n(18, 46)} görev`, n(45, 95), "Kavramsal · Alan"],
    ["tc", `${n(1, 3)} yarışma · ${n(1, 4)} takım projesi`, n(40, 95), "Sosyal-Duygusal · Eğilimler"],
    ["aig", `Modül ${n(3, 8)}/8 · ${n(6, 30)} üretim`, n(50, 95), "Okuryazarlık · Erdem-Değer"],
    ["icerik", `Ara sorular %${n(62, 94)} doğru`, n(60, 95), "Alan · Eğilimler"],
  ];
};
const renderBeceri = (arg, arg2) => {
  skill?.stop();
  const title = $("[data-bm-title]"), sub = $("[data-bm-sub]"), cr = $("[data-bm-crumbs]");
  if (arg === "ogr" && STU.find((s) => s.id === arg2)) {
    const s = STU.find((x) => x.id === arg2);
    bmBody.hidden = true; bmMap.hidden = false;
    cr.innerHTML = crumbs([["Beceri Haritası", "#beceri"], ...(s.cls ? [[s.cls, `#beceri/${s.cls}`]] : []), [s.name]]);
    title.textContent = s.name; sub.textContent = "Ekosistemdeki çalışmaları Maarif Modeli’nin altı beceri alanına işlenir.";
    $("[data-km-meta]").textContent = `${s.cls || "Havuz"} · ${s.sources} platform`;
    $("[data-reports]").innerHTML = REPORT(s).map(([id, m, v, feeds]) => { const p = PRODUCTS.find((x) => x.id === id); return `<li class="rep">
      <span class="rep-logo">${p.label ? `<b>İçerik</b>` : `<img src="${p.logo}" alt="${p.name}"${p.mono ? ' class="mono"' : ""}>`}</span>
      <span class="rep-txt"><strong>${p.label ? "Dijital İçerik" : p.name}</strong><span>${m}</span><span class="abar"><i style="--p:${v}%"></i></span><small>${feeds}</small></span>
      <b>${v}</b></li>`; }).join("");
    setKmTab("karne");
    const stage = $("[data-km-stage]");
    stage.innerHTML = '<canvas data-km-canvas aria-hidden="true"></canvas><div class="km-labels" data-km-labels></div>';
    import("./skillmap.js").then(({ mountSkillMap }) => {
      skill = mountSkillMap({ stage, canvas: $("[data-km-canvas]"), labels: $("[data-km-labels]"), karne: $("[data-karne]"), advice: $("[data-advice]"), scoreEl: $("[data-km-score]"), student: { ...s, name: s.short } });
      if (view === "beceri") skill.start();
    });
    return s.name;
  }
  bmMap.hidden = true; bmBody.hidden = false;
  if (CLASSES.includes(arg)) {
    const list = inClass(arg).sort((a, b) => b.score - a.score), weakA = AREAS.reduce((m, a) => (classArea(arg, a.id) < classArea(arg, m.id) ? a : m), AREAS[0]);
    cr.innerHTML = crumbs([["Beceri Haritası", "#beceri"], [arg]]);
    title.textContent = `${arg} beceri haritası`; sub.textContent = `${list.length} öğrenci · sınıf ortalaması ${classAvg(arg)}`;
    bmBody.innerHTML = `<div class="bm-cls">
      <section class="bm-card"><div class="bm-card-h">${ring(classAvg(arg), "lg")}<div><h2>Sınıf ortalaması</h2><p>Altı beceri alanında</p></div></div>${areaBars((id) => classArea(arg, id))}
        <p class="bm-note"><b>Destek gereken alan:</b> ${weakA.name}. ${ADVICE[weakA.id]}</p></section>
      <section class="bm-card bm-list"><h2>Öğrenciler</h2><ul>${list.map((s) => `<li><a href="#beceri/ogr/${s.id}"><span class="avatar sm" style="background:${avColor(s)}">${initials(s.name)}</span><span class="bl-name"><strong>${esc(s.name)}</strong><small>En düşük: ${AREAS.find((a) => a.id === s.weak).short}</small></span><span class="mini6">${AREAS.map((a, i) => `<i style="--v:${s.area(a.id)};--c:${AREA_COLORS[i]}"></i>`).join("")}</span><b>${s.score}</b>${ARROW}</a></li>`).join("")}</ul></section>
    </div>`;
    return `${arg} beceri haritası`;
  }
  cr.innerHTML = "";
  title.textContent = "Beceri Haritası"; sub.textContent = "Sınıflarının Maarif Modeli’nin altı beceri alanındaki durumu. Bir sınıf seç, öğrencilerine in.";
  bmBody.innerHTML = `<ul class="bm-grid">${CLASSES.map((cl) => `<li><a class="bm-card bm-class" href="#beceri/${cl}">
    <div class="bm-card-h">${ring(classAvg(cl))}<div><h2>${cl}</h2><p>${inClass(cl).length} öğrenci</p></div>${ARROW}</div>${areaBars((id) => classArea(cl, id))}</a></li>`).join("")}</ul>`;
  return "Beceri Haritası";
};
const setKmTab = (t) => { $$("[data-kmtab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.kmtab === t))); $$("[data-kmpane]").forEach((p) => { p.hidden = p.dataset.kmpane !== t; }); };
$$("[data-kmtab]").forEach((b) => b.addEventListener("click", () => setKmTab(b.dataset.kmtab)));

/* ---------- ana sayfa karuseli: öğretmen için duyuru, haftanın görevi, yönlendirme, haftanın sözü ---------- */
const G = HAFTA.gorev;
const T_SLIDES = [
  { label: "Duyuru", tone: "dark", img: "assets/carousel/talent14.jpg", pos: "50% 45%",
    copy: `<span class="kicker">${ico("i-bell")}Okul duyurusu · 6 Kasım Perşembe</span>
      <h2>Öğretmenler kurulu<span>15.30 · Toplantı salonu</span></h2>
      <p>Gündem: birinci dönem ara değerlendirmesi ve AI araçlarının sınıf içi kullanımı. Öncesinde kısa anketi doldurmanız rica olunur.</p>
      <a class="cta" href="#formlar/gelisim">Anketi doldur${WK_ARROW}</a>` },
  { label: "Haftanın görevi", tone: "light", img: G.img, pos: "62% 50%",
    copy: `<span class="kicker">${ico("i-book")}Öğrencilerinizin bu haftaki AI görevi · ${HAFTA.aralik}</span>
      <h2>${G.t}</h2>
      <p>${G.ozet} Teslimleri sınıf sınıf izleyebilir, görevi kendi sınıfınıza uyarlayabilirsiniz.</p>
      <span class="wk-meta">${ders(G.ders)}<span>Son gün ${G.teslim}</span><span>7-A: 9/12 teslim</span></span>
      <a class="cta" href="#ogrencilerim">Teslimleri gör${WK_ARROW}</a>` },
  HAFTA.yarisma && { label: "Yarışma", tone: "dark", img: HAFTA.yarisma.img, pos: "50% 40%", narrow: true,
    copy: `<span class="kicker">${ico("i-spark")}Duyuru · öğrencileriniz için</span>
      <h2>${HAFTA.yarisma.ad}<span>${HAFTA.yarisma.slogan}</span></h2>
      <p>Öğrencilerinizi takım projeleriyle yarışmaya yönlendirin. Takvim ve kategoriler talentcup.org’da.</p>
      <a class="cta" href="${HAFTA.yarisma.href}" target="_blank" rel="noopener">Yarışmayı incele${WK_ARROW}</a>` },
  { label: "Bu hafta deneyin", tone: "dark", img: HAFTA.uretimGorsel.img, pos: "50% 45%",
    copy: `<span class="kicker">${ico("i-wand")}Bu hafta deneyin</span>
      <h2>Pazartesi sabahı sınıf analiziniz hazır olsun</h2>
      <p>Öğrenci Analizi Ajanı her pazartesi 08:00'de sınıflarınızın beceri ve teslim verisini özetler, ilgilenmeniz gereken öğrencileri listeler.</p>
      <a class="cta" href="#ajanlar">Ajanı aç${WK_ARROW}</a>` },
  { label: "Haftanın sözü", tone: "dark", img: HAFTA.ilham.img, pos: "50% 60%",
    copy: `<span class="kicker">${ico("i-heart")}Haftanın sözü</span>
      <blockquote><p>“Bir çocuk, bir öğretmen, bir kalem ve bir kitap dünyayı değiştirebilir.”</p><footer>Malala Yousafzai</footer></blockquote>` },
].filter(Boolean);
const week = mountWeek($("[data-week]"), T_SLIDES);

/* ---------- whiteboard (js/whiteboard.js) ---------- */
const wb = mountWhiteboard($('[data-view="whiteboard"]'));
$("[data-wb-name]").addEventListener("input", (e) => { $("[data-wb-last]").textContent = `Son tahta: ${e.target.value || "Adsız"} · bugün`; });
const openWb = () => wb.open();

/* ---------- sayfalar ---------- */
let view = "ana";
const VIEWS = $$("[data-view]").map((v) => v.dataset.view);
const LABELS = { ana: "Ana Sayfa", whiteboard: "Whiteboard", araclar: "Araçlar", ajanlar: "Ajanlar", ekosistem: "Ekosistem", topluluk: "Topluluk", ogrencilerim: "Öğrencilerim", profil: "Profil" };
const go = () => {
  const [h, a1, a2] = location.hash.slice(1).split("/").map(decodeURIComponent);
  view = VIEWS.includes(h) ? h : "ana";
  $$("[data-view]").forEach((v) => { v.hidden = v.dataset.view !== view; });
  document.body.dataset.page = view;
  const navKey = view === "beceri" ? "ogrencilerim" : view === "arac" ? "araclar" : view;
  $$("[data-nav]").forEach((a) => { if (a.dataset.nav === navKey) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  let label = LABELS[view];
  if (view === "beceri") label = renderBeceri(a1, a2); else skill?.stop();
  if (view === "formlar") label = openForm(a1);
  if (view === "arac") label = toolForm.open(a1) || "Araçlar";
  if (view === "araclar") setTab(a1 === "koleksiyon" ? "koleksiyon" : "arac");
  if (view === "whiteboard") openWb(); else wb.close();
  week.active(view === "ana");
  document.title = `${label} · AI-LA`;
};

/* ---------- formlar: Sizi tanıyalım + Öğretmen Gelişim Formu (aynı adım motoru) ---------- */
const A = (n) => `assets/araclar/t${String(n).padStart(2, "0")}.png`, P = (n) => `assets/profil/p${String(n).padStart(2, "0")}.png`;
const FORMS = {
  tani: { title: "Sizi tanıyalım", sub: "Yaklaşık 3 dakika · cevaplarınız araç önerilerini kişiselleştirir", steps: [
    { id: "merhaba", art: "assets/profil/p05a.png", title: "Merhaba! Sizi biraz tanıyalım.", text: "Birkaç kısa soru. Cevaplarınıza göre araçları, ajanları ve önerileri size uygun hale getiririz.", next: "Başlayalım" },
    { id: "brans", art: A(11), title: "Branşınız nedir?", text: "Birini seçin.", max: 1, opts: [["Sınıf öğretmeni", A(16)], ["Türkçe", A(12)], ["Matematik", A(15)], ["Fen Bilimleri", A(6)], ["Sosyal Bilgiler", A(11)], ["İngilizce", A(3)], ["Bilişim", A(5)], ["Diğer", A(8)]] },
    { id: "kademe", art: A(16), title: "Hangi kademelerde ders veriyorsunuz?", text: "Birden fazla seçebilirsiniz.", max: 3, opts: [["İlkokul", A(1)], ["Ortaokul", A(11)], ["Lise", A(15)]] },
    { id: "deneyim", art: A(3), title: "Yapay zekâyı ne kadar kullanıyorsunuz?", text: "Size en yakın olanı seçin.", max: 1, opts: [["Hiç kullanmadım", A(3)], ["Birkaç kez denedim", A(12)], ["Düzenli kullanıyorum", A(7)], ["Derslerimde kullanıyorum", A(11)]] },
    { id: "amac", art: A(8), title: "En çok neyde yardım istersiniz?", text: "En çok 3 tane seçin.", max: 3, opts: [["Ders planı", A(11)], ["Ölçme-değerlendirme", A(15)], ["Görsel materyal", A(1)], ["Veli iletişimi", A(3)], ["Farklılaştırma", A(16)], ["Sunum", A(11)]] },
    { id: "bitti", art: P(8), title: "Teşekkürler, sizi tanıdık!", text: "Araç ve ajan önerileriniz bundan sonra cevaplarınıza göre gelecek.", next: "Profile dön", done: true },
  ] },
  gelisim: { title: "Öğretmen Gelişim Formu", sub: "Yaklaşık 4 dakika · size uygun eğitimler önerilir", steps: [
    { id: "merhaba", art: P(8), title: "Gelişim yolculuğunuzu planlayalım.", text: "Hangi konularda gelişmek istediğinizi ve nasıl öğrenmeyi sevdiğinizi soracağız.", next: "Başlayalım" },
    { id: "alan", art: A(16), title: "Hangi konularda gelişmek istersiniz?", text: "En çok 3 tane seçin.", max: 3, opts: [["Doğru komut yazma", A(3)], ["AI ile ölçme-değerlendirme", A(15)], ["Etik ve güvenlik", P(2)], ["Görsel ve video üretimi", A(2)], ["Ajan kurma", A(7)], ["Beceri haritasını okuma", A(16)]] },
    { id: "bicim", art: A(2), title: "Nasıl öğrenmeyi tercih edersiniz?", text: "En çok 2 tane seçin.", max: 2, opts: [["Kısa videolar", A(2)], ["Canlı eğitim", A(3)], ["Yazılı rehber", A(12)], ["Uygulamalı atölye", A(5)]] },
    { id: "zaman", art: A(13), title: "Haftada ne kadar zaman ayırabilirsiniz?", text: "Birini seçin.", max: 1, opts: [["15 dakika", A(13)], ["30 dakika", A(12)], ["1 saat", A(11)], ["Daha fazla", P(8)]] },
    { id: "hedef", art: P(1), title: "Bu dönemki hedefinizi bir cümleyle yazar mısınız?", text: "Örneğin: “Her ünitenin sonunda AI ile farklılaştırılmış bir etkinlik hazırlamak.”", input: true },
    { id: "bitti", art: P(8), title: "Planınız hazır!", text: "Size uygun eğitimleri ve kısa rehberleri Ana Sayfa'da göreceksiniz.", next: "Profile dön", done: true },
  ] },
};
let formId = null, steps = null;
const tani = { i: 0, picks: {}, note: "" };
const taniStep = $("[data-tani-step]"), taniDots = $("[data-tani-dots]"), taniArt = $("[data-tani-art]");
const taniPrev = $("[data-tani-prev]"), taniSkip = $("[data-tani-skip]"), taniHint = $("[data-tani-hint]");
const openForm = (id) => {
  id = FORMS[id] ? id : "tani";
  if (id !== formId) {
    formId = id; steps = FORMS[id].steps; Object.assign(tani, { i: 0, picks: {}, note: "" });
    $("[data-form-title]").textContent = FORMS[id].title; $("[data-form-sub]").textContent = FORMS[id].sub;
    taniDots.innerHTML = steps.map((s, i) => `<li><button type="button" aria-label="Adım ${i + 1}" data-go="${i}">${i + 1}</button></li>`).join("");
    renderTani();
  }
  return FORMS[id].title;
};
const renderTani = (dir = 0) => {
  const s = steps[tani.i], picked = tani.picks[s.id] || [];
  let body = `<h2>${s.title}</h2><p class="tani-text">${s.text}</p>`;
  if (s.opts) body += `<div class="tani-opts${s.opts.length > 6 ? " many" : ""}" role="group" aria-label="${s.title}">${s.opts.map(([t, img]) =>
    `<button type="button" class="opt" aria-pressed="${picked.includes(t)}" data-opt="${esc(t)}"><span class="opt-img"><img src="${img}" alt=""></span><span class="opt-t">${t}</span><span class="opt-check" aria-hidden="true"><svg class="icon"><use href="#i-check" /></svg></span></button>`).join("")}</div>`;
  if (s.input) body += `<label class="tani-input"><textarea rows="3" maxlength="160" placeholder="Buraya yazın…" data-tani-note>${esc(tani.note)}</textarea><em data-tani-left>${160 - tani.note.length}</em></label>`;
  if (s.done) body += `<div class="tani-sum">${Object.values(tani.picks).flat().map((t) => `<span>${t}</span>`).join("") || "<span>Seçim yapmadınız</span>"}</div>`;
  taniStep.innerHTML = body;
  taniStep.classList.remove("in-l", "in-r"); void taniStep.offsetWidth;
  if (dir) taniStep.classList.add(dir > 0 ? "in-r" : "in-l");
  taniArt.classList.remove("pop"); void taniArt.offsetWidth; taniArt.classList.add("pop");
  taniArt.src = s.art;
  $("[data-tani-count]").textContent = `${tani.i + 1} / ${steps.length}`;
  $$("button", taniDots).forEach((b, i) => {
    b.classList.toggle("done", i < tani.i); b.classList.toggle("now", i === tani.i);
    if (i === tani.i) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
    b.disabled = i > tani.i;
  });
  taniPrev.hidden = tani.i === 0 || s.done;
  taniSkip.hidden = !s.opts && !s.input;
  $("[data-tani-next-label]").textContent = s.next || (tani.i === steps.length - 2 ? "Bitir" : "Devam");
  taniHint.textContent = s.max > 1 ? `${picked.length} / ${s.max} seçildi` : "";
  const note = $("[data-tani-note]");
  if (note) note.addEventListener("input", () => { tani.note = note.value; $("[data-tani-left]").textContent = 160 - note.value.length; });
};
const taniGo = (to) => { const d = Math.sign(to - tani.i); tani.i = Math.max(0, Math.min(steps.length - 1, to)); renderTani(d); };
taniStep.addEventListener("click", (e) => {
  const b = e.target.closest(".opt"); if (!b) return;
  const s = steps[tani.i], list = tani.picks[s.id] || (tani.picks[s.id] = []), t = b.dataset.opt;
  if (s.max === 1) { list.length = 0; list.push(t); $$(".opt", taniStep).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); }
  else if (list.includes(t)) { list.splice(list.indexOf(t), 1); b.setAttribute("aria-pressed", "false"); }
  else if (list.length < s.max) { list.push(t); b.setAttribute("aria-pressed", "true"); }
  else { taniHint.textContent = `En çok ${s.max} tane seçebilirsiniz`; b.classList.remove("nope"); void b.offsetWidth; b.classList.add("nope"); return; }
  taniHint.textContent = s.max > 1 ? `${list.length} / ${s.max} seçildi` : "";
});
$("[data-tani-form]").addEventListener("submit", (e) => {
  e.preventDefault();
  if (steps[tani.i].done) { location.hash = "profil"; return; }
  taniGo(tani.i + 1);
  if (steps[tani.i].done) {
    const link = $(`[data-form-link="${formId}"]`);
    link.querySelector(".tile-eyebrow").textContent = "Tamamlandı";
    link.querySelector(".tile-go").firstChild.textContent = "Cevaplarını gör";
  }
});
taniPrev.addEventListener("click", () => taniGo(tani.i - 1));
taniSkip.addEventListener("click", () => taniGo(tani.i + 1));
taniDots.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b && !b.disabled) taniGo(+b.dataset.go); });

/* ---------- üst arama: Öğrencilerim'deyken öğrenci, başka yerde araç süzer ---------- */
$("[data-search]").addEventListener("input", (e) => {
  const v = norm(e.target.value.trim());
  if (view === "ogrencilerim") { stuQ = v; $("[data-stu-q]").value = e.target.value; renderStu(); return; }
  term = v; renderTools();
  if (term && view !== "araclar") { location.hash = "araclar"; setTab("arac"); }
});

/* ---------- kenar menü ---------- */
const app = $(".app"), sideBtn = $("[data-side-toggle]");
const setSide = (collapsed) => { app.classList.toggle("is-collapsed", collapsed); sideBtn.setAttribute("aria-expanded", String(!collapsed)); sideBtn.setAttribute("aria-label", collapsed ? "Menüyü aç" : "Menüyü daralt"); };
try { setSide(localStorage.getItem("aila-side") === "dar"); } catch (e) { /* yok say */ }
sideBtn.addEventListener("click", () => { const cl = !app.classList.contains("is-collapsed"); setSide(cl); try { localStorage.setItem("aila-side", cl ? "dar" : "genis"); } catch (e) { /* yok say */ } });

/* ---------- profil (panel.js ile aynı davranış) ---------- */
const setText = (sel, v) => $$(sel).forEach((el) => { el.textContent = v; });
const PF_TAGS = ["Deney", "Proje tabanlı öğrenme", "Oyunlaştırma", "Kodlama", "Okuma", "Doğa", "Sanat", "Robotik", "Ölçme", "Rehberlik"];
const pfOn = new Set(["Deney", "Proje tabanlı öğrenme"]);
const tagsHost = $("[data-pf-tags]");
tagsHost.innerHTML = PF_TAGS.map((t) => `<button type="button" class="tag" aria-pressed="${pfOn.has(t)}">${t}</button>`).join("");
const flashT = new WeakMap();
const flash = (el, msg, bad = false) => { el.textContent = msg; el.classList.toggle("bad", bad); el.classList.add("on"); clearTimeout(flashT.get(el)); flashT.set(el, setTimeout(() => el.classList.remove("on"), 2600)); };
tagsHost.addEventListener("click", (e) => {
  const b = e.target.closest(".tag"); if (!b) return;
  const on = b.getAttribute("aria-pressed") !== "true";
  if (on && $$(".tag[aria-pressed=true]", tagsHost).length >= 5) { flash($("[data-pf-status]"), "En çok 5 ilgi alanı seçebilirsiniz.", true); return; }
  b.setAttribute("aria-pressed", String(on));
});
const about = $("[data-pf-about]"), aboutCount = $("[data-pf-count]");
const countAbout = () => { aboutCount.textContent = `${about.value.length}/${about.maxLength}`; };
about.addEventListener("input", countAbout); countAbout();
$("[data-pf-form]").addEventListener("submit", (e) => {
  e.preventDefault();
  const ad = $("[data-pf-ad]");
  if (ad.value.trim().split(/\s+/).length < 2) { ad.setAttribute("aria-invalid", "true"); ad.focus(); flash($("[data-pf-status]"), "Ad ve soyadınızı birlikte yazın.", true); return; }
  ad.removeAttribute("aria-invalid");
  setText("[data-fullname]", ad.value.trim()); setText("[data-name]", ad.value.trim().split(/\s+/)[0] + " Hoca"); setText("[data-avatar]", initials(ad.value));
  flash($("[data-pf-status]"), "Kaydedildi");
});
const avBtn = $("[data-av-btn]"), avMenu = $("[data-av-menu]"), avFile = $("[data-av-file]");
const applyAvatar = (src) => $$("[data-avatar]").forEach((el) => { el.classList.toggle("has-img", !!src); el.style.backgroundImage = src ? `url("${src}")` : ""; });
const storeAvatar = (src) => { try { if (src) localStorage.setItem("aila-avatar-ogretmen", src); else localStorage.removeItem("aila-avatar-ogretmen"); } catch (e) { /* yok say */ } };
try { applyAvatar(localStorage.getItem("aila-avatar-ogretmen")); } catch (e) { /* yok say */ }
const avOpen = (open) => { avMenu.hidden = !open; avBtn.setAttribute("aria-expanded", String(open)); };
avBtn.addEventListener("click", (e) => { e.stopPropagation(); avOpen(avMenu.hidden); });
document.addEventListener("click", (e) => { if (!e.target.closest(".pf-avatar-wrap")) avOpen(false); });
avMenu.addEventListener("click", (e) => {
  const b = e.target.closest("[data-av]"); if (!b) return;
  if (b.dataset.av === "upload") { avFile.click(); return; }
  const src = b.dataset.av === "remove" ? null : b.dataset.av; applyAvatar(src); storeAvatar(src); avOpen(false);
});
avFile.addEventListener("change", () => {
  const f = avFile.files[0]; if (!f) return;
  const img = new Image();
  img.onload = () => {
    const n = 256, side = Math.min(img.width, img.height), cv = document.createElement("canvas"); cv.width = cv.height = n;
    cv.getContext("2d").drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, n, n);
    const src = cv.toDataURL("image/jpeg", .86); applyAvatar(src); storeAvatar(src); avOpen(false); URL.revokeObjectURL(img.src); avFile.value = "";
  };
  img.src = URL.createObjectURL(f);
});
const dlg = $("[data-pw-dlg]"), pwForm = $("[data-pf-pass-form]");
const pwNew = $("[data-pw-new]"), pwMeter = $("[data-pw-meter]"), pwTip = $("[data-pw-tip]");
const TIP = "En az 8 karakter, bir rakam ve bir büyük harf.";
$("[data-pw-open]").addEventListener("click", () => { pwForm.reset(); pwMeter.dataset.level = 0; pwTip.textContent = TIP; dlg.showModal(); $("[data-pw-old]").focus(); });
$("[data-pw-close]").addEventListener("click", () => dlg.close());
dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
$$("[data-pw-eye]").forEach((b) => b.addEventListener("click", () => { const i = b.previousElementSibling, show = i.type === "password"; i.type = show ? "text" : "password"; b.setAttribute("aria-label", show ? "Parolayı gizle" : "Parolayı göster"); }));
const strength = (v) => [v.length >= 8, /\d/.test(v), /[A-ZÇĞİÖŞÜ]/.test(v), v.length >= 12 || /[^\w\s]/.test(v)].filter(Boolean).length;
pwNew.addEventListener("input", () => { const n = pwNew.value ? strength(pwNew.value) : 0; pwMeter.dataset.level = n; pwTip.textContent = !pwNew.value ? TIP : ["Çok zayıf", "Zayıf", "Fena değil", "İyi", "Güçlü"][n]; });
pwForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const stt = $("[data-pw-status]");
  if (!$("[data-pw-old]").value) return flash(stt, "Mevcut parolanızı yazın.", true);
  if (strength(pwNew.value) < 3) return flash(stt, "Yeni parola daha güçlü olmalı.", true);
  if ($("[data-pw-again]").value !== pwNew.value) return flash(stt, "İki parola aynı değil.", true);
  dlg.close(); $("[data-pw-open] .tile-text").textContent = "Parolanız az önce güncellendi";
});
const sizeSeg = $("[data-pf-size]");
const setSize = (k) => { document.documentElement.classList.toggle("text-l", k === "l"); $$("button", sizeSeg).forEach((b) => b.setAttribute("aria-checked", String(b.dataset.size === k))); };
try { setSize(localStorage.getItem("aila-yazi") || "n"); } catch (e) { /* yok say */ }
sizeSeg.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; setSize(b.dataset.size); try { localStorage.setItem("aila-yazi", b.dataset.size); } catch (e2) { /* yok say */ } });

/* ---------- sohbet (öğrenci paneliyle aynı, öğretmen önerileriyle; geçmiş ayrı tutulur) ---------- */
const MODELS = ["Gemini 2.5 Flash Lite", "Gemini 2.5 Flash", "GPT-4.1 mini", "Claude Haiku"];
const IDEAS = ["7. sınıf fen için kuvvet konusunda 40 dakikalık ders planı hazırla.", "Kesirler için 5 soruluk çıkış kartı yaz.", "Velilere bilim şenliği duyurusu yaz.", "Fotosentezi üç seviyede anlatan etkinlik öner.", "Proje ödevi için 4 ölçütlü rubrik hazırla."];
const DEMO = [
  "Elbette. Sınıf seviyesini ve ders süresini doğruladım; giriş, keşif, açıklama ve değerlendirme adımlarıyla bir plan önerebilirim. Kazanım kodunu da eklemek ister misiniz?",
  "Hazırladığım taslak üç bölümden oluşuyor:\n1. Isınma sorusu\n2. Ana etkinlik (grup çalışması)\n3. Çıkış kartı\nBeğenirseniz Koleksiyonunuza kaydedebilirim.",
  "Bunu öğrencilerin seviyesine göre üç farklı zorlukta hazırlayabilirim. Hangi sınıf için olsun?",
];
const ac = $("[data-ai-chat]"), acLog = $("[data-ac-log]"), acHello = $("[data-ac-hello]"), acInput = $("[data-ac-input]"), acSend = $("[data-ac-send]");
const acScroll = $("[data-ac-scroll]"), acList = $("[data-ac-list]"), acFab = $("[data-chat-fab]");
let chats = [], cur = null, model = MODELS[0], demoI = 0;
try { chats = JSON.parse(localStorage.getItem("aila-sohbetler-ogretmen") || "[]"); } catch (e) { chats = []; }
const save = () => { try { localStorage.setItem("aila-sohbetler-ogretmen", JSON.stringify(chats.slice(0, 50))); } catch (e) { /* yok say */ } };
const dayLabel = (ts) => { const d = new Date(ts), t = new Date(), y = new Date(); y.setDate(t.getDate() - 1); return d.toDateString() === t.toDateString() ? "Bugün" : d.toDateString() === y.toDateString() ? "Dün" : "Daha önce"; };
const renderList = () => {
  $("[data-ac-count]").textContent = `${chats.length} sohbet`;
  if (!chats.length) { acList.innerHTML = `<div class="ac-empty"><span class="ac-empty-ic"><svg class="icon" aria-hidden="true"><use href="#i-spark" /></svg></span><strong>Henüz sohbet yok</strong><span>Yeni bir sohbet başlatarak AI-LA ile konuşmaya başlayın!</span></div>`; return; }
  let html = "", last = "";
  chats.forEach((ch) => { const g = dayLabel(ch.ts); if (g !== last) { html += `<p class="ac-group">${g}</p>`; last = g; }
    html += `<div class="ac-item${cur && ch.id === cur.id ? " on" : ""}"><button type="button" class="ac-open" data-open="${ch.id}">${esc(ch.title)}</button><button type="button" class="ac-del" aria-label="Sohbeti sil" data-del="${ch.id}"><svg class="icon" aria-hidden="true"><use href="#i-trash" /></svg></button></div>`; });
  acList.innerHTML = html;
};
const msgHtml = (m) => m.r === "me" ? `<li class="ac-msg me">${esc(m.t)}</li>` : `<li class="ac-msg ai"><img class="ac-av" src="assets/kedi-yuz.png" alt=""><div><span class="ac-who">AI-LA · ${esc(m.m || model)}</span><p>${esc(m.t).replace(/\n/g, "<br>")}</p></div></li>`;
const kedi = mountCat($("[data-ac-cat]"));
const syncCat = () => { if (!ac.hidden && !acHello.hidden) kedi.start(); else kedi.stop(); };
const renderChat = () => { acHello.hidden = !!(cur && cur.msgs.length); syncCat(); acLog.innerHTML = cur ? cur.msgs.map(msgHtml).join("") : ""; $("[data-ac-title]").textContent = cur ? cur.title : "Yeni sohbet"; acScroll.scrollTop = acScroll.scrollHeight; renderList(); };
const openAc = (open) => { ac.hidden = !open; acFab.setAttribute("aria-expanded", String(open)); document.body.classList.toggle("chat-full", open); if (open) { renderChat(); acInput.focus(); } else { kedi.stop(); acFab.focus(); } };
acFab.addEventListener("click", () => openAc(true));
$("[data-ac-close]").addEventListener("click", () => openAc(false));
const mList = $("[data-ac-model-list]"), mBtn = $("[data-ac-model-btn]");
const toggleModels = (open) => { mList.hidden = !open; mBtn.setAttribute("aria-expanded", String(open)); };
addEventListener("keydown", (e) => { if (e.key === "Escape" && !ac.hidden) { if (!mList.hidden) toggleModels(false); else openAc(false); } });
$$("[data-ac-side-toggle]").forEach((b) => b.addEventListener("click", () => ac.classList.toggle("side-off")));
$("[data-ac-new]").addEventListener("click", () => { cur = null; renderChat(); acInput.focus(); });
acList.addEventListener("click", (e) => {
  const o = e.target.closest("[data-open]"), d = e.target.closest("[data-del]");
  if (o) { cur = chats.find((x) => x.id === o.dataset.open) || null; renderChat(); }
  if (d) { chats = chats.filter((x) => x.id !== d.dataset.del); if (cur && cur.id === d.dataset.del) cur = null; save(); renderChat(); }
});
const renderModels = () => { mList.innerHTML = MODELS.map((m) => `<li role="option" aria-selected="${m === model}" tabindex="0" data-model="${m}">${m}<svg class="icon" aria-hidden="true"><use href="#i-check" /></svg></li>`).join(""); };
renderModels();
mBtn.addEventListener("click", () => toggleModels(mList.hidden));
mList.addEventListener("click", (e) => { const li = e.target.closest("[data-model]"); if (!li) return; model = li.dataset.model; $("[data-ac-model]").textContent = model; renderModels(); toggleModels(false); });
document.addEventListener("click", (e) => { if (!e.target.closest(".ac-model")) toggleModels(false); });
const acGrow = () => { acInput.style.height = "auto"; acInput.style.height = Math.min(acInput.scrollHeight, 200) + "px"; acSend.disabled = !acInput.value.trim(); };
acInput.addEventListener("input", acGrow);
acInput.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("[data-ac-form]").requestSubmit(); } });
$("[data-ac-shuffle]").addEventListener("click", () => { acInput.value = IDEAS[Math.floor(Math.random() * IDEAS.length)]; acGrow(); acInput.focus(); });
$$(".ac-sug").forEach((b) => b.addEventListener("click", () => { acInput.value = b.textContent.trim(); acGrow(); $("[data-ac-form]").requestSubmit(); }));
$("[data-ac-attach]").addEventListener("click", () => { acInput.placeholder = "Dosya ekleme demoda kapalı; isteğinizi yazabilirsiniz…"; acInput.focus(); });
$("[data-ac-mic]").addEventListener("click", () => { acInput.placeholder = "Sesle yazma demoda kapalı…"; acInput.focus(); });
$("[data-ac-form]").addEventListener("submit", (e) => {
  e.preventDefault();
  const t = acInput.value.trim(); if (!t) return;
  if (!cur) { cur = { id: String(Date.now()), title: t.length > 42 ? t.slice(0, 40) + "…" : t, ts: Date.now(), msgs: [] }; chats.unshift(cur); }
  cur.msgs.push({ r: "me", t }); cur.ts = Date.now(); chats = [cur, ...chats.filter((x) => x !== cur)];
  acInput.value = ""; acGrow(); save(); renderChat();
  const wait = document.createElement("li"); wait.className = "ac-msg ai"; wait.innerHTML = `<img class="ac-av" src="assets/kedi-yuz.png" alt=""><div><span class="ac-who">AI-LA · ${esc(model)}</span><p class="ac-typing"><i></i><i></i><i></i></p></div>`;
  acLog.append(wait); acScroll.scrollTop = acScroll.scrollHeight;
  const chat = cur;
  setTimeout(() => { chat.msgs.push({ r: "ai", t: DEMO[demoI++ % DEMO.length], m: model }); save(); if (cur === chat) renderChat(); }, 1100);
});
renderList();

addEventListener("hashchange", go);
go();
