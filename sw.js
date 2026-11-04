const CACHE_PREFIX='ganjineh-ketab-';
const CACHE_VERSION='v1';
const APP_CACHE=CACHE_PREFIX+CACHE_VERSION;
const RUNTIME_CACHE=CACHE_PREFIX+'runtime-v1';
const CORE=['./','./index.html','./manifest.webmanifest'];

self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(APP_CACHE);
  await Promise.all(CORE.map(async url=>{try{await cache.add(url);}catch(e){console.warn('Precache skipped:',url,e);}}));
  await self.skipWaiting();
 })());
});

self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==APP_CACHE&&k!==RUNTIME_CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});

self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 // درخواست‌های API هرگز cache نمی‌شوند؛ داده‌ها در IndexedDB مدیریت می‌شوند.
 if(url.hostname==='script.googleusercontent.com'||url.hostname==='script.google.com')return;
 if(req.mode==='navigate'){
  event.respondWith((async()=>{
   try{const fresh=await fetch(req);const cache=await caches.open(APP_CACHE);cache.put('./index.html',fresh.clone());return fresh;}
   catch(e){return (await caches.match(req))||(await caches.match('./index.html'))||new Response('برای نخستین بار باید سایت را با اینترنت باز کنید.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}
  })());
  return;
 }
 event.respondWith((async()=>{
  const cache=await caches.open(RUNTIME_CACHE);
  const cached=await caches.match(req);
  try{
   const response=await fetch(req);
   if(response&&response.ok&&(response.type==='basic'||response.type==='cors'))cache.put(req,response.clone()).catch(()=>{});
   return response;
  }catch(e){if(cached)return cached;throw e;}
 })());
});
