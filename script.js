(() => {
  'use strict';
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const small = () => innerWidth < 860 || matchMedia('(pointer: coarse)').matches;
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];

  /* Mobile menu */
  const burger = document.getElementById('burger'), menu = document.getElementById('menu');
  $$('a', menu).forEach((a, i) => a.style.setProperty('--k', i));
  const setMenu = open => {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { setMenu(false); burger.focus(); } });

  /* Active nav state */
  if ('IntersectionObserver' in window) {
    const links = $$('a[href^="#"]', menu);
    const navObs = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(a => { const s = document.querySelector(a.getAttribute('href')); if (s) navObs.observe(s); });

    /* Scroll reveals: each group gets its own direction and stagger */
    const plan = [
      ['.sec>h2', 'up'], ['.prose>*', 'left', .09], ['.facts>div', 'right', .1],
      ['.skills>div', 'up', .08], ['.proj', 'clip', .15], ['.note', 'up'],
      ['.timeline>li', 'left', .09], ['.sub', 'up'], ['.certs>li', 'up', .08],
      ['.contact .big', 'up'], ['.contact .cta>*', 'up', .08]
    ];
    const items = [];
    plan.forEach(([sel, kind, step = 0]) => $$(sel).forEach((el, i) => {
      el.dataset.r = kind; el.style.setProperty('--d', (i * step).toFixed(2) + 's'); items.push(el);
    }));
    root.classList.add('js');
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -4% 0px', threshold: 0 });
    items.forEach(el => io.observe(el));
  }

  /* Pointer effects: fine pointers only. Card spotlight + gentle tilt, global light. */
  if (fine && !reduce) {
    let x = 0, y = 0, q = false;
    addEventListener('pointermove', e => {
      x = e.clientX; y = e.clientY;
      if (q) return; q = true;
      requestAnimationFrame(() => { root.style.setProperty('--mx', x + 'px'); root.style.setProperty('--my', y + 'px'); window.__px = { x, y }; q = false; });
    }, { passive: true });
    $$('.proj, .skills>div').forEach(c => {
      const tilt = c.classList.contains('proj');
      let f = 0;
      c.addEventListener('pointermove', e => {
        cancelAnimationFrame(f);
        f = requestAnimationFrame(() => {
          const r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
          c.style.setProperty('--px', (px * 100).toFixed(1) + '%'); c.style.setProperty('--py', (py * 100).toFixed(1) + '%');
          if (tilt) { c.style.setProperty('--ry', ((px - .5) * 2).toFixed(2) + 'deg'); c.style.setProperty('--rx', ((.5 - py) * 2).toFixed(2) + 'deg'); }
        });
      });
      c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
  }

  /* Canvas network background (optional). Nodes link to the pointer on desktop. */
  try {
    const cv = document.getElementById('bg'), ctx = cv.getContext('2d');
    if (!ctx) return;
    let w, h, dpr, nodes = [], link, raf = 0, running = false, last = 0, mobile = false;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const setup = () => {
      mobile = small();
      dpr = Math.min(devicePixelRatio || 1, mobile ? 1 : 1.5);
      w = innerWidth; h = innerHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(mobile ? 26 : 70, Math.round(w * h / (mobile ? 15000 : 20000)));
      link = mobile ? 110 : 150;
      nodes = Array.from({ length: n }, () => ({ x: rnd(0, w), y: rnd(0, h), vx: rnd(-.2, .2), vy: rnd(-.2, .2), c: Math.random() < .5 }));
      draw(0);
    };
    const draw = step => {
      ctx.clearRect(0, 0, w, h);
      const p = !mobile && window.__px;
      for (const n of nodes) {
        n.x += n.vx * step; n.y += n.vy * step;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
          if (d < link * link) {
            ctx.strokeStyle = `rgba(139,160,255,${(1 - Math.sqrt(d) / link) * .2})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        if (p) {
          const dx = a.x - p.x, dy = a.y - p.y, d = Math.hypot(dx, dy);
          if (d < 190) { ctx.strokeStyle = `rgba(79,216,255,${(1 - d / 190) * .5})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(p.x, p.y); ctx.stroke(); }
        }
      }
      for (const n of nodes) { ctx.fillStyle = n.c ? 'rgba(79,216,255,.7)' : 'rgba(139,123,255,.8)'; ctx.beginPath(); ctx.arc(n.x, n.y, 1.6, 0, 6.283); ctx.fill(); }
    };
    const loop = t => { if (!running) return; draw(Math.min((t - last) / 16.7, 3)); last = t; raf = requestAnimationFrame(loop); };
    const start = () => { if (reduce || running) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    setup();
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(setup, 200); });
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    start();
  } catch (_) { /* decorative only */ }
})();
