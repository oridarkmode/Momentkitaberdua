/* =========================================================
   Glassmorphism Invitation (GitHub Pages)
   - Guest name from URL: ?to=Nama+Tamu
   - Gate open enables audio (browser policy)
   - Countdown, Events builder, Gallery photo/video modal
   - RSVP & Wishes (localStorage) + optional endpoint
========================================================= */

const $ = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => [...p.querySelectorAll(s)];

const LS = {
  RSVP: "inv_rsvp_v2",
  WISH: "inv_wish_v2"
};

const state = {
  cfg: null,
  muted: true
};

function safeText(s){ return (s ?? "").toString().replace(/[<>]/g,"").trim(); }

function qp(name){
  const u = new URL(location.href);
  return u.searchParams.get(name) || "";
}

function decodePlus(v){
  return decodeURIComponent((v || "").replace(/\+/g, " "));
}

async function loadConfig(){
  const res = await fetch("data/config.json", { cache: "no-store" });
  if(!res.ok) throw new Error("config.json tidak ditemukan");
  return res.json();
}

function setTheme(){
  const t = state.cfg.theme || {};
  if(t.bg) document.documentElement.style.setProperty("--bg", t.bg);
  if(t.accent) document.documentElement.style.setProperty("--accent", t.accent);
  if(t.accent2) document.documentElement.style.setProperty("--accent2", t.accent2);

  const meta = document.querySelector('meta[name="theme-color"]');
  if(meta && t.accent) meta.setAttribute("content", t.accent);

  document.title = state.cfg.siteTitle || document.title;
}

function fillCover(){
  const c = state.cfg.cover;
  $("#coverTitleTop").textContent = c.titleTop || "The Wedding Of";
  $("#coverTitle").textContent = c.title || "Wedding Invitation";
  $("#coverDateText").textContent = c.dateText || "";
  $("#coverGreeting").textContent = c.greeting || "";

  const bg = $("#coverBg");
  if(bg && c.coverImage){
    bg.style.backgroundImage = `url("${c.coverImage}")`;
  }
}

function setBrand(){
  $("#brandText").textContent = state.cfg.siteTitle || "Undangan";
  $("#footerBrand").textContent = state.cfg.brand || "Brand";
  $("#yearNow").textContent = new Date().getFullYear();
}

function setGuest(){
  const pName = state.cfg.guest?.paramName || "to";
  const raw = qp(pName);
  const name = safeText(decodePlus(raw)) || (state.cfg.guest?.defaultName || "Tamu Undangan");
  $("#guestName").textContent = name;
  $("#guestInline").textContent = name;
  $("#rsvpName").value = name !== (state.cfg.guest?.defaultName || "Tamu Undangan") ? name : "";
  $("#wishName").value = $("#rsvpName").value;
}

function setHome(){
  const home = state.cfg.home;
  $("#homeGreet").textContent = state.cfg.cover?.greeting || "Assalamu’alaikum Warahmatullahi Wabarakatuh";
  $("#homeHeadline").textContent = home.headline || "";

  $("#homeDatePill").textContent = state.cfg.cover?.dateText || "";
  $("#homeLocPill").textContent = home.locationText || "";

  const groomShort = (state.cfg.couple?.groom?.name || "Mempelai Pria").split(" ")[0];
  const brideShort = (state.cfg.couple?.bride?.name || "Mempelai Wanita").split(" ")[0];
  $("#groomNameShort").textContent = groomShort;
  $("#brideNameShort").textContent = brideShort;

  $("#closingGroom").textContent = groomShort;
  $("#closingBride").textContent = brideShort;
}

function setCouple(){
  const { bride, groom } = state.cfg.couple;

  $("#brideName").textContent = bride.name;
  $("#brideParents").textContent = bride.parents || "";
  $("#bridePhoto").src = bride.photo || $("#bridePhoto").src;
  $("#brideIg").href = bride.instagram || "#";

  $("#groomName").textContent = groom.name;
  $("#groomParents").textContent = groom.parents || "";
  $("#groomPhoto").src = groom.photo || $("#groomPhoto").src;
  $("#groomIg").href = groom.instagram || "#";
}

function buildEvents(){
  const wrap = $("#eventCards");
  wrap.innerHTML = "";
  const events = state.cfg.events || [];

  events.forEach((ev, i)=>{
    const card = document.createElement("article");
    card.className = "eventCard glass reveal";
    card.innerHTML = `
      <div class="eventTop">
        <span class="badge">${safeText(ev.type)}</span>
        <span class="muted small">#${String(i+1).padStart(2,"0")}</span>
      </div>
      <div class="eventMeta">
        <div><b>${safeText(ev.dateText)}</b></div>
        <div>${safeText(ev.timeText)}</div>
      </div>
      <div class="eventPlace">${safeText(ev.place)}</div>
      <div class="muted small">${safeText(ev.address)}</div>

      <iframe class="mapFrame" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
        src="${ev.mapEmbed || ""}" title="Peta lokasi ${safeText(ev.type)}"></iframe>

      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:6px">
        <a class="btn btn--ghost" href="${ev.mapDirection || "#"}" target="_blank" rel="noopener">Petunjuk Arah</a>
        <button class="btn btn--primary" type="button" data-addcal="${i}">
          <span class="btn__glow" aria-hidden="true"></span>
          Simpan Event
        </button>
      </div>
    `;
    wrap.appendChild(card);
  });

  // Save specific event to calendar
  wrap.addEventListener("click", (e)=>{
    const btn = e.target.closest("[data-addcal]");
    if(!btn) return;
    const idx = Number(btn.getAttribute("data-addcal"));
    const ev = events[idx];
    makeICS({
      title: `${ev.type} - ${state.cfg.cover?.title || "Undangan"}`,
      startISO: guessISOFromText(ev.dateText, state.cfg.home.eventISO),
      durationHours: 2,
      location: `${ev.place} - ${ev.address}`,
      description: `${ev.type}\n${ev.dateText}\n${ev.timeText}`
    });
  });
}

function guessISOFromText(dateText, fallbackISO){
  // Simple: use fallbackISO date for time anchor
  // For production, you can set ISO per event.
  return fallbackISO || new Date().toISOString();
}

function makeICS({title, startISO, durationHours=2, location="", description=""}){
  const start = new Date(startISO);
  const end = new Date(start.getTime() + durationHours*3600*1000);
  const fmt = (d)=> new Date(d).toISOString().replace(/[-:]/g,"").split(".")[0] + "Z";

  const ics =
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Glass Invite//GitHub Pages//ID
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${Date.now()}@glass-invite
DTSTAMP:${fmt(new Date())}
DTSTART:${fmt(start)}
DTEND:${fmt(end)}
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([ics], { type:"text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "undangan-event.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function countdown(){
  const target = new Date(state.cfg.home.eventISO).getTime();
  const tick = ()=>{
    const now = Date.now();
    let d = Math.max(0, target - now);

    const days = Math.floor(d/(24*3600*1000)); d -= days*24*3600*1000;
    const hrs = Math.floor(d/(3600*1000)); d -= hrs*3600*1000;
    const mins = Math.floor(d/(60*1000)); d -= mins*60*1000;
    const secs = Math.floor(d/1000);

    $("#cdDays").textContent = String(days).padStart(2,"0");
    $("#cdHours").textContent = String(hrs).padStart(2,"0");
    $("#cdMins").textContent = String(mins).padStart(2,"0");
    $("#cdSecs").textContent = String(secs).padStart(2,"0");
  };
  tick();
  setInterval(tick, 1000);
}

function gallery(){
  const photosWrap = $("#galleryPhotos");
  const videosWrap = $("#galleryVideos");
  photosWrap.innerHTML = "";
  videosWrap.innerHTML = "";

  const photos = state.cfg.gallery?.photos || [];
  const videos = state.cfg.gallery?.videos || [];

  photos.forEach((src)=>{
    const d = document.createElement("div");
    d.className = "gItem glass";
    d.setAttribute("data-full", src);
    d.innerHTML = `<img src="${src}" alt="Foto galeri">`;
    photosWrap.appendChild(d);
  });

  videos.forEach((v)=>{
    const d = document.createElement("div");
    d.className = "vItem glass";
    d.setAttribute("data-video", v.src);
    d.innerHTML = `
      <img class="vPoster" src="${v.poster || ""}" alt="Poster video">
      <div class="vMeta">
        <b>${safeText(v.title || "Video")}</b>
        <small>Klik untuk memutar</small>
      </div>
    `;
    videosWrap.appendChild(d);
  });

  // tabs
  $$(".tab").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      $$(".tab").forEach(x=>x.classList.remove("isActive"));
      btn.classList.add("isActive");
      const t = btn.dataset.tab;
      if(t === "photos"){
        $("#galleryPhotos").hidden = false;
        $("#galleryVideos").hidden = true;
      }else{
        $("#galleryPhotos").hidden = true;
        $("#galleryVideos").hidden = false;
      }
    });
  });

  // photo modal
  const photoModal = $("#photoModal");
  const photoFull = $("#photoFull");
  const openPhoto = (src)=>{
    photoFull.src = src;
    photoModal.classList.add("show");
    photoModal.setAttribute("aria-hidden","false");
  };
  const closePhoto = ()=>{
    photoModal.classList.remove("show");
    photoModal.setAttribute("aria-hidden","true");
  };

  photosWrap.addEventListener("click", (e)=>{
    const item = e.target.closest("[data-full]");
    if(!item) return;
    openPhoto(item.getAttribute("data-full"));
  });
  $("#photoClose").addEventListener("click", closePhoto);
  photoModal.addEventListener("click",(e)=>{ if(e.target===photoModal) closePhoto(); });

  // video modal
  const videoModal = $("#videoModal");
  const player = $("#videoPlayer");
  const openVideo = (src)=>{
    player.src = src;
    videoModal.classList.add("show");
    videoModal.setAttribute("aria-hidden","false");
    player.play().catch(()=>{});
  };
  const closeVideo = ()=>{
    player.pause();
    player.removeAttribute("src");
    player.load();
    videoModal.classList.remove("show");
    videoModal.setAttribute("aria-hidden","true");
  };
  videosWrap.addEventListener("click",(e)=>{
    const item = e.target.closest("[data-video]");
    if(!item) return;
    openVideo(item.getAttribute("data-video"));
  });
  $("#videoClose").addEventListener("click", closeVideo);
  videoModal.addEventListener("click",(e)=>{ if(e.target===videoModal) closeVideo(); });

  // esc close
  window.addEventListener("keydown",(e)=>{
    if(e.key==="Escape"){ closePhoto(); closeVideo(); }
  });
}

function story(){
  const wrap = $("#storyWrap");
  wrap.innerHTML = "";
  (state.cfg.story || []).forEach((s)=>{
    const d = document.createElement("div");
    d.className = "tItem glass reveal";
    d.innerHTML = `
      <div class="tTop">
        <span class="year">${safeText(s.year)}</span>
        <span class="muted small">—</span>
      </div>
      <h4>${safeText(s.title)}</h4>
      <p>${safeText(s.desc)}</p>
    `;
    wrap.appendChild(d);
  });
}

function gifts(){
  const wrap = $("#giftWrap");
  wrap.innerHTML = "";

  if(!state.cfg.gifts?.enabled){
    $("#gifts").style.display = "none";
    return;
  }

  (state.cfg.gifts.options || []).forEach((g)=>{
    const d = document.createElement("div");
    d.className = "giftCard glass reveal";
    d.innerHTML = `
      <h4>${safeText(g.label)}</h4>
      <div class="valueBox">
        <b>${safeText(g.name)}</b>
        <div class="mono">${safeText(g.value)}</div>
      </div>
      <div style="display:flex; gap:10px; margin-top:10px; flex-wrap:wrap">
        <button class="btn btn--primary" type="button" data-copy="${safeText(g.value)}">
          <span class="btn__glow" aria-hidden="true"></span>
          Salin
        </button>
        <button class="btn btn--ghost" type="button" data-share="${safeText(g.value)}">Bagikan</button>
      </div>
      <p class="tiny muted" style="margin:10px 0 0">Terima kasih atas perhatian dan doanya 🙏</p>
    `;
    wrap.appendChild(d);
  });

  wrap.addEventListener("click", async (e)=>{
    const copyBtn = e.target.closest("[data-copy]");
    const shareBtn = e.target.closest("[data-share]");

    if(copyBtn){
      const val = copyBtn.getAttribute("data-copy");
      try{
        await navigator.clipboard.writeText(val);
        copyBtn.textContent = "Tersalin ✓";
        setTimeout(()=>copyBtn.innerHTML = `<span class="btn__glow" aria-hidden="true"></span>Salin`, 1200);
      }catch{
        alert("Gagal salin otomatis. Salin manual ya: " + val);
      }
    }

    if(shareBtn){
      const val = shareBtn.getAttribute("data-share");
      if(navigator.share){
        navigator.share({ title: "Kado Digital", text: val }).catch(()=>{});
      }else{
        alert("Browser belum support share. Kamu bisa salin teks ini:\n" + val);
      }
    }
  });
}

/* ---------------- RSVP & Wishes (localStorage) ---------------- */
function readLS(key){
  try{ return JSON.parse(localStorage.getItem(key) || "[]"); }
  catch{ return []; }
}
function writeLS(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

function wishItem(w){
  const el = document.createElement("div");
  el.className = "wish";
  const when = new Date(w.createdAt || Date.now())
    .toLocaleString("id-ID", { dateStyle:"medium", timeStyle:"short" });
  el.innerHTML = `<b>${safeText(w.name)}</b><p>${safeText(w.text)}</p><small>${when}</small>`;
  return el;
}

function renderWishes(){
  const list = readLS(LS.WISH);
  const wrap = $("#wishList");
  wrap.innerHTML = "";
  if(!list.length){
    wrap.innerHTML = `<p class="muted small">Belum ada ucapan. Jadilah yang pertama 😊</p>`;
    return;
  }
  list.slice(0, 30).forEach(w => wrap.appendChild(wishItem(w)));
}

function stats(){
  const r = readLS(LS.RSVP);
  $("#statTotal").textContent = r.length;
  $("#statHadir").textContent = r.filter(x=>x.attend==="Hadir").length;
  $("#statTidak").textContent = r.filter(x=>x.attend==="Tidak Hadir").length;
}

async function submitEndpoint(payload){
  const mode = state.cfg.rsvp?.mode;
  const url = state.cfg.rsvp?.endpointUrl;
  if(mode !== "endpoint" || !url) return { ok:false, msg:"no-endpoint" };

  try{
    const res = await fetch(url, {
      method:"POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });
    if(!res.ok) throw new Error("HTTP " + res.status);
    return { ok:true };
  }catch(err){
    return { ok:false, msg: err.message || "failed" };
  }
}

function rsvp(){
  if(!state.cfg.rsvp?.enabled){
    $("#rsvp").style.display = "none";
    return;
  }

  $("#rsvpPax").max = String(state.cfg.rsvp.maxPax || 5);

  $("#rsvpForm").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const name = safeText($("#rsvpName").value);
    const attend = $("#rsvpAttend").value;
    const pax = Math.max(1, Math.min(Number($("#rsvpPax").value || 1), Number(state.cfg.rsvp.maxPax || 5)));
    const msg = safeText($("#rsvpMsg").value);

    const entry = { name, attend, pax, msg, createdAt: Date.now() };
    const list = readLS(LS.RSVP);
    list.unshift(entry);
    writeLS(LS.RSVP, list);

    $("#rsvpNote").textContent = "RSVP tersimpan ✓";
    const ep = await submitEndpoint({ type:"rsvp", ...entry });
    if(state.cfg.rsvp.mode === "endpoint" && state.cfg.rsvp.endpointUrl){
      $("#rsvpNote").textContent = ep.ok ? "RSVP terkirim ✓" : "Tersimpan lokal (endpoint gagal).";
    }

    $("#rsvpForm").reset();
    $("#rsvpPax").value = 1;
    stats();
  });

  $("#wishForm").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const name = safeText($("#wishName").value);
    const text = safeText($("#wishText").value);

    const entry = { name, text, createdAt: Date.now() };
    const list = readLS(LS.WISH);
    list.unshift(entry);
    writeLS(LS.WISH, list);

    await submitEndpoint({ type:"wish", ...entry });

    $("#wishForm").reset();
    renderWishes();
  });

  renderWishes();
  stats();
}

/* ---------------- audio + gate ---------------- */
function setMutedUI(muted){
  state.muted = muted;
  $("#btnMute").setAttribute("aria-pressed", String(!muted));
  $("#btnMuteGate").setAttribute("aria-pressed", String(!muted));
  $("#btnMuteGate").textContent = muted ? "Musik: Off" : "Musik: On";
}

async function playAudio(){
  const bgm = $("#bgm");
  bgm.muted = state.muted;
  try{ await bgm.play(); }catch{}
}

function wireAudio(){
  const bgm = $("#bgm");
  bgm.src = state.cfg.music?.src || "";
  setMutedUI(!!state.cfg.music?.startMuted);

  const toggle = async ()=>{
    setMutedUI(!state.muted);
    bgm.muted = state.muted;
    if(!state.muted) await playAudio();
  };

  $("#btnMute").addEventListener("click", toggle);
  $("#btnMuteGate").addEventListener("click", toggle);

  $("#btnOpen").addEventListener("click", async ()=>{
    $("#coverGate").classList.add("hidden");
    await playAudio();
  });
}

/* ---------------- reveal + ui ---------------- */
function reveal(){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting) en.target.classList.add("show");
    });
  }, { threshold: 0.12 });
  $$(".reveal").forEach(el=>io.observe(el));
}

function wireUI(){
  $("#btnTop").addEventListener("click", ()=>window.scrollTo({ top:0, behavior:"smooth" }));
  $("#btnIcs").addEventListener("click", ()=>{
    makeICS({
      title: state.cfg.cover?.title || "Undangan Pernikahan",
      startISO: state.cfg.home?.eventISO,
      durationHours: 3,
      location: state.cfg.home?.locationText || "",
      description: "Undangan Pernikahan"
    });
  });
}

function closing(){
  $("#closingTitle").textContent = state.cfg.closing?.title || "Terima Kasih";
  $("#closingDesc").textContent = state.cfg.closing?.desc || "";
}

/* ---------------- SW ---------------- */
function registerSW(){
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("sw.js").catch(()=>{});
  }
}

/* ---------------- init ---------------- */
(async function init(){
  try{
    state.cfg = await loadConfig();
    setTheme();
    setBrand();
    fillCover();
    setGuest();
    setHome();
    setCouple();
    buildEvents();
    gallery();
    story();
    gifts();
    rsvp();
    closing();

    // cover bg
    const bg = $("#coverBg");
    if(bg && state.cfg.cover?.coverImage){
      bg.style.backgroundImage = `url("${state.cfg.cover.coverImage}")`;
    }

    // countdown
    countdown();

    // wire
    wireAudio();
    wireUI();
    reveal();
    registerSW();

  }catch(err){
    console.error(err);
    alert("Gagal memuat undangan. Pastikan struktur folder & path file benar.");
  }
})();