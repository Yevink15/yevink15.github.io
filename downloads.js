(() => {
  'use strict';
  const image=document.getElementById('lbImg');
  const lightbox=document.getElementById('lightbox');
  if(!image||!lightbox)return;
  const album=document.body.dataset.slug||new URLSearchParams(location.search).get('slug')||location.pathname.split('/').filter(Boolean).pop();
  const api='https://immich-photos.tail81707f.ts.net/originals/'+encodeURIComponent(album);
  const bar=document.createElement('div');bar.className='photo-downloads';
  const free=document.createElement('button');free.type='button';free.textContent='Download 1080p · Free';
  const original=document.createElement('button');original.type='button';original.textContent='Unlock original';original.disabled=true;
  const status=document.createElement('p');status.className='download-status';status.setAttribute('role','status');
  bar.append(free,original,status);image.parentElement.append(bar);
  let token='',available=new Set(),busy=false;
  const number=()=>decodeURIComponent(new URL(image.src,location.href).pathname.split('/').pop()).replace(/\.jpe?g$/i,'');
  const update=()=>{original.disabled=busy||!available.has(number());free.disabled=busy;};
  new MutationObserver(update).observe(image,{attributes:true,attributeFilter:['src']});
  fetch(api+'/catalog',{signal:AbortSignal.timeout(10000)}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>{available=new Set(d.photos);update()}).catch(()=>{status.textContent='Original downloads are temporarily offline. Free downloads are available.'});
  function save(blob,name){const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),60000)}
  free.addEventListener('click',async()=>{
    busy=true;update();status.textContent='Preparing your download…';
    const src=image.src,id=number();
    try{const r=await fetch(src);if(!r.ok)throw Error();const bitmap=await createImageBitmap(await r.blob());
      const landscape=bitmap.width>=bitmap.height;
      const scale=Math.min(1,(landscape?1920:1080)/bitmap.width,(landscape?1080:1920)/bitmap.height);
      const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
      canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.92));if(!blob)throw Error();
      save(blob,album+'-'+id+'-1080p.jpg');status.textContent='Your free download is ready.';
    }catch{status.textContent='Download failed. Please try again.'}finally{busy=false;update()}
  });
  const dialog=document.createElement('dialog');dialog.className='original-unlock';
  const form=document.createElement('form');form.innerHTML='<h2>Download originals</h2><p>Enter the album password from Yevin.</p><label>Album password<input type="password" autocomplete="current-password" required maxlength="256"></label><p role="status"></p><div><button type="button">Cancel</button><button type="submit">Unlock album</button></div>';
  dialog.append(form);document.body.append(dialog);dialog.addEventListener('keydown',e=>e.stopPropagation());
  const input=form.querySelector('input'),message=form.querySelector('[role=status]'),submit=form.querySelector('[type=submit]');
  form.querySelector('[type=button]').onclick=()=>dialog.close();
  form.onsubmit=async e=>{e.preventDefault();submit.disabled=true;message.textContent='Checking…';try{
    const r=await fetch(api+'/unlock',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:input.value})});const d=await r.json();if(!r.ok)throw Error(d.error||'Unable to unlock');
    token=d.token;input.value='';original.textContent='Download original';status.textContent='Originals unlocked for this album for one hour.';dialog.close();
  }catch(e){message.textContent=e.message}finally{submit.disabled=false}};
  original.onclick=async()=>{
    if(!token){message.textContent='';dialog.showModal();input.focus();return}
    const id=number();busy=true;update();status.textContent='Downloading original. This may take a moment…';
    try{const r=await fetch(api+'/download/'+encodeURIComponent(id),{headers:{Authorization:'Bearer '+token}});
      if(r.status===401){token='';original.textContent='Unlock original';throw Error('Access expired. Unlock the album again.')}
      if(!r.ok)throw Error('Original download unavailable. Please try again later.');save(await r.blob(),album+'-'+id+'-original.jpg');status.textContent='Original downloaded.';
    }catch(e){status.textContent=e.message}finally{busy=false;update()}
  };
})();

