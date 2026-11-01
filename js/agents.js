// Ajanlar (yönetici + öğretmen ortak): planla ve kaydet; ajanı sistem bu plana göre çalıştırır, çıktısı sayfaya düşer.
// Kart sade (kimlik, ⓘ, plan hapı, Aktif/Pasif); pencere: zamanlama + girdiler + talimat / çıktılar / ne yapar.
// mountAgents(root, { agents, examples, hues, key, runner }) - agents: { id, art, name, desc, what, reads, makes, sched, on, inputs, run(vals) }
export const GUN = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const FREQ = [["gunluk", "Her gün"], ["haftaici", "Hafta içi"], ["haftalik", "Seçili günler"], ["elle", "Plan yok"]];
const ARROW = '<svg class="icon go" aria-hidden="true"><use href="#i-arrow" /></svg>';
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export function mountAgents(root, { agents: AGENTS, examples = {}, hues, key = "aila-ajanlar", runner = "Sistem" }) {
const $ = (s, r = root) => r.querySelector(s), $$ = (s, r = root) => [...r.querySelectorAll(s)];
// ayarlar ve çıktılar
let agState = {};
try { agState = JSON.parse(localStorage.getItem(key) || "{}"); } catch (e) { agState = {}; }
// since: planlı geçmiş çıktılar yalnız bu andan sonrası için üretilir (takvim değişince geriye dönük çıktı çıkmasın)
const agS = (a) => (agState[a.id] ||= { since: Date.now() - 8 * 864e5, sched: { ...a.sched, days: [...a.sched.days] }, on: a.on, talimat: "", vals: Object.fromEntries(a.inputs.map(([k, , type, def]) => [k, type === "select" ? def[0] : type === "checks" ? [...def] : def])), outs: [] });
const agSave = () => { try { localStorage.setItem(key, JSON.stringify(agState)); } catch (e) { /* yok say */ } };
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
// zamanlanmış çalışmalar: son 8 günün (haftalık ajanın geçen haftaki çıktısı da görünsün) planlı saatleri geçtiyse çıktıları üret (demo; gerçekte sunucu her sabah çalıştırır)
const catchUp = () => AGENTS.forEach((a) => {
  const st = agS(a); if (!st.on || st.sched.f === "elle") return;
  const [h, m] = hhmm(st.sched.t), now = new Date();
  for (let i = 7; i >= 0; i--) { const d = new Date(now); d.setDate(now.getDate() - i); d.setHours(h, m, 0, 0);
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
  $("[data-ag-feed]").innerHTML = feed.map(({ a, o }) => `<li><button type="button" class="agf" data-ag-feed-open="${a.id}"><time>${fmtAt(o.at).replace("Bugün ", "")}</time><span><small>${a.name}</small><strong>${esc(o.title)}</strong></span>${ARROW}</button></li>`).join("") || `<li class="agf-empty">Aktif ajanlar planlı saatlerinde çalıştıkça çıktılar burada görünür.</li>`;
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
      <textarea name="talimat" rows="2" maxlength="300" placeholder="Örneğin: ${(examples[a.id] || [""])[0]}">${esc(st.talimat)}</textarea>
      <div class="ag-ex">${(examples[a.id] || [""]).map((t) => `<button type="button" class="apill" data-ex="${esc(t)}">${t}</button>`).join("")}</div></section>
    <div class="pf-actions"><span class="pf-saved" role="status" data-ag-status></span><button type="submit" class="btn-primary">Kaydet</button></div>`;
  $("[data-ag-outs]").innerHTML = st.outs.map((o, k) => `<li class="ago"><details${k ? "" : " open"}><summary><time>${fmtAt(o.at)}</time><strong>${esc(o.title)}</strong><i class="sch">planlı</i><svg class="icon" aria-hidden="true"><use href="#i-down" /></svg></summary><ul>${o.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></details></li>`).join("") || `<li class="agf-empty">Henüz çıktı yok.</li>`;
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
  $("[data-ag-next]").innerHTML = f === "elle" ? "Plan yok; ajan çalışmaz." : nx ? `Sonraki çalışma: <b>${when(nx)}</b>. ${runner} ajanı bu plana göre çalıştırır, çıktı bu sayfaya düşer.` : "En az bir gün seçin."; };
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
    e.stopPropagation(); const b = e.target.closest("[data-ag-info-btn]").getBoundingClientRect(), host = root.getBoundingClientRect();
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
return { render: renderAg };
}
