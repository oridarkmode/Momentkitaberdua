/* =========================================================
   Glassmorphism Invitation (Sheet Integrated Version)
   - Integrated Gallery (Photo & Video Grid)
   - Google Sheets Sync (Read via Gviz, Write via Post)
   - Custom Section Backgrounds
   - Responsive RSVP & Wishes
========================================================= */

const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];

const LS = {
  RSVP: "inv_rsvp_v2",
  WISH: "inv_wish_v2"
};

const state = {
  cfg: null,
  muted: true
};

function safeText(s) { return (s ?? "").toString().replace(/[<>]/g, "").trim(); }

function qp(name) {
  const u = new URL(location.href);
  return u.searchParams.get(name) || "";
}

function decodePlus(v) {
  return decodeURIComponent((v || "").replace(/\+/g, " "));
}

async function loadConfig() {
  const res = await fetch("data/config.json", { cache: "no-store" });
  if (!res.ok) throw new Error("config.json tidak ditemukan");
  return res.json();
}

function setTheme() {
  const t = state.cfg.theme || {};
  if (t.bg) document.documentElement.style.setProperty("--bg", t.bg);
  if (t.accent) document.documentElement.style.setProperty("--accent", t.accent);
  if (t.accent2) document.documentElement.style.setProperty("--accent2", t.accent2);
  document.title = state.cfg.siteTitle || document.title;
}

function applySectionBackgrounds() {
  const b = state.cfg.backgrounds || {};
  const cover = $("#coverBg");
  const home = $("#homeBg");
  const closing = $("#closingBg");

  if (cover && b.cover) cover.style.backgroundImage = `url("${b.cover}")`;
  if (home && b.home) home.style.backgroundImage = `url("${b.home}")`;
  if (closing && b.closing) closing.style.backgroundImage = `url("${b.closing}")`;
}

function fillCover() {
  const c = state.cfg.cover;
  $("#coverTitleTop").textContent = c.titleTop || "The Wedding Of";
  $("#coverTitle").textContent = c.title || "Wedding Invitation";
  $("#coverDateText").textContent = c.dateText || "";
  $("#coverGreeting").textContent = c.greeting || "";
}

function setBrand() {
  $("#brandText").textContent = state.cfg.siteTitle || "Undangan";
  $("#footerBrand").textContent = state.cfg.brand || "Brand";
  $("#yearNow").textContent = new Date().getFullYear();
}

function setGuest() {
  const pName = state.cfg.guest?.paramName || "to";
  const raw = qp(pName);
  const name = safeText(decodePlus(raw)) || (state.cfg.guest?.defaultName || "Tamu Undangan");
  $("#guestName").textContent = name;
  $("#guestInline").textContent = name;
  $("#rsvpName").value = name !== (state.cfg.guest?.defaultName || "Tamu Undangan") ? name : "";
  $("#wishName").value = $("#rsvpName").value;
}

function setHome() {
  const home = state.cfg.home;
  $("#homeGreet").textContent = state.cfg.cover?.greeting || "Assalamu’alaikum";
  $("#homeHeadline").textContent = home.headline || "";
  $("#homeDatePill").textContent = state.cfg.cover?.dateText || "";
  $("#homeLocPill").textContent = home.locationText || "";

  const gShort = (state.cfg.couple?.groom?.name || "Pria").split(" ")[0];
  const bShort = (state.cfg.couple?.bride?.name || "Wanita").split(" ")[0];
  $("#groomNameShort").textContent = gShort;
  $("#brideNameShort").textContent = bShort;
  $("#closingGroom").textContent = gShort;
  $("#closingBride").textContent = bShort;
}

function setCouple() {
  const { bride, groom } = state.cfg.couple;
  $("#brideName").textContent = bride.name;
  $("#brideParents").textContent = bride.parents || "";
  $("#bridePhoto").src = bride.photo || "";
  $("#brideIg").href = bride.instagram || "#";
  $("#groomName").textContent = groom.name;
  $("#groomParents").textContent = groom.parents || "";
  $("#groomPhoto").src = groom.photo || "";
  $("#groomIg").href = groom.instagram || "#";
}

function buildEvents() {
  const wrap = $("#eventCards");
  wrap.innerHTML = "";
  const events = state.cfg.events || [];

  events.forEach((ev, i) => {
    const card = document.createElement("article");
    card.className = "eventCard glass reveal";

    const itemsHtml = (ev.items || []).map(it => `
      <div style="margin-top:10px">
        <div class="badge" style="display:inline-block">${safeText(it.label)}</div>
        <div class="eventMeta" style="margin-top:8px">
          <div><b>${safeText(it.timeText)}</b></div>
          <div class="eventPlace">${safeText(it.place)}</div>
          <div class="muted small">${safeText(it.address)}</div>
        </div>
      </div>
    `).join("");

    card.innerHTML = `
      <div class="eventTop">
        <span class="badge">${safeText(ev.type)}</span>
        <span class="muted small">#${String(i + 1).padStart(2, "0")}</span>
      </div>
      <div class="eventMeta" style="margin-top:8px">
        <div><b>${safeText(ev.dateText)}</b></div>
      </div>
      ${itemsHtml}
      ${ev.mapEmbed ? `<iframe class="mapFrame" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${ev.mapEmbed}"></iframe>` : ""}
      <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center; margin-top:10px">
        ${ev.mapDirection ? `<a class="btn btn--ghost" target="_blank" rel="noopener" href="${ev.mapDirection}">Petunjuk Arah</a>` : ""}
      </div>
    `;
    wrap.appendChild(card);
  });
}

function gallery() {
  const grid = $("#galleryPhotos");
  if (!grid) return;
  grid.innerHTML = "";

  const photos = state.cfg.gallery?.photos || [];
  const videos = state.cfg.gallery?.videos || [];

  photos.forEach((src) => {
    const d = document.createElement("div");
    d.className = "gItem glass reveal";
    d.setAttribute("data-full", src);
    d.innerHTML = `<img src="${src}" alt="Gallery photo" loading="lazy" />`;
    grid.appendChild(d);
  });

  videos.forEach((v) => {
    const d = document.createElement("div");
    d.className = "gItem glass gItem--video reveal";
    d.setAttribute("data-video", v.src);
    const poster = v.poster || photos[0] || "";
    d.innerHTML = `
      <img src="${poster}" alt="${safeText(v.title || "Video")}" loading="lazy" />
      <div class="gPlay" aria-hidden="true">
        <div class="gPlayIcon">▶</div>
      </div>
    `;
    grid.appendChild(d);
  });

  const photoModal = $("#photoModal");
  const photoFull = $("#photoFull");
  const openPhoto = (src) => {
    photoFull.src = src;
    photoModal.classList.add("show");
    photoModal.setAttribute("aria-hidden", "false");
  };
  const closePhoto = () => {
    photoModal.classList.remove("show");
    photoModal.setAttribute("aria-hidden", "true");
  };

  const videoModal = $("#videoModal");
  const player = $("#videoPlayer");
  const openVideo = (src) => {
    player.src = src;
    videoModal.classList.add("show");
    videoModal.setAttribute("aria-hidden", "false");
    player.play().catch(() => { });
  };
  const closeVideo = () => {
    player.pause();
    player.removeAttribute("src");
    player.load();
    videoModal.classList.remove("show");
    videoModal.setAttribute("aria-hidden", "true");
  };

  $("#photoClose")?.addEventListener("click", closePhoto);
  $("#videoClose")?.addEventListener("click", closeVideo);
  
  grid.addEventListener("click", (e) => {
    const v = e.target.closest("[data-video]");
    const p = e.target.closest("[data-full]");
    if (v) return openVideo(v.getAttribute("data-video"));
    if (p) return openPhoto(p.getAttribute("data-full"));
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closePhoto(); closeVideo(); }
  });
}

function gifts() {
  const wrap = $("#giftWrap");
  if (!wrap) return;
  wrap.innerHTML = "";

  if (!state.cfg.gifts?.enabled) {
    if ($("#gifts")) $("#gifts").style.display = "none";
    return;
  }

  (state.cfg.gifts.options || []).forEach((g) => {
    const d = document.createElement("div");
    d.className = "giftCard glass reveal";
    d.innerHTML = `
      <div class="giftTop">
        ${g.logo ? `<img class="giftLogo" src="${g.logo}" alt="${safeText(g.note || g.label)}" />` : ""}
        <div>
          <div class="giftNote">${safeText(g.note || "")}</div>
          <h4 style="margin:4px 0 0">${safeText(g.label)}</h4>
        </div>
      </div>
      <div class="valueBox">
        <b>${safeText(g.name)}</b>
        <div class="mono">${safeText(g.value)}</div>
      </div>
      <div style="display:flex; gap:10px; margin-top:10px; flex-wrap:wrap; justify-content:center">
        <button class="btn btn--primary" type="button" data-copy="${safeText(g.value)}">
          <span class="btn__glow" aria-hidden="true"></span> Salin
        </button>
        <button class="btn btn--ghost" type="button" data-share="${safeText(g.value)}">Bagikan</button>
      </div>
    `;
    wrap.appendChild(d);
  });

  wrap.addEventListener("click", async (e) => {
    const copyBtn = e.target.closest("[data-copy]");
    const shareBtn = e.target.closest("[data-share]");

    if (copyBtn) {
      const val = copyBtn.getAttribute("data-copy");
      try {
        await navigator.clipboard.writeText(val);
        copyBtn.textContent = "Tersalin ✓";
        setTimeout(() => copyBtn.innerHTML = `<span class="btn__glow" aria-hidden="true"></span> Salin`, 1200);
      } catch {
        alert("Gagal salin: " + val);
      }
    }

    if (shareBtn) {
      const val = shareBtn.getAttribute("data-share");
      if (navigator.share) navigator.share({ title: "Kado Digital", text: val }).catch(() => { });
      else alert("Browser tidak support share. Silakan salin manual.");
    }
  });
}

/* ---------- Sheets Logic ---------- */
async function postToSheet(payload) {
  if (!state.cfg.sheet?.enabled) return { ok: false, msg: "sheet-disabled" };
  const url = state.cfg.sheet?.postEndpoint;
  if (!url) return { ok: false, msg: "missing-endpoint" };

  try {
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, msg: err.message || "failed" };
  }
}

function loadWishesFromGviz() {
  return new Promise((resolve) => {
    if (!state.cfg.sheet?.enabled || state.cfg.sheet?.readMode !== "gviz") return resolve([]);

    const id = state.cfg.sheet?.spreadsheetId;
    const sheetName = state.cfg.sheet?.sheetName || "Wishes";
    if (!id) return resolve([]);

    const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;

    const s = document.createElement("script");
    const old = window.google?.visualization?.Query?.setResponse;

    window.google = window.google || {};
    window.google.visualization = window.google.visualization || {};
    window.google.visualization.Query = window.google.visualization.Query || {};
    window.google.visualization.Query.setResponse = (res) => {
      try {
        const table = res.table;
        const rows = (table.rows || []).map(r => {
          const c = r.c || [];
          return {
            name: c[0]?.v ? String(c[0].v) : "",
            text: c[1]?.v ? String(c[1].v) : "",
            createdAt: c[2]?.v ? String(c[2].v) : ""
          };
        }).filter(x => x.name && x.text);
        resolve(rows.reverse());
      } catch {
        resolve([]);
      } finally {
        if (old) window.google.visualization.Query.setResponse = old;
        s.remove();
      }
    };

    s.src = url;
    document.body.appendChild(s);
  });
}

function wishItem(w) {
  const el = document.createElement("div");
  el.className = "wish reveal";
  const when = w.createdAt ? new Date(w.createdAt).toLocaleDateString("id-ID", { dateStyle: "medium" }) : "";
  el.innerHTML = `<b>${safeText(w.name)}</b><p>${safeText(w.text)}</p><small>${when}</small>`;
  return el;
}

function readLS(key) {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); }
  catch { return []; }
}

async function renderWishes() {
  const wrap = $("#wishList");
  if (!wrap) return;
  wrap.innerHTML = `<p class="muted small">Memuat ucapan...</p>`;

  let list = [];
  if (state.cfg.sheet?.enabled) {
    list = await loadWishesFromGviz();
  } else {
    list = readLS(LS.WISH);
  }

  wrap.innerHTML = "";
  if (!list.length) {
    wrap.innerHTML = `<p class="muted small">Belum ada ucapan. Jadilah yang pertama 😊</p>`;
    return;
  }
  list.forEach(w => wrap.appendChild(wishItem(w)));
}

function rsvp() {
  if (!state.cfg.rsvp?.enabled) return;

  $("#rsvpForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button[type='submit']");
    btn.disabled = true;
    
    const entry = {
      name: safeText($("#rsvpName").value),
      attend: $("#rsvpAttend").value,
      pax: Math.max(1, Math.min(Number($("#rsvpPax").value || 1), Number(state.cfg.rsvp.maxPax || 5))),
      msg: safeText($("#rsvpMsg").value),
      createdAt: new Date().toISOString()
    };

    await postToSheet({ type: "rsvp", ...entry });

    $("#rsvpNote").textContent = "RSVP terkirim ✓";
    $("#rsvpForm").reset();
    $("#rsvpPax").value = 1;
    btn.disabled = false;
  });

  $("#wishForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button[type='submit']");
    btn.disabled = true;

    const entry = {
      name: safeText($("#wishName").value),
      text: safeText($("#wishText").value),
      createdAt: new Date().toISOString()
    };

    const list = readLS(LS.WISH);
    list.unshift(entry);
    localStorage.setItem(LS.WISH, JSON.stringify(list));

    await postToSheet({ type: "wish", ...entry });
    
    $("#wishForm").reset();
    renderWishes();
    btn.disabled = false;
  });

  renderWishes();
}

/* ---------- UI & Core ---------- */
function countdown() {
  const target = new Date(state.cfg.home.eventISO).getTime();
  const tick = () => {
    const now = Date.now();
    let d = Math.max(0, target - now);
    const days = Math.floor(d / (24 * 3600 * 1000)); d -= days * 24 * 3600 * 1000;
    const hrs = Math.floor(d / (3600 * 1000)); d -= hrs * 3600 * 1000;
    const mins = Math.floor(d / (60 * 1000)); d -= mins * 60 * 1000;
    const secs = Math.floor(d / 1000);

    if ($("#cdDays")) $("#cdDays").textContent = String(days).padStart(2, "0");
    if ($("#cdHours")) $("#cdHours").textContent = String(hrs).padStart(2, "0");
    if ($("#cdMins")) $("#cdMins").textContent = String(mins).padStart(2, "0");
    if ($("#cdSecs")) $("#cdSecs").textContent = String(secs).padStart(2, "0");
  };
  tick(); setInterval(tick, 1000);
}

function wireAudio() {
  const bgm = $("#bgm");
  if (!bgm) return;
  bgm.src = state.cfg.music?.src || "";
  $("#btnOpen")?.addEventListener("click", () => {
    $("#coverGate").classList.add("hidden");
    bgm.play().catch(() => { });
  });
  $("#btnMute")?.addEventListener("click", () => {
    state.muted = !state.muted;
    bgm.muted = state.muted;
    $("#btnMute").setAttribute("aria-pressed", String(!state.muted));
  });
}

function reveal() {
  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) e.target.classList.add("show"); });
  }, { threshold: 0.1 });
  $$(".reveal").forEach(el => io.observe(el));
}

(async function init() {
  try {
    state.cfg = await loadConfig();
    applySectionBackgrounds();
    setTheme();
    setBrand();
    fillCover();
    setGuest();
    setHome();
    setCouple();
    buildEvents();
    gallery();
    gifts();
    rsvp();
    wireAudio();
    countdown();
    reveal();
  } catch (e) { console.error(e); }
})();
