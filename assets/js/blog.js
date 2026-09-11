(function () {
  "use strict";

  const feed = document.querySelector("[data-blog-feed]");
  const empty = document.querySelector("[data-blog-empty]");
  const status = document.querySelector("[data-blog-status]");
  const errorState = document.querySelector("[data-blog-error]");
  const retry = document.querySelector("[data-blog-retry]");
  if (!feed) return;

  const formatDate = (date) => new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${date}T12:00:00Z`));

  function renderPost(post) {
    const article = document.createElement("article");
    article.className = "note";
    article.id = post.id;

    if (post.image) {
      const image = document.createElement("img");
      image.className = "note__image";
      image.src = post.image;
      image.alt = post.imageAlt || "";
      image.width = 1600;
      image.height = 1200;
      image.loading = "lazy";
      image.decoding = "async";
      article.appendChild(image);
    }

    const body = document.createElement("div");
    body.className = "note__body";
    const date = document.createElement("time");
    date.dateTime = post.date;
    date.textContent = formatDate(post.date);

    const title = document.createElement("h2");
    title.textContent = post.title;
    const copy = document.createElement("div");
    copy.className = "note__copy";
    (Array.isArray(post.body) ? post.body : [String(post.body || "")]).forEach((part) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = part;
      copy.appendChild(paragraph);
    });
    body.append(date, title, copy);
    if (typeof post.sourcePostId === "string" && /^[a-zA-Z0-9_-]+$/.test(post.sourcePostId)) {
      const source = document.createElement("p");
      source.className = "note__source";
      const link = document.createElement("a");
      // Updates answers #post-<id>, so an excerpt opens the update it came from.
      link.href = `/updates/#post-${encodeURIComponent(post.sourcePostId)}`;
      link.textContent = post.sourceTitle || "the family archive";
      source.append("Oksana · Excerpt from ", link);
      body.appendChild(source);
    }
    article.appendChild(body);
    return article;
  }

  async function load() {
    if (status) status.textContent = "Loading notes…";
    if (retry) retry.disabled = true;
    if (empty) empty.hidden = true;
    if (errorState) errorState.hidden = true;
    try {
      const response = await fetch("/blog-posts.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Notebook unavailable");
      const posts = await response.json();
      posts.sort((a, b) => String(b.date).localeCompare(String(a.date)));
      const notes = posts.map(renderPost);
      feed.replaceChildren(...notes);
      // Notes rise in softly as they are reached, unless the visitor arrived for one in particular.
      const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
      if (window.familyMotion && !target) {
        notes.forEach((note) => {
          note.setAttribute("data-reveal", "");
          window.familyMotion.reveal(note);
        });
      }
      if (target && feed.contains(target)) target.scrollIntoView({ block: "start" });
      if (empty) empty.hidden = posts.length > 0;
      if (status) status.textContent = posts.length ? `${posts.length} ${posts.length === 1 ? "note" : "notes"}` : "";
    } catch (error) {
      if (status) status.textContent = "The notebook could not be loaded.";
      if (errorState) errorState.hidden = false;
    } finally {
      if (retry) retry.disabled = false;
    }
  }

  if (retry) retry.addEventListener("click", load);
  load();
})();
