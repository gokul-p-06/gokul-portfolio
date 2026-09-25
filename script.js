const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');

const savedTheme = localStorage.getItem('gokul-theme');
if (savedTheme === 'light') root.classList.add('light');

function updateThemeIcon(){ themeToggle.textContent = root.classList.contains('light') ? '☾' : '☼'; }
updateThemeIcon();
themeToggle.addEventListener('click', () => {
  root.classList.toggle('light');
  localStorage.setItem('gokul-theme', root.classList.contains('light') ? 'light' : 'dark');
  updateThemeIcon();
});

menuToggle.addEventListener('click', () => {
  const open = !mobileMenu.hasAttribute('hidden');
  if (open) { mobileMenu.setAttribute('hidden',''); menuToggle.setAttribute('aria-expanded','false'); }
  else { mobileMenu.removeAttribute('hidden'); menuToggle.setAttribute('aria-expanded','true'); }
});
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mobileMenu.setAttribute('hidden','');
  menuToggle.setAttribute('aria-expanded','false');
}));

const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
}, { threshold: 0.12 });
reveals.forEach(el => observer.observe(el));

const sections = [...document.querySelectorAll('main section[id]')];
const links = [...document.querySelectorAll('.desktop-nav .nav-link')];
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id));
  });
}, { rootMargin: '-40% 0px -45% 0px', threshold: 0 });
sections.forEach(section => sectionObserver.observe(section));

const filters = document.querySelectorAll('.filter');
const projectCards = document.querySelectorAll('.project-card');
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(b => b.classList.remove('active'));
  button.classList.add('active');
  const filter = button.dataset.filter;
  projectCards.forEach(card => {
    card.classList.toggle('hidden-by-filter', filter !== 'all' && card.dataset.category !== filter);
  });
}));

const glow = document.querySelector('.cursor-glow');
window.addEventListener('pointermove', e => {
  if (!glow || window.innerWidth < 900) return;
  glow.style.left = e.clientX + 'px';
  glow.style.top = e.clientY + 'px';
});
