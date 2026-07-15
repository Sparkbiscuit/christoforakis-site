(function () {
  "use strict";

  const feed = document.querySelector("[data-blog-feed]");
  const empty = document.querySelector("[data-blog-empty]");
  const status = document.querySelector("[data-blog-status]");
  if (!feed) return;

  const formatDate = (date) => new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${date}T12:00:00Z`));

  function renderPost(post) {
    const article = document.createElement("article");
    article.className = "journal-post reveal is-visible";
    article.id = post.id;

    if (post.image) {
      const image = document.createElement("img");
      image.className = "journal-post__image";
      image.src = post.image;
      image.alt = post.imageAlt || "";
      image.loading = "lazy";
      image.decoding = "async";
      article.appendChild(image);
    }

    const body = document.createElement("div");
    body.className = "journal-post__body";
    const meta = document.createElement("div");
    meta.className = "post-meta";
    const date = document.createElement("time");
    date.dateTime = post.date;
    date.textContent = formatDate(post.date);
    meta.appendChild(date);

    const title = document.createElement("h2");
    title.textContent = post.title;
    const copy = document.createElement("div");
    copy.className = "post-copy";
    (Array.isArray(post.body) ? post.body : [String(post.body || "")]).forEach((part) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = part;
      copy.appendChild(paragraph);
    });
    body.append(meta, title, copy);
    article.appendChild(body);
    return article;
  }

  async function load() {
    try {
      const response = await fetch("/blog-posts.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Notebook unavailable");
      const posts = await response.json();
      posts.sort((a, b) => String(b.date).localeCompare(String(a.date)));
      feed.replaceChildren(...posts.map(renderPost));
      if (empty) empty.hidden = posts.length > 0;
      if (status) status.textContent = posts.length ? `${posts.length} ${posts.length === 1 ? "note" : "notes"}` : "The first note is still to come.";
    } catch (error) {
      if (status) status.textContent = "The notebook could not be loaded.";
      if (empty) empty.hidden = false;
    }
  }

  load();
})();
