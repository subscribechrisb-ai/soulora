/* ==========================================================================
   SOULORA — App logic (no frameworks, no build step)
   - Hash-based pages: #home #healing #mentorship #tarot #quantum #about #contact #feedback
   - Practitioner cards with dropdown (calendar booking, same-day booking, hours, how-to-pay)
   - 4-step booking modal: Date & time → Details → Payment (QR + proof upload) → Done
   ========================================================================== */
(function () {
  "use strict";

  const CFG = window.SOULORA_CONFIG;
  const SERVICES = window.SOULORA_SERVICES;
  const app = document.getElementById("app");
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const BOOK_AHEAD_DAYS = 60;

  /* ---------------- helpers ---------------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const peso = (n) => "₱" + Number(n).toLocaleString("en-PH");
  const rateText = (p) => (p.rateMax ? `${peso(p.rate)}–${peso(p.rateMax)}` : peso(p.rate));
  const durText = (p) => p.durationLabel || `${p.duration} min`;
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const fmtTime = (mins) => { const h = Math.floor(mins / 60), m = mins % 60; const ap = h >= 12 ? "PM" : "AM"; return `${((h + 11) % 12) + 1}:${pad(m)} ${ap}`; };
  const fmtDate = (d) => `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const store = {
    get(k, fb) { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } }
  };
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 2800);
  }
  function findPractitioner(svcId, pid) {
    const svc = SERVICES[svcId];
    return { svc, p: svc && svc.practitioners.find((x) => x.id === pid) };
  }

  /* ---------------- icons ---------------- */
  const ICON = {
    lotus: `<svg viewBox="0 0 40 28" fill="none"><path d="M20 3c4 4 5 9 0 17-5-8-4-13 0-17Z" fill="#c39a45"/><path d="M20 20C14 18 9 13 8 7c6 1 10 5 12 13Z" fill="#a3b884"/><path d="M20 20c6-2 11-7 12-13-6 1-10 5-12 13Z" fill="#a3b884"/><path d="M4 22c8 3 24 3 32 0" stroke="#c39a45" stroke-width="1.4" stroke-linecap="round"/></svg>`,
    cal: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/></svg>`,
    today: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
    clock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 6h16M4 12h16M4 18h10"/></svg>`,
    qr: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v7h-4M14 21v-3"/></svg>`,
    chev: `<svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>`,
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>`,
    upload: `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#c39a45" stroke-width="1.5"><path d="M12 16V4m0 0-4 4m4-4 4 4"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>`,
    check: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>`,
    mail: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>`,
    phone: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>`,
    pin: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>`,
    heart: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20s-7.5-4.6-9-9.5C2 6.8 4.6 4 7.6 4c1.9 0 3.4 1 4.4 2.5C13 5 14.5 4 16.4 4c3 0 5.6 2.8 4.6 6.5-1.5 4.9-9 9.5-9 9.5Z"/></svg>`
  };

  const SERVICE_ICONS = {
    healing: `<svg viewBox="0 0 32 32" fill="none" stroke="#4a6630" stroke-width="1.4"><path d="M10 26c-2-4-2-9 1-13l2 3 1-7c2 1 4 4 4 7l2-3c3 4 3 9 1 13"/><path d="M8 26h16"/><circle cx="16" cy="5" r="1.2" fill="#c39a45" stroke="none"/></svg>`,
    mentorship: `<svg viewBox="0 0 32 32" fill="none" stroke="#4a6630" stroke-width="1.4"><circle cx="11" cy="10" r="3.5"/><circle cx="22" cy="12" r="2.8"/><path d="M4 25c0-4 3.2-7 7-7s7 3 7 7M17 24c.4-3 2.4-5 5-5 2.8 0 5 2.2 5 5"/><path d="M16 5.5l1 .5" stroke="#c39a45"/></svg>`,
    tarot: `<svg viewBox="0 0 32 32" fill="none" stroke="#4a6630" stroke-width="1.4"><rect x="7" y="5" width="13" height="20" rx="2" transform="rotate(-8 13 15)"/><rect x="13" y="7" width="13" height="20" rx="2" transform="rotate(8 19 17)" fill="#fffdf8"/><path d="M19.5 13.5l.9 2 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3Z" fill="#c39a45" stroke="none"/></svg>`,
    quantum: `<svg viewBox="0 0 32 32" fill="none" stroke="#4a6630" stroke-width="1.4"><circle cx="16" cy="16" r="2.2" fill="#c39a45" stroke="none"/><ellipse cx="16" cy="16" rx="11" ry="4.5"/><ellipse cx="16" cy="16" rx="11" ry="4.5" transform="rotate(60 16 16)"/><ellipse cx="16" cy="16" rx="11" ry="4.5" transform="rotate(120 16 16)"/></svg>`
  };

  /* Elegant placeholder portrait (used until a real photo is added) */
  function portrait(p) {
    if (p.photo) return `<img src="${esc(p.photo)}" alt="${esc(p.name)}" loading="lazy">`;
    const h = hash(p.id);
    const palettes = [["#f3ead2", "#dfe7cc"], ["#efe3c4", "#e6ecd9"], ["#f6eedb", "#d6e0c0"], ["#f1e6cc", "#e4ead6"]];
    const [a, b] = palettes[h % palettes.length];
    const gid = "g" + p.id;
    const initials = p.name.replace(/^(Healer|Master|Mentor|Reader|Practitioner)\s+/i, "").slice(0, 1).toUpperCase();
    return `<svg viewBox="0 0 400 340" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(p.name)} (photo coming soon)">
      <defs>
        <linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
        <radialGradient id="${gid}l" cx=".5" cy=".38" r=".5"><stop offset="0" stop-color="#fffaea" stop-opacity=".95"/><stop offset="1" stop-color="#fffaea" stop-opacity="0"/></radialGradient>
        <linearGradient id="${gid}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b8893a"/><stop offset=".5" stop-color="#e3c374"/><stop offset="1" stop-color="#9c7430"/></linearGradient>
      </defs>
      <rect width="400" height="340" fill="url(#${gid})"/>
      <circle cx="200" cy="150" r="150" fill="url(#${gid}l)"/>
      <path d="M200 40a112 112 0 1 1-96 54" fill="none" stroke="url(#${gid}g)" stroke-width="5" stroke-linecap="round" opacity=".85"/>
      <circle cx="200" cy="138" r="44" fill="#8ea36d" opacity=".55"/>
      <path d="M108 340c4-62 44-108 92-108s88 46 92 108Z" fill="#6b8547" opacity=".5"/>
      <text x="200" y="152" text-anchor="middle" font-family="Marcellus, Georgia, serif" font-size="40" fill="#fffdf8">${esc(initials)}</text>
      <text x="200" y="318" text-anchor="middle" font-family="Jost, sans-serif" font-size="11" letter-spacing="3" fill="#fffdf8" opacity=".9">PHOTO COMING SOON</text>
    </svg>`;
  }

  /* Sample QR (used until a real payment QR image is added in data.js) */
  function sampleQR(seedStr) {
    const N = 25, cell = 8, size = N * cell;
    let seed = hash(seedStr);
    const rnd = () => ((seed = Math.imul(seed ^ (seed >>> 15), 2246822507) ^ Math.imul(seed ^ (seed >>> 13), 3266489909)) >>> 0) / 4294967296;
    const finder = (x, y) => `<rect x="${x * cell}" y="${y * cell}" width="${7 * cell}" height="${7 * cell}" fill="#2b3f1d"/><rect x="${(x + 1) * cell}" y="${(y + 1) * cell}" width="${5 * cell}" height="${5 * cell}" fill="#fff"/><rect x="${(x + 2) * cell}" y="${(y + 2) * cell}" width="${3 * cell}" height="${3 * cell}" fill="#2b3f1d"/>`;
    const inFinder = (x, y) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
    const inCenter = (x, y) => x > 8 && x < 16 && y > 10 && y < 14;
    let cells = "";
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (inFinder(x, y) || inCenter(x, y)) continue;
      if (rnd() > 0.52) cells += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}"/>`;
    }
    return `<svg class="qr" viewBox="-8 -8 ${size + 16} ${size + 16}" xmlns="http://www.w3.org/2000/svg"><rect x="-8" y="-8" width="${size + 16}" height="${size + 16}" fill="#fff" rx="8"/><g fill="#2b3f1d">${cells}</g>${finder(0, 0)}${finder(N - 7, 0)}${finder(0, N - 7)}<rect x="${9 * cell}" y="${11 * cell}" width="${7 * cell}" height="${3 * cell}" rx="4" fill="#c39a45"/><text x="${12.5 * cell}" y="${12.9 * cell}" text-anchor="middle" font-family="Jost,sans-serif" font-size="11" font-weight="600" letter-spacing="1.5" fill="#fff">SAMPLE</text></svg>`;
  }
  const qrMarkup = (p) => (p.payment.qr ? `<img class="qr" src="${esc(p.payment.qr)}" alt="${esc(p.payment.method)} QR code for ${esc(p.name)}">` : sampleQR(p.id));

  /* Embedded GoHighLevel / LeadConnector form */
  function formEmbed(url, title) {
    if (!url) return `<div class="empty-note">This form is coming soon. In the meantime, please email us at <strong>${esc(CFG.email)}</strong>.</div>`;
    const id = url.split("?")[0].replace(/\/+$/, "").split("/").pop();
    return `<div class="form-embed">
      <iframe src="${esc(url)}" id="inline-${esc(id)}" title="${esc(title)}"
        data-layout="{'id':'INLINE'}" data-trigger-type="alwaysShow" data-trigger-value=""
        data-activation-type="alwaysActivated" data-activation-value=""
        data-deactivation-type="neverDeactivate" data-deactivation-value=""
        data-form-name="${esc(title)}" data-layout-iframe-id="inline-${esc(id)}" data-form-id="${esc(id)}"
        loading="lazy" allow="clipboard-write"></iframe>
      <p class="form-embed-alt">Form not loading? <a href="${esc(url)}" target="_blank" rel="noopener">Open it in a new tab ↗</a></p>
    </div>`;
  }
  /* Loads the form provider's resize script so the embedded form fits its content */
  function activateEmbeds() {
    const f = $(".form-embed iframe");
    if (!f) return;
    let origin; try { origin = new URL(f.src).origin; } catch { return; }
    const old = document.getElementById("form-embed-js"); if (old) old.remove();
    const sc = document.createElement("script");
    sc.id = "form-embed-js"; sc.src = origin + "/js/form_embed.js"; sc.async = true;
    document.body.appendChild(sc);
  }

  /* ---------------- availability ---------------- */
  function slotsFor(svc, p, date) {
    const hrs = p.hours[date.getDay()];
    if (!hrs) return [];
    const [s, e] = hrs.map(toMin);
    const now = new Date();
    const isToday = ymd(date) === ymd(now);
    const nowMin = now.getHours() * 60 + now.getMinutes() + 60; // need at least 1 hour notice
    const out = [];
    const step = p.duration <= 45 ? 60 : Math.ceil((p.duration + 15) / 30) * 30; // includes rest/buffer time
    for (let t = s; t + p.duration <= e; t += step) {
      const taken = hash(`${p.id}|${ymd(date)}|${t}`) % 4 === 0; // demo: some slots pre-taken
      const past = isToday && t < nowMin;
      if (!past) out.push({ t, taken });
    }
    return out;
  }
  function isBookableDay(svc, p, date, mode) {
    const today = startOfDay(new Date());
    const d = startOfDay(date);
    const diff = Math.round((d - today) / 86400000);
    if (mode === "today") return diff === 0 && slotsFor(svc, p, d).some((s) => !s.taken);
    const lead = svc.minLeadDays || 0;
    if (diff < lead || diff > BOOK_AHEAD_DAYS) return false;
    return slotsFor(svc, p, d).some((s) => !s.taken);
  }
  const sameDayAllowed = (svc, p) => !svc.noSameDay && p.sameDay;

  /* ==========================================================================
     LAYOUT (header / footer)
     ========================================================================== */
  function renderChrome() {
    const svcLinks = Object.values(SERVICES).map((s) => `<li><a href="#${s.id}" data-nav="${s.id}">${esc(s.name)}<small>${esc(s.short.split(".")[0])}.</small></a></li>`).join("");
    $("#site-header").innerHTML = `
      <div class="container nav">
        <a class="brand" href="#home" aria-label="Soulora home">
          <img src="logo-mark.jpg" alt="">
          <span class="brand-text"><span class="brand-name">SOULORA</span><span class="brand-sub">Healing &amp; Wellness Collective</span></span>
        </a>
        <ul class="nav-links" id="nav-links">
          <li><a href="#home" data-nav="home">Home</a></li>
          <li class="has-sub"><button class="nav-trigger" type="button" aria-haspopup="true">Services</button><ul class="submenu">${svcLinks}</ul></li>
          <li><a href="#about" data-nav="about">About Us</a></li>
          <li><a href="#contact" data-nav="contact">Contact</a></li>
          <li><a href="#feedback" data-nav="feedback">Feedback</a></li>
          <li><a href="#join" data-nav="join">Join Us</a></li>
        </ul>
        <div class="nav-cta">
          <a class="btn btn-gold btn-sm" href="#healing">Book a Session</a>
          <button class="menu-toggle" id="menu-toggle" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>
        </div>
      </div>`;

    $("#site-footer").innerHTML = `
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <div class="brand-name">SOULORA</div>
            <div class="tag">${esc(CFG.tagline)}</div>
            <p>A sanctuary for healing, transformation and spiritual connection.</p>
          </div>
          <div><h4>Services</h4><ul>${Object.values(SERVICES).map((s) => `<li><a href="#${s.id}">${esc(s.name)}</a></li>`).join("")}</ul></div>
          <div><h4>Soulora</h4><ul><li><a href="#about">About Us</a></li><li><a href="#contact">Contact Us</a></li><li><a href="#feedback">Comments &amp; Feedback</a></li><li><a href="#join">Join as a Healer</a></li><li><a href="#home" data-scroll="how">How Booking Works</a></li></ul></div>
          <div><h4>Reach Us</h4><ul><li>${esc(CFG.email)}</li><li>${esc(CFG.phone)}</li><li>${esc(CFG.location)}</li><li><a href="${esc(CFG.facebook)}" target="_blank" rel="noopener">Facebook</a> · <a href="${esc(CFG.instagram)}" target="_blank" rel="noopener">Instagram</a></li></ul></div>
        </div>
        <div class="footer-bottom"><span>© ${new Date().getFullYear()} Soulora Healing &amp; Wellness Collective</span><span>AWAKEN • ALIGN • HEAL</span></div>
      </div>`;

    /* ---- Mobile menu panel (full-screen, services always visible) ---- */
    const mnav = document.createElement("div");
    mnav.className = "mnav"; mnav.id = "mnav"; mnav.setAttribute("aria-hidden", "true");
    mnav.innerHTML = `
      <div class="mnav-panel" role="dialog" aria-label="Menu">
        <div class="mnav-label">Book a service</div>
        <div class="mnav-services">${Object.values(SERVICES).map((s) => `
          <a href="#${s.id}" data-nav="${s.id}" class="mnav-svc"><span class="service-icon">${SERVICE_ICONS[s.id]}</span><span><strong>${esc(s.name)}</strong><small>${esc(s.chips[0])} · ${esc(s.chips[1])}</small></span><span class="mnav-arrow">›</span></a>`).join("")}
        </div>
        <div class="mnav-label">Soulora</div>
        <div class="mnav-links">
          <a href="#home" data-nav="home">Home</a>
          <a href="#about" data-nav="about">About Us</a>
          <a href="#contact" data-nav="contact">Contact Us</a>
          <a href="#feedback" data-nav="feedback">Comments &amp; Feedback</a>
          <a href="#join" data-nav="join">Join as a Healer / Reader</a>
        </div>
        <div class="mnav-foot">${esc(CFG.email)}<br>${esc(CFG.phone)}</div>
      </div>`;
    document.body.appendChild(mnav);

    /* ---- Bottom tab bar (phones) ---- */
    const tab = document.createElement("nav");
    tab.className = "tabbar"; tab.setAttribute("aria-label", "Quick navigation");
    const ti = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
    tab.innerHTML = `
      <a href="#home" data-tab="home">${ti('<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>')}<span>Home</span></a>
      <button type="button" data-tab="services" data-openmenu>${ti('<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>')}<span>Services</span></button>
      <a href="#healing" data-tab="book" class="tab-book"><span class="tab-book-ico">${ti('<rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>')}</span><span>Book</span></a>
      <a href="#contact" data-tab="contact">${ti('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>')}<span>Contact</span></a>
      <a href="#feedback" data-tab="feedback">${ti('<path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 9.5h8M8 12.5h5"/>')}<span>Feedback</span></a>`;
    document.body.appendChild(tab);

    const toggle = $("#menu-toggle");
    toggle.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
    $("[data-openmenu]", tab).addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
    mnav.addEventListener("click", (e) => { if (e.target === mnav || e.target.closest("a")) setMenu(false); });
    $(".nav-trigger").addEventListener("click", (e) => e.currentTarget.parentElement.classList.toggle("open"));
  }

  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    const t = $("#menu-toggle"); if (t) { t.setAttribute("aria-expanded", open); t.setAttribute("aria-label", open ? "Close menu" : "Open menu"); }
    const m = $("#mnav"); if (m) m.setAttribute("aria-hidden", !open);
  }

  const divider = `<div class="divider">${ICON.lotus}</div>`;

  /* ==========================================================================
     PAGES
     ========================================================================== */
  function pageHome() {
    const cards = Object.values(SERVICES).map((s) => `
      <a class="service-card" href="#${s.id}">
        <div class="service-icon">${SERVICE_ICONS[s.id]}</div>
        <h3>${esc(s.name)}</h3>
        <div class="service-meta">${s.chips.slice(0, 2).map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div>
        <p>${esc(s.short)}</p>
        <span class="link-arrow">Meet the ${s.id === "tarot" ? "readers" : s.id === "mentorship" ? "mentors" : s.id === "quantum" ? "practitioners" : "healers"} →</span>
      </a>`).join("");

    return `
    <section class="hero">
      <div class="container hero-grid">
        <div>
          <span class="eyebrow">Healing &amp; Wellness Collective</span>
          <h1><span>Every soul</span><span>carries its own light.</span></h1>
          <p class="tagline">${esc(CFG.tagline)}</p>
          <p class="lead">Soulora is a sanctuary for healing, transformation and spiritual connection. Find a healer, a tarot reader, a quantum healing practitioner or a senior mentor, and book your session in a few gentle steps.</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="#healing">Find a Healer</a>
            <a class="btn btn-ghost" href="#home" data-scroll="services">Explore Services</a>
          </div>
          <div class="pillars"><span>Awaken</span><span>Align</span><span>Heal</span></div>
        </div>
        <div class="hero-art"><img src="logo-mark.jpg" alt="Soulora lotus emblem"></div>
      </div>
    </section>

    <section class="bg-soft">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">The meaning of our name</span>
          <h2>Soul + Aura</h2>
          ${divider}
        </div>
        <div class="meaning">
          <div class="meaning-card"><div class="word">SOUL</div><p>The essence of who we are: our inner self, emotions, spirit and deepest truth.</p></div>
          <div class="meaning-plus">+</div>
          <div class="meaning-card"><div class="word">ORA</div><p>Inspired by <em>aura</em>: the energy, presence and light that surrounds us.</p></div>
        </div>
        <div class="meaning-result"><div class="word">SOULORA</div><p class="serif-italic" style="font-size:1.4rem;color:var(--gold)">${esc(CFG.tagline)}</p></div>
      </div>
    </section>

    <section id="services">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">Our Services</span>
          <h2>Choose your path to wholeness</h2>
          ${divider}
          <p>Each practitioner sets their own rates and hours. Tap a practitioner to view their calendar, book a same-day slot, and see how to pay.</p>
        </div>
        <div class="services-grid">${cards}</div>
      </div>
    </section>

    <section class="bg-forest" id="how">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">How booking works</span>
          <h2>Four gentle steps</h2>
        </div>
        <div class="steps">
          <div class="step"><div class="step-num">1</div><h3>Choose</h3><p>Pick a service and the practitioner whose energy resonates with you.</p></div>
          <div class="step"><div class="step-num">2</div><h3>Schedule</h3><p>Select an open date and time from their calendar, or a same-day slot.</p></div>
          <div class="step"><div class="step-num">3</div><h3>Pay &amp; Upload</h3><p>Scan or save the QR code, pay online, then upload your proof of payment.</p></div>
          <div class="step"><div class="step-num">4</div><h3>Confirmation</h3><p>We verify your payment and email you to confirm your appointment.</p></div>
        </div>
      </div>
    </section>

    <section class="bg-soft">
      <div class="container join-band">
        <div>
          <span class="eyebrow">For healers &amp; readers</span>
          <h2 style="font-size:2rem;margin-bottom:.4rem">Join the Soulora collective</h2>
          <p style="color:var(--muted);margin:0">Healers, tarot readers and energy practitioners: apply to offer your sessions on Soulora.</p>
        </div>
        <a class="btn btn-primary" href="#join">Apply to Join</a>
      </div>
    </section>

    <section>
      <div class="container" style="text-align:center">
        <span class="eyebrow">Begin your journey</span>
        <h2>Your light is waiting to be remembered.</h2>
        <p style="color:var(--muted);max-width:600px;margin:0 auto 1.6rem">Whether you are seeking peace, clarity or deep restoration, there is a healer here for you.</p>
        <a class="btn btn-gold" href="#healing">Book a Session</a>
      </div>
    </section>`;
  }

  function practitionerCard(svc, p) {
    const sd = sameDayAllowed(svc, p);
    const todayOpen = sd && isBookableDay(svc, p, new Date(), "today");
    const hours = [1, 2, 3, 4, 5, 6, 0].map((d) => {
      const h = p.hours[d];
      return `<li class="${h ? "" : "off"}"><span>${DAYS[d]}</span><span>${h ? `${fmtTime(toMin(h[0]))} – ${fmtTime(toMin(h[1]))}` : "Unavailable"}</span></li>`;
    }).join("");
    let sameDayLabel = "Same-day consultation slots";
    if (svc.id !== "mentorship") sameDayLabel = "Same-day appointment slots";
    let sameDaySub = todayOpen ? "Open slots available today" : "No open slots left today";
    if (!sd) sameDaySub = svc.noSameDay ? "Not available: book at least 1 day ahead" : "This practitioner doesn't take same-day bookings";

    return `
    <article class="p-card" data-svc="${svc.id}" data-pid="${p.id}">
      <button class="p-head" type="button" aria-expanded="false">
        <div class="p-photo">${portrait(p)}<div class="p-badge"><span class="chip ${sd && todayOpen ? "" : "gold"}">${sd && todayOpen ? "● Available today" : esc(p.mode)}</span></div></div>
        <div class="p-body">
          <h3 class="p-name">${esc(p.name)}</h3>
          <div class="p-title">${esc(p.title)}</div>
          <div class="p-row"><span class="p-rate">${rateText(p)} <small>/ ${durText(p)}</small></span><span>${esc(p.mode)}</span></div>
          <div class="p-toggle">View booking options ${ICON.chev}</div>
        </div>
      </button>
      <div class="p-drop"><div><div class="p-drop-inner">
        <p style="font-size:.92rem;color:var(--muted);margin-bottom:1rem">${esc(p.bio)}${p.location ? ` <br><strong style="color:var(--forest);font-weight:500">Location:</strong> ${esc(p.location)}` : ""}</p>
        <div class="drop-links">
          <button class="drop-link" data-action="book" type="button"><span class="ico">${ICON.cal}</span><span><strong>Set an appointment</strong><small>Open ${esc(p.name.split(" ").pop())}'s calendar</small></span></button>
          <button class="drop-link" data-action="today" type="button" ${sd && todayOpen ? "" : "disabled"}><span class="ico gold">${ICON.today}</span><span><strong>${sameDayLabel}</strong><small>${sameDaySub}</small></span></button>
        </div>
        <details style="margin-bottom:1rem"><summary style="cursor:pointer;font-size:.82rem;letter-spacing:.14em;text-transform:uppercase;color:var(--green)">Weekly hours</summary><ul class="hours-list" style="margin-top:.6rem">${hours}</ul></details>
        <div class="howto">
          <h4>How to book</h4>
          <ol>
            <li>Tap <strong>Set an appointment</strong> (or a same-day slot).</li>
            <li>Choose your date and time, then enter your details.</li>
          </ol>
          <h4>How to pay</h4>
          <div class="qr-mini">${qrMarkup(p)}<p><strong>${esc(p.payment.method)}</strong><br>${esc(p.payment.accountName)}<br>Amount: <strong>${rateText(p)}</strong></p></div>
          <ol>
            <li>Scan or save this QR code and pay online.</li>
            <li>Upload your proof of payment (screenshot) in the booking form.</li>
            <li>We'll email you within ${CFG.verifyHours} hrs to confirm your payment and whether your appointment will push through.</li>
          </ol>
        </div>
      </div></div></div>
    </article>`;
  }

  function pageService(id) {
    const svc = SERVICES[id];
    const extra = id === "quantum"
      ? `<div class="notice" style="margin-bottom:2rem">${ICON.info}<div><strong>In-person only. No same-day appointments.</strong> Quantum Healing sessions take 45 minutes to 1 hour, depending on the depth of the healing. Please book at least one day ahead and arrive 10 minutes early.</div></div>`
      : id === "mentorship"
      ? `<div class="notice" style="margin-bottom:2rem">${ICON.info}<div><strong>For practitioners.</strong> Use <em>same-day consultation</em> when you need guidance today (for example, after a challenging session). For mentoring, case reviews or practice planning, choose <em>Set an appointment</em> and pick any open date.</div></div>`
      : id === "tarot"
      ? `<div class="notice" style="margin-bottom:2rem">${ICON.info}<div><strong>General Reading · 1 hour · ₱1,000 – ₱1,500.</strong> The rate depends on the reader you choose. Prepare up to 3 questions, or come open to whatever guidance the cards offer.</div></div>`
      : "";
    return `
    <section class="page-banner">
      <div class="container">
        <div class="service-icon" style="margin:0 auto 1rem;width:68px;height:68px">${SERVICE_ICONS[id]}</div>
        <span class="eyebrow">Soulora Services</span>
        <h1>${esc(svc.name)}</h1>
        <p>${esc(svc.intro)}</p>
        <div class="info-strip">${svc.chips.map((c, i) => `<span class="chip ${i === 0 ? "gold" : ""}">${esc(c)}</span>`).join("")}</div>
      </div>
    </section>
    <nav class="svc-switch" aria-label="Switch service"><div class="container">${Object.values(SERVICES).map((s) => `<a href="#${s.id}" class="${s.id === id ? "on" : ""}">${esc(s.name)}</a>`).join("")}</div></nav>
    <section class="svc-section">
      <div class="container">
        ${extra}
        <p class="tap-hint">Tap a ${id === "tarot" ? "reader" : id === "mentorship" ? "mentor" : id === "quantum" ? "practitioner" : "healer"} to see their calendar, same-day slots and how to pay.</p>
        <div class="practitioners">${svc.practitioners.map((p) => practitionerCard(svc, p)).join("")}</div>
      </div>
    </section>
    <section class="bg-soft">
      <div class="container">
        <div class="section-head"><span class="eyebrow">Booking guide</span><h2>How to book &amp; how to pay</h2>${divider}</div>
        <div class="guide-grid">
          <div class="guide-card">
            <h3>How to book</h3>
            <ol>
              <li>Tap a ${id === "tarot" ? "reader" : id === "mentorship" ? "mentor" : "healer"}'s card to open their booking options.</li>
              <li>Choose <strong>Set an appointment</strong> to see their calendar${svc.noSameDay ? "" : ", or <strong>Same-day slots</strong> if you'd like a session today"}.</li>
              <li>Pick an open date and time (shown in ${esc(CFG.timezoneLabel)}).</li>
              <li>Fill in your name, email, mobile number and your intention for the session.</li>
            </ol>
          </div>
          <div class="guide-card">
            <h3>How to pay</h3>
            <ol>
              <li>Scan the practitioner's QR code with GCash, Maya or your banking app, or save the QR image and upload it in your app.</li>
              <li>Pay the exact amount shown, then take a screenshot of your receipt.</li>
              <li>Upload the screenshot as your <strong>proof of payment</strong> and submit your booking.</li>
              <li>We'll verify your payment and email you within ${CFG.verifyHours} hours to tell you whether it's confirmed and your appointment will push through.</li>
            </ol>
          </div>
        </div>
      </div>
    </section>`;
  }

  function pageAbout() {
    return `
    <section class="page-banner"><div class="container"><span class="eyebrow">About Us</span><h1>A sanctuary for the soul</h1><p>${esc(CFG.tagline)}</p></div></section>
    <section>
      <div class="container about-grid">
        <div class="about-logo"><img src="logo-full.jpg" alt="Soulora Healing & Wellness Collective logo"></div>
        <div>
          <span class="eyebrow">Our Story</span>
          <h2>Where the soul finds its light</h2>
          <p>Soulora is a sanctuary for healing, transformation and spiritual connection. We believe every soul carries its own light, even in moments of darkness.</p>
          <p>Through meaningful healing experiences, we help individuals reconnect with their inner wisdom, restore balance, and embrace the journey toward wholeness.</p>
          <p>Our name joins two words. <strong>Soul</strong> is the essence of who we are: our inner self, emotions, spirit and deepest truth. <strong>Ora</strong>, inspired by <em>aura</em>, is the energy, presence and light that surrounds us. Together they form <strong>Soulora</strong>.</p>
          <p>We are a collective: a community of healers, tarot readers, quantum healing practitioners and senior mentors, gathered on one platform so that anyone seeking healing can find the right guide, and so that every healer can grow with the support of those who walked the path before them.</p>
        </div>
      </div>
    </section>
    <section class="bg-forest"><div class="container"><blockquote class="mission">“Every soul carries its own light, even in moments of darkness. We are here to help you remember it.”</blockquote></div></section>
    <section class="bg-soft">
      <div class="container">
        <div class="section-head"><span class="eyebrow">Our Pillars</span><h2>Awaken · Align · Heal</h2>${divider}</div>
        <div class="values">
          <div class="value"><div class="word">AWAKEN</div><p>Reconnect with your inner wisdom and the truth of who you are.</p></div>
          <div class="value"><div class="word">ALIGN</div><p>Restore balance between body, mind, energy and spirit.</p></div>
          <div class="value"><div class="word">HEAL</div><p>Embrace the journey toward wholeness, gently and at your own pace.</p></div>
        </div>
      </div>
    </section>
    <section>
      <div class="container" style="text-align:center">
        <h2>Are you a healer?</h2>
        <p style="color:var(--muted);max-width:620px;margin:0 auto 1.4rem">We welcome healers, tarot readers and quantum practitioners to join the collective. New in your practice? Our senior healers are here to guide you.</p>
        <div class="hero-actions" style="justify-content:center"><a class="btn btn-primary" href="#join">Join the Collective</a><a class="btn btn-ghost" href="#mentorship">Consult a Senior Healer</a></div>
      </div>
    </section>`;
  }

  function pageJoin() {
    return `
    <section class="page-banner"><div class="container"><span class="eyebrow">Join the Collective</span><h1>Share your light with us</h1><p>Are you a healer, tarot reader or energy practitioner? Apply to join Soulora and offer your sessions on our platform.</p></div></section>
    <section>
      <div class="container join-grid">
        <div>
          <span class="eyebrow">How it works</span>
          <h2 style="font-size:1.9rem">Becoming part of the team</h2>
          <ol class="join-steps">
            <li><strong>Fill in the sign-up form.</strong> Tell us about yourself, your practice and your experience.</li>
            <li><strong>We'll email you.</strong> You'll receive our terms and conditions and the requirements to join the team.</li>
            <li><strong>Set up your profile.</strong> Once approved, send your photo, preferred name, rates, available hours and payment QR code.</li>
            <li><strong>Start receiving bookings.</strong> Clients can book you straight from the Soulora website.</li>
          </ol>
          <div class="notice" style="margin-top:1.4rem">${ICON.info}<div>New to the practice? You can still apply, and our senior healers offer <a href="#mentorship">consultations for healers</a> to help you grow.</div></div>
          <p style="margin-top:1.4rem;color:var(--muted);font-size:.95rem">Questions? Email <strong>${esc(CFG.email)}</strong>.</p>
        </div>
        <div class="form-card">
          <h3>Healer &amp; reader sign-up</h3>
          ${formEmbed(CFG.joinFormUrl, "Soulora healer sign-up form")}
        </div>
      </div>
    </section>`;
  }

  function pageContact() {
    return `
    <section class="page-banner"><div class="container"><span class="eyebrow">Contact Us</span><h1>We'd love to hear from you</h1><p>Questions about a booking, a payment, or joining Soulora as a healer? Send us a message and we'll reply by email.</p></div></section>
    <section>
      <div class="container contact-grid">
        <div class="contact-list">
          <div class="contact-item"><span class="ico">${ICON.mail}</span><div><strong>Email</strong><span>${esc(CFG.email)}</span></div></div>
          <div class="contact-item"><span class="ico">${ICON.phone}</span><div><strong>Mobile / Viber</strong><span>${esc(CFG.phone)}</span></div></div>
          <div class="contact-item"><span class="ico">${ICON.pin}</span><div><strong>Location</strong><span>${esc(CFG.location)}<br>In-person sessions are held at each practitioner's listed location.</span></div></div>
          <div class="contact-item"><span class="ico">${ICON.heart}</span><div><strong>Follow us</strong><span><a href="${esc(CFG.facebook)}" target="_blank" rel="noopener">Facebook</a> · <a href="${esc(CFG.instagram)}" target="_blank" rel="noopener">Instagram</a></span></div></div>
        </div>
        <div class="form-card">
          <h3>Send a message</h3>
          <div class="form-success" id="contact-ok"></div>
          <form id="contact-form" novalidate>
            <div class="form-grid">
              <div class="field"><label>Name <span class="req">*</span></label><input name="name" required autocomplete="name"><span class="err">Please enter your name.</span></div>
              <div class="field"><label>Email <span class="req">*</span></label><input name="email" type="email" required autocomplete="email"><span class="err">Please enter a valid email.</span></div>
              <div class="field"><label>Mobile</label><input name="phone" autocomplete="tel"></div>
              <div class="field"><label>Topic</label><select name="topic"><option>General inquiry</option><option>Booking concern</option><option>Payment verification</option><option>Join as a healer / reader</option><option>Partnership</option></select></div>
              <div class="field full"><label>Message <span class="req">*</span></label><textarea name="message" required></textarea><span class="err">Please write a message.</span></div>
            </div>
            <div style="margin-top:1.2rem"><button class="btn btn-primary" type="submit">Send Message</button><span class="form-note">Opens your email app with your message ready to send</span></div>
          </form>
        </div>
      </div>
    </section>`;
  }

  function pageFeedback() {
    const opts = Object.values(SERVICES).map((s) => `<option>${esc(s.name)}</option>`).join("");
    return `
    <section class="page-banner"><div class="container"><span class="eyebrow">Comments &amp; Feedback</span><h1>Share your light</h1><p>Your words help us grow and help other souls find their healer. Tell us about your experience, or share a suggestion for the platform.</p></div></section>
    <section>
      <div class="container contact-grid">
        <div class="form-card">
          <h3>Leave your feedback</h3>
          <div class="form-success" id="fb-ok"></div>
          <form id="feedback-form" novalidate>
            <div class="form-grid">
              <div class="field"><label>Name</label><input name="name" placeholder="You may stay anonymous"></div>
              <div class="field"><label>Email</label><input name="email" type="email" placeholder="Not shown publicly"><span class="err">Please enter a valid email.</span></div>
              <div class="field"><label>Service</label><select name="service"><option>Platform / website</option>${opts}</select></div>
              <div class="field"><label>Practitioner (optional)</label><input name="practitioner"></div>
              <div class="field full"><label>Your rating <span class="req">*</span></label>
                <div class="stars">${[5, 4, 3, 2, 1].map((n) => `<input type="radio" id="star${n}" name="rating" value="${n}"><label for="star${n}" title="${n} stars">★</label>`).join("")}</div>
                <span class="err">Please choose a rating.</span>
              </div>
              <div class="field full"><label>Comment <span class="req">*</span></label><textarea name="comment" required placeholder="What did you experience? What could we do better?"></textarea><span class="err">Please write a comment.</span></div>
              <label class="check full" style="grid-column:1/-1"><input type="checkbox" name="publish" checked> You may share my comment on this page (first name only).</label>
            </div>
            <div style="margin-top:1.2rem"><button class="btn btn-gold" type="submit">Submit Feedback</button><span class="form-note">Opens your email app with your message ready to send</span></div>
          </form>
        </div>
        <div>
          <span class="eyebrow">From our community</span>
          <h2 style="font-size:1.9rem">Kind words</h2>
          <div class="feedback-wall" id="feedback-wall"></div>
        </div>
      </div>
    </section>`;
  }

  function renderFeedbackWall() {
    const wall = $("#feedback-wall"); if (!wall) return;
    const items = store.get("soulora_feedback", []).filter((f) => f.publish);
    if (!items.length) {
      wall.innerHTML = `<div class="empty-note" style="grid-column:1/-1">No comments yet. Be the first to share your experience.</div>`;
      return;
    }
    wall.innerHTML = items.slice().reverse().map((f) => `
      <article class="fb-card"><div class="rating">${"★".repeat(f.rating)}${"☆".repeat(5 - f.rating)}</div><p>“${esc(f.comment)}”</p><footer>${esc((f.name || "Anonymous").split(" ")[0])} · ${esc(f.service)}</footer></article>`).join("");
  }

  /* ==========================================================================
     ROUTER
     ========================================================================== */
  const ROUTES = { home: pageHome, about: pageAbout, contact: pageContact, feedback: pageFeedback, join: pageJoin };
  function route() {
    if ($("#modal").classList.contains("show")) closeBooking();
    setMenu(false);
    $$(".has-sub.open").forEach((x) => x.classList.remove("open"));
    let key = (location.hash || "#home").slice(1) || "home";
    if (key === "reiki") key = "healing"; // old links
    const isSvc = !!SERVICES[key];
    const view = isSvc ? pageService(key) : (ROUTES[key] || pageHome)();
    app.innerHTML = `<div class="view">${view}</div>`;
    $$("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === key));
    const tabKey = isSvc ? "services" : ROUTES[key] ? key : "home";
    $$("[data-tab]").forEach((a) => a.classList.toggle("active", a.dataset.tab === tabKey));
    document.title = (isSvc ? SERVICES[key].name : key === "home" || !ROUTES[key] ? "Where the soul finds its light" : $("h1", app).textContent) + " · Soulora";
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    if (key === "feedback") renderFeedbackWall();
    if (key === "join") activateEmbeds();
    const on = $(".svc-switch a.on");
    if (on) { const c = on.parentElement; c.scrollLeft = on.offsetLeft - (c.clientWidth - on.offsetWidth) / 2; }
  }

  /* ==========================================================================
     BOOKING MODAL
     ========================================================================== */
  const B = { svc: null, p: null, mode: "schedule", step: 1, date: null, time: null, month: null, details: {}, ref: null };

  function openBooking(svcId, pid, mode) {
    const { svc, p } = findPractitioner(svcId, pid);
    if (!p) return;
    Object.assign(B, { svc, p, mode, step: 1, date: null, time: null, details: {}, ref: null });
    const today = startOfDay(new Date());
    B.month = new Date(today.getFullYear(), today.getMonth(), 1);
    if (mode === "today") B.date = today;
    else {
      // jump to first bookable day
      for (let i = 0; i <= BOOK_AHEAD_DAYS; i++) {
        const d = new Date(today); d.setDate(d.getDate() + i);
        if (isBookableDay(svc, p, d, "schedule")) { B.date = d; B.month = new Date(d.getFullYear(), d.getMonth(), 1); break; }
      }
    }
    const m = $("#modal");
    $(".modal-head", m).innerHTML = `
      <div class="avatar">${portrait(p)}</div>
      <div><h3>${esc(p.name)}</h3><small>${esc(svc.name)} · ${rateText(p)} · ${durText(p)} · ${esc(p.mode)}</small></div>
      <button class="modal-close" type="button" aria-label="Close">×</button>`;
    renderStep();
    m.classList.add("show");
    document.body.style.overflow = "hidden";
  }
  function closeBooking() {
    $("#modal").classList.remove("show");
    document.body.style.overflow = "";
  }

  function stepper() {
    const labels = ["Schedule", "Payment", "Form", "Done"];
    return `<div class="stepper">${labels.map((l, i) => `<div class="${i < B.step ? "on" : ""}">${i + 1}. ${l}</div>`).join("")}</div>`;
  }

  function calendarHTML() {
    const { svc, p } = B;
    const y = B.month.getFullYear(), mo = B.month.getMonth();
    const first = new Date(y, mo, 1);
    const daysIn = new Date(y, mo + 1, 0).getDate();
    const today = startOfDay(new Date());
    const maxMonth = new Date(today.getFullYear(), today.getMonth() + 2, 1);
    let cells = DOW.map((d) => `<div class="cal-dow">${d}</div>`).join("");
    for (let i = 0; i < first.getDay(); i++) cells += `<div></div>`;
    for (let d = 1; d <= daysIn; d++) {
      const date = new Date(y, mo, d);
      const ok = isBookableDay(svc, p, date, B.mode);
      const cls = ["cal-day", ok ? "avail" : "", ymd(date) === ymd(today) ? "today" : "", B.date && ymd(date) === ymd(B.date) ? "sel" : ""].join(" ");
      cells += `<button type="button" class="${cls}" ${ok ? `data-date="${ymd(date)}"` : "disabled"} aria-label="${fmtDate(date)}${ok ? "" : " (unavailable)"}">${d}</button>`;
    }
    const prevDisabled = B.mode === "today" || B.month <= new Date(today.getFullYear(), today.getMonth(), 1);
    const nextDisabled = B.mode === "today" || B.month >= maxMonth;
    return `
      <div class="calendar">
        <div class="cal-head">
          <button class="cal-nav" type="button" data-cal="-1" ${prevDisabled ? "disabled" : ""} aria-label="Previous month">‹</button>
          <strong>${MONTHS[mo]} ${y}</strong>
          <button class="cal-nav" type="button" data-cal="1" ${nextDisabled ? "disabled" : ""} aria-label="Next month">›</button>
        </div>
        <div class="cal-grid">${cells}</div>
        <div class="cal-legend"><span><i style="background:var(--sage-light);border:1px solid #d5dfc1"></i>Available</span><span><i style="background:var(--forest)"></i>Selected</span><span><i style="background:var(--gold);border-radius:50%;width:6px;height:6px"></i>Today</span></div>
      </div>`;
  }

  function slotsHTML() {
    if (!B.date) return `<div class="empty-note">${B.mode === "today" ? "No open slots left today. Please choose <strong>Set an appointment</strong> to pick another day." : "No open dates in the next 60 days. Please contact us."}</div>`;
    const slots = slotsFor(B.svc, B.p, B.date);
    return `
      <div class="slots">
        <h4>${B.mode === "today" ? "Today · " : ""}${fmtDate(B.date)}</h4>
        ${slots.length ? `<div class="slot-grid">${slots.map((s) => `<button type="button" class="slot ${B.time === s.t ? "sel" : ""}" data-time="${s.t}" ${s.taken ? "disabled title='Already booked'" : ""}>${fmtTime(s.t)}</button>`).join("")}</div>` : `<div class="empty-note">No open times on this day.</div>`}
        <p style="font-size:.8rem;color:var(--muted);margin-top:.8rem">Times are in ${esc(CFG.timezoneLabel)}. Session length: ${durText(B.p)}.</p>
      </div>`;
  }

  function summaryHTML() {
    const { svc, p } = B;
    return `<div class="summary">
      <div><span>Service</span><span>${esc(svc.name)}${svc.id === "tarot" ? " · General Reading" : ""}</span></div>
      <div><span>Practitioner</span><span>${esc(p.name)}</span></div>
      <div><span>Date</span><span>${B.date ? fmtDate(B.date) : "-"}</span></div>
      <div><span>Time</span><span>${B.time != null ? `${fmtTime(B.time)} (${durText(p)})` : "-"}</span></div>
      <div><span>Session</span><span>${esc(p.mode)}${p.location ? ` · ${esc(p.location)}` : ""}</span></div>
      ${B.ref ? `<div><span>Reference</span><span>${esc(B.ref)}</span></div>` : ""}
      <div><span>Amount due</span><span>${rateText(p)}</span></div>
    </div>`;
  }

  function renderStep() {
    const body = $("#modal .modal-body");
    const { svc, p } = B;
    let html = stepper();

    if (B.step === 1) {
      html += `
        ${B.mode === "today" ? `<div class="notice" style="margin-bottom:1rem">${ICON.info}<div><strong>Same-day ${svc.id === "mentorship" ? "consultation" : "booking"}.</strong> Only today's remaining open times are shown. Pay right after booking so we can verify in time.</div></div>` : ""}
        ${svc.noSameDay ? `<div class="notice" style="margin-bottom:1rem">${ICON.info}<div>In-person only · no same-day appointments. The earliest date you can book is tomorrow.</div></div>` : ""}
        <div class="cal-wrap">${calendarHTML()}${slotsHTML()}</div>
        <div class="modal-foot"><button class="btn btn-ghost btn-sm" type="button" data-close>Cancel</button><button class="btn btn-primary" type="button" data-next ${B.time == null ? "disabled" : ""}>Continue</button></div>`;
    }

    if (B.step === 2) {
      html += `
        <div class="pay-grid">
          <div class="qr-box">
            ${qrMarkup(p)}
            <div class="acct"><strong>${esc(p.payment.method)}</strong>${esc(p.payment.accountName)}</div>
            <div class="amount">${rateText(p)}</div>
            <button class="btn btn-ghost btn-sm" type="button" data-saveqr style="margin-top:.8rem;width:100%">Save QR Code</button>
          </div>
          <div>
            <h3 style="margin-bottom:.6rem">Pay for your session</h3>
            <ol style="padding-left:1.2rem;font-size:.95rem;margin-top:0">
              <li>Open GCash, Maya or your banking app and <strong>scan the QR code</strong>, or tap <em>Save QR Code</em> and upload it in your app.</li>
              <li>Pay exactly <strong>${rateText(p)}</strong>.</li>
              <li><strong>Take a screenshot of your receipt.</strong> You'll upload it in the booking form on the next step.</li>
            </ol>
            ${summaryHTML()}
          </div>
        </div>
        <div class="modal-foot"><button class="btn btn-ghost btn-sm" type="button" data-back>Back</button><button class="btn btn-primary" type="button" data-next>I've paid · Continue</button></div>`;
    }

    if (B.step === 3) {
      if (!B.ref) B.ref = "SLR-" + Date.now().toString(36).toUpperCase().slice(-6);
      html += `
        <div class="notice" style="margin-bottom:1rem">${ICON.info}<div><strong>Last step: fill in the booking form below.</strong> Enter your details, paste your booking details (tap <em>Copy booking details</em>), and <strong>upload the screenshot of your payment</strong>. Then tap the form's submit button.</div></div>
        <div class="booking-copy">
          ${summaryHTML()}
          <button class="btn btn-ghost btn-sm" type="button" data-copydetails>Copy booking details</button>
        </div>
        ${formEmbed(CFG.bookingFormUrl, "Soulora booking form")}
        <div class="modal-foot"><button class="btn btn-ghost btn-sm" type="button" data-back>Back</button><button class="btn btn-gold" type="button" data-next>I've submitted the form</button></div>`;
    }

    if (B.step === 4) {
      store.set("soulora_last_booking", { ref: B.ref, service: svc.name, practitioner: p.name, date: ymd(B.date), time: fmtTime(B.time) });
      html += `
        <div class="success">
          <div class="seal">${ICON.check}</div>
          <h2 style="font-size:2rem">Thank you</h2>
          <p style="color:var(--muted)">Your booking request has been sent to Soulora.</p>
          <div class="ref">REF: ${esc(B.ref)}</div>
          ${summaryHTML()}
          <ul>
            <li>Status: <strong style="color:var(--gold)">Pending payment verification</strong></li>
            <li>We'll check your payment and email you within ${CFG.verifyHours} hours to tell you whether it's confirmed and your appointment will push through.</li>
            <li>Questions? Email us at <strong>${esc(CFG.email)}</strong> and include your reference number.</li>
          </ul>
          <button class="btn btn-primary" type="button" data-close>Done</button>
        </div>`;
    }

    body.innerHTML = html;
    body.scrollTop = 0;
    $("#modal .modal").scrollTop = 0;
    if (B.step === 3) activateEmbeds();
  }

  function validate(form) {
    let ok = true;
    $$("[required]", form).forEach((el) => {
      const f = el.closest(".field");
      let good = el.type === "checkbox" ? el.checked : el.value.trim() !== "";
      if (good && el.type === "email") good = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
      if (f) f.classList.toggle("error", !good);
      if (!good) ok = false;
    });
    $$("input[type=email]:not([required])", form).forEach((el) => {
      const good = !el.value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
      el.closest(".field").classList.toggle("error", !good);
      if (!good) ok = false;
    });
    return ok;
  }

  function saveQR() {
    const p = B.p;
    try {
      const a = document.createElement("a");
      if (p.payment.qr) { a.href = p.payment.qr; a.download = `soulora-${p.id}-qr`; }
      else {
        const blob = new Blob([sampleQR(p.id).replace('class="qr"', 'width="600" height="600"')], { type: "image/svg+xml" });
        a.href = URL.createObjectURL(blob); a.download = `soulora-${p.id}-qr.svg`;
      }
      document.body.appendChild(a); a.click(); a.remove();
      toast("QR code saved. Open it in your payment app to pay.");
    } catch { toast("Long-press the QR image to save it to your phone."); }
  }

  function bookingText() {
    const { svc, p } = B;
    return [
      `Booking reference: ${B.ref}`,
      `Service: ${svc.name}${svc.id === "tarot" ? " (General Reading)" : ""}`,
      `Practitioner: ${p.name}`,
      `Date: ${fmtDate(B.date)}`,
      `Time: ${fmtTime(B.time)} (${durText(p)}, ${CFG.timezoneLabel})`,
      `Type: ${B.mode === "today" ? "Same-day" : "Scheduled"} · ${p.mode}${p.location ? " · " + p.location : ""}`,
      `Amount paid: ${rateText(p)} via ${p.payment.method}`
    ].join("\n");
  }
  async function copyDetails() {
    const text = bookingText();
    try { await navigator.clipboard.writeText(text); toast("Booking details copied. Paste them into the form."); }
    catch {
      const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); toast("Booking details copied. Paste them into the form."); } catch { toast("Please type your booking details into the form."); }
      ta.remove();
    }
  }

  /* ==========================================================================
     GLOBAL EVENTS
     ========================================================================== */
  document.addEventListener("click", (e) => {
    const t = e.target;

    // smooth scroll links within home
    const sc = t.closest("[data-scroll]");
    if (sc) {
      e.preventDefault();
      const go = () => { const el = document.getElementById(sc.dataset.scroll); if (el) el.scrollIntoView({ behavior: "smooth" }); };
      if ((location.hash || "#home") !== "#home") { location.hash = "home"; setTimeout(go, 80); } else go();
      return;
    }

    // practitioner card toggle
    const head = t.closest(".p-head");
    if (head) {
      const card = head.closest(".p-card");
      const open = !card.classList.contains("open");
      $$(".p-card.open").forEach((c) => { if (c !== card) { c.classList.remove("open"); $(".p-head", c).setAttribute("aria-expanded", "false"); } });
      card.classList.toggle("open", open); head.setAttribute("aria-expanded", open);
      return;
    }
    const act = t.closest(".drop-link[data-action]");
    if (act && !act.disabled) {
      const card = act.closest(".p-card");
      openBooking(card.dataset.svc, card.dataset.pid, act.dataset.action === "today" ? "today" : "schedule");
      return;
    }

    // modal
    if (!t.closest("#modal")) return;
    if (t.matches(".modal-backdrop") || t.closest(".modal-close") || t.closest("[data-close]")) { closeBooking(); return; }
    const day = t.closest(".cal-day[data-date]");
    if (day) { const [y, m, d] = day.dataset.date.split("-").map(Number); B.date = new Date(y, m - 1, d); B.time = null; renderStep(); return; }
    const nav = t.closest("[data-cal]");
    if (nav && !nav.disabled) { B.month = new Date(B.month.getFullYear(), B.month.getMonth() + Number(nav.dataset.cal), 1); renderStep(); return; }
    const slot = t.closest(".slot[data-time]");
    if (slot && !slot.disabled) { B.time = Number(slot.dataset.time); renderStep(); return; }
    if (t.closest("[data-back]")) { B.step--; renderStep(); return; }
    if (t.closest("[data-next]")) { B.step++; renderStep(); return; }
    if (t.closest("[data-copydetails]")) { copyDetails(); return; }
    if (t.closest("[data-saveqr]")) { saveQR(); return; }
  });

  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $("#modal").classList.contains("show")) closeBooking(); });

  // Contact & feedback forms
  document.addEventListener("submit", async (e) => {
    const form = e.target;
    if (form.id !== "contact-form" && form.id !== "feedback-form") return;
    e.preventDefault();
    let ok = validate(form);
    if (form.id === "feedback-form") {
      const r = form.querySelector("[name=rating]:checked");
      const rf = form.querySelector(".stars").closest(".field");
      rf.classList.toggle("error", !r); if (!r) ok = false;
    }
    if (!ok) { toast("Please complete the required fields."); return; }
    const data = Object.fromEntries(new FormData(form).entries());
    const isFb = form.id === "feedback-form";
    if (isFb) {
      const all = store.get("soulora_feedback", []);
      all.push({ name: data.name, service: data.service, rating: Number(data.rating), comment: data.comment, publish: !!data.publish, at: Date.now() });
      store.set("soulora_feedback", all);
      renderFeedbackWall();
    }
    const subject = isFb ? `Soulora feedback (${data.rating}★): ${data.service}` : `Soulora inquiry: ${data.topic}`;
    const body = isFb
      ? `Name: ${data.name || "Anonymous"}\nEmail: ${data.email || "-"}\nService: ${data.service}\nPractitioner: ${data.practitioner || "-"}\nRating: ${data.rating} / 5\nOK to publish: ${data.publish ? "Yes" : "No"}\n\n${data.comment}`
      : `Name: ${data.name}\nEmail: ${data.email}\nMobile: ${data.phone || "-"}\nTopic: ${data.topic}\n\n${data.message}`;
    const mailto = `mailto:${CFG.inquiryEmail || CFG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const okBox = $(isFb ? "#fb-ok" : "#contact-ok");
    okBox.innerHTML = `Your email app should open with your ${isFb ? "feedback" : "message"} ready. Just tap <strong>Send</strong>. If it didn't open, email us at <strong>${esc(CFG.email)}</strong>.`;
    okBox.classList.add("show");
    okBox.scrollIntoView({ behavior: "smooth", block: "center" });
    window.location.href = mailto;
    form.reset();
  });

  /* ---------------- init ---------------- */
  renderChrome();
  window.addEventListener("hashchange", route);
  route();
})();
