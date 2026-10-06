/* ==========================================================================
   Bombon Spa — rendering, motion & interactions
   ========================================================================== */
(function () {
  "use strict";

  const D = window.BOMBON;
  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const fmtPrice = (n) => n.toLocaleString("en-US");
  const PASTELS = ["var(--cream)", "var(--butter)", "var(--lilac)", "var(--mint)", "var(--paper)"];
  const RITUAL_BG = ["var(--mint)", "var(--blush)", "var(--butter)", "var(--lilac)"];

  /* ---------- responsive <picture> builder ---------- */
  function pic(name, alt, sizes, opts = {}) {
    const img = D.IMAGES[name];
    const set = (ext) => img.widths.map((w) => `assets/img/${name}-${w}.${ext} ${w}w`).join(", ");
    const fallback = `assets/img/${name}-${img.widths[img.widths.length > 1 ? 1 : 0]}.jpg`;
    return `<picture>
      <source type="image/webp" srcset="${set("webp")}" sizes="${sizes}">
      <img src="${fallback}" srcset="${set("jpg")}" sizes="${sizes}" width="${img.w}" height="${img.h}"
           alt="${alt.replace(/"/g, "&quot;")}" loading="lazy" decoding="async"${opts.cls ? ` class="${opts.cls}"` : ""}>
    </picture>`;
  }
  const largest = (name) => `assets/img/${name}-${D.IMAGES[name].widths.slice(-1)[0]}.webp`;

  /* ======================= RENDER ======================= */

  // Service filters + cards
  const filterWrap = $("#menu .filters");
  const cardsWrap = $("#service-cards");
  if (filterWrap && cardsWrap) {
    filterWrap.insertAdjacentHTML("beforeend", D.CATEGORIES.filter((c) => c.id !== "package")
      .map((c) => `<button type="button" class="chip" aria-pressed="false" data-filter="${c.id}">${c.label}</button>`).join(""));

    const catLabel = Object.fromEntries(D.CATEGORIES.map((c) => [c.id, c.label]));
    cardsWrap.innerHTML = D.SERVICES.map((s, i) => `
      <article class="card${s.feature ? " card--feature" : ""}" data-cat="${s.category}" style="--card-bg:${PASTELS[i % PASTELS.length]}">
        <div class="card__media">
          <span class="card__num" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
          ${pic(s.image, s.alt, s.feature ? "(min-width: 1000px) 50vw, (min-width: 760px) 66vw, 100vw" : "(min-width: 1000px) 25vw, (min-width: 600px) 50vw, 100vw")}
        </div>
        <div class="card__body">
          <p class="card__cat">${catLabel[s.category]}</p>
          <h3 class="card__title">${s.name}</h3>
          <p class="card__blurb">${s.blurb}</p>
          <div class="card__foot">
            <p><span class="card__price">${fmtPrice(s.price)}<small>EGP</small></span><span class="card__dur">${s.duration} min</span></p>
            <button type="button" class="btn btn--ghost" data-book="${s.id}" aria-label="Book ${s.name}"><span>Book</span><svg aria-hidden="true"><use href="#i-arrow"/></svg></button>
          </div>
        </div>
      </article>`).join("");

    filterWrap.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter]");
      if (!btn) return;
      const id = btn.dataset.filter;
      $$("[data-filter]", filterWrap).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      let n = 0;
      $$(".card", cardsWrap).forEach((card) => {
        const show = id === "all" || card.dataset.cat === id;
        card.hidden = !show;
        if (show) {
          card.classList.remove("is-in");
          card.style.setProperty("--d", `${(n++) * 0.07}s`);
          void card.offsetWidth;
          card.classList.add("is-in");
        }
      });
    });
  }

  // Rituals
  const ritualList = $("#ritual-list");
  if (ritualList) {
    ritualList.innerHTML = D.PACKAGES.map((p, i) => `
      <article class="ritual" style="--ritual-bg:${RITUAL_BG[i % RITUAL_BG.length]}" aria-labelledby="ritual-${p.id}">
        <button type="button" class="ritual__poster" data-reveal="scale" data-lightbox="rituals" data-index="${i}" aria-label="View the ${p.name} package poster full size">
          ${pic(p.poster, p.alt, "(min-width: 900px) 420px, 90vw")}
        </button>
        <div class="ritual__text">
          <p class="kicker" data-reveal>Ritual Nº ${String(i + 1).padStart(2, "0")}</p>
          <h3 class="ritual__name" id="ritual-${p.id}" data-reveal="mask">${p.name}<small>Package</small></h3>
          <p class="ritual__tag" data-reveal>${p.tagline}</p>
          <ul class="ritual__items" data-reveal aria-label="Included in ${p.name}">
            ${p.items.map((it) => `<li>${it}</li>`).join("")}
          </ul>
          <div class="ritual__foot" data-reveal>
            <p><span class="ritual__price">${fmtPrice(p.price)}<small>EGP</small></span><span class="ritual__dur">Approx. ${Math.round(p.duration / 30) / 2} hours</span></p>
            <button type="button" class="btn btn--pink btn--magnetic" data-book="${p.id}"><span>Book ${p.name}</span><svg aria-hidden="true"><use href="#i-arrow"/></svg></button>
          </div>
        </div>
      </article>`).join("");
  }

  // Lookbook
  const lookGrid = $("#lookbook-grid");
  if (lookGrid) {
    lookGrid.innerHTML = D.LOOKBOOK.map((l, i) => `
      <li class="look look--${l.size}" data-reveal="scale" style="--d:${(i % 4) * 0.07}s">
        <button type="button" class="look__btn" data-lightbox="lookbook" data-index="${i}" aria-label="Open image: ${l.caption}">
          ${pic(l.image, l.alt, l.size === "wide" ? "(min-width: 760px) 50vw, 100vw" : "(min-width: 760px) 25vw, 50vw")}
          <span class="look__cap" aria-hidden="true">${l.caption}</span>
        </button>
      </li>`).join("");
  }

  // Testimonials
  const quotesViewport = $("[data-quotes-viewport]");
  if (quotesViewport) {
    quotesViewport.innerHTML = D.TESTIMONIALS.map((t, i) => `
      <blockquote class="quote${i === 0 ? " is-active" : ""}" aria-roledescription="slide" aria-label="${i + 1} of ${D.TESTIMONIALS.length}" ${i === 0 ? "" : "aria-hidden=\"true\""}>
        <p>${t.quote}</p>
        <footer>${t.name} · <span>${t.detail}</span></footer>
      </blockquote>`).join("");
  }

  /* ======================= INTRO / CURTAIN ======================= */
  const curtain = $(".curtain");
  const panels = curtain ? $$(".curtain__panel", curtain) : [];
  function reveal() { root.classList.add("is-loaded"); }
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 900))]).then(() => requestAnimationFrame(reveal));

  let transitioning = false;
  function goTo(hash, after) {
    const target = hash === "#top" ? document.body : document.querySelector(hash);
    if (!target) return;
    const headerH = parseFloat(getComputedStyle(root).getPropertyValue("--header-h")) || 70;
    const y = hash === "#top" ? 0 : target.getBoundingClientRect().top + window.scrollY - headerH - 8;
    const focusTarget = () => {
      if (after) after();
      else if (target !== document.body) target.focus({ preventScroll: true });
    };
    if (history.replaceState) history.replaceState(null, "", hash);

    const useCurtain = !reduced.matches && curtain && panels[0].animate && Math.abs(y - window.scrollY) > window.innerHeight * 1.2;
    if (!useCurtain) {
      window.scrollTo({ top: y, behavior: reduced.matches ? "auto" : "smooth" });
      focusTarget();
      return;
    }
    if (transitioning) return;
    transitioning = true;
    curtain.classList.add("is-transition");
    const ease = "cubic-bezier(.65,0,.35,1)";
    const inAnims = panels.map((p, i) => p.animate(
      [{ transform: "translateY(101%)" }, { transform: "translateY(0)" }],
      { duration: 520, delay: i * 90, easing: ease, fill: "forwards" }));
    Promise.all(inAnims.map((a) => a.finished)).then(() => {
      window.scrollTo({ top: y, behavior: "instant" });
      focusTarget();
      const outAnims = panels.slice().reverse().map((p, i) => p.animate(
        [{ transform: "translateY(0)" }, { transform: "translateY(-101%)" }],
        { duration: 620, delay: 80 + i * 90, easing: ease, fill: "forwards" }));
      return Promise.all(outAnims.map((a) => a.finished)).then(() => {
        inAnims.concat(outAnims).forEach((a) => a.cancel());
      });
    }).finally(() => { transitioning = false; curtain.classList.remove("is-transition"); });
  }

  /* ======================= NAV LINKS / MENU ======================= */
  const menu = $("#mobile-menu");
  const menuOpen = $("[data-menu-open]");
  if (menu && menuOpen) {
    menuOpen.addEventListener("click", () => { menu.showModal(); menuOpen.setAttribute("aria-expanded", "true"); });
    $("[data-menu-close]", menu).addEventListener("click", () => menu.close());
    menu.addEventListener("close", () => menuOpen.setAttribute("aria-expanded", "false"));
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-transition]");
    if (!a) return;
    const hash = a.getAttribute("href");
    if (!hash || hash.charAt(0) !== "#") return;
    e.preventDefault();
    if (menu && menu.open) menu.close();
    goTo(hash, hash === "#booking" ? focusBookingStep : null);
  });

  function focusBookingStep() {
    const step = $("#booking-form .step:not([hidden]) .step__title");
    if (step) step.focus({ preventScroll: true });
  }

  // "Book" buttons on cards & rituals
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-book]");
    if (!b || !window.BombonBooking) return;
    const title = window.BombonBooking.select(b.dataset.book);
    goTo("#booking", () => title && title.focus({ preventScroll: true }));
  });

  /* ======================= HEADER, PROGRESS, PARALLAX ======================= */
  const header = $("[data-header]");
  const bar = $(".progress span");
  const parallaxEls = $$("[data-parallax]");
  let lastY = window.scrollY;
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.setProperty("--p", max > 0 ? (y / max).toFixed(4) : 0);
    if (header) {
      header.classList.toggle("is-scrolled", y > 24);
      const goingDown = y > lastY + 4;
      const goingUp = y < lastY - 4;
      if (goingDown && y > 480 && !transitioning) header.classList.add("is-hidden");
      else if (goingUp || y < 480) header.classList.remove("is-hidden");
    }
    if (!reduced.matches) {
      const vh = window.innerHeight;
      parallaxEls.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const speed = parseFloat(el.dataset.parallax) || 0;
        const limit = r.height * 0.1;
        const offset = Math.max(-limit, Math.min(limit, (r.top + r.height / 2 - vh / 2) * speed));
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      });
    }
    lastY = y;
    ticking = false;
  }
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener("resize", () => requestAnimationFrame(onScroll), { passive: true });
  onScroll();

  // Show the header whenever keyboard focus lands in it
  if (header) header.addEventListener("focusin", () => header.classList.remove("is-hidden"));

  // Active section in nav
  const navLinks = $$(".nav__list a");
  if ("IntersectionObserver" in window && navLinks.length) {
    const map = new Map(navLinks.map((a) => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => a.removeAttribute("aria-current"));
        const link = map.get(en.target.id);
        if (link) link.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach((s) => io.observe(s));
  }

  /* ======================= SCROLL REVEALS ======================= */
  const revealTargets = $$("[data-reveal], .card");
  if ("IntersectionObserver" in window && !reduced.matches) {
    const io = new IntersectionObserver((entries) => {
      let batch = 0;
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        (watched.get(en.target) || []).forEach((t) => {
          if (t.classList.contains("card")) t.style.setProperty("--d", `${(batch++) * 0.08}s`);
          t.classList.add("is-in");
        });
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    // A fully clipped "mask" headline has no visible area, so observe its parent instead
    const watched = new Map();
    revealTargets.forEach((t) => {
      const key = t.dataset.reveal === "mask" ? t.parentElement : t;
      if (!watched.has(key)) watched.set(key, []);
      watched.get(key).push(t);
    });
    watched.forEach((_, key) => io.observe(key));
  } else {
    revealTargets.forEach((t) => t.classList.add("is-in"));
  }

  /* ======================= MICRO-INTERACTIONS ======================= */
  if (finePointer.matches && !reduced.matches) {
    // Magnetic buttons
    document.addEventListener("pointermove", (e) => {
      const btn = e.target.closest && e.target.closest(".btn--magnetic");
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      btn.style.setProperty("--mx", `${((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1)}px`);
      btn.style.setProperty("--my", `${((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1)}px`);
    });
    document.addEventListener("pointerout", (e) => {
      const btn = e.target.closest && e.target.closest(".btn--magnetic");
      if (btn && !btn.contains(e.relatedTarget)) { btn.style.setProperty("--mx", "0px"); btn.style.setProperty("--my", "0px"); }
    });

    // Card tilt
    $$(".card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty("--ry", `${(px * 6).toFixed(2)}deg`);
        card.style.setProperty("--rx", `${(-py * 6).toFixed(2)}deg`);
      });
      card.addEventListener("pointerleave", () => { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); });
    });
  }

  /* ======================= LIGHTBOX ======================= */
  const lb = $("#lightbox");
  if (lb) {
    const groups = {
      lookbook: D.LOOKBOOK.map((l) => ({ src: largest(l.image), alt: l.alt, caption: l.caption })),
      services: [{ src: largest("services"), alt: D.SERVICES_POSTER_ALT, caption: "Our Services" }],
      rituals: D.PACKAGES.map((p) => ({ src: largest(p.poster), alt: p.alt, caption: `${p.title}: ${fmtPrice(p.price)} EGP` })),
    };
    const img = $("[data-lb-img]", lb);
    const cap = $("[data-lb-caption]", lb);
    let group = "lookbook", index = 0, opener = null;

    const show = (i) => {
      const items = groups[group];
      index = (i + items.length) % items.length;
      const it = items[index];
      $("[data-lb-prev]", lb).hidden = $("[data-lb-next]", lb).hidden = items.length < 2;
      img.style.animation = "none"; void img.offsetWidth; img.style.animation = "";
      img.src = it.src; img.alt = it.alt;
      cap.textContent = `${String(index + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}  ·  ${it.caption}`;
    };

    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-lightbox]");
      if (!t) return;
      group = t.dataset.lightbox; opener = t;
      show(Number(t.dataset.index) || 0);
      lb.showModal();
      $("[data-lb-close]", lb).focus();
    });
    $("[data-lb-close]", lb).addEventListener("click", () => lb.close());
    $("[data-lb-prev]", lb).addEventListener("click", () => show(index - 1));
    $("[data-lb-next]", lb).addEventListener("click", () => show(index + 1));
    lb.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); show(index + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); show(index - 1); }
    });
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target.classList.contains("lightbox__figure")) lb.close(); });
    lb.addEventListener("close", () => { if (opener) opener.focus(); });
  }

  /* ======================= TESTIMONIALS ======================= */
  const quotes = $("[data-quotes]");
  if (quotes && quotesViewport) {
    const slides = $$(".quote", quotesViewport);
    const count = $("[data-quotes-count]", quotes);
    const toggle = $("[data-quotes-toggle]", quotes);
    let i = 0, timer = null, userPaused = reduced.matches, hoverPaused = false;

    const go = (n) => {
      slides[i].classList.remove("is-active"); slides[i].setAttribute("aria-hidden", "true");
      i = (n + slides.length) % slides.length;
      slides[i].classList.add("is-active"); slides[i].removeAttribute("aria-hidden");
      count.textContent = `${String(i + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    };
    const sync = () => {
      clearInterval(timer);
      const playing = !userPaused && !hoverPaused;
      quotesViewport.setAttribute("aria-live", playing ? "off" : "polite");
      toggle.setAttribute("aria-pressed", String(userPaused));
      toggle.textContent = userPaused ? "Play" : "Pause";
      if (playing) timer = setInterval(() => go(i + 1), 6500);
    };
    $("[data-quotes-prev]", quotes).addEventListener("click", () => { go(i - 1); sync(); });
    $("[data-quotes-next]", quotes).addEventListener("click", () => { go(i + 1); sync(); });
    toggle.addEventListener("click", () => { userPaused = !userPaused; sync(); });
    quotes.addEventListener("pointerenter", () => { hoverPaused = true; sync(); });
    quotes.addEventListener("pointerleave", () => { hoverPaused = false; sync(); });
    quotes.addEventListener("focusin", () => { hoverPaused = true; sync(); });
    quotes.addEventListener("focusout", (e) => { if (!quotes.contains(e.relatedTarget)) { hoverPaused = false; sync(); } });
    sync();
  }

  /* ======================= MY BOOKINGS DRAWER ======================= */
  const drawer = $("#bookings-drawer");
  const openBtn = $("[data-my-bookings]");
  const badge = $("[data-bookings-count]");
  const updateBadge = () => {
    if (!badge || !window.BombonBooking) return;
    const n = window.BombonBooking.activeCount();
    badge.textContent = n; badge.hidden = n === 0;
  };
  if (drawer && openBtn && window.BombonBooking) {
    const list = $("[data-bookings-list]", drawer);
    openBtn.addEventListener("click", () => { window.BombonBooking.renderList(list); drawer.showModal(); });
    $("[data-drawer-close]", drawer).addEventListener("click", () => drawer.close());
    drawer.addEventListener("click", (e) => {
      if (e.target === drawer) {
        const r = drawer.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) drawer.close();
      }
      const c = e.target.closest("[data-cancel]");
      if (!c) return;
      if (c.dataset.armed) {
        window.BombonBooking.cancelBooking(c.dataset.cancel);
        window.BombonBooking.renderList(list);
        $("[data-drawer-close]", drawer).focus();
      } else {
        c.dataset.armed = "1";
        c.textContent = "Tap again to cancel";
        setTimeout(() => { if (c.isConnected) { delete c.dataset.armed; c.textContent = "Cancel"; } }, 3500);
      }
    });
    drawer.addEventListener("close", () => openBtn.focus());
  }
  document.addEventListener("bombon:bookings-changed", updateBadge);
  window.addEventListener("storage", updateBadge);
  updateBadge();

  /* ======================= FLOATING ACTIONS ======================= */
  const fab = $(".fab");
  const bookingSection = $("#booking");
  const contactSection = $("#contact");
  if (fab && "IntersectionObserver" in window) {
    const visible = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => (en.isIntersecting ? visible.add(en.target) : visible.delete(en.target)));
      fab.classList.toggle("is-hidden", visible.size > 0);
    });
    [bookingSection, contactSection, $(".footer")].forEach((s) => s && io.observe(s));
  }

  /* ======================= MISC ======================= */
  const year = $("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
