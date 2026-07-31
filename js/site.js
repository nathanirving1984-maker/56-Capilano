/* ==========================================================================
   Site-wide behaviour, shared by all four pages.

   Everything here is progressive. With JavaScript off the pages still read,
   every photograph still loads, and every link still works.
   ========================================================================== */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------- missing-photo art

     Slots are authored as plain <img src="images/…" data-label="…">, so the
     hero paints with no JS and no manifest round-trip. If a file is not in
     the repository yet, swap it for a labelled placeholder frame rather than
     leaving a broken-image icon on a listing at this price.

     'error' does not bubble, so this listens in the capture phase — one
     listener covers every image on the page, including any added later. */

  function placeholderFor(img) {
    var label = img.getAttribute('data-label') ||
                img.getAttribute('alt') ||
                'Photograph to follow';

    var ph = document.createElement('div');
    ph.className = 'ph';

    var text = document.createElement('p');
    text.className = 'ph__label';
    text.textContent = label;

    ph.appendChild(text);
    return ph;
  }

  function swap(img) {
    if (img.dataset.swapped) return;
    img.dataset.swapped = '1';
    if (img.parentNode) img.parentNode.replaceChild(placeholderFor(img), img);
  }

  /* An <img> with no src (the lightbox's, before a photo is chosen) is not a
     missing photograph and must never be swapped out — doing so would delete
     the element the lightbox writes into. */
  function isSlot(img) {
    return img && img.tagName === 'IMG' && !!img.getAttribute('src');
  }

  document.addEventListener('error', function (e) {
    if (isSlot(e.target)) swap(e.target);
  }, true);

  /* Fade each photograph in once it has actually decoded. */
  function markLoaded(img) { img.classList.add('is-loaded'); }

  /* This script is deferred, so images that 404 while the HTML was still
     parsing have already fired their error event — the listener above never
     sees them. Sweep for those on init: complete with zero natural width is
     a load that failed. */
  function initImages() {
    Array.prototype.forEach.call(document.images, function (img) {
      if (img.dataset.swapped || !isSlot(img)) return;

      if (img.complete) {
        if (img.naturalWidth === 0) swap(img);
        else markLoaded(img);
        return;
      }

      img.addEventListener('load', function () { markLoaded(img); });
    });
  }

  /* ------------------------------------------------------------ nav over hero

     On the About page the bar dissolves over the aerial and resolves into
     blurred paper once the visitor scrolls past it. */

  function initNav() {
    var nav = document.querySelector('.nav');
    var hero = document.querySelector('.hero');
    if (!nav || !hero) return;

    function sync() {
      var past = window.scrollY > 60;
      nav.classList.toggle('is-over-hero', !past);
    }

    sync();
    window.addEventListener('scroll', sync, { passive: true });
  }

  /* --------------------------------------------------------- scroll reveal */

  function initReveal() {
    var targets = document.querySelectorAll('.rise, .horizon');
    if (!targets.length) return;

    /* Reduced motion, or no observer support: never add the hiding class, so
       the content simply sits in its finished state. */
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    document.documentElement.classList.add('js-motion');

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });

    Array.prototype.forEach.call(targets, function (t) { io.observe(t); });
  }

  /* ----------------------------------------------------- contact form → mail

     No backend on GitHub Pages, so the form composes a message in the
     visitor's own mail client. Give the <form> an `action` attribute later
     and this handler stands down automatically. */

  var MAX_BODY = 1500; // mailto: URLs get unreliable past roughly 2,000 chars.

  function initForm() {
    var form = document.getElementById('inquiry');
    if (!form || form.getAttribute('action')) return;

    var status = document.getElementById('form-status');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = (form.elements.name.value || '').trim();
      var email = (form.elements.email.value || '').trim();
      var message = (form.elements.message.value || '').trim();

      var to = form.dataset.to || '';
      var cc = form.dataset.cc || '';
      var subject = form.dataset.subject ||
        '56 Capilano Drive - Private Showing Request';

      var body =
        'Name: ' + name + '\n' +
        'Email: ' + email + '\n\n' +
        message + '\n\n' +
        '--\n' +
        'Sent from the 56 Capilano Drive listing site\n' +
        '56 Capilano Drive, Novato, CA 94949 - MLS# 326044403';

      if (body.length > MAX_BODY) {
        body = body.slice(0, MAX_BODY) + '\n[message truncated]';
      }

      window.location.href = 'mailto:' + encodeURIComponent(to) +
        '?subject=' + encodeURIComponent(subject) +
        (cc ? '&cc=' + encodeURIComponent(cc) : '') +
        '&body=' + encodeURIComponent(body);

      if (status) {
        status.textContent = 'Opening your mail application…';
        window.setTimeout(function () {
          status.textContent = 'No mail window? Write to ' + to + ' directly.';
        }, 4000);
      }
    });
  }

  /* ------------------------------------------------------- manifest loader

     Shared with js/gallery.js. Returns a promise for the parsed manifest.
     NOTE: fetch() is blocked on file:// URLs, so opening these pages by
     double-clicking will reject here — serve the folder over http to
     preview the gallery locally. */

  window.Manifest = {
    load: function () {
      if (!this._p) {
        this._p = fetch('images/manifest.json', { cache: 'no-cache' })
          .then(function (r) {
            if (!r.ok) throw new Error('manifest ' + r.status);
            return r.json();
          });
      }
      return this._p;
    }
  };

  initImages();
  initNav();
  initReveal();
  initForm();
})();
