function getParam(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function renderIndex(){
  const grid = document.getElementById("grid");
  if(!grid) return;

  grid.innerHTML = window.EVENTS.map(e => `
    <a class="card" href="album.html?event=${e.slug}">
      <img src="albums/${e.folder}/cover.jpg">
      <div class="meta">
        <b>${e.title}</b>
        <small>${e.date}</small>
      </div>
    </a>
  `).join("");
}

async function renderAlbum(){
  const slug = getParam("event");
  const event = window.EVENTS.find(e=>e.slug===slug);
  if(!event) return;

  document.getElementById("title").innerText = event.title;
  document.getElementById("sub").innerText = event.date;

  const photosContainer = document.getElementById("photos");

  let i=1;
  while(true){
    const filename = String(i).padStart(2,"0")+".jpg";
    const path = `albums/${event.folder}/${filename}`;
    try{
      const res = await fetch(path,{method:"HEAD"});
      if(!res.ok) break;
      photosContainer.innerHTML += `
        <div class="photo"><img src="${path}"></div>
      `;
      i++;
    }catch{break;}
  }
}

renderIndex();
renderAlbum();