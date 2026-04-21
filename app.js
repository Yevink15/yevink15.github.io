// app.js - renders portfolio album cards from window.EVENTS

(function () {
  const grid = document.getElementById("grid");
  const featuredGrid = document.getElementById("featuredGrid");
  const search = document.getElementById("search");
  const pills = Array.from(document.querySelectorAll(".pill"));
  const resultCount = document.getElementById("resultCount");

  function getEvents() {
    return Array.isArray(window.EVENTS) ? window.EVENTS : [];
  }

  function folderFor(ev) {
    return ev.folder || ev.slug;
  }

  function coverUrl(ev) {
    return `albums/${folderFor(ev)}/cover.jpg`;
  }

  function albumLink(ev) {
    return `album.html?slug=${encodeURIComponent(ev.slug || ev.folder)}`;
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function categoryLabel(value) {
    return String(value || "work").replace(/-/g, " ").toUpperCase();
  }

  function sortNewest(events) {
    return events.slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  }

  function cardTemplate(e, variant = "") {
    const title = escapeHtml(e.title || e.slug || "Untitled");
    const date = escapeHtml(formatDate(e.date));
    const category = escapeHtml(categoryLabel(e.category));
    const location = escapeHtml(e.location || "");
    const description = escapeHtml(e.description || "");
    const count = Number(e.count || 0);
    const href = albumLink(e);
    const img = coverUrl(e);
    const pos = escapeHtml(e.coverPosition || "50% 50%");
    const classes = ["card", variant].filter(Boolean).join(" ");

    return `
      <a class="${classes}" href="${href}" aria-label="Open ${title} album">
        <div class="card-media">
          <img
            loading="lazy"
            decoding="async"
            src="${img}"
            alt="${title} cover photo"
            style="object-position:${pos};"
            onerror="this.closest('.card-media').classList.add('image-missing')"
          />
          <span class="card-badge">${category}</span>
        </div>
        <div class="card-meta">
          <div class="card-kicker">${[date, location].filter(Boolean).join(" / ")}</div>
          <h3 class="card-title">${title}</h3>
          ${description ? `<p class="card-desc">${description}</p>` : ""}
          <div class="card-foot">
            <span>${count ? `${count} photos` : "Gallery"}</span>
            <span aria-hidden="true">View album</span>
          </div>
        </div>
      </a>
    `;
  }

  function filteredEvents() {
    const q = (search?.value || "").trim().toLowerCase();
    const active = pills.find((p) => p.classList.contains("active"));
    const filter = active ? active.dataset.filter : "all";

    let events = sortNewest(getEvents());

    if (filter && filter !== "all") {
      events = events.filter((e) => (e.category || "").toLowerCase() === filter);
    }

    if (q) {
      events = events.filter((e) => {
        const hay = [e.title, e.date, e.category, e.location, e.description].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }

    return events;
  }

  function renderFeatured() {
    if (!featuredGrid) return;
    const featured = sortNewest(getEvents()).filter((e) => e.featured).slice(0, 4);
    featuredGrid.innerHTML = featured.map((e, idx) => cardTemplate(e, idx === 0 ? "card-feature" : "")).join("");
  }

  function render() {
    if (!grid) return;
    const events = filteredEvents();

    if (resultCount) {
      resultCount.textContent = `${events.length} ${events.length === 1 ? "album" : "albums"}`;
    }

    if (!events.length) {
      grid.innerHTML = `
        <div class="section empty-state">
          <h2>No results found</h2>
          <p>Try a different search, category, or event location.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = events.map((e) => cardTemplate(e)).join("");
  }

  pills.forEach((p) => {
    p.addEventListener("click", () => {
      pills.forEach((x) => x.classList.remove("active"));
      p.classList.add("active");
      render();
    });
  });

  if (search) search.addEventListener("input", render);

  window.addEventListener("load", () => {
    renderFeatured();
    render();
  });
})();
