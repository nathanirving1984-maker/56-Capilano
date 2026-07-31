/* ==========================================================================
   Site-wide behaviour: scroll reveal + the contact form's mailto composer.
   Loaded on all four pages. Everything here is progressive — with JS off the
   pages still read and every link still works.
   ========================================================================== */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --------------------------------------------------------- scroll reveal */

  function initReveal() {
    var targets = document.querySelectorAll('.reveal');
    if (!targets.length) return;

    /* No IntersectionObserver, or the visitor asked for less motion: leave the
       content in its finished state and never add the hiding class. */
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    document.documentElement.classList.add('js-reveal');

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    targets.forEach(function (target) { observer.observe(target); });
  }

  /* ----------------------------------------------------- contact form → mail

     No backend is available on GitHub Pages, so the form composes a message in
     the visitor's own mail client. If a real form handler is ever wired up,
     give the <form> an `action` attribute and this handler stands down. */

  var MAX_BODY = 1500; // mailto: URLs get unreliable past roughly 2,000 chars.

  function initForm() {
    var form = document.getElementById('inquiry');
    if (!form) return;

    // A configured endpoint wins; let the browser post it normally.
    if (form.getAttribute('action')) return;

    var status = document.getElementById('form-status');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = (form.elements.name.value || '').trim();
      var email = (form.elements.email.value || '').trim();
      var message = (form.elements.message.value || '').trim();

      var to = form.dataset.to || '';
      var cc = form.dataset.cc || '';
      var subject = form.dataset.subject || '56 Capilano Drive - Private Showing Request';

      var body =
        'Name: ' + name + '\n' +
        'Email: ' + email + '\n\n' +
        message + '\n\n' +
        '--\n' +
        'Sent from the 56 Capilano Drive listing site\n' +
        '56 Capilano Drive, Novato, CA 94949 - MLS# 326044403';

      if (body.length > MAX_BODY) body = body.slice(0, MAX_BODY) + '\n[message truncated]';

      var href = 'mailto:' + encodeURIComponent(to) +
        '?subject=' + encodeURIComponent(subject) +
        (cc ? '&cc=' + encodeURIComponent(cc) : '') +
        '&body=' + encodeURIComponent(body);

      window.location.href = href;

      if (status) {
        status.textContent = 'Opening your mail application…';
        window.setTimeout(function () {
          status.textContent = 'No mail window? Write to ' + to + ' directly.';
        }, 4000);
      }
    });
  }

  initReveal();
  initForm();
})();
