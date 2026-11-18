/* ============================================
   RAD — Bobby Anderson
   GSAP Animation Layer
   ============================================ */

(function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);
  // SplitText is only loaded on pages that need it (currently just the
  // homepage hero) — guard the registration so pages without the script
  // tag don't throw on load.
  if (typeof SplitText !== 'undefined') gsap.registerPlugin(SplitText);

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
    document.querySelectorAll('a, button, .card-hover').forEach(el => {
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
    setText(newText, speed = 1) {
      const old = this.el.innerText;
      const len = Math.max(old.length, newText.length);
      const promise = new Promise(res => (this.resolve = res));
      this.queue = [];
      for (let i = 0; i < len; i++) {
        const from  = old[i] || '';
        const to    = newText[i] || '';
        // Left-to-right stagger + randomness, slower overall. `speed` < 1 = quicker.
        const start = Math.floor(i * 2.8 * speed + Math.random() * 16 * speed);
        const end   = start + Math.floor(Math.random() * 32 * speed) + 22 * speed;
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

    // Headline — no block-level fade; initHeroTextFlip() animates it in
    // character-by-character instead (see that function below).

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
     RAINBOW SPECTRUM HELPERS
     Shared by the hero/CTA circuit pulses and the bento gallery glow so
     all three read from the same left-to-right spectrum: whichever
     element sits furthest left on screen is red, furthest right is
     violet, evenly stepped across everything in between (ROYGBIV,
     hue 0→280). Ranking is done by *actual on-screen position*
     (getScreenCTM for the rotated hero/CTA SVGs, getBoundingClientRect
     for the bento grid) rather than source-order, since e.g. the hero
     SVG is rotated 90deg via CSS so raw path coordinates don't reflect
     what's visually leftmost.
  ============================================= */
  function rainbowColor(t) {
    const hue = Math.round(Math.max(0, Math.min(1, t)) * 280);
    return `hsl(${hue}, 80%, 55%)`;
  }

  function rainbowRank(items, getScreenX) {
    const ranked = items.map((item, i) => ({ i, x: getScreenX(item) })).sort((a, b) => a.x - b.x);
    const colors = new Array(items.length);
    ranked.forEach((r, pos) => {
      const t = ranked.length > 1 ? pos / (ranked.length - 1) : 0.5;
      colors[r.i] = rainbowColor(t);
    });
    return colors;
  }

  // On-screen x of a circuit line's fanned-out tip (not its hub end,
  // since every line clusters at the same point there and wouldn't rank).
  function svgPathScreenX(path) {
    const pt = path.getPointAtLength(path.getTotalLength());
    const ctm = path.getScreenCTM && path.getScreenCTM();
    if (ctm && typeof DOMPoint !== 'undefined') return new DOMPoint(pt.x, pt.y).matrixTransform(ctm).x;
    return pt.x;
  }

  // One <linearGradient> per colour, replicating the original pulse-fade
  // shape (transparent at the hub end, fully opaque by 35% along the
  // path) but tinted to that line's rainbow colour instead of a flat
  // accent. Returns the gradient ids, same order as `colors`.
  function buildRainbowGradients(defs, idPrefix, colors) {
    const SVG_NS = 'http://www.w3.org/2000/svg';
    return colors.map((color, i) => {
      const id = `${idPrefix}-${i}`;
      const grad = document.createElementNS(SVG_NS, 'linearGradient');
      grad.setAttribute('id', id);
      grad.setAttribute('gradientUnits', 'userSpaceOnUse');
      grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0');
      grad.setAttribute('x2', '765'); grad.setAttribute('y2', '0');
      [['0%', '0'], ['35%', '1'], ['100%', '1']].forEach(([offset, opacity]) => {
        const stop = document.createElementNS(SVG_NS, 'stop');
        stop.setAttribute('offset', offset);
        stop.setAttribute('stop-color', color);
        stop.setAttribute('stop-opacity', opacity);
        grad.appendChild(stop);
      });
      defs.appendChild(grad);
      return id;
    });
  }

  /* =============================================
     HERO — circuit-line pulses
     The hero background is a fan of 33 static lines (inlined SVG,
     right-aligned, coloured via --rule). On top of that, short
     pulses travel along randomly-chosen lines, one at a time at
     randomised intervals, from the hub out past the right edge — like
     signals firing through a circuit/neuron map. Each line is ranked
     by its actual on-screen left-to-right position and tinted a
     rainbow colour accordingly (see RAINBOW SPECTRUM HELPERS above),
     with a small colour-matched glow.
     Each pulse is a transient cloned <path> animated via the Web
     Animations API (stroke-dashoffset sliding a short dash from
     fully-before-start to fully-past-end), then removed on finish.
     Pauses scheduling off-screen/hidden-tab; skipped entirely for
     prefers-reduced-motion.
  ============================================= */
  function initHeroPulses() {
    const svg = document.querySelector('.hero-bg-svg svg');
    const hero = document.querySelector('.hero');
    const lineGroup = document.querySelector('.hero-bg-lines');
    const pulseGroup = document.querySelector('.hero-bg-pulses');
    if (!svg || !hero || !lineGroup || !pulseGroup) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lines = Array.from(lineGroup.querySelectorAll('path'));
    if (!lines.length || reduced) return;

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const DASH = 42; // length (px, in viewBox units) of the travelling pulse segment
    const MIN_DURATION = 3200;
    const MAX_DURATION = 5200;
    const MIN_DELAY = 1400;
    const MAX_DELAY = 3200;

    const colors = rainbowRank(lines, svgPathScreenX);
    const defs = svg.querySelector('defs');
    const gradientIds = defs ? buildRainbowGradients(defs, 'hero-pulse-rainbow', colors) : null;

    let timer = null;
    let running = false;

    function firePulse() {
      const idx = Math.floor(Math.random() * lines.length);
      const source = lines[idx];
      const d = source.getAttribute('d');
      const color = colors[idx];

      const pulse = document.createElementNS(SVG_NS, 'path');
      pulse.setAttribute('d', d);
      pulse.setAttribute('stroke-width', '1.5');
      pulse.style.stroke = gradientIds ? `url(#${gradientIds[idx]})` : color;
      pulse.style.filter = `drop-shadow(0 0 3px ${color})`;
      pulseGroup.appendChild(pulse);

      const total = pulse.getTotalLength();
      const reach = total + DASH;
      pulse.style.strokeDasharray = `${DASH} ${total}`;

      const duration = MIN_DURATION + Math.random() * (MAX_DURATION - MIN_DURATION);
      const anim = pulse.animate(
        [
          { strokeDashoffset: reach },
          { strokeDashoffset: -reach },
        ],
        { duration, easing: 'linear', fill: 'forwards' }
      );
      anim.onfinish = () => pulse.remove();
      anim.oncancel = () => pulse.remove();
    }

    function scheduleNext() {
      if (!running) return;
      const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
      timer = setTimeout(() => {
        firePulse();
        scheduleNext();
      }, delay);
    }

    function start() {
      if (running) return;
      running = true;
      scheduleNext();
    }

    function stop() {
      running = false;
      clearTimeout(timer);
      timer = null;
    }

    start();

    // Pause when the hero scrolls out of view or the tab is hidden
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => (entry.isIntersecting ? start() : stop()));
    }, { threshold: 0 });
    io.observe(hero);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else if (hero.getBoundingClientRect().bottom > 0) start();
    });
  }

  /* =============================================
     CTA BAND — mirrored background pulses
     Same rainbow treatment as the hero (see RAINBOW SPECTRUM HELPERS
     above), ranked independently from this SVG's own on-screen geometry
     — it's mirrored (rotated -90deg, not 90deg) so its left-to-right
     order isn't assumed to match the hero's.
  ============================================= */
  function initCtaPulses() {
    const band       = document.querySelector('.cta-band');
    const svg        = document.querySelector('.cta-bg-svg svg');
    const lineGroup  = document.querySelector('.cta-bg-lines');
    const pulseGroup = document.querySelector('.cta-bg-pulses');
    if (!band || !lineGroup || !pulseGroup) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lines   = Array.from(lineGroup.querySelectorAll('path'));
    if (!lines.length || reduced) return;

    const SVG_NS     = 'http://www.w3.org/2000/svg';
    const DASH       = 42;
    const MIN_DURATION = 3200;
    const MAX_DURATION = 5200;
    const MIN_DELAY  = 1400;
    const MAX_DELAY  = 3200;

    const colors = rainbowRank(lines, svgPathScreenX);
    const defs = svg ? svg.querySelector('defs') : null;
    const gradientIds = defs ? buildRainbowGradients(defs, 'cta-pulse-rainbow', colors) : null;

    let timer   = null;
    let running = false;

    function firePulse() {
      const idx    = Math.floor(Math.random() * lines.length);
      const source = lines[idx];
      const color  = colors[idx];
      const pulse  = document.createElementNS(SVG_NS, 'path');
      pulse.setAttribute('d', source.getAttribute('d'));
      pulse.setAttribute('stroke-width', '1.5');
      pulse.style.stroke = gradientIds ? `url(#${gradientIds[idx]})` : color;
      pulse.style.filter = `drop-shadow(0 0 3px ${color})`;
      pulseGroup.appendChild(pulse);

      const total = pulse.getTotalLength();
      const reach = total + DASH;
      pulse.style.strokeDasharray = `${DASH} ${total}`;

      const duration = MIN_DURATION + Math.random() * (MAX_DURATION - MIN_DURATION);
      const anim = pulse.animate(
        [{ strokeDashoffset: -reach }, { strokeDashoffset: reach }],
        { duration, easing: 'linear', fill: 'forwards' }
      );
      anim.onfinish = () => pulse.remove();
      anim.oncancel = () => pulse.remove();
    }

    function scheduleNext() {
      if (!running) return;
      const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
      timer = setTimeout(() => { firePulse(); scheduleNext(); }, delay);
    }

    function start() { if (running) return; running = true; scheduleNext(); }
    function stop()  { running = false; clearTimeout(timer); timer = null; }

    start();

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => (e.isIntersecting ? start() : stop()));
    }, { threshold: 0 });
    io.observe(band);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else if (band.getBoundingClientRect().bottom > 0) start();
    });
  }

  /* =============================================
     BENTO GALLERY — pulsing border effect
     Each .bento-gallery-item gets an inline SVG overlay containing:
       • a base <rect> (stroke: var(--rule), replaces the removed CSS border)
       • a pulse <rect> with a short dash that travels around the
         perimeter via stroke-dashoffset animation, fired at random
         intervals per item so they're staggered.
     Items are ranked by their on-screen horizontal centre and tinted
     from the same rainbow spectrum as the hero/CTA pulses (see RAINBOW
     SPECTRUM HELPERS above), with a small colour-matched glow.
     Pauses when the gallery is off-screen / tab hidden; skipped for
     prefers-reduced-motion.
  ============================================= */
  function initBentoPulses() {
    const items = Array.from(document.querySelectorAll('.bento-gallery-item'));
    if (!items.length) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const DASH     = 52;    // pulse segment length
    const MIN_DUR  = 5000;  // animation travel time (ms) — one full lap of the perimeter
    const MAX_DUR  = 8000;
    const MIN_GAP  = 1500;  // pause between pulses on the same item (ms)
    const MAX_GAP  = 5000;
    const CORNER_R = 10;    // rounds the travelling pulse's corners so it curves through
                             // turns instead of snapping around a hard right angle —
                             // softer, closer to the hero's smooth curved lines

    const colors = rainbowRank(items, item => {
      const r = item.getBoundingClientRect();
      return r.left + r.width / 2;
    });

    // Build an SVG overlay for every item (measures at init, layout is stable by this point)
    const data = items.map((item, i) => {
      const w = item.clientWidth  || 320;
      const h = item.clientHeight || 200;
      const color = colors[i];

      const svg = document.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('class', 'bento-item-svg');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.setAttribute('preserveAspectRatio', 'none');

      // Base border rect — replaces the removed CSS border: 1px solid var(--rule)
      const base = document.createElementNS(SVG_NS, 'rect');
      base.setAttribute('x', '1'); base.setAttribute('y', '1');
      base.setAttribute('width', w - 2); base.setAttribute('height', h - 2);
      base.setAttribute('rx', CORNER_R); base.setAttribute('ry', CORNER_R);
      base.setAttribute('fill', 'none');
      base.style.stroke = 'var(--rule)';
      base.setAttribute('stroke-width', '1');
      svg.appendChild(base);

      // Animated pulse dash
      const pulse = document.createElementNS(SVG_NS, 'rect');
      pulse.setAttribute('x', '1'); pulse.setAttribute('y', '1');
      pulse.setAttribute('width', w - 2); pulse.setAttribute('height', h - 2);
      pulse.setAttribute('rx', CORNER_R); pulse.setAttribute('ry', CORNER_R);
      pulse.setAttribute('fill', 'none');
      pulse.setAttribute('stroke-width', '1.5');
      pulse.setAttribute('stroke-linecap', 'round');
      pulse.style.stroke = color;
      // Layered blur reads as a softer, more diffuse glow than one tight shadow
      pulse.style.filter = `drop-shadow(0 0 2px ${color}) drop-shadow(0 0 6px ${color})`;
      svg.appendChild(pulse);

      // Must be attached to the document before measuring — getTotalLength()
      // throws on a detached/non-rendered element. Measured after the rx is
      // applied so it accounts for the rounded corners automatically (a
      // plain 2*(w+h) formula would overshoot now the corners are curved).
      item.appendChild(svg);
      const P = pulse.getTotalLength();
      pulse.style.strokeDasharray = `${DASH} ${P}`;
      pulse.style.strokeDashoffset = `${P + DASH}`;  // start fully hidden
      pulse.style.opacity = '0';  // invisible until animation begins; animations override this

      return { pulse, P, anim: null };
    });

    if (reduced) return;

    let running = false;
    const timers = new Map();

    function firePulse(i) {
      const d = data[i];
      if (d.anim) { d.anim.cancel(); d.anim = null; }
      const dur   = MIN_DUR + Math.random() * (MAX_DUR - MIN_DUR);
      const reach = d.P + DASH;
      // Random perimeter entry point so each pulse appears on a different edge/corner
      const r  = Math.floor(Math.random() * d.P);
      const s0 = reach - r;          // start dashoffset (offset so pulse enters at arc-length r)
      const s1 = s0 - reach;         // end dashoffset — exactly one full lap of travel, then fades out
      // strokeDashoffset is only given at offset 0 and 1, so it interpolates
      // in a straight line across the *entire* duration — one constant speed
      // from entry to exit. Opacity gets its own, separate set of stops
      // (0→1 over first 12%, holds 1 to 70%, fades 1→0 over last 30%) for
      // the fade in/out, independent of the dash's travel — the two used to
      // share the same offsets, which forced the dash to lag through the
      // 12%–70% hold (only 16% of the travel in 58% of the time) then rush
      // through the last 30%, reading as a slow-down in the middle.
      const anim  = d.pulse.animate(
        [
          { strokeDashoffset: s0, opacity: 0, offset: 0    },
          {                       opacity: 1, offset: 0.12 },
          {                       opacity: 1, offset: 0.70 },
          { strokeDashoffset: s1, opacity: 0, offset: 1    },
        ],
        { duration: dur, easing: 'linear', fill: 'forwards' }
      );
      d.anim = anim;
      anim.onfinish = anim.oncancel = () => {
        if (d.anim === anim) { d.anim = null; scheduleItem(i); }
      };
    }

    function scheduleItem(i) {
      if (!running) return;
      const delay = MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP);
      timers.set(i, setTimeout(() => firePulse(i), delay));
    }

    function start() {
      if (running) return;
      running = true;
      // Split items into 4 groups of 2, each group offset by avgDur so only
      // ~2 pulses are active at any one time. Items are shuffled so the groups
      // aren't the same physical cells each session.
      const GROUP_SIZE = 2;
      const avgDur = (MIN_DUR + MAX_DUR) / 2;
      const order = data.map((_, i) => i).sort(() => Math.random() - 0.5);
      order.forEach((i, n) => {
        const groupIndex = Math.floor(n / GROUP_SIZE);
        const posInGroup  = n % GROUP_SIZE;
        setTimeout(() => scheduleItem(i), groupIndex * avgDur + posInGroup * 80);
      });
    }

    function stop() {
      running = false;
      timers.forEach(t => clearTimeout(t));
      timers.clear();
      data.forEach(d => { if (d.anim) { d.anim.cancel(); d.anim = null; } });
    }

    // Start immediately — no scroll-trigger gate.
    // (The section is just below the hero; waiting for IntersectionObserver
    //  added a noticeable delay before the first pulse appeared.)
    start();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else start();
    });
  }

  /* =============================================
     HERO HEADLINE — line reveal
     Adapted from GSAP's "Animate Text" demo
     (https://demos.gsap.com/demo/animate-text/ —
     https://codepen.io/GreenSock/pen/xxmaNYj), specifically its
     "Lines" variant: each line tips up into place (rotationX, with a
     pulled-back transformOrigin for a subtle 3D fold) while fading
     in, staggered line by line. Subtler than a per-character flip,
     and it naturally suits copy that's already broken across lines
     ("A design partner" / "for ambitious companies") — each
     .hero-line is treated as one SplitText "line". Needs `perspective`
     on the headline (see .hero-headline in index.html) for the
     rotationX fold to read as 3D rather than a flat vertical squash.
  ============================================= */
  function initHeroTextFlip() {
    if (typeof SplitText === 'undefined') return;
    const lines = document.querySelectorAll('.hero-headline .hero-line');
    if (!lines.length) return;

    const delay = loader ? 0.8 : 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const split = SplitText.create(lines, { type: 'lines' });

    if (reduced) {
      gsap.set(split.lines, { opacity: 1, rotationX: 0 });
      return;
    }

    gsap.timeline({ delay: delay + 0.4 }).from(split.lines, {
      rotationX: -100,
      transformOrigin: '50% 50% -160px',
      opacity: 0,
      duration: 0.8,
      ease: 'power3',
      stagger: 0.25
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
     SCRAMBLE TITLES — all h3s sitewide, scrambles once on
     scroll-into-view (quicker than the .phase-title variant below)
  ============================================= */
  function initScrambleTitles() {
    document.querySelectorAll('h3:not(.phase-title)').forEach(el => {
      if (!el.textContent.trim()) return;

      const originalHTML = el.innerHTML;
      const plainText    = el.innerText.replace(/\s*\n\s*/g, ' ').trim();
      const fx           = new TextScramble(el);

      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          fx.setText(plainText, 0.7).then(() => { el.innerHTML = originalHTML; });
        }
      });
    });
  }

  /* =============================================
     LOGO DOTS — random flicker while scrolling
  ============================================= */
  function initLogoDots() {
    const dots = document.querySelectorAll('.logo-dot');
    if (!dots.length) return;

    // Same red→violet spectrum (hue 0→280) used everywhere else on the
    // site. While scrolling, each fade dip also jumps to a fresh spectrum
    // colour; at rest the dots settle back to white. In light mode "white"
    // would vanish against the off-white background, so at rest we fall
    // back to the mark's own dark-grey (matching the rest of the logo,
    // which is excluded from this colour cycling — see .logo-svg > path
    // in styles.css — so the invert filter doesn't distort it).
    function idleColor() {
      return document.documentElement.getAttribute('data-theme') === 'dark' ? '#ffffff' : '#343A40';
    }
    gsap.set(dots, { fill: idleColor() });

    let scrolling = false;
    let idleTimer;

    function flickerLoop(dot) {
      gsap.to(dot, {
        opacity: 0.12 + Math.random() * 0.3,
        fill: rainbowColor(Math.random()),
        duration: 0.25 + Math.random() * 0.45,
        ease: 'sine.inOut',
        delay: 0.3 + Math.random() * 1.4,
        onComplete: () => {
          gsap.to(dot, {
            opacity: 1,
            fill: rainbowColor(Math.random()),
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
        gsap.to(dots, { opacity: 1, fill: idleColor(), duration: 0.4, ease: 'power2.out', overwrite: true });
      }, 350);
    }, { passive: true });

    // Keep the dots correct if the theme is toggled while at rest.
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        if (!scrolling) gsap.to(dots, { fill: idleColor(), duration: 0.3, overwrite: 'auto' });
      });
    }
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
    document.querySelectorAll('.btn').forEach(btn => {
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
     HERO EYEBROW — static rainbow glow + colour-matched hover hotspot
     + subtle wobble
     The rainbow band itself (::before, a static linear left-to-right
     spectrum) is pure CSS (see .hero-eyebrow::before/::after above
     index.html's hero styles). This supplies the three things CSS can't:
     the cursor position (driving --mx/--my, which the ::after hotspot
     reads to grow wherever the mouse actually is), which exact colour
     of the spectrum to grow it in (--spectrum-color, sampled with the
     same rainbowColor() used by the hero/CTA pulses and bento gallery,
     so a hover on the left of the pill glows red, the right glows
     violet, matching the band underneath), and a gentle wobble — same
     magnetic-follow mechanic as initMagneticButtons() above, but a much
     smaller multiplier so the pill nudges rather than chases the cursor.
  ============================================= */
  function initEyebrowGlow() {
    if (!window.matchMedia('(hover: hover)').matches) return;
    const eyebrow = document.querySelector('.hero-eyebrow');
    if (!eyebrow) return;

    eyebrow.addEventListener('mousemove', e => {
      const r = eyebrow.getBoundingClientRect();
      const t = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      const mx = t * 100;
      const my = ((e.clientY - r.top) / r.height) * 100;
      eyebrow.style.setProperty('--mx', `${mx}%`);
      eyebrow.style.setProperty('--my', `${my}%`);
      eyebrow.style.setProperty('--spectrum-color', rainbowColor(t));

      const dx = (e.clientX - (r.left + r.width  / 2)) * 0.12;
      const dy = (e.clientY - (r.top  + r.height / 2)) * 0.12;
      gsap.to(eyebrow, { x: dx, y: dy, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
    });
    eyebrow.addEventListener('mouseleave', () => {
      // Clears the hotspot layer so it doesn't linger at its last colour —
      // the :hover rule only fades the glow's overall size/opacity back
      // down, it doesn't touch this variable.
      eyebrow.style.setProperty('--spectrum-color', 'transparent');
      gsap.to(eyebrow, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.55)', overwrite: 'auto' });
    });
  }

  /* =============================================
     CTA GLOW — growing spectrum glow on hover, for the site's main
     calls to action ("Book a call" / .nav-cta, and "Start your project"
     / .btn-accent). Same rainbowColor() mapping as the eyebrow glow
     above (hover position -> hue), but implemented as a drop-shadow
     filter rather than layered backgrounds: these buttons already paint
     their own opaque fill, and .btn-arrow's ::after is taken by the
     arrow glyph, so there's no free pseudo-element to layer a fill over
     a background-based glow the way the eyebrow does. A filter applies
     to the whole rendered element and paints behind it like a real drop
     shadow, so it needs no extra layering to stay clear of the button's
     own fill and text.
  ============================================= */
  function initCtaGlow() {
    if (!window.matchMedia('(hover: hover)').matches) return;
    const ctas = document.querySelectorAll('.nav-cta, .btn-accent');

    ctas.forEach(cta => {
      cta.addEventListener('mousemove', e => {
        const r = cta.getBoundingClientRect();
        const t = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        cta.style.setProperty('--spectrum-color', rainbowColor(t));
      });
      cta.addEventListener('mouseleave', () => {
        cta.style.setProperty('--spectrum-color', 'transparent');
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
      document.querySelectorAll('.hero-content, .stats-grid, .how-grid').forEach(el => {
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
     FOOTER BLUR — fixed progressive-blur strip, present on every
     page, pinned to the bottom of the viewport. Fades to nothing as
     the footer scrolls into view so it never blurs the footer
     itself — see the .footer-blur CSS comment in styles.css for how
     the blur layers themselves work.
  ============================================= */
  function initFooterBlur() {
    const strip = document.querySelector('.footer-blur');
    const footer = document.querySelector('footer');
    if (!strip || !footer || typeof ScrollTrigger === 'undefined') return;

    let st;
    const build = () => {
      st && st.kill();
      const h = strip.getBoundingClientRect().height;
      // Cap the fade distance to the footer's own height: the footer is
      // the last thing on the page, so if it's shorter than the strip,
      // there isn't h px of scroll room left after its top edge passes
      // the trigger point — using the full h unconditionally would leave
      // the fade unable to ever quite reach 0 once you hit the bottom of
      // the page (progress gets clamped by the page's max scroll first).
      const footerH = footer.getBoundingClientRect().height;
      const fade = Math.min(h, footerH);
      st = ScrollTrigger.create({
        trigger: footer,
        start: 'top bottom',
        end: `top bottom-=${fade}`,
        scrub: true,
        onUpdate: self => { strip.style.opacity = 1 - self.progress; }
      });
    };

    build();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 200);
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
     BENTO GALLERY — scrubbed (homepage only)
  ============================================= */
  function initBentoGallery() {
    const galleryElement = document.querySelector('#bento-gallery');
    if (!galleryElement || typeof Flip === 'undefined') return;
    gsap.registerPlugin(Flip);

    const galleryItems = galleryElement.querySelectorAll('.bento-gallery-item');
    const wrapElement = galleryElement.parentNode;
    const isMobileBento = () => window.innerWidth <= 768;
    let flipCtx;

    const build = () => {
      flipCtx && flipCtx.revert();
      galleryElement.classList.remove('bento-gallery--final');
      wrapElement.style.height = ''; // drop any previous mobile override, back to CSS default

      flipCtx = gsap.context(() => {
        // Temporarily add the final (full-bleed) class to capture the end state
        galleryElement.classList.add('bento-gallery--final');
        const flipState = Flip.getState(galleryItems);
        galleryElement.classList.remove('bento-gallery--final');

        let trigger = galleryElement;
        let start = 'center center';

        // Mobile: the gallery scrolls normally instead of being capped to
        // one viewport (see the CSS comment above .bento-gallery--bento in
        // index.html), and item 8 — the last tile, with nothing after it —
        // is the hero. .bento-gallery-wrap's CSS height is just 'auto' on
        // mobile, so it's grown here to (natural collapsed content height)
        // + (one viewport), reserving exactly the scroll room the zoom
        // needs. The pin starts the instant item 8's own natural top edge
        // reaches the top of the viewport, so that reserved room is
        // consumed by the scrub rather than by extra blank scrolling.
        if (isMobileBento()) {
          const naturalHeight = galleryElement.getBoundingClientRect().height;
          wrapElement.style.height = (naturalHeight + window.innerHeight) + 'px';
          trigger = galleryElement.querySelector('.bento-gallery-item:last-child');
          start = 'top top';
        }

        const flip = Flip.to(flipState, { simple: true, ease: 'expoScale(1, 5)' });

        gsap.timeline({
          scrollTrigger: {
            trigger: trigger,
            start: start,
            end: '+=100%',
            scrub: true,
            pin: wrapElement
          }
        }).add(flip);

        return () => gsap.set(galleryItems, { clearProps: 'all' });
      });
    };

    build();

    // Debounced rebuild on resize, followed by a full ScrollTrigger refresh.
    // The Flip-driven pin here sits earlier in the page than the Selected
    // Work gallery and the globe section, so any change to its layout
    // shifts where those sections start. Refreshing once after this rebuilds
    // (rather than relying on each section's own independent resize
    // listener) keeps everything below in sync with this section's new size.
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        build();
        ScrollTrigger.refresh();
      }, 200);
    });
  }

  /* =============================================
     SUBHEAD WORD REVEAL
  ============================================= */
  function initSubheadReveal() {
    const el = document.querySelector('.wwww-subhead');
    if (!el || typeof gsap === 'undefined') return;

    const text = el.textContent.trim();

    // Wrap each word: outer clip, inner animatable span
    el.innerHTML = text.split(' ').map(word =>
      `<span style="display:inline-block;overflow:hidden;vertical-align:bottom;padding-bottom:0.1em"><span class="sh-word" style="display:inline-block">${word}</span></span>`
    ).join(' ');

    const words = el.querySelectorAll('.sh-word');
    gsap.set(words, { y: '110%', opacity: 0 });

    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(words, {
          y: 0,
          opacity: 1,
          duration: 0.75,
          stagger: 0.09,
          ease: 'power3.out',
          delay: 0.2,
        });
      },
    });
  }

  /* =============================================
     WHO WE WORK WITH — accordion
  ============================================= */
  function initWWWW() {
    const items = Array.from(document.querySelectorAll('.wwww-item'));
    if (!items.length) return;

    items.forEach(item => {
      const trigger = item.querySelector('.wwww-trigger');
      if (!trigger) return;

      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // Close all
        items.forEach(i => {
          i.classList.remove('open');
          const t = i.querySelector('.wwww-trigger');
          if (t) t.setAttribute('aria-expanded', 'false');
        });

        // Open clicked (unless it was already open — toggle off)
        if (!isOpen) {
          item.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
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
    initHeroPulses();
    initCtaPulses();
    initHeroTextFlip();
    initBentoGallery();
    initBentoPulses();
    initSubheadReveal();
    initWWWW();
    initCounters();
    initPillarHovers();
    initWorkCards();
    initScrambleTitles();
    initScrambleOnScroll();
    initLogoDots();
    initCaseStudyCards();
    initMagneticButtons();
    initEyebrowGlow();
    initCtaGlow();
    initScrollVelocity();
    initSplitReveals();
    initFooterBlur();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
