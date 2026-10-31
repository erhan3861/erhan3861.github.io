// AI-LA paneli (login sonrası). Renk: panel.html?renk=turkuaz|mor|turuncu|deniz (varsayılan mavi). Rol login'den gelir; demoda ?rol=ogretmen|yonetici
import { hexToOklch, oklchToHex } from "./oklch.js";
import { mountWeek, renderTask } from "./week.js";

const $ = (s, r = document) => r.querySelector(s);

const THEMES = { mavi: "#345de0", turkuaz: "#008978", mor: "#914db8", turuncu: "#c9582b", deniz: "#1e8a5a" };
const q = new URLSearchParams(location.search);
const c = THEMES[q.get("renk")] || THEMES.mavi;
const [L, C, H] = hexToOklch(c);
const vio = oklchToHex([Math.min(L + 0.05, 0.62), Math.max(C, 0.16), H + 38]); // aynı rengin mora kayan eşi
const st = document.documentElement.style;
st.setProperty("--s", c);
st.setProperty("--s-ink", oklchToHex([Math.min(L, 0.45), C, H]));
st.setProperty("--s-tint", oklchToHex([0.965, Math.min(C * 0.18, 0.03), H]));
st.setProperty("--v", vio);
st.setProperty("--v-tint", oklchToHex([0.965, 0.03, H + 38]));
// araç ikonları için okul renginden mora dört ton
const hues = [0, 14, 26, 38].map((d) => [oklchToHex([0.5, Math.max(C, 0.15), H + d]), oklchToHex([0.955, 0.035, H + d])]);

const ROLES = {
  ogrenci: { name: "Elif", full: "Elif Yılmaz", avatar: "EY" },
  ogretmen: { name: "Ayşe Hoca", full: "Ayşe Kaya", avatar: "AK" },
  yonetici: { name: "Mehmet Bey", full: "Mehmet Demir", avatar: "MD" },
};
const R = ROLES[q.get("rol")] || ROLES.ogrenci;
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
// ad ve baş harfler birden çok yerde: üst çubuk, sol alttaki profil sekmesi, profil sayfası
const setText = (sel, v) => $$(sel).forEach((el) => { el.textContent = v; });
setText("[data-name]", R.name);
setText("[data-fullname]", R.full);
setText("[data-avatar]", R.avatar);
const ARROW = '<svg class="icon go" aria-hidden="true"><use href="#i-arrow" /></svg>';

/* ---------- araçlar: ana sayfada ilk sekizi, Araçlar sayfasında hepsi ---------- */
const TOOLS = [
  ["i-image", "Görsel Oluştur", "Metinden ya da görselden etkileyici görseller üret.", "gorsel"],
  ["i-video", "Video Oluştur", "Metin, görsel ya da şablonla videolar hazırla.", "video"],
  ["i-chat", "Sohbet", "Seviyeni bilen asistanla soru sor, plan yap.", "yazi"],
  ["i-music", "Müzik Oluştur", "Hayalindeki müziği birlikte üret.", "ses"],
  ["i-code", "Kod Yaz", "Python ve daha fazlasıyla projeler geliştir.", "kod"],
  ["i-cube", "3D Oluştur", "Fikirlerini üç boyutlu modellere dönüştür.", "gorsel"],
  ["i-agent", "Ajan", "Kendi yapay zekâ ajanını kur, görev ver.", "ogrenme"],
  ["i-template", "Şablonlar", "Hazır şablonlarla hızlıca üretime başla.", "gorsel"],
  ["i-wand", "Görsel Düzenle", "Arka planı değiştir, ayrıntı ekle, stil ver.", "gorsel"],
  ["i-video", "Görselden Video", "Bir resmi kısa bir sahneye çevir.", "video"],
  ["i-slides", "Sunum Hazırla", "Konunu anlat, slaytları birlikte kurun.", "yazi"],
  ["i-doc", "Özet Çıkar", "Uzun bir metni anlaşılır notlara dönüştür.", "yazi"],
  ["i-mic", "Seslendirme", "Metnini doğal bir sesle okut.", "ses"],
  ["i-code", "Kod Açıkla", "Bir kodun ne yaptığını adım adım öğren.", "kod"],
  ["i-book", "Soru Çöz", "Takıldığın soruyu ipucuyla birlikte çöz.", "ogrenme"],
  ["i-layers", "Akışlar", "Adım adım ilerleyen öğrenme senaryoları.", "ogrenme"],
];
const CATS = [["tum", "Tümü"], ["gorsel", "Görsel"], ["video", "Video"], ["yazi", "Yazı"], ["ses", "Ses"], ["kod", "Kod"], ["ogrenme", "Öğrenme"]];
TOOLS.forEach((t, i) => { t.n = i; });   // görsel ve renk aracın kendisine bağlı; süzünce değişmez
const toolCard = (tool) => {
  const [icon, t, d] = tool, [hue, tint] = hues[tool.n % 4];
  const art = `assets/araclar/t${String(tool.n + 1).padStart(2, "0")}.png`;
  return `<li><a class="tool" href="#" style="--hue:${hue};--tint:${tint}">
    <span class="tool-art"><img src="${art}" alt="" loading="lazy" onerror="this.closest('.tool').classList.add('no-art')"></span>
    <span class="tool-icon"><svg class="icon" aria-hidden="true"><use href="#${icon}" /></svg></span>
    <strong>${t}</strong><span>${d}</span>${ARROW}</a></li>`;
};
$("[data-tools]").innerHTML = TOOLS.slice(0, 8).map((t) => toolCard(t)).join("");

const allTools = $("[data-all-tools]"), toolsEmpty = $("[data-tools-empty]");
let cat = "tum", term = "";
const norm = (x) => x.toLocaleLowerCase("tr");
const renderTools = () => {
  const list = TOOLS.filter((t) => (cat === "tum" || t[3] === cat) && (!term || norm(t[1] + " " + t[2]).includes(term)));
  allTools.innerHTML = list.map((t) => toolCard(t)).join("");
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
// üst çubuktaki arama araçları süzer; başka sayfadayken Araçlar'a geçer
$("[data-search]").addEventListener("input", (e) => {
  term = norm(e.target.value.trim());
  renderTools();
  if (term && view !== "araclar") location.hash = "araclar";
});

/* ---------- son aktiviteler ---------- */
const ACTS = [
  { img: "uzay", t: "Görsel oluşturuldu", d: "gunes_sistemi_poster", w: "2 saat önce" },
  { img: "foto", play: true, t: "Video oluşturuldu", d: "fotosentez_ozet", w: "4 saat önce" },
  { img: "okumino", t: "Okumino egzersizi bitti", d: "Kelebeğin yolculuğu · %88 anlama", w: "Dün" },
  { img: "codemino", t: "Codemino görevi tamamlandı", d: "Bölüm 3 · Döngüler", w: "Dün" },
  { img: "muzik", t: "Müzik oluşturuldu", d: "sakin_odak", w: "2 gün önce" },
];
const thumb = (a, cls = "act-thumb") => `<span class="${cls}${a.play ? " play" : ""}"><img src="assets/thumbs/${a.img}.jpg" alt="" loading="lazy">${a.play ? '<svg class="icon" aria-hidden="true"><use href="#i-video" /></svg>' : ""}</span>`;
$("[data-acts]").innerHTML = ACTS.map((a) => `<li class="act">${thumb(a)}<span class="act-text"><strong>${a.t}</strong><span>${a.d}</span><span>${a.w}</span></span></li>`).join("");

// Kendini Tanı kartındaki altı Maarif alanı (beceri haritasıyla aynı rakamlar)
$("[data-kt-bars]").innerHTML = [82, 80, 81, 80, 79, 82].map((v) => `<i style="--p:${v}%"></i>`).join("");

/* ---------- ekosistem ---------- */
const ECO = [
  { img: "talent14", logo: "assets/talent14.png", name: "Talent14", text: "Dijital beceri ve teknoloji eğitimi.", feeds: "Kavramsal · Okuryazarlık" },
  { img: "ai-galaxy", logo: "assets/ai-galaxy.png", mono: true, name: "AI-GALAXY", text: "Yapay zekâ okuryazarlığı modülleri ve üretim stüdyosu.", feeds: "Okuryazarlık · Erdem-Değer" },
  { img: "okumino", logo: "assets/okumino-logo.png", name: "Okumino", text: "Hızlı okuma ve anlama egzersizleri, seviyene göre.", feeds: "Okuryazarlık · Kavramsal" },
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

/* ---------- projelerim ---------- */
const PROJ = [
  { img: "uzay", t: "Güneş Sistemi posteri", k: "gorsel", kl: "Görsel", w: "Bugün" },
  { img: "foto", play: true, t: "Fotosentez özeti", k: "video", kl: "Video", w: "Bugün" },
  { img: "muzik", t: "sakin_odak", k: "ses", kl: "Müzik", w: "2 gün önce" },
  { img: "afis", t: "Bilim şenliği afişi", k: "gorsel", kl: "Şablon", w: "2 gün önce" },
  { img: "oyun", t: "Altın toplayan kahraman", k: "kod", kl: "Kod", w: "3 gün önce" },
  { img: "masal", t: "Dağların masalı", k: "gorsel", kl: "Görsel", w: "Geçen hafta" },
  { img: "robot", t: "Yardımcı robot Pıtır", k: "3d", kl: "3D", w: "Geçen hafta" },
  { img: "codemino", t: "Codemino · Döngüler", k: "kod", kl: "Codemino", w: "Geçen hafta" },
];
const PCATS = [["tum", "Tümü"], ["gorsel", "Görsel"], ["video", "Video"], ["ses", "Ses"], ["kod", "Kod"], ["3d", "3D"]];
const projGrid = $("[data-proj]");
const renderProj = (k) => {
  projGrid.innerHTML = PROJ.filter((p) => k === "tum" || p.k === k).map((p) => `<li><a class="proj" href="#">
    ${thumb(p, "proj-shot")}<span class="proj-meta"><strong>${p.t}</strong><span><b>${p.kl}</b> · ${p.w}</span></span></a></li>`).join("");
};
chips($("[data-proj-chips]"), PCATS, renderProj);
renderProj("tum");

/* ---------- topluluk ---------- */
const FEED = [
  { img: "masal", who: "Deniz K.", g: "7-B", t: "Dağların masalı için kapak", likes: 48 },
  { img: "robot", who: "Mert A.", g: "7-A", t: "Sınıf robotumuz Pıtır", likes: 36 },
  { img: "afis", who: "Ece T.", g: "8-A", t: "Bilim şenliği afişi", likes: 31 },
  { img: "oyun", who: "Can Y.", g: "6-C", t: "İlk platform oyunum", likes: 27 },
  { img: "uzay", who: "Elif Y.", g: "7-A", t: "Güneş sistemi posteri", likes: 22 },
  { img: "muzik", who: "Zeynep K.", g: "5-B", t: "Ders çalışırken dinlenecek müzik", likes: 19 },
];
$("[data-feed]").innerHTML = FEED.map((f) => `<li><article class="post">
  ${thumb(f, "post-shot")}
  <div class="post-meta"><span class="post-av">${f.who.split(" ").map((x) => x[0]).join("")}</span>
    <span class="post-text"><strong>${f.t}</strong><span>${f.who} · ${f.g}</span></span>
    <button type="button" class="like" aria-pressed="false" aria-label="Beğen"><svg class="icon" aria-hidden="true"><use href="#i-heart" /></svg><b>${f.likes}</b></button></div>
</article></li>`).join("");
$("[data-feed]").addEventListener("click", (e) => {
  const b = e.target.closest(".like"); if (!b) return;
  const on = b.getAttribute("aria-pressed") !== "true", n = b.querySelector("b");
  b.setAttribute("aria-pressed", String(on)); n.textContent = +n.textContent + (on ? 1 : -1);
});
$("[data-top]").innerHTML = FEED.slice(0, 4).map((f, i) => `<li><span class="rank">${i + 1}</span>${thumb(f, "top-shot")}<span class="top-text"><strong>${f.t}</strong><span>${f.who} · ${f.likes} beğeni</span></span></li>`).join("");

/* ---------- bu hafta karuseli ---------- */
const week = mountWeek($("[data-week]"));

/* ---------- sayfalar: menü adresle (#araclar …) değişir, sayfa yeniden yüklenmez ---------- */
let view = "ana", skillMap = null;
const VIEWS = $$("[data-view]").map((v) => v.dataset.view);
const go = () => {
  const [h, arg] = location.hash.slice(1).split("/");
  view = VIEWS.includes(h) ? h : "ana";
  if (view === "gorev" && !renderTask($("[data-task]"), decodeURIComponent(arg || ""))) view = "ana";
  $$("[data-view]").forEach((v) => { v.hidden = v.dataset.view !== view; });
  document.body.dataset.page = view;   // data-view değil: [data-view] seçicisi body'yi de görünüm sanıp gizler
  $$("[data-nav]").forEach((a) => { if (a.dataset.nav === view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  const label = view === "gorev" ? $("#gorev-h").textContent : view === "profil" ? "Profil" : view === "formlar" ? "Seni tanıyalım" : $(`[data-nav="${view}"]`).textContent.trim();
  document.title = `${label} · AI-LA`;
  week.active(view === "ana");
  if (view === "kendini-tani") {
    if (!skillMap) {
      import("./skillmap.js").then(({ mountSkillMap }) => {
        skillMap = mountSkillMap({ stage: $("[data-km-stage]"), canvas: $("[data-km-canvas]"), labels: $("[data-km-labels]"), karne: $("[data-karne]"), advice: $("[data-advice]"), scoreEl: $("[data-km-score]") });
        if (view === "kendini-tani") skillMap.start();
      });
    } else skillMap.start();
  } else skillMap?.stop();
};
addEventListener("hashchange", go);
go();

/* ---------- kenar menüyü daralt / aç (tercih bu tarayıcıda hatırlanır) ---------- */
const app = $(".app"), sideBtn = $("[data-side-toggle]");
const setSide = (collapsed) => {
  app.classList.toggle("is-collapsed", collapsed);
  sideBtn.setAttribute("aria-expanded", String(!collapsed));
  sideBtn.setAttribute("aria-label", collapsed ? "Menüyü aç" : "Menüyü daralt");
};
try { setSide(localStorage.getItem("aila-side") === "dar"); } catch (e) { /* depolama kapalıysa açık başlar */ }
sideBtn.addEventListener("click", () => {
  const c = !app.classList.contains("is-collapsed");
  setSide(c);
  try { localStorage.setItem("aila-side", c ? "dar" : "genis"); } catch (e) { /* yok say */ }
});

/* ---------- profil ---------- */

const PF_TAGS = ["Uzay", "Çizim", "Kodlama", "Müzik", "Robotik", "Doğa", "Spor", "Hikâye yazma", "Film", "Matematik"];
const pfOn = new Set(["Uzay", "Çizim"]);
const tagsHost = $("[data-pf-tags]");
tagsHost.innerHTML = PF_TAGS.map((t) => `<button type="button" class="tag" aria-pressed="${pfOn.has(t)}">${t}</button>`).join("");
tagsHost.addEventListener("click", (e) => {
  const b = e.target.closest(".tag"); if (!b) return;
  const on = b.getAttribute("aria-pressed") !== "true";
  if (on && $$(".tag[aria-pressed=true]", tagsHost).length >= 5) { flash($("[data-pf-status]"), "En çok 5 ilgi alanı seçebilirsin.", true); return; }
  b.setAttribute("aria-pressed", String(on));
});

const about = $("[data-pf-about]"), aboutCount = $("[data-pf-count]");
const countAbout = () => { aboutCount.textContent = `${about.value.length}/${about.maxLength}`; };
about.addEventListener("input", countAbout); countAbout();

const flashT = new WeakMap();
const flash = (el, msg, bad = false) => {
  el.textContent = msg; el.classList.toggle("bad", bad); el.classList.add("on");
  clearTimeout(flashT.get(el)); flashT.set(el, setTimeout(() => el.classList.remove("on"), 2600));
};
const initials = (full) => full.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toLocaleUpperCase("tr")).join("") || "?";

$("[data-pf-form]").addEventListener("submit", (e) => {
  e.preventDefault();
  const ad = $("[data-pf-ad]");
  if (ad.value.trim().split(/\s+/).length < 2) { ad.setAttribute("aria-invalid", "true"); ad.focus(); flash($("[data-pf-status]"), "Ad ve soyadını birlikte yaz.", true); return; }
  ad.removeAttribute("aria-invalid");
  setText("[data-fullname]", ad.value.trim());
  setText("[data-name]", ad.value.trim().split(/\s+/)[0]);
  setText("[data-avatar]", initials(ad.value));
  flash($("[data-pf-status]"), "Kaydedildi");   // demo: sunucuya gönderilmez
});

const taniLink = $("[data-tani-link]");   // formlar görünümüne gider; form bitince yazısı değişir

// parola: ayrı pencerede, sayfa kaymaz
const dlg = $("[data-pw-dlg]"), pwForm = $("[data-pf-pass-form]");
const pwNew = $("[data-pw-new]"), pwMeter = $("[data-pw-meter]"), pwTip = $("[data-pw-tip]");
const TIP = "En az 8 karakter, bir rakam ve bir büyük harf.";
const resetPw = () => { pwForm.reset(); pwMeter.dataset.level = 0; pwTip.textContent = TIP; };
$("[data-pw-open]").addEventListener("click", () => { resetPw(); dlg.showModal(); $("[data-pw-old]").focus(); });
$("[data-pw-close]").addEventListener("click", () => dlg.close());
dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });   // pencere dışına tıklayınca kapanır
$$("[data-pw-eye]").forEach((b) => b.addEventListener("click", () => {
  const i = b.previousElementSibling, show = i.type === "password";
  i.type = show ? "text" : "password"; b.setAttribute("aria-label", show ? "Parolayı gizle" : "Parolayı göster");
}));
const strength = (v) => [v.length >= 8, /\d/.test(v), /[A-ZÇĞİÖŞÜ]/.test(v), v.length >= 12 || /[^\w\s]/.test(v)].filter(Boolean).length;
pwNew.addEventListener("input", () => {
  const n = pwNew.value ? strength(pwNew.value) : 0;
  pwMeter.dataset.level = n;
  pwTip.textContent = !pwNew.value ? TIP : ["Çok zayıf", "Zayıf", "Fena değil", "İyi", "Güçlü"][n];
});
pwForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const st = $("[data-pw-status]");
  if (!$("[data-pw-old]").value) return flash(st, "Mevcut parolanı yaz.", true);
  if (strength(pwNew.value) < 3) return flash(st, "Yeni parola daha güçlü olmalı.", true);
  if ($("[data-pw-again]").value !== pwNew.value) return flash(st, "İki parola aynı değil.", true);
  dlg.close();
  const tile = $("[data-pw-open] .tile-text");
  tile.textContent = "Parolan az önce güncellendi";
});

// yazı boyutu tercihi bu tarayıcıda hatırlanır
const sizeSeg = $("[data-pf-size]");
const setSize = (k) => {
  document.documentElement.classList.toggle("text-l", k === "l");
  $$("button", sizeSeg).forEach((b) => b.setAttribute("aria-checked", String(b.dataset.size === k)));
};
try { setSize(localStorage.getItem("aila-yazi") || "n"); } catch (e) { /* depolama kapalı */ }
sizeSeg.addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  setSize(b.dataset.size);
  try { localStorage.setItem("aila-yazi", b.dataset.size); } catch (e2) { /* yok say */ }
});

/* ---------- formlar: Seni tanıyalım (adım adım, tek ekran) ----------
   Görseller mevcut setten: assets/araclar/tNN.png ve assets/profil/pNN.png. Demo: cevaplar sunucuya gitmez. */
const A = (n) => `assets/araclar/t${String(n).padStart(2, "0")}.png`, P = (n) => `assets/profil/p${String(n).padStart(2, "0")}.png`;
const TANI_STEPS = [
  { id: "merhaba", art: "assets/profil/p05a.png", title: "Merhaba! Seni biraz tanıyalım.", text: "Birkaç kısa soru. Doğru ya da yanlış cevap yok; seçtiklerin araçları ve görevleri sana göre ayarlar.", next: "Başlayalım" },
  { id: "ilgi", art: A(1), title: "En çok neyle uğraşmayı seversin?", text: "En çok 3 tane seç.", max: 3, opts: [
    ["Resim ve görsel", A(1)], ["Video ve film", A(2)], ["Müzik", A(4)], ["Kodlama", A(5)],
    ["3D tasarım", A(6)], ["Hikâye ve sunum", A(11)], ["Robotlar", A(7)], ["Bulmaca ve sorular", A(15)]] },
  { id: "ogrenme", art: A(3), title: "En iyi nasıl öğrenirsin?", text: "Sana en yakın olanı seç.", max: 1, opts: [
    ["İzleyerek", A(2)], ["Okuyarak", A(12)], ["Yaparak, deneyerek", A(5)], ["Konuşarak, sorarak", A(3)], ["Dinleyerek", A(13)], ["Adım adım ilerleyerek", A(16)]] },
  { id: "hedef", art: P(8), title: "Bu dönem neyi başarmak istersin?", text: "İstediğin kadar seçebilirsin.", max: 4, opts: [
    ["Yeni bir şey öğrenmek", A(16)], ["Kendi projemi yapmak", A(8)], ["Yarışmaya katılmak", P(8)], ["Derslerimi güçlendirmek", A(15)]] },
  { id: "cumle", art: P(1), title: "Kendini bir cümleyle anlatır mısın?", text: "Örneğin: “Bir şeyleri çizmeyi ve nasıl çalıştığını merak etmeyi severim.”", input: true },
  { id: "bitti", art: P(8), title: "Harika, seni tanıdık!", text: "Cevaplarını kaydettik. Öneriler ve görevler bundan sonra sana göre gelecek.", next: "Profile dön", done: true },
];
const tani = { i: 0, picks: {}, note: "" };
const taniStep = $("[data-tani-step]"), taniDots = $("[data-tani-dots]"), taniArt = $("[data-tani-art]");
const taniNext = $("[data-tani-next]"), taniPrev = $("[data-tani-prev]"), taniSkip = $("[data-tani-skip]"), taniHint = $("[data-tani-hint]");
taniDots.innerHTML = TANI_STEPS.map((s, i) => `<li><button type="button" aria-label="Adım ${i + 1}" data-go="${i}">${i + 1}</button></li>`).join("");
const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const renderTani = (dir = 0) => {
  const s = TANI_STEPS[tani.i], picked = tani.picks[s.id] || [];
  let body = `<h2>${s.title}</h2><p class="tani-text">${s.text}</p>`;
  if (s.opts) body += `<div class="tani-opts${s.opts.length > 6 ? " many" : ""}" role="group" aria-label="${s.title}">${s.opts.map(([t, img]) =>
    `<button type="button" class="opt" aria-pressed="${picked.includes(t)}" data-opt="${esc(t)}"><span class="opt-img"><img src="${img}" alt=""></span><span class="opt-t">${t}</span><span class="opt-check" aria-hidden="true"><svg class="icon"><use href="#i-check" /></svg></span></button>`).join("")}</div>`;
  if (s.input) body += `<label class="tani-input"><textarea rows="3" maxlength="140" placeholder="Buraya yaz…" data-tani-note>${esc(tani.note)}</textarea><em data-tani-left>${140 - tani.note.length}</em></label>`;
  if (s.done) body += `<div class="tani-sum">${Object.values(tani.picks).flat().map((t) => `<span>${t}</span>`).join("") || "<span>Seçim yapmadın, sorun değil</span>"}</div>`;
  taniStep.innerHTML = body;
  taniStep.classList.remove("in-l", "in-r"); void taniStep.offsetWidth;
  if (dir) taniStep.classList.add(dir > 0 ? "in-r" : "in-l");
  taniArt.classList.remove("pop"); void taniArt.offsetWidth; taniArt.classList.add("pop");
  taniArt.src = s.art;
  $("[data-tani-count]").textContent = `${tani.i + 1} / ${TANI_STEPS.length}`;
  $$("button", taniDots).forEach((b, i) => {
    b.classList.toggle("done", i < tani.i); b.classList.toggle("now", i === tani.i);
    if (i === tani.i) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
    b.disabled = i > tani.i;
  });
  taniPrev.hidden = tani.i === 0 || s.done;
  taniSkip.hidden = !s.opts && !s.input;
  $("[data-tani-next-label]").textContent = s.next || (tani.i === TANI_STEPS.length - 2 ? "Bitir" : "Devam");
  taniHint.textContent = s.max > 1 ? `${picked.length} / ${s.max} seçildi` : "";
  const note = $("[data-tani-note]");
  if (note) note.addEventListener("input", () => { tani.note = note.value; $("[data-tani-left]").textContent = 140 - note.value.length; });
};
const taniGo = (to) => { const d = Math.sign(to - tani.i); tani.i = Math.max(0, Math.min(TANI_STEPS.length - 1, to)); renderTani(d); };
taniStep.addEventListener("click", (e) => {
  const b = e.target.closest(".opt"); if (!b) return;
  const s = TANI_STEPS[tani.i], list = tani.picks[s.id] || (tani.picks[s.id] = []), t = b.dataset.opt;
  if (s.max === 1) { list.length = 0; list.push(t); $$(".opt", taniStep).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); }
  else if (list.includes(t)) { list.splice(list.indexOf(t), 1); b.setAttribute("aria-pressed", "false"); }
  else if (list.length < s.max) { list.push(t); b.setAttribute("aria-pressed", "true"); }
  else { taniHint.textContent = `En çok ${s.max} tane seçebilirsin`; b.classList.remove("nope"); void b.offsetWidth; b.classList.add("nope"); return; }
  taniHint.textContent = s.max > 1 ? `${list.length} / ${s.max} seçildi` : "";
});
$("[data-tani-form]").addEventListener("submit", (e) => {
  e.preventDefault();
  if (TANI_STEPS[tani.i].done) { location.hash = "profil"; return; }
  taniGo(tani.i + 1);
  if (TANI_STEPS[tani.i].done) {   // profildeki kart artık tamamlandı der
    taniLink.querySelector(".tile-eyebrow").textContent = "Tamamlandı";
    taniLink.querySelector(".tile-go").firstChild.textContent = "Cevaplarını gör";
  }
});
taniPrev.addEventListener("click", () => taniGo(tani.i - 1));
taniSkip.addEventListener("click", () => taniGo(tani.i + 1));
taniDots.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b && !b.disabled) taniGo(+b.dataset.go); });
renderTani();

/* ---------- sohbet: sağ alttaki işaret; yalnız yazı alanı, demo yanıtlar ---------- */
const fab = $("[data-chat-fab]"), pop = $("[data-chat-pop]"), log = $("[data-chat-log]");
const input = $("[data-chat-input]"), send = $("[data-chat-send]");
const openChat = (open) => {
  pop.hidden = !open; fab.setAttribute("aria-expanded", String(open));
  if (open) input.focus();
};
fab.addEventListener("click", () => openChat(pop.hidden));
addEventListener("keydown", (e) => { if (e.key === "Escape" && !pop.hidden) { openChat(false); fab.focus(); } });
const grow = () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 140) + "px"; send.disabled = !input.value.trim(); };
input.addEventListener("input", grow);
input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("[data-chat-form]").requestSubmit(); } });
const REPLIES = [
  "Güzel soru. Önce konuyu bir cümleyle anlatır mısın, sonra birlikte adım adım ilerleyelim.",
  "Bunu Araçlar'daki Görsel Oluştur ile deneyebilirsin. İstersen sana bir başlangıç cümlesi yazayım.",
  "Bu haftaki görevin “Oyunun kuralını anlat”. Hangi oyunu seçtiğini söylersen kurallarını birlikte sıralarız.",
];
let ri = 0;
const bubble = (who, text) => {
  const li = document.createElement("li"); li.className = `msg ${who}`; li.textContent = text;
  log.append(li); log.scrollTop = log.scrollHeight; return li;
};
$("[data-chat-form]").addEventListener("submit", (e) => {
  e.preventDefault();
  const v = input.value.trim(); if (!v) return;
  pop.classList.add("has-log");
  bubble("me", v); input.value = ""; grow();
  const wait = bubble("ai typing", "…");
  setTimeout(() => { wait.classList.remove("typing"); wait.textContent = REPLIES[ri++ % REPLIES.length]; log.scrollTop = log.scrollHeight; }, 900);
});
