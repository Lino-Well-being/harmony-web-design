'use strict';
(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Hero: scattered words gather, then the copy appears */
  const scatter = document.querySelector('.scatter');
  const copy = document.querySelector('.hero-copy');
  const hint = document.querySelector('.hero-scroll');
  const setState = (p, q) => {
    scatter.style.setProperty('--p', p);
    copy.style.setProperty('--q', q);
    hint.style.setProperty('--q', q);
  };
  if (motion.matches) {
    setState(1, 1);
  } else {
    const ease = t => 1 - Math.pow(1 - t, 3);
    const delay = 1400, gather = 1600, appear = 1100;
    let start = null;
    const tick = now => {
      if (start === null) start = now;
      const t = now - start - delay;
      const p = ease(Math.min(Math.max(t / gather, 0), 1));
      const q = ease(Math.min(Math.max((t - gather * .55) / appear, 0), 1));
      setState(p, q);
      if (q < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* Big titles: letters rise one by one */
  document.querySelectorAll('.js-title').forEach(title => {
    const text = title.textContent.trim();
    title.setAttribute('aria-label', text + ' ' + (title.dataset.ja || ''));
    title.textContent = '';
    [...text].forEach((char, i) => {
      const outer = document.createElement('span');
      outer.className = 'ch';
      outer.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span');
      inner.textContent = char;
      inner.style.setProperty('--i', i);
      outer.append(inner);
      title.append(outer);
    });
    title.classList.add('is-split');
  });

  /* Fade up on scroll */
  const targets = document.querySelectorAll('.js-title, .reveal');
  if ('IntersectionObserver' in window && !motion.matches) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, {rootMargin: '0px 0px -10% 0px'});
    targets.forEach(el => io.observe(el));
  } else {
    targets.forEach(el => el.classList.add('is-in'));
  }
})();
