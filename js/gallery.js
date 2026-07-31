/* ==========================================================================
   Gallery — renders the grid from js/gallery-manifest.js and drives the
   lightbox. Nothing here needs editing to add photos; edit the manifest.
   ========================================================================== */

(function () {
  'use strict';

  var BASE = 'images/gallery/';

  var grid = document.getElementById('gallery');
  if (!grid) return;

  var slots = Array.isArray(window.GALLERY_SLOTS) ? window.GALLERY_SLOTS : [];

  /* Filled slots are the ones the lightbox can page through. Populated as we
     build, so its indices stay in step with the buttons we wire up. */
  var shots = [];

  /* ---------------------------------------------------------------- helpers */

  function resolve(src) {
    if (!src) return '';
    // Absolute URL, root-relative, or already carrying a directory: leave alone.
    if (/^(https?:)?\/\//.test(src) || src.charAt(0) === '/' || src.indexOf('/') !== -1) {
      return src;
    }
    return BASE + src;
  }

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function placeholder(label) {
    var frame = el('div', 'frame');
    var text = el('p', 'frame__label');
    text.textContent = label;
    frame.appendChild(text);
    return frame;
  }

  /* ------------------------------------------------------------- build grid */

  function build() {
    var frag = document.createDocumentFragment();
    var filledCount = 0;

    slots.forEach(function (slot, i) {
      var label = (slot && slot.label) || 'Photography to follow';
      var src = resolve(slot && slot.src);

      var figure = el('figure', 'shot');
      if (slot && slot.size === 'wide') figure.classList.add('shot--wide');
      if (slot && slot.size === 'tall') figure.classList.add('shot--tall');

      if (!src) {
        figure.appendChild(placeholder(label));
        frag.appendChild(figure);
        return;
      }

      var index = shots.length;
      shots.push({ src: src, label: label, alt: (slot.alt || label) });
      filledCount++;

      var btn = el('button', 'shot__btn');
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Enlarge: ' + label);
      btn.dataset.index = String(index);

      var img = el('img', 'shot__img');
      img.src = src;
      img.alt = slot.alt || label;
      img.decoding = 'async';
      // The first couple of shots are above the fold on most screens.
      if (i > 1) img.loading = 'lazy';

      /* A typo'd filename should degrade to the placeholder treatment rather
         than leaving a broken-image icon in a luxury listing. */
      img.addEventListener('error', function () {
        var slotIdx = shots.findIndex(function (s) { return s.src === src; });
        if (slotIdx !== -1) shots[slotIdx].broken = true;
        figure.innerHTML = '';
        figure.appendChild(placeholder(label + ' — file not found'));
      });

      var cap = el('figcaption', 'shot__cap');
      cap.textContent = label;

      btn.appendChild(img);
      btn.appendChild(cap);
      figure.appendChild(btn);
      frag.appendChild(figure);
    });

    grid.appendChild(frag);

    var note = document.getElementById('gallery-status');
    if (note) {
      if (filledCount === 0) {
        note.textContent =
          'Professional photography is being scheduled. ' + slots.length +
          ' frames are reserved below — each will be filled with the shot named on it.';
      } else if (filledCount < slots.length) {
        note.textContent =
          filledCount + ' of ' + slots.length + ' frames photographed. ' +
          'Remaining slots show the shot still to come.';
      } else {
        note.textContent = filledCount + ' photographs.';
      }
    }
  }

  /* -------------------------------------------------------------- lightbox */

  function initLightbox() {
    var box = document.getElementById('lightbox');
    if (!box || shots.length === 0) return;

    var img = box.querySelector('.lightbox__img');
    var cap = box.querySelector('.lightbox__cap');
    var count = box.querySelector('.lightbox__count');
    var btnPrev = box.querySelector('[data-lb="prev"]');
    var btnNext = box.querySelector('[data-lb="next"]');
    var btnClose = box.querySelector('[data-lb="close"]');
    var current = 0;
    var lastFocused = null;

    function show(i) {
      var total = shots.length;
      current = (i + total) % total;
      var shot = shots[current];
      img.src = shot.src;
      img.alt = shot.alt;
      cap.textContent = shot.label;
      count.textContent = (current + 1) + ' / ' + total;
    }

    function open(i) {
      lastFocused = document.activeElement;
      show(i);
      box.hidden = false;
      document.body.style.overflow = 'hidden';
      btnClose.focus();
    }

    function close() {
      box.hidden = true;
      document.body.style.overflow = '';
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    grid.addEventListener('click', function (e) {
      var btn = e.target.closest('.shot__btn');
      if (!btn) return;
      open(Number(btn.dataset.index));
    });

    btnPrev.addEventListener('click', function () { show(current - 1); });
    btnNext.addEventListener('click', function () { show(current + 1); });
    btnClose.addEventListener('click', close);

    // Click the backdrop (but not the image or the controls) to dismiss.
    box.addEventListener('click', function (e) {
      if (e.target === box) close();
    });

    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;

      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowLeft') { show(current - 1); return; }
      if (e.key === 'ArrowRight') { show(current + 1); return; }

      /* Keep Tab inside the dialog while it is open. */
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

  build();
  initLightbox();
})();
