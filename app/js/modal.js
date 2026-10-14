// Rounded modals, step-by-step question wizards and the visual building blocks they use.

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') {
      for (const [p, val] of Object.entries(v)) if (val != null) el.style.setProperty(p.startsWith('--') ? p : p.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`), val);
    }
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) if (c != null && c !== false) el.append(c instanceof Node ? c : document.createTextNode(c));
  return el;
}

let current = null;
export const modalOpen = () => !!current;

/** Base modal. Returns { el, body, foot, head, close }. */
export function openModal({ theme = '#8d47dc', icon = '', title = '', subtitle = '', onClose, wide = false } = {}) {
  if (current) current.close(true);
  const lastFocus = document.activeElement;
  const avatar = h('div', { class: 'modal-avatar' });
  if (typeof icon === 'string' && icon.trim().startsWith('<svg')) avatar.innerHTML = icon; else avatar.textContent = icon;
  const titleEl = h('h2', { id: 'modal-title' }, title);
  const subEl = h('p', {}, subtitle);
  const xBtn = h('button', { class: 'modal-x', 'aria-label': 'Close' }, '✕');
  const head = h('header', { class: 'modal-head' }, avatar, h('div', { class: 'modal-titles' }, titleEl, subEl), xBtn);
  const nav = h('nav', { class: 'steps', hidden: true });
  const body = h('section', { class: 'modal-body' });
  const foot = h('footer', { class: 'modal-foot' });
  const modal = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'modal-title', style: { '--theme': theme, width: wide ? 'min(980px, 100%)' : null } },
    head, nav, body, foot);
  const backdrop = h('div', { class: 'modal-backdrop' }, modal);
  document.getElementById('modal-root').append(backdrop);

  const onKey = e => { if (e.key === 'Escape') ctl.close(); };
  const ctl = {
    el: modal, body, foot, nav, head, avatar, titleEl, subEl,
    close(immediate = false) {
      if (current !== ctl) return;
      current = null;
      document.removeEventListener('keydown', onKey);
      const done = () => { backdrop.remove(); lastFocus?.focus?.({ preventScroll: true }); onClose?.(); };
      if (immediate) done();
      else { modal.classList.add('closing'); backdrop.style.transition = 'opacity .18s'; backdrop.style.opacity = '0'; setTimeout(done, 180); }
    },
  };
  xBtn.onclick = () => ctl.close();
  backdrop.addEventListener('mousedown', e => { if (e.target === backdrop) ctl.close(); });
  document.addEventListener('keydown', onKey);
  current = ctl;
  setTimeout(() => (modal.querySelector('input, .tile, .btn-primary') || xBtn).focus({ preventScroll: true }), 60);
  return ctl;
}

/**
 * Question wizard: one visual question per step, step chips at the top turn blue once answered.
 * steps: [{ label, title, hint, render(container, refresh), done() }]
 */
export function openWizard({ steps, start = 0, onChange, footerLeft, finishLabel = 'All done! ✨', ...opts }) {
  const m = openModal(opts);
  let idx = Math.min(start, steps.length - 1);
  m.nav.hidden = false;
  const back = h('button', { class: 'btn btn-ghost' }, '← Back');
  const next = h('button', { class: 'btn btn-primary' });
  const left = h('div', {});
  m.foot.append(left, h('div', { class: 'spacer' }), back, next);
  if (footerLeft) footerLeft(left, m);

  const drawNav = () => {
    m.nav.replaceChildren(...steps.map((s, i) => h('button', {
      class: `step-dot${s.done() ? ' done' : ''}${i === idx ? ' current' : ''}`,
      onclick: () => { idx = i; draw(); },
      'aria-current': i === idx ? 'step' : null,
    }, s.done() ? '✓' : `${i + 1}`, ' ', s.label)));
    back.disabled = idx === 0;
    next.textContent = idx === steps.length - 1 ? finishLabel : 'Next →';
  };
  const refresh = () => { onChange?.(); drawNav(); };
  const draw = () => {
    const s = steps[idx];
    const content = h('div', { class: 'q-content' });
    m.body.replaceChildren(h('h3', { class: 'q-title' }, s.title), s.hint ? h('p', { class: 'q-hint' }, s.hint) : '', content);
    s.render(content, refresh, m);
    m.body.scrollTop = 0;
    drawNav();
  };
  back.onclick = () => { if (idx > 0) { idx--; draw(); } };
  next.onclick = () => { if (idx < steps.length - 1) { idx++; draw(); } else m.close(); };
  draw();
  m.redraw = draw;
  return m;
}

// ---- visual pieces --------------------------------------------------------------

function tile(opt, cls, onclick) {
  return h('button', { class: `tile ${cls}`, type: 'button', onclick, 'aria-pressed': cls.includes('sel') ? 'true' : 'false' },
    h('span', { class: 't-emoji', 'aria-hidden': 'true' }, opt.emoji, opt.no ? h('span', { class: 'no-mark' }, '🚫') : ''),
    h('span', { class: 't-label' }, opt.label),
    opt.sub ? h('span', { class: 't-sub' }, opt.sub) : '');
}

/** Pick one. */
export function choiceTiles(options, value, onPick, { size = '' } = {}) {
  return h('div', { class: `tiles ${size}` }, options.map(o =>
    tile(o, value === o.id ? 'sel' : '', () => onPick(o.id))));
}

/** Pick many. `exclusive` is an id (like "none") that clears the others. */
export function multiTiles(options, values, onChange, { exclusive = 'none', size = '' } = {}) {
  return h('div', { class: `tiles ${size}` }, options.map(o => tile(o, values.includes(o.id) ? 'sel' : '', () => {
    let next;
    if (values.includes(o.id)) next = values.filter(v => v !== o.id);
    else if (o.id === exclusive) next = [o.id];
    else next = [...values.filter(v => v !== exclusive), o.id];
    onChange(next);
  })));
}

/** Food tiles: tap once = love, twice = won't eat, three times = clear. */
export function triTiles(items, map, onChange) {
  return h('div', { class: 'tiles small' }, items.map(([id, emoji, label]) => {
    const v = map[id];
    return tile({ emoji, label }, v || '', () => {
      const next = { ...map };
      if (!v) next[id] = 'love'; else if (v === 'love') next[id] = 'no'; else delete next[id];
      onChange(next);
    });
  }));
}

export function toast(msg, ms = 2600) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), ms);
}

export function confetti() {
  const bits = ['🍕', '🥕', '🌮', '🍝', '⭐', '🛸', '🍲', '✨', '🥦', '🧁'];
  for (let i = 0; i < 36; i++) {
    const c = h('div', { class: 'confetti', style: { left: `${Math.random() * 100}vw`, animationDuration: `${2.2 + Math.random() * 2}s`, animationDelay: `${Math.random() * 0.6}s` } },
      bits[i % bits.length]);
    document.body.append(c);
    setTimeout(() => c.remove(), 5000);
  }
}
