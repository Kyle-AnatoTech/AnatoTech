/* ============================================================
   ANATO-TECH — main.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Nav: hide on scroll down, show on any scroll up ───── */
  const nav = document.getElementById('nav');
  let lastY = window.scrollY;

  /* ── Hero video: scroll-driven motion ──────────────────── */
  const heroVideo = document.getElementById('heroVideo');
  const heroVideoInner = document.getElementById('heroVideoInner');
  const videoFill = document.getElementById('videoFill');
  const videoTime = document.getElementById('videoTime');
  const videoEl = heroVideo ? heroVideo.querySelector('video') : null;

  function onScroll() {
    const y = window.scrollY;
    if (y < lastY - 1 || y < 64) nav.classList.remove('nav-hidden');
    else if (y > lastY + 4) nav.classList.add('nav-hidden');
    lastY = y;

    if (heroVideo && !reduceMotion) {
      const p = Math.max(0, Math.min(1, y / (window.innerHeight * 0.9)));
      heroVideo.style.transform = `translateY(${-p * 60}px) rotateX(${p * 8}deg) rotateY(${-6 + p * 12}deg) scale(${1 - p * 0.04})`;
      if (heroVideoInner) heroVideoInner.style.transform = `translateY(${p * 40}px) scale(${1 + p * 0.08})`;
      if (videoFill) videoFill.style.width = (p * 100).toFixed(1) + '%';
      if (videoTime) videoTime.textContent = '0:' + String(Math.round(p * 30)).padStart(2, '0');
      if (videoEl && videoEl.duration) videoEl.currentTime = p * videoEl.duration;
    }
  }
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(() => { onScroll(); ticking = false; }); ticking = true; }
  }, { passive: true });
  onScroll();


  /* ── Active nav link ───────────────────────────────────── */
  const navLinks = document.querySelectorAll('.nav-link');
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id));
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('section[id]').forEach(s => navObserver.observe(s));


  /* ── 3D model viewer ───────────────────────────────────── */
  const POINTS = [
    { title: 'Cortical bone resistance', spec: '3–5mm', pos: [40, -70, 45], rx: -6, ry: -20,
      desc: 'A high-density polyurethane shell reproduces the drilling resistance and distinct "pop" of real cortical bone.' },
    { title: '4-layer anatomy', spec: '4 layers', pos: [-120, -10, 90], rx: -4, ry: 28,
      desc: 'Skin, subcutaneous tissue, cortical shell, and medullary cavity — each layer delivers the depth cues of a real proximal humerus.' },
    { title: 'Tool-free inserts', spec: '<30s', pos: [115, 95, 60], rx: 8, ry: -34,
      desc: 'Skin and cortical layers swap from the rear in under 30 seconds. Each insert set supports 50+ full insertions.' },
    { title: 'Palpable landmarks', spec: '1–2cm', pos: [-30, -150, 30], rx: -18, ry: 8,
      desc: 'The humeral head and tuberosity are palpable through the skin. The arm sits adducted and internally rotated, as in practice.' },
    { title: 'Portable and stable', spec: '<6 lbs', pos: [-95, 150, 20], rx: 14, ry: 24,
      desc: 'Under 6 lbs and stable on any flat surface during insertion. No mounting hardware for sim labs, classrooms, or the field.' },
  ];

  const stage = document.getElementById('stage');
  const scene = document.getElementById('scene');
  const hotspotsEl = document.getElementById('hotspots');
  const propsList = document.getElementById('propsList');

  if (stage && scene) {
    let rx = -8, ry = -22, active = 0, drag = null, lastInteract = Date.now(), t = 0;

    const hotspots = POINTS.map((p, i) => {
      const el = document.createElement('div');
      el.className = 'hotspot';
      el.innerHTML = `<button class="hotspot-btn" aria-label="${p.title}">${i + 1}</button><span class="hotspot-label">${p.title}</span>`;
      el.querySelector('button').addEventListener('pointerdown', e => e.stopPropagation());
      el.querySelector('button').addEventListener('click', () => select(i));
      hotspotsEl.appendChild(el);
      return el;
    });

    const rows = POINTS.map((p, i) => {
      const b = document.createElement('button');
      b.className = 'prop';
      b.setAttribute('role', 'listitem');
      b.innerHTML = `<span class="prop-n">${String(i + 1).padStart(2, '0')}</span><span class="prop-title">${p.title}</span><span class="prop-spec">${p.spec.replace('<', '&lt;')}</span><span class="prop-desc">${p.desc}</span>`;
      b.addEventListener('click', () => select(i));
      propsList.appendChild(b);
      return b;
    });

    function render() {
      scene.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      hotspots.forEach((el, i) => {
        const [x, y, z] = POINTS[i].pos;
        el.style.transform = `translate3d(${x}px,${y}px,${z}px) rotateY(${-ry}deg) rotateX(${-rx}deg)`;
        el.classList.toggle('active', i === active);
      });
      rows.forEach((r, i) => r.classList.toggle('active', i === active));
    }

    function select(i) {
      lastInteract = Date.now();
      active = i; rx = POINTS[i].rx; ry = POINTS[i].ry;
      scene.classList.remove('no-anim');
      render();
    }

    stage.addEventListener('pointerdown', e => {
      drag = { x: e.clientX, y: e.clientY, rx, ry };
      stage.classList.add('dragging');
      scene.classList.add('no-anim');
    });
    window.addEventListener('pointermove', e => {
      if (!drag) return;
      ry = Math.max(-70, Math.min(70, drag.ry + (e.clientX - drag.x) * 0.35));
      rx = Math.max(-35, Math.min(35, drag.rx - (e.clientY - drag.y) * 0.25));
      render();
    });
    window.addEventListener('pointerup', () => {
      if (!drag) return;
      drag = null; lastInteract = Date.now();
      stage.classList.remove('dragging');
      scene.classList.remove('no-anim');
    });

    // Gentle idle sway after 5s without interaction
    if (!reduceMotion) {
      setInterval(() => {
        if (drag || Date.now() - lastInteract < 5000) return;
        scene.classList.add('no-anim');
        t += 0.02; ry += Math.sin(t) * 0.12;
        render();
      }, 40);
    }

    render();
  }


  /* ── Quantity controls ─────────────────────────────────── */
  document.querySelectorAll('.product-actions').forEach(actions => {
    const dec = actions.querySelector('[data-action="dec"]');
    const inc = actions.querySelector('[data-action="inc"]');
    const input = actions.querySelector('.qty-input');
    dec.addEventListener('click', () => { const v = parseInt(input.value) || 1; if (v > 1) { input.value = v - 1; wiggle(dec); } });
    inc.addEventListener('click', () => { const v = parseInt(input.value) || 1; if (v < 99) { input.value = v + 1; wiggle(inc); } });
    input.addEventListener('change', () => { const v = parseInt(input.value); input.value = isNaN(v) || v < 1 ? 1 : Math.min(v, 99); });
  });

  function wiggle(el) {
    el.style.transform = 'scale(0.82)';
    requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transform = ''; }));
  }


  /* ── Cart ──────────────────────────────────────────────── */
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartFab = document.getElementById('cartFab');
  const cartFabCount = document.getElementById('cartFabCount');
  const cartItemsEl = document.getElementById('cartItems');
  const cartFooter = document.getElementById('cartFooter');
  const cartTotalEl = document.getElementById('cartTotal');
  let cart = {};

  function openCart() {
    cartDrawer.classList.add('open'); cartOverlay.classList.add('open');
    cartDrawer.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
  }
  function closeCart() {
    cartDrawer.classList.remove('open'); cartOverlay.classList.remove('open');
    cartDrawer.setAttribute('aria-hidden', 'true'); document.body.style.overflow = '';
  }
  document.getElementById('cartClose').addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);
  cartFab.addEventListener('click', openCart);

  function renderCart() {
    const items = Object.values(cart);
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    cartFabCount.textContent = items.reduce((s, i) => s + i.qty, 0);
    if (!items.length) {
      cartItemsEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
      cartFooter.style.display = 'none';
      return;
    }
    cartItemsEl.innerHTML = items.map(item => `
      <div class="cart-item">
        <div class="cart-item-name">${item.name}</div>
        <span class="cart-item-qty">×${item.qty}</span>
        <span class="cart-item-price">$${(item.price * item.qty).toLocaleString()}</span>
        <button class="cart-item-remove" data-id="${item.id}" aria-label="Remove ${item.name}">✕</button>
      </div>`).join('');
    cartFooter.style.display = 'flex';
    cartTotalEl.textContent = '$' + total.toLocaleString();
    cartItemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', () => { delete cart[btn.dataset.id]; renderCart(); });
    });
  }

  document.querySelectorAll('.btn-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.product;
      const qty = parseInt(btn.closest('.product-actions').querySelector('.qty-input').value) || 1;
      if (cart[id]) cart[id].qty += qty;
      else cart[id] = { id, name: btn.dataset.name, price: parseInt(btn.dataset.price), qty };
      renderCart();
      openCart();

      cartFab.classList.remove('pop'); void cartFab.offsetWidth; cartFab.classList.add('pop');
      cartFab.addEventListener('animationend', () => cartFab.classList.remove('pop'), { once: true });

      const orig = btn.innerHTML;
      btn.innerHTML = '✓ Added';
      btn.style.background = 'var(--marrow-teal)';
      btn.style.color = 'var(--anato-graphite)';
      btn.disabled = true;
      setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; btn.style.color = ''; btn.disabled = false; }, 1400);
    });
  });
  renderCart();


  /* ── Mobile nav ────────────────────────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');
  const mobileOverlay = document.getElementById('mobileNavOverlay');
  function openNav() {
    mobileNav.classList.add('open'); mobileNav.setAttribute('aria-hidden', 'false');
    mobileOverlay.classList.add('open'); hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeNav() {
    mobileNav.classList.remove('open'); mobileNav.setAttribute('aria-hidden', 'true');
    mobileOverlay.classList.remove('open'); hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  hamburger.addEventListener('click', openNav);
  document.getElementById('mobileNavClose').addEventListener('click', closeNav);
  mobileOverlay.addEventListener('click', closeNav);
  document.querySelectorAll('.mobile-nav-link').forEach(l => l.addEventListener('click', closeNav));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeNav(); closeCart(); } });
});
