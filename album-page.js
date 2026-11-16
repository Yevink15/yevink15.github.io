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
  const previews = [];
  for (let i = 1; i <= count; i++) {
    if ((ev.excludePhotos || []).includes(i)) continue;
    images.push(`/albums/${folder}/${pad2(i)}.jpg`);
    previews.push(`/albums/${folder}/thumbs/${pad2(i)}.jpg`);
  }

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
  metaEl.innerHTML = [formatDate(ev.date), ev.location, images.length ? `${images.length} photos` : "Gallery"]
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
        <img class="photo-preview" loading="lazy" decoding="async" src="${previews[idx]}" data-full-src="${src}" data-idx="${idx}" alt="${ev.title || folder} photo ${idx + 1}">
      </button>
    `)
    .join("");

  gridEl.querySelectorAll(".photo img").forEach((img) => {
    const markLoaded = () => {
      if (img.naturalWidth > 0) img.classList.add("is-loaded");
    };
    img.addEventListener("load", markLoaded, { once: true });
    img.addEventListener("error", () => {
      img.closest(".photo")?.classList.add("is-broken");
      if (img.dataset.fullSrc && img.src !== new URL(img.dataset.fullSrc, location.href).href) {
        img.src = img.dataset.fullSrc;
      }
    }, { once: true });
    if (img.complete) markLoaded();
  });

  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");
  const lbCount = document.getElementById("lbCount");
  const closeBtn = document.getElementById("lbClose");
  const prevBtn = document.getElementById("lbPrev");
  const nextBtn = document.getElementById("lbNext");
  let current = 0;
  let touchStartX = 0;
  let returnFocusTo = null;

  function preload(index) {
    if (!images.length) return;
    const img = new Image();
    img.src = images[(index + images.length) % images.length];
  }

  function openAt(i) {
    if (!lb.classList.contains("open")) {
      returnFocusTo = document.activeElement;
      document.querySelector("header")?.setAttribute("inert", "");
      Array.from(document.querySelector("main")?.children || [])
        .filter((element) => element !== lb)
        .forEach((element) => element.setAttribute("inert", ""));
    }
    current = (i + images.length) % images.length;
    lbImg.classList.remove("is-loaded");
    lbImg.src = images[current];
    lbImg.alt = `${ev.title || folder} photo ${current + 1}`;
    const markLightboxLoaded = () => lbImg.classList.add("is-loaded");
    lbImg.addEventListener("load", markLightboxLoaded, { once: true });
    if (lbImg.complete && lbImg.naturalWidth > 0) markLightboxLoaded();
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
    document.querySelector("header")?.removeAttribute("inert");
    Array.from(document.querySelector("main")?.children || [])
      .filter((element) => element !== lb)
      .forEach((element) => element.removeAttribute("inert"));
    if (returnFocusTo instanceof HTMLElement && returnFocusTo.isConnected) {
      returnFocusTo.focus();
    }
    returnFocusTo = null;
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
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevImage();
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      nextImage();
    }
    if (e.key === "Tab") {
      const controls = [closeBtn, prevBtn, nextBtn];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (e.shiftKey && (document.activeElement === first || !lb.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !lb.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    }
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

// Optional client photo selections.
{ const script = document.createElement('script'); script.src = '/selections.js?v=2'; document.body.append(script); }

