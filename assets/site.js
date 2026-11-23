// project filter on the home page: tiles that don't match fade out,
// the rest slide into the new grid (FLIP animation)
(function () {
  var grid = document.querySelector('.bento');
  var btns = document.querySelectorAll('.filters button');
  if (!grid || !btns.length) return;
  var tiles = Array.prototype.slice.call(grid.querySelectorAll('.tile'));
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var busy = false;

  function fits(t, f) { return f === 'all' || t.getAttribute('data-cat') === f; }
  function reset(t) {
    t.style.transition = ''; t.style.transform = ''; t.style.opacity = ''; t.style.transformOrigin = '';
  }

  function apply(f) {
    if (busy) return;
    tiles.forEach(function (t) { t.classList.add('in'); t.style.transitionDelay = ''; });
    var leaving = tiles.filter(function (t) { return !t.hidden && !fits(t, f); });
    var entering = tiles.filter(function (t) { return t.hidden && fits(t, f); });
    var first = new Map();
    tiles.forEach(function (t) { if (!t.hidden) first.set(t, t.getBoundingClientRect()); });

    if (calm) {
      tiles.forEach(function (t) { t.hidden = !fits(t, f); });
      grid.classList.toggle('filtered', f !== 'all');
      return;
    }
    busy = true;

    // 1. fade out the tiles that are leaving
    leaving.forEach(function (t) {
      t.style.transition = 'opacity .28s ease, transform .28s ease';
      t.style.opacity = '0';
      t.style.transform = 'scale(.96)';
    });

    setTimeout(function () {
      // 2. switch layout
      leaving.forEach(function (t) { t.hidden = true; reset(t); });
      entering.forEach(function (t) { t.hidden = false; });
      grid.classList.toggle('filtered', f !== 'all');

      // 3. move every visible tile back to where it was, without animating
      var shown = tiles.filter(function (t) { return !t.hidden; });
      shown.forEach(function (t) {
        var b = t.getBoundingClientRect();
        var a = first.get(t);
        t.style.transition = 'none';
        t.style.transformOrigin = '0 0';
        if (a) {
          t.style.transform = 'translate(' + (a.left - b.left) + 'px,' + (a.top - b.top) + 'px) scale(' + (a.width / b.width) + ',' + (a.height / b.height) + ')';
        } else {
          t.style.opacity = '0';
          t.style.transform = 'translateY(16px) scale(.97)';
        }
      });

      // 4. let them slide into the new grid
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          shown.forEach(function (t, k) {
            var late = first.has(t) ? 0 : 120 + Math.min(k, 10) * 30;
            t.style.transition = 'transform .6s cubic-bezier(.2,.75,.25,1) ' + late + 'ms, opacity .45s ease ' + late + 'ms';
            t.style.transform = '';
            t.style.opacity = '';
          });
          setTimeout(function () { shown.forEach(reset); busy = false; }, 1100);
        });
      });
    }, leaving.length ? 280 : 0);
  }

  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      if (busy || b.classList.contains('on')) return;
      btns.forEach(function (x) { x.classList.toggle('on', x === b); });
      var f = b.getAttribute('data-f');
      var n = document.getElementById('count');
      if (n) n.textContent = tiles.filter(function (t) { return fits(t, f); }).length;
      apply(f);
    });
  });
})();

// simple image viewer on project pages
(function () {
  var lb = document.querySelector('dialog.lb');
  if (!lb || !lb.showModal) return;
  var imgs = Array.prototype.slice.call(document.querySelectorAll('[data-full]'));
  var view = lb.querySelector('img');
  var i = 0;
  function show(n) {
    i = (n + imgs.length) % imgs.length;
    view.src = imgs[i].getAttribute('data-full');
    view.alt = imgs[i].alt;
  }
  imgs.forEach(function (im, n) {
    im.addEventListener('click', function () { show(n); lb.showModal(); });
  });
  lb.querySelector('.lbx').addEventListener('click', function () { lb.close(); });
  lb.querySelector('.lbp').addEventListener('click', function () { show(i - 1); });
  lb.querySelector('.lbn').addEventListener('click', function () { show(i + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.open) return;
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
  });
})();

// back button on project pages: return to the project you were last looking at on the front page
(function () {
  var b = document.querySelector('a.back');
  if (!b) return;
  try {
    var at = sessionStorage.getItem('kaji-at');
    if (at && /^p-[\w-]+$/.test(at)) b.href = b.href.split('#')[0] + '#' + at;
  } catch (e) {}
})();
