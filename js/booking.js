/* ==========================================================================
   Bombon Spa — multi-step booking flow
   Service → Date & time (10:00–20:00, daily) → Details → Confirmation
   Bookings are stored on this device in localStorage["bombon.bookings"].
   ========================================================================== */
(function () {
  "use strict";

  const D = window.BOMBON;
  const form = document.getElementById("booking-form");
  if (!D || !form) return;

  const B = D.BUSINESS;
  const KEY = "bombon.bookings";
  const OPEN = toMin(B.open);
  const CLOSE = toMin(B.close);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const $ = (sel, root = form) => root.querySelector(sel);
  const $$ = (sel, root = form) => Array.from(root.querySelectorAll(sel));

  const el = {
    steps: $$("[data-step]"),
    progress: $$("[data-progress]"),
    filters: $("[data-booking-filters]"),
    options: $("[data-service-options]"),
    dates: $("[data-dates]"),
    slots: $("[data-slots]"),
    selected: $("[data-selected-service]"),
    summaryLine: $("[data-summary-line]"),
    summary: $("[data-summary]"),
    nav: $("[data-nav]"),
    back: $("[data-back]"),
    next: $("[data-next]"),
    name: $("#bk-name"),
    phone: $("#bk-phone"),
    notes: $("#bk-notes"),
    consent: $("#bk-consent"),
    receipt: $("[data-receipt]"),
    doneName: $("[data-done-name]"),
    doneWa: $("[data-done-wa]"),
    doneIcs: $("[data-done-ics]"),
    restart: $("[data-restart]"),
    burst: $("[data-burst]"),
  };

  const state = { step: 1, serviceId: null, date: null, time: null, filter: "all", last: null };

  /* ---------- storage ---------- */
  const store = {
    read() {
      try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
    },
    write(list) {
      try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch (e) { return false; }
    },
  };

  /* ---------- helpers ---------- */
  function toMin(hhmm) { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; }
  const pad = (n) => String(n).padStart(2, "0");
  function fmtTime(min) {
    const h = Math.floor(min / 60), m = min % 60;
    return `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? "AM" : "PM"}`;
  }
  function dateKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function keyToDate(key) { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d); }
  function fmtDate(key, opts) {
    return new Intl.DateTimeFormat("en-GB", opts || { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(keyToDate(key));
  }
  const fmtPrice = (n) => `${n.toLocaleString("en-US")} EGP`;
  const fmtDur = (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}` : `${m} min`);
  const service = (id) => D.ALL.find((s) => s.id === id);
  const thumb = (name) => `assets/img/${name}-${D.IMAGES[name].widths[0]}.webp`;
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function makeRef() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = new Uint8Array(6);
    (window.crypto || window.msCrypto).getRandomValues(bytes);
    return "BB-" + Array.from(bytes, (b) => chars[b % chars.length]).join("");
  }
  function nowMinutes() { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); }
  function normalisePhone(raw) {
    let d = String(raw).replace(/\D/g, "");
    if (d.startsWith("0020")) d = d.slice(4);
    else if (d.startsWith("20") && d.length === 12) d = d.slice(2);
    if (d.length === 10 && d.startsWith("1")) d = "0" + d;
    return d;
  }

  /* ---------- step 1: services ---------- */
  function renderServiceStep() {
    const cats = [{ id: "all", label: "All" }].concat(D.CATEGORIES);
    el.filters.innerHTML = cats.map((c) =>
      `<button type="button" class="chip" data-bfilter="${c.id}" aria-pressed="${c.id === state.filter}">${c.label}</button>`).join("");

    const list = D.PACKAGES.concat(D.SERVICES);
    el.options.innerHTML = list.map((s) => `
      <label class="choice" data-cat="${s.category}">
        <input class="choice-input" type="radio" name="service" value="${s.id}">
        <span class="choice__body">
          <img src="${thumb(s.image)}" alt="" width="56" height="56" loading="lazy" decoding="async">
          <span>
            <span class="choice__name">${s.category === "package" ? `The ${s.name} Package` : s.name}</span>
            <span class="choice__meta">${fmtDur(s.duration)} · <b>${fmtPrice(s.price)}</b></span>
          </span>
        </span>
      </label>`).join("");
  }

  function applyServiceFilter(id) {
    state.filter = id;
    $$("[data-bfilter]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.bfilter === id)));
    $$(".choice", el.options).forEach((c) => { c.hidden = id !== "all" && c.dataset.cat !== id; });
  }

  /* ---------- step 2: dates & slots ---------- */
  function bookedRanges(key) {
    return store.read()
      .filter((b) => b.status !== "cancelled" && b.date === key)
      .map((b) => [b.start, b.start + b.duration]);
  }

  function slotsFor(key, duration) {
    const isToday = key === dateKey(new Date());
    const cutoff = isToday ? nowMinutes() + 30 : -1; // need at least 30 min notice
    const taken = bookedRanges(key);
    const out = [];
    for (let t = OPEN; t + duration <= CLOSE; t += B.slotMinutes) {
      const clash = taken.some(([s, e]) => t < e && s < t + duration);
      out.push({ t, disabled: t <= cutoff || clash, reason: t <= cutoff ? "past" : clash ? "booked" : "" });
    }
    return out;
  }

  function renderDates() {
    const s = service(state.serviceId);
    const days = [];
    const d = new Date();
    while (days.length < B.bookingDays) {
      const key = dateKey(d);
      if (slotsFor(key, s.duration).some((x) => !x.disabled)) days.push(key);
      d.setDate(d.getDate() + 1);
      if (days.length === 0 && d - new Date() > 864e5 * 60) break; // safety
    }
    if (!state.date || !days.includes(state.date)) state.date = days[0] || null;

    el.dates.innerHTML = days.map((key, i) => {
      const dt = keyToDate(key);
      const today = i === 0 && key === dateKey(new Date());
      const dow = today ? "Today" : new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(dt);
      return `
        <label class="choice date">
          <input class="choice-input" type="radio" name="date" value="${key}" ${key === state.date ? "checked" : ""}
                 aria-label="${fmtDate(key, { weekday: "long", day: "numeric", month: "long" })}">
          <span class="choice__body" aria-hidden="true">
            <span class="date__dow">${dow}</span>
            <span class="date__day">${dt.getDate()}</span>
            <span class="date__mon">${new Intl.DateTimeFormat("en-GB", { month: "short" }).format(dt)}</span>
          </span>
        </label>`;
    }).join("");
    renderSlots();
  }

  function renderSlots() {
    const s = service(state.serviceId);
    if (!state.date) {
      el.slots.innerHTML = `<p class="slots__empty">No online slots in the next two weeks. Please call <a href="tel:${B.phones[0]}">${B.phones[0]}</a>.</p>`;
      return;
    }
    const slots = slotsFor(state.date, s.duration);
    if (state.time != null && !slots.some((x) => x.t === state.time && !x.disabled)) state.time = null;
    el.slots.innerHTML = slots.map((x) => `
      <label class="choice slot">
        <input class="choice-input" type="radio" name="slot" value="${x.t}" ${x.disabled ? "disabled" : ""} ${x.t === state.time ? "checked" : ""}
               aria-label="${fmtTime(x.t)}${x.reason === "booked" ? ", you already have a booking then" : x.reason === "past" ? ", unavailable" : ""}">
        <span class="choice__body" aria-hidden="true">${fmtTime(x.t)}</span>
      </label>`).join("");
  }

  /* ---------- summary ---------- */
  function updateSummary() {
    const s = service(state.serviceId);
    const parts = [];
    if (s) parts.push(`<b>${escapeHtml(s.category === "package" ? `${s.name} Package` : s.name)}</b>`);
    if (state.date) parts.push(fmtDate(state.date, { weekday: "short", day: "numeric", month: "short" }));
    if (state.time != null) parts.push(fmtTime(state.time));
    if (s) parts.push(fmtPrice(s.price));
    el.summary.innerHTML = parts.join(" · ");
    if (s) {
      el.selected.innerHTML = `<strong>${escapeHtml(s.name)}</strong> · ${fmtDur(s.duration)}. Last start time is ${fmtTime(CLOSE - s.duration - ((CLOSE - s.duration - OPEN) % B.slotMinutes))}, as we close at 8 PM.`;
    }
    if (s && state.date && state.time != null) {
      el.summaryLine.innerHTML = `${escapeHtml(s.name)} on <strong>${fmtDate(state.date, { weekday: "long", day: "numeric", month: "long" })}</strong> at <strong>${fmtTime(state.time)}</strong>`;
    }
  }

  /* ---------- errors ---------- */
  function setError(id, msg, input) {
    const p = document.getElementById(id);
    if (p) p.textContent = msg || "";
    if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  /* ---------- validation ---------- */
  function validate(step) {
    if (step === 1) {
      if (!state.serviceId) { setError("err-service", "Please choose a treatment to continue."); return false; }
      setError("err-service", "");
      return true;
    }
    if (step === 2) {
      if (!state.date || state.time == null) { setError("err-slot", "Please pick a date and an available start time."); return false; }
      setError("err-slot", "");
      return true;
    }
    if (step === 3) {
      let first = null;
      const name = el.name.value.trim();
      if (name.length < 2) { setError("err-name", "Please enter your name.", el.name); first = first || el.name; }
      else setError("err-name", "", el.name);

      const phone = normalisePhone(el.phone.value);
      if (!/^01[0125]\d{8}$/.test(phone)) { setError("err-phone", "Please enter a valid Egyptian mobile number, e.g. 01012345678.", el.phone); first = first || el.phone; }
      else { setError("err-phone", "", el.phone); el.phone.value = phone; }

      if (!el.consent.checked) { setError("err-consent", "Please tick the box to send your request.", el.consent); first = first || el.consent; }
      else setError("err-consent", "", el.consent);

      if (first) { first.focus(); return false; }
      return true;
    }
    return true;
  }

  /* ---------- step navigation ---------- */
  function showStep(n, opts = {}) {
    const back = n < state.step;
    state.step = n;
    el.steps.forEach((s) => {
      const on = Number(s.dataset.step) === n;
      s.hidden = !on;
      s.classList.remove("is-entering", "from-left");
      if (on && !reducedMotion.matches) {
        void s.offsetWidth; // restart animation
        s.classList.add("is-entering");
        if (back) s.classList.add("from-left");
      }
    });
    el.progress.forEach((li) => {
      const p = Number(li.dataset.progress);
      if (p === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
      li.classList.toggle("is-done", p < n);
    });
    el.back.hidden = n === 1 || n === 4;
    el.nav.hidden = n === 4;
    el.next.querySelector("span").textContent = n === 3 ? "Send request" : "Continue";

    if (n === 2) renderDates();
    updateSummary();

    if (opts.focus !== false) {
      const title = el.steps.find((s) => Number(s.dataset.step) === n).querySelector(".step__title");
      const top = form.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.6) {
        form.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
      }
      title.focus({ preventScroll: true });
    }
  }

  function next() {
    if (!validate(state.step)) return;
    if (state.step === 3) return submit();
    showStep(state.step + 1);
  }

  /* ---------- submit ---------- */
  function submit() {
    const s = service(state.serviceId);
    // Re-check the slot is still free (another tab may have booked it)
    const slot = slotsFor(state.date, s.duration).find((x) => x.t === state.time);
    if (!slot || slot.disabled) {
      showStep(2);
      setError("err-slot", "Sorry, that time is no longer available. Please choose another.");
      return;
    }
    const booking = {
      ref: makeRef(),
      serviceId: s.id,
      serviceName: s.category === "package" ? `The ${s.name} Package` : s.name,
      price: s.price,
      duration: s.duration,
      date: state.date,
      start: state.time,
      name: el.name.value.trim(),
      phone: normalisePhone(el.phone.value),
      notes: el.notes.value.trim(),
      createdAt: new Date().toISOString(),
      status: "requested",
    };
    const saved = store.write(store.read().concat(booking));
    state.last = booking;
    renderDone(booking, saved);
    showStep(4);
    burst();
    document.dispatchEvent(new CustomEvent("bombon:bookings-changed"));
  }

  function waText(b) {
    const lines = [
      "Hi Bombòn Spa! I'd like to confirm my booking request:",
      `• Ref: ${b.ref}`,
      `• Treatment: ${b.serviceName} (${fmtDur(b.duration)})`,
      `• Date: ${fmtDate(b.date)}`,
      `• Time: ${fmtTime(b.start)}`,
      `• Name: ${b.name}`,
      `• Phone: ${b.phone}`,
    ];
    if (b.notes) lines.push(`• Notes: ${b.notes}`);
    return lines.join("\n");
  }
  const waLink = (b) => `https://wa.me/${B.whatsapp}?text=${encodeURIComponent(waText(b))}`;

  function renderDone(b, saved) {
    el.doneName.textContent = b.name.split(/\s+/)[0];
    el.receipt.innerHTML = `
      <dt>Reference</dt><dd class="ref">${b.ref}</dd>
      <dt>Treatment</dt><dd>${escapeHtml(b.serviceName)}</dd>
      <dt>When</dt><dd>${fmtDate(b.date, { weekday: "long", day: "numeric", month: "long" })}, ${fmtTime(b.start)} – ${fmtTime(b.start + b.duration)}</dd>
      <dt>Price</dt><dd>${fmtPrice(b.price)}</dd>
      <dt>Where</dt><dd>${escapeHtml(B.address)}</dd>
      ${saved ? "" : `<dt>Note</dt><dd>We couldn't save this on your device, so please send it on WhatsApp or take a screenshot.</dd>`}`;
    el.doneWa.href = waLink(b);
  }

  /* ---------- calendar (.ics) ---------- */
  function icsStamp(key, min) {
    return key.replace(/-/g, "") + "T" + pad(Math.floor(min / 60)) + pad(min % 60) + "00";
  }
  const icsEscape = (s) => String(s).replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
  function downloadIcs(b) {
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Bombon Spa//Booking//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${b.ref}@bombonspa`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsStamp(b.date, b.start)}`,
      `DTEND:${icsStamp(b.date, b.start + b.duration)}`,
      `SUMMARY:${icsEscape(`Bombòn Spa: ${b.serviceName}`)}`,
      `LOCATION:${icsEscape(B.address)}`,
      `DESCRIPTION:${icsEscape(`Booking request ${b.ref}. Reception will call to confirm. Tel ${B.phones.join(" / ")}`)}`,
      "BEGIN:VALARM", "TRIGGER:-PT2H", "ACTION:DISPLAY", "DESCRIPTION:Bombòn Spa appointment", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `bombon-spa-${b.ref}.ics` });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ---------- confetti ---------- */
  function burst() {
    if (reducedMotion.matches || !el.burst.animate) return;
    const colors = ["#4C513C", "#888C77", "#BB9A78", "#F5ECDC", "#E2CDB3", "#C9CBBB", "#9C7B5B"];
    for (let i = 0; i < 34; i++) {
      const c = document.createElement("span");
      c.className = "confetti";
      c.style.background = colors[i % colors.length];
      if (i % 3 === 0) { c.style.borderRadius = "2px"; c.style.width = "8px"; c.style.height = "16px"; }
      el.burst.appendChild(c);
      const angle = Math.random() * Math.PI * 2;
      const dist = 120 + Math.random() * 180;
      const x = Math.cos(angle) * dist, y = Math.sin(angle) * dist * 0.7 - 80;
      const r = (Math.random() - 0.5) * 720;
      c.animate([
        { transform: "translate(-50%, -50%) scale(.2)", opacity: 1 },
        { transform: `translate(${x}px, ${y}px) rotate(${r}deg) scale(1)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${x * 1.15}px, ${y + 160}px) rotate(${r * 1.4}deg) scale(.8)`, opacity: 0 },
      ], { duration: 1500 + Math.random() * 800, easing: "cubic-bezier(.2,.8,.3,1)" }).onfinish = () => c.remove();
    }
  }

  /* ---------- reset ---------- */
  function restart() {
    form.reset();
    Object.assign(state, { serviceId: null, date: null, time: null });
    ["err-name", "err-phone", "err-consent", "err-service", "err-slot"].forEach((id) => setError(id, ""));
    [el.name, el.phone, el.consent].forEach((i) => i.removeAttribute("aria-invalid"));
    applyServiceFilter("all");
    showStep(1);
  }

  /* ---------- My bookings ---------- */
  function renderList(listEl) {
    const all = store.read().slice().sort((a, b) => (a.date + pad(a.start)).localeCompare(b.date + pad(b.start)));
    const todayKey = dateKey(new Date());
    if (!all.length) {
      listEl.innerHTML = `<li class="drawer__empty">No bookings yet. Your little escape is waiting.</li>`;
      return;
    }
    listEl.innerHTML = all.map((b) => {
      const past = b.date < todayKey;
      const status = b.status === "cancelled" ? "Cancelled" : past ? "Past" : "Requested";
      return `
        <li class="bk-item ${b.status === "cancelled" ? "is-cancelled" : ""}">
          <div class="bk-item__top"><span class="bk-item__name">${escapeHtml(b.serviceName)}</span><span class="bk-item__ref">${b.ref}</span></div>
          <span class="bk-item__when">${fmtDate(b.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · ${fmtTime(b.start)} · ${fmtPrice(b.price)} · <strong>${status}</strong></span>
          ${b.status !== "cancelled" && !past ? `
          <div class="bk-item__actions">
            <a class="link-btn" href="${waLink(b)}" target="_blank" rel="noopener">Send on WhatsApp</a>
            <button type="button" class="link-btn" data-cancel="${b.ref}">Cancel</button>
          </div>` : ""}
        </li>`;
    }).join("");
  }

  function cancelBooking(ref) {
    const list = store.read().map((b) => (b.ref === ref ? Object.assign({}, b, { status: "cancelled" }) : b));
    store.write(list);
    document.dispatchEvent(new CustomEvent("bombon:bookings-changed"));
  }

  function activeCount() {
    const today = dateKey(new Date());
    return store.read().filter((b) => b.status !== "cancelled" && b.date >= today).length;
  }

  /* ---------- events ---------- */
  form.addEventListener("submit", (e) => { e.preventDefault(); next(); });
  el.back.addEventListener("click", () => showStep(Math.max(1, state.step - 1)));
  el.restart.addEventListener("click", restart);
  el.doneIcs.addEventListener("click", () => state.last && downloadIcs(state.last));

  form.addEventListener("click", (e) => {
    const f = e.target.closest("[data-bfilter]");
    if (f) applyServiceFilter(f.dataset.bfilter);
  });

  form.addEventListener("change", (e) => {
    const t = e.target;
    if (t.name === "service") {
      state.serviceId = t.value; state.time = null;
      setError("err-service", "");
      updateSummary();
    } else if (t.name === "date") {
      state.date = t.value;
      renderSlots(); updateSummary();
    } else if (t.name === "slot") {
      state.time = Number(t.value);
      setError("err-slot", "");
      updateSummary();
    }
  });

  // Clear field errors as the user types
  [el.name, el.phone].forEach((i) => i.addEventListener("input", () => {
    if (i.getAttribute("aria-invalid") === "true") setError(i.getAttribute("aria-describedby").split(" ").pop(), "", i);
  }));
  el.consent.addEventListener("change", () => el.consent.checked && setError("err-consent", "", el.consent));

  // Keep slots fresh across tabs
  window.addEventListener("storage", (e) => { if (e.key === KEY && state.step === 2) renderSlots(); });

  /* ---------- init ---------- */
  renderServiceStep();
  showStep(1, { focus: false });

  /* ---------- public API (used by main.js) ---------- */
  window.BombonBooking = {
    /** Preselect a service and jump to the date step. Returns the heading to focus. */
    select(id) {
      if (!service(id)) return null;
      if (state.step === 4) restart();
      applyServiceFilter("all");
      const input = el.options.querySelector(`input[value="${id}"]`);
      if (input) input.checked = true;
      state.serviceId = id; state.time = null;
      setError("err-service", "");
      showStep(2, { focus: false });
      return el.steps[1].querySelector(".step__title");
    },
    renderList,
    cancelBooking,
    activeCount,
  };
})();
