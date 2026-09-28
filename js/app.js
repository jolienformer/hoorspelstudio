/* Hoorspelstudio: de schermen en de flow. */
(() => {
const $ = s => document.querySelector(s);
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const STAPPEN = ['muziek', 'geluiden', 'opnemen'];
const KLEUREN = ['geel', 'blauw', 'roze', 'groen', 'oranje', 'paars', 'rood', 'bruin'];
const MAX_GELUIDEN = 12, MAX_GELUID_SEC = 15, MAX_OPNAME_SEC = 300, PX = 14;
const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
const fmtKort = s => s < 60 ? Math.max(1, Math.round(s)) + ' sec' : fmt(s);
const esc = t => String(t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let S = {groep:'', stap:'muziek', soort:'gevoel', groepId:'spannend', muziek:null, sfeer:null, geluiden:[], opname:null};
const bewaar = () => Opslag.bewaarStaat(S);

/* ---------- meldingen ---------- */
let toastT = 0;
function toast(m, ms = 3800){ const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, ms); }
function melding(el, m, fout){ el.textContent = m || ''; el.classList.toggle('fout', !!fout); }
function micFout(e){
  if(e.message === 'geweigerd') return 'De microfoon mag niet gebruikt worden. Vraag de leerkracht om de microfoon toe te staan (zie "Voor de leerkracht" onderaan).';
  if(e.message === 'geen-mic') return 'Er is geen microfoon gevonden op dit apparaat.';
  return 'De microfoon start niet. Probeer het nog een keer, of laad de pagina opnieuw.';
}

/* ---------- afspelen (één ding tegelijk) ---------- */
let speelt = null;   // {wat, id}
function stopAlles(){ Geluid.stop(); speelt = null; stopKop(); renderSpeelknoppen(); }

/* ================= navigatie ================= */
function mag(){
  if(gRec || oRec) { toast('Stop eerst de opname.'); return false; }
  if(pending){
    const n = $('#g-naam').value.trim();
    if(n){ bewaarGeluid(); return true; }
    toast('Geef je nieuwe geluid eerst een naam, of tik op Opnieuw.'); $('#g-naam').focus(); return false;
  }
  return true;
}
function ga(stap){
  if(stap !== S.stap && !mag()) return;
  stopAlles();
  S.stap = stap; bewaar();
  STAPPEN.forEach(n => $('#s-' + n).hidden = n !== stap);
  render();
  window.scrollTo(0, 0);
}
document.querySelectorAll('.stap').forEach(b => b.onclick = () => ga(b.dataset.stap));
$('#terug').onclick = () => { const i = STAPPEN.indexOf(S.stap); if(i > 0) ga(STAPPEN[i - 1]); };
$('#verder').onclick = () => { const i = STAPPEN.indexOf(S.stap); if(i < STAPPEN.length - 1) ga(STAPPEN[i + 1]); };

function render(){
  const klaar = {muziek: !!(S.muziek || S.sfeer), geluiden: S.geluiden.length > 0, opnemen: !!S.opname};
  document.querySelectorAll('.stap').forEach(b => {
    b.classList.toggle('klaar', klaar[b.dataset.stap]);
    if(b.dataset.stap === S.stap) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
  });
  const i = STAPPEN.indexOf(S.stap);
  $('#terug').hidden = i === 0;
  $('#verder').hidden = i === STAPPEN.length - 1;
  $('#verder').textContent = i === 0 ? 'Naar geluiden →' : 'Naar opnemen →';
  $('#groep-naam').textContent = S.groep || 'Ons groepje';
  if(S.stap === 'muziek') renderMuziek();
  if(S.stap === 'geluiden') renderGeluiden();
  if(S.stap === 'opnemen') renderOpnemen();
}

/* ================= 01 muziek ================= */
const lijstVan = soort => soort === 'gevoel' ? Bibliotheek.GEVOEL : Bibliotheek.PLEK;
const groepVan = stuk => [...Bibliotheek.GEVOEL, ...Bibliotheek.PLEK].find(g => g.id === stuk.groep);
const gezichtHtml = g => '<span class="gezicht" style="--c:var(--c-' + g.kleur + ')">' + Gezichten.html(g.id, g.uitdr) + '</span>';
/* gezichtje van een stukje muziek; valt terug op dat van zijn gevoel of plek */
const stukGezicht = s => { const g = groepVan(s); return '<span class="gezicht" style="--c:var(--c-' + g.kleur + ')">' + Gezichten.html((window.GEZICHTEN || {})[s.id] ? s.id : g.id, g.uitdr) + '</span>'; };

function renderMuziek(){ renderKeuze(); renderSoort(); renderGroepen(); renderStukken(); }

function renderKeuze(){
  const zet = (el, id, hint) => {
    const s = id && Bibliotheek.zoek(id);
    el.innerHTML = s ? '<span class="mini">' + stukGezicht(s) + '<b>' + esc(s.titel) + '</b></span>' : '<span class="leeg">' + hint + '</span>';
  };
  zet($('#keuze-m'), S.muziek, 'nog niet gekozen, kies bij Gevoel');
  zet($('#keuze-s'), S.sfeer, 'nog niet gekozen, kies bij Plek');
  $('#weg-m').hidden = !S.muziek; $('#weg-s').hidden = !S.sfeer;
  $('#samen').hidden = !S.muziek && !S.sfeer;
  renderSpeelknoppen();
}
$('#weg-m').onclick = () => { if(speelt) stopAlles(); S.muziek = null; bewaar(); render(); };
$('#weg-s').onclick = () => { if(speelt) stopAlles(); S.sfeer = null; bewaar(); render(); };

function renderSoort(){
  document.querySelectorAll('.soort').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.soort === S.soort)));
}
document.querySelectorAll('.soort').forEach(b => b.onclick = () => {
  if(S.soort === b.dataset.soort) return;
  S.soort = b.dataset.soort;
  const gekozen = Bibliotheek.zoek(S.soort === 'gevoel' ? S.muziek : S.sfeer);
  S.groepId = gekozen ? gekozen.groep : lijstVan(S.soort)[0].id;
  bewaar(); renderMuziek();
});

function renderGroepen(){
  const el = $('#groepen'); el.innerHTML = '';
  const gekozen = Bibliotheek.zoek(S.soort === 'gevoel' ? S.muziek : S.sfeer);
  lijstVan(S.soort).forEach(g => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'gtegel' + (gekozen && gekozen.groep === g.id ? ' heeft' : '');
    b.setAttribute('aria-pressed', String(g.id === S.groepId));
    b.innerHTML = gezichtHtml(g) + '<span class="naam">' + esc(g.naam) + '</span>';
    b.onclick = () => {
      S.groepId = g.id; bewaar(); renderGroepen(); renderStukken();
      const kop = $('#stukken-kop'); const r = kop.getBoundingClientRect();
      if(r.top > window.innerHeight - 220) kop.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start'});
    };
    el.append(b);
  });
}

function renderStukken(){
  const g = lijstVan(S.soort).find(x => x.id === S.groepId) || lijstVan(S.soort)[0];
  $('#stukken-kop').innerHTML = gezichtHtml(g) + '<h2>' + esc(g.naam) + '</h2>';
  const el = $('#stukken'); el.innerHTML = '';
  const slot = S.soort === 'gevoel' ? 'muziek' : 'sfeer';
  g.stukken.forEach(s => {
    const rij = document.createElement('div'); rij.className = 'stuk' + (S[slot] === s.id ? ' gekozen' : '');
    rij.innerHTML = '<button type="button" class="speel" data-speel="' + s.id + '">' + stukGezicht(s) + '<span class="badge" aria-hidden="true"></span></button>' +
      '<div><div class="t">' + esc(s.titel) + '</div><div class="d">' + (S.soort === 'gevoel' ? 'muziek' : 'sfeergeluid') + ' · herhaalt</div></div>' +
      '<button type="button" class="kies">' + (S[slot] === s.id ? '✓ Gekozen' : 'Deze kiezen') + '</button>';
    rij.querySelector('.speel').onclick = () => speelStuk(s.id);
    rij.querySelector('.kies').onclick = () => kies(s, slot);
    el.append(rij);
  });
  renderSpeelknoppen();
}
function renderSpeelknoppen(){
  document.querySelectorAll('[data-speel]').forEach(b => {
    const aan = speelt && speelt.wat === 'stuk' && speelt.id === b.dataset.speel;
    const laadt = speelt && speelt.wat === 'laden' && speelt.id === b.dataset.speel;
    b.setAttribute('aria-pressed', String(!!aan));
    b.querySelector('.badge').textContent = laadt ? '…' : aan ? '■' : '▶';
    const s = Bibliotheek.zoek(b.dataset.speel);
    b.setAttribute('aria-label', (aan ? 'Stop ' : 'Luister naar ') + (s ? s.titel : ''));
  });
  const samen = $('#samen');
  const aan = speelt && speelt.wat === 'samen';
  samen.setAttribute('aria-pressed', String(!!aan));
  samen.textContent = aan ? '■ Stoppen' : (S.muziek && S.sfeer ? '▶ Samen luisteren' : '▶ Luisteren');
}
async function speelStuk(id){
  if(speelt && speelt.id === id){ stopAlles(); return; }
  Geluid.stop(); speelt = {wat:'laden', id}; renderSpeelknoppen();
  try{
    const buf = await Bibliotheek.laad(id);
    if(!speelt || speelt.id !== id) return;
    Geluid.speel([{buf, vol:0.85, loop:true}]);
    speelt = {wat:'stuk', id};
  }catch(e){ speelt = null; toast('Dit geluid kan nu niet spelen. Probeer een ander.'); }
  renderSpeelknoppen();
}
$('#samen').onclick = async () => {
  if(speelt && speelt.wat === 'samen'){ stopAlles(); return; }
  Geluid.stop(); speelt = {wat:'samen', id:'samen'}; renderSpeelknoppen();
  try{
    const lagen = [];
    if(S.muziek) lagen.push({buf: await Bibliotheek.laad(S.muziek), vol:0.6, loop:true});
    if(S.sfeer) lagen.push({buf: await Bibliotheek.laad(S.sfeer), vol:0.5, loop:true});
    if(!speelt || speelt.wat !== 'samen') return;
    Geluid.speel(lagen);
  }catch(e){ speelt = null; renderSpeelknoppen(); toast('Dit geluid kan nu niet spelen.'); }
};
function kies(s, slot){
  const was = S[slot];
  S[slot] = was === s.id ? null : s.id; bewaar();
  if(speelt && speelt.wat === 'samen') stopAlles();
  render();
  if(!S[slot]) return;
  if(slot === 'muziek' && !S.sfeer) toast('Muziek gekozen! Wil je er een sfeergeluid bij? Tik op Plek. Klaar? Tik op Naar geluiden.', 5200);
  else if(slot === 'sfeer' && !S.muziek) toast('Sfeergeluid gekozen! Wil je er muziek bij? Tik op Gevoel. Klaar? Tik op Naar geluiden.', 5200);
  else toast('Gekozen! Tik op Samen luisteren, of ga naar geluiden.');
}

/* ================= 02 geluiden ================= */
const buffers = new Map();   // id -> AudioBuffer
async function geluidBuffer(id){
  if(buffers.has(id)) return buffers.get(id);
  const blob = await Opslag.leesAudio(id); if(!blob) throw new Error('weg');
  const b = await Geluid.blobNaarBuffer(blob); buffers.set(id, b); return b;
}
let gRec = null, pending = null;

function renderGeluiden(){
  const el = $('#g-lijst'); el.innerHTML = '';
  if(!S.geluiden.length){ el.innerHTML = '<div class="leeg-vak">Nog geen geluiden. Neem er hierboven een op.</div>'; return; }
  S.geluiden.forEach(g => {
    const wrap = document.createElement('div'); wrap.className = 'tegel-wrap';
    const t = tegel(g); t.onclick = () => speelGeluid(g, t);
    const x = document.createElement('button'); x.type = 'button'; x.className = 'weg'; x.textContent = '✕';
    x.setAttribute('aria-label', g.naam + ' weggooien');
    let zeker = 0;
    x.onclick = () => {
      if(!zeker){ x.classList.add('zeker'); x.textContent = 'Weg?'; zeker = setTimeout(() => { zeker = 0; x.classList.remove('zeker'); x.textContent = '✕'; }, 3000); return; }
      clearTimeout(zeker);
      S.geluiden = S.geluiden.filter(y => y.id !== g.id); Opslag.wisAudio(g.id); buffers.delete(g.id); mixCache = null;
      bewaar(); render(); toast('"' + g.naam + '" is weggegooid.');
    };
    wrap.append(t, x); el.append(wrap);
  });
}
function tegel(g, toets){
  const b = document.createElement('button'); b.type = 'button'; b.className = 'tegel';
  b.style.setProperty('--c', 'var(--c-' + g.kleur + ')');
  b.innerHTML = '<span class="gezicht">' + Gezichten.htmlGeluid(g.gez) + '</span><span><span class="naam">' + esc(g.naam) + '</span><span class="meta">' + fmtKort(g.duur) + '</span></span>' +
    (toets ? '<span class="toets" aria-hidden="true">' + toets + '</span>' : '');
  return b;
}
function flits(el){ el.classList.add('tik'); setTimeout(() => el.classList.remove('tik'), 150); }
async function speelGeluid(g, el){
  if(el) flits(el);
  try{ const buf = await geluidBuffer(g.id); Geluid.speel([{buf}], () => { speelt = null; }); speelt = {wat:'geluid', id:g.id}; }
  catch(e){ toast('Dit geluid is niet meer op dit apparaat. Neem het opnieuw op.'); }
}

function zetOpneemknop(knop, tekst, aan, label){
  knop.classList.toggle('aan', aan); knop.querySelector('.tekst').innerHTML = tekst;
  knop.style.setProperty('--niveau', 0);
  if(label) knop.setAttribute('aria-label', label);
}
async function startGeluid(){
  stopAlles(); pending = null; $('#g-naamvak').hidden = true;
  const knop = $('#g-knop'); knop.hidden = false; melding($('#g-melding'), '');
  knop.disabled = true;
  let rec;
  try{ rec = await Geluid.maakRecorder('geluid', {niveau: p => knop.style.setProperty('--niveau', Math.min(1, p * 1.6))}); }
  catch(e){ knop.disabled = false; melding($('#g-melding'), micFout(e), true); return; }
  knop.disabled = false;
  rec.begin();
  const t0 = Date.now();
  gRec = {rec, timer: setInterval(() => {
    const s = (Date.now() - t0) / 1000; $('#g-klok').textContent = '● ' + fmt(s);
    if(s >= MAX_GELUID_SEC) stopGeluid();
  }, 200)};
  $('#g-klok').textContent = '● 0:00';
  zetOpneemknop(knop, 'Stop', true, 'Stop opname');
  melding($('#g-melding'), 'Maak nu je geluid! Tik op Stop als je klaar bent.');
}
async function stopGeluid(){
  if(!gRec) return;
  const {rec, timer} = gRec; gRec = null; clearInterval(timer);
  const knop = $('#g-knop'); zetOpneemknop(knop, 'Opnemen', false, 'Opnemen');
  const {samples, rate} = await rec.eind();
  const kort = Geluid.knipStilte(samples, rate);
  $('#g-klok').textContent = '';
  if(!kort){ melding($('#g-melding'), 'We hoorden niets. Kom dichter bij het apparaat en probeer het nog een keer.', true); return; }
  pending = {samples: kort, rate, buf: Geluid.samplesNaarBuffer(kort, rate)};
  knop.hidden = true;
  melding($('#g-melding'), 'Gelukt! Het geluid duurt ' + fmtKort(kort.length / rate) + '.');
  $('#g-naamvak').hidden = false; $('#g-naam').value = '';
  $('#g-naam').focus();
  Geluid.speel([{buf: pending.buf}]);
}
$('#g-knop').onclick = () => {
  if(gRec) return stopGeluid();
  if(S.geluiden.length >= MAX_GELUIDEN) return toast('Jullie hebben al ' + MAX_GELUIDEN + ' geluiden. Gooi er eerst een weg met ✕.');
  startGeluid();
};
$('#g-luister').onclick = () => { if(pending) Geluid.speel([{buf: pending.buf}]); };
$('#g-opnieuw').onclick = () => { pending = null; $('#g-naamvak').hidden = true; startGeluid(); };
$('#g-bewaar').onclick = () => bewaarGeluid();
$('#g-naam').addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); bewaarGeluid(); } });
async function bewaarGeluid(){
  if(!pending) return;
  const naam = $('#g-naam').value.trim();
  if(!naam){ melding($('#g-melding'), 'Typ eerst een naam voor je geluid.', true); $('#g-naam').focus(); return; }
  const p = pending; pending = null;
  const id = uid('g_');
  const kleur = KLEUREN.find(k => !S.geluiden.some(g => g.kleur === k)) || KLEUREN[S.geluiden.length % KLEUREN.length];
  const nummer = (S.teller = (S.teller || 0) + 1);
  const g = {id, naam, kleur, gez: Gezichten.voorGeluid(nummer), duur: p.samples.length / p.rate};
  buffers.set(id, p.buf);
  const ok = await Opslag.bewaarAudio(id, Geluid.wav([p.samples], p.rate));
  S.geluiden.push(g); bewaar();
  $('#g-naamvak').hidden = true; $('#g-knop').hidden = false; melding($('#g-melding'), '');
  render();
  toast(ok ? '"' + naam + '" staat bij jullie geluiden. Maak er nog een, of ga naar opnemen.' : '"' + naam + '" werkt zolang deze pagina open blijft. Bewaren op dit apparaat lukte niet.', 5000);
}

/* ================= 03 opnemen ================= */
let oRec = null, stemBuf = null, mixCache = null;

function renderOpnemen(){
  const m = S.muziek && Bibliotheek.zoek(S.muziek), s = S.sfeer && Bibliotheek.zoek(S.sfeer);
  $('#o-gekozen').innerHTML =
    '<div><span class="k">muziek</span>' + (m ? '<span class="mini">' + stukGezicht(m) + '<b>' + esc(m.titel) + '</b></span>' : '<b>geen</b>') + '</div>' +
    '<div><span class="k">sfeergeluid</span>' + (s ? '<span class="mini">' + stukGezicht(s) + '<b>' + esc(s.titel) + '</b></span>' : '<b>geen</b>') + '</div>' +
    '<span class="wijzig">Wijzigen bij stap 01 ›</span>';

  const heeft = !!S.opname;
  $('#o-knop').hidden = heeft && !oRec;
  $('#o-stil').hidden = heeft;
  $('#o-daarna').hidden = !heeft || !!oRec;
  $('#tijdlijn').hidden = !heeft && !oRec;
  if(heeft && !oRec) tekenTijdlijn();
  if(!heeft && !oRec) $('#o-klok').textContent = '';
  if(heeft && !oRec) $('#o-klok').textContent = 'Jullie hoorspel duurt ' + fmt(S.opname.duur);

  $('#o-geluiden-kop').textContent = oRec ? 'Tik op het goede moment' : heeft ? 'Geluiden' : 'Oefen met de geluiden';
  const el = $('#o-lijst'); el.innerHTML = '';
  if(!S.geluiden.length){ el.innerHTML = '<div class="leeg-vak">Nog geen geluiden. Die maak je bij stap 02. Zonder geluiden kun je ook opnemen.</div>'; return; }
  S.geluiden.forEach((g, i) => {
    const t = tegel(g, i < 9 ? String(i + 1) : '');
    t.onclick = () => tikGeluid(g, t);
    el.append(t);
  });
}
$('#o-gekozen').onclick = () => ga('muziek');

function tikGeluid(g, el){
  if(oRec){
    flits(el);
    const c = Geluid.context();
    const t = oRec.rec.startTijd != null ? c.currentTime - oRec.rec.startTijd : (Date.now() - oRec.t0) / 1000;
    oRec.tikken.push({g: g.id, t: Math.max(0, t)});
    zetMarker(g, t);
    return;
  }
  speelGeluid(g, el);
}

/* ---- tijdlijn ---- */
function tijdlijnBreedte(duur){ return Math.max($('#tijdlijn').clientWidth - 24, Math.ceil(duur * PX) + 20); }
function zetMarker(g, t){
  const m = document.createElement('div'); m.className = 'mk';
  m.style.setProperty('--c', 'var(--c-' + g.kleur + ')'); m.style.left = (t * PX) + 'px';
  if(t * PX < 60) m.classList.add('begin');
  m.innerHTML = '<span></span>'; m.querySelector('span').textContent = g.naam;
  $('#golf').append(m);
}
function zetStreep(t, p){
  const i = document.createElement('i');
  i.style.left = (t * PX) + 'px'; i.style.height = Math.max(3, Math.min(52, p * 90)) + 'px';
  $('#golf').append(i);
}
function tekenTijdlijn(){
  const o = S.opname, golf = $('#golf');
  golf.innerHTML = ''; golf.style.width = tijdlijnBreedte(o.duur) + 'px';
  (o.pieken || []).forEach((p, i) => zetStreep(i / 4, p));
  const bed = cls => { const d = document.createElement('div'); d.className = 'bed' + cls; d.style.width = (o.duur * PX) + 'px'; golf.append(d); };
  if(S.muziek) bed(''); if(S.sfeer) bed(' sfeer');
  o.tikken.forEach(k => { const g = S.geluiden.find(x => x.id === k.g); if(g) zetMarker(g, k.t); });
}

/* ---- opnemen ---- */
let wakeLock = null;
async function houdWakker(aan){
  try{
    if(aan && 'wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    else if(!aan && wakeLock){ await wakeLock.release(); wakeLock = null; }
  }catch(e){}
}
function aftellen(){
  return new Promise(res => {
    const box = $('#aftellen'), getal = $('#aftel-getal'); box.hidden = false;
    let n = 3;
    const toon = () => { getal.textContent = n; getal.style.animation = 'none'; void getal.offsetWidth; getal.style.animation = ''; };
    toon();
    const iv = setInterval(() => { n--; if(n === 0){ clearInterval(iv); box.hidden = true; res(); } else toon(); }, 900);
  });
}
async function startOpname(){
  stopAlles(); melding($('#o-melding'), '');
  const knop = $('#o-knop'); knop.disabled = true;
  let rec;
  try{ rec = await Geluid.maakRecorder('stem', {niveau: p => { knop.style.setProperty('--niveau', Math.min(1, p * 1.6)); if(oRec && oRec.bezig) oRec.pieken.push(p); }}); }
  catch(e){ knop.disabled = false; melding($('#o-melding'), micFout(e), true); return; }
  await aftellen();
  knop.disabled = false;
  rec.begin();
  const t0 = Date.now();
  oRec = {rec, t0, tikken:[], pieken:[], bezig:true, timer:0};
  const golf = $('#golf'); golf.innerHTML = '';
  $('#tijdlijn').hidden = false; golf.style.width = tijdlijnBreedte(0) + 'px';
  let getekend = 0;
  oRec.timer = setInterval(() => {
    const s = (Date.now() - t0) / 1000;
    $('#o-klok').textContent = '● ' + fmt(s);
    /* live golfje: elke 0,25 s een streepje */
    while(getekend < s * 4){
      const p = oRec.pieken.length ? Math.max(...oRec.pieken.splice(0)) : 0.02;
      zetStreep(getekend / 4, p); getekend++;
    }
    golf.style.width = tijdlijnBreedte(s) + 'px';
    const tl = $('#tijdlijn'); tl.scrollLeft = tl.scrollWidth;
    if(s >= MAX_OPNAME_SEC){ toast('De opname is 5 minuten. Langer kan niet.'); stopOpname(); }
  }, 250);
  zetOpneemknop(knop, 'Stop', true, 'Stop opname');
  houdWakker(true);
  document.body.classList.add('neemt-op');
  render();
  window.scrollTo(0, 0);
}
async function stopOpname(){
  if(!oRec) return;
  const r = oRec; r.bezig = false; clearInterval(r.timer);
  const knop = $('#o-knop'); zetOpneemknop(knop, 'Start<br>opname', false, 'Start opname');
  const {samples, rate} = await r.rec.eind();
  oRec = null; houdWakker(false);
  document.body.classList.remove('neemt-op');
  if(!samples.length || Geluid.isStil(samples)){
    render(); $('#tijdlijn').hidden = true;
    melding($('#o-melding'), 'We hoorden niets. Kijk of de microfoon aan staat en probeer het nog een keer.', true);
    return;
  }
  /* 4 streepjes per seconde voor de tijdlijn */
  const stap = Math.round(rate / 4), pieken = [];
  for(let i = 0; i < samples.length; i += stap){ let p = 0; for(let j = i; j < Math.min(samples.length, i + stap); j += 4){ const v = Math.abs(samples[j]); if(v > p) p = v; } pieken.push(+p.toFixed(3)); }
  const id = uid('o_');
  stemBuf = Geluid.samplesNaarBuffer(samples, rate); mixCache = null;
  const oud = S.opname && S.opname.id;
  S.opname = {id, duur: samples.length / rate, tikken: r.tikken, pieken};
  const ok = await Opslag.bewaarAudio(id, Geluid.wav([samples], rate));
  if(oud) Opslag.wisAudio(oud);
  bewaar(); render();
  $('#tijdlijn').scrollLeft = 0;
  $('#o-daarna').scrollIntoView({block:'center'});
  toast(ok ? 'Opgenomen! Tik op Luisteren om alles samen te horen.' : 'Opgenomen! Let op: bewaren op dit apparaat lukte niet. Bewaar het als mp3.', 4500);
}
$('#o-knop').onclick = () => oRec ? stopOpname() : startOpname();

/* ---- mixen, luisteren, bewaren ---- */
async function maakMix(){
  const o = S.opname;
  const sleutel = [o.id, S.muziek, S.sfeer, S.geluiden.map(g => g.id).join()].join('|');
  if(mixCache && mixCache.sleutel === sleutel) return mixCache.buf;
  if(!stemBuf){ const blob = await Opslag.leesAudio(o.id); if(!blob) throw new Error('weg'); stemBuf = await Geluid.blobNaarBuffer(blob); }
  const tikken = [];
  for(const k of o.tikken){ const g = S.geluiden.find(x => x.id === k.g); if(!g) continue; try{ tikken.push({buf: await geluidBuffer(g.id), t: k.t}); }catch(e){} }
  const buf = await Geluid.mix({
    stem: stemBuf,
    muziek: S.muziek ? await Bibliotheek.laad(S.muziek) : null,
    sfeer: S.sfeer ? await Bibliotheek.laad(S.sfeer) : null,
    tikken
  });
  mixCache = {sleutel, buf};
  return buf;
}
let kopRaf = 0;
function stopKop(){ cancelAnimationFrame(kopRaf); kopRaf = 0; const k = document.querySelector('#golf .kop'); if(k) k.remove(); $('#o-luister').textContent = '▶ Luisteren'; }
$('#o-luister').onclick = async () => {
  if(speelt && speelt.wat === 'mix'){ stopAlles(); return; }
  stopAlles();
  const knop = $('#o-luister'); knop.textContent = 'Even mixen…'; knop.disabled = true;
  let buf;
  try{ buf = await maakMix(); }
  catch(e){ knop.disabled = false; knop.textContent = '▶ Luisteren'; toast('De opname staat niet meer op dit apparaat. Neem opnieuw op.'); return; }
  knop.disabled = false; knop.textContent = '■ Stoppen';
  const start = Geluid.speel([{buf}], () => { speelt = null; stopKop(); });
  speelt = {wat:'mix', id:'mix'};
  const kop = document.createElement('div'); kop.className = 'kop'; $('#golf').append(kop);
  const c = Geluid.context(), tl = $('#tijdlijn');
  const loop = () => {
    const t = c.currentTime - start; const x = Math.max(0, t) * PX; kop.style.left = x + 'px';
    if(x > tl.scrollLeft + tl.clientWidth - 60 || x < tl.scrollLeft) tl.scrollLeft = x - 60;
    kopRaf = requestAnimationFrame(loop);
  };
  loop();
};
let opnieuwZeker = 0;
$('#o-opnieuw').onclick = () => {
  const b = $('#o-opnieuw');
  if(!opnieuwZeker){ b.textContent = 'Zeker? Tik nog een keer'; b.classList.add('gevaar'); opnieuwZeker = setTimeout(() => { opnieuwZeker = 0; b.textContent = 'Opnieuw'; b.classList.remove('gevaar'); }, 3500); return; }
  clearTimeout(opnieuwZeker); opnieuwZeker = 0; b.textContent = 'Opnieuw'; b.classList.remove('gevaar');
  stopAlles();
  if(S.opname) Opslag.wisAudio(S.opname.id);
  S.opname = null; stemBuf = null; mixCache = null; bewaar();
  $('#golf').innerHTML = ''; render();
  toast('Tik op Start opname als jullie klaar zijn.');
};
$('#o-bewaar').onclick = async () => {
  const knop = $('#o-bewaar'); knop.disabled = true; knop.textContent = 'Bezig…';
  const naam = 'Hoorspel ' + (S.groep || 'groepje').replace(/[\\/:*?"<>|]+/g, '').trim();
  try{
    const buf = await maakMix();
    let blob, ext = 'mp3';
    try{ blob = await Geluid.naarMp3(buf); }
    catch(e){ blob = Geluid.bufferNaarWav(buf); ext = 'wav'; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = naam + '.' + ext;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    toast(ext === 'mp3' ? 'Bewaard! Je vindt "' + naam + '.mp3" in de map Downloads.' : 'Bewaard als "' + naam + '.wav" in Downloads. (mp3 lukte niet zonder internet.)', 6000);
  }catch(e){ toast('Bewaren lukte niet. Probeer het nog een keer.'); }
  knop.disabled = false; knop.textContent = 'Bewaren als mp3';
};

/* toetsen 1 tot 9 bij opnemen */
document.addEventListener('keydown', e => {
  if(S.stap !== 'opnemen' || e.metaKey || e.ctrlKey || e.altKey) return;
  if(document.querySelector('dialog[open]') || /input|textarea/i.test(e.target.tagName)) return;
  if(/^[1-9]$/.test(e.key)){
    const i = +e.key - 1, g = S.geluiden[i]; if(!g) return;
    e.preventDefault(); tikGeluid(g, $('#o-lijst').children[i]);
  }
});

/* ================= groep, welkom, leerkracht ================= */
function welkom(){
  const d = $('#welkom');
  $('#w-gezichten').innerHTML = ['vrolijk', 'eng', 'magisch', 'stoer', 'dromerig'].map(id => gezichtHtml(Bibliotheek.GEVOEL.find(g => g.id === id))).join('');
  d.addEventListener('cancel', e => e.preventDefault());
  d.showModal();
}
$('#w-naam').addEventListener('input', () => melding($('#w-melding'), ''));
$('#g-naam').addEventListener('input', () => { if($('#g-melding').classList.contains('fout')) melding($('#g-melding'), ''); });
$('#w-form').addEventListener('submit', e => {
  const n = $('#w-naam').value.trim();
  if(!n){ e.preventDefault(); melding($('#w-melding'), 'Typ eerst de naam van jullie groepje.', true); $('#w-naam').focus(); return; }
  Geluid.context();
  S.groep = n; bewaar(); render();
});
$('#groep-knop').onclick = () => { $('#gd-naam').value = S.groep; $('#groep-dlg').showModal(); $('#gd-naam').select(); };
$('#gd-annuleer').onclick = () => $('#groep-dlg').close();
$('#gd-form').addEventListener('submit', () => { const n = $('#gd-naam').value.trim(); if(n){ S.groep = n; bewaar(); render(); } });

$('#leerkracht-knop').onclick = () => $('#leerkracht').showModal();
$('#lk-sluit').onclick = () => $('#leerkracht').close();
let wisZeker = 0;
$('#wis-alles').onclick = async () => {
  const b = $('#wis-alles');
  if(!wisZeker){ b.textContent = 'Zeker weten? Tik nog een keer'; wisZeker = setTimeout(() => { wisZeker = 0; b.textContent = 'Alles wissen'; }, 4000); return; }
  clearTimeout(wisZeker);
  stopAlles(); await Opslag.wisAlles(); location.reload();
};

/* geluid mag pas na een tik starten (iPad) */
document.addEventListener('pointerdown', () => Geluid.context(), {once:true, capture:true});
window.addEventListener('beforeunload', e => { if(gRec || oRec){ e.preventDefault(); e.returnValue = ''; } });

/* ================= start ================= */
(async function start(){
  const ok = await Opslag.start();
  const oud = await Opslag.leesStaat();
  if(oud && typeof oud === 'object') S = Object.assign(S, oud);
  if(!STAPPEN.includes(S.stap)) S.stap = 'muziek';
  STAPPEN.forEach(n => $('#s-' + n).hidden = n !== S.stap);
  render();
  if(!S.groep) welkom();
  if(!ok) toast('Bewaren lukt niet in deze browser. Wat jullie maken, verdwijnt als je de pagina sluit.', 6000);
})();
})();
