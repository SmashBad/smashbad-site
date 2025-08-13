// Date dans le footer
document.getElementById('year')?.append(new Date().getFullYear());

// Menu mobile
const toggle = document.querySelector('.nav__toggle');
const nav = document.querySelector('[data-nav]');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

// Carrousel hero (index)
const slidesWrap = document.querySelector('[data-slides]');
if (slidesWrap) {
  const slides = Array.from(slidesWrap.querySelectorAll('.hero-slide'));
  const dotsWrap = document.querySelector('[data-dots]');
  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.className = 'dot' + (i === 0 ? ' is-active' : '');
    b.setAttribute('aria-label', `Aller au slide ${i+1}`);
    b.addEventListener('click', () => show(i));
    dotsWrap.appendChild(b);
  });
  const dots = Array.from(dotsWrap.querySelectorAll('.dot'));

  let idx = 0, timer;

  function show(i) {
    slides[idx].classList.remove('is-active');
    dots[idx].classList.remove('is-active');
    idx = i;
    slides[idx].classList.add('is-active');
    dots[idx].classList.add('is-active');
  }
  function next(){ show((idx+1) % slides.length); }
  function start(){ timer = setInterval(next, 5000); }
  function stop(){ clearInterval(timer); }

  slidesWrap.addEventListener('mouseenter', stop);
  slidesWrap.addEventListener('mouseleave', start);
  start();
}

// Shadow prototype (shadow.html)
const grid = document.querySelector('[data-shadow-grid]');
if (grid) {
  const cells = Array.from(grid.querySelectorAll('.shadow-cell'));
  const startBtn = document.querySelector('[data-shadow-start]');
  const stopBtn  = document.querySelector('[data-shadow-stop]');
  const speedEl  = document.querySelector('[data-shadow-speed]');
  let interval, current = -1;

  function flash() {
    if (current >= 0) cells[current].classList.remove('is-active');
    current = Math.floor(Math.random() * cells.length);
    cells[current].classList.add('is-active');
  }
  function start(){
    flash();
    interval = setInterval(flash, Number(speedEl.value || 800));
  }
  function stop(){
    clearInterval(interval);
    if (current >= 0) cells[current].classList.remove('is-active');
    current = -1;
  }
  startBtn?.addEventListener('click', start);
  stopBtn?.addEventListener('click', stop);
}

// Guide minimal (guide.html)
const guideForm = document.querySelector('[data-guide-form]');
if (guideForm) {
  const result = document.querySelector('[data-guide-result]');
  guideForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(guideForm));
    // Mini base interne (MVP)
    const db = [
      {nom:'Yonex Astrox 77', poids:'moyen', style:'offensif', niveau:'intermediaire', pitch:'Puissance contrôlée, bon compromis pour progresser sans se crisper.'},
      {nom:'Victor Auraspeed 90S', poids:'leger', style:'allround', niveau:'intermediaire', pitch:'Rapide en défense, maniable en double, toujours stable.'},
      {nom:'Li-Ning 3D Calibar 900', poids:'lourd', style:'offensif', niveau:'confirme', pitch:'Pour les gros smashes et un jeu d’attaque assumé.'},
    ];
    const pick = db.find(r => r.poids===data.poids && r.style===data.style && r.niveau===data.niveau);
    result.hidden = false;
    result.innerHTML = pick
      ? `<h3>${pick.nom}</h3><p>${pick.pitch}</p><p class="muted">MVP : suggestion interne. Ensuite on branchera Airtable + GPT pour un texte sur mesure.</p>`
      : `<p>Pas de correspondance exacte pour l’instant. Essaie un autre réglage — ou dis‑moi tes critères, j’étendrai la base.</p>`;
  });
}

// Formulaires simples (partner / contact)
const ideaForm = document.querySelector('[data-idea-form]');
if (ideaForm) {
  ideaForm.addEventListener('submit', (e) => {
    e.preventDefault();
    ideaForm.querySelector('[data-idea-ok]').hidden = false;
    ideaForm.reset();
  });
}
const contactForm = document.querySelector('[data-contact-form]');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    contactForm.querySelector('[data-contact-ok]').hidden = false;
    contactForm.reset();
  });
}
