(function () {
  "use strict";

  const feed = document.querySelector("[data-updates-feed]");
  const search = document.querySelector("[data-updates-search]");
  const empty = document.querySelector("[data-updates-empty]");
  const status = document.querySelector("[data-updates-status]");
  if (!feed) return;

  let posts = [];

  const formatDate = (date) => new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${date}T12:00:00Z`));

  function paragraph(text) {
    const node = document.createElement("p");
    node.textContent = text;
    return node;
  }

  function badge(text, className) {
    const node = document.createElement("span");
    node.className = `post-badge${className ? ` ${className}` : ""}`;
    node.textContent = text;
    return node;
  }

  function renderPost(post) {
    const article = document.createElement("article");
    article.className = "update-post reveal is-visible";
    article.id = post.id;

    const body = document.createElement("div");
    body.className = "update-post__body";
    const meta = document.createElement("div");
    meta.className = "post-meta";
    const date = document.createElement("time");
    date.dateTime = post.date;
    date.textContent = formatDate(post.date);
    meta.appendChild(date);
    if (post.pinned) meta.appendChild(badge("Pinned", "post-badge--pinned"));
    if (post.isNew) meta.appendChild(badge("New"));

    const title = document.createElement("h2");
    title.textContent = post.title;
    const copy = document.createElement("div");
    copy.className = "post-copy";
    const bodyParts = Array.isArray(post.body) ? post.body : [String(post.body || "")];
    if (bodyParts[0]) copy.appendChild(paragraph(bodyParts[0]));

    if (bodyParts.length > 1) {
      const details = document.createElement("details");
      details.className = "post-more";
      const summary = document.createElement("summary");
      summary.textContent = "Read the full update";
      details.appendChild(summary);
      bodyParts.slice(1).forEach((part) => details.appendChild(paragraph(part)));
      copy.appendChild(details);
    }

    const actions = document.createElement("div");
    actions.className = "post-actions";
    const share = document.createElement("button");
    share.className = "text-button";
    share.type = "button";
    share.textContent = "Share this update";
    share.addEventListener("click", async () => {
      const url = `${window.location.origin}${window.location.pathname}#${post.id}`;
      try {
        if (navigator.share) {
          await navigator.share({ title: post.title, url });
        } else {
          await navigator.clipboard.writeText(url);
          if (status) status.textContent = "Link copied.";
          share.textContent = "Link copied";
          window.setTimeout(() => { share.textContent = "Share this update"; }, 1800);
        }
      } catch (error) {
        if (error && error.name !== "AbortError" && status) status.textContent = "The link could not be copied.";
      }
    });
    actions.appendChild(share);

    body.append(meta, title, copy, actions);
    article.appendChild(body);
    return article;
  }

  function render() {
    const query = (search ? search.value : "").trim().toLocaleLowerCase();
    const filtered = posts.filter((post) => {
      const haystack = `${post.title} ${(post.body || []).join(" ")}`.toLocaleLowerCase();
      return !query || haystack.includes(query);
    });

    feed.replaceChildren(...filtered.map(renderPost));
    if (empty) empty.hidden = filtered.length > 0;
    if (status) status.textContent = `${filtered.length} ${filtered.length === 1 ? "update" : "updates"}`;
  }

  async function load() {
    try {
      const response = await fetch("/posts.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Updates unavailable");
      posts = await response.json();
      posts.sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || String(b.date).localeCompare(String(a.date)));
      render();
      if (window.location.hash) {
        const target = document.getElementById(window.location.hash.slice(1));
        const details = target && target.querySelector("details");
        if (details) details.open = true;
        if (target) window.setTimeout(() => target.scrollIntoView({ block: "start" }), 40);
      }
    } catch (error) {
      if (status) status.textContent = "Updates could not be loaded.";
      if (empty) {
        empty.hidden = false;
        const heading = empty.querySelector("h2");
        const copy = empty.querySelector("p");
        if (heading) heading.textContent = "The updates are resting.";
        if (copy) copy.textContent = "Please try again in a moment.";
      }
    }
  }

  if (search) search.addEventListener("input", render);
  load();
})();
