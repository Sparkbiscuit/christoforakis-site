// Chrome for the island pages: the family mark, the family menu and the footer.
// Pages opt in with [data-isl-chrome] and [data-isl-footer]; everything works without it.
(() => {
  "use strict";
  document.documentElement.classList.add("js");

  const family = [
    ["Nicholas", "/nicholas/", "builds things"],
    ["Andreas", "/andreas/", "runs, and runs the table"],
    ["Lukas", "/lukas/", "loves anything fast"],
    ["Oksana", "/oksana/", "keeps the notebook"],
    ["Kiriakos", "/kiriakos/", "makes the pizza"],
    ["Foxy", "/foxy/", "excellent ears"]
  ];
  const here = window.location.pathname.replace(/index\.html$/, "");
  const current = (path) => (here === path ? ' aria-current="page"' : "");

  const chrome = document.querySelector("[data-isl-chrome]");
  if (chrome) {
    const rows = family.map(([name, path, note]) => `<li><a href="${path}"${current(path)}><span>${name}</span><small>${note}</small></a></li>`).join("");
    chrome.innerHTML = `
      <a class="isl-mark" href="/"${here === "/" ? ' aria-current="page"' : ""}><span class="isl-blob" aria-hidden="true"></span><span>christoforakis.com</span></a>
      <div class="isl-family">
        <button class="isl-family__button" type="button" aria-expanded="false" aria-controls="isl-family-menu">Family<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 6 4.5 4.5L12.5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <nav class="isl-family__menu" id="isl-family-menu" aria-label="Family" hidden>
          <ul>${rows}</ul>
          <hr>
          <ul><li><a href="/updates/"${current("/updates/")}><span>Updates on Lukas</span></a></li><li><a href="/oksana/#notebook"><span>Oksana’s notebook</span></a></li></ul>
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

  const footer = document.querySelector("[data-isl-footer]");
  if (footer) {
    footer.classList.add("isl-footer");
    footer.innerHTML = `
      <span>Made by <a href="/nicholas/">Nicholas Christoforakis</a>, ${new Date().getFullYear()}</span>
      <nav aria-label="Footer"><a href="/">Home</a><a href="/updates/">Updates</a><a href="/oksana/#notebook">Notebook</a><a href="/admin.html" rel="nofollow">Write</a></nav>`;
  }
})();
