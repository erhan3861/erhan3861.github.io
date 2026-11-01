// AI-LA yönetici paneli: öğretmen panelinden daha özet. Menü: Ana Sayfa (raporlar), Araçlar, Ajanlar, Kurum Yönetimi.
// Ekosistem sol altta yalnız veri gösterir (platformlara SSO ile geçiş yok). Profil sağ üstte, sohbet sağ altta.
// Tüm kurum, sınıf, öğrenci ve rapor verisi simülasyondur.
import { hexToOklch, oklchToHex } from "./oklch.js";
import { mountCat } from "./kedi.js";
import { PRODUCTS, AREAS } from "./data.js";
import { openRowMenu, MORE } from "./rowmenu.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ARROW = '<svg class="icon go" aria-hidden="true"><use href="#i-arrow" /></svg>';
// beyaz kart üstünde kontrol edilmiş altı alan rengi (dataviz validate_palette: tüm kontroller geçti)
const AREA_INK = ["#2f7de6", "#d6458f", "#b87d14", "#16916f", "#7f55ee", "#d9562f"];
const fmt = (n) => n.toLocaleString("tr-TR");

/* ---------- okul rengi ---------- */
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

/* ---------- demo kurum verisi (tohumlu) ---------- */
const seed = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296; };
const LEVELS = [["ilk", "İlkokul"], ["orta", "Ortaokul"], ["lise", "Lise"]];
const TEACHERS = ["Gül Arslan", "Hakan Demir", "Seda Kaya", "Murat Çelik", "Ayşe Kaya", "Kemal Öz", "Nur Aydın", "Burcu Şahin", "Emre Koç", "Selin Yurt", "Okan Tan", "Esra Ak", "Levent Su", "Derya Ece", "Can Bilen", "Pınar Gök", "Tolga Uz"];
let CLASSES = [
  ["1-A", "ilk"], ["2-A", "ilk"], ["3-A", "ilk"], ["4-A", "ilk"],
  ["5-A", "orta"], ["5-B", "orta"], ["6-A", "orta"], ["7-A", "orta"], ["8-A", "orta"],
  ["9-A", "lise"], ["10-A", "lise"], ["11-A", "lise"], ["12-A", "lise"],
].map(([name, lvl], i) => ({ name, lvl, teacher: TEACHERS[i % TEACHERS.length] }));
const FIRST = ["Elif", "Mert", "Zeynep", "Can", "Ece", "Yusuf", "Defne", "Ali", "Nehir", "Emir", "Duru", "Kerem", "Ada", "Efe", "Asya", "Arda", "Lina", "Ömer", "Masal", "Berk", "İpek", "Kaan", "Selin", "Burak", "Ela", "Onur", "Melis", "Tuna", "Ceren", "Barış"];
const LAST = ["Yılmaz", "Arslan", "Kaya", "Demir", "Şahin", "Çelik", "Aydın", "Öztürk", "Koç", "Kurt", "Polat", "Aksoy", "Kılıç", "Yıldız", "Güneş", "Erdem", "Bulut", "Taş", "Doğan", "Ateş"];
const LOGINS = [["Bugün 09:12", 0], ["Bugün 08:40", 0], ["Dün 19:05", 1], ["2 gün önce", 2], ["4 gün önce", 4], ["9 gün önce", 9], ["2 hafta önce", 14]];
let N = 0;
const STU = [];
const addStu = (name, cls) => {
  const r = seed(name + N), bias = cls ? (cls.lvl === "lise" ? 3 : cls.lvl === "ilk" ? -2 : 0) : 0;
  const area = Object.fromEntries(AREAS.map((a) => [a.id, Math.round(Math.min(96, 58 + r() * 32 + bias))]));
  const login = LOGINS[Math.floor(r() * LOGINS.length)];
  const s = { id: `s${++N}`, name, cls: cls ? cls.name : null, no: 1000 + N, area, score: Math.round(AREAS.reduce((x, a) => x + area[a.id], 0) / 6), login: login[0], days: login[1], r };
  STU.push(s); return s;
};
CLASSES.forEach((cl, i) => { const n = 6 + (i * 5) % 5; for (let k = 0; k < n; k++) addStu(`${FIRST[(i * 7 + k * 3) % FIRST.length]} ${LAST[(i * 3 + k * 5) % LAST.length]}`, cl); });
["Eylül Aslan", "Batu Coşkun", "Sude Kara", "Alp Tunç"].forEach((n) => addStu(n, null));
const avg = (xs) => Math.round(xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length));
const inCls = (n) => STU.filter((s) => s.cls === n);
const lvlOf = (s) => CLASSES.find((c) => c.name === s.cls)?.lvl;
const initials = (full) => full.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toLocaleUpperCase("tr")).join("") || "?";
const norm = (x) => x.toLocaleLowerCase("tr");

/* ---------- ana sayfa: raporlar ---------- */
const PERIOD = { 7: { k: 0.24, days: 7, label: "son 7 gün" }, 30: { k: 1, days: 30, label: "son 30 gün" }, donem: { k: 2.6, days: 18, label: "bu dönem", weekly: true } };
let period = "30";
const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#${id}" /></svg>`;
const renderAlerts = () => {
  const off = STU.filter((s) => s.days >= 7).length, noCls = STU.filter((s) => !s.cls).length;
  const items = [
    ["serious", `${off} öğrenci 7+ gündür giriş yapmadı`, "#kurum/ogrenci/pasif"],
    ["warning", "4 öğretmen AI araçlarını hiç kullanmadı", "#ajanlar"],
    ["warning", `${noCls} öğrenci bir sınıfa atanmamış`, "#kurum/ogrenci/sinifsiz"],
  ];
  $("[data-alerts]").innerHTML = items.map(([lvl, t, h]) => `<li class="alert ${lvl}"><span class="al-ic">${icon("i-alert")}</span><span class="al-t"><b>${lvl === "serious" ? "Önemli" : "Dikkat"}</b>${t}</span><a href="${h}">İncele${icon("i-arrow")}</a></li>`).join("");
};
const renderKpis = () => {
  const P = PERIOD[period], active = STU.filter((s) => s.days < 7).length;
  const kpis = [
    ["Öğrenci", fmt(STU.length), `${Math.round(active / STU.length * 100)}% aktif`, `${active} kişi ${P.label} giriş yaptı`, "up"],
    ["Öğretmen", "17", "11 aktif", "6 öğretmen 7+ gündür girmedi", "flat"],
    ["AI üretimi", fmt(Math.round(1840 * P.k)), "%18 artış", `Önceki döneme göre, ${P.label}`, "up"],
    ["Zaman tasarrufu", `${fmt(Math.round(142 * P.k))} sa`, "öğretmenlerde", "Hazır araçlarla kazanılan tahmini süre", "up"],
  ];
  $("[data-kpis]").innerHTML = kpis.map(([t, v, d, sub, dir]) => `<div class="kpi"><span class="kpi-t">${t}</span><strong>${v}</strong><span class="kpi-d ${dir}">${dir === "up" ? "▲ " : ""}${d}</span><small>${sub}</small></div>`).join("");
};
// trend: iki seri (öğretmen, öğrenci), tek eksen, 2px çizgi, crosshair + tooltip
const series = () => {
  const P = PERIOD[period], n = P.days, r = seed("trend" + period);
  // günlük değer (haftalık görünümde x7): taban + hafif artış + hafta içi dalgası + gürültü
  const pts = (base) => Array.from({ length: n }, (_, i) => Math.round((P.weekly ? 7 : 1) * base * (0.8 + 0.35 * i / n + 0.12 * Math.sin(i * 0.9) + r() * 0.25)));
  return { n, t: pts(22), o: pts(41), weekly: P.weekly };
};
const renderTrend = () => {
  const host = $("[data-trend]"), d = series();
  const W = host.clientWidth || 600, Hh = host.clientHeight || 220, pad = { l: 34, r: 74, t: 10, b: 24 };
  const max = Math.max(...d.t, ...d.o) * 1.1, x = (i) => pad.l + i * (W - pad.l - pad.r) / (d.n - 1), y = (v) => Hh - pad.b - v / max * (Hh - pad.t - pad.b);
  const path = (a) => a.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f / 10) * 10);
  const lab = (i) => d.weekly ? `${i + 1}. hafta` : (() => { const dt = new Date(); dt.setDate(dt.getDate() - (d.n - 1 - i)); return dt.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }); })();
  const xt = [0, Math.floor((d.n - 1) / 2), d.n - 1];
  $("[data-tr-total]").textContent = fmt(d.t.reduce((a, b) => a + b, 0) + d.o.reduce((a, b) => a + b, 0));
  host.innerHTML = `<svg viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}" role="img" aria-label="AI kullanım trendi">
    ${ticks.map((t) => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(t)}" y2="${y(t)}" class="grid"/><text x="${pad.l - 8}" y="${y(t) + 4}" class="ax" text-anchor="end">${t}</text>`).join("")}
    ${xt.map((i) => `<text x="${x(i)}" y="${Hh - 6}" class="ax" text-anchor="${i === 0 ? "start" : i === d.n - 1 ? "end" : "middle"}">${lab(i)}</text>`).join("")}
    <path d="${path(d.o)}" class="ln" style="stroke:${AREA_INK[0]}"/><path d="${path(d.t)}" class="ln" style="stroke:${AREA_INK[1]}"/>
    <text x="${x(d.n - 1) + 8}" y="${y(d.o[d.n - 1]) + 4}" class="dl">Öğrenci</text><text x="${x(d.n - 1) + 8}" y="${y(d.t[d.n - 1]) + 4}" class="dl">Öğretmen</text>
    <line class="xh" y1="${pad.t}" y2="${Hh - pad.b}" x1="-10" x2="-10"/><circle class="dot" r="4.5" style="fill:${AREA_INK[0]}" cx="-10" cy="-10"/><circle class="dot" r="4.5" style="fill:${AREA_INK[1]}" cx="-10" cy="-10"/>
    <rect x="${pad.l}" y="0" width="${W - pad.l - pad.r}" height="${Hh}" fill="transparent" class="hit"/></svg>
    <div class="legend"><span><i style="background:${AREA_INK[0]}"></i>Öğrenci</span><span><i style="background:${AREA_INK[1]}"></i>Öğretmen</span></div>
    <div class="tip" hidden></div>`;
  const svg = $("svg", host), tip = $(".tip", host), xh = $(".xh", svg), [d1, d2] = $$(".dot", svg);
  $(".hit", svg).addEventListener("pointermove", (e) => {
    const r = svg.getBoundingClientRect(), mx = (e.clientX - r.left) * W / r.width;
    const i = Math.max(0, Math.min(d.n - 1, Math.round((mx - pad.l) / ((W - pad.l - pad.r) / (d.n - 1)))));
    xh.setAttribute("x1", x(i)); xh.setAttribute("x2", x(i));
    d1.setAttribute("cx", x(i)); d1.setAttribute("cy", y(d.o[i])); d2.setAttribute("cx", x(i)); d2.setAttribute("cy", y(d.t[i]));
    tip.hidden = false; tip.innerHTML = `<b>${lab(i)}</b><span><i style="background:${AREA_INK[0]}"></i>Öğrenci ${d.o[i]}</span><span><i style="background:${AREA_INK[1]}"></i>Öğretmen ${d.t[i]}</span>`;
    const px = x(i) / W * r.width; tip.style.left = `${Math.min(px + 14, r.width - 150)}px`;
  });
  $(".hit", svg).addEventListener("pointerleave", () => { tip.hidden = true; xh.setAttribute("x1", -10); xh.setAttribute("x2", -10); d1.setAttribute("cx", -10); d2.setAttribute("cx", -10); });
};
const renderSkills = () => {
  const vals = AREAS.map((a) => avg(STU.map((s) => s.area[a.id])));
  $("[data-sk-avg]").textContent = avg(vals);
  const low = Math.min(...vals);
  $("[data-skills]").innerHTML = AREAS.map((a, i) => `<li title="${a.name}: ${vals[i]}"><span class="hb-n">${a.short}${vals[i] === low ? '<em>gelişim alanı</em>' : ""}</span><span class="hb-bar"><i style="--p:${vals[i]}%;background:${AREA_INK[i]}"></i></span><b>${vals[i]}</b></li>`).join("");
};
const renderToolUse = () => {
  const k = PERIOD[period].k, use = [["Karışık Sınav Oluştur", 420], ["Ders Planı", 360], ["Görsel Oluştur", 300], ["Veli Toplantısı Raporu", 190], ["Sınav Okuyucu", 140]];
  const max = use[0][1];
  $("[data-tooluse]").innerHTML = use.map(([t, v]) => `<li title="${t}: ${fmt(Math.round(v * k))}"><span class="hb-n">${t}</span><span class="hb-bar"><i style="--p:${v / max * 100}%"></i></span><b>${fmt(Math.round(v * k))}</b></li>`).join("");
};
const renderLevels = () => {
  $("[data-levels]").innerHTML = LEVELS.map(([id, label]) => {
    const list = STU.filter((s) => lvlOf(s) === id), act = list.filter((s) => s.days < 7).length, p = Math.round(act / Math.max(1, list.length) * 100);
    return `<li><span class="lv-ring" style="--p:${p}"><b>%${p}</b></span><span><strong>${label}</strong><small>${act}/${list.length} öğrenci · ${CLASSES.filter((c) => c.lvl === id).length} sınıf</small></span></li>`;
  }).join("");
};
const ECO = [
  { id: "t14", m: [["Aktif öğrenci", 58], ["Tamamlanan ders", 412], ["Ortalama ilerleme", "%64"]], feeds: "Kavramsal · Okuryazarlık" },
  { id: "aig", m: [["Aktif öğrenci", 44], ["AI üretimi", 980], ["Modül tamamlama", "%52"]], feeds: "Okuryazarlık · Erdem-Değer" },
  { id: "okumino", m: [["Aktif öğrenci", 39], ["Ort. okuma hızı", "148 k/dk"], ["Anlama", "%81"]], feeds: "Okuryazarlık · Kavramsal" },
  { id: "codemino", m: [["Aktif öğrenci", 27], ["Tamamlanan görev", 640], ["Ort. bölüm", 5]], feeds: "Kavramsal · Alan" },
  { id: "tc", m: [["Katılımcı", 31], ["Takım projesi", 9], ["Finalist", 4]], feeds: "Sosyal-Duygusal · Eğilimler" },
  { id: "icerik", m: [["Aktif öğrenci", 62], ["İzlenen ders", 1240], ["Ara soru başarısı", "%76"]], feeds: "Alan · Eğilimler" },
];
const logo = (p) => p.label ? `<b class="eco-word sm">İçerik</b>` : `<img src="${p.logo}" alt="${p.name}"${p.mono ? ' class="mono"' : ""}>`;
$("[data-eco-sum]").innerHTML = ECO.map((e) => { const p = PRODUCTS.find((x) => x.id === e.id); return `<li><span class="es-logo">${logo(p)}</span><span class="es-t">${e.m[0][0]}</span><b>${e.m[0][1]}</b></li>`; }).join("");
$("[data-eco-data]").innerHTML = ECO.map((e) => { const p = PRODUCTS.find((x) => x.id === e.id); return `<li class="ed">
  <div class="ed-h"><span class="ed-logo">${logo(p)}</span><span><strong>${p.label ? "Dijital İçerik Platformu" : p.name}</strong><small>${p.desc}</small></span></div>
  <dl class="ed-m">${e.m.map(([k, v]) => `<div><dt>${k}</dt><dd>${typeof v === "number" ? fmt(v) : v}</dd></div>`).join("")}</dl>
  <p class="ed-f">${icon("i-compass")}Beceri haritasına katkı: <b>${e.feeds}</b></p></li>`; }).join("");
const renderDash = () => { renderAlerts(); renderKpis(); renderTrend(); renderSkills(); renderToolUse(); renderLevels(); };
$("[data-period]").addEventListener("click", (e) => {
  const b = e.target.closest("[data-p]"); if (!b) return;
  period = b.dataset.p; $$("[data-p]").forEach((x) => x.setAttribute("aria-selected", String(x === b))); renderDash();
});
addEventListener("resize", () => { if (view === "ana") renderTrend(); });

/* ---------- araçlar ---------- */
const TOOLS = [
  [11, "Ders Planı", "Kazanıma uygun ders planı ve akış.", "yazi"], [15, "Karışık Sınav Oluştur", "Seviyeye göre sorular ve cevap anahtarı.", "olcme"],
  [12, "Sınav Okuyucu", "Kâğıt sınavları okuyup puanlar.", "olcme"], [3, "Veli Toplantısı Raporu", "Öğrenci gelişimini veliye uygun dilde özetler.", "yazi"],
  [1, "Görsel Oluştur", "Duyuru ve ders görselleri üret.", "gorsel"], [2, "Video Oluştur", "Kısa tanıtım ve ders videoları.", "video"],
  [11, "Sunum Hazırla", "Toplantı ve ders sunumları.", "yazi"], [8, "Rubrik Oluştur", "Ödev ve projeler için ölçüt.", "olcme"],
  [12, "Özet Çıkar", "Uzun metinleri karar notuna dönüştür.", "yazi"], [13, "Seslendirme", "Duyuruları doğal sesle okut.", "ses"],
  [16, "Etkinlik Fikri", "Kurum etkinlikleri için fikirler.", "yazi"], [9, "Görsel Düzenle", "Görsellerde arka plan ve ayrıntı.", "gorsel"],
];
TOOLS.forEach((t, i) => { t.n = i; });
const CATS = [["tum", "Tümü"], ["yazi", "Yazı"], ["olcme", "Ölçme"], ["gorsel", "Görsel"], ["video", "Video"], ["ses", "Ses"]];
const toolCard = (tool) => { const [art, t, d] = tool, [hue, tint] = hues[tool.n % 4];
  return `<li><a class="tool" href="#" style="--hue:${hue};--tint:${tint}"><span class="tool-art"><img src="assets/araclar/t${String(art).padStart(2, "0")}.png" alt="" loading="lazy"></span><strong>${t}</strong><span>${d}</span>${ARROW}</a></li>`; };
let cat = "tum", term = "";
const renderTools = () => { const list = TOOLS.filter((t) => (cat === "tum" || t[3] === cat) && (!term || norm(t[1] + " " + t[2]).includes(term))); $("[data-all-tools]").innerHTML = list.map(toolCard).join(""); $("[data-tools-empty]").hidden = list.length > 0; };
const chips = (host, items, onPick, sel = 0) => {
  host.innerHTML = items.map(([id, label], i) => `<button type="button" class="chip" aria-pressed="${i === sel}" data-id="${id}">${label}</button>`).join("");
  host.addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (!b) return; $$(".chip", host).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); onPick(b.dataset.id); });
};
const pickChip = (host, id) => $$(".chip", host).forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.id === id)));
chips($("[data-tool-chips]"), CATS, (id) => { cat = id; renderTools(); });
renderTools();

/* ---------- ajanlar: zamanlanmış rutin çalışma + girdi/talimat + çıktı geçmişi ----------
   Her ajan seçilen gün ve saatte "çalışır" (demo: sayfa açıkken o saat geçmişse bugünün çıktısı hazırdır), çıktısını buraya bırakır.
   Ayarlar bu tarayıcıda saklanır (aila-ajanlar). Çıktılar kurumun demo verisinden üretilir. */
const GUN = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const FREQ = [["gunluk", "Her gün"], ["haftaici", "Hafta içi"], ["haftalik", "Seçili günler"], ["elle", "Plan yok"]];
const off7 = () => STU.filter((s) => s.days >= 7);
const AGENTS = [
  { id: "rapor", art: 16, name: "Raporlama Ajanı", desc: "Her sabah kurumun günlük özet raporunu hazırlar.",
    what: "Dünkü giriş, AI kullanımı, görev teslimi ve beceri verisini toplar; yönetici için tek sayfalık sabah özeti yazar.",
    reads: "Öğrenci ve öğretmen girişleri, AI üretimleri, görev teslimleri, ekosistem verileri", makes: "Sabah özeti: 5 madde + dikkat edilmesi gerekenler",
    sched: { f: "haftaici", days: [0, 1, 2, 3, 4], t: "08:00" }, on: true,
    inputs: [["kapsam", "Kapsam", "select", ["Tüm kurum", "İlkokul", "Ortaokul", "Lise"]], ["alici", "Kime gitsin", "select", ["Yalnız bana", "Bana ve müdür yardımcılarına", "Tüm zümre başkanlarına"]], ["icerik", "İçerik", "checks", ["Aktiflik", "AI kullanımı", "Görevler", "Beceri haritası", "Riskler"]]],
    run: (v) => ({ title: `Sabah özeti · ${v.kapsam}`, lines: [`Dün ${STU.length - off7().length} öğrenci giriş yaptı (%${Math.round((1 - off7().length / STU.length) * 100)}).`, "AI üretimi önceki güne göre %6 arttı; en çok Karışık Sınav Oluştur kullanıldı.", "Bu haftanın görevinde teslim oranı %72.", `Kurum beceri ortalaması ${avg(STU.map((s) => s.score))}; en düşük alan Okuryazarlık.`, `${off7().length} öğrenci 7+ gündür giriş yapmadı (Riskli Öğrenci Ajanı'na iletildi).`] }) },
  { id: "risk", art: 7, name: "Riskli Öğrenci Ajanı", desc: "Uzun süre giriş yapmayan ve düşüş gösteren öğrencileri erken bildirir.",
    what: "Giriş sıklığını ve beceri puanındaki değişimi izler; eşiği aşan öğrencileri sınıf öğretmenine ve rehberliğe bildirir.",
    reads: "Son giriş tarihleri, beceri puanı geçmişi, görev teslimleri", makes: "Öğrenci listesi + her biri için önerilen adım",
    sched: { f: "gunluk", days: [0, 1, 2, 3, 4, 5, 6], t: "07:30" }, on: true,
    inputs: [["esik", "Girişsiz gün eşiği", "number", 7], ["dusus", "Beceri düşüşü eşiği (puan)", "number", 5], ["bildir", "Kime bildirilsin", "select", ["Sınıf öğretmeni ve rehberlik", "Yalnız rehberlik", "Yalnız bana"]]],
    run: (v) => { const l = STU.filter((s) => s.days >= +v.esik).slice(0, 6); return { title: `${STU.filter((s) => s.days >= +v.esik).length} öğrenci ${v.esik}+ gündür girmedi`, lines: [...l.map((s) => `${s.name} (${s.cls || "sınıfsız"}) · ${s.login}`), `Öneri: ${v.bildir.toLocaleLowerCase("tr")} ile görüşme planlansın.`] }; } },
  { id: "deneme", art: 15, name: "Deneme Analiz Ajanı", desc: "Son deneme sınavını kazanım bazında analiz eder.",
    what: "Seçilen denemenin sonuçlarını kazanımlara ayırır, sınıfları karşılaştırır, eksik kazanımlar için öğretmenlere çalışma önerir.",
    reads: "Deneme sınavı sonuçları, kazanım eşleşmeleri", makes: "Sınıf karşılaştırması + eksik kazanım listesi",
    sched: { f: "haftalik", days: [0], t: "09:00" }, on: true,
    inputs: [["sinav", "Deneme", "select", ["Ekim 2. deneme", "Ekim 1. deneme", "Eylül tarama"]], ["kademe", "Kademe", "select", ["Ortaokul", "Lise", "Tümü"]]],
    run: (v) => ({ title: `${v.sinav} · ${v.kademe} analizi`, lines: ["Ortalama net bir önceki denemeye göre +2,4.", "En iyi sınıf 8-A, en çok gelişen 6-A.", "Eksik kazanımlar: oran-orantı, paragrafta ana fikir, maddenin halleri.", "Öğretmenlere üç kazanım için hazır çalışma kâğıdı önerildi."] }) },
  { id: "veli", art: 3, name: "Veli İletişim Ajanı", desc: "Haftalık veli bilgilendirmesini hazırlar, onayınızla gönderir.",
    what: "Haftanın öne çıkanlarından velilere uygun dilde kısa bir mesaj yazar; siz onaylamadan göndermez.",
    reads: "Haftalık rapor, duyurular, etkinlik takvimi", makes: "Veli mesajı taslağı (onay bekler)",
    sched: { f: "haftalik", days: [4], t: "16:00" }, on: false,
    inputs: [["ton", "Üslup", "select", ["Sıcak ve kısa", "Resmî"]], ["kanal", "Kanal", "select", ["Uygulama bildirimi", "E-posta", "SMS"]], ["onay", "Göndermeden önce onayımı al", "toggle", true]],
    run: (v) => ({ title: `Veli mesajı taslağı · ${v.kanal}`, lines: [v.ton === "Resmî" ? "Sayın velimiz, bu hafta öğrencilerimiz yapay zekâ destekli görevlerde %72 teslim oranına ulaştı." : "Merhaba! Bu hafta çocuklarımız yapay zekâyla oyun kuralları yazdı, harika işler çıktı.", "Gelecek hafta: Talent Cup takım projeleri başlıyor.", v.onay ? "Durum: onayınızı bekliyor." : "Durum: gönderildi."] }) },
  { id: "ogretmen", art: 11, name: "Öğretmen Kullanım Ajanı", desc: "AI araçlarını kullanmayan öğretmenlere kısa rehber önerir.",
    what: "Öğretmenlerin araç kullanımını izler; hiç kullanmayanlara branşına uygun tek bir araç ve kısa rehber önerir.",
    reads: "Öğretmen girişleri ve araç kullanımı", makes: "Öğretmen listesi + kişisel öneriler",
    sched: { f: "haftaici", days: [0, 1, 2, 3, 4], t: "08:30" }, on: true,
    inputs: [["esik", "Kaç gündür kullanmayanlar", "number", 14]],
    run: (v) => ({ title: `4 öğretmen ${v.esik}+ gündür araç kullanmadı`, lines: ["Kemal Öz (Matematik) → Karışık Sınav Oluştur önerildi.", "Nur Aydın (Türkçe) → Hikâye-Drama Oluştur önerildi.", "Okan Tan (Fen) → Simülasyon Aracı önerildi.", "Esra Ak (İngilizce) → Ders Planı Oluştur önerildi."] }) },
  { id: "toplanti", art: 12, name: "Toplantı Notu Ajanı", desc: "Toplantı notlarını karar ve görev listesine çevirir.",
    what: "Yapıştırdığınız toplantı notunu okur; kararları, sorumluları ve tarihleri ayırır.",
    reads: "Sizin yapıştırdığınız notlar", makes: "Karar listesi + sorumlu ve tarih",
    sched: { f: "elle", days: [], t: "09:00" }, on: false,
    inputs: [["not", "Toplantı notu", "textarea", ""]],
    run: (v) => ({ title: "Karar listesi", lines: v.not ? v.not.split(/[.\n]/).map((x) => x.trim()).filter(Boolean).slice(0, 5).map((x, i) => `${i + 1}. ${x}`) : ["Not girilmedi. Ayarlar sekmesindeki alana toplantı notunu yapıştırın."] }) },
];
// ayarlar ve çıktılar
let agState = {};
try { agState = JSON.parse(localStorage.getItem("aila-ajanlar") || "{}"); } catch (e) { agState = {}; }
// since: planlı geçmiş çıktılar yalnız bu andan sonrası için üretilir (takvim değişince geriye dönük çıktı çıkmasın)
const agS = (a) => (agState[a.id] ||= { since: Date.now() - 3 * 864e5, sched: { ...a.sched, days: [...a.sched.days] }, on: a.on, talimat: "", vals: Object.fromEntries(a.inputs.map(([k, , type, def]) => [k, type === "select" ? def[0] : type === "checks" ? [...def] : def])), outs: [] });
const agSave = () => { try { localStorage.setItem("aila-ajanlar", JSON.stringify(agState)); } catch (e) { /* yok say */ } };
const hhmm = (t) => t.split(":").map(Number);
const dayIdx = (d) => (d.getDay() + 6) % 7;   // Pzt = 0
const runsOn = (sc, d) => sc.f === "gunluk" || (sc.f === "haftaici" && dayIdx(d) < 5) || (sc.f === "haftalik" && sc.days.includes(dayIdx(d)));
const schedText = (sc) => sc.f === "elle" ? "Yalnız elle çalışır" : `${sc.f === "gunluk" ? "Her gün" : sc.f === "haftaici" ? "Hafta içi" : sc.days.map((i) => GUN[i]).join(", ") || "Gün seçilmedi"} · ${sc.t}`;
const nextRun = (sc) => {
  if (sc.f === "elle") return null;
  const [h, m] = hhmm(sc.t), now = new Date();
  for (let i = 0; i < 8; i++) { const d = new Date(now); d.setDate(now.getDate() + i); d.setHours(h, m, 0, 0); if (d > now && runsOn(sc, d)) return d; }
  return null;
};
const when = (d) => { const n = new Date(), t = new Date(n); t.setDate(n.getDate() + 1); const hm = d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  return d.toDateString() === n.toDateString() ? `bugün ${hm}` : d.toDateString() === t.toDateString() ? `yarın ${hm}` : `${d.toLocaleDateString("tr-TR", { weekday: "long" })} ${hm}`; };
const mkOut = (a, at, manual = false) => { const st = agS(a), r = a.run(st.vals); return { at: at.getTime(), manual, title: r.title, lines: st.talimat ? [...r.lines, `Talimatınız uygulandı: “${st.talimat}”`] : r.lines }; };
// zamanlanmış çalışmalar: son 3 günün planlı saatleri geçtiyse çıktıları üret (demo; gerçekte sunucu her sabah çalıştırır)
const catchUp = () => AGENTS.forEach((a) => {
  const st = agS(a); if (!st.on || st.sched.f === "elle") return;
  const [h, m] = hhmm(st.sched.t), now = new Date();
  for (let i = 2; i >= 0; i--) { const d = new Date(now); d.setDate(now.getDate() - i); d.setHours(h, m, 0, 0);
    if (d <= now && d.getTime() >= (st.since || 0) && runsOn(st.sched, d) && !st.outs.some((o) => !o.manual && Math.abs(o.at - d.getTime()) < 60000)) st.outs.unshift(mkOut(a, d)); }
  st.outs.sort((x, y) => y.at - x.at); st.outs = st.outs.slice(0, 15);
});
const fmtAt = (ms) => { const d = new Date(ms); return `${d.toDateString() === new Date().toDateString() ? "Bugün" : d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} ${d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`; };
const agArt = (a, i) => { const [hue, tint] = hues[i % 4]; return `style="--hue:${hue};--tint:${tint}"><img src="assets/araclar/t${String(a.art).padStart(2, "0")}.png" alt=""`; };
// Yönetici yalnız planlar ve kaydeder; ajanı kurum sistemi bu plana göre çalıştırır, çıktısı buraya düşer.
// Kart sade: kimlik, plan hapı, Aktif/Pasif anahtarı; pasif ajan soluk görünür.
const renderAg = () => {
  catchUp(); agSave();
  $("[data-ag]").innerHTML = AGENTS.map((a, i) => { const st = agS(a), last = st.outs[0];
    return `<li class="ag${st.on ? "" : " off"}" data-ag-id="${a.id}">
      <button type="button" class="ag-main" data-ag-open="ayar" aria-label="${a.name} ayarları">
        <span class="tool-art" ${agArt(a, i)}></span>
        <span class="ag-t"><strong>${a.name}</strong><span>${a.desc}</span></span>
      </button>
      <button type="button" class="ag-i" aria-label="${a.name} ne yapar?" title="Ne yapar?" data-ag-info-btn><svg class="icon"><use href="#i-info" /></svg></button>
      <div class="ag-row">
        <button type="button" class="ag-plan${st.sched.f === "elle" ? " none" : ""}" data-ag-open="ayar">${st.sched.f === "elle" ? "Plan yok" : schedText(st.sched)}</button>
        <label class="ag-sw" title="${st.on ? "Aktif" : "Pasif"}"><span>${st.on ? "Aktif" : "Pasif"}</span><input type="checkbox" role="switch" ${st.on ? "checked" : ""} aria-label="${a.name} aktif" data-ag-on><i aria-hidden="true"></i></label>
      </div>
      ${last ? `<button type="button" class="ag-out" data-ag-open="cikti"><span>${fmtAt(last.at)}</span><b>${esc(last.title)}</b>${ARROW}</button>` : ""}
    </li>`; }).join("");
  const feed = AGENTS.flatMap((a) => agS(a).outs.map((o) => ({ a, o }))).sort((x, y) => y.o.at - x.o.at).slice(0, 12);
  $("[data-ag-feed-sub]").textContent = feed.length ? `${feed.length} çıktı` : "Henüz çıktı yok";
  $("[data-ag-feed]").innerHTML = feed.map(({ a, o }) => `<li><button type="button" class="agf" data-ag-feed-open="${a.id}"><time>${fmtAt(o.at).replace("Bugün ", "")}</time><span><small>${a.name}</small><strong>${esc(o.title)}</strong></span>${ARROW}</button></li>`).join("") || `<li class="agf-empty">Aktif ajanlar planlı saatlerinde kurum sisteminde çalıştıkça çıktılar burada görünür.</li>`;
  const active = AGENTS.filter((a) => agS(a).on).length;
  $("[data-ag-today]").textContent = `${active} / ${AGENTS.length} ajan aktif`;
};
// ⓘ bilgi kutusu
const pop = $("[data-ag-pop]");
const infoHtml = (a) => `<h3>${a.name}</h3><dl><dt>Ne yapar?</dt><dd>${a.what}</dd><dt>Neye bakar?</dt><dd>${a.reads}</dd><dt>Ne üretir?</dt><dd>${a.makes}</dd><dt>Sizden ne ister?</dt><dd>${a.inputs.map((x) => x[1]).join(", ")} ve isterseniz serbest bir talimat.</dd></dl>`;
// pencere: ayarlar / çıktılar / bilgi
const dlg2 = $("[data-ag-dlg]"); let agCur = null;
const setAgTab = (t) => { $$("[data-agtab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.agtab === t))); $$("[data-agpane]").forEach((p) => { p.hidden = p.dataset.agpane !== t; }); };
const field = ([k, label, type, def], v) => type === "select" ? `<label class="fld"><span>${label}</span><select name="${k}">${def.map((o) => `<option${o === v ? " selected" : ""}>${o}</option>`).join("")}</select></label>`
  : type === "number" ? `<label class="fld"><span>${label}</span><input type="number" min="1" max="60" name="${k}" value="${v}"></label>`
  : type === "toggle" ? `<label class="tg"><span><strong>${label}</strong></span><input type="checkbox" role="switch" name="${k}" ${v ? "checked" : ""}><i aria-hidden="true"></i></label>`
  : type === "checks" ? `<fieldset class="fld wide"><legend>${label}</legend><div class="pf-tags">${def.map((o) => `<label class="tagc"><input type="checkbox" name="${k}" value="${o}" ${v.includes(o) ? "checked" : ""}><span>${o}</span></label>`).join("")}</div></fieldset>`
  : `<label class="fld wide"><span>${label}</span><textarea name="${k}" rows="4" placeholder="Toplantı notunu buraya yapıştırın…">${esc(v)}</textarea></label>`;
const TALIMAT_ORNEK = { rapor: ["Lise kademesine ayrı paragraf aç", "Sayıları önceki haftayla karşılaştır"], risk: ["8. sınıfları öncelikli listele", "Velisine de kısa not hazırla"], deneme: ["Matematiği ayrıntılı incele"], veli: ["Talent Cup duyurusunu ekle"], ogretmen: ["Yeni başlayan öğretmenleri ayrıca belirt"], toplanti: ["Her karara bir sorumlu yaz"] };
const openAg = (id, tab = "ayar") => {
  const a = AGENTS.find((x) => x.id === id), st = agS(a), i = AGENTS.indexOf(a); agCur = a;
  $("[data-agd-art]").outerHTML = `<span class="tool-art" data-agd-art ${agArt(a, i)}></span>`;
  $("[data-agd-name]").textContent = a.name; $("[data-agd-desc]").textContent = a.desc; $("[data-agd-count]").textContent = st.outs.length;
  $("[data-ag-form]").innerHTML = `
    <section class="agd-sec"><h3><svg class="icon" aria-hidden="true"><use href="#i-calendar" /></svg>Plan</h3>
      <div class="seg-tabs sm" role="radiogroup" aria-label="Sıklık" data-ag-freq>${FREQ.map(([k, l]) => `<button type="button" role="radio" aria-checked="${k === st.sched.f}" data-f="${k}">${l}</button>`).join("")}</div>
      <div class="ag-days" data-ag-days ${st.sched.f === "haftalik" ? "" : "hidden"}>${GUN.map((g, j) => `<button type="button" aria-pressed="${st.sched.days.includes(j)}" data-d="${j}">${g}</button>`).join("")}</div>
      <label class="fld ag-time" ${st.sched.f === "elle" ? "hidden" : ""} data-ag-time-wrap><span>Saat</span><input type="time" name="saat" value="${st.sched.t}" step="900"></label>
      <p class="ag-next" data-ag-next></p></section>
    <section class="agd-sec"><h3><svg class="icon" aria-hidden="true"><use href="#i-layers" /></svg>Girdiler</h3><div class="pf-fields">${a.inputs.map((inp) => field(inp, st.vals[inp[0]])).join("")}</div></section>
    <section class="agd-sec"><h3><svg class="icon" aria-hidden="true"><use href="#i-chat" /></svg>Talimat <small>isteğe bağlı</small></h3>
      <textarea name="talimat" rows="2" maxlength="300" placeholder="Örneğin: ${TALIMAT_ORNEK[a.id][0]}">${esc(st.talimat)}</textarea>
      <div class="ag-ex">${TALIMAT_ORNEK[a.id].map((t) => `<button type="button" class="apill" data-ex="${esc(t)}">${t}</button>`).join("")}</div></section>
    <div class="pf-actions"><span class="pf-saved" role="status" data-ag-status></span><button type="submit" class="btn-primary">Kaydet</button></div>`;
  $("[data-ag-outs]").innerHTML = st.outs.map((o, k) => `<li class="ago"><details${k ? "" : " open"}><summary><time>${fmtAt(o.at)}</time><strong>${esc(o.title)}</strong><i class="sch">kurum · planlı</i><svg class="icon" aria-hidden="true"><use href="#i-down" /></svg></summary><ul>${o.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></details></li>`).join("") || `<li class="agf-empty">Henüz çıktı yok.</li>`;
  $("[data-ag-info]").innerHTML = infoHtml(a);
  updNext(); setAgTab(tab); if (!dlg2.open) dlg2.showModal();
};
const readForm = () => {
  const a = agCur, st = agS(a), fm = $("[data-ag-form]"), f = $("[data-ag-freq] [aria-checked=true]").dataset.f, old = JSON.stringify(st.sched);
  st.sched = { f, days: f === "haftalik" ? $$("[data-ag-days] [aria-pressed=true]").map((b) => +b.dataset.d) : f === "haftaici" ? [0, 1, 2, 3, 4] : f === "gunluk" ? [0, 1, 2, 3, 4, 5, 6] : [], t: fm.saat.value || "08:00" };
  a.inputs.forEach(([k, , type]) => { st.vals[k] = type === "checks" ? $$(`[name="${k}"]:checked`, fm).map((x) => x.value) : type === "toggle" ? fm[k].checked : fm[k].value; });
  st.talimat = fm.talimat.value.trim();
  if (JSON.stringify(st.sched) !== old) st.since = Date.now();
};
const updNext = () => { const f = $("[data-ag-freq] [aria-checked=true]").dataset.f, days = $$("[data-ag-days] [aria-pressed=true]").map((b) => +b.dataset.d), t = $("[data-ag-form]").saat.value;
  const nx = nextRun({ f, days: f === "haftalik" ? days : f === "haftaici" ? [0, 1, 2, 3, 4] : [0, 1, 2, 3, 4, 5, 6], t });
  $("[data-ag-next]").innerHTML = f === "elle" ? "Plan yok; ajan çalışmaz." : nx ? `Sonraki çalışma: <b>${when(nx)}</b>. Kurum sistemi ajanı bu plana göre çalıştırır, çıktı bu sayfaya düşer.` : "En az bir gün seçin."; };
$("[data-ag-form]").addEventListener("click", (e) => {
  const fb = e.target.closest("[data-f]"), db = e.target.closest("[data-d]"), ex = e.target.closest("[data-ex]");
  if (fb) { $$("[data-ag-freq] [data-f]").forEach((b) => b.setAttribute("aria-checked", String(b === fb)));
    if (fb.dataset.f === "haftalik" && $$("[data-ag-days] [aria-pressed=true]").length === 7) $$("[data-ag-days] [data-d]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.d === "0"))); $("[data-ag-days]").hidden = fb.dataset.f !== "haftalik"; $("[data-ag-time-wrap]").hidden = fb.dataset.f === "elle"; updNext(); }
  if (db) { db.setAttribute("aria-pressed", String(db.getAttribute("aria-pressed") !== "true")); updNext(); }
  if (ex) { const ta = $("[data-ag-form]").talimat; ta.value = ex.dataset.ex; ta.focus(); }
});
$("[data-ag-form]").addEventListener("input", (e) => { if (e.target.name === "saat") updNext(); });
$("[data-ag-form]").addEventListener("submit", (e) => { e.preventDefault(); readForm(); agSave(); renderAg(); const s = $("[data-ag-status]"); s.textContent = "Kaydedildi"; s.className = "pf-saved on"; setTimeout(() => s.classList.remove("on"), 2000); updNext(); });
$("[data-ag]").addEventListener("click", (e) => {
  const li = e.target.closest("[data-ag-id]"); if (!li) return; const a = AGENTS.find((x) => x.id === li.dataset.agId);
  if (e.target.closest("[data-ag-info-btn]")) {
    e.stopPropagation(); const b = e.target.closest("[data-ag-info-btn]").getBoundingClientRect(), host = $('[data-view="ajanlar"]').getBoundingClientRect();
    pop.innerHTML = infoHtml(a) + `<button type="button" class="linkish" data-ag-pop-more="${a.id}">Ayarları aç</button>`;
    pop.hidden = false; pop.style.top = `${b.bottom - host.top + 8}px`; pop.style.left = `${Math.min(b.right - host.left - 300, host.width - 330)}px`; return;
  }
  const op = e.target.closest("[data-ag-open]"); if (op) openAg(a.id, op.dataset.agOpen);
});
$("[data-ag]").addEventListener("change", (e) => { const t = e.target.closest("[data-ag-on]"); if (!t) return; const st = agS(AGENTS.find((x) => x.id === t.closest("[data-ag-id]").dataset.agId)); st.on = t.checked; if (t.checked) st.since = Date.now(); agSave(); renderAg(); });   // yeniden açılınca geçmiş için çıktı üretilmez
$("[data-ag-feed]").addEventListener("click", (e) => { const b = e.target.closest("[data-ag-feed-open]"); if (b) openAg(b.dataset.agFeedOpen, "cikti"); });
document.addEventListener("click", (e) => { if (!pop.hidden && !e.target.closest("[data-ag-pop]")) pop.hidden = true; const m = e.target.closest("[data-ag-pop-more]"); if (m) { pop.hidden = true; openAg(m.dataset.agPopMore, "ayar"); } });
$$("[data-agtab]").forEach((b) => b.addEventListener("click", () => setAgTab(b.dataset.agtab)));
$("[data-agd-close]").addEventListener("click", () => dlg2.close());
dlg2.addEventListener("click", (e) => { if (e.target === dlg2) dlg2.close(); });
renderAg();

/* ---------- kurum yönetimi: sınıf + öğrenci ---------- */
let lvl = "tum", clsQ = "", ogrF = "tum", ogrQ = "", ogrCls = "";
const setKTab = (t) => { $$("[data-ktab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.ktab === t))); $$("[data-kpane]").forEach((p) => { p.hidden = p.dataset.kpane !== t; }); };
$$("[data-ktab]").forEach((b) => b.addEventListener("click", () => setKTab(b.dataset.ktab)));
const counts = () => { $("[data-cnt-sinif]").textContent = CLASSES.length; $("[data-cnt-ogr]").textContent = STU.length; $("[data-pf-cls]").textContent = CLASSES.length; $("[data-pf-ogr]").textContent = STU.length; };
const ring = (v) => `<span class="ring" style="--p:${v}"><b>${v}</b></span>`;
const renderCls = () => {
  const list = CLASSES.filter((c) => (lvl === "tum" || c.lvl === lvl) && (!clsQ || norm(c.name + " " + c.teacher).includes(clsQ)));
  $("[data-cls-grid]").innerHTML = list.map((c) => { const s = inCls(c.name), off = s.filter((x) => x.days >= 7).length; return `<li class="cls-card">
    <div class="cc-h"><span class="cc-name">${esc(c.name)}</span><span><strong>${LEVELS.find((l) => l[0] === c.lvl)[1]}</strong><small>Sınıf öğretmeni: ${esc(c.teacher)}</small></span>${ring(avg(s.map((x) => x.score)) || 0)}</div>
    <div class="cc-m"><span><b>${s.length}</b> öğrenci</span><span class="${off ? "warn" : ""}"><b>${off}</b> 7+ gün girişsiz</span></div>
    <div class="cc-a"><button type="button" class="btn-ghost sm" data-cls-stu="${esc(c.name)}">${icon("i-people")}Öğrenciler</button><button type="button" class="btn-ghost sm" data-cls-edit="${esc(c.name)}">${icon("i-pen")}Düzenle</button></div></li>`; }).join("") || `<p class="empty">Bu aramayla eşleşen sınıf yok.</p>`;
};
const fillClsSelect = () => { $("[data-ogr-cls]").innerHTML = `<option value="">Tümü</option>${CLASSES.map((c) => `<option${c.name === ogrCls ? " selected" : ""}>${esc(c.name)}</option>`).join("")}`; };
const renderOgr = () => {
  const list = STU.filter((s) => (ogrF === "tum" || (ogrF === "aktif" && s.days < 7) || (ogrF === "pasif" && s.days >= 7) || (ogrF === "sinifsiz" && !s.cls))
    && (!ogrCls || s.cls === ogrCls) && (!ogrQ || norm(s.name).includes(ogrQ)));
  $("[data-ogr-body]").innerHTML = list.map((s) => `<div class="stu-row" role="row">
    <span role="cell" class="stu-who"><span class="avatar sm" style="background:${hues[s.no % 4][0]}">${initials(s.name)}</span><span><strong>${esc(s.name)}</strong><small>No ${s.no}</small></span></span>
    <span role="cell"><label class="assign"><select aria-label="${esc(s.name)} sınıfı" data-move="${s.id}"><option value=""${s.cls ? "" : " selected"}>Sınıfsız</option>${CLASSES.map((c) => `<option${c.name === s.cls ? " selected" : ""}>${esc(c.name)}</option>`).join("")}</select></label></span>
    <span role="cell"><span class="sc"><i style="--p:${s.score}%"></i><b>${s.score}</b></span></span>
    <span role="cell" class="stu-login${s.days >= 7 ? " warn" : ""}">${s.login}</span>
    <span role="cell" class="r stu-act" data-sid="${s.id}"><button type="button" class="btn-ghost sm" data-map>${icon("i-compass")}Beceri Haritası</button>${MORE(`${esc(s.name)} için diğer işlemler`)}</span></div>`).join("") || `<p class="empty">Bu filtreyle eşleşen öğrenci yok.</p>`;
};
chips($("[data-lvl-chips]"), [["tum", "Tümü"], ...LEVELS], (id) => { lvl = id; renderCls(); });
const OGR_F = [["tum", "Tümü"], ["aktif", "Aktif"], ["pasif", "7+ gün girişsiz"], ["sinifsiz", "Sınıfsız"]];
chips($("[data-ogr-chips]"), OGR_F, (id) => { ogrF = id; renderOgr(); });
$("[data-cls-q]").addEventListener("input", (e) => { clsQ = norm(e.target.value.trim()); renderCls(); });
$("[data-ogr-q]").addEventListener("input", (e) => { ogrQ = norm(e.target.value.trim()); renderOgr(); });
$("[data-ogr-cls]").addEventListener("change", (e) => { ogrCls = e.target.value; renderOgr(); });
$("[data-cls-grid]").addEventListener("click", (e) => {
  const st2 = e.target.closest("[data-cls-stu]"), ed = e.target.closest("[data-cls-edit]");
  if (st2) { ogrCls = st2.dataset.clsStu; ogrF = "tum"; pickChip($("[data-ogr-chips]"), "tum"); fillClsSelect(); renderOgr(); setKTab("ogrenci"); }
  if (ed) openK("sinif", CLASSES.find((c) => c.name === ed.dataset.clsEdit));
});
$("[data-ogr-body]").addEventListener("change", (e) => { const s = e.target.closest("[data-move]"); if (!s) return; STU.find((x) => x.id === s.dataset.move).cls = s.value || null; renderCls(); renderOgr(); renderDash(); });
// tek pencere: sınıf ekle/düzenle, öğrenci ekle, parola sıfırla
const kDlg = $("[data-k-dlg]"); let kMode = null, kItem = null;
const lvlOpts = (sel) => LEVELS.map(([id, l]) => `<option value="${id}"${id === sel ? " selected" : ""}>${l}</option>`).join("");
const openK = (mode, item = null) => {
  kMode = mode; kItem = item; $("[data-k-msg]").textContent = ""; $("[data-k-close]").textContent = mode === "harita" ? "Kapat" : "Vazgeç"; $("[data-k-ok]").hidden = false; $("[data-k-ok]").textContent = "Kaydet";
  const f = $("[data-k-fields]");
  if (mode === "sinif") {
    $("[data-k-title]").textContent = item ? `${item.name} sınıfını düzenle` : "Yeni sınıf";
    f.innerHTML = `<label class="fld"><span>Sınıf adı</span><input required maxlength="16" value="${item ? esc(item.name) : ""}" placeholder="Örn. 6-B" data-kf-name></label>
      <label class="fld"><span>Kademe</span><select data-kf-lvl>${lvlOpts(item?.lvl || "orta")}</select></label>
      <label class="fld"><span>Sınıf öğretmeni</span><select data-kf-t>${TEACHERS.map((t) => `<option${t === item?.teacher ? " selected" : ""}>${t}</option>`).join("")}</select></label>`;
  } else if (mode === "ogrenci") {
    $("[data-k-title]").textContent = "Öğrenci ekle";
    f.innerHTML = `<label class="fld"><span>Ad soyad</span><input required placeholder="Örn. Deniz Yılmaz" data-kf-name></label>
      <label class="fld"><span>Sınıf</span><select data-kf-cls><option value="">Sınıfsız (havuz)</option>${CLASSES.map((c) => `<option>${esc(c.name)}</option>`).join("")}</select></label>`;
  } else if (mode === "harita") {
    $("[data-k-title]").textContent = `${item.name} · Beceri Haritası`; $("[data-k-ok]").hidden = true;
    $("[data-k-msg]").textContent = `${item.cls || "Sınıfsız"} · son giriş ${item.login.toLocaleLowerCase("tr")}`;
    const low = AREAS.reduce((m, a) => (item.area[a.id] < item.area[m.id] ? a : m), AREAS[0]);
    f.innerHTML = `<div class="km-mini"><span class="lv-ring big" style="--p:${item.score}"><b>${item.score}</b></span><span><strong>Genel beceri puanı</strong><small>Gelişim alanı: ${low.name}</small></span></div>
      <ul class="hbars">${AREAS.map((a, i) => `<li><span class="hb-n">${a.short}</span><span class="hb-bar"><i style="--p:${item.area[a.id]}%;background:${AREA_INK[i]}"></i></span><b>${item.area[a.id]}</b></li>`).join("")}</ul>`;
  } else {
    $("[data-k-title]").textContent = "Parolayı sıfırla"; f.innerHTML = "";
    $("[data-k-msg]").textContent = `${item.name} için geçici bir parola oluşturulacak. Mevcut parolası geçersiz olur.`; $("[data-k-ok]").textContent = "Sıfırla";
  }
  kDlg.showModal(); $("input", f)?.focus();
};
$("[data-k-form]").addEventListener("submit", (e) => {
  e.preventDefault();
  if (kMode === "reset") {
    $("[data-k-msg]").innerHTML = `${esc(kItem.name)} için geçici parola: <b class="k-code">${initials(kItem.name)}-${Math.floor(1000 + kItem.r() * 9000)}</b><br><small>Öğrenci ilk girişte yeni parola belirleyecek.</small>`;
    $("[data-k-ok]").hidden = true; return;
  }
  const name = $("[data-kf-name]").value.trim();
  if (!name) { $("[data-k-msg]").textContent = "Ad alanı boş olamaz."; return; }
  if (kMode === "sinif") {
    const data = { name, lvl: $("[data-kf-lvl]").value, teacher: $("[data-kf-t]").value };
    if (kItem) { STU.forEach((s) => { if (s.cls === kItem.name) s.cls = name; }); Object.assign(kItem, data); } else CLASSES.push(data);
  } else addStu(name, CLASSES.find((c) => c.name === $("[data-kf-cls]").value) || null);
  kDlg.close(); counts(); fillClsSelect(); renderCls(); renderOgr(); renderDash();
});
$("[data-k-close]").addEventListener("click", () => kDlg.close());
kDlg.addEventListener("click", (e) => { if (e.target === kDlg) kDlg.close(); });
$("[data-cls-add]").addEventListener("click", () => openK("sinif"));
$("[data-ogr-add]").addEventListener("click", () => openK("ogrenci"));
$("[data-ogr-body]").addEventListener("click", (e) => {
  const cell = e.target.closest("[data-sid]"); if (!cell) return; const s = STU.find((x) => x.id === cell.dataset.sid);
  if (e.target.closest("[data-map]")) openK("harita", s);
  const m = e.target.closest("[data-more]"); if (m) openRowMenu(m, [["Parola sıfırla", "i-key", () => openK("reset", s)]]);
});
counts(); fillClsSelect(); renderCls(); renderOgr();

/* ---------- sayfalar ---------- */
let view = "ana";
const VIEWS = $$("[data-view]").map((v) => v.dataset.view);
const LABELS = { ana: "Kurum raporu", araclar: "Araçlar", ajanlar: "Ajanlar", kurum: "Kurum Yönetimi", ekosistem: "Ekosistem verileri", profil: "Profil" };
const go = () => {
  const [h, a1, a2] = location.hash.slice(1).split("/").map(decodeURIComponent);
  view = VIEWS.includes(h) ? h : "ana";
  $$("[data-view]").forEach((v) => { v.hidden = v.dataset.view !== view; });
  document.body.dataset.page = view;
  $$("[data-nav]").forEach((a) => { if (a.dataset.nav === view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  let label = LABELS[view];
  if (view === "ana") requestAnimationFrame(renderTrend);
  if (view === "kurum" && a1) {   // uyarılardan gelen kısayol: #kurum/ogrenci/pasif
    setKTab(a1 === "ogrenci" ? "ogrenci" : "sinif");
    if (a2 && OGR_F.some((f) => f[0] === a2)) { ogrF = a2; ogrCls = ""; fillClsSelect(); pickChip($("[data-ogr-chips]"), a2); renderOgr(); }
  }
  if (view === "formlar") label = openForm(a1);
  document.title = `${label} · AI-LA`;
};

/* ---------- formlar: Kurum tanıma + Kurum gelişim ---------- */
const A = (n) => `assets/araclar/t${String(n).padStart(2, "0")}.png`, P = (n) => `assets/profil/p${String(n).padStart(2, "0")}.png`;
const FORMS = {
  tanima: { title: "Kurum tanıma formu", sub: "Yaklaşık 3 dakika · raporlar ve öneriler kurumunuza göre ayarlanır", steps: [
    { id: "merhaba", art: "assets/profil/p05a.png", title: "Kurumunuzu tanıyalım.", text: "Birkaç kısa soru. Cevaplarınız raporları, ajanları ve önerileri kurumunuza göre ayarlar.", next: "Başlayalım" },
    { id: "kademe", art: A(16), title: "Hangi kademelerde eğitim veriyorsunuz?", text: "Birden fazla seçebilirsiniz.", max: 3, opts: [["İlkokul", A(1)], ["Ortaokul", A(11)], ["Lise", A(15)]] },
    { id: "buyukluk", art: A(8), title: "Kurumunuzun öğrenci sayısı?", text: "Birini seçin.", max: 1, opts: [["0–250", A(1)], ["250–750", A(11)], ["750–1500", A(16)], ["1500 üzeri", P(8)]] },
    { id: "hedef", art: A(7), title: "Yapay zekâda önceliğiniz ne?", text: "En çok 3 tane seçin.", max: 3, opts: [["Öğretmen verimliliği", A(11)], ["Öğrenci gelişimi takibi", A(16)], ["Ölçme-değerlendirme", A(15)], ["Veli iletişimi", A(3)], ["Kurum tanıtımı", A(1)], ["Güvenli kullanım", P(2)]] },
    { id: "platform", art: A(12), title: "Hangi platformları kullanıyorsunuz?", text: "İstediğiniz kadar seçin.", max: 6, opts: [["Talent14", A(11)], ["AI-GALAXY", A(1)], ["Okumino", A(12)], ["Codemino", A(5)], ["Talent Cup", P(8)], ["İçerik platformu", A(16)]] },
    { id: "bitti", art: P(8), title: "Teşekkürler, kurumunuzu tanıdık!", text: "Raporlar ve ajan önerileri bundan sonra cevaplarınıza göre gelecek.", next: "Profile dön", done: true },
  ] },
  gelisim: { title: "Kurum gelişim formu", sub: "Yaklaşık 4 dakika · kurumunuz için gelişim planı önerilir", steps: [
    { id: "merhaba", art: P(8), title: "Kurumunuzun gelişim planını çıkaralım.", text: "Öncelikli alanlarınızı ve hedeflerinizi soracağız; size bir dönemlik yol haritası önereceğiz.", next: "Başlayalım" },
    { id: "alan", art: A(16), title: "Hangi beceri alanını güçlendirmek istersiniz?", text: "En çok 2 tane seçin.", max: 2, opts: AREAS.map((a, i) => [a.short, [A(12), A(15), A(16), A(3), A(1), P(2)][i]]) },
    { id: "egitim", art: A(2), title: "Öğretmenleriniz için hangi eğitim?", text: "En çok 3 tane seçin.", max: 3, opts: [["AI'ya giriş", A(3)], ["Doğru komut yazma", A(12)], ["AI ile ölçme", A(15)], ["Etik ve güvenlik", P(2)], ["Ajan kullanımı", A(7)], ["Beceri haritasını okuma", A(16)]] },
    { id: "hedef", art: A(8), title: "Dönem sonu hedefiniz?", text: "Birini seçin.", max: 1, opts: [["Öğrencilerin %80'i aktif", A(16)], ["Her öğretmen haftada 1 araç", A(11)], ["Beceri ortalaması +5", P(8)], ["Velilerle aylık rapor", A(3)]] },
    { id: "not", art: P(1), title: "Eklemek istediğiniz bir not var mı?", text: "Örneğin: “Lise kademesinde AI kullanımını ölçme-değerlendirmeyle başlatmak istiyoruz.”", input: true },
    { id: "bitti", art: P(8), title: "Gelişim planınız hazır!", text: "Önerilen yol haritası ve eğitimler Ana Sayfa'daki raporun altında görünecek.", next: "Profile dön", done: true },
  ] },
};
let formId = null, steps = null;
const tani = { i: 0, picks: {}, note: "" };
const taniStep = $("[data-tani-step]"), taniDots = $("[data-tani-dots]"), taniArt = $("[data-tani-art]");
const taniPrev = $("[data-tani-prev]"), taniSkip = $("[data-tani-skip]"), taniHint = $("[data-tani-hint]");
const openForm = (id) => {
  id = FORMS[id] ? id : "tanima";
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
  if (s.input) body += `<label class="tani-input"><textarea rows="3" maxlength="200" placeholder="Buraya yazın…" data-tani-note>${esc(tani.note)}</textarea><em data-tani-left>${200 - tani.note.length}</em></label>`;
  if (s.done) body += `<div class="tani-sum">${Object.values(tani.picks).flat().map((t) => `<span>${t}</span>`).join("") || "<span>Seçim yapmadınız</span>"}</div>`;
  taniStep.innerHTML = body;
  taniStep.classList.remove("in-l", "in-r"); void taniStep.offsetWidth; if (dir) taniStep.classList.add(dir > 0 ? "in-r" : "in-l");
  taniArt.classList.remove("pop"); void taniArt.offsetWidth; taniArt.classList.add("pop"); taniArt.src = s.art;
  $("[data-tani-count]").textContent = `${tani.i + 1} / ${steps.length}`;
  $$("button", taniDots).forEach((b, i) => { b.classList.toggle("done", i < tani.i); b.classList.toggle("now", i === tani.i); if (i === tani.i) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); b.disabled = i > tani.i; });
  taniPrev.hidden = tani.i === 0 || s.done; taniSkip.hidden = !s.opts && !s.input;
  $("[data-tani-next-label]").textContent = s.next || (tani.i === steps.length - 2 ? "Bitir" : "Devam");
  taniHint.textContent = s.max > 1 ? `${picked.length} / ${s.max} seçildi` : "";
  const note = $("[data-tani-note]"); if (note) note.addEventListener("input", () => { tani.note = note.value; $("[data-tani-left]").textContent = 200 - note.value.length; });
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
  if (steps[tani.i].done) { const link = $(`[data-form-link="${formId}"]`); link.querySelector(".tile-eyebrow").textContent = "Tamamlandı"; link.querySelector(".tile-go").firstChild.textContent = "Cevapları gör"; }
});
taniPrev.addEventListener("click", () => taniGo(tani.i - 1));
taniSkip.addEventListener("click", () => taniGo(tani.i + 1));
taniDots.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b && !b.disabled) taniGo(+b.dataset.go); });

/* ---------- üst arama: Kurum Yönetimi'nde öğrenci/sınıf, başka yerde araç ---------- */
$("[data-search]").addEventListener("input", (e) => {
  const v = norm(e.target.value.trim());
  if (view === "kurum") { ogrQ = clsQ = v; $("[data-ogr-q]").value = $("[data-cls-q]").value = e.target.value; renderCls(); renderOgr(); return; }
  term = v; renderTools(); if (term && view !== "araclar") location.hash = "araclar";
});

/* ---------- kenar menü ---------- */
const app = $(".app"), sideBtn = $("[data-side-toggle]");
const setSide = (collapsed) => { app.classList.toggle("is-collapsed", collapsed); sideBtn.setAttribute("aria-expanded", String(!collapsed)); sideBtn.setAttribute("aria-label", collapsed ? "Menüyü aç" : "Menüyü daralt"); };
try { setSide(localStorage.getItem("aila-side") === "dar"); } catch (e) { /* yok say */ }
sideBtn.addEventListener("click", () => { const cl = !app.classList.contains("is-collapsed"); setSide(cl); try { localStorage.setItem("aila-side", cl ? "dar" : "genis"); } catch (e) { /* yok say */ } });

/* ---------- profil ---------- */
const setText = (sel, v) => $$(sel).forEach((el) => { el.textContent = v; });
const PF_TAGS = ["Yapay zekâ", "Ölçme-değerlendirme", "Öğretmen gelişimi", "Veli iletişimi", "Dijital güvenlik", "Proje okulu", "Yarışmalar", "STEM", "Okuma kültürü", "Rehberlik"];
const pfOn = new Set(["Yapay zekâ", "Öğretmen gelişimi"]);
const tagsHost = $("[data-pf-tags]");
tagsHost.innerHTML = PF_TAGS.map((t) => `<button type="button" class="tag" aria-pressed="${pfOn.has(t)}">${t}</button>`).join("");
$("legend", tagsHost.closest("fieldset")).firstChild.textContent = "Kurum öncelikleri ";
const flashT = new WeakMap();
const flash = (el, msg, bad = false) => { el.textContent = msg; el.classList.toggle("bad", bad); el.classList.add("on"); clearTimeout(flashT.get(el)); flashT.set(el, setTimeout(() => el.classList.remove("on"), 2600)); };
tagsHost.addEventListener("click", (e) => { const b = e.target.closest(".tag"); if (!b) return; const on = b.getAttribute("aria-pressed") !== "true"; if (on && $$(".tag[aria-pressed=true]", tagsHost).length >= 5) { flash($("[data-pf-status]"), "En çok 5 öncelik seçebilirsiniz.", true); return; } b.setAttribute("aria-pressed", String(on)); });
const about = $("[data-pf-about]"), aboutCount = $("[data-pf-count]");
const countAbout = () => { aboutCount.textContent = `${about.value.length}/${about.maxLength}`; };
about.addEventListener("input", countAbout); countAbout();
$("[data-pf-form]").addEventListener("submit", (e) => {
  e.preventDefault(); const ad = $("[data-pf-ad]");
  if (ad.value.trim().split(/\s+/).length < 2) { ad.setAttribute("aria-invalid", "true"); ad.focus(); flash($("[data-pf-status]"), "Ad ve soyadınızı birlikte yazın.", true); return; }
  ad.removeAttribute("aria-invalid"); setText("[data-fullname]", ad.value.trim()); setText("[data-name]", ad.value.trim().split(/\s+/)[0] + " Bey"); setText("[data-avatar]", initials(ad.value)); flash($("[data-pf-status]"), "Kaydedildi");
});
const avBtn = $("[data-av-btn]"), avMenu = $("[data-av-menu]"), avFile = $("[data-av-file]");
const applyAvatar = (src) => $$("[data-avatar]").forEach((el) => { el.classList.toggle("has-img", !!src); el.style.backgroundImage = src ? `url("${src}")` : ""; });
const storeAvatar = (src) => { try { if (src) localStorage.setItem("aila-avatar-yonetici", src); else localStorage.removeItem("aila-avatar-yonetici"); } catch (e) { /* yok say */ } };
try { applyAvatar(localStorage.getItem("aila-avatar-yonetici")); } catch (e) { /* yok say */ }
const avOpen = (open) => { avMenu.hidden = !open; avBtn.setAttribute("aria-expanded", String(open)); };
avBtn.addEventListener("click", (e) => { e.stopPropagation(); avOpen(avMenu.hidden); });
document.addEventListener("click", (e) => { if (!e.target.closest(".pf-avatar-wrap")) avOpen(false); });
avMenu.addEventListener("click", (e) => { const b = e.target.closest("[data-av]"); if (!b) return; if (b.dataset.av === "upload") { avFile.click(); return; } const src = b.dataset.av === "remove" ? null : b.dataset.av; applyAvatar(src); storeAvatar(src); avOpen(false); });
avFile.addEventListener("change", () => {
  const f = avFile.files[0]; if (!f) return; const img = new Image();
  img.onload = () => { const n = 256, side = Math.min(img.width, img.height), cv = document.createElement("canvas"); cv.width = cv.height = n; cv.getContext("2d").drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, n, n); const src = cv.toDataURL("image/jpeg", .86); applyAvatar(src); storeAvatar(src); avOpen(false); URL.revokeObjectURL(img.src); avFile.value = ""; };
  img.src = URL.createObjectURL(f);
});
const dlg = $("[data-pw-dlg]"), pwForm = $("[data-pf-pass-form]"), pwNew = $("[data-pw-new]"), pwMeter = $("[data-pw-meter]"), pwTip = $("[data-pw-tip]");
const TIP = "En az 8 karakter, bir rakam ve bir büyük harf.";
$("[data-pw-open]").addEventListener("click", () => { pwForm.reset(); pwMeter.dataset.level = 0; pwTip.textContent = TIP; dlg.showModal(); $("[data-pw-old]").focus(); });
$("[data-pw-close]").addEventListener("click", () => dlg.close());
dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
$$("[data-pw-eye]").forEach((b) => b.addEventListener("click", () => { const i = b.previousElementSibling, show = i.type === "password"; i.type = show ? "text" : "password"; b.setAttribute("aria-label", show ? "Parolayı gizle" : "Parolayı göster"); }));
const strength = (v) => [v.length >= 8, /\d/.test(v), /[A-ZÇĞİÖŞÜ]/.test(v), v.length >= 12 || /[^\w\s]/.test(v)].filter(Boolean).length;
pwNew.addEventListener("input", () => { const n = pwNew.value ? strength(pwNew.value) : 0; pwMeter.dataset.level = n; pwTip.textContent = !pwNew.value ? TIP : ["Çok zayıf", "Zayıf", "Fena değil", "İyi", "Güçlü"][n]; });
pwForm.addEventListener("submit", (e) => { e.preventDefault(); const stt = $("[data-pw-status]");
  if (!$("[data-pw-old]").value) return flash(stt, "Mevcut parolanızı yazın.", true);
  if (strength(pwNew.value) < 3) return flash(stt, "Yeni parola daha güçlü olmalı.", true);
  if ($("[data-pw-again]").value !== pwNew.value) return flash(stt, "İki parola aynı değil.", true);
  dlg.close(); $("[data-pw-open] .tile-text").textContent = "Parolanız az önce güncellendi"; });
const sizeSeg = $("[data-pf-size]");
const setSize = (k) => { document.documentElement.classList.toggle("text-l", k === "l"); $$("button", sizeSeg).forEach((b) => b.setAttribute("aria-checked", String(b.dataset.size === k))); };
try { setSize(localStorage.getItem("aila-yazi") || "n"); } catch (e) { /* yok say */ }
sizeSeg.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; setSize(b.dataset.size); try { localStorage.setItem("aila-yazi", b.dataset.size); } catch (e2) { /* yok say */ } });

/* ---------- sohbet ---------- */
const MODELS = ["Gemini 2.5 Flash Lite", "Gemini 2.5 Flash", "GPT-4.1 mini", "Claude Haiku"];
const IDEAS = ["Bu ayki kurum raporundan 5 maddelik yönetim özeti çıkar.", "7+ gündür giriş yapmayan öğrencilerin velilerine nazik bir mesaj yaz.", "Öğretmenler toplantısı için AI kullanım gündemi hazırla.", "Okuryazarlık ortalamasını artırmak için 4 haftalık plan öner."];
const DEMO = ["Raporu özetledim: öğrenci aktifliği hedefin altında, AI üretimi ise önceki döneme göre arttı. Öncelik olarak giriş yapmayan öğrencilere odaklanmanızı öneririm. Ayrıntılı tablo ister misiniz?", "Taslak hazır:\n1. Durum özeti\n2. Öne çıkan riskler\n3. Önerilen adımlar\nVeli mesajı olarak da uyarlayabilirim.", "Bunu kademelere göre ayrı ayrı hazırlayabilirim. Hangi kademeyle başlayalım?"];
const ac = $("[data-ai-chat]"), acLog = $("[data-ac-log]"), acHello = $("[data-ac-hello]"), acInput = $("[data-ac-input]"), acSend = $("[data-ac-send]");
const acScroll = $("[data-ac-scroll]"), acList = $("[data-ac-list]"), acFab = $("[data-chat-fab]");
let chats = [], cur = null, model = MODELS[0], demoI = 0;
try { chats = JSON.parse(localStorage.getItem("aila-sohbetler-yonetici") || "[]"); } catch (e) { chats = []; }
const save = () => { try { localStorage.setItem("aila-sohbetler-yonetici", JSON.stringify(chats.slice(0, 50))); } catch (e) { /* yok say */ } };
const dayLabel = (ts) => { const d = new Date(ts), t = new Date(), y = new Date(); y.setDate(t.getDate() - 1); return d.toDateString() === t.toDateString() ? "Bugün" : d.toDateString() === y.toDateString() ? "Dün" : "Daha önce"; };
const renderList = () => {
  $("[data-ac-count]").textContent = `${chats.length} sohbet`;
  if (!chats.length) { acList.innerHTML = `<div class="ac-empty"><span class="ac-empty-ic">${icon("i-spark")}</span><strong>Henüz sohbet yok</strong><span>Yeni bir sohbet başlatarak AI-LA ile konuşmaya başlayın!</span></div>`; return; }
  let html = "", last = ""; chats.forEach((ch) => { const g = dayLabel(ch.ts); if (g !== last) { html += `<p class="ac-group">${g}</p>`; last = g; } html += `<div class="ac-item${cur && ch.id === cur.id ? " on" : ""}"><button type="button" class="ac-open" data-open="${ch.id}">${esc(ch.title)}</button><button type="button" class="ac-del" aria-label="Sohbeti sil" data-del="${ch.id}">${icon("i-trash")}</button></div>`; });
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
acList.addEventListener("click", (e) => { const o = e.target.closest("[data-open]"), d = e.target.closest("[data-del]"); if (o) { cur = chats.find((x) => x.id === o.dataset.open) || null; renderChat(); } if (d) { chats = chats.filter((x) => x.id !== d.dataset.del); if (cur && cur.id === d.dataset.del) cur = null; save(); renderChat(); } });
const renderModels = () => { mList.innerHTML = MODELS.map((m) => `<li role="option" aria-selected="${m === model}" tabindex="0" data-model="${m}">${m}${icon("i-check")}</li>`).join(""); };
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
  e.preventDefault(); const t = acInput.value.trim(); if (!t) return;
  if (!cur) { cur = { id: String(Date.now()), title: t.length > 42 ? t.slice(0, 40) + "…" : t, ts: Date.now(), msgs: [] }; chats.unshift(cur); }
  cur.msgs.push({ r: "me", t }); cur.ts = Date.now(); chats = [cur, ...chats.filter((x) => x !== cur)];
  acInput.value = ""; acGrow(); save(); renderChat();
  const wait = document.createElement("li"); wait.className = "ac-msg ai"; wait.innerHTML = `<img class="ac-av" src="assets/kedi-yuz.png" alt=""><div><span class="ac-who">AI-LA · ${esc(model)}</span><p class="ac-typing"><i></i><i></i><i></i></p></div>`;
  acLog.append(wait); acScroll.scrollTop = acScroll.scrollHeight;
  const chat = cur; setTimeout(() => { chat.msgs.push({ r: "ai", t: DEMO[demoI++ % DEMO.length], m: model }); save(); if (cur === chat) renderChat(); }, 1100);
});
renderList();

renderDash();
addEventListener("hashchange", go);
go();
