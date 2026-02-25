// app.js — renders album cards from window.EVENTS

(function () {
  const grid = document.getElementById("grid");
  const search = document.getElementById("search");
  const pills = Array.from(document.querySelectorAll(".pill"));

  function getEvents() {
    const events = window.EVENTS;
    return Array.isArray(events) ? events : [];
  }

  function coverUrl(ev) {
    // uses folder field if present, otherwise slug
    const folder = ev.folder || ev.slug;
    return `albums/${folder}/cover.jpg`;
  }

  function albumLink(ev) {
    const slug = ev.slug || ev.folder;
    return `album.html?slug=${encodeURIComponent(slug)}`;
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function render() {
    const q = (search?.value || "").trim().toLowerCase();
    const active = pills.find((p) => p.classList.contains("active"));
    const filter = active ? active.dataset.filter : "all";

    let events = getEvents();

    // newest first if date exists
    events = events.slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

    if (filter && filter !== "all") {
      events = events.filter((e) => (e.category || "").toLowerCase() === filter);
    }

    if (q) {
      events = events.filter((e) => {
        const hay = `${e.title || ""} ${e.date || ""} ${e.category || ""}`.toLowerCase();
        return hay.includes(q);
      });
    }

    if (!grid) return;

    grid.innerHTML = events
      .map((e) => {
        const title = escapeHtml(e.title || e.slug || "Untitled");
        const date = escapeHtml(e.date || "");
        const cat = escapeHtml((e.category || "").toUpperCase());
        const href = albumLink(e);
        const img = coverUrl(e);

        return `
          <a class="card" href="${href}">
            <div class="card-media">
              <img loading="lazy" src="${img}" alt="${title}" onerror="this.style.opacity=0.2" />
            </div>
            <div class="card-meta">
              <div class="card-title">${title}</div>
              ${date ? `<div class="card-sub">${date}</div>` : ""}
            </div>
          </a>
        `;
      })
      .join("");
  }

  // pill click handlers
  pills.forEach((p) => {
    p.addEventListener("click", () => {
      pills.forEach((x) => x.classList.remove("active"));
      p.classList.add("active");
      render();
    });
  });

  // search handler
  if (search) search.addEventListener("input", render);

  // render once the page is fully loaded (ensures window.EVENTS exists)
  window.addEventListener("load", render);
})();