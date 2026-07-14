// ============================================================
// VIABONI — Premium interactions (Lenis + GSAP ScrollTrigger)
// ============================================================

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

// Fallback: if GSAP failed to load (CDN blocked) or user prefers reduced motion,
// force every JS-hidden element visible via static CSS overrides instead of animating.
function forceStaticReveal() {
  const style = document.createElement('style');
  style.textContent = `
    .reveal-up, .fold-3d, .hero-slogan, .badge, .hero-buttons, .scroll-indicator,
    .line-mask .line-inner { opacity: 1 !important; transform: none !important; filter: none !important; }
    .gallery-item { clip-path: inset(0 0 0% 0) !important; }
  `;
  document.head.appendChild(style);
}

if (!hasGsap || prefersReducedMotion) {
  forceStaticReveal();
}

// ============================================================
// Footer year
// ============================================================
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ============================================================
// Mobile navigation
// ============================================================
const navToggle = document.getElementById('nav-toggle');
const mobileOverlay = document.getElementById('mobile-nav-overlay');

if (navToggle && mobileOverlay) {
  navToggle.addEventListener('click', () => {
    const isOpen = mobileOverlay.classList.toggle('open');
    navToggle.classList.toggle('active', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  mobileOverlay.querySelectorAll('[data-mobile-link]').forEach(link => {
    link.addEventListener('click', () => {
      mobileOverlay.classList.remove('open');
      navToggle.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

// ============================================================
// Placeholder links: warn instead of navigating to "#"
// ============================================================
document.querySelectorAll('[data-placeholder]').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    alert(el.dataset.placeholder);
  });
});

// ============================================================
// Navbar scrolled state
// ============================================================
const header = document.getElementById('header');
function updateHeaderState(scrollY) {
  if (!header) return;
  header.classList.toggle('scrolled', scrollY > 20);
}

// ============================================================
// GSAP / Lenis setup
// ============================================================
if (hasGsap && !prefersReducedMotion) {
  gsap.registerPlugin(ScrollTrigger);

  let lenis = null;
  if (typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenis.on('scroll', (e) => {
      ScrollTrigger.update();
      updateHeaderState(e.scroll);
    });

    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Native scroll listener as a safety net: Lenis only emits 'scroll' for
  // wheel/touch-driven motion, not for anchor-link jumps, keyboard paging,
  // or programmatic scrollTo — all of which still need to update the navbar.
  window.addEventListener('scroll', () => updateHeaderState(window.scrollY));

  // ----------------------------------------------------------
  // Hero entrance timeline
  // ----------------------------------------------------------
  const heroTitleLine = document.querySelector('.hero .line-mask .line-inner');
  const heroTl = gsap.timeline({ defaults: { ease: 'expo.out' } });

  heroTl
    .set(heroTitleLine, { yPercent: 100, opacity: 0, filter: 'blur(10px)' })
    .to('.hero [data-hero-el].section-label', { opacity: 1, duration: 0.6 }, 0.1)
    .to(heroTitleLine, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 1 }, 0.25)
    .to('.hero-slogan', { opacity: 1, filter: 'blur(0px)', duration: 0.8 }, 0.65)
    .to('.hero-badges .badge', { opacity: 1, duration: 0.6, stagger: 0.08 }, 0.85)
    .to('.hero-buttons', { opacity: 1, duration: 0.6 }, 1.05)
    .to('.scroll-indicator', { opacity: 1, duration: 0.6 }, 1.2);

  // Ambient Ken Burns drift on hero background
  gsap.to('#hero-bg', {
    scale: 1.08,
    duration: 16,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
  });

  // ----------------------------------------------------------
  // Continuous Ken Burns drift on every photo (real image movement).
  // carte-image is excluded: its scale is already driven by the
  // sticky-swap active/inactive CSS transition, and layering a second
  // scale animation on top would fight that transform.
  // ----------------------------------------------------------
  document.querySelectorAll('.placeholder-photo:not(.carte-image)').forEach((el, i) => {
    gsap.fromTo(
      el,
      { scale: 1.04 },
      {
        scale: 1.14,
        duration: 10 + (i % 5) * 2.2,
        delay: (i % 4) * 0.6,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      }
    );
  });

  // ----------------------------------------------------------
  // Mouse-driven 3D tilt on cards
  // ----------------------------------------------------------
  document.querySelectorAll('.tilt-card').forEach((el) => {
    gsap.set(el, { transformPerspective: 800 });
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(el, {
        rotationY: relX * 14,
        rotationX: relY * -14,
        y: -6,
        duration: 0.5,
        ease: 'power3.out',
      });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { rotationX: 0, rotationY: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.6)' });
    });
  });

  // ----------------------------------------------------------
  // Generic scroll-triggered line-mask reveals (excludes hero)
  // ----------------------------------------------------------
  document.querySelectorAll('.line-mask .line-inner').forEach((el) => {
    if (el.closest('.hero')) return;
    gsap.set(el, { yPercent: 100, opacity: 0, filter: 'blur(10px)' });
    gsap.to(el, {
      yPercent: 0,
      opacity: 1,
      filter: 'blur(0px)',
      duration: 0.9,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  // ----------------------------------------------------------
  // Reveal-up elements (grouped stagger within shared parent)
  // ----------------------------------------------------------
  const revealGroups = new Map();
  document.querySelectorAll('.reveal-up, .review-card, .order-card, .gallery-item').forEach((el) => {
    const parent = el.parentElement;
    if (!revealGroups.has(parent)) revealGroups.set(parent, []);
    revealGroups.get(parent).push(el);
  });

  revealGroups.forEach((els) => {
    els.forEach((el, i) => {
      const isGallery = el.classList.contains('gallery-item');
      const fromVars = isGallery
        ? { clipPath: 'inset(0 0 100% 0)' }
        : { y: 32, opacity: 0 };
      const toVars = isGallery
        ? { clipPath: 'inset(0 0 0% 0)', duration: 1, ease: 'expo.out' }
        : { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out' };

      gsap.set(el, fromVars);
      gsap.to(el, {
        ...toVars,
        delay: (i % 3) * 0.1,
        scrollTrigger: { trigger: el, start: 'top 88%' },
      });
    });
  });

  // ----------------------------------------------------------
  // 3D section fold — signature dish items
  // ----------------------------------------------------------
  gsap.utils.toArray('.fold-3d').forEach((el) => {
    gsap.fromTo(
      el,
      { rotationX: -18, yPercent: 4, opacity: 0.4, transformPerspective: 1600 },
      {
        rotationX: 0,
        yPercent: 0,
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top 95%',
          end: 'top 60%',
          scrub: 0.6,
        },
      }
    );
  });

  // ----------------------------------------------------------
  // Parallax on data-parallax images
  // ----------------------------------------------------------
  gsap.utils.toArray('[data-parallax]').forEach((el) => {
    gsap.to(el, {
      yPercent: 14,
      ease: 'none',
      scrollTrigger: {
        trigger: el.closest('section'),
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  });

  // ----------------------------------------------------------
  // Sticky image swap — carte section
  // ----------------------------------------------------------
  const carteRows = gsap.utils.toArray('.carte-row');
  carteRows.forEach((row) => {
    const target = row.dataset.target;
    const image = document.querySelector(`.carte-image[data-item="${target}"]`);

    ScrollTrigger.create({
      trigger: row,
      start: 'top 60%',
      end: 'bottom 40%',
      onEnter: () => setActiveCarteItem(row, image),
      onEnterBack: () => setActiveCarteItem(row, image),
    });
  });

  function setActiveCarteItem(activeRow, activeImage) {
    carteRows.forEach((r) => r.classList.toggle('is-active', r === activeRow));
    document.querySelectorAll('.carte-image').forEach((img) => {
      img.classList.toggle('active', img === activeImage);
    });
  }

  // ----------------------------------------------------------
  // Magnetic buttons
  // ----------------------------------------------------------
  document.querySelectorAll('.magnetic-el').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      gsap.to(el, { x: relX * 0.3, y: relY * 0.3, duration: 0.5, ease: 'power3.out' });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
    });
  });
} else {
  // ----------------------------------------------------------
  // No-GSAP or reduced-motion fallback: header state + optional
  // lightweight IntersectionObserver reveal (skipped entirely
  // when the user prefers reduced motion — content is already
  // static via forceStaticReveal()).
  // ----------------------------------------------------------
  window.addEventListener('scroll', () => updateHeaderState(window.scrollY));
  updateHeaderState(window.scrollY);

  if (!hasGsap && !prefersReducedMotion) {
    const revealTargets = document.querySelectorAll('.review-card, .order-card, .gallery-item, .about-photo, .about-text');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'none';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealTargets.forEach((el) => {
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
  }
}
