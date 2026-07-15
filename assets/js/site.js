(function () {
  "use strict";

  const family = [
    { name: "Nicholas", detail: "Middlebury + Loom", path: "/nicholas/", tone: "cyan" },
    { name: "Andreas", detail: "High school senior", path: "/andreas/", tone: "lavender" },
    { name: "Lukas", detail: "Flight decks + Formula 1", path: "/lukas/", tone: "coral" },
    { name: "Oksana", detail: "Notes + photographs", path: "/oksana/", tone: "mint" },
    { name: "Kiriakos", detail: "Small business owner", path: "/kiriakos/", tone: "" },
    { name: "Foxy", detail: "The tricolor one", path: "/foxy/", tone: "cyan" }
  ];

  function headerMarkup() {
    const links = family.map((person) => `
      <a class="mega-link${person.tone ? ` mega-link--${person.tone}` : ""}" href="${person.path}">
        <strong>${person.name}</strong>
        <span>${person.detail}</span>
      </a>`).join("");

    return `
      <a class="skip-link" href="#main">Skip to content</a>
      <header class="site-header" data-site-nav>
        <div class="nav-shell shell">
          <a class="wordmark" href="/" aria-label="Christoforakis family home">
            <span class="wordmark__character" aria-hidden="true"></span>
            <span class="wordmark__name">Christoforakis</span>
          </a>
          <button class="menu-button" type="button" aria-expanded="false" aria-controls="family-menu" data-menu-button>
            Family
            <svg class="menu-button__icon" viewBox="0 0 16 16" aria-hidden="true"><path d="m3 6 5 5 5-5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" /></svg>
          </button>
          <nav class="nav-utility" aria-label="Utility">
            <a href="/updates/">Updates</a>
            <a href="/oksana/">Oksana’s notebook</a>
          </nav>
        </div>
        <div class="mega-menu" id="family-menu" data-mega-menu hidden>
          <div class="mega-menu__grid">${links}</div>
          <div class="mega-menu__footer">
            <p>Lukas’s medical updates now have a home of their own.</p>
            <a class="btn btn--small btn--cyan" href="/updates/">Read updates <span class="btn__arrow" aria-hidden="true">→</span></a>
          </div>
        </div>
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
              <a href="/updates/">Family updates</a>
              <a href="/oksana/">Oksana’s notebook</a>
              <a href="/admin.html" rel="nofollow">Write</a>
            </nav>
            <small>CHRISTOFORAKIS.COM · <span data-year></span></small>
          </div>
        </div>
      </footer>`;
  }

  function setupChrome() {
    const headerTarget = document.querySelector("[data-site-header]");
    const footerTarget = document.querySelector("[data-site-footer]");
    if (headerTarget) headerTarget.innerHTML = headerMarkup();
    if (footerTarget) footerTarget.innerHTML = footerMarkup();

    const year = document.querySelector("[data-year]");
    if (year) year.textContent = String(new Date().getFullYear());

    const button = document.querySelector("[data-menu-button]");
    const menu = document.querySelector("[data-mega-menu]");
    const scrim = document.querySelector("[data-menu-scrim]");
    if (!button || !menu || !scrim) return;

    const setOpen = (open) => {
      button.setAttribute("aria-expanded", String(open));
      menu.hidden = !open;
      scrim.hidden = !open;
      document.body.classList.toggle("is-menu-open", open);
      if (open) {
        const firstLink = menu.querySelector("a");
        window.setTimeout(() => firstLink && firstLink.focus(), 0);
      }
    };

    button.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") !== "true"));
    scrim.addEventListener("click", () => setOpen(false));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        button.focus();
      }
    });
  }

  function setupReveals() {
    const elements = Array.from(document.querySelectorAll(".reveal"));
    if (!elements.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    elements.forEach((element) => observer.observe(element));
  }

  function setupCounter() {
    const number = document.querySelector("[data-count]");
    if (!number) return;
    const target = Number(number.dataset.count || number.textContent);
    const container = number.closest(".family-count");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      number.textContent = String(target);
      return;
    }

    const startedAt = performance.now();
    const duration = 1500;
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 2);
      number.textContent = String(progress < 1 ? Math.floor(target * eased) : target);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else if (container) {
        container.classList.add("is-complete");
      }
    };
    requestAnimationFrame(tick);
  }

  function setupStarBurst() {
    document.querySelectorAll("[data-celebrate]").forEach((button) => {
      button.addEventListener("click", (event) => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const star = document.createElement("span");
        star.className = "star-burst";
        star.setAttribute("aria-hidden", "true");
        star.style.left = `${event.clientX - 12}px`;
        star.style.top = `${event.clientY - 12}px`;
        document.body.appendChild(star);
        window.setTimeout(() => star.remove(), 460);
      });
    });
  }

  function setupPreloads() {
    document.querySelectorAll(".family-node").forEach((link) => {
      link.addEventListener("pointerenter", () => {
        if (document.querySelector(`link[rel="prefetch"][href="${link.href}"]`)) return;
        const prefetch = document.createElement("link");
        prefetch.rel = "prefetch";
        prefetch.href = link.href;
        document.head.appendChild(prefetch);
      }, { once: true });
    });
  }

  async function loadLatestUpdate() {
    const title = document.querySelector("[data-latest-title]");
    if (!title) return;
    try {
      const response = await fetch("/posts.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Updates unavailable");
      const posts = await response.json();
      const latest = posts.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
      if (!latest) return;
      const date = document.querySelector("[data-latest-date]");
      const excerpt = document.querySelector("[data-latest-excerpt]");
      title.textContent = latest.title;
      if (date) date.textContent = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${latest.date}T12:00:00Z`));
      if (excerpt && latest.body && latest.body.length) {
        const source = latest.body.find((part) => String(part).length > 70) || latest.body[0];
        const compact = String(source).replace(/\s+/g, " ").trim();
        excerpt.textContent = compact.length > 180 ? `${compact.slice(0, 177).replace(/\s+\S*$/, "")}…` : compact;
      }
    } catch (error) {
      const band = title.closest(".latest-band");
      if (band) band.dataset.state = "error";
    }
  }

  setupChrome();
  setupReveals();
  setupCounter();
  setupStarBurst();
  setupPreloads();
  loadLatestUpdate();
})();
