// Öğretmen whiteboard'u: whitelabel uygulamasındaki tahtanın araçları (el, seçim, dikdörtgen, elmas, elips, ok, çizgi,
// kalem, metin, görsel, silgi; yakınlaştır/kaydır; temizle, kaydet, yükle, PNG) + yapışkan not, renk/kalınlık/dolgu,
// geri al/ileri al ve tam ekran. Nesneler dünya koordinatında tutulur; görünüm {z, ox, oy} ile çizilir.
export function mountWhiteboard(root) {
  const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
  const stage = $("[data-wb-stage]"), cv = $("[data-wb-canvas]"), ctx = cv.getContext("2d"), editor = $("[data-wb-editor]");
  const COLORS = ["#11142c", "#345de0", "#7b5cf0", "#e0453a", "#1f8a5b", "#d48a0c"];
  const NOTE_BG = ["#fff4c2", "#e3f0ff", "#f3e8ff", "#e6f6ee"];
  let objs = [], sel = null, tool = "kalem", color = COLORS[0], size = 3, fill = false;
  let view = { z: 1, ox: 0, oy: 0 }, dpr = 1, W = 0, H = 0, act = null, space = false, hist = [], fut = [], noteI = 0;
  const imgCache = new Map();

  /* ---------- geçmiş ---------- */
  const snap = () => JSON.stringify(objs);
  const push = () => { hist.push(snap()); if (hist.length > 80) hist.shift(); fut = []; save(); };
  const restore = (s) => { objs = JSON.parse(s); sel = null; draw(); save(); };
  const undo = () => { if (!hist.length) return; fut.push(snap()); restore(hist.pop()); };
  const redo = () => { if (!fut.length) return; hist.push(snap()); restore(fut.pop()); };
  const save = () => { try { localStorage.setItem("aila-wb", snap()); } catch (e) { /* depolama kapalı */ } };

  /* ---------- görünüm ---------- */
  const resize = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    const r = stage.getBoundingClientRect(); W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); draw();
  };
  const toWorld = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left - view.ox) / view.z, (e.clientY - r.top - view.oy) / view.z]; };
  const setZoom = (z, cx = W / 2, cy = H / 2) => {
    z = Math.min(4, Math.max(0.25, z));
    view.ox = cx - (cx - view.ox) * z / view.z; view.oy = cy - (cy - view.oy) * z / view.z; view.z = z;
    $("[data-wb-zoom]").textContent = `${Math.round(z * 100)}%`; draw();
  };
  const bbox = (o) => {
    if (o.pts) { const xs = o.pts.map((p) => p[0]), ys = o.pts.map((p) => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; }
    return [Math.min(o.x, o.x + o.w), Math.min(o.y, o.y + o.h), Math.max(o.x, o.x + o.w), Math.max(o.y, o.y + o.h)];
  };
  const fit = () => {
    if (!objs.length) { view = { z: 1, ox: 0, oy: 0 }; setZoom(1); return; }
    const b = objs.map(bbox).reduce((a, c) => [Math.min(a[0], c[0]), Math.min(a[1], c[1]), Math.max(a[2], c[2]), Math.max(a[3], c[3])]);
    const z = Math.min(2, Math.min((W - 120) / Math.max(1, b[2] - b[0]), (H - 180) / Math.max(1, b[3] - b[1])));
    view.z = Math.max(0.25, z); view.ox = W / 2 - (b[0] + b[2]) / 2 * view.z; view.oy = H / 2 - (b[1] + b[3]) / 2 * view.z;
    setZoom(view.z);
  };

  /* ---------- çizim ---------- */
  const wrap = (c, text, maxW) => text.split("\n").flatMap((para) => {
    const words = para.split(" "), lines = []; let line = "";
    words.forEach((w) => { const t = line ? line + " " + w : w; if (c.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
    lines.push(line); return lines;
  });
  const paint = (c, o) => {
    c.save(); c.lineCap = c.lineJoin = "round"; c.strokeStyle = o.stroke; c.lineWidth = o.size; c.fillStyle = o.fill || "transparent";
    const { x, y, w, h } = o;
    if (o.type === "rect") { c.beginPath(); c.roundRect(x, y, w, h, 8); if (o.fill) c.fill(); c.stroke(); }
    else if (o.type === "diamond") { c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w, y + h / 2); c.lineTo(x + w / 2, y + h); c.lineTo(x, y + h / 2); c.closePath(); if (o.fill) c.fill(); c.stroke(); }
    else if (o.type === "ellipse") { c.beginPath(); c.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2); if (o.fill) c.fill(); c.stroke(); }
    else if (o.type === "line" || o.type === "arrow") {
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y + h); c.stroke();
      if (o.type === "arrow") { const a = Math.atan2(h, w), L = 10 + o.size * 2.5; c.beginPath(); c.moveTo(x + w, y + h); c.lineTo(x + w - L * Math.cos(a - .45), y + h - L * Math.sin(a - .45)); c.moveTo(x + w, y + h); c.lineTo(x + w - L * Math.cos(a + .45), y + h - L * Math.sin(a + .45)); c.stroke(); }
    } else if (o.type === "pen") { c.beginPath(); o.pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); if (o.pts.length === 1) c.lineTo(o.pts[0][0] + .1, o.pts[0][1]); c.stroke(); }
    else if (o.type === "text") { c.fillStyle = o.stroke; c.font = `500 ${o.fs}px Inter, sans-serif`; c.textBaseline = "top"; o.text.split("\n").forEach((l, i) => c.fillText(l, x, y + i * o.fs * 1.3)); }
    else if (o.type === "note") {
      c.shadowColor = "rgba(40,50,120,.25)"; c.shadowBlur = 16; c.shadowOffsetY = 6; c.fillStyle = o.bg; c.beginPath(); c.roundRect(x, y, w, h, 10); c.fill(); c.shadowColor = "transparent";
      c.fillStyle = "#11142c"; c.font = "500 16px Inter, sans-serif"; c.textBaseline = "top"; wrap(c, o.text, w - 28).forEach((l, i) => c.fillText(l, x + 14, y + 14 + i * 21));
    } else if (o.type === "image") { const im = imgCache.get(o.src); if (im && im.complete) c.drawImage(im, x, y, w, h); }
    c.restore();
  };
  const measureText = (o) => { ctx.font = `500 ${o.fs}px Inter, sans-serif`; const ls = o.text.split("\n"); o.w = Math.max(20, ...ls.map((l) => ctx.measureText(l).width)); o.h = ls.length * o.fs * 1.3; };
  const draw = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.setTransform(dpr * view.z, 0, 0, dpr * view.z, dpr * view.ox, dpr * view.oy);
    objs.forEach((o) => { if (!(editing && editing.o === o)) paint(ctx, o); });
    if (act && act.preview) paint(ctx, act.preview);
    if (sel) {
      const [a, b, cx, d] = bbox(sel), p = 6 / view.z;
      ctx.strokeStyle = "#345de0"; ctx.lineWidth = 1.5 / view.z; ctx.setLineDash([5 / view.z, 4 / view.z]); ctx.strokeRect(a - p, b - p, cx - a + 2 * p, d - b + 2 * p); ctx.setLineDash([]);
      if (resizable(sel)) { ctx.fillStyle = "#fff"; const s = 9 / view.z; ctx.fillRect(cx + p - s / 2, d + p - s / 2, s, s); ctx.strokeRect(cx + p - s / 2, d + p - s / 2, s, s); }
    }
  };
  const resizable = (o) => !o.pts && o.type !== "text";

  /* ---------- isabet ---------- */
  const distSeg = (px, py, x1, y1, x2, y2) => { const dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l)); return Math.hypot(px - x1 - t * dx, py - y1 - t * dy); };
  const hit = (o, x, y) => {
    const tol = 8 / view.z + (o.size || 0);
    if (o.type === "pen") return o.pts.some((p, i) => i && distSeg(x, y, ...o.pts[i - 1], ...p) < tol) || (o.pts.length === 1 && Math.hypot(x - o.pts[0][0], y - o.pts[0][1]) < tol);
    if (o.type === "line" || o.type === "arrow") return distSeg(x, y, o.x, o.y, o.x + o.w, o.y + o.h) < tol;
    const [a, b, c, d] = bbox(o); return x >= a - 4 && x <= c + 4 && y >= b - 4 && y <= d + 4;
  };
  const top = (x, y) => [...objs].reverse().find((o) => hit(o, x, y));
  const onHandle = (x, y) => { if (!sel || !resizable(sel)) return false; const [, , c, d] = bbox(sel), p = 6 / view.z; return Math.hypot(x - c - p, y - d - p) < 10 / view.z; };

  /* ---------- metin ve not düzenleme ---------- */
  let editing = null;
  const openEditor = (o, isNew) => {
    editing = { o, isNew }; draw();
    const r = (o.type === "note") ? { x: o.x + 14, y: o.y + 14, w: o.w - 28, fs: 16 } : { x: o.x, y: o.y, w: Math.max(200, o.w + 40), fs: o.fs };
    Object.assign(editor.style, { display: "block", left: `${view.ox + r.x * view.z}px`, top: `${view.oy + r.y * view.z}px`, width: `${r.w * view.z}px`,
      fontSize: `${r.fs * view.z}px`, color: o.type === "note" ? "#11142c" : o.stroke, background: o.type === "note" ? "transparent" : "rgba(255,255,255,.9)" });
    editor.value = o.text; editor.focus(); editor.select();
  };
  const closeEditor = () => {
    if (!editing) return;
    const { o, isNew } = editing; editing = null; editor.style.display = "none";
    const v = editor.value.replace(/\s+$/, "");
    if (!v && o.type === "text") { objs = objs.filter((x) => x !== o); if (!isNew) push(); draw(); return; }
    if (v !== o.text || isNew) { if (!isNew) hist.push(snap()); o.text = v; if (o.type === "text") measureText(o); if (isNew) push(); else save(); }
    draw();
  };
  editor.addEventListener("blur", closeEditor);
  editor.addEventListener("keydown", (e) => { if (e.key === "Escape" || (e.key === "Enter" && (e.ctrlKey || e.metaKey))) { e.preventDefault(); editor.blur(); } e.stopPropagation(); });

  /* ---------- işaretçi ---------- */
  const shapeTools = ["dikdortgen", "elmas", "elips", "ok", "cizgi"];
  const TYPE = { dikdortgen: "rect", elmas: "diamond", elips: "ellipse", ok: "arrow", cizgi: "line" };
  cv.addEventListener("pointerdown", (e) => {
    if (editing) { editor.blur(); return; }
    cv.setPointerCapture(e.pointerId);
    const [x, y] = toWorld(e);
    if (tool === "el" || space || e.button === 1) { act = { mode: "pan", sx: e.clientX, sy: e.clientY, ox: view.ox, oy: view.oy }; stage.classList.add("panning"); return; }
    if (tool === "secim") {
      if (onHandle(x, y)) { hist.push(snap()); act = { mode: "resize", o: sel }; return; }
      sel = top(x, y) || null; draw();
      if (sel) { hist.push(snap()); act = { mode: "move", lx: x, ly: y, moved: false }; }
      return;
    }
    if (tool === "silgi") { act = { mode: "erase", hit: false }; const o = top(x, y); if (o) { push(); objs = objs.filter((k) => k !== o); act.hit = true; draw(); } return; }
    // metin ve not: yazı kutusu tıklama bittikten sonra açılır; yoksa tuval odağı alır, kutu kapanır ve harfler kısayol sanılır
    if (tool === "metin" || tool === "not") {
      e.preventDefault(); cv.releasePointerCapture(e.pointerId);
      const o = tool === "metin" ? { type: "text", x, y, fs: 14 + size * 3, stroke: color, text: "", w: 0, h: 0 } : { type: "note", x: x - 90, y: y - 50, w: 190, h: 120, bg: NOTE_BG[noteI++ % 4], text: "" };
      objs.push(o); setTool("secim"); sel = o; setTimeout(() => openEditor(o, true), 0); return;
    }
    if (tool === "kalem") { act = { mode: "draw", preview: { type: "pen", pts: [[x, y]], stroke: color, size } }; return; }
    if (shapeTools.includes(tool)) { act = { mode: "shape", sx: x, sy: y, preview: { type: TYPE[tool], x, y, w: 0, h: 0, stroke: color, size, fill: fill ? color + "22" : null } }; }
  });
  cv.addEventListener("pointermove", (e) => {
    const [x, y] = toWorld(e);
    if (!act) { cv.style.cursor = tool === "secim" ? (onHandle(x, y) ? "nwse-resize" : top(x, y) ? "move" : "default") : ""; return; }
    if (act.mode === "pan") { view.ox = act.ox + e.clientX - act.sx; view.oy = act.oy + e.clientY - act.sy; draw(); }
    else if (act.mode === "move") { const dx = x - act.lx, dy = y - act.ly; act.lx = x; act.ly = y; act.moved = true; if (sel.pts) sel.pts = sel.pts.map(([px, py]) => [px + dx, py + dy]); else { sel.x += dx; sel.y += dy; } draw(); }
    else if (act.mode === "resize") { const o = act.o; let w = x - o.x, h = y - o.y; if (e.shiftKey) { const s = Math.max(Math.abs(w), Math.abs(h)); w = Math.sign(w || 1) * s; h = Math.sign(h || 1) * s; } o.w = Math.max(20, w); o.h = Math.max(20, h); draw(); }
    else if (act.mode === "erase") { const o = top(x, y); if (o) { if (!act.hit) { push(); act.hit = true; } objs = objs.filter((k) => k !== o); draw(); } }
    else if (act.mode === "draw") { act.preview.pts.push([x, y]); draw(); }
    else if (act.mode === "shape") { let w = x - act.sx, h = y - act.sy; if (e.shiftKey && act.preview.type !== "line" && act.preview.type !== "arrow") { const s = Math.max(Math.abs(w), Math.abs(h)); w = Math.sign(w || 1) * s; h = Math.sign(h || 1) * s; } Object.assign(act.preview, { w, h }); draw(); }
  });
  const end = () => {
    if (!act) return;
    const a = act; act = null; stage.classList.remove("panning");
    if (a.mode === "move" && !a.moved) hist.pop();
    if (a.mode === "move" || a.mode === "resize") save();
    if (a.mode === "draw") { hist.push(snap()); objs.push(a.preview); fut = []; save(); }
    if (a.mode === "shape") { const p = a.preview; if (Math.hypot(p.w, p.h) > 4) { hist.push(snap()); if (!["line", "arrow"].includes(p.type)) { if (p.w < 0) { p.x += p.w; p.w = -p.w; } if (p.h < 0) { p.y += p.h; p.h = -p.h; } } objs.push(p); fut = []; save(); sel = p; } }
    draw();
  };
  cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
  cv.addEventListener("dblclick", (e) => { const [x, y] = toWorld(e), o = top(x, y); if (o && (o.type === "text" || o.type === "note")) { sel = o; openEditor(o, false); } });
  cv.addEventListener("wheel", (e) => { e.preventDefault(); const r = cv.getBoundingClientRect(); if (e.ctrlKey || e.metaKey || !e.shiftKey) setZoom(view.z * (e.deltaY < 0 ? 1.1 : 1 / 1.1), e.clientX - r.left, e.clientY - r.top); }, { passive: false });

  /* ---------- klavye ---------- */
  const KEYS = { h: "el", v: "secim", r: "dikdortgen", d: "elmas", o: "elips", a: "ok", l: "cizgi", p: "kalem", t: "metin", n: "not", e: "silgi" };
  let clip = null;
  const onKey = (e) => {
    if (root.hidden || editing || e.target.closest("input, textarea, select, [contenteditable]")) return;
    const k = e.key.toLowerCase();
    if (e.code === "Space") { space = true; stage.classList.add("can-pan"); e.preventDefault(); return; }
    if ((e.ctrlKey || e.metaKey) && k === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if ((e.ctrlKey || e.metaKey) && k === "y") { e.preventDefault(); redo(); return; }
    if ((e.ctrlKey || e.metaKey) && k === "c" && sel) { clip = JSON.stringify(sel); return; }
    if ((e.ctrlKey || e.metaKey) && (k === "v" || k === "d") && (clip || sel)) { e.preventDefault(); const o = JSON.parse(k === "d" ? JSON.stringify(sel) : clip); if (o.pts) o.pts = o.pts.map(([x, y]) => [x + 20, y + 20]); else { o.x += 20; o.y += 20; } push(); objs.push(o); sel = o; draw(); return; }
    if ((k === "delete" || k === "backspace") && sel) { push(); objs = objs.filter((o) => o !== sel); sel = null; draw(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (k === "i") { $("[data-wb-img]").click(); return; }
    if (k === "f") { toggleFull(); return; }
    if (KEYS[k]) setTool(KEYS[k]);
  };
  addEventListener("keydown", onKey);
  addEventListener("keyup", (e) => { if (e.code === "Space") { space = false; stage.classList.remove("can-pan"); } });

  /* ---------- araç çubuğu ---------- */
  const setTool = (t) => { tool = t; $$("[data-tool]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tool === t))); stage.dataset.tool = t; if (t !== "secim") { sel = null; draw(); } };
  $$("[data-tool]").forEach((b) => b.addEventListener("click", () => (b.dataset.tool === "gorsel" ? $("[data-wb-img]").click() : setTool(b.dataset.tool))));
  $("[data-wb-colors]").innerHTML = COLORS.map((c, i) => `<button type="button" class="wb-c" aria-pressed="${!i}" aria-label="Renk ${i + 1}" style="--c:${c}" data-c="${c}"></button>`).join("");
  $("[data-wb-colors]").addEventListener("click", (e) => { const b = e.target.closest("[data-c]"); if (!b) return; color = b.dataset.c; $$(".wb-c").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); if (sel && sel.stroke) { push(); sel.stroke = color; if (sel.fill) sel.fill = color + "22"; draw(); } });
  $("[data-wb-sizes]").innerHTML = [2, 4, 8].map((s) => `<button type="button" class="wb-s" aria-pressed="${s === 4}" aria-label="Kalınlık ${s}" data-s="${s}"><i style="--d:${s + 3}px"></i></button>`).join(""); size = 4;
  $("[data-wb-sizes]").addEventListener("click", (e) => { const b = e.target.closest("[data-s]"); if (!b) return; size = +b.dataset.s; $$(".wb-s").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); if (sel && sel.size) { push(); sel.size = size; draw(); } });
  $("[data-wb-fill]").addEventListener("click", (e) => { fill = !fill; e.currentTarget.setAttribute("aria-pressed", String(fill)); if (sel && "fill" in sel) { push(); sel.fill = fill ? sel.stroke + "22" : null; draw(); } });
  $("[data-wb-undo]").addEventListener("click", undo);
  $("[data-wb-redo]").addEventListener("click", redo);
  $("[data-wb-zin]").addEventListener("click", () => setZoom(view.z * 1.2));
  $("[data-wb-zout]").addEventListener("click", () => setZoom(view.z / 1.2));
  $("[data-wb-zoom]").addEventListener("click", () => { view = { z: 1, ox: 0, oy: 0 }; setZoom(1); });
  $("[data-wb-fit]").addEventListener("click", fit);
  $("[data-wb-clear]").addEventListener("click", () => { if (!objs.length) return; push(); objs = []; sel = null; draw(); });
  // görsel ekle: dosya seç, Ctrl+V ile ekran görüntüsü yapıştır ya da dosyayı tahtaya sürükle-bırak
  const addImage = (f, cx = W / 2, cy = H / 2) => {
    if (!f || !f.type.startsWith("image/")) return; const rd = new FileReader();
    rd.onload = () => { const im = new Image(); im.onload = () => {
      const s = Math.min(1, 520 / Math.max(im.width, im.height)), w = im.width * s, h = im.height * s;
      imgCache.set(rd.result, im); push(); const o = { type: "image", src: rd.result, x: (cx - view.ox) / view.z - w / 2, y: (cy - view.oy) / view.z - h / 2, w, h }; objs.push(o); setTool("secim"); sel = o; draw(); save();
    }; im.src = rd.result; };
    rd.readAsDataURL(f);
  };
  $("[data-wb-img]").addEventListener("change", (e) => { addImage(e.target.files[0]); e.target.value = ""; });
  addEventListener("paste", (e) => {
    if (root.hidden || editing || e.target.closest("input, textarea")) return;
    const it = [...(e.clipboardData?.items || [])].find((x) => x.type.startsWith("image/"));
    if (it) { e.preventDefault(); addImage(it.getAsFile()); }
  });
  stage.addEventListener("dragover", (e) => { if ([...e.dataTransfer.items].some((x) => x.kind === "file")) { e.preventDefault(); stage.classList.add("drop"); } });
  stage.addEventListener("dragleave", (e) => { if (!stage.contains(e.relatedTarget)) stage.classList.remove("drop"); });
  stage.addEventListener("drop", (e) => {
    e.preventDefault(); stage.classList.remove("drop"); const r = cv.getBoundingClientRect();
    const f = [...e.dataTransfer.files]; const json = f.find((x) => x.name.endsWith(".json"));
    if (json) { loadFile(json); return; }
    f.filter((x) => x.type.startsWith("image/")).forEach((x, i) => addImage(x, e.clientX - r.left + i * 24, e.clientY - r.top + i * 24));
  });
  const loadImages = () => objs.filter((o) => o.type === "image" && !imgCache.has(o.src)).forEach((o) => { const im = new Image(); im.onload = draw; im.src = o.src; imgCache.set(o.src, im); });
  // kaydet / yükle (dosya) ve PNG
  const nameOf = () => (root.querySelector("[data-wb-name]")?.value.trim() || "tahta");
  const download = (href, name) => { const a = document.createElement("a"); a.href = href; a.download = name; a.click(); };
  $("[data-wb-save]").addEventListener("click", () => { const url = URL.createObjectURL(new Blob([JSON.stringify({ ad: nameOf(), objs })], { type: "application/json" })); download(url, `${nameOf()}.aila-tahta.json`); setTimeout(() => URL.revokeObjectURL(url), 1000); });
  $("[data-wb-load]").addEventListener("click", () => $("[data-wb-file]").click());
  const loadFile = (f) => f.text().then((t) => { try { const d = JSON.parse(t); push(); objs = d.objs || []; if (d.ad && root.querySelector("[data-wb-name]")) root.querySelector("[data-wb-name]").value = d.ad; loadImages(); sel = null; fit(); save(); } catch (err) { alert("Bu dosya bir tahta dosyası değil."); } });
  $("[data-wb-file]").addEventListener("change", (e) => { const f = e.target.files[0]; if (f) loadFile(f); e.target.value = ""; });
  $("[data-wb-png]").addEventListener("click", () => {
    const pad = 40, b = objs.length ? objs.map(bbox).reduce((a, c) => [Math.min(a[0], c[0]), Math.min(a[1], c[1]), Math.max(a[2], c[2]), Math.max(a[3], c[3])]) : [0, 0, W, H];
    const out = document.createElement("canvas"), s = 2; out.width = (b[2] - b[0] + pad * 2) * s; out.height = (b[3] - b[1] + pad * 2) * s;
    const o = out.getContext("2d"); o.fillStyle = "#fff"; o.fillRect(0, 0, out.width, out.height); o.setTransform(s, 0, 0, s, (pad - b[0]) * s, (pad - b[1]) * s);
    objs.forEach((x) => paint(o, x)); download(out.toDataURL("image/png"), `${nameOf()}.png`);
  });
  // tam ekran / küçült: tarayıcının Fullscreen API'si kullanılmaz; dosya seçme penceresi ya da ekran görüntüsü aracı
  // pencere odağını alınca tarayıcı tam ekrandan çıkarıyordu. Sayfayı kaplayan sınıf yalnız Küçült ya da Esc ile kapanır.
  const fullBtn = $("[data-wb-full]");
  const isFull = () => root.classList.contains("wb-max");
  const syncFull = () => { const f = isFull(); fullBtn.setAttribute("aria-pressed", String(f)); fullBtn.setAttribute("aria-label", f ? "Küçült" : "Tam ekran"); fullBtn.title = f ? "Küçült (F)" : "Tam ekran (F)"; fullBtn.querySelector("span").textContent = f ? "Küçült" : "Tam ekran"; document.body.classList.toggle("wb-on", f); setTimeout(resize, 60); };
  const toggleFull = () => { root.classList.toggle("wb-max"); syncFull(); };
  fullBtn.addEventListener("click", toggleFull);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && root.classList.contains("wb-max") && !editing) { root.classList.remove("wb-max"); syncFull(); } });
  addEventListener("resize", () => { if (!root.hidden) resize(); });

  // açılış: kayıtlı tahta yoksa küçük bir örnek
  try { const s = localStorage.getItem("aila-wb"); if (s) objs = JSON.parse(s); } catch (e) { objs = []; }
  if (!objs.length) objs = [
    { type: "note", x: 120, y: 80, w: 190, h: 110, bg: NOTE_BG[0], text: "½ + ¼ = ?" },
    { type: "note", x: 360, y: 150, w: 210, h: 110, bg: NOTE_BG[1], text: "Örnek: pizza dilimleri" },
    { type: "ellipse", x: 640, y: 90, w: 150, h: 150, stroke: "#d48a0c", size: 4, fill: null },
    { type: "arrow", x: 580, y: 205, w: 60, h: -30, stroke: "#345de0", size: 4 },
  ];
  noteI = 2; loadImages();
  return { open() { requestAnimationFrame(resize); }, close() { if (isFull()) toggleFull(); } };
}
