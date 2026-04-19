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

    // newest first
    events = events.slice().sort((a, b) =>
      String(b.date || "").localeCompare(String(a.date || ""))
    );

    if (filter && filter !== "all") {
      events = events.filter(
        (e) => (e.category || "").toLowerCase() === filter
      );
    }

    if (q) {
      events = events.filter((e) => {
        const hay = `${e.title || ""} ${e.date || ""} ${e.category || ""}`.toLowerCase();
        return hay.includes(q);
      });
    }

    if (!grid) return;

    if (!events.length) {
      grid.innerHTML = `
        <div class="section empty-state">
          <h2>No results found</h2>
          <p>Try a different search or filter.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = events
      .map((e) => {
        const title = escapeHtml(e.title || e.slug || "Untitled");
        const date = escapeHtml(e.date || "");
        const href = albumLink(e);
        const img = coverUrl(e);

        // 🔥 THIS IS THE NEW PART
        const pos = escapeHtml(e.coverPosition || "50% 50%");

        return `
          <a class="card" href="${href}">
            <div class="card-media">
              <img 
                loading="lazy" 
                src="${img}" 
                alt="${title}" 
                style="object-position:${pos};"
                onerror="this.style.opacity=0.2" 
              />
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

  pills.forEach((p) => {
    p.addEventListener("click", () => {
      pills.forEach((x) => x.classList.remove("active"));
      p.classList.add("active");
      render();
    });
  });

  if (search) search.addEventListener("input", render);

  window.addEventListener("load", render);
})();