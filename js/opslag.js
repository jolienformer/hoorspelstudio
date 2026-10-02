/* Opslag in de browser (IndexedDB), met geheugen als reserve.
   Alles blijft op dit apparaat. */
(() => {
const mem = {kv: new Map(), audio: new Map()};
let db = null;

function open(){
  return new Promise(res => {
    try{
      const r = indexedDB.open(window.HS_OPSLAG || 'hoorspelstudio-v2', 1);
      r.onupgradeneeded = () => { r.result.createObjectStore('kv'); r.result.createObjectStore('audio'); };
      r.onsuccess = () => res(r.result);
      r.onerror = () => res(null);
      r.onblocked = () => res(null);
    }catch(e){ res(null); }
  });
}
function tx(store, mode, fn){
  return new Promise((res, rej) => {
    try{
      const t = db.transaction(store, mode);
      const req = fn(t.objectStore(store));
      t.oncomplete = () => res(req ? req.result : undefined);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error);
    }catch(e){ rej(e); }
  });
}
async function get(store, k){
  if(mem[store].has(k)) return mem[store].get(k);
  if(!db) return undefined;
  try{ return await tx(store, 'readonly', s => s.get(k)); }catch(e){ return undefined; }
}
async function set(store, k, v){
  mem[store].set(k, v);
  if(!db) return false;
  try{ await tx(store, 'readwrite', s => s.put(v, k)); return true; }catch(e){ return false; }
}
async function del(store, k){
  mem[store].delete(k);
  if(!db) return;
  try{ await tx(store, 'readwrite', s => s.delete(k)); }catch(e){}
}
async function clear(){
  mem.kv.clear(); mem.audio.clear();
  if(!db) return;
  try{ await tx('kv', 'readwrite', s => s.clear()); await tx('audio', 'readwrite', s => s.clear()); }catch(e){}
}

window.Opslag = {
  async start(){ db = await open(); return !!db; },
  leesStaat: () => get('kv', 'staat'),
  bewaarStaat: s => set('kv', 'staat', JSON.parse(JSON.stringify(s))),
  leesAudio: id => get('audio', id),
  bewaarAudio: (id, blob) => set('audio', id, blob),
  wisAudio: id => del('audio', id),
  wisAlles: clear
};
})();
