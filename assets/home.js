// front page motion: everything eases slowly towards its target, nothing jumps
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var narrow = window.matchMedia('(max-width: 820px)');
  var hasIO = 'IntersectionObserver' in window;

  // header line appears once you leave the top
  function flag() { document.body.classList.toggle('scrolled', window.scrollY > 20); }
  window.addEventListener('scroll', flag, { passive: true }); flag();

  // play videos only while they are on screen
  var vids = document.querySelectorAll('video');
  if (hasIO) {
    var vo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && !calm) { if (v.preload === 'none') v.preload = 'auto'; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.2 });
    vids.forEach(function (v) { vo.observe(v); });
  }

  // project screens: tiles fade up one after another when a screen comes into view
  var projs = Array.prototype.slice.call(document.querySelectorAll('.proj'));
  if (hasIO && !calm) {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var s = e.target;
        s.classList.add('seen');
        var tiles = Array.prototype.slice.call(s.querySelectorAll('.rv'));
        tiles.sort(function (a, b) {
          var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
          return (ra.top - rb.top) || (ra.left - rb.left);
        });
        tiles.forEach(function (t, n) {
          t.style.transitionDelay = Math.min(n, 8) * 90 + 'ms';
          t.classList.add('in');
          setTimeout(function () { t.style.transitionDelay = ''; }, 1600 + n * 90);
        });
        ro.unobserve(s);
      });
    }, { threshold: 0.18 });
    projs.forEach(function (s) { ro.observe(s); });
  } else {
    projs.forEach(function (s) { s.classList.add('seen'); });
    document.querySelectorAll('.rv').forEach(function (t) { t.classList.add('in'); });
  }

  // sidebar: highlight the project you are on
  var links = {};
  document.querySelectorAll('.slist a').forEach(function (a) { links[a.getAttribute('data-t')] = a; });
  var cur = document.querySelector('.slist .cur');
  var list = document.querySelector('.slist');
  // which project is on screen: measured directly from the layout, so it is right in every browser and frame
  var activeId = null;
  function markActive() {
    var hh = document.querySelector('.home2 > .wrap').getBoundingClientRect().height;
    var line = hh + (window.innerHeight - hh) * 0.5, id = 'cover';
    for (var i = 0; i < projs.length; i++) {
      var p = projs[i];
      if (p.classList.contains('gone')) continue;
      var r = p.getBoundingClientRect();
      if (r.top <= line && r.bottom > line) { id = p.id; break; }
    }
    if (id === activeId) return;
    activeId = id;
    setGlow(id === 'cover' ? null : document.getElementById(id));
    try { sessionStorage.setItem('kaji-at', id); } catch (err) {}
    Object.keys(links).forEach(function (k) { links[k].classList.toggle('on', k === id); });
    var a = links[id];
    if (a && !narrow.matches) {
      var box = a.closest('.side');
      var r2 = a.getBoundingClientRect(), b = box.getBoundingClientRect();
      if (r2.top < b.top + 120 || r2.bottom > b.bottom - 20) box.scrollTo({ top: box.scrollTop + r2.top - b.top - b.height / 2, behavior: 'smooth' });
    }
  }
  // the glow behind the glass card: the project's own colour, centred on its card,
  // feathered out to the edges of the tiles. two layers so one colour can fade into the next
  var glows = Array.prototype.slice.call(document.querySelectorAll('.glow')), gi = 0, glowFor = null;
  function glowCss(sec) {
    var c = sec.getAttribute('data-glow'); if (!c) return '';
    var hdr = document.querySelector('.home2 > .wrap').getBoundingClientRect().height;
    var pt = sec.querySelector('.pt'), area = sec.querySelector('.pg') || sec;
    var r = pt.getBoundingClientRect(), s = sec.getBoundingClientRect(), a = area.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = hdr + (r.top - s.top) + r.height / 2;
    var rx = Math.max(320, a.width * 0.56), ry = Math.max(260, (window.innerHeight - hdr) * 0.52);
    var core = Math.min(200, r.width * 0.42) / rx * 60;
    var fall = [[0, 1], [.12, .9], [.25, .74], [.40, .52], [.55, .33], [.70, .18], [.84, .07], [1, 0]];
    var stops = ['rgba(' + c + ',1) 0%', 'rgba(' + c + ',1) ' + core.toFixed(1) + '%'];
    fall.forEach(function (f) { stops.push('rgba(' + c + ',' + f[1] + ') ' + (core + (100 - core) * f[0]).toFixed(1) + '%'); });
    return 'radial-gradient(ellipse ' + rx.toFixed(0) + 'px ' + ry.toFixed(0) + 'px at ' + cx.toFixed(0) + 'px ' + cy.toFixed(0) + 'px, ' + stops.join(', ') + ')';
  }
  function setGlow(sec) {
    if (glows.length < 2) return;
    glowFor = sec;
    if (!sec) { glows.forEach(function (g) { g.classList.remove('on'); }); return; }
    var next = glows[gi ^ 1];
    next.style.background = glowCss(sec);
    next.classList.add('on'); glows[gi].classList.remove('on'); gi ^= 1;
  }
  window.addEventListener('resize', function () { if (glowFor) glows[gi].style.background = glowCss(glowFor); });

  var markQ = null;
  window.addEventListener('scroll', function () { if (!markQ) markQ = requestAnimationFrame(function () { markQ = null; markActive(); }); }, { passive: true });
  window.addEventListener('resize', markActive);

  // on a phone the list folds away after you pick a project
  if (list) list.open = true;
  // phone menu: the project list slides down as a soft sheet
  var mbtn = document.querySelector('.mbtn');
  function menu(on) {
    document.body.classList.toggle('menu-open', on);
    if (mbtn) { mbtn.setAttribute('aria-expanded', on ? 'true' : 'false'); mbtn.querySelector('.ml').textContent = on ? 'close' : 'menu'; }
  }
  if (mbtn) mbtn.addEventListener('click', function () { menu(!document.body.classList.contains('menu-open')); });
  document.querySelectorAll('.slist a, .snav a').forEach(function (a) { a.addEventListener('click', function () { menu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') menu(false); });
  if (narrow.addEventListener) narrow.addEventListener('change', function () { if (!narrow.matches) menu(false); });

  // sidebar filters: other projects fade out and fold away
  var btns = document.querySelectorAll('.sfilt button');
  var count = document.getElementById('count');
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.classList.contains('on')) return;
      var f = b.getAttribute('data-f');
      btns.forEach(function (x) { x.classList.toggle('on', x === b); });
      var shown = 0;
      document.querySelectorAll('.slist li').forEach(function (li) {
        var ok = f === 'all' || li.getAttribute('data-cat') === f;
        li.classList.toggle('gone', !ok);
        if (ok) shown++;
      });
      if (count) count.textContent = shown;
      projs.forEach(function (s) {
        var ok = f === 'all' || s.getAttribute('data-cat') === f;
        if (ok) { s.classList.remove('gone'); requestAnimationFrame(function () { s.classList.remove('fading'); }); }
        else s.classList.add('fading');
      });
      setTimeout(function () {
        projs.forEach(function (s) { if (s.classList.contains('fading')) s.classList.add('gone'); });
        var works = document.getElementById('work');
        if (works && window.scrollY > works.offsetTop - 200) {
          if (narrow.matches) works.scrollIntoView({ behavior: calm ? 'auto' : 'smooth' });
          else pageTo(1);
        }
      }, calm ? 0 : 600);
    });
  });

  // where to land: a project link from a project page's back button, or the project you were on
  // when you went back/forward or reloaded. we place it ourselves instead of trusting the browser
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  var navType = '';
  try { navType = performance.getEntriesByType('navigation')[0].type; } catch (err) {}
  var landId = null;
  if (/^#p-[\w-]+$/.test(location.hash)) landId = location.hash.slice(1);
  else if (navType === 'back_forward' || navType === 'reload') { try { landId = sessionStorage.getItem('kaji-at'); } catch (err) {} }
  var landEl = landId && /^p-[\w-]+$/.test(landId) && document.getElementById(landId);
  if (landEl) {
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, Math.round(landEl.getBoundingClientRect().top + window.scrollY - document.querySelector('.home2 > .wrap').getBoundingClientRect().height));
    requestAnimationFrame(function () { root.style.scrollBehavior = ''; });
  }
  if (location.hash) { try { history.replaceState(null, '', location.pathname + location.search); } catch (err) {} }
  markActive();
  // pages restored from the back/forward cache keep their place; just re-sync the sidebar
  window.addEventListener('pageshow', function (e) { if (e.persisted) { activeId = null; markActive(); } });

  // as you scroll, the screen you are leaving fades back and the next one fades forward
  var fading = null;
  function veil() {
    fading = null;
    if (calm) return;
    var hh = headH || 83, vh = window.innerHeight - hh;
    projs.forEach(function (s) {
      if (s.classList.contains('gone')) return;
      var g = s.firstElementChild;
      var d = (s.getBoundingClientRect().top - hh) / vh;
      var a = Math.min(1, Math.abs(d));
      if (a >= 1) { if (g.style.opacity !== '0') { g.style.opacity = '0'; g.style.transform = ''; } return; }
      var k = a * a * (3 - 2 * a);
      g.style.opacity = (1 - k * 0.92).toFixed(3);
      g.style.transform = 'translateY(' + (d * -6).toFixed(1) + 'vh) scale(' + (1 - 0.035 * k).toFixed(4) + ')';
    });
  }
  function clearVeil() { projs.forEach(function (s) { s.firstElementChild.style.opacity = ''; s.firstElementChild.style.transform = ''; }); }
  function queueVeil() { if (!fading) fading = requestAnimationFrame(veil); }
  window.addEventListener('scroll', queueVeil, { passive: true });
  window.addEventListener('resize', queueVeil);
  btns.forEach(function (b) { b.addEventListener('click', function () { setTimeout(queueVeil, 650); setTimeout(queueVeil, 1400); }); });
  veil();

  // paging: on a big screen every scroll gesture glides exactly one screen, never stopping in between
  var headH = 83, anim = null, lastT = -1e9, lastD = 0, held = false, settleT = null;
  function measureHead() { var h = document.querySelector('.home2 > .wrap'); headH = h ? h.getBoundingClientRect().height : 83; root.style.setProperty('--hh', headH + 'px'); }
  measureHead();
  function stops() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var s = [0];
    projs.forEach(function (p) {
      if (!p.classList.contains('gone')) s.push(Math.min(max, Math.round(p.getBoundingClientRect().top + window.scrollY - headH)));
    });
    s.push(max);
    return s.filter(function (v, i) { return i === 0 || v - s[i - 1] > 4; });
  }
  function nearest(s) {
    var y = window.scrollY, best = 0;
    s.forEach(function (v, i) { if (Math.abs(v - y) < Math.abs(s[best] - y)) best = i; });
    return best;
  }
  function soft(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  function glide(y) {
    if (anim) cancelAnimationFrame(anim.raf);
    var from = window.scrollY, dist = y - from;
    if (Math.abs(dist) < 2) { anim = null; return; }
    if (calm) { window.scrollTo(0, y); anim = null; return; }
    var dur = Math.max(900, Math.min(1500, 900 + (Math.abs(dist) - 822) * 0.3));
    var t0 = performance.now();
    anim = { raf: 0 };
    (function tick(now) {
      var p = Math.min(1, (now - t0) / dur);
      window.scrollTo(0, from + dist * soft(p));
      if (p < 1) anim.raf = requestAnimationFrame(tick);
      else anim = null;
    })(t0);
  }
  function pageTo(i) { var s = stops(); glide(s[Math.max(0, Math.min(s.length - 1, i))]); }
  function step(dir) { var s = stops(); var i = nearest(s); if (dir > 0 && s[i] < window.scrollY - 4) i--; if (dir < 0 && s[i] > window.scrollY + 4) i++; pageTo(i + dir); }
  function paging() { return !narrow.matches && document.querySelector('.zoom[hidden]') !== null; }
  window.addEventListener('wheel', function (e) {
    if (narrow.matches || e.ctrlKey || !document.querySelector('.zoom[hidden]')) return;
    var dy = e.deltaY * (e.deltaMode === 1 ? 16 : 1), dx = e.deltaX;
    if (Math.abs(dx) > Math.abs(dy)) return;
    var side = e.target.closest && e.target.closest('.side');
    if (side && side.scrollHeight > side.clientHeight + 2) return;
    // the cover scrolls freely; paging only starts once you are in the projects
    var first = stops()[1], y = window.scrollY;
    if (!anim && ((dy > 0 && y < first - 2) || (dy < 0 && y <= first + 2))) { lastT = e.timeStamp; lastD = Math.abs(dy); return; }
    e.preventDefault();
    var d = Math.abs(dy), now = e.timeStamp;
    // a new gesture starts after a short pause, or when the push gets clearly stronger than the fading glide
    var fresh = now - lastT > 220 || (!anim && d > lastD * 1.6 && d > 12);
    lastT = now; lastD = d;
    if (!fresh || anim || d < 2) return;
    step(dy > 0 ? 1 : -1);
  }, { passive: false });
  document.addEventListener('keydown', function (e) {
    if (!paging() || e.altKey || e.ctrlKey || e.metaKey) return;
    var t = e.target, tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
    var dir = 0;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey && tag !== 'BUTTON')) dir = 1;
    if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey && tag !== 'BUTTON')) dir = -1;
    if (e.key === 'Home') { e.preventDefault(); pageTo(0); return; }
    if (e.key === 'End') { e.preventDefault(); pageTo(1e3); return; }
    if (dir) { e.preventDefault(); if (!anim) step(dir); }
  });
  // links to a project (sidebar, cover tiles) glide there too
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#p-"], a[href="#work"]');
    if (!a || narrow.matches) return;
    var el = document.getElementById(a.getAttribute('href').slice(1));
    if (!el) return;
    e.preventDefault();
    glide(Math.round(el.getBoundingClientRect().top + window.scrollY - headH));
  });
  // if anything else leaves the page between two screens (scrollbar drag, find in page), ease to the closest one
  window.addEventListener('mousedown', function () { held = true; });
  window.addEventListener('mouseup', function () { held = false; settle(); });
  function settle() {
    clearTimeout(settleT);
    settleT = setTimeout(function () {
      if (anim || held || !paging()) return;
      var s = stops(), cy = window.scrollY;
      // resting on the cover is fine; only a half-arrived first project gets eased into place
      if (cy < s[1] - 2) { if (!goingUp && cy > s[1] - window.innerHeight * 0.45) glide(s[1]); return; }
      var y = s[nearest(s)];
      if (Math.abs(y - cy) > 2) glide(y);
    }, 180);
  }
  var prevY = window.scrollY, goingUp = false;
  window.addEventListener('scroll', function () {
    var y = window.scrollY; if (y !== prevY) goingUp = y < prevY; prevY = y;
    if (!anim) settle();
  }, { passive: true });
  window.addEventListener('resize', function () { measureHead(); settle(); });

  // image viewer: the photo lifts out of its tile and settles in the middle, the page stays behind it
  var zoom = document.querySelector('.zoom');
  if (zoom) {
    var zbg = zoom.querySelector('.zbg'), zcap = zoom.querySelector('.zcap');
    var zt = zoom.querySelector('.zt'), zgo = zoom.querySelector('.zgo');
    var tile = null, media = null, busy = false, lastFocus = null;
    function place(el, r) { el.style.left = r.left + 'px'; el.style.top = r.top + 'px'; el.style.width = r.width + 'px'; el.style.height = r.height + 'px'; }
    function rectOf(t) { var r = t.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; }
    function fit(src) {
      var w = src.naturalWidth || src.videoWidth || 16, h = src.naturalHeight || src.videoHeight || 10;
      var mw = Math.min(window.innerWidth * (narrow.matches ? 0.94 : 0.84), 1500), mh = window.innerHeight - (narrow.matches ? 150 : 170);
      var sc = Math.min(mw / w, mh / h);
      var W = w * sc, H = h * sc;
      return { left: (window.innerWidth - W) / 2, top: Math.max(20, (window.innerHeight - H) / 2 - 22), width: W, height: H };
    }
    function open(t) {
      if (busy) return;
      var src = t.querySelector('img,video'); if (!src) return;
      busy = true; tile = t; lastFocus = document.activeElement;
      var sec = t.closest('.proj');
      zt.textContent = sec.querySelector('h2').textContent;
      zgo.href = sec.querySelector('.pgo').getAttribute('href');
      if (src.tagName === 'VIDEO') {
        media = document.createElement('video');
        media.muted = true; media.loop = true; media.playsInline = true; media.autoplay = true;
        media.src = src.currentSrc || src.src; media.poster = src.poster;
        try { media.currentTime = src.currentTime; } catch (e) {}
      } else {
        media = document.createElement('img');
        media.src = src.currentSrc || src.src; media.alt = src.alt;
      }
      media.className = 'zm';
      var from = rectOf(t), to = fit(src);
      place(media, from);
      zoom.insertBefore(media, zcap);
      zcap.style.top = (to.top + to.height + 16) + 'px';
      zoom.hidden = false;
      t.classList.add('lifted');
      media.getBoundingClientRect();
      requestAnimationFrame(function () {
        zoom.classList.add('open');
        place(media, to);
        setTimeout(function () { busy = false; }, 500);
      });
      zoom.focus && zoom.setAttribute('tabindex', '-1'); zoom.focus({ preventScroll: true });
    }
    function close() {
      if (zoom.hidden || busy) return;
      busy = true;
      zoom.classList.remove('open');
      place(media, rectOf(tile));
      setTimeout(function () {
        zoom.hidden = true;
        if (media && media.parentNode) media.parentNode.removeChild(media);
        tile.classList.remove('lifted');
        if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
        media = null; busy = false;
      }, calm ? 0 : 820);
    }
    document.querySelectorAll('.pi').forEach(function (t) {
      t.addEventListener('click', function (e) { e.preventDefault(); open(t); });
    });
    zbg.addEventListener('click', close);
    zoom.addEventListener('click', function (e) { if (e.target === media) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !zoom.hidden) close(); });
    // scrolling while it is open just closes it softly instead of moving the page
    function nudge(e) { if (!zoom.hidden) { e.preventDefault(); close(); } }
    window.addEventListener('wheel', nudge, { passive: false });
    window.addEventListener('touchmove', nudge, { passive: false });
    window.addEventListener('keydown', function (e) {
      if (!zoom.hidden && /^(ArrowUp|ArrowDown|PageUp|PageDown|Space| )$/.test(e.key)) { e.preventDefault(); close(); }
    });
    window.addEventListener('resize', function () { if (!zoom.hidden && media && !busy) { var to = fit(media); place(media, to); zcap.style.top = (to.top + to.height + 16) + 'px'; } });
  }

  // cover: tiles drift gently apart and fade, the title floats up
  var cover = document.querySelector('.cover');
  var cv = document.querySelector('.cv');
  if (!cover || !cv || calm) return;
  var tiles = Array.prototype.slice.call(cv.querySelectorAll('.ct:not(.title)'));
  var title = cv.querySelector('.title');
  var hint = document.querySelector('.hint');
  var dirs = [];
  function measure() {
    var c = cv.getBoundingClientRect();
    var cx = c.left + c.width / 2, cy = c.top + c.height / 2;
    dirs = tiles.map(function (t, i) {
      var r = t.getBoundingClientRect();
      var dx = r.left + r.width / 2 - cx, dy = r.top + r.height / 2 - cy;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      return { x: dx / len, y: dy / len, s: ((i * 37) % 7 - 3) * 0.6, w: 0.7 + ((i * 53) % 10) / 20 };
    });
  }
  var c0 = 0, target = 0, raf = null;
  function ease(p) { return p * p * (3 - 2 * p); }
  function draw() {
    c0 += (target - c0) * 0.075;
    if (Math.abs(target - c0) < 0.0005) c0 = target;
    var e = ease(Math.min(1, c0 * 1.15));
    tiles.forEach(function (t, i) {
      var d = dirs[i]; if (!d) return;
      var dist = Math.min(140, window.innerWidth * 0.16) * e * d.w;
      t.style.transform = 'translate(' + (d.x * dist).toFixed(1) + 'px,' + (d.y * dist).toFixed(1) + 'px) rotate(' + (d.s * e).toFixed(2) + 'deg) scale(' + (1 - 0.06 * e).toFixed(3) + ')';
      t.style.opacity = (1 - e).toFixed(3);
      t.style.pointerEvents = e > 0.6 ? 'none' : '';
    });
    if (title) {
      title.style.transform = 'translateY(' + (-36 * e).toFixed(1) + 'px) scale(' + (1 - 0.12 * e).toFixed(3) + ')';
      title.style.opacity = (1 - Math.max(0, e - 0.35) * 1.5).toFixed(3);
    }
    if (hint) hint.style.visibility = e > 0.25 ? 'hidden' : '';
    raf = c0 === target ? null : requestAnimationFrame(draw);
  }
  function onScroll() {
    var total = cover.offsetHeight - window.innerHeight * 0.6;
    target = Math.max(0, Math.min(1, window.scrollY / Math.max(1, total)));
    if (!raf) raf = requestAnimationFrame(draw);
  }
  function reset() {
    tiles.concat(title ? [title] : []).forEach(function (t) { t.style.transform = ''; t.style.opacity = ''; t.style.pointerEvents = ''; });
    c0 = target = 0;
  }
  measure();
  onScroll(); c0 = target;
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { reset(); measure(); onScroll(); });
  onScroll();
})();
