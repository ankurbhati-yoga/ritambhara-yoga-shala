(function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  function closeMenu() {
    if (!toggle || !nav) return;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = 'Menu';
    document.body.classList.remove('nav-open');
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var willOpen = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', willOpen);
      toggle.setAttribute('aria-expanded', String(willOpen));
      toggle.textContent = willOpen ? 'Close' : 'Menu';
      document.body.classList.toggle('nav-open', willOpen);
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 820) closeMenu();
    });
  }

  var select = document.getElementById('class-interest');
  if (select) {
    var requestedClass = new URLSearchParams(window.location.search).get('class');
    var optionExists = Array.from(select.options).some(function (option) {
      return option.value === requestedClass;
    });
    if (requestedClass && optionExists) select.value = requestedClass;
  }
}());

(function () {
  var carousel = document.querySelector('.class-carousel');
  if (!carousel) return;
  var viewport = carousel.querySelector('.class-slider-viewport');
  var slides = Array.from(viewport.querySelectorAll('.offering'));
  var choices = Array.from(carousel.querySelectorAll('[data-class-slide]'));
  var prev = carousel.querySelector('.class-slide-prev');
  var next = carousel.querySelector('.class-slide-next');
  var count = carousel.querySelector('.class-slide-count');
  var current = 0;
  var timer;
  function update(index) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    choices.forEach(function (button, i) { button.setAttribute('aria-pressed', String(i === current)); });
    prev.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    count.textContent = String(current + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
  }
  function go(index, instant) {
    update(index);
    viewport.scrollTo({ left: current * viewport.clientWidth, behavior: instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  choices.forEach(function (button, index) { button.addEventListener('click', function () { go(index); }); });
  prev.addEventListener('click', function () { go(current - 1); });
  next.addEventListener('click', function () { go(current + 1); });
  viewport.addEventListener('keydown', function (event) {
    if (event.target !== viewport) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      go(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  viewport.addEventListener('scroll', function () {
    clearTimeout(timer);
    timer = setTimeout(function () { update(Math.round(viewport.scrollLeft / viewport.clientWidth)); }, 120);
  }, { passive: true });
  window.addEventListener('resize', function () { go(current, true); });
  update(0);
}());
