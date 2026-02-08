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
  return d.toLocaleDateString("id-ID", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
}

function pad2(n){ return String(n).padStart(2, "0"); }

async function loadConfig(){
  const res = await fetch("data/config.json", { cache: "no-store" });
  if(!res.ok) throw new Error("Gagal memuat config.json");
  return res.json();
}

// --- FUNGSI UPDATE PETA (GLOBAL) ---
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
      dirBtn.href = event.akad.mapsDirection;
    } else {
      if(mapTitle) mapTitle.innerText = "Lokasi Ngunduh Mantu";
      mapFrame.src = event.ngunduh.mapsEmbed;
      dirBtn.href = event.ngunduh.mapsDirection;
    }
    mapFrame.style.opacity = "1";
  }, 300);
}

function applyTheme() {
  const c = state.config;

  if(c?.site?.themeColor) {
    document.documentElement.style.setProperty("--accent", c.site.themeColor);
    const metaTheme = $('meta[name="theme-color"]');
    if(metaTheme) metaTheme.setAttribute("content", c.site.themeColor);
  }

  const hero = $("#heroBg");
  if(hero && c?.site?.coverImage) hero.style.backgroundImage = `url("${c.site.coverImage}")`;

  $("#brandText").textContent = c?.site?.brand || "Undangan";
  $("#logoBrand").textContent = c?.site?.brand || "Undangan";

  // Couple
  $("#groomName").textContent = c?.couple?.groom?.name;
  $("#groomShort").textContent = c?.couple?.groom?.short;
  $("#groomParents").textContent = c?.couple?.groom?.parents;
  $("#groomPhoto").src = c?.couple?.groom?.photo || $("#groomPhoto").src;
  $("#groomIg").href = c?.couple?.groom?.instagram || "#";

  $("#brideName").textContent = c?.couple?.bride?.name;
  $("#brideShort").textContent = c?.couple?.bride?.short;
  $("#brideParents").textContent = c?.couple?.bride?.parents;
  $("#bridePhoto").src = c?.couple?.bride?.photo || $("#bridePhoto").src;
  $("#brideIg").href = c?.couple?.bride?.instagram || "#";

  // Event
  $("#eventDateText").textContent = prettyDate(c?.event?.dateISO);
  $("#eventCityText").textContent = c?.site?.city || "";

  $("#akadTime").textContent = `${c?.event?.akad?.time || ""} ${c?.event?.timezoneLabel || ""}`;
  $("#akadPlace").innerHTML = `<strong>${safeText(c?.event?.akad?.place)}</strong>`;
  $("#akadAddress").textContent = c?.event?.akad?.address;

  $("#ngunduhTime").textContent = `${c?.event?.ngunduh?.time || ""} ${c?.event?.timezoneLabel || ""}`;
  $("#ngunduhPlace").innerHTML = `<strong>${safeText(c?.event?.ngunduh?.place)}</strong>`;
  $("#ngunduhAddress").textContent = c?.event?.ngunduh?.address;

  updateMapContent('akad');
  renderStory(c?.story || []);
  renderGallery(c?.media?.gallery || []);
  renderGifts(c?.gift);

  const bgm = $("#bgm");
  if(bgm && c?.media?.music?.src) bgm.src = c.media.music.src;

  if(c?.gift?.enable === false) $("#gift")?.style.setProperty("display", "none");
  if(c?.rsvp?.enable === false) $("#rsvp")?.style.setProperty("display", "none");
}

function setGuestName(){
  const raw = getQueryParam("to");
  const name = safeText(decodeURIComponent(raw.replace(/\+/g," "))) || "Tamu Undangan";
  if($("#guestName")) $("#guestName").textContent = name;
  if($("#guestNameInline")) $("#guestNameInline").textContent = name;
  
  const rsvpNameInput = $("#rsvpName");
  if(rsvpNameInput) rsvpNameInput.value = name !== "Tamu Undangan" ? name : "";
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
  const target = new Date(state.config?.event?.dateISO).getTime();
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

function renderGallery(list){
  const wrap = $("#galleryGrid");
  if(!wrap) return;
  wrap.innerHTML = "";
  list.forEach((src)=>{
    const div = document.createElement("div");
    div.className = "gitem";
    div.setAttribute("data-full", src);
    div.innerHTML = `<img src="${src}" alt="Foto" loading="lazy">`;
    wrap.appendChild(div);
  });
}

function renderStory(items){
  const wrap = $("#storyWrap");
  if(!wrap) return;
  wrap.innerHTML = "";
  items.forEach(it=>{
    const el = document.createElement("div");
    el.className = "titem card reveal";
    el.innerHTML = `<div class="date">${safeText(it.date)}</div><h4>${safeText(it.title)}</h4><p>${safeText(it.text)}</p>`;
    wrap.appendChild(el);
  });
}

function renderGifts(gift){
  const wrap = $("#giftWrap");
  if(!wrap) return;
  wrap.innerHTML = "";
  if(!gift || gift.enable === false) return;
  (gift.accounts || []).forEach(acc=>{
    const card = document.createElement("div");
    card.className = "card reveal";
    card.innerHTML = `<h4>${safeText(acc.bank)}</h4><p><strong>${safeText(acc.name)}</strong></p><p class="muted">${safeText(acc.number)}</p><button class="btn btn--sm" onclick="copyToClipboard('${acc.number}')">Salin</button>`;
    wrap.appendChild(card);
  });
}

function copyToClipboard(text){
  navigator.clipboard.writeText(text).then(() => alert("Berhasil disalin!"));
}

// --- INISIALISASI UTAMA ---
document.addEventListener("DOMContentLoaded", async () => {
  // Fungsi Buka Gate (Jalur Darurat)
  const openBtn = document.getElementById("openBtn");
  const gate = document.getElementById("gate");
  if (openBtn && gate) {
    openBtn.onclick = () => {
      gate.classList.add("gate--hidden");
      const bgm = document.getElementById("bgm");
      if (bgm) bgm.play().catch(() => console.log("Autoplay blocked"));
    };
  }

  try {
    state.config = await loadConfig();
    applyTheme();
    setGuestName();
    startCountdown();
    revealOnScroll();
  } catch (err) {
    console.error("Gagal memuat data, tapi gate tetap bisa dibuka:", err);
  }
});


