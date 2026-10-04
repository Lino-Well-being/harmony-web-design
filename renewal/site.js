'use strict';
(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Hero: scattered words gather, a pen writes the copy, then the rest appears */
  const stage = document.querySelector('.hero-stage');
  const scatter = document.querySelector('.scatter');
  const copy = document.querySelector('.hero-copy');
  const hint = document.querySelector('.hero-scroll');
  const pen = document.querySelector('.pen');
  const person = document.querySelector('.hero-person');
  const title = document.querySelector('#hero-title');
  title.setAttribute('aria-label', title.textContent.trim());
  const chars = [];
  const wrapChars = node => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        [...child.textContent].forEach(ch => {
          const span = document.createElement('span');
          span.className = 'c';
          span.setAttribute('aria-hidden', 'true');
          span.textContent = ch;
          chars.push(span);
          frag.append(span);
        });
        child.replaceWith(frag);
      } else {
        wrapChars(child);
      }
    });
  };
  wrapChars(title);

  /* Cloud-shaped thought bubbles sized to each phrase */
  const NS = 'http://www.w3.org/2000/svg';
  const drawClouds = () => {
    document.querySelectorAll('.bub').forEach(bub => {
      bub.querySelector('.cloud')?.remove();
      const w = bub.offsetWidth, h = bub.offsetHeight;
      const cx = w / 2, cy = h / 2, rx = w / 2, ry = h / 2;
      const perim = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
      const n = Math.max(8, Math.round(perim / 30));
      const pts = Array.from({length: n}, (_, i) => {
        const a = (i / n) * Math.PI * 2 + .3;
        return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
      });
      let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
      pts.forEach((pt, i) => {
        const next = pts[(i + 1) % n];
        const r = Math.hypot(next[0] - pt[0], next[1] - pt[1]) * .62;
        d += ` A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${next[0].toFixed(1)} ${next[1].toFixed(1)}`;
      });
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'cloud');
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.setAttribute('aria-hidden', 'true');
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', d + ' Z');
      svg.append(path);
      bub.prepend(svg);
    });
  };
  drawClouds();
  if (document.fonts) document.fonts.ready.then(drawClouds);
  window.addEventListener('resize', drawClouds);

  const penAt = (el, rest = false, atLeft = false) => {
    const r = el.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    const half = pen.getBoundingClientRect().height / 2;
    const x = (atLeft ? r.left : r.right) - s.left + (rest ? r.height * .35 : 0);
    const y = (rest ? r.bottom + r.height * .08 : r.bottom - r.height * .18) - s.top - half;
    pen.style.transform = `translate(${x}px, ${y}px) rotate(${rest ? -24 : -35}deg)`;
  };
  const setVars = (p, e, q) => {
    scatter.style.setProperty('--p', p);
    copy.style.setProperty('--e', e);
    copy.style.setProperty('--q', q);
    hint.style.setProperty('--q', q);
  };
  let done = false;
  const finish = () => {
    done = true;
    person.classList.add('is-on', 'is-solved');
    chars.forEach(c => c.classList.add('on'));
    pen.classList.add('is-on', 'is-rest');
    penAt(chars[chars.length - 1], true);
  };

  if (motion.matches) {
    setVars(1, 1, 1);
    finish();
  } else {
    const ease = t => 1 - Math.pow(1 - t, 3);
    const clamp = v => Math.min(Math.max(v, 0), 1);
    const delay = 3000, gather = 1500, perChar = 70, appear = 1000;
    const writeStart = gather * .7;
    const writeEnd = writeStart + chars.length * perChar;
    let start = null;
    let shown = 0;
    const tick = now => {
      if (start === null) start = now;
      const t = now - start - delay;
      const p = ease(clamp(t / gather));
      const e = ease(clamp((t - gather * .45) / 600));
      const q = ease(clamp((t - writeEnd - 350) / appear));
      setVars(p, e, q);
      if (now - start > 200) person.classList.add('is-on');
      if (t >= writeEnd + 200) person.classList.add('is-solved');
      if (t >= writeStart - 300 && !pen.classList.contains('is-on')) {
        penAt(chars[0], false, true);
        pen.classList.add('is-on');
      }
      const target = Math.min(chars.length, Math.floor((t - writeStart) / perChar));
      while (shown < target) {
        chars[shown].classList.add('on');
        if (chars[shown].textContent.trim()) penAt(chars[shown]);
        shown++;
      }
      if (t >= writeEnd + 200 && !pen.classList.contains('is-rest')) {
        pen.classList.add('is-rest');
        penAt(chars[chars.length - 1], true);
      }
      if (q < 1) requestAnimationFrame(tick); else done = true;
    };
    requestAnimationFrame(tick);
  }
  window.addEventListener('resize', () => { if (done || pen.classList.contains('is-rest')) penAt(chars[chars.length - 1], true); });

  /* Line breaks only between words (Safari etc. without word-break:auto-phrase) */
  if (!CSS.supports('word-break', 'auto-phrase') && 'Segmenter' in Intl) {
    const seg = new Intl.Segmenter('ja', {granularity: 'word'});
    const glue = /^[、。」』）！？ー～ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ\s]/;
    document.querySelectorAll('main p, main li, main dd, main dt, main h3, main summary, main blockquote, main figcaption').forEach(el => {
      if (el.closest('.scatter, #hero-title')) return;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(node => {
        if (!/[぀-ヿ一-鿿]/.test(node.textContent)) return;
        const frag = document.createDocumentFragment();
        let first = true;
        for (const {segment} of seg.segment(node.textContent)) {
          if (!first && !glue.test(segment)) frag.append(document.createElement('wbr'));
          frag.append(segment);
          first = false;
        }
        node.replaceWith(frag);
      });
    });
    document.documentElement.classList.add('wb-js');
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
