(function () {
  const params = new URLSearchParams(location.search);
  const slug = document.body.dataset.slug || params.get("slug");
  const events = Array.isArray(window.EVENTS) ? window.EVENTS : [];
  const sorted = events.slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const ev = sorted.find((e) => e.slug === slug || e.folder === slug);

  const titleEl = document.getElementById("albumTitle");
  const categoryEl = document.getElementById("albumCategory");
  const descEl = document.getElementById("albumDescription");
  const metaEl = document.getElementById("albumMeta");
  const gridEl = document.getElementById("photos");
  const copyBtn = document.getElementById("copyLink");
  const canonicalLink = document.getElementById("canonicalLink");
  const ogUrl = document.querySelector('meta[property="og:url"]');

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  function label(value) {
    return String(value || "album").replace(/-/g, " ").toUpperCase();
  }

  function albumUrl(album) {
    return `/work/${encodeURIComponent(album.slug || album.folder)}/`;
  }

  if (!ev) {
    titleEl.textContent = "Album not found";
    categoryEl.textContent = "Missing album";
    descEl.textContent = "This gallery may have moved or the link may be incomplete.";
    metaEl.textContent = "";
    gridEl.innerHTML = `<div class="section empty-state"><h2>No photos found</h2><p>Head back to the work archive and choose another album.</p></div>`;
    return;
  }

  const folder = ev.folder || ev.slug;
  const count = Number(ev.count || 0);
  const pad2 = (n) => String(n).padStart(2, "0");
  const images = [];
  for (let i = 1; i <= count; i++) images.push(`/albums/${folder}/${pad2(i)}.jpg`);

  document.title = `${ev.title || folder} | YKCaptures`;
  const canonicalUrl = `https://ykcaptures.com/work/${encodeURIComponent(ev.slug || ev.folder)}/`;
  if (canonicalLink) canonicalLink.href = canonicalUrl;
  if (ogUrl) ogUrl.content = canonicalUrl;
  if (params.has("slug") && !document.body.dataset.slug) {
    history.replaceState(null, "", albumUrl(ev));
  }
  titleEl.textContent = ev.title || folder;
  categoryEl.textContent = label(ev.category);
  descEl.textContent = ev.description || "A YKCaptures event gallery.";
  metaEl.innerHTML = [formatDate(ev.date), ev.location, count ? `${count} photos` : "Gallery"]
    .filter(Boolean)
    .map((item) => `<span>${item}</span>`)
    .join("");

  const currentIndex = sorted.findIndex((item) => item === ev);
  const prev = sorted[(currentIndex - 1 + sorted.length) % sorted.length];
  const next = sorted[(currentIndex + 1) % sorted.length];
  const prevEl = document.getElementById("prevAlbum");
  const nextEl = document.getElementById("nextAlbum");
  prevEl.href = albumUrl(prev);
  prevEl.textContent = `Previous: ${prev.title || prev.slug}`;
  nextEl.href = albumUrl(next);
  nextEl.textContent = `Next: ${next.title || next.slug}`;

  if (!images.length) {
    gridEl.innerHTML = `<div class="section empty-state"><h2>No photos yet</h2><p>Please check back soon.</p></div>`;
    return;
  }

  gridEl.innerHTML = images
    .map((src, idx) => `
      <button class="photo" type="button" data-idx="${idx}" aria-label="Open photo ${idx + 1} of ${images.length}">
        <img loading="lazy" decoding="async" src="${src}" data-idx="${idx}" alt="${ev.title || folder} photo ${idx + 1}">
      </button>
    `)
    .join("");

  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");
  const lbCount = document.getElementById("lbCount");
  const closeBtn = document.getElementById("lbClose");
  const prevBtn = document.getElementById("lbPrev");
  const nextBtn = document.getElementById("lbNext");
  let current = 0;
  let touchStartX = 0;

  function preload(index) {
    if (!images.length) return;
    const img = new Image();
    img.src = images[(index + images.length) % images.length];
  }

  function openAt(i) {
    current = (i + images.length) % images.length;
    lbImg.src = images[current];
    lbImg.alt = `${ev.title || folder} photo ${current + 1}`;
    lbCount.textContent = `${current + 1} / ${images.length}`;
    lb.classList.add("open");
    document.body.classList.add("no-scroll");
    preload(current + 1);
    preload(current - 1);
    closeBtn.focus();
  }

  function close() {
    lb.classList.remove("open");
    document.body.classList.remove("no-scroll");
  }

  function prevImage() {
    openAt(current - 1);
  }

  function nextImage() {
    openAt(current + 1);
  }

  gridEl.addEventListener("click", (e) => {
    const trigger = e.target.closest(".photo");
    if (!trigger) return;
    openAt(Number(trigger.dataset.idx));
  });

  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", prevImage);
  nextBtn.addEventListener("click", nextImage);

  lb.addEventListener("click", (e) => {
    if (e.target === lb) close();
  });

  lb.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  lb.addEventListener("touchend", (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) < 45) return;
    diff > 0 ? prevImage() : nextImage();
  }, { passive: true });

  window.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") prevImage();
    if (e.key === "ArrowRight") nextImage();
  });

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      copyBtn.textContent = "Copied";
      setTimeout(() => { copyBtn.textContent = "Copy Album Link"; }, 1800);
    } catch (err) {
      copyBtn.textContent = "Copy unavailable";
      setTimeout(() => { copyBtn.textContent = "Copy Album Link"; }, 1800);
    }
  });
})();
