/* =========================================================
   Wedding Invitation Template (GitHub Pages)
   - config.json driven
   - guest name via ?to=Nama+Tamu
   - gate "Buka Undangan" enables audio (browser policy)
   - RSVP + wishes: localStorage (static) or endpoint
========================================================= */

const $ = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => [...p.querySelectorAll(s)];

const state = {
  config: null,
  audioEnabled: false,
  muted: true
};

function getQueryParam(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name) || "";
}

function safeText(s){
  return (s || "").toString().replace(/[<>]/g, "").trim();
}

function prettyDate(idDateISO){
  const d = new Date(idDateISO);
  // locale Indonesian
  return d.toLocaleDateString("id-ID", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
}

function pad2(n){ return String(n).padStart(2, "0"); }

async function loadConfig(){
  const res = await fetch("data/config.json", { cache: "no-store" });
  if(!res.ok) throw new Error("Gagal memuat config.json");
  return res.json();
}

function applyTheme(){
  const c = state.config;
  document.title = c?.site?.title || document.title;

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if(metaTheme && c?.site?.themeColor) metaTheme.setAttribute("content", c.site.themeColor);

  if(c?.site?.themeColor) document.documentElement.style.setProperty("--accent", c.site.themeColor);

  // hero background
  const hero = $("#heroBg");
  if(hero && c?.site?.coverImage) hero.style.backgroundImage = `url("${c.site.coverImage}")`;

  // brand
  $("#brandText").textContent = c?.site?.brand || "Undangan";
  $("#logoBrand").textContent = c?.site?.brand || "Undangan";

  // couple
  $("#groomName").textContent = c?.couple?.groom?.name || "Mempelai Pria";
  $("#groomShort").textContent = c?.couple?.groom?.short || "Pria";
  $("#groomParents").textContent = c?.couple?.groom?.parents || "";
  $("#groomPhoto").src = c?.couple?.groom?.photo || $("#groomPhoto").src;
  $("#groomIg").href = c?.couple?.groom?.instagram || "#";

  $("#brideName").textContent = c?.couple?.bride?.name || "Mempelai Wanita";
  $("#brideShort").textContent = c?.couple?.bride?.short || "Wanita";
  $("#brideParents").textContent = c?.couple?.bride?.parents || "";
  $("#bridePhoto").src = c?.couple?.bride?.photo || $("#bridePhoto").src;
  $("#brideIg").href = c?.couple?.bride?.instagram || "#";

  // event top line
  $("#eventDateText").textContent = prettyDate(c?.event?.dateISO || new Date().toISOString());
  $("#eventCityText").textContent = c?.site?.city || "";

  // event cards
  $("#akadTime").textContent = `${c?.event?.akad?.time || ""} ${c?.event?.timezoneLabel || ""}`.trim();
  $("#akadPlace").innerHTML = `<strong>${safeText(c?.event?.akad?.place || "")}</strong>`;
  $("#akadAddress").textContent = c?.event?.akad?.address || "";

  $("#resepsiTime").textContent = `${c?.event?.resepsi?.time || ""} ${c?.event?.timezoneLabel || ""}`.trim();
  $("#resepsiPlace").innerHTML = `<strong>${safeText(c?.event?.resepsi?.place || "")}</strong>`;
  $("#resepsiAddress").textContent = c?.event?.resepsi?.address || "";

  // maps
  const mapsFrame = $("#mapsFrame");
  if(mapsFrame) mapsFrame.src = c?.event?.mapsEmbedUrl || "";
  const directionBtn = $("#directionBtn");
  if(directionBtn) directionBtn.href = c?.event?.mapsDirectionUrl || "#";

  // story
  renderStory(c?.story || []);

  // gallery
  renderGallery(c?.media?.gallery || []);

  // gifts
  renderGifts(c?.gift);

  // RSVP settings
  const paxInput = $("#rsvpPax");
  if(paxInput) paxInput.max = String(c?.rsvp?.maxPax || 5);

  // audio
  const bgm = $("#bgm");
  if(bgm && c?.media?.music?.src) bgm.src = c.media.music.src;

  // toggle gift section
  if(c?.gift?.enable === false){
    const giftSection = $("#gift");
    if(giftSection) giftSection.style.display = "none";
  }
  if(c?.rsvp?.enable === false){
    const rsvpSection = $("#rsvp");
    if(rsvpSection) rsvpSection.style.display = "none";
    const wishSection = $("#wishes");
    if(wishSection) wishSection.style.display = "none";
  }
}

function setGuestName(){
  const raw = getQueryParam("to");
  const name = safeText(decodeURIComponent(raw.replace(/\+/g," "))) || "Tamu Undangan";
  $("#guestName").textContent = name;
  $("#guestNameInline").textContent = name;
  $("#wishName").value = name !== "Tamu Undangan" ? name : "";
  $("#rsvpName").value = name !== "Tamu Undangan" ? name : "";
}

function revealOnScroll(){
  const els = $$(".reveal");
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting) e.target.classList.add("show");
    });
  }, { threshold: 0.12 });
  els.forEach(el=>io.observe(el));
}

function startCountdown(){
  const target = new Date(state.config?.event?.dateISO || new Date().toISOString()).getTime();
  const tick = () => {
    const now = Date.now();
    let diff = Math.max(0, target - now);

    const days = Math.floor(diff / (1000*60*60*24)); diff -= days*(1000*60*60*24);
    const hrs  = Math.floor(diff / (1000*60*60));    diff -= hrs*(1000*60*60);
    const mins = Math.floor(diff / (1000*60));       diff -= mins*(1000*60);
    const secs = Math.floor(diff / (1000));

    $("#cdDays").textContent = pad2(days);
    $("#cdHours").textContent = pad2(hrs);
    $("#cdMins").textContent = pad2(mins);
    $("#cdSecs").textContent = pad2(secs);
  };
  tick();
  setInterval(tick, 1000);
}

function wireLightbox(){
  const lb = $("#lightbox");
  const lbImg = $("#lightboxImg");
  const close = $("#lightboxClose");

  close.addEventListener("click", ()=>{
    lb.classList.remove("show");
    lb.setAttribute("aria-hidden", "true");
  });
  lb.addEventListener("click", (e)=>{
    if(e.target === lb){
      lb.classList.remove("show");
      lb.setAttribute("aria-hidden", "true");
    }
  });

  window.addEventListener("keydown", (e)=>{
    if(e.key === "Escape"){
      lb.classList.remove("show");
      lb.setAttribute("aria-hidden", "true");
    }
  });

  // delegate click
  $("#galleryGrid").addEventListener("click", (e)=>{
    const item = e.target.closest("[data-full]");
    if(!item) return;
    const src = item.getAttribute("data-full");
    lbImg.src = src;
    lb.classList.add("show");
    lb.setAttribute("aria-hidden", "false");
  });
}

function renderGallery(list){
  const wrap = $("#galleryGrid");
  wrap.innerHTML = "";
  list.forEach((src)=>{
    const div = document.createElement("div");
    div.className = "gitem";
    div.setAttribute("data-full", src);
    div.innerHTML = `<img src="${src}" alt="Foto galeri" loading="lazy">`;
    wrap.appendChild(div);
  });
}

function renderStory(items){
  const wrap = $("#storyWrap");
  wrap.innerHTML = "";
  items.forEach(it=>{
    const el = document.createElement("div");
    el.className = "titem card reveal";
    el.innerHTML = `
      <div class="date">${safeText(it.date || "")}</div>
      <h4>${safeText(it.title || "")}</h4>
      <p>${safeText(it.text || "")}</p>
    `;
    wrap.appendChild(el);
  });
}

function copyToClipboard(text){
  return navigator.clipboard.writeText(text);
}

function renderGifts(gift){
  const wrap = $("#giftWrap");
  wrap.innerHTML = "";

  if(!gift || gift.enable === false) return;

  (gift.accounts || []).forEach(acc=>{
    const card = document.createElement("div");
    card.className = "card reveal";
    card.innerHTML = `
      <h4>${safeText(acc.bank || "Rekening")}</h4>
      <p><strong>${safeText(acc.name || "")}</strong></p>
      <p class="muted"><span class="mono">${safeText(acc.number || "")}</span></p>
      <button class="btn btn--primary btn--sm" type="button">Salin Nomor</button>
      <p class="muted small" style="margin:10px 0 0">Terima kasih 🙏</p>
    `;
    const btn = card.querySelector("button");
    btn.addEventListener("click", async ()=>{
      try{
        await copyToClipboard(acc.number || "");
        btn.textContent = "Tersalin ✓";
        setTimeout(()=>btn.textContent="Salin Nomor", 1200);
      }catch{
        btn.textContent = "Gagal (copy manual)";
        setTimeout(()=>btn.textContent="Salin Nomor", 1500);
      }
    });
    wrap.appendChild(card);
  });

  $("#giftAddress").textContent = gift.addressGift || "-";
}

/* ------------------- Storage helpers ------------------- */
const LS_KEYS = {
  RSVPS: "inv_rsvps_v1",
  WISHES: "inv_wishes_v1"
};

function readLS(key){
  try{
    return JSON.parse(localStorage.getItem(key) || "[]");
  }catch{
    return [];
  }
}
function writeLS(key, data){
  localStorage.setItem(key, JSON.stringify(data));
}

/* ------------------- RSVP + Wishes ------------------- */
function updateStats(){
  const rsvps = readLS(LS_KEYS.RSVPS);
  const total = rsvps.length;
  const hadir = rsvps.filter(r=>r.attend==="Hadir").length;
  const tidak = rsvps.filter(r=>r.attend==="Tidak Hadir").length;

  $("#statTotal").textContent = String(total);
  $("#statHadir").textContent = String(hadir);
  $("#statTidak").textContent = String(tidak);

  // preview wishes from RSVPs with message or wishes list
  const wishes = readLS(LS_KEYS.WISHES);
  const preview = wishes.slice(0, 3);
  const wrap = $("#wishPreview");
  wrap.innerHTML = preview.length ? "" : `<p class="muted small">Belum ada ucapan.</p>`;
  preview.forEach(w=>{
    wrap.appendChild(wishItem(w));
  });
}

function wishItem(w){
  const el = document.createElement("div");
  el.className = "wish";
  const date = new Date(w.createdAt || Date.now()).toLocaleString("id-ID", { dateStyle:"medium", timeStyle:"short" });
  el.innerHTML = `<b>${safeText(w.name || "Tamu")}</b><p>${safeText(w.text || "")}</p><div class="muted small" style="margin-top:8px">${date}</div>`;
  return el;
}

function renderWishes(){
  const list = readLS(LS_KEYS.WISHES);
  const wrap = $("#wishList");
  wrap.innerHTML = "";

  if(!list.length){
    wrap.innerHTML = `<p class="muted">Belum ada ucapan. Jadilah yang pertama 😊</p>`;
    return;
  }

  list.forEach(w => wrap.appendChild(wishItem(w)));
}

async function submitToEndpoint(payload){
  const { rsvp } = state.config;
  if(!rsvp?.endpointUrl) return { ok:false, message:"Endpoint belum diisi." };

  try{
    const res = await fetch(rsvp.endpointUrl, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });
    if(!res.ok) throw new Error("HTTP " + res.status);
    return { ok:true };
  }catch(err){
    return { ok:false, message: err?.message || "Gagal kirim." };
  }
}

function wireForms(){
  const rsvpForm = $("#rsvpForm");
  const wishForm = $("#wishForm");
  const note = $("#rsvpNote");

  rsvpForm?.addEventListener("submit", async (e)=>{
    e.preventDefault();

    const name = safeText($("#rsvpName").value);
    const attend = $("#rsvpAttend").value;
    const pax = Math.max(1, Math.min(Number($("#rsvpPax").value || 1), Number(state.config?.rsvp?.maxPax || 5)));
    const msg = safeText($("#rsvpMsg").value);

    const entry = { name, attend, pax, msg, createdAt: Date.now() };

    // always store locally for this static template
    const rsvps = readLS(LS_KEYS.RSVPS);
    rsvps.unshift(entry);
    writeLS(LS_KEYS.RSVPS, rsvps);

    // optionally send to endpoint
    if(state.config?.rsvp?.submitMode === "endpoint" && state.config?.rsvp?.endpointUrl){
      note.textContent = "Mengirim ke server...";
      const result = await submitToEndpoint({ type:"rsvp", ...entry });
      note.textContent = result.ok ? "RSVP terkirim ✓" : `RSVP tersimpan lokal. Endpoint gagal: ${result.message}`;
    }else{
      note.textContent = "RSVP tersimpan ✓ (mode statis)";
    }

    rsvpForm.reset();
    $("#rsvpPax").value = 1;
    updateStats();
    renderWishes();
  });

  wishForm?.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const name = safeText($("#wishName").value);
    const text = safeText($("#wishText").value);
    const entry = { name, text, createdAt: Date.now() };

    const wishes = readLS(LS_KEYS.WISHES);
    wishes.unshift(entry);
    writeLS(LS_KEYS.WISHES, wishes);

    // optional endpoint reuse
    if(state.config?.rsvp?.submitMode === "endpoint" && state.config?.rsvp?.endpointUrl){
      await submitToEndpoint({ type:"wish", ...entry });
    }

    wishForm.reset();
    renderWishes();
    updateStats();
  });
}

/* ------------------- Calendar (.ics) ------------------- */
function wireCalendar(){
  $("#addToCalendar").addEventListener("click", ()=>{
    const c = state.config;
    const start = new Date(c.event.dateISO);
    // end: +2 hours default
    const end = new Date(start.getTime() + 2*60*60*1000);

    const dt = (d)=>{
      // ICS uses UTC format
      const z = new Date(d).toISOString().replace(/[-:]/g,"").split(".")[0] + "Z";
      return z;
    };

    const summary = `Pernikahan ${c.couple.groom.short} & ${c.couple.bride.short}`;
    const location = `${c.event.resepsi.place}, ${c.event.resepsi.address}`;
    const desc = `Akad: ${c.event.akad.time} - ${c.event.akad.place}\nResepsi: ${c.event.resepsi.time} - ${c.event.resepsi.place}`;

    const ics =
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Undangan//GitHub Pages//ID
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${Date.now()}@undangan
DTSTAMP:${dt(new Date())}
DTSTART:${dt(start)}
DTEND:${dt(end)}
SUMMARY:${summary}
DESCRIPTION:${desc}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "undangan.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
}

/* ------------------- Audio gate ------------------- */
function setMutedUI(muted){
  const muteBtn = $("#muteBtn");
  const muteBtnGate = $("#muteBtnGate");
  state.muted = muted;

  muteBtn.setAttribute("aria-pressed", String(!muted));
  muteBtnGate.setAttribute("aria-pressed", String(!muted));

  muteBtn.title = muted ? "Musik Off" : "Musik On";
  muteBtnGate.textContent = muted ? "Musik: Off" : "Musik: On";
}

async function tryPlayAudio(){
  const bgm = $("#bgm");
  if(!bgm?.src) return;

  bgm.muted = state.muted;
  try{
    await bgm.play();
    state.audioEnabled = true;
  }catch{
    // ignore: user gesture required or blocked
  }
}

function wireAudio(){
  const muteBtn = $("#muteBtn");
  const muteBtnGate = $("#muteBtnGate");

  const toggle = async ()=>{
    setMutedUI(!state.muted);
    const bgm = $("#bgm");
    bgm.muted = state.muted;
    if(!state.muted) await tryPlayAudio();
  };

  muteBtn.addEventListener("click", toggle);
  muteBtnGate.addEventListener("click", toggle);
}

function wireGate(){
  const gate = $("#gate");
  $("#openBtn").addEventListener("click", async ()=>{
    gate.classList.add("hidden");
    // after open, if unmuted then play. If muted, still can play muted (optional)
    await tryPlayAudio();
  });
}

/* ------------------- Service worker ------------------- */
function registerSW(){
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("sw.js").catch(()=>{});
  }
}

/* ------------------- Init ------------------- */
(async function init(){
  try{
    state.config = await loadConfig();
    applyTheme();
    setGuestName();

    revealOnScroll();
    startCountdown();
    wireLightbox();
    wireForms();
    wireCalendar();
    wireAudio();
    wireGate();

    // defaults: muted on
    setMutedUI(true);

    renderWishes();
    updateStats();
    registerSW();
  }catch(err){
    console.error(err);
    alert("Gagal memuat undangan. Pastikan file lengkap dan path benar.");
  }
})();