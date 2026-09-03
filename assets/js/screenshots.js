(() => {
  const links = [...document.querySelectorAll('.app-gallery figure > a')];
  if (!links.length || typeof HTMLDialogElement === 'undefined') return;

  const viewer = document.createElement('dialog');
  viewer.className = 'screenshot-viewer';
  viewer.setAttribute('aria-labelledby', 'screenshot-title');
  viewer.innerHTML = `
    <header class="screenshot-viewer__header">
      <h2 id="screenshot-title"></h2>
      <button type="button" class="screenshot-viewer__close" autofocus aria-label="Close screenshot viewer">Close <span aria-hidden="true">×</span></button>
    </header>
    <div class="screenshot-viewer__image"><img alt="" /><p class="screenshot-viewer__error" role="status" hidden>This screen could not be displayed. You can still open the original image below.</p></div>
    <div class="screenshot-viewer__caption" aria-live="polite" aria-atomic="true"></div>
    <footer class="screenshot-viewer__controls">
      <button type="button" data-previous aria-label="Previous screenshot">←</button>
      <span data-count></span>
      <button type="button" data-next aria-label="Next screenshot">→</button>
      <a target="_blank" rel="noopener">Open original <span aria-hidden="true">↗</span></a>
    </footer>`;
  document.body.append(viewer);

  const photo = viewer.querySelector('img');
  const title = viewer.querySelector('h2');
  const caption = viewer.querySelector('.screenshot-viewer__caption');
  const original = viewer.querySelector('a');
  const error = viewer.querySelector('[role="status"]');
  const previous = viewer.querySelector('[data-previous]');
  const next = viewer.querySelector('[data-next]');
  const count = viewer.querySelector('[data-count]');
  let current = 0;
  let opener;

  function show(index) {
    current = index;
    const link = links[index];
    const image = link.querySelector('img');
    title.textContent = link.closest('.app-gallery').getAttribute('aria-label');
    caption.textContent = [...link.parentElement.querySelector('figcaption').children].map(part => part.textContent).join(' ');
    error.hidden = true;
    photo.hidden = false;
    photo.alt = image.alt;
    photo.src = link.href;
    original.href = link.href;
    original.setAttribute('aria-label', `Open original screenshot ${index + 1} in a new tab`);
    count.textContent = `${index + 1} / ${links.length}`;
    previous.disabled = index === 0;
    next.disabled = index === links.length - 1;
  }

  photo.addEventListener('error', () => { photo.hidden = true; error.hidden = false; });
  links.forEach((link, index) => {
    link.setAttribute('aria-label', link.getAttribute('aria-label').replace(' full size in a new tab', ' in image viewer'));
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      show(index);
      viewer.showModal();
      document.documentElement.classList.add('is-screen-open');
    });
  });
  previous.addEventListener('click', () => { if (current > 0) show(current - 1); });
  next.addEventListener('click', () => { if (current < links.length - 1) show(current + 1); });
  viewer.querySelector('.screenshot-viewer__close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowLeft' && current > 0) { event.preventDefault(); show(current - 1); }
    if (event.key === 'ArrowRight' && current < links.length - 1) { event.preventDefault(); show(current + 1); }
  });
  viewer.addEventListener('click', event => {
    if (event.target !== viewer) return;
    const box = viewer.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) viewer.close();
  });
  viewer.addEventListener('close', () => {
    document.documentElement.classList.remove('is-screen-open');
    opener?.focus({ preventScroll: true });
  });
})();
