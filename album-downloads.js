(() => {
 const actions=document.querySelector('.album-actions');
 const photos=Array.from(document.querySelectorAll('#photos img')).map(img=>img.src);
 const album=document.body.dataset.slug||new URLSearchParams(location.search).get('slug')||location.pathname.split('/').filter(Boolean).pop();
 if(!actions||!photos.length)return;
 const wrap=document.createElement('div');wrap.className='album-download-picker';
 const toggle=document.createElement('button');toggle.className='btn';toggle.type='button';toggle.textContent='Download album';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','albumDownloadChoices');
 const panel=document.createElement('div');panel.id='albumDownloadChoices';panel.className='album-download-choices';panel.hidden=true;
 const free=document.createElement('button');free.type='button';free.className='btn';free.textContent='1080p ZIP · Free';
 const originals=document.createElement('a');originals.className='btn';originals.textContent='Originals ZIP · Password';originals.href='https://immich-photos.tail81707f.ts.net/originals/'+encodeURIComponent(album)+'/open/album';originals.target='_blank';originals.rel='noopener';
 const status=document.createElement('p');status.setAttribute('role','status');status.className='album-download-status';
 panel.append(free,originals,status);wrap.append(toggle,panel);actions.prepend(wrap);
 toggle.onclick=()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden))};
 free.onclick=async()=>{
  free.disabled=true;status.textContent='Preparing album… Keep this tab open.';
  try{
   const {makeZip}=await import('/album-zip.mjs');const files=[];
   for(let i=0;i<photos.length;i++){
    const response=await fetch(photos[i]);if(!response.ok)throw Error('A photo could not be downloaded. Please try again.');
    files.push({name:album+'-'+new URL(photos[i]).pathname.split('/').pop(),data:new Uint8Array(await response.arrayBuffer())});
    status.textContent='Preparing '+(i+1)+' of '+photos.length+' photos…';
   }
   const url=URL.createObjectURL(makeZip(files));const link=document.createElement('a');link.href=url;link.download=album+'-1080p.zip';link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
   status.textContent='Your album ZIP is ready.';
  }catch(error){status.textContent=error.message||'Download failed. Please try again.'}finally{free.disabled=false}
 };
})();
