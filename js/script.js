const $ = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => [...p.querySelectorAll(s)];

const state = {
  config: null,
  audioEnabled: false,
  muted: true
};

// Helper Aman: Isi teks hanya jika elemennya ada
const setIfExist = (id, content, isHtml = false) => {
  const el = document.getElementById(id);
  if (el) {
    if (isHtml) el.innerHTML = content;
    else el.textContent = content;
  }
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
  return d.toLocaleDateString("id-ID", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
}

function pad2(n){ return String(n).padStart(2, "0"); }

async function loadConfig(){
  const res = await fetch("data/config.json", { cache: "no-store" });
  if(!res.ok) throw new Error("Gagal memuat config.json");
  return res.json();
}

// Logic Sidebar
const menuBtn = document.getElementById('menuBtn');
const closeBtn = document.getElementById('closeMenu');
const sideNav = document.getElementById('sideNav');
const overlay = document.getElementById('navOverlay');
const navLinks = document.querySelectorAll('.nav-link');

const toggleMenu = () => {
  sideNav.classList.toggle('active');
  overlay.style.display = sideNav.classList.contains('active') ? 'block' : 'none';
};

menuBtn.onclick = toggleMenu;
closeBtn.onclick = toggleMenu;
overlay.onclick = toggleMenu;

// Menutup menu saat link diklik
navLinks.forEach(link => {
  link.onclick = toggleMenu;
});

// Gunakan state global untuk melacak status musik
let isMusicPlaying = false;

function toggleMusic() {
  const bgm = document.getElementById("bgm");
  const muteBtn = document.getElementById("muteBtn");
  
  if (!bgm) return;

  if (bgm.paused) {
    bgm.play().catch(e => console.log("Gagal putar:", e));
    isMusicPlaying = true;
    document.body.classList.add("playing"); // Jalankan animasi putar
    muteBtn.innerHTML = '<span class="icon rotate">♪</span>';
  } else {
    bgm.pause();
    isMusicPlaying = false;
    document.body.classList.remove("playing"); // Stop animasi putar
    muteBtn.innerHTML = '<span class="icon"><s>♪</s></span>';
  }
}

// Pasang event listener saat Buka Undangan diklik
const openBtn = document.getElementById("openBtn");
if (openBtn) {
  openBtn.onclick = function() {
    // 1. Sembunyikan Cover
    document.getElementById("gate").classList.add("gate--hidden");
    
    // 2. Putar Musik
    const bgm = document.getElementById("bgm");
    if (bgm) {
      bgm.play().then(() => {
        document.body.classList.add("playing"); // Jalankan animasi putar ♪
      }).catch(e => console.log("Musik diblokir browser:", e));
    }
  };
}

// Fungsi Toggle Musik di Header
const muteBtn = document.getElementById("muteBtn");
if (muteBtn) {
  muteBtn.onclick = () => {
    const bgm = document.getElementById("bgm");
    if (bgm.paused) {
      bgm.play();
      document.body.classList.add("playing");
    } else {
      bgm.pause();
      document.body.classList.remove("playing");
    }
  };
}

// Logic Animasi Musik (Update fungsi muteBtn Anda)
const muteBtn = document.getElementById('muteBtn');
muteBtn.addEventListener('click', () => {
  document.body.classList.toggle('playing'); // Menjalankan animasi putar
});

// --- FUNGSI UPDATE PETA ---
function updateMapContent(type) {
  const event = state.config?.event;
  const mapFrame = document.getElementById('mapsFrame');
  const dirBtn = document.getElementById('directionBtn');
  const mapTitle = document.getElementById('mapTitle');
  
  if (!event || !mapFrame) return;

  mapFrame.style.opacity = "0";
  setTimeout(() => {
    if (type === 'akad') {
      if(mapTitle) mapTitle.innerText = "Lokasi Akad & Resepsi";
      mapFrame.src = event.akad.mapsEmbed;
      if(dirBtn) dirBtn.href = event.akad.mapsDirection;
    } else {
      if(mapTitle) mapTitle.innerText = "Lokasi Ngunduh Mantu";
      mapFrame.src = event.ngunduh.mapsEmbed;
      if(dirBtn) dirBtn.href = event.ngunduh.mapsDirection;
    }
    mapFrame.style.opacity = "1";
  }, 300);
}

// --- FUNGSI APPLY THEME ---
function applyTheme() {
  const c = state.config;
  if(!c) return;

  setIfExist("brandText", c.site?.brand);
  setIfExist("logoBrand", c.site?.brand);
  setIfExist("groomName", c.couple?.groom?.name);
  setIfExist("groomShort", c.couple?.groom?.short);
  setIfExist("brideName", c.couple?.bride?.name);
  setIfExist("brideShort", c.couple?.bride?.short);

  const tz = c.event?.timezoneLabel || "";
  setIfExist("eventDateText", prettyDate(c.event?.dateISO));
  setIfExist("eventCityText", c.site?.city);

  // Detail Akad
  setIfExist("akadTime", `${c.event?.akad?.time || ""} ${tz}`);
  setIfExist("akadPlace", `<strong>${c.event?.akad?.place || ""}</strong>`, true);
  setIfExist("akadAddress", c.event?.akad?.address);

  // Detail Ngunduh
  setIfExist("ngunduhTime", `${c.event?.ngunduh?.time || ""} ${tz}`);
  setIfExist("ngunduhPlace", `<strong>${c.event?.ngunduh?.place || ""}</strong>`, true);
  setIfExist("ngunduhAddress", c.event?.ngunduh?.address);

  updateMapContent('akad');
  if (typeof renderStory === "function") renderStory(c.story || []);
  if (typeof renderGallery === "function") renderGallery(c.media?.gallery || []);
  if (typeof renderGifts === "function") renderGifts(c.gift);
}

// --- FUNGSI KALENDER ---
function addToCalendar() {
  const c = state.config;
  if (!c) return;
  const summary = `Pernikahan ${c.couple.groom.short} & ${c.couple.bride.short}`;
  const location = `${c.event.akad.place}, ${c.event.akad.address}`;
  const desc = `Akad: ${c.event.akad.time}\nNgunduh: ${c.event.ngunduh.time}`;
  const dateStr = c.event.dateISO.replace(/[-:]/g, "").split(".")[0] + "Z";
  const url = `https://calendar.google.com{encodeURIComponent(summary)}&dates=${dateStr}/${dateStr}&details=${encodeURIComponent(desc)}&location=${encodeURIComponent(location)}`;
  window.open(url, "_blank");
}

function setGuestName(){
  const raw = getQueryParam("to");
  const name = safeText(decodeURIComponent(raw.replace(/\+/g," "))) || "Tamu Undangan";
  setIfExist("guestName", name);
  setIfExist("guestNameInline", name);
  const rsvpNameInput = document.getElementById("rsvpName");
  if(rsvpNameInput) rsvpNameInput.value = name !== "Tamu Undangan" ? name : "";
}

function startCountdown(){
  const dateISO = state.config?.event?.dateISO;
  if(!dateISO) return;
  const target = new Date(dateISO).getTime();
  const tick = () => {
    const now = Date.now();
    let diff = Math.max(0, target - now);
    const days = Math.floor(diff / (1000*60*60*24)); diff -= days*(1000*60*60*24);
    const hrs  = Math.floor(diff / (1000*60*60));    diff -= hrs*(1000*60*60);
    const mins = Math.floor(diff / (1000*60));       diff -= mins*(1000*60);
    const secs = Math.floor(diff / (1000));
    setIfExist("cdDays", pad2(days));
    setIfExist("cdHours", pad2(hrs));
    setIfExist("cdMins", pad2(mins));
    setIfExist("cdSecs", pad2(secs));
  };
  tick();
  setInterval(tick, 1000);
}

// --- INISIALISASI ---
document.addEventListener("DOMContentLoaded", () => {
  const openBtn = document.getElementById("openBtn");
  const gate = document.getElementById("gate");

  if (openBtn && gate) {
    openBtn.onclick = () => {
      gate.classList.add("gate--hidden");
      const bgm = document.getElementById("bgm");
      if (bgm) bgm.play().catch(() => console.log("Audio blocked"));
    };
  }
  initInvitation();
});

async function initInvitation() {
  try {
    state.config = await loadConfig();
    applyTheme();
    setGuestName();
    startCountdown();
    // Reveal On Scroll
    const els = [...document.querySelectorAll(".reveal")];
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add("show"); });
    }, { threshold: 0.12 });
    els.forEach(el=>io.observe(el));

    const calBtn = document.getElementById("addToCalendar");
    if (calBtn) calBtn.onclick = addToCalendar;
  } catch (err) {
    console.error("Init Gagal:", err);
  }
}

// --- RENDERER ---
function renderGallery(list){
  const wrap = document.getElementById("galleryGrid");
  if(!wrap) return;
  wrap.innerHTML = "";
  list.forEach(src => {
    const div = document.createElement("div");
    div.className = "gitem";
    div.innerHTML = `<img src="${src}" alt="Foto" loading="lazy">`;
    wrap.appendChild(div);
  });
}

function renderStory(items){
  const wrap = document.getElementById("storyWrap");
  if(!wrap) return;
  wrap.innerHTML = "";
  items.forEach(it => {
    const el = document.createElement("div");
    el.className = "titem card reveal";
    el.innerHTML = `<div class="date">${it.date}</div><h4>${it.title}</h4><p>${it.text}</p>`;
    wrap.appendChild(el);
  });
}

function renderGifts(gift){
  const wrap = document.getElementById("giftWrap");
  if(!wrap || !gift?.enable) return;
  wrap.innerHTML = "";
  gift.accounts.forEach(acc => {
    const card = document.createElement("div");
    card.className = "card reveal";
    card.innerHTML = `<h4>${acc.bank}</h4><p><strong>${acc.name}</strong></p><p class="muted">${acc.number}</p><button class="btn btn--sm" onclick="navigator.clipboard.writeText('${acc.number}').then(()=>alert('Tersalin'))">Salin</button>`;
    wrap.appendChild(card);
  });
}



