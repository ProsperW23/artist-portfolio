/* Digital Exhibition — Vanilla JS
   - Loads local JSON content
   - Renders home featured, works catalogue, and work detail
   - Filtering + sorting
   - Slow reveal on scroll (page-turn feel)
*/

const $ = (q, el=document) => el.querySelector(q);
const $$ = (q, el=document) => Array.from(el.querySelectorAll(q));

const state = {
  site: null,
  artworks: [],
  filter: "All",
  sort: "newest",
  projectTypes: new Set()
};

const CATEGORIES = ["All","Cover","Character","Environment","Concept","Social"];
const PROJECT_TYPES = ["Cover Illustration","Dust Jacket","Endpaper","Interior","Social Media","Custom Request"];

function formatNaira(amount){
  try{
    return new Intl.NumberFormat("en-NG", { style:"currency", currency:"NGN", maximumFractionDigits:0 }).format(amount);
  }catch(e){
    return "₦" + String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
}

async function loadJSON(){
  const [siteRes, worksRes] = await Promise.all([
    fetch("content/site.json", { cache: "no-store" }),
    fetch("content/artworks.json", { cache: "no-store" })
  ]);
  state.site = await siteRes.json();
  const data = await worksRes.json();
  state.artworks = data.artworks || [];
}

function applySiteText(){
  if(!state.site) return;

  const artist = state.site.artist || {};
  const home = state.site.home || {};

  $$("[data-site]").forEach(el => {
    const key = el.getAttribute("data-site");
    if(key === "name") el.textContent = artist.name || el.textContent;
    if(key === "handle") el.textContent = artist.handle || el.textContent;
    if(key === "location") el.textContent = artist.location || el.textContent;
    if(key === "hero_headline") el.innerHTML = (home.hero_headline || "").replace(/\n/g, "<br>");
    if(key === "hero_sub") el.textContent = home.hero_sub || el.textContent;
    if(key === "about_label") el.textContent = home.about_label || el.textContent;
    if(key === "about_text") el.textContent = home.about_text || el.textContent;
  });
}

function setActiveNav(){
  const path = location.pathname.split("/").pop() || "index.html";
  const map = {
    "index.html":"home",
    "works.html":"works",
    "work.html":"works",
    "commission.html":"commission",
    "contact.html":"contact",
    "terms.html":"terms"
  };
  const key = map[path];
  if(!key) return;
  const link = $(`.site-nav a[data-nav="${key}"]`);
  if(link) link.setAttribute("aria-current","page");
}

function pageTurn(){
  // Subtle veil on internal navigation
  const veil = $(".veil");
  if(!veil) return;

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if(!a) return;
    const href = a.getAttribute("href");
    if(!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) return;
    // allow normal for downloads
    if(href.endsWith(".zip") || href.endsWith(".pdf")) return;

    e.preventDefault();
    veil.classList.add("on");
    window.setTimeout(() => { location.href = href; }, 220);
  }, { capture: true });
}

function initReveal(){
  const els = $$(".reveal");
  const io = new IntersectionObserver((entries) => {
    entries.forEach(ent => {
      if(ent.isIntersecting){
        ent.target.classList.add("is-in");
        io.unobserve(ent.target);
      }
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -10% 0px" });

  els.forEach(el => io.observe(el));
}

function initMobileNav(){
  const btn = $(".nav-toggle");
  const mobile = $(".mobile-nav");
  if(!btn || !mobile) return;

  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    mobile.hidden = open;
    mobile.style.display = open ? "none" : "flex";
    if(!open){
      btn.querySelectorAll("span")[0].style.transform = "translateY(3.5px) rotate(45deg)";
      btn.querySelectorAll("span")[1].style.transform = "translateY(-3.5px) rotate(-45deg)";
    }else{
      btn.querySelectorAll("span")[0].style.transform = "";
      btn.querySelectorAll("span")[1].style.transform = "";
    }
  });
  mobile.style.display = "none";
}

function cardHTML(work){
  const thumb = (work.images && work.images[0]) ? work.images[0] : "";
  const status = work.status || "Available";
  const price = status === "Sold" ? work.sold_for : work.price;
  const priceLabel = status === "Sold" ? "Sold for" : "Available for";

  return `
  <article class="card reveal">
    <a href="work.html?id=${encodeURIComponent(work.id)}" class="card-link" aria-label="View work: ${escapeHtml(work.title)}">
      <div class="frame thumb">
        <img src="${thumb}" alt="${escapeHtml(work.title)}">
      </div>
      <div class="card-body">
        <h3 class="title">${escapeHtml(work.title)}</h3>
        <div class="meta">
          <span class="pill">${escapeHtml(work.category)}</span>
          <span class="pill ${status === "Sold" ? "sold":""}">${escapeHtml(status)}</span>
          <span class="price">${priceLabel} ${formatNaira(price || 0)}</span>
        </div>
        <div class="hover">View work</div>
      </div>
    </a>
  </article>`;
}

function renderHomeFeatured(){
  const grid = $("#homeFeaturedGrid");
  if(!grid) return;

  const featured = [...state.artworks].slice(0, 8);
  grid.innerHTML = featured.map(cardHTML).join("");

  // Set hero featured image + caption from first work
  const first = featured[0];
  if(first){
    const img = $("#heroFeaturedImg");
    const cap = $("#heroFeaturedCaption");
    if(img) img.src = first.images[0];
    if(cap) cap.textContent = `${first.title} — ${first.category} (${first.year})`;
  }
  initReveal();
}

function renderWorksCatalogue(){
  const grid = $("#worksGrid");
  const chipsWrap = $("#filterChips");
  const sortSelect = $("#sortSelect");
  if(!grid) return;

  // chips
  if(chipsWrap && chipsWrap.childElementCount === 0){
    chipsWrap.innerHTML = CATEGORIES.map(cat => `
      <button class="chip ${cat === state.filter ? "active":""}" data-cat="${cat}">${cat}</button>
    `).join("");
    chipsWrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if(!btn) return;
      state.filter = btn.getAttribute("data-cat") || "All";
      $$(".chip", chipsWrap).forEach(b => b.classList.toggle("active", b === btn));
      renderWorksCatalogue();
    });
  }

  // sort
  if(sortSelect){
    sortSelect.value = state.sort;
    sortSelect.addEventListener("change", () => {
      state.sort = sortSelect.value;
      renderWorksCatalogue();
    }, { once: true });
  }

  let items = [...state.artworks];
  if(state.filter !== "All"){
    items = items.filter(w => w.category === state.filter);
  }

  items.sort((a,b) => {
    if(state.sort === "newest") return (b.year||0) - (a.year||0);
    if(state.sort === "popular") return (b.popularity||0) - (a.popularity||0);
    if(state.sort === "price"){
      const ap = (a.status === "Sold" ? a.sold_for : a.price) || 0;
      const bp = (b.status === "Sold" ? b.sold_for : b.price) || 0;
      return bp - ap;
    }
    return 0;
  });

  grid.innerHTML = items.map(cardHTML).join("");
  initReveal();
}

function renderWorkDetail(){
  const titleEl = $("#workTitle");
  const descEl = $("#workDesc");
  const main = $("#viewerMain");
  const thumbs = $("#viewerThumbs");
  if(!titleEl || !descEl || !main || !thumbs) return;

  const params = new URLSearchParams(location.search);
  const id = params.get("id") || (state.artworks[0] && state.artworks[0].id);
  const work = state.artworks.find(w => w.id === id) || state.artworks[0];

  if(!work){
    titleEl.textContent = "Work not found";
    descEl.textContent = "Return to the catalogue to continue browsing.";
    return;
  }

  titleEl.textContent = work.title;
  descEl.textContent = work.description;

  // meta
  $("#metaYear").textContent = work.year || "—";
  $("#metaTools").textContent = (work.tools || []).join(", ") || "—";
  $("#metaCategory").textContent = work.category || "—";
  $("#metaDimensions").textContent = work.dimensions || "—";
  $("#metaDelivery").textContent = work.delivery || "—";
  $("#metaStatus").textContent = work.status || "—";

  // pricing box
  const box = $("#pricingBox");
  const status = work.status || "Available";
  if(status === "Sold"){
    box.innerHTML = `
      <div class="status">Sold</div>
      <div class="amount">${formatNaira(work.sold_for || 0)}</div>
      <p class="fine">Recorded sale price. Licensing is closed for this exact artwork, but similar commissions may be available.</p>
    `;
  }else{
    box.innerHTML = `
      <div class="status">Available for</div>
      <div class="amount">${formatNaira(work.price || 0)}</div>
      <p class="fine">Includes a license for the usage agreed at inquiry. See Terms for full licensing details.</p>
    `;
  }

  // viewer
  const images = work.images || [];
  function setMain(src){
    main.innerHTML = `<img src="${src}" alt="${escapeHtml(work.title)}">`;
  }
  setMain(images[0]);

  thumbs.innerHTML = images.map((src, idx) => `
    <button class="thumb-btn" data-src="${src}" aria-current="${idx===0}">
      <img src="${src}" alt="${escapeHtml(work.title)} thumbnail ${idx+1}">
    </button>
  `).join("");

  thumbs.addEventListener("click", (e) => {
    const btn = e.target.closest(".thumb-btn");
    if(!btn) return;
    const src = btn.getAttribute("data-src");
    $$(".thumb-btn", thumbs).forEach(b => b.setAttribute("aria-current", String(b === btn)));
    setMain(src);
  });

  initReveal();
}

function renderCommissionAccordion(){
  const wrap = $("#commissionAccordion");
  if(!wrap) return;

  const items = [
    {
      title: "Cover Illustration",
      meta: "Starting ₦650,000 • 10–18 days",
      bullets: [
        "1–2 concept directions + refined final illustration",
        "Print-safe composition planning for title/author placement",
        "License for one book edition + marketing usage for that title",
        "Rush delivery available by request"
      ],
      notes: "Best for novels, memoirs, and anthology covers. Final delivery includes high-resolution JPG + layered PSD on request."
    },
    {
      title: "Dust Jacket",
      meta: "Starting ₦1,200,000 • 14–28 days",
      bullets: [
        "Front, spine, and back composition planning",
        "Visual system that holds across the full wrap",
        "Print-ready PDF (CMYK) + JPG previews",
        "Extended licensing priced by print run + territory"
      ],
      notes: "Designed as a complete object — not just an image. Ideal for publishers and collectors’ editions."
    },
    {
      title: "Endpaper",
      meta: "Starting ₦480,000 • 7–14 days",
      bullets: [
        "Pattern or illustrative scene designed for repeat/print",
        "Optional monochrome or limited-palette treatment",
        "Delivered as print-ready PDF + high-res PNG",
        "Usage tied to a single title unless extended"
      ],
      notes: "Quiet detail that rewards closeness. Often paired with cover or jacket commissions."
    },
    {
      title: "Interior",
      meta: "Starting ₦350,000 • 7–16 days",
      bullets: [
        "Spot illustration or chapter openers",
        "Consistent visual language across multiple pieces",
        "Bundled pricing available for sets",
        "Delivery as PNG/JPG + print-ready exports"
      ],
      notes: "For essays, editorials, and books that want illustration without spectacle."
    },
    {
      title: "Social Media",
      meta: "Starting ₦220,000 • 3–7 days",
      bullets: [
        "Campaign post series (2–6 frames)",
        "Format pack: square, portrait, story-safe",
        "Usage notes defined per campaign",
        "Fast turnaround with limited revisions"
      ],
      notes: "Designed to feel editorial — calm, confident, intentional. Not trend-chasing."
    },
    {
      title: "Custom Request",
      meta: "Quoted • timeline varies",
      bullets: [
        "Art direction + creative strategy if needed",
        "Clear deliverables, dates, and usage defined in writing",
        "Milestone billing for larger scopes",
        "Optional confidentiality or embargo clauses"
      ],
      notes: "If it’s unusual, describe it simply. The reply will focus on feasibility and clarity."
    }
  ];

  wrap.innerHTML = items.map((it, idx) => `
    <section class="acc-item" aria-expanded="${idx===0}">
      <button class="acc-btn" type="button" aria-controls="acc-${idx}">
        <div>
          <p class="acc-title">${escapeHtml(it.title)}</p>
          <p class="acc-meta">${escapeHtml(it.meta)}</p>
        </div>
        <div class="acc-icon" aria-hidden="true">+</div>
      </button>
      <div class="acc-panel" id="acc-${idx}" ${idx===0 ? "" : "hidden"}>
        <ul>
          ${it.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join("")}
        </ul>
        <p class="fine muted" style="margin-top:12px;">${escapeHtml(it.notes)}</p>
      </div>
    </section>
  `).join("");

  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".acc-btn");
    if(!btn) return;
    const item = btn.closest(".acc-item");
    const open = item.getAttribute("aria-expanded") === "true";

    // allow multiple open? keep single open for calmness
    $$(".acc-item", wrap).forEach(it => {
      it.setAttribute("aria-expanded","false");
      const panel = $(".acc-panel", it);
      if(panel) panel.hidden = true;
    });

    item.setAttribute("aria-expanded", String(!open));
    const panel = item.querySelector(".acc-panel");
    if(panel) panel.hidden = open;
  });

  initReveal();
}

function initContactFormUX(){
  const notice = $("#contactNotice");
  if(!notice) return;

  const params = new URLSearchParams(location.search);
  if(params.get("success") === "1"){
    notice.hidden = false;
    notice.textContent = "Message received. If it’s a good fit, I’ll respond with next steps and a clear quote.";
  }

  // project type chips
  const wrap = $("#projectTypeChips");
  const hidden = $("#projectTypesField");
  if(!wrap || !hidden) return;

  wrap.innerHTML = PROJECT_TYPES.map(t => `<button type="button" class="chip" data-type="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join("");
  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if(!btn) return;
    const t = btn.getAttribute("data-type");
    if(state.projectTypes.has(t)){
      state.projectTypes.delete(t);
      btn.classList.remove("active");
    }else{
      state.projectTypes.add(t);
      btn.classList.add("active");
    }
    hidden.value = Array.from(state.projectTypes).join(", ");
  });
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

function initYear(){
  const y = $("#yearNow");
  if(y) y.textContent = String(new Date().getFullYear());
}

async function main(){
  initYear();
  setActiveNav();
  initMobileNav();
  pageTurn();

  await loadJSON();
  applySiteText();

  // page specific
  if($("#homeFeaturedGrid")) renderHomeFeatured();
  if($("#worksGrid")) renderWorksCatalogue();
  if($("#viewerMain")) renderWorkDetail();
  if($("#commissionAccordion")) renderCommissionAccordion();
  if($("#contactNotice")) initContactFormUX();

  initReveal();
}

main().catch(err => {
  console.error(err);
});

/* BFCache fix (Chrome/Edge/Safari):
   When navigating away and back, the page may be restored from back/forward cache
   without re-running IntersectionObserver reveals, leaving content invisible.
*/
window.addEventListener("pageshow", (e) => {
  if (!e.persisted) return;

  // Remove any previous reveal state
  document.querySelectorAll(".reveal.is-in").forEach(el => el.classList.remove("is-in"));

  // Re-init reveal observer for the restored page
  const els = Array.from(document.querySelectorAll(".reveal"));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(ent => {
      if(ent.isIntersecting){
        ent.target.classList.add("is-in");
        io.unobserve(ent.target);
      }
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -10% 0px" });

  // Slight delay to allow layout to settle after BFCache restore
  setTimeout(() => els.forEach(el => io.observe(el)), 60);
});
