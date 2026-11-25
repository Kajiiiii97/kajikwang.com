// about + contact: soft reveals, a timeline line that fills as you scroll, and the contact toys
(function () {
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  function flag() { document.body.classList.toggle('scrolled', window.scrollY > 20); }
  window.addEventListener('scroll', flag, { passive: true }); flag();

  // the header height drives the screen sizes
  var hdr = document.querySelector('.pg2 > .wrap');
  function hh() { if (hdr) document.documentElement.style.setProperty('--hh', hdr.getBoundingClientRect().height + 'px'); }
  hh(); window.addEventListener('resize', hh);

  // reveal: things drift up softly, one after another
  var blk = document.querySelectorAll('.blk');
  var items = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  if (hasIO && !calm) {
    var batch = [], timer = null;
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { batch.push(e.target); ro.unobserve(e.target); } });
      if (timer) return;
      timer = requestAnimationFrame(function () {
        timer = null;
        batch.sort(function (a, b) { var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return (ra.top - rb.top) || (ra.left - rb.left); });
        batch.forEach(function (t, n) {
          t.style.transitionDelay = Math.min(n, 8) * 90 + 'ms';
          t.classList.add('in');
          setTimeout(function () { t.style.transitionDelay = ''; }, 1600 + n * 90);
        });
        batch = [];
      });
    }, { threshold: 0.15 });
    items.forEach(function (t) { ro.observe(t); });
    requestAnimationFrame(function () { blk.forEach(function (b) { b.classList.add('in'); }); });
  } else {
    items.forEach(function (t) { t.classList.add('in'); });
    blk.forEach(function (b) { b.classList.add('in'); });
  }

  // videos play only while visible
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

  // timeline: the pink line grows with your scroll and lights up each dot it reaches
  var wrap = document.querySelector('.tlwrap');
  if (wrap) {
    var fill = wrap.querySelector('.fill');
    var evs = Array.prototype.slice.call(wrap.querySelectorAll('.ev'));
    var cur = 0, target = 0, raf = null;
    function measure() {
      var r = wrap.getBoundingClientRect();
      var reach = window.innerHeight * 0.6 - r.top;
      target = Math.max(0, Math.min(r.height, reach));
      if (calm) cur = target;
      if (!raf) raf = requestAnimationFrame(draw);
    }
    function draw() {
      cur += (target - cur) * 0.12;
      if (Math.abs(target - cur) < 0.5) cur = target;
      fill.style.height = cur.toFixed(1) + 'px';
      var top = wrap.getBoundingClientRect().top;
      evs.forEach(function (e) {
        var dot = e.getBoundingClientRect().top - top + 34;
        e.classList.toggle('lit', dot <= cur);
      });
      raf = cur === target ? null : requestAnimationFrame(draw);
    }
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    measure();
  }

  // ---------- contact ----------
  // live clock in stuttgart, with a guess at what kaji is up to
  var timeEl = document.getElementById('time');
  if (timeEl) {
    var moodEl = document.getElementById('mood'), diffEl = document.getElementById('diff');
    var moods = [[0, 'probably asleep'], [7, 'coffee first'], [9, 'in the lab'], [12, 'lunch break'], [13, 'in the workshop'], [18, 'probably still in the workshop'], [21, 'winding down'], [23, 'probably asleep']];
    function parts(tz) {
      var f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
      var p = {}; f.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      return { h: +p.hour, m: +p.minute };
    }
    function offset(tz) {
      var d = new Date(), a = new Date(d.toLocaleString('en-US', { timeZone: tz })), b = new Date(d.toLocaleString('en-US'));
      return Math.round((a - b) / 36e5 * 2) / 2;
    }
    function tick() {
      var s;
      try { s = parts('Europe/Berlin'); } catch (e) { return; }
      timeEl.innerHTML = String(s.h).padStart(2, '0') + '<span class="colon">:</span>' + String(s.m).padStart(2, '0');
      var m = moods[0][1];
      moods.forEach(function (x) { if (s.h >= x[0]) m = x[1]; });
      moodEl.textContent = m;
      var d = offset('Europe/Berlin');
      diffEl.textContent = d === 0 ? 'same time as you' : (Math.abs(d) + (Math.abs(d) === 1 ? ' hour ' : ' hours ') + (d > 0 ? 'ahead of you' : 'behind you'));
    }
    tick(); setInterval(tick, 15000);
  }

  // tap to copy the email address
  var copy = document.getElementById('copy');
  if (copy) {
    var hint = document.getElementById('copyhint'), t0 = null;
    copy.addEventListener('click', function () {
      var mail = copy.getAttribute('data-mail');
      function ok() {
        copy.classList.add('done'); hint.textContent = 'copied ✓';
        clearTimeout(t0); t0 = setTimeout(function () { copy.classList.remove('done'); hint.textContent = 'tap to copy'; }, 2200);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(mail).then(ok, function () { location.href = 'mailto:' + mail; });
      else location.href = 'mailto:' + mail;
    });
  }

  // the fill-in-the-blanks message: blanks grow with what you type, chips drop into the sentence
  var form = document.getElementById('mad');
  if (form) {
    var topic = document.getElementById('topic');
    var sizer = document.createElement('span');
    sizer.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font:inherit';
    form.appendChild(sizer);
    function grow(inp) {
      sizer.style.font = getComputedStyle(inp).font;
      sizer.textContent = inp.value || inp.placeholder;
      inp.style.width = Math.max(3, sizer.getBoundingClientRect().width + 6) + 'px';
    }
    form.querySelectorAll('.blank input').forEach(function (inp) { grow(inp); inp.addEventListener('input', function () { grow(inp); }); });
    window.addEventListener('resize', function () { form.querySelectorAll('.blank input').forEach(grow); });
    var chips = form.querySelectorAll('.chips button');
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        chips.forEach(function (x) { x.classList.toggle('on', x === c); });
        topic.textContent = c.getAttribute('data-t');
        topic.classList.add('set');
        topic.classList.remove('swap'); void topic.offsetWidth; topic.classList.add('swap');
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim(), from = form.elements.from.value.trim(), more = form.elements.more.value.trim();
      var t = topic.classList.contains('set') ? topic.textContent : 'something';
      var subject = name ? 'Hello from ' + name : 'Hello from your website';
      var body = 'Hi Kaji,\n\nI\'m ' + (name || '...') + (from ? ' from ' + from : '') + ', and I\'d like to talk about ' + t + '.' + (more ? '\n\n' + more : '') + '\n';
      location.href = 'mailto:kajikwang@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }
})();
