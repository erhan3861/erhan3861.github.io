// Fareyi gözleriyle takip eden mor kedi (aila_hero sitesinden: assets/kedi/ sheet.webp + sprite.json).
// Her karenin bakış yönü sprite.json'da ölçülü; işaretçiye en yakın bakan kareye yumuşakça kayar.
// Yalnız görünürken çizer (sohbetin karşılama ekranı).
export function mountCat(host, dir = "assets/kedi") {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  host.append(canvas);
  const ctx = canvas.getContext("2d");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  let S, base, sheet, tile, tctx, rest, idle, pos = 0, target = 0, lastT = 0, pointer = null, raf = 0, size = 0, dpr = 1;

  const ready = Promise.all([fetch(`${dir}/sprite.json`).then((r) => r.json()), load(`${dir}/base.jpg`), load(`${dir}/sheet.webp`)]).then(([s, b, sh]) => {
    S = s; base = b; sheet = sh;
    tile = document.createElement("canvas"); tile.width = S.cropW; tile.height = S.cropH; tctx = tile.getContext("2d");
    rest = S.gaze.map((g, f) => !S.gaze.slice(Math.max(0, f - 3), f + 4).some((x) => x[2]));   // göz kırpmayan kareler
    idle = []; S.gaze.forEach((g, f) => { if (rest[f] && Math.hypot(g[0], g[1]) < 0.15) idle.push(f); });
    if (!idle.length) idle = [0];
    pos = target = idle[0];
  });

  // sahne: kedinin kırpım kutusu (cropW x cropH) tuvale sığar; dışı yuvarlak olarak sohbet zeminine erir
  const resize = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    size = host.clientWidth;
    canvas.width = canvas.height = Math.round(size * dpr);
  };
  // kulak uçları dahil kedinin tamamı yuvarlağın içinde kalsın (1.05 ve aşağı kaydırma kulakları kesiyordu)
  const box = () => { const s = size / Math.max(S.cropW, S.cropH) * .86; return { s, ox: (size - S.cropW * s) / 2, oy: (size - S.cropH * s) / 2 }; };

  const draw = () => {
    const { s, ox, oy } = box();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, size, size);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(base, S.cropX, S.cropY, S.cropW, S.cropH, ox, oy, S.cropW * s, S.cropH * s);
    const p = pos / S.stride, a = Math.floor(p), b = Math.min(S.frames - 1, a + 1), t = p - a;
    tctx.clearRect(0, 0, S.cropW, S.cropH);
    const put = (i, al) => { tctx.globalAlpha = al; tctx.drawImage(sheet, (i % S.cols) * S.frameW, Math.floor(i / S.cols) * S.frameH, S.frameW, S.frameH, 0, 0, S.cropW, S.cropH); };
    put(a, 1); if (t > .01 && b !== a) put(b, t); tctx.globalAlpha = 1;
    ctx.drawImage(tile, ox, oy, S.cropW * s, S.cropH * s);
    // yuvarlak yumuşak kenar: zemin rengi sohbetin açık lavantasına karışır
    ctx.globalCompositeOperation = "destination-in";
    const g = ctx.createRadialGradient(size / 2, size / 2, size * .4, size / 2, size / 2, size / 2);   // geçiş kenarda: kedi soluklaşmasın
    g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  };

  const pick = () => {
    if (!pointer) { target = idle.reduce((best, f) => Math.abs(f - pos) < Math.abs(best - pos) ? f : best, idle[0]); return; }
    const r = canvas.getBoundingClientRect(), { s, ox, oy } = box();
    const fx = r.left + ox + (S.face[0] - S.cropX) * s, fy = r.top + oy + (S.face[1] - S.cropY) * s;
    let vx = (pointer.x - fx) / (Math.min(innerWidth, innerHeight * 1.6) * .32);
    let vy = (pointer.y - fy) / (innerHeight * .36);
    const len = Math.hypot(vx, vy); if (len > 1) { vx /= len; vy /= len; }
    let best = target, cost = Infinity;
    for (let f = 0; f < S.clipFrames; f++) {
      if (!rest[f]) continue;
      const dx = S.gaze[f][0] - vx, dy = S.gaze[f][1] - vy, c = dx * dx + dy * dy + .12 * Math.abs(f - pos) / S.clipFrames;
      if (c < cost) { cost = c; best = f; }
    }
    target = best;
  };

  const tick = (now) => {
    const dt = Math.min(.05, (now - (lastT || now)) / 1000); lastT = now;
    pick();
    const diff = target - pos;
    let step = reduced ? diff : diff * (1 - Math.exp(-dt * 7));
    if (!reduced) step = Math.max(-150 * dt, Math.min(150 * dt, step));
    pos = Math.abs(diff) < .02 ? target : pos + step;
    draw();
    raf = requestAnimationFrame(tick);
  };

  const onMove = (e) => { pointer = { x: e.clientX, y: e.clientY }; };
  const onLeave = () => { pointer = null; };
  addEventListener("pointermove", onMove);
  document.documentElement.addEventListener("pointerleave", onLeave);
  addEventListener("blur", onLeave);
  addEventListener("resize", () => { if (raf) resize(); });

  return {
    start() { ready.then(() => { if (raf) return; resize(); lastT = 0; raf = requestAnimationFrame(tick); }).catch(() => host.classList.add("cat-fail")); },
    stop() { cancelAnimationFrame(raf); raf = 0; },
  };
}
