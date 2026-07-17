(function () {
  "use strict";

  const PASS_KEY = "christoforakis_admin_hash";
  const SESSION_KEY = "christoforakis_admin_session";
  const TOKEN_KEY = "christoforakis_github_token";
  const SESSION_TOKEN_KEY = "christoforakis_github_session_token";
  const OWNER = "Sparkbiscuit";
  const REPO = "christoforakis-site";
  const BRANCH = "main";
  const API = `https://api.github.com/repos/${OWNER}/${REPO}/contents`;

  const collections = {
    updates: {
      label: "Lukas updates",
      singular: "update",
      file: "posts.json",
      publicUrl: "/updates/",
      flags: true,
      media: false
    },
    notebook: {
      label: "Oksana’s notebook",
      singular: "note",
      file: "blog-posts.json",
      publicUrl: "/oksana/",
      flags: false,
      media: true
    }
  };

  const elements = {
    auth: document.querySelector("[data-auth-view]"),
    workspace: document.querySelector("[data-workspace]"),
    authForm: document.querySelector("[data-auth-form]"),
    authTitle: document.querySelector("[data-auth-title]"),
    authSubtitle: document.querySelector("[data-auth-subtitle]"),
    password: document.querySelector("[data-password]"),
    confirmWrap: document.querySelector("[data-confirm-wrap]"),
    confirm: document.querySelector("[data-confirm]"),
    tokenWrap: document.querySelector("[data-token-wrap]"),
    token: document.querySelector("[data-token]"),
    remember: document.querySelector("[data-remember]"),
    authMessage: document.querySelector("[data-auth-message]"),
    authButton: document.querySelector("[data-auth-button]"),
    lock: document.querySelector("[data-lock]"),
    connection: document.querySelector("[data-connection]"),
    tabs: Array.from(document.querySelectorAll("[data-collection]")),
    collectionTitle: document.querySelector("[data-collection-title]"),
    newPost: document.querySelector("[data-new-post]"),
    postList: document.querySelector("[data-post-list]"),
    editorEmpty: document.querySelector("[data-editor-empty]"),
    editorForm: document.querySelector("[data-editor-form]"),
    editorStatus: document.querySelector("[data-editor-status]"),
    publish: document.querySelector("[data-publish]"),
    title: document.querySelector("[data-field-title]"),
    date: document.querySelector("[data-field-date]"),
    body: document.querySelector("[data-field-body]"),
    flags: document.querySelector("[data-flags]"),
    isNew: document.querySelector("[data-field-new]"),
    pinned: document.querySelector("[data-field-pinned]"),
    media: document.querySelector("[data-media]"),
    image: document.querySelector("[data-field-image]"),
    imageAlt: document.querySelector("[data-field-image-alt]"),
    imagePreview: document.querySelector("[data-image-preview]"),
    deletePost: document.querySelector("[data-delete-post]"),
    publicLink: document.querySelector("[data-public-link]"),
    undo: document.querySelector("[data-undo]"),
    undoButton: document.querySelector("[data-undo-button]")
  };

  const state = {
    collection: "updates",
    records: [],
    sha: null,
    selectedId: null,
    dirty: false,
    token: "",
    pendingImage: null,
    previewUrl: "",
    deleted: null,
    undoTimer: null
  };

  function setConnection(text, status) {
    if (!elements.connection) return;
    elements.connection.textContent = text;
    elements.connection.dataset.state = status || "";
  }

  function setMessage(element, text, status) {
    if (!element) return;
    element.textContent = text;
    element.dataset.state = status || "";
  }

  function setButtonState(button, status, text) {
    if (!button) return;
    button.dataset.state = status || "";
    button.disabled = status === "loading";
    if (text) button.textContent = text;
  }

  async function sha256(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function tokenFromStorage() {
    return sessionStorage.getItem(SESSION_TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || "";
  }

  function storeToken(token, remember) {
    state.token = token;
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    if (remember) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  function apiHeaders() {
    return {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${state.token}`,
      "X-GitHub-Api-Version": "2022-11-28"
    };
  }

  function decodeBase64Utf8(value) {
    const binary = atob(value.replace(/\n/g, ""));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function encodeBase64Utf8(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    const size = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += size) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + size));
    }
    return btoa(binary);
  }

  async function readFile(path) {
    const response = await fetch(`${API}/${path}?ref=${encodeURIComponent(BRANCH)}`, { headers: apiHeaders() });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(detail.message || `GitHub returned ${response.status}`);
    }
    const data = await response.json();
    return { sha: data.sha, value: JSON.parse(decodeBase64Utf8(data.content)) };
  }

  async function writeFile(path, value, sha, message) {
    const payload = {
      message,
      content: encodeBase64Utf8(`${JSON.stringify(value, null, 2)}\n`),
      branch: BRANCH
    };
    if (sha) payload.sha = sha;
    const response = await fetch(`${API}/${path}`, {
      method: "PUT",
      headers: { ...apiHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(detail.message || `GitHub returned ${response.status}`);
    }
    return response.json();
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.onerror = () => reject(reader.error || new Error("Could not read image"));
      reader.readAsDataURL(file);
    });
  }

  function slugify(value) {
    return value.toLocaleLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "note";
  }

  async function uploadImage(file, record) {
    const extension = (file.name.split(".").pop() || "jpg").toLocaleLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `assets/uploads/${record.date}-${slugify(record.title)}-${Date.now().toString(36).slice(-5)}.${extension}`;
    const response = await fetch(`${API}/${path}`, {
      method: "PUT",
      headers: { ...apiHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Add image for ${record.title}`,
        content: await fileToBase64(file),
        branch: BRANCH
      })
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(detail.message || "Image upload failed");
    }
    return `/${path}`;
  }

  function collectionConfig() {
    return collections[state.collection];
  }

  function currentRecord() {
    return state.records.find((record) => record.id === state.selectedId) || null;
  }

  function parseBody(value) {
    return value.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  }

  function updateRecordFromForm() {
    const record = currentRecord();
    if (!record) return null;
    record.title = elements.title.value.trim();
    record.date = elements.date.value;
    record.body = parseBody(elements.body.value);
    if (collectionConfig().flags) {
      record.isNew = elements.isNew.checked;
      record.pinned = elements.pinned.checked;
    }
    if (collectionConfig().media) record.imageAlt = elements.imageAlt.value.trim();
    return record;
  }

  function markDirty() {
    state.dirty = true;
    if (elements.editorStatus) elements.editorStatus.textContent = "Unsaved changes";
    if (elements.publish) elements.publish.disabled = false;
  }

  function clearPreviewUrl() {
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    state.previewUrl = "";
  }

  function renderImagePreview(record) {
    if (!elements.imagePreview) return;
    elements.imagePreview.replaceChildren();
    const source = state.pendingImage ? (state.previewUrl = URL.createObjectURL(state.pendingImage)) : record.image;
    if (source) {
      const image = document.createElement("img");
      image.src = source;
      image.alt = elements.imageAlt.value || "Image preview";
      elements.imagePreview.appendChild(image);
    } else {
      const empty = document.createElement("div");
      empty.className = "image-preview__empty";
      empty.textContent = "The selected photograph will appear here.";
      elements.imagePreview.appendChild(empty);
    }
  }

  function renderList() {
    elements.postList.replaceChildren();
    state.records.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).forEach((record) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.className = "post-list__item";
      button.type = "button";
      button.dataset.postId = record.id;
      button.setAttribute("aria-current", String(record.id === state.selectedId));
      const title = document.createElement("strong");
      title.textContent = record.title || "Untitled";
      const date = document.createElement("span");
      date.textContent = record.date || "No date";
      button.append(title, date);
      button.addEventListener("click", () => selectRecord(record.id));
      item.appendChild(button);
      elements.postList.appendChild(item);
    });
  }

  function selectRecord(id) {
    if (state.selectedId) updateRecordFromForm();
    state.selectedId = id;
    state.pendingImage = null;
    clearPreviewUrl();
    const record = currentRecord();
    if (!record) {
      elements.editorEmpty.hidden = false;
      elements.editorForm.hidden = true;
      renderList();
      return;
    }
    elements.editorEmpty.hidden = true;
    elements.editorForm.hidden = false;
    elements.title.value = record.title || "";
    elements.date.value = record.date || "";
    elements.body.value = Array.isArray(record.body) ? record.body.join("\n\n") : String(record.body || "");
    elements.isNew.checked = Boolean(record.isNew);
    elements.pinned.checked = Boolean(record.pinned);
    elements.imageAlt.value = record.imageAlt || "";
    elements.flags.hidden = !collectionConfig().flags;
    elements.media.hidden = !collectionConfig().media;
    renderImagePreview(record);
    renderList();
    if (elements.editorStatus) elements.editorStatus.textContent = state.dirty ? "Unsaved changes" : "Saved on GitHub";
  }

  function newRecord() {
    if (state.selectedId) updateRecordFromForm();
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const record = {
      id: `${state.collection}-${Date.now().toString(36)}`,
      date,
      title: "",
      body: []
    };
    if (collectionConfig().flags) {
      record.isNew = true;
      record.pinned = false;
    }
    if (collectionConfig().media) {
      record.image = "";
      record.imageAlt = "";
    }
    state.records.unshift(record);
    state.selectedId = null;
    markDirty();
    selectRecord(record.id);
    window.setTimeout(() => elements.title.focus(), 0);
  }

  function showUndo(record, index) {
    state.deleted = { record, index };
    elements.undo.hidden = false;
    window.clearTimeout(state.undoTimer);
    state.undoTimer = window.setTimeout(() => {
      elements.undo.hidden = true;
      state.deleted = null;
    }, 8000);
  }

  function deleteRecord() {
    const index = state.records.findIndex((record) => record.id === state.selectedId);
    if (index < 0) return;
    const [record] = state.records.splice(index, 1);
    state.selectedId = null;
    markDirty();
    selectRecord(null);
    showUndo(record, index);
  }

  function undoDelete() {
    if (!state.deleted) return;
    state.records.splice(state.deleted.index, 0, state.deleted.record);
    state.selectedId = state.deleted.record.id;
    state.deleted = null;
    elements.undo.hidden = true;
    window.clearTimeout(state.undoTimer);
    markDirty();
    selectRecord(state.selectedId);
  }

  function validateEditor(record) {
    let valid = true;
    [elements.title, elements.date, elements.body].forEach((field) => field.setAttribute("aria-invalid", "false"));
    if (!record.title) {
      elements.title.setAttribute("aria-invalid", "true");
      valid = false;
    }
    if (!record.date) {
      elements.date.setAttribute("aria-invalid", "true");
      valid = false;
    }
    if (!record.body.length) {
      elements.body.setAttribute("aria-invalid", "true");
      valid = false;
    }
    if (collectionConfig().media && (state.pendingImage || record.image) && !record.imageAlt) {
      elements.imageAlt.setAttribute("aria-invalid", "true");
      valid = false;
    } else {
      elements.imageAlt.setAttribute("aria-invalid", "false");
    }
    return valid;
  }

  async function publish() {
    const record = updateRecordFromForm();
    if (!record || !validateEditor(record)) {
      setMessage(elements.editorStatus, "Complete the highlighted fields", "error");
      return;
    }
    setButtonState(elements.publish, "loading", "Publishing…");
    setConnection("Publishing", "busy");
    try {
      if (state.pendingImage) {
        record.image = await uploadImage(state.pendingImage, record);
        state.pendingImage = null;
        clearPreviewUrl();
      }
      const config = collectionConfig();
      const result = await writeFile(config.file, state.records, state.sha, `Publish ${config.label}`);
      state.sha = result.content.sha;
      state.dirty = false;
      setButtonState(elements.publish, "success", "Published");
      setMessage(elements.editorStatus, "Published to the website", "success");
      setConnection("Connected", "online");
      renderImagePreview(record);
      window.setTimeout(() => setButtonState(elements.publish, "", "Publish changes"), 1500);
    } catch (error) {
      setButtonState(elements.publish, "error", "Try again");
      setMessage(elements.editorStatus, error.message || "Publishing failed", "error");
      setConnection("Needs attention", "error");
      window.setTimeout(() => setButtonState(elements.publish, "", "Publish changes"), 2200);
    }
  }

  async function loadCollection(key) {
    if (state.dirty && !window.confirm("Switch collections and leave the unpublished changes here?")) return;
    state.collection = key;
    state.records = [];
    state.sha = null;
    state.selectedId = null;
    state.dirty = false;
    state.pendingImage = null;
    clearPreviewUrl();
    const config = collectionConfig();
    elements.collectionTitle.textContent = config.label;
    elements.publicLink.href = config.publicUrl;
    elements.tabs.forEach((tab) => tab.setAttribute("aria-selected", String(tab.dataset.collection === key)));
    elements.editorEmpty.hidden = false;
    elements.editorForm.hidden = true;
    elements.postList.replaceChildren();
    setConnection("Loading", "busy");
    try {
      const file = await readFile(config.file);
      state.records = Array.isArray(file.value) ? file.value : [];
      state.sha = file.sha;
      renderList();
      setConnection("Connected", "online");
      setMessage(elements.editorStatus, "Saved on GitHub", "");
    } catch (error) {
      setConnection("Needs attention", "error");
      setMessage(elements.editorStatus, error.message || "Could not load posts", "error");
    }
  }

  function showWorkspace() {
    elements.auth.hidden = true;
    elements.workspace.hidden = false;
    elements.lock.hidden = false;
    sessionStorage.setItem(SESSION_KEY, "1");
    loadCollection(state.collection);
  }

  function showAuth() {
    const setup = !localStorage.getItem(PASS_KEY);
    const hasToken = Boolean(tokenFromStorage());
    elements.auth.hidden = false;
    elements.workspace.hidden = true;
    elements.lock.hidden = true;
    elements.confirmWrap.hidden = !setup;
    elements.tokenWrap.hidden = !setup && hasToken;
    elements.authTitle.textContent = setup ? "Set up the writing room" : "Welcome back";
    elements.authSubtitle.textContent = setup ? "Choose a local password and connect this browser to GitHub." : "Enter the password for this browser.";
    elements.authButton.textContent = setup ? "Create writing room" : "Enter writing room";
    elements.password.autocomplete = setup ? "new-password" : "current-password";
    elements.token.value = hasToken ? tokenFromStorage() : "";
    elements.remember.checked = Boolean(localStorage.getItem(TOKEN_KEY));
    window.setTimeout(() => elements.password.focus(), 0);
  }

  async function handleAuth(event) {
    event.preventDefault();
    const setup = !localStorage.getItem(PASS_KEY);
    const password = elements.password.value;
    const token = elements.token.value.trim() || tokenFromStorage();
    setMessage(elements.authMessage, "", "");
    if (!password) {
      setMessage(elements.authMessage, "Enter your password.", "error");
      return;
    }
    if (setup && password.length < 8) {
      setMessage(elements.authMessage, "Use at least eight characters.", "error");
      return;
    }
    if (setup && password !== elements.confirm.value) {
      setMessage(elements.authMessage, "The passwords do not match.", "error");
      return;
    }
    if (!token) {
      elements.tokenWrap.hidden = false;
      setMessage(elements.authMessage, "A GitHub token is required to publish.", "error");
      elements.token.focus();
      return;
    }

    setButtonState(elements.authButton, "loading", setup ? "Setting up…" : "Checking…");
    try {
      const passwordHash = await sha256(password);
      if (!setup && passwordHash !== localStorage.getItem(PASS_KEY)) throw new Error("That password is not correct.");
      state.token = token;
      await readFile(collections.updates.file);
      storeToken(token, elements.remember.checked);
      if (setup) localStorage.setItem(PASS_KEY, passwordHash);
      elements.password.value = "";
      elements.confirm.value = "";
      setButtonState(elements.authButton, "success", "Connected");
      showWorkspace();
    } catch (error) {
      if (error.message !== "That password is not correct.") elements.tokenWrap.hidden = false;
      setButtonState(elements.authButton, "error", "Try again");
      setMessage(elements.authMessage, error.message || "Could not connect to GitHub.", "error");
      window.setTimeout(() => setButtonState(elements.authButton, "", setup ? "Create writing room" : "Enter writing room"), 1800);
    }
  }

  function lock() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    state.token = "";
    state.records = [];
    state.selectedId = null;
    state.dirty = false;
    showAuth();
  }

  elements.authForm.addEventListener("submit", handleAuth);
  elements.lock.addEventListener("click", lock);
  elements.tabs.forEach((tab) => tab.addEventListener("click", () => loadCollection(tab.dataset.collection)));
  elements.newPost.addEventListener("click", newRecord);
  elements.publish.addEventListener("click", publish);
  elements.deletePost.addEventListener("click", deleteRecord);
  elements.undoButton.addEventListener("click", undoDelete);
  [elements.title, elements.date, elements.body, elements.isNew, elements.pinned, elements.imageAlt].forEach((field) => {
    field.addEventListener("input", markDirty);
    field.addEventListener("change", markDirty);
  });
  elements.image.addEventListener("change", () => {
    clearPreviewUrl();
    state.pendingImage = elements.image.files && elements.image.files[0] ? elements.image.files[0] : null;
    const record = currentRecord();
    if (record) renderImagePreview(record);
    markDirty();
  });
  window.addEventListener("beforeunload", (event) => {
    if (!state.dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });

  state.token = tokenFromStorage();
  if (sessionStorage.getItem(SESSION_KEY) === "1" && localStorage.getItem(PASS_KEY) && state.token) {
    showWorkspace();
  } else {
    showAuth();
  }
})();
