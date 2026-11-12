// Chrome for the island pages: the family mark, the family menu and the footer.
// Pages opt in with [data-isl-chrome] and [data-isl-footer]; everything works without it.
(() => {
  "use strict";
  document.documentElement.classList.add("js");

  const family = [
    ["Nicholas", "/nicholas/", "builds things"],
    ["Andreas", "/andreas/", "runs, and runs D&D"],
    ["Lukas", "/lukas/", "loves anything fast"],
    ["Oksana", "/oksana/", "keeps the notebook"],
    ["Kiriakos", "/kiriakos/", "makes the pizza"],
    ["Foxy", "/foxy/", "excellent ears"]
  ];
  const here = window.location.pathname.replace(/index\.html$/, "");
  // The family mark: the lighthouse on the home island, the one that lights up the chart at night.
  const LIGHT = '<svg class="isl-light" viewBox="0 0 32 32" aria-hidden="true"><path class="isl-light__beam" d="M16 10.5 L31 7 L31 14 Z M16 10.5 L1 7 L1 14 Z"/><path d="M12.7 7.8 H19.3 L16 4 Z" fill="currentColor"/><rect class="isl-light__lamp" x="13.2" y="7.8" width="5.6" height="5.2" rx="1.1"/><path d="M12.8 13 H19.2 L20.5 27 H11.5 Z" fill="currentColor"/><path class="isl-light__band" d="M12.3 18 H19.7 L20 21.5 H12 Z"/><path d="M6.5 28.6 C11 26.8 21 26.8 25.5 28.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  const current = (path) => (here === path ? ' aria-current="page"' : "");

  const chrome = document.querySelector("[data-isl-chrome]");
  if (chrome) {
    const rows = family.map(([name, path, note]) => `<li><a href="${path}"${current(path)}><span>${name}</span><small>${note}</small></a></li>`).join("");
    chrome.innerHTML = `
      <a class="isl-mark" href="/"${here === "/" ? ' aria-current="page"' : ""}>${LIGHT}<span>christoforakis.com</span></a>
      <div class="isl-family">
        <button class="isl-family__button" type="button" aria-expanded="false" aria-controls="isl-family-menu">Family<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 6 4.5 4.5L12.5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <nav class="isl-family__menu" id="isl-family-menu" aria-label="Family" hidden>
          <ul>${rows}</ul>
          <hr>
          <ul><li><a href="/updates/"${current("/updates/")}><span>Updates on Lukas</span></a></li><li><a href="/aloft/"${current("/aloft/")}><span>Aloft</span><small>the flying game</small></a></li></ul>
          <a class="isl-reach" href="/contact/"${current("/contact/")}>Reach out<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8h10M8.5 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
        </nav>
      </div>`;
    const button = chrome.querySelector(".isl-family__button");
    const menu = chrome.querySelector(".isl-family__menu");
    const setOpen = (open, focus) => {
      button.setAttribute("aria-expanded", String(open));
      menu.hidden = !open;
      if (open) menu.querySelector("a").focus({ preventScroll: true });
      else if (focus) button.focus({ preventScroll: true });
    };
    button.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") !== "true"));
    document.addEventListener("click", (event) => { if (!menu.hidden && !chrome.querySelector(".isl-family").contains(event.target)) setOpen(false); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !menu.hidden) setOpen(false, true); });
  }

  if (chrome) {
    const onScroll = () => chrome.classList.toggle("is-scrolled", window.scrollY > 40);
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  const footer = document.querySelector("[data-isl-footer]");
  if (footer) {
    footer.classList.add("isl-footer");
    footer.innerHTML = `
      <span>Made by <a href="/nicholas/">Nicholas Christoforakis</a>, ${new Date().getFullYear()}</span>
      <nav aria-label="Footer"><a href="/">Home</a><a href="/updates/">Updates</a><a href="/oksana/#notebook">Notebook</a><a href="/contact/">Reach out</a><a href="/admin.html" rel="nofollow">Write</a></nav>`;
  }
})();
