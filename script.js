(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  // Theme control (keeps the original toggle, persists the visitor's preference).
  const themeToggle = document.getElementById('themeToggle');
  let savedTheme = null;
  try { savedTheme = localStorage.getItem('gokul-portfolio-theme'); } catch (_) { /* local storage can be blocked */ }
  if (savedTheme === 'light') root.classList.add('light');
  if (themeToggle) {
    const paintThemeButton = () => {
      const isLight = root.classList.contains('light');
      themeToggle.textContent = isLight ? '☾' : '☼';
      themeToggle.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
      themeToggle.title = isLight ? 'Switch to dark theme' : 'Switch to light theme';
    };
    paintThemeButton();
    themeToggle.addEventListener('click', () => {
      root.classList.toggle('light');
      try { localStorage.setItem('gokul-portfolio-theme', root.classList.contains('light') ? 'light' : 'dark'); } catch (_) { /* no-op */ }
      paintThemeButton();
      if (typeof drawStaticCanvas === 'function') drawStaticCanvas();
    });
  }

  // Accessible mobile navigation.
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const closeMenu = () => {
    if (!mobileMenu || !menuToggle) return;
    mobileMenu.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
    menuToggle.textContent = '☰';
  };
  menuToggle?.addEventListener('click', () => {
    if (!mobileMenu) return;
    const isOpening = mobileMenu.hidden;
    mobileMenu.hidden = !isOpening;
    menuToggle.setAttribute('aria-expanded', String(isOpening));
    menuToggle.setAttribute('aria-label', isOpening ? 'Close menu' : 'Open menu');
    menuToggle.textContent = isOpening ? '×' : '☰';
  });
  mobileMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 820) closeMenu(); }, { passive: true });

  // Scroll reveals use IntersectionObserver rather than continuous scroll calculations.
  const reveals = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
    reveals.forEach((item, index) => {
      if (!item.classList.contains('delay-1') && !item.classList.contains('delay-2')) {
        item.style.transitionDelay = `${Math.min(index % 4, 3) * 65}ms`;
      }
      revealObserver.observe(item);
    });
  } else {
    reveals.forEach(item => item.classList.add('visible'));
  }

  // Highlight navigation as sections enter the viewport.
  const sections = [...document.querySelectorAll('main section[id]')];
  const navLinks = [...document.querySelectorAll('.desktop-nav .nav-link')];
  if ('IntersectionObserver' in window && navLinks.length) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-38% 0px -52% 0px', threshold: 0 });
    sections.forEach(section => sectionObserver.observe(section));
  }

  // Existing project category filters.
  const filters = [...document.querySelectorAll('.filter')];
  const projectCards = [...document.querySelectorAll('.project-card')];
  filters.forEach(button => button.addEventListener('click', () => {
    filters.forEach(filter => filter.classList.toggle('active', filter === button));
    const selected = button.dataset.filter;
    projectCards.forEach(card => {
      const shouldHide = selected !== 'all' && card.dataset.category !== selected;
      card.classList.toggle('hidden-by-filter', shouldHide);
      card.setAttribute('aria-hidden', String(shouldHide));
    });
  }));

  // A high-DPI, low-cost network field for the tech-inspired background.
  const canvas = document.createElement('canvas');
  canvas.id = 'ambient-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('role', 'presentation');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  const cursorGlow = document.querySelector('.cursor-glow');
  const pointer = { x: -1000, y: -1000, tx: -1000, ty: -1000, active: false };
  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let animationId = 0;
  let lastFrame = 0;
  let pageVisible = !document.hidden;
  let isSmall = window.innerWidth <= 650;

  const colors = () => root.classList.contains('light')
    ? { cyan: [25, 131, 164], violet: [103, 87, 191], gold: [174, 127, 59] }
    : { cyan: [113, 231, 244], violet: [150, 127, 255], gold: [255, 212, 154] };
  const rgba = (rgb, alpha) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;

  function createParticles() {
    const area = width * height;
    const count = Math.max(isSmall ? 25 : 42, Math.min(isSmall ? 38 : 82, Math.round(area / (isSmall ? 25000 : 18500))));
    particles = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - .5) * (isSmall ? .13 : .22),
      vy: (Math.random() - .5) * (isSmall ? .13 : .22),
      r: Math.random() * 1.25 + .45,
      phase: Math.random() * Math.PI * 2,
      color: index % 9 === 0 ? 'gold' : (index % 3 === 0 ? 'violet' : 'cyan')
    }));
  }

  function resizeCanvas() {
    if (!ctx) return;
    width = window.innerWidth;
    height = window.innerHeight;
    isSmall = width <= 650;
    dpr = Math.min(window.devicePixelRatio || 1, isSmall ? 1.35 : 1.7);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    createParticles();
    drawStaticCanvas();
  }

  function drawStaticCanvas() {
    if (!ctx || !width || !height) return;
    ctx.clearRect(0, 0, width, height);
    const palette = colors();
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const color = palette[p.color];
      // The ambient network stays sparse and is drawn only when the viewport is visible.
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const limit = isSmall ? 92 : 132;
        if (dist < limit) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = rgba(color, (1 - dist / limit) * (isSmall ? .075 : .11));
          ctx.lineWidth = .7;
          ctx.stroke();
        }
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = rgba(color, .48);
      ctx.shadowBlur = isSmall ? 3 : 7;
      ctx.shadowColor = rgba(color, .45);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function drawFrame(timestamp) {
    if (!ctx || !pageVisible) return;
    const palette = colors();
    ctx.clearRect(0, 0, width, height);
    pointer.x += (pointer.tx - pointer.x) * .075;
    pointer.y += (pointer.ty - pointer.y) * .075;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.phase += .009;
      if (p.x < -12) p.x = width + 12;
      if (p.x > width + 12) p.x = -12;
      if (p.y < -12) p.y = height + 12;
      if (p.y > height + 12) p.y = -12;
      const color = palette[p.color];
      const pulse = .64 + (Math.sin(p.phase) + 1) * .15;
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const dist2 = dx * dx + dy * dy;
        const limit = isSmall ? 92 : 132;
        if (dist2 < limit * limit) {
          const dist = Math.sqrt(dist2);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = rgba(color, (1 - dist / limit) * (isSmall ? .075 : .105));
          ctx.lineWidth = .65;
          ctx.stroke();
        }
      }
      if (pointer.active && !isSmall) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.strokeStyle = rgba(color, (1 - dist / 150) * .17);
          ctx.lineWidth = .7;
          ctx.stroke();
        }
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = rgba(color, .48 * pulse);
      ctx.shadowBlur = isSmall ? 3 : 7;
      ctx.shadowColor = rgba(color, .46 * pulse);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function animate(timestamp) {
    animationId = 0;
    if (!pageVisible || reducedMotion) return;
    if (!lastFrame || timestamp - lastFrame > 23) {
      drawFrame(timestamp);
      lastFrame = timestamp;
    }
    animationId = window.requestAnimationFrame(animate);
  }
  function startCanvas() {
    if (reducedMotion || !pageVisible || animationId) return;
    animationId = window.requestAnimationFrame(animate);
  }
  function stopCanvas() {
    if (animationId) window.cancelAnimationFrame(animationId);
    animationId = 0;
  }

  resizeCanvas();
  if (reducedMotion) canvas.style.display = 'none'; else startCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });
  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden;
    if (pageVisible) startCanvas(); else stopCanvas();
  });
  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    pointer.tx = event.clientX;
    pointer.ty = event.clientY;
    pointer.active = true;
    if (cursorGlow && finePointer && !reducedMotion) {
      cursorGlow.style.setProperty('--mx', `${event.clientX}px`);
      cursorGlow.style.setProperty('--my', `${event.clientY}px`);
    }
  }, { passive: true });
  window.addEventListener('pointerleave', () => { pointer.active = false; }, { passive: true });

  // Scroll progress and compact sticky header, scheduled once per animation frame.
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.innerHTML = '<span></span>';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);
  const progressFill = progress.firstElementChild;
  const topbar = document.querySelector('.topbar');
  let scrollQueued = false;
  function updateScrollEffects() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    progressFill.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`;
    topbar?.classList.toggle('scrolled', window.scrollY > 24);
    scrollQueued = false;
  }
  window.addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(updateScrollEffects);
  }, { passive: true });
  updateScrollEffects();

  // Pointer-responsive card highlights and a restrained desktop-only tilt.
  if (finePointer && !reducedMotion) {
    document.querySelectorAll('.project-card, .skill-card, .about-card, .quote-card').forEach(card => {
      let queued = false;
      let x = 0;
      let y = 0;
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          const px = rect.width ? x / rect.width : .5;
          const py = rect.height ? y / rect.height : .5;
          card.style.setProperty('--pointer-x', `${px * 100}%`);
          card.style.setProperty('--pointer-y', `${py * 100}%`);
          if (card.classList.contains('project-card') && window.innerWidth > 900) {
            card.style.setProperty('--tilt-x', `${(px - .5) * 2.1}deg`);
            card.style.setProperty('--tilt-y', `${(.5 - py) * 2.1}deg`);
          }
          queued = false;
        });
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--pointer-x', '50%');
        card.style.setProperty('--pointer-y', '50%');
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      }, { passive: true });
    });
  }
})();
