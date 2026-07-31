/* ==========================================================================
   Gallery — builds the grid from images/manifest.json and drives the
   lightbox. To add photographs, edit the manifest; nothing here changes.
   ========================================================================== */

(function () {
  'use strict';

  var grid = document.getElementById('grid');
  if (!grid) return;

  var note = document.getElementById('grid-note');
  var shots = [];   // filled entries only — what the lightbox pages through

  function el(tag, cls) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }

  /* `tab` may be a string or an array of strings. */
  function onTab(entry, tab) {
    var t = entry.tab;
    if (!t) return false;
    return Array.isArray(t) ? t.indexOf(tab) !== -1 : t === tab;
  }

  function resolve(base, file) {
    if (/^(https?:)?\/\//.test(file) || file.charAt(0) === '/') return file;
    return (base || '') + file;
  }

  /* ------------------------------------------------------------------ build */

  function build(manifest) {
    var base = manifest.basePath || 'images/';
    var entries = (manifest.images || []).filter(function (e) {
      return e && e.file && onTab(e, 'gallery');
    });

    if (!entries.length) {
      showNote('The manifest lists no gallery photographs yet. Add entries to images/manifest.json.');
      return;
    }

    var frag = document.createDocumentFragment();

    entries.forEach(function (entry, i) {
      var caption = entry.caption || entry.file;
      var src = resolve(base, entry.file);

      var cell = el('figure', 'cell');
      if (entry.size === 'wide') cell.classList.add('cell--wide');
      if (entry.size === 'tall') cell.classList.add('cell--tall');

      var index = shots.length;
      shots.push({ src: src, caption: caption, alt: entry.alt || caption });

      var btn = el('button', 'cell__btn');
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Enlarge: ' + caption);
      btn.dataset.index = String(index);

      var media = el('div', 'media');
      var img = el('img');
      img.src = src;
      img.alt = entry.alt || caption;
      img.decoding = 'async';
      img.setAttribute('data-label', caption);
      // Everything below the first row is lazy.
      if (i > 1) img.loading = 'lazy';

      /* A slot with no file yet becomes a placeholder and drops out of the
         lightbox sequence, so arrow-nav never lands on an empty frame. The
         frame itself is drawn by the shared handler in site.js; this just
         unwraps the button so an empty frame is not clickable. */
      function markMissing() {
        if (shots[index].missing) return;
        shots[index].missing = true;
        if (btn.parentNode) btn.replaceWith(media);
      }

      img.addEventListener('error', markMissing);

      img.addEventListener('load', function () { img.classList.add('is-loaded'); });

      media.appendChild(img);

      var cap = el('figcaption', 'cell__cap');
      cap.textContent = caption;

      btn.appendChild(media);
      cell.appendChild(btn);
      cell.appendChild(cap);
      frag.appendChild(cell);

      /* Guard the same race site.js handles: a file that 404s before the
         listener is attached arrives already complete with no pixels. */
      if (img.complete && img.naturalWidth === 0) markMissing();
    });

    grid.appendChild(frag);

    /* Deliberately just the total. Frames below the fold are lazy-loaded, so
       any "N photographed" count would be wrong until the visitor scrolls —
       the placeholder frames already say which shots are outstanding. */
    if (note) {
      note.textContent = entries.length + ' frames in sequence.';
    }
  }

  function showNote(message) {
    var box = el('div', 'grid__note');
    var p = el('p', 'ph__label');
    p.textContent = message;
    box.appendChild(p);
    grid.appendChild(box);
  }

  /* --------------------------------------------------------------- lightbox */

  function initLightbox() {
    var box = document.getElementById('lightbox');
    if (!box) return;

    var img = box.querySelector('.lightbox__img');
    var cap = box.querySelector('.lightbox__cap');
    var count = box.querySelector('.lightbox__count');
    var prev = box.querySelector('[data-lb="prev"]');
    var next = box.querySelector('[data-lb="next"]');
    var close = box.querySelector('[data-lb="close"]');
    var current = 0;
    var lastFocused = null;

    function live() {
      return shots.filter(function (s) { return !s.missing; });
    }

    function show(i) {
      var list = live();
      if (!list.length) return;
      current = (i + list.length) % list.length;
      var shot = list[current];
      img.src = shot.src;
      img.alt = shot.alt;
      cap.textContent = shot.caption;
      count.textContent = (current + 1) + ' / ' + list.length;
    }

    function open(shot) {
      var list = live();
      var i = list.indexOf(shot);
      if (i === -1) return;
      lastFocused = document.activeElement;
      show(i);
      box.hidden = false;
      document.body.style.overflow = 'hidden';
      close.focus();
    }

    function dismiss() {
      box.hidden = true;
      document.body.style.overflow = '';
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    grid.addEventListener('click', function (e) {
      var btn = e.target.closest('.cell__btn');
      if (!btn) return;
      open(shots[Number(btn.dataset.index)]);
    });

    prev.addEventListener('click', function () { show(current - 1); });
    next.addEventListener('click', function () { show(current + 1); });
    close.addEventListener('click', dismiss);

    /* Tap the scrim (not the photograph or the controls) to close. */
    box.addEventListener('click', function (e) {
      if (e.target === box) dismiss();
    });

    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;

      if (e.key === 'Escape') { dismiss(); return; }
      if (e.key === 'ArrowLeft') { show(current - 1); return; }
      if (e.key === 'ArrowRight') { show(current + 1); return; }

      if (e.key === 'Tab') {
        var focusable = box.querySelectorAll('button');
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  window.Manifest.load()
    .then(function (manifest) {
      build(manifest);
      initLightbox();
    })
    .catch(function () {
      /* Most often this is file:// — fetch is blocked there by every browser. */
      showNote(
        location.protocol === 'file:'
          ? 'The gallery reads images/manifest.json, and browsers block that on file:// URLs. Run "python3 -m http.server" in this folder and open http://localhost:8000/gallery.html to preview.'
          : 'images/manifest.json could not be loaded. Check that the file exists and contains valid JSON.'
      );
      if (note) note.textContent = 'Gallery unavailable.';
    });
})();
