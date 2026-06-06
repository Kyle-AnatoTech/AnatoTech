/* ============================================================
   ANATO-TECH — main.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Scroll Reveal ──────────────────────────────────────── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));


  /* ── Active Nav Link on Scroll ──────────────────────────── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(s => navObserver.observe(s));


  /* ── Stat Counter Animation ─────────────────────────────── */
  function animateCount(el) {
    const display  = el.dataset.display;
    const target   = parseFloat(el.dataset.target);
    const suffix   = el.dataset.suffix || '';
    const duration = 1600;
    const start    = performance.now();

    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4); // ease-out-quart
      el.textContent = Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = display;
    }
    requestAnimationFrame(step);
  }

  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        statObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.big-stat-number').forEach(el => statObserver.observe(el));


  /* ── Testimonial Card 3-D Tilt ──────────────────────────── */
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;

  if (isFinePointer) {
    document.querySelectorAll('.testimonial-card').forEach(card => {
      const STRENGTH = 6; // max tilt degrees

      card.addEventListener('mousemove', e => {
        const r   = card.getBoundingClientRect();
        const x   = (e.clientX - r.left) / r.width  - 0.5; // -0.5 to 0.5
        const y   = (e.clientY - r.top)  / r.height - 0.5;
        card.style.setProperty('--ry', `${(x * STRENGTH).toFixed(2)}deg`);
        card.style.setProperty('--rx', `${(-y * STRENGTH * 0.6).toFixed(2)}deg`);
        card.style.setProperty('--ty', '-5px');
        card.style.transition = 'box-shadow 0.25s ease'; // shadow only — transform is JS-driven
      });

      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform 0.5s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s ease';
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--ty', '0px');
      });
    });
  }


  /* ── Feature Card Icon Lift ─────────────────────────────── */
  // Handled purely in CSS via .feature-card:hover .feature-icon svg


  /* ── Quantity Controls ──────────────────────────────────── */
  document.querySelectorAll('.product-actions').forEach(actions => {
    const dec   = actions.querySelector('[data-action="dec"]');
    const inc   = actions.querySelector('[data-action="inc"]');
    const input = actions.querySelector('.qty-input');

    dec.addEventListener('click', () => {
      const v = parseInt(input.value) || 1;
      if (v > 1) { input.value = v - 1; wiggle(dec); }
    });
    inc.addEventListener('click', () => {
      const v = parseInt(input.value) || 1;
      if (v < 99) { input.value = v + 1; wiggle(inc); }
    });
    input.addEventListener('change', () => {
      const v = parseInt(input.value);
      input.value = isNaN(v) || v < 1 ? 1 : Math.min(v, 99);
    });
  });

  function wiggle(el) {
    el.style.transform = 'scale(0.82)';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transform = '';
      });
    });
  }


  /* ── Cart ───────────────────────────────────────────────── */
  const cartDrawer   = document.getElementById('cartDrawer');
  const cartOverlay  = document.getElementById('cartOverlay');
  const cartClose    = document.getElementById('cartClose');
  const cartFab      = document.getElementById('cartFab');
  const cartFabCount = document.getElementById('cartFabCount');
  const cartItemsEl  = document.getElementById('cartItems');
  const cartFooter   = document.getElementById('cartFooter');
  const cartTotalEl  = document.getElementById('cartTotal');

  let cart = {};

  function openCart() {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('open');
    cartDrawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
    cartDrawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  cartClose.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);
  cartFab.addEventListener('click', openCart);

  function renderCart() {
    const items = Object.values(cart);
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    const count = items.reduce((s, i) => s + i.qty, 0);

    cartFabCount.textContent = count;

    if (items.length === 0) {
      cartItemsEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
      cartFooter.style.display = 'none';
    } else {
      cartItemsEl.innerHTML = items.map(item => `
        <div class="cart-item">
          <div class="cart-item-name">${item.name}</div>
          <span class="cart-item-qty">×${item.qty}</span>
          <span class="cart-item-price">$${(item.price * item.qty).toLocaleString()}</span>
          <button class="cart-item-remove" data-id="${item.id}" aria-label="Remove ${item.name}">✕</button>
        </div>
      `).join('');
      cartFooter.style.display = 'flex';
      cartTotalEl.textContent = '$' + total.toLocaleString();

      cartItemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          delete cart[btn.dataset.id];
          renderCart();
        });
      });
    }
  }

  document.querySelectorAll('.btn-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const id    = btn.dataset.product;
      const name  = btn.dataset.name;
      const price = parseInt(btn.dataset.price);
      const qtyInput = btn.closest('.product-actions').querySelector('.qty-input');
      const qty   = parseInt(qtyInput.value) || 1;

      if (cart[id]) cart[id].qty += qty;
      else cart[id] = { id, name, price, qty };

      renderCart();
      openCart();

      // Spring pop on FAB
      cartFab.classList.remove('pop');
      void cartFab.offsetWidth; // reflow to retrigger
      cartFab.classList.add('pop');
      cartFab.addEventListener('animationend', () => cartFab.classList.remove('pop'), { once: true });

      // Button success state
      const orig = btn.innerHTML;
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Added';
      btn.style.background = 'var(--precision-teal)';
      btn.style.color = 'var(--bg-dark)';
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.style.background = '';
        btn.style.color = '';
        btn.disabled = false;
      }, 1400);
    });
  });

  renderCart();


  /* ── Mobile Nav ─────────────────────────────────────────── */
  const hamburger     = document.getElementById('hamburger');
  const mobileNav     = document.getElementById('mobileNav');
  const mobileClose   = document.getElementById('mobileNavClose');
  const mobileOverlay = document.getElementById('mobileNavOverlay');

  function openNav() {
    mobileNav.classList.add('open');
    mobileNav.setAttribute('aria-hidden', 'false');
    mobileOverlay.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden', 'true');
    mobileOverlay.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', openNav);
  mobileClose.addEventListener('click', closeNav);
  mobileOverlay.addEventListener('click', closeNav);
  document.querySelectorAll('.mobile-nav-link, .mobile-nav .btn').forEach(l => l.addEventListener('click', closeNav));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeNav(); closeCart(); } });


  /* ── Hero Cursor Glow ───────────────────────────────────── */
  const hero = document.querySelector('.hero');
  if (hero && isFinePointer) {
    hero.addEventListener('mousemove', e => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      hero.style.setProperty('--gy', ((e.clientY - r.top)  / r.height * 100).toFixed(1) + '%');
    });
  }


  /* ── Smooth Scroll ──────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const id = anchor.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

});
