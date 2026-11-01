// Satır sonundaki ⋯ menüsü: ana eylem satırda kalır, diğerleri burada. Tek menü öğesi sayfaya eklenir, tıklanan düğmenin altına açılır.
// items: [[etiket, ikon id, işlev, "danger"?], ...]
let menu = null, owner = null;
const close = () => { if (!menu) return; menu.hidden = true; owner?.setAttribute("aria-expanded", "false"); owner = null; };
export function openRowMenu(btn, items) {
  if (owner === btn) { close(); return; }
  if (!menu) {
    menu = document.createElement("div"); menu.className = "row-menu"; menu.setAttribute("role", "menu"); document.body.append(menu);
    document.addEventListener("click", (e) => { if (menu && !menu.hidden && !e.target.closest(".row-menu, .more-btn")) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    addEventListener("scroll", close, true); addEventListener("resize", close);
  }
  close();
  menu.innerHTML = items.map(([t, ic, , d], i) => `<button type="button" role="menuitem" class="${d ? "danger" : ""}" data-i="${i}"><svg class="icon" aria-hidden="true"><use href="#${ic}" /></svg>${t}</button>`).join("");
  menu.onclick = (e) => { const b = e.target.closest("[data-i]"); if (!b) return; const fn = items[+b.dataset.i][2]; close(); fn(); };
  menu.hidden = false; owner = btn; btn.setAttribute("aria-expanded", "true");
  const r = btn.getBoundingClientRect(), mw = menu.offsetWidth, mh = menu.offsetHeight;
  const top = r.bottom + 6 + mh > innerHeight ? r.top - mh - 6 : r.bottom + 6;
  menu.style.top = `${top}px`; menu.style.left = `${Math.max(8, r.right - mw)}px`;
  menu.querySelector("button")?.focus();
}
export const MORE = (label) => `<button type="button" class="more-btn" aria-haspopup="menu" aria-expanded="false" aria-label="${label}" title="Diğer işlemler" data-more><svg class="icon" aria-hidden="true"><use href="#i-more" /></svg></button>`;
