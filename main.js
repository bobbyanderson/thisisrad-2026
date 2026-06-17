/* ============================================
   RAD — Bobby Anderson
   GSAP Animation Layer
   ============================================ */

(function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);

  /* =============================================
     CUSTOM CURSOR
  ============================================= */
  const cursor = document.getElementById('cursor');
  if (cursor && window.matchMedia('(hover: hover)').matches) {
    let mx = 0, my = 0, cx = 0, cy = 0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    gsap.ticker.add(() => {
      cx += (mx - cx) * 0.1;
      cy += (my - cy) * 0.1;
      gsap.set(cursor, { x: cx, y: cy });
    });
    document.querySelectorAll('a, button, .card-hover, .work-panel').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
    });
  }

  /* =============================================
     SCROLLED NAV
  ============================================= */
  const nav = document.querySelector('nav');
  if (nav) {
    ScrollTrigger.create({
      start: 80,
      onEnter:     () => nav.classList.add('scrolled'),
      onLeaveBack: () => nav.classList.remove('scrolled'),
    });
  }

  /* =============================================
     MOBILE NAV
  ============================================= */
  const menuBtn  = document.querySelector('.nav-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      menuBtn.classList.toggle('active', isOpen);
      menuBtn.setAttribute('aria-expanded', isOpen);
    });
    // Close the menu (and reset the icon) when a link inside it is tapped
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        menuBtn.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* =============================================
     PAGE LOADER
  ============================================= */
  const loader = document.getElementById('page-loader');
  if (loader) {
    const mark = loader.querySelector('.loader-mark');
    gsap.timeline({ onComplete: () => { loader.style.display = 'none'; } })
      .to(mark,   { opacity: 1, duration: 0.35, ease: 'power2.out' })
      .to(mark,   { opacity: 0, duration: 0.25, ease: 'power2.in' }, '+=0.4')
      .to(loader, { yPercent: -100, duration: 0.7, ease: 'power3.inOut' }, '-=0.05');
  }

  /* =============================================
     PAGE TRANSITION — blob morph
  ============================================= */
  function initPageTransitions() {
    const wrap = document.getElementById('pt-wrap');
    if (!wrap) return;

    // Organic blob centered at (100, 100) in a 200×200 SVG space
    const blobD = 'M100,22 C118,18 142,28 158,50 C174,72 180,98 172,124 C164,150 144,170 118,178 C92,186 64,180 46,162 C28,144 20,116 26,88 C32,60 46,38 68,28 C80,22 90,22 100,22Z';

    wrap.innerHTML =
      '<svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"' +
      ' style="position:absolute;inset:0;width:100%;height:100%">' +
      '<path id="pt-1" d="' + blobD + '"/>' +
      '<path id="pt-2" d="' + blobD + '"/>' +
      '<path id="pt-3" d="' + blobD + '"/>' +
      '</svg>';

    // Each layer gets a slightly different rotation so they look organic, not identical
    gsap.set('#pt-1', { scale: 0, rotation:   0, svgOrigin: '100 100' });
    gsap.set('#pt-2', { scale: 0, rotation:  32, svgOrigin: '100 100' });
    gsap.set('#pt-3', { scale: 0, rotation: -18, svgOrigin: '100 100' });

    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto') ||
          href.startsWith('http') || href.startsWith('tel') || link.target === '_blank') return;

      link.addEventListener('click', e => {
        e.preventDefault();
        wrap.style.pointerEvents = 'all';

        gsap.timeline({ onComplete: () => { window.location = href; } })
          // pt-1 (lime) sweeps in first
          .to('#pt-1', { scale: 2.4, duration: 0.55, ease: 'expo.in', svgOrigin: '100 100' }, 0)
          // pt-2 (ink) follows
          .to('#pt-2', { scale: 2.4, duration: 0.55, ease: 'expo.in', svgOrigin: '100 100' }, 0.1)
          // pt-3 (bg) covers last — seamless cut to new page background
          .to('#pt-3', { scale: 2.4, duration: 0.5,  ease: 'expo.in', svgOrigin: '100 100' }, 0.2);
      });
    });
  }

  /* =============================================
     THEME TOGGLE
  ============================================= */
  function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const saved = localStorage.getItem('rad-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    updateToggleLabel(btn, saved);
    btn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('rad-theme', next);
      updateToggleLabel(btn, next);
    });
  }
  function updateToggleLabel(btn, theme) {
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    btn.querySelector('.toggle-icon').textContent = theme === 'dark' ? '◑' : '◐';
  }

  /* =============================================
     TEXT SCRAMBLE
  ============================================= */
  class TextScramble {
    constructor(el) {
      this.el = el;
      this.chars = '!<>-_\\/[]{}—=+*^?#';
      this.update = this.update.bind(this);
    }
    setText(newText) {
      const old = this.el.innerText;
      const len = Math.max(old.length, newText.length);
      const promise = new Promise(res => (this.resolve = res));
      this.queue = [];
      for (let i = 0; i < len; i++) {
        const from  = old[i] || '';
        const to    = newText[i] || '';
        // Left-to-right stagger + randomness, slower overall
        const start = Math.floor(i * 2.8 + Math.random() * 16);
        const end   = start + Math.floor(Math.random() * 32) + 22;
        this.queue.push({ from, to, start, end });
      }
      cancelAnimationFrame(this.frameReq);
      this.frame = 0;
      this.update();
      return promise;
    }
    update() {
      let output = '', complete = 0;
      for (let i = 0, n = this.queue.length; i < n; i++) {
        const { from, to, start, end } = this.queue[i];
        let { char } = this.queue[i];
        if (this.frame >= end) { complete++; output += to; }
        else if (this.frame >= start) {
          if (!char || Math.random() < 0.12) {
            char = this.chars[Math.floor(Math.random() * this.chars.length)];
            this.queue[i].char = char;
          }
          output += `<span class="scramble-char">${char}</span>`;
        } else { output += from; }
      }
      this.el.innerHTML = output;
      if (complete === this.queue.length) { this.resolve(); }
      else { this.frameReq = requestAnimationFrame(this.update); this.frame++; }
    }
  }

  /* =============================================
     HERO
  ============================================= */
  function initHero() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const delay = loader ? 0.8 : 0;

    // Horizontal rule lines
    gsap.to('.hero-grid-line-h', {
      scaleX: 1, stagger: 0.12, duration: 1.0, ease: 'power3.out', delay: delay + 0.2
    });

    // Eyebrow
    gsap.to('.hero-eyebrow', {
      opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: delay + 0.3
    });

    // Headline lines
    hero.querySelectorAll('.hero-line .inner').forEach((line, i) => {
      gsap.to(line, { y: 0, duration: 1.1, ease: 'power4.out', delay: delay + 0.4 + i * 0.08 });
    });

    // Scramble tagline if present
    const scrambleEl = document.querySelector('.hero-scramble');
    if (scrambleEl) {
      const fx = new TextScramble(scrambleEl);
      setTimeout(() => fx.setText(scrambleEl.dataset.text || scrambleEl.textContent), (delay + 1.0) * 1000);
    }

    // Sub, CTA, meta
    gsap.to('.hero-sub',  { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: delay + 0.9 });
    gsap.to('.hero-cta',  { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: delay + 1.0 });
    gsap.to('.hero-meta', { opacity: 1,        duration: 0.6, ease: 'power2.out', delay: delay + 1.1 });

    // Parallax deco word
    gsap.to('.hero-deco-word', {
      yPercent: 30, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1.5 }
    });

    // Content parallax
    gsap.to('.hero-content', {
      yPercent: 16, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1.8 }
    });
  }

  /* =============================================
     HORIZONTAL WORK SCROLL
  ============================================= */
  function initHorizontalWork() {
    const container = document.querySelector('.work-section-pin');
    if (!container) return;

    const track = container.querySelector('.work-h-track');
    if (!track) return;

    // Recalculate on resize
    const getDistance = () => track.scrollWidth - window.innerWidth;

    // Header now travels with the pinned unit, so we only need to clear the nav
    const topOffset = () => {
      const nav = document.querySelector('nav');
      return nav ? nav.offsetHeight : 64;
    };

    gsap.to(track, {
      x: () => -getDistance(),
      ease: 'none',
      scrollTrigger: {
        id: 'work-h',
        trigger: container,
        pin: true,
        anticipatePin: 1,
        scrub: 1,
        start: () => 'top ' + topOffset() + 'px',
        end: () => '+=' + getDistance(),
        invalidateOnRefresh: true,
        onUpdate: self => {
          const thumb = document.getElementById('work-progress');
          if (thumb) gsap.set(thumb, { scaleX: self.progress, transformOrigin: 'left center' });

          // Parallax images inside panels
          track.querySelectorAll('.wp-img').forEach(img => {
            const panelRect = img.closest('.work-panel').getBoundingClientRect();
            const centerOffset = (panelRect.left + panelRect.width / 2 - window.innerWidth / 2) / window.innerWidth;
            gsap.set(img, { x: centerOffset * -60, scale: 1.12 });
          });
        }
      }
    });
  }

  /* =============================================
     CLIP-PATH REVEALS
  ============================================= */
  function initClipReveals() {
    document.querySelectorAll('.clip-reveal').forEach(el => {
      gsap.fromTo(el,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.0, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' } }
      );
    });
  }

  /* =============================================
     REVEAL ANIMATIONS
  ============================================= */
  function initReveals() {
    // Split line reveals
    document.querySelectorAll('.reveal-line').forEach(el => {
      const inner = el.querySelector('.inner');
      if (!inner) return;
      ScrollTrigger.create({
        trigger: el, start: 'top 88%',
        onEnter: () => gsap.to(inner, { y: 0, duration: 1, ease: 'power4.out' }),
      });
    });

    // Fade up
    ScrollTrigger.batch('.reveal-fade', {
      start: 'top 90%',
      onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, stagger: 0.06, duration: 0.9, ease: 'power3.out' }),
      once: true,
    });

    // Rise up
    ScrollTrigger.batch('.reveal-up', {
      start: 'top 88%',
      onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, stagger: 0.1, duration: 1.0, ease: 'power3.out' }),
      once: true,
    });
  }

  /* =============================================
     COUNTERS
  ============================================= */
  function initCounters() {
    document.querySelectorAll('.counter').forEach(el => {
      const target = parseFloat(el.dataset.target);
      el.textContent = '0';
      ScrollTrigger.create({
        trigger: el, start: 'top 85%', once: true,
        onEnter: () => {
          const obj = { val: 0 };
          gsap.to(obj, {
            val: target, duration: 1.8, ease: 'power2.out',
            onUpdate: () => {
              el.textContent = Number.isInteger(target) ? Math.round(obj.val) : obj.val.toFixed(1);
            }
          });
        }
      });
    });
  }

  /* =============================================
     PILLAR HOVER LINES
  ============================================= */
  function initPillarHovers() {
    document.querySelectorAll('.how-pillar').forEach(el => {
      const line = el.querySelector('.pillar-line');
      if (!line) return;
      el.addEventListener('mouseenter', () => gsap.to(line, { scaleX: 1, duration: 0.4, ease: 'power3.out' }));
      el.addEventListener('mouseleave', () => gsap.to(line, { scaleX: 0, duration: 0.3, ease: 'power3.in' }));
    });
  }

  /* =============================================
     SCRAMBLE TITLES — all h3s sitewide (except .phase-title,
     which scrambles on scroll-into-view instead — see below)
  ============================================= */
  function initScrambleTitles() {
    if (!window.matchMedia('(hover: hover)').matches) return;

    document.querySelectorAll('h3:not(.phase-title)').forEach(el => {
      if (!el.textContent.trim()) return;

      const originalHTML = el.innerHTML;
      const plainText    = el.innerText.replace(/\s*\n\s*/g, ' ').trim();
      const fx           = new TextScramble(el);
      let   scrambling   = false;

      // Trigger on the nearest card ancestor, falling back to the h3 itself
      const trigger = el.closest('.work-card, .card, .card-hover, [class*="card"], .how-pillar') || el;

      trigger.addEventListener('mouseenter', () => {
        if (scrambling) return;
        scrambling = true;
        fx.setText(plainText).then(() => {
          el.innerHTML = originalHTML;
          scrambling = false;
        });
      });
    });
  }

  /* =============================================
     LOGO DOTS — random flicker while scrolling
  ============================================= */
  function initLogoDots() {
    const dots = document.querySelectorAll('.logo-dot');
    if (!dots.length) return;

    let scrolling = false;
    let idleTimer;

    function flickerLoop(dot) {
      gsap.to(dot, {
        opacity: 0.12 + Math.random() * 0.3,
        duration: 0.25 + Math.random() * 0.45,
        ease: 'sine.inOut',
        delay: 0.3 + Math.random() * 1.4,
        onComplete: () => {
          gsap.to(dot, {
            opacity: 1,
            duration: 0.25 + Math.random() * 0.45,
            ease: 'sine.inOut',
            onComplete: () => { if (scrolling) flickerLoop(dot); }
          });
        }
      });
    }

    window.addEventListener('scroll', () => {
      if (!scrolling) {
        scrolling = true;
        dots.forEach(flickerLoop);
      }
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        scrolling = false;
        gsap.to(dots, { opacity: 1, duration: 0.4, ease: 'power2.out', overwrite: true });
      }, 350);
    }, { passive: true });
  }

  /* =============================================
     SCRAMBLE ON SCROLL — process page phase titles
  ============================================= */
  function initScrambleOnScroll() {
    document.querySelectorAll('.phase-title').forEach(el => {
      if (!el.textContent.trim()) return;

      const originalHTML = el.innerHTML;
      const plainText    = el.innerText.replace(/\s*\n\s*/g, ' ').trim();
      const fx           = new TextScramble(el);

      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          fx.setText(plainText).then(() => { el.innerHTML = originalHTML; });
        }
      });
    });
  }

  /* =============================================
     WORK CARD HOVER (standard pages)
  ============================================= */
  function initWorkCards() {
    document.querySelectorAll('.work-card').forEach(card => {
      const img = card.querySelector('.work-card-img');
      if (!img) return;
      card.addEventListener('mouseenter', () => gsap.to(img, { scale: 1.06, duration: 0.7, ease: 'power2.out' }));
      card.addEventListener('mouseleave', () => gsap.to(img, { scale: 1,    duration: 0.7, ease: 'power2.out' }));
    });
  }

  /* =============================================
     CLICKABLE CASE STUDY CARDS (work.html)
  ============================================= */
  function initCaseStudyCards() {
    document.querySelectorAll('.case-study').forEach(card => {
      const link = card.querySelector('a.btn');
      if (!link) return;
      card.addEventListener('click', e => {
        // Don't double-trigger if clicking the link itself
        if (e.target.closest('a')) return;
        const href = link.getAttribute('href');
        if (href) window.location.href = href;
      });
    });
  }

  /* =============================================
     MAGNETIC BUTTONS
  ============================================= */
  function initMagneticButtons() {
    if (!window.matchMedia('(hover: hover)').matches) return;
    document.querySelectorAll('.btn, .wp-arrow').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r  = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width  / 2)) * 0.3;
        const dy = (e.clientY - (r.top  + r.height / 2)) * 0.3;
        gsap.to(btn, { x: dx, y: dy, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.55)', overwrite: 'auto' });
      });
    });
  }

  /* =============================================
     SCROLL VELOCITY SKEW
  ============================================= */
  function initScrollVelocity() {
    let lastY = window.scrollY;
    let velocity = 0;
    let target = 0;
    const CLAMP = 6; // max degrees

    gsap.ticker.add(() => {
      const y = window.scrollY;
      target = (y - lastY) * 0.18;
      target = Math.max(-CLAMP, Math.min(CLAMP, target));
      velocity += (target - velocity) * 0.12;
      lastY = y;

      // Apply subtle skew to major content sections
      document.querySelectorAll('.hero-content, .stats-grid, .how-grid, .ai-inner').forEach(el => {
        gsap.set(el, { skewY: -velocity * 0.4 });
      });
    });
  }

  /* =============================================
     SPLIT-WORD REVEALS (CTA heading & section headers)
  ============================================= */
  function initSplitReveals() {
    document.querySelectorAll('.split-words').forEach(el => {
      const text = el.textContent.trim();
      const words = text.split(/\s+/);
      el.innerHTML = words.map(w =>
        `<span class="sw-wrap" style="display:inline-block;overflow:hidden;vertical-align:bottom"><span class="sw-inner" style="display:inline-block;transform:translateY(110%)">${w}</span></span>`
      ).join(' ');

      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        onEnter: () => {
          el.querySelectorAll('.sw-inner').forEach((inner, i) => {
            gsap.to(inner, { y: 0, duration: 0.9, ease: 'power4.out', delay: i * 0.06 });
          });
        }
      });
    });
  }

  /* =============================================
     STAT BLOCKS — scroll-driven line reveal
  ============================================= */
  function initStatLines() {
    document.querySelectorAll('.stat-block').forEach((block, i) => {
      gsap.fromTo(block,
        { clipPath: 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'power3.out', delay: i * 0.12,
          scrollTrigger: { trigger: block, start: 'top 82%', once: true } }
      );
    });
  }

  /* =============================================
     INIT
  ============================================= */
  function init() {
    initThemeToggle();
    initPageTransitions();
    initReveals();
    initHero();
    initHorizontalWork();
    initClipReveals();
    initCounters();
    initPillarHovers();
    initWorkCards();
    initScrambleTitles();
    initScrambleOnScroll();
    initLogoDots();
    initCaseStudyCards();
    initMagneticButtons();
    initScrollVelocity();
    initSplitReveals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
