import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const site = process.argv[2] || fileURLToPath(new URL('../', import.meta.url));
const filename = `${site}/assets/js/admin.js`;
const source = fs.readFileSync(filename, 'utf8');
const html = fs.readFileSync(`${site}/admin.html`, 'utf8');
const tests = [];
const test = (name, run) => tests.push({ name, run });
const clone = value => JSON.parse(JSON.stringify(value));
const record = (id, title = id.toUpperCase()) => ({ id, title, date: '2026-09-03', body: [`${title} body`], image: '', imageAlt: '' });

function harness() {
  const all = [];
  const timers = new Map();
  const requests = [];
  const objectURLs = new Map();
  let focused = null;
  let fetchImpl = async () => { throw new Error('Unexpected mocked network request'); };
  class Element {
    constructor(tag = 'div', attributes = {}) {
      this.tagName = tag.toUpperCase();
      this.attributes = { ...attributes };
      this.dataset = {};
      for (const [key, value] of Object.entries(attributes)) {
        if (key.startsWith('data-')) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
      }
      this.value = attributes.value || '';
      this.checked = 'checked' in attributes;
      this.hidden = 'hidden' in attributes;
      this.disabled = 'disabled' in attributes;
      this.className = attributes.class || '';
      this.id = attributes.id || '';
      this.style = {};
      this.files = [];
      this.children = [];
      this.parentElement = null;
      this.listeners = new Map();
      this.textContent = '';
      this.classList = {
        add: (...names) => { this.className += ` ${names.join(' ')}`; },
        remove: (...names) => { this.className = this.className.split(/\s+/).filter(x => !names.includes(x)).join(' '); },
        contains: name => this.className.split(/\s+/).includes(name),
        toggle: (name, force) => { const has = this.classList.contains(name); const on = force ?? !has; on ? this.classList.add(name) : this.classList.remove(name); return on; }
      };
      all.push(this);
    }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    getAttribute(key) { return this.attributes[key] ?? null; }
    removeAttribute(key) { delete this.attributes[key]; }
    addEventListener(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type, []); this.listeners.get(type).push(fn); }
    async fire(type) { for (const fn of this.listeners.get(type) || []) await fn({ currentTarget: this, target: this, preventDefault() {} }); }
    appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
    append(...children) { children.forEach(c => this.appendChild(c)); }
    replaceChildren(...children) { this.children = []; this.append(...children); }
    focus() { focused = this; }
    matches(selector) {
      return selector.split(',').some(s => {
        s = s.trim();
        if (s.startsWith('[')) {
          const m = s.match(/^\[([^=\]]+)(?:=["']?([^\]"']*)["']?)?\]$/);
          return m && m[1] in this.attributes && (m[2] === undefined || this.attributes[m[1]] === m[2]);
        }
        if (s.startsWith('.')) return this.className.split(/\s+/).includes(s.slice(1));
        if (s.startsWith('#')) return this.id === s.slice(1);
        return this.tagName === s.toUpperCase();
      });
    }
    querySelectorAll(selector) { return this.children.flatMap(c => [c, ...c.descendants()]).filter(c => c.matches(selector)); }
    descendants() { return this.children.flatMap(c => [c, ...c.descendants()]); }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    closest(selector) { for (let el = this; el; el = el.parentElement) if (el.matches(selector)) return el; return null; }
    get visible() { for (let el = this; el; el = el.parentElement) if (el.hidden) return false; return true; }
  }
  const documentRoot = new Element('document');
  const stack = [documentRoot];
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  const markup = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  for (const token of markup.matchAll(/<\/?([a-z][\w-]*)\b([^>]*)>/gi)) {
    const tag = token[1].toLowerCase();
    if (token[0].startsWith('</')) {
      for (let i = stack.length - 1; i > 0; i--) if (stack[i].tagName.toLowerCase() === tag) { stack.length = i; break; }
      continue;
    }
    const attributes = {};
    for (const match of token[2].matchAll(/([^\s=/'">]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attributes[match[1]] = match[2] ?? match[3] ?? match[4] ?? '';
    const element = new Element(tag, attributes);
    stack.at(-1).appendChild(element);
    if (!voidTags.has(tag) && !token[0].endsWith('/>')) stack.push(element);
  }
  const document = {
    querySelector: selector => documentRoot.querySelector(selector),
    querySelectorAll: selector => documentRoot.querySelectorAll(selector),
    createElement: tag => new Element(tag),
    getElementById: id => all.find(el => el.id === id) || null,
    addEventListener() {}
  };
  const storage = () => { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) }; };
  const win = {
    setTimeout(fn) { const id = timers.size + 1; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); },
    addEventListener() {},
    confirm() { return true; },
    location: { hostname: '127.0.0.1', protocol: 'http:', origin: 'http://127.0.0.1' }
  };
  class FileReader {
    readAsDataURL(file) { this.result = `data:image/jpeg;base64,${Buffer.from(file.name).toString('base64')}`; this.onload?.(); }
  }
  const context = vm.createContext({
    document, window: win, localStorage: storage(), sessionStorage: storage(),
    TextEncoder, TextDecoder, Uint8Array, Date, Map, Set, Blob, FileReader,
    atob: s => Buffer.from(s, 'base64').toString('binary'),
    btoa: s => Buffer.from(s, 'binary').toString('base64'),
    URL: { createObjectURL(file) { const url = `blob:mock-${objectURLs.size + 1}`; objectURLs.set(url, file); return url; }, revokeObjectURL() {} },
    fetch: async (url, options = {}) => { const request = { url, options }; requests.push(request); return fetchImpl(request); },
    setTimeout: win.setTimeout, clearTimeout: win.clearTimeout, console
  });
  const instrumented = source.replace(/\}\)\(\);\s*$/, 'globalThis.__adminTest = {state, elements, selectRecord, deleteRecord, undoDelete, newRecord, publish, loadCollection, lock};\n})();');
  assert.notEqual(instrumented, source, 'Unable to instrument current admin closure');
  vm.runInContext(instrumented, context, { filename });
  const api = context.__adminTest;
  api.elements.auth.hidden = true;
  api.elements.workspace.hidden = false;
  return { ...api, requests, objectURLs, setFetch: fn => { fetchImpl = fn; }, get focused() { return focused; } };
}
function readResponse(records, sha) {
  return { ok: true, json: async () => ({ sha, content: Buffer.from(JSON.stringify(records)).toString('base64') }) };
}
function deferred() { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; }
function prepare(h, records, collection = 'updates') {
  h.state.collection = collection;
  h.state.records = clone(records);
  h.state.sha = 'mock-current-sha';
  h.state.dirty = false;
  h.state.selectedId = null;
}

test('delete A → select B → Undo preserves both posts', async () => {
  const h = harness();
  prepare(h, [record('a', 'Alpha'), record('b', 'Beta')]);
  h.selectRecord('a'); h.deleteRecord(); h.selectRecord('b');
  h.elements.title.value = 'Beta edited';
  h.elements.body.value = 'Beta edited body';
  h.undoDelete();
  assert.deepEqual(clone(h.state.records.map(({id, title, body}) => ({id, title, body}))), [
    { id: 'a', title: 'Alpha', body: ['Alpha body'] },
    { id: 'b', title: 'Beta edited', body: ['Beta edited body'] }
  ]);
  assert.equal(h.state.selectedId, 'a');
  assert.equal(h.elements.title.value, 'Alpha');
});

test('pending photos remain attached to the right posts across navigation', async () => {
  const h = harness();
  prepare(h, [record('a', 'Alpha'), record('b', 'Beta')], 'notebook');
  const photoA = { name: 'alpha.jpg', type: 'image/jpeg', size: 20 };
  const photoB = { name: 'beta.jpg', type: 'image/jpeg', size: 20 };
  h.selectRecord('a'); h.elements.image.files = [photoA]; await h.elements.image.fire('change');
  h.selectRecord('b'); h.elements.image.files = [photoB]; await h.elements.image.fire('change');
  h.selectRecord('a');
  const previewA = h.elements.imagePreview.children[0]?.src;
  assert.equal(h.objectURLs.get(previewA), photoA, 'Post A preview must retain its selected photo');
  h.selectRecord('b');
  const previewB = h.elements.imagePreview.children[0]?.src;
  assert.equal(h.objectURLs.get(previewB), photoB, 'Post B preview must retain its selected photo');
  assert.equal(h.requests.length, 0, 'Selecting images must not upload before Publish');
});

test('deleting the last post leaves Publish reachable and writes an empty collection', async () => {
  const h = harness();
  prepare(h, [record('a')]);
  h.setFetch(async ({options}) => {
    assert.equal(options.method, 'PUT');
    return { ok: true, json: async () => ({ content: { sha: 'mock-published-sha' } }) };
  });
  h.selectRecord('a'); h.deleteRecord();
  assert.equal(h.elements.publish.visible, true, 'Publish must remain outside the hidden editor form');
  assert.equal(h.elements.publish.disabled, false);
  await h.publish();
  assert.equal(h.requests.length, 1, 'One collection update expected');
  const payload = JSON.parse(h.requests[0].options.body);
  assert.deepEqual(JSON.parse(Buffer.from(payload.content, 'base64').toString('utf8')), []);
  assert.equal(payload.sha, 'mock-current-sha');
  assert.equal(h.state.dirty, false);
});

test('late collection response cannot overwrite the currently selected collection', async () => {
  const h = harness(); const first = deferred(), second = deferred();
  let n = 0; h.setFetch(() => (++n === 1 ? first.promise : second.promise));
  const oldLoad = h.loadCollection('updates');
  const newLoad = h.loadCollection('notebook');
  second.resolve(readResponse([record('notebook-current')], 'notebook-sha')); await newLoad;
  first.resolve(readResponse([record('updates-stale')], 'updates-sha')); await oldLoad;
  assert.equal(h.state.collection, 'notebook');
  assert.deepEqual(clone(h.state.records.map(p => p.id)), ['notebook-current']);
  assert.equal(h.state.sha, 'notebook-sha');
});

test('late failed request cannot replace a newer successful connection status', async () => {
  const h = harness(); const first = deferred(), second = deferred();
  let n = 0; h.setFetch(() => (++n === 1 ? first.promise : second.promise));
  const oldLoad = h.loadCollection('updates'); const newLoad = h.loadCollection('notebook');
  second.resolve(readResponse([record('notebook-current')], 'notebook-sha')); await newLoad;
  const previousStatus = h.elements.connection.textContent;
  first.reject(new Error('Simulated stale read failure')); await oldLoad;
  assert.equal(h.elements.connection.textContent, previousStatus);
  assert.equal(h.elements.connection.dataset.state, 'online');
});

test('an incomplete unselected post blocks publication of the whole collection', async () => {
  const h = harness();
  prepare(h, [{...record('a'), title: '', body: []}, record('b')]);
  h.selectRecord('b'); h.state.dirty = true;
  h.setFetch(async () => ({ ok: true, json: async () => ({ content: { sha: 'should-not-publish' } }) }));
  await h.publish();
  assert.equal(h.requests.length, 0, 'Invalid records must not be written');
  assert.equal(h.state.dirty, true);
});


test('publishing uploads every retained photo before committing the collection', async () => {
  const h = harness();
  prepare(h, [record('a', 'Alpha'), record('b', 'Beta')], 'notebook');
  for (const [id, name] of [['a', 'alpha.jpg'], ['b', 'beta.jpg']]) {
    h.selectRecord(id);
    h.elements.imageAlt.value = `${id} photo description`;
    h.elements.image.files = [{ name, type: 'image/jpeg', size: 20 }];
    await h.elements.image.fire('change');
  }
  h.setFetch(async ({options}) => {
    assert.equal(options.method, 'PUT');
    return { ok: true, json: async () => ({ content: { sha: 'mock-photo-published-sha' } }) };
  });
  await h.publish();
  assert.equal(h.requests.length, 3, 'Two photos plus one collection write expected');
  const images = h.requests.slice(0, 2);
  const names = images.map(({options}) => Buffer.from(JSON.parse(options.body).content, 'base64').toString('utf8'));
  assert.deepEqual(names, ['alpha.jpg', 'beta.jpg']);
  const write = h.requests[2];
  assert.match(write.url, /\/blog-posts\.json$/);
  const posts = JSON.parse(Buffer.from(JSON.parse(write.options.body).content, 'base64').toString('utf8'));
  assert.match(posts[0].image, /^\/assets\/uploads\/.*alpha.*\.jpg$/);
  assert.match(posts[1].image, /^\/assets\/uploads\/.*beta.*\.jpg$/);
  assert.equal(h.state.pendingImages.size, 0);
  assert.equal(h.state.dirty, false);
  assert.equal(h.state.publishing, false);
  assert.equal(h.elements.editorForm.inert, false);
});

test('locking during a load prevents the late response from repopulating editor state', async () => {
  const h = harness(); const pending = deferred();
  h.setFetch(() => pending.promise);
  const loading = h.loadCollection('updates');
  h.lock();
  pending.resolve(readResponse([record('late-private-data')], 'late-sha'));
  await loading;
  assert.equal(h.elements.auth.hidden, false);
  assert.equal(h.elements.workspace.hidden, true);
  assert.equal(h.state.records.length, 0);
  assert.equal(h.state.selectedId, null);
  assert.equal(h.state.loading, false);
});

let failed = 0;
console.log(`Offline admin regression harness: ${filename}`);
for (const {name, run} of tests) {
  try { await run(); console.log(`PASS ${name}`); }
  catch (error) { failed++; console.log(`FAIL ${name}\n  ${error.message.replaceAll('\n', '\n  ')}`); }
}
console.log(`${tests.length - failed}/${tests.length} passed. All network and storage were mocked; no credentials or browser storage were read.`);
process.exitCode = failed ? 1 : 0;
