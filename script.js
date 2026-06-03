/* ══════════════════════════════════════════════════════════
   Paul Andrew Esplana — CV Website Scripts
══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   CINEMATIC ENTRY GATE
   Access Code: VIP2025
══════════════════════════════════════════════════════════ */
(function() {
  const ACCESS_CODE = 'VIP28';
  const PHOTO_DURATION = 3000; // ms before switching to auth

  const gate        = document.getElementById('entry-gate');
  const photoPhase  = document.getElementById('gate-phase-photo');
  const authPhase   = document.getElementById('gate-phase-auth');
  const input       = document.getElementById('access-code-input');
  const enterBtn    = document.getElementById('auth-enter-btn');
  const errorMsg    = document.getElementById('auth-error');

  if (!gate) return; // Safety guard

  // Lock scroll while gate is visible
  document.body.classList.add('gate-open');

  // ── PHASE TRANSITION: photo → auth after 3s ──
  const phaseTimer = setTimeout(() => {
    photoPhase.classList.add('fade-out');
    authPhase.classList.add('fade-in');
    // Focus input after auth box animates in
    setTimeout(() => { if (input) input.focus(); }, 800);
  }, PHOTO_DURATION);

  // ── ACCESS CODE VERIFICATION ──
  function attemptEntry() {
    const entered = input.value.trim();

    if (entered === ACCESS_CODE) {
      // ✅ Correct — melt away and reveal portfolio
      errorMsg.classList.remove('visible');
      gate.classList.add('melting');
      document.body.classList.remove('gate-open');
      // Remove gate from DOM after animation completes
      setTimeout(() => {
        gate.style.display = 'none';
        gate.remove();
        // Re-evaluate scroll position so nav highlights the correct section
        window.scrollTo(0, 0);
        window.dispatchEvent(new Event('scroll'));
        // Re-trigger IntersectionObserver by briefly disconnecting & reconnecting
        document.dispatchEvent(new CustomEvent('gateRemoved'));
      }, 1700);
    } else {
      // ❌ Wrong — shake input, show error
      input.classList.remove('shake');
      void input.offsetWidth; // Force reflow to restart animation
      input.classList.add('shake');
      errorMsg.classList.add('visible');
      input.value = '';
      input.focus();
      // Remove shake class after animation
      setTimeout(() => input.classList.remove('shake'), 500);
    }
  }

  // Button click
  enterBtn.addEventListener('click', attemptEntry);

  // Enter key on input
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') attemptEntry();
    if (errorMsg.classList.contains('visible')) {
      errorMsg.classList.remove('visible');
    }
  });

  // Clear error on typing
  input.addEventListener('input', () => {
    errorMsg.classList.remove('visible');
  });

})();

/* ── NAVBAR: scroll state ── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ── HAMBURGER MENU — clean, reliable ── */
const hamburger = document.getElementById('hamburger');
const mobileOverlay = document.getElementById('mobile-overlay');
const mobileClose = document.getElementById('mobile-close');
let menuOpen = false;

function openMenu() {
  menuOpen = true;
  mobileOverlay.classList.add('open');
  hamburger.classList.add('active');
  hamburger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  menuOpen = false;
  mobileOverlay.classList.remove('open');
  hamburger.classList.remove('active');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

// Single click handler — touch-action:manipulation already removes 300ms delay
hamburger.addEventListener('click', () => {
  menuOpen ? closeMenu() : openMenu();
});

// Close button
if (mobileClose) {
  mobileClose.addEventListener('click', closeMenu);
}

// Close when a nav link is tapped — scroll AFTER menu closes
mobileOverlay.querySelectorAll('.mobile-nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault(); // Stop instant anchor jump
      closeMenu();
      // Wait for menu slide-out to finish, then scroll
      setTimeout(() => {
        const target = document.querySelector(href);
        if (target) {
          const navHeight = document.getElementById('navbar').offsetHeight;
          const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 350);
    } else {
      closeMenu();
    }
  });
});

// Close on backdrop tap (tapping outside the panel)
mobileOverlay.addEventListener('click', (e) => {
  if (e.target === mobileOverlay) closeMenu();
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menuOpen) closeMenu();
});

/* ── SMOOTH ACTIVE NAV LINK ── */
const sections = document.querySelectorAll('section[id]');
const allNavLinks = document.querySelectorAll('.nav-link');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      allNavLinks.forEach(l => l.classList.remove('active'));
      const target = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
      if (target) target.classList.add('active');
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
sections.forEach(s => observer.observe(s));

/* ── SCROLL REVEAL ── */
const revealElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const delay = getComputedStyle(el).getPropertyValue('--delay') || '0s';
      el.style.transitionDelay = delay;
      el.classList.add('visible');
      revealObserver.unobserve(el);
    }
  });
}, { rootMargin: '0px 0px -80px 0px', threshold: 0.1 });
revealElements.forEach(el => revealObserver.observe(el));

/* ── COUNT-UP ANIMATION ── */
function animateCount(el, target, suffix) {
  const duration = 1800;
  const start = performance.now();
  const step = (now) => {
    const elapsed = Math.min((now - start) / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - elapsed, 3);
    const current = Math.floor(eased * target);
    el.textContent = current;
    if (elapsed < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}

const statCards = document.querySelectorAll('.stat-card[data-count]');
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const card = entry.target;
      const target = parseInt(card.dataset.count);
      const countEl = card.querySelector('.count-up');
      if (countEl && !card.dataset.animated) {
        card.dataset.animated = 'true';
        animateCount(countEl, target);
      }
      statsObserver.unobserve(card);
    }
  });
}, { threshold: 0.4 });
statCards.forEach(c => statsObserver.observe(c));

/* ── CURSOR GLOW ── */
const cursor = document.createElement('div');
cursor.className = 'cursor-glow';
cursor.style.cssText = `
  position:fixed;pointer-events:none;z-index:9999;
  width:300px;height:300px;border-radius:50%;
  background:radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%);
  transform:translate(-50%,-50%);
  transition:opacity 0.3s ease;
  will-change:transform;
`;
document.body.appendChild(cursor);

let mouseX = 0, mouseY = 0;
let curX = 0, curY = 0;
document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
}, { passive: true });

function animateCursor() {
  curX += (mouseX - curX) * 0.08;
  curY += (mouseY - curY) * 0.08;
  cursor.style.left = curX + 'px';
  cursor.style.top  = curY + 'px';
  requestAnimationFrame(animateCursor);
}
animateCursor();

/* ── CINEMATIC PARALLAX — hero photo moves slower than scroll ── */
const heroPhoto = document.getElementById('hero-photo');
if (heroPhoto) {
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const heroHeight = document.getElementById('hero').offsetHeight;
    if (scrollY <= heroHeight) {
      // Move photo at 30% of scroll speed — creates depth
      heroPhoto.style.transform = `scale(1.04) translateY(${scrollY * 0.3}px)`;
    }
  }, { passive: true });
}

/* ── ACTIVE NAV STYLE ── */
const styleTag = document.createElement('style');
styleTag.textContent = `.nav-link.active { color: var(--text-primary) !important; }
.nav-link.active::after { transform: scaleX(1) !important; }`;
document.head.appendChild(styleTag);

/* ── TIMELINE CARD HOVER SHIMMER ── */
document.querySelectorAll('.timeline-card, .pillar-card, .expertise-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mx', `${x}%`);
    card.style.setProperty('--my', `${y}%`);
  });
});
