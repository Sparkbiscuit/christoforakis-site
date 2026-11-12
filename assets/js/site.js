(function () {
  "use strict";

  // The family menu and the home map share these rooms. Photos are the map stills in /assets/backgrounds/.
  const photoVersion = "20260904-family2";
  const family = [
    { name: "Nicholas", path: "/nicholas/", photo: "nicholas", tone: "cyan" },
    { name: "Andreas", path: "/andreas/", photo: "andreas", tone: "lavender" },
    { name: "Lukas", path: "/lukas/", photo: "lukas", tone: "coral" },
    { name: "Oksana", path: "/oksana/", photo: "oksana", tone: "mint" },
    { name: "Kiriakos", path: "/kiriakos/", photo: "kiriakos", tone: "pear" },
    { name: "Foxy", path: "/foxy/", photo: "foxy", tone: "coral" }
  ];

  function headerMarkup() {
    const rooms = family.map((person) => `
      <a class="mega-link mega-link--${person.tone}" href="${person.path}">
        <span class="mega-link__photo"><img src="/assets/backgrounds/${person.photo}.webp?v=${photoVersion}" alt="" width="1536" height="1024" loading="lazy" decoding="async" /></span>
        <span class="mega-link__name">${person.name}</span>
      </a>`).join("");

    return `
      <a class="skip-link" href="#main">Skip to content</a>
      <header class="site-header" data-site-nav>
        <div class="nav-shell shell">
          <a class="wordmark" href="/">
            <span class="wordmark__character" aria-hidden="true"></span>
            <span class="wordmark__name">christoforakis.com</span>
          </a>
          <button class="menu-button" type="button" aria-expanded="false" aria-controls="family-menu" data-menu-button>
            Family
            <svg class="menu-button__icon" viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 6 4.5 4.5L12.5 6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" /></svg>
          </button>
          <nav class="nav-utility" aria-label="Utility">
            <a href="/oksana/#notebook">Oksana’s notebook</a>
            <a href="/contact/">Reach out</a>
          </nav>
        </div>
        <nav class="mega-menu" id="family-menu" aria-label="Family" data-mega-menu hidden>
          <div class="mega-menu__grid">${rooms}</div>
          <div class="mega-menu__footer">
            <a class="text-link" href="/oksana/#notebook">Oksana’s notebook</a>
            <a class="text-link" href="/contact/">Reach out</a>
          </div>
        </nav>
        <button class="menu-scrim" type="button" aria-label="Close family menu" data-menu-scrim hidden></button>
      </header>`;
  }

  function footerMarkup() {
    return `
      <footer class="site-footer">
        <div class="shell">
          <p class="site-footer__statement">Five people. One dog. Plenty happening.</p>
          <div class="site-footer__meta">
            <nav class="site-footer__links" aria-label="Footer">
              <a href="/">Home</a>
              <a href="/oksana/#notebook">Oksana’s notebook</a>
              <a href="/contact/">Reach out</a>
            </nav>
            <p class="site-footer__credit">Made by <a href="/nicholas/">Nicholas&nbsp;Christoforakis</a>&nbsp;·&nbsp;<span data-year></span></p>
          </div>
        </div>
      </footer>`;
  }

  function setupChrome() {
    const headerTarget = document.querySelector("[data-site-header]");
    const footerTarget = document.querySelector("[data-site-footer]");
    if (headerTarget) headerTarget.innerHTML = headerMarkup();
    if (footerTarget) footerTarget.innerHTML = footerMarkup();

    document.querySelectorAll(".site-header a, .site-footer a").forEach((link) => {
      if (new URL(link.href).pathname === window.location.pathname) link.setAttribute("aria-current", "page");
    });

    const year = document.querySelector("[data-year]");
    if (year) year.textContent = String(new Date().getFullYear());

    const button = document.querySelector("[data-menu-button]");
    const menu = document.querySelector("[data-mega-menu]");
    const scrim = document.querySelector("[data-menu-scrim]");
    if (!button || !menu || !scrim) return;

    const background = Array.from(document.body.children).filter((element) =>
      element !== headerTarget && !["SCRIPT", "NOSCRIPT"].includes(element.tagName));
    const priorInert = new Map();
    const setOpen = (open, restoreFocus = false) => {
      button.setAttribute("aria-expanded", String(open));
      menu.hidden = !open;
      scrim.hidden = !open;
      document.documentElement.classList.toggle("is-menu-open", open);
      if (open) {
        background.forEach((element) => {
          priorInert.set(element, element.inert);
          element.inert = true;
        });
        const firstLink = menu.querySelector("a");
        if (firstLink) firstLink.focus({ preventScroll: true });
      } else {
        background.forEach((element) => { element.inert = priorInert.get(element) || false; });
        priorInert.clear();
        if (restoreFocus) button.focus();
      }
    };

    button.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") !== "true"));
    scrim.addEventListener("click", () => setOpen(false, true));
    document.addEventListener("keydown", (event) => {
      if (button.getAttribute("aria-expanded") !== "true") return;
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false, true);
      } else if (event.key === "Tab") {
        const stops = [button, ...menu.querySelectorAll("a[href]")];
        const index = stops.indexOf(document.activeElement);
        event.preventDefault();
        const next = (index + (event.shiftKey ? -1 : 1) + stops.length) % stops.length;
        stops[next].focus();
      }
    });
  }

  function setupPreloads() {
    document.querySelectorAll(".mega-link, [data-prefetch]").forEach((link) => {
      link.addEventListener("pointerenter", () => {
        if (new URL(link.href).pathname === window.location.pathname) return;
        if (document.querySelector(`link[rel="prefetch"][href="${link.href}"]`)) return;
        const prefetch = document.createElement("link");
        prefetch.rel = "prefetch";
        prefetch.href = link.href;
        document.head.appendChild(prefetch);
      }, { once: true });
    });
  }

  setupChrome();
  setupPreloads();
})();
