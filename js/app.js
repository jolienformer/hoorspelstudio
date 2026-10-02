/* Hoorspelstudio: de schermen en de flow. */
(() => {
const $ = s => document.querySelector(s);
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const STAPPEN = ['muziek', 'geluiden', 'opnemen'];
const KLEUREN = ['geel', 'blauw', 'roze', 'groen', 'oranje', 'paars', 'rood', 'bruin'];
const MAX_GELUIDEN = 12, MAX_GELUID_SEC = 15, MAX_OPNAME_SEC = 300, PX = 36;
const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
const fmtKort = s => s < 60 ? Math.max(1, Math.round(s)) + ' sec' : fmt(s);
const esc = t => String(t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* strakke silhouet-icoontjes (geen tekens als ▶: die tekent iOS als emoji) */
const ICOON = {
  opnemen: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6"/></svg>',
  speel: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9.5-5.5z"/></svg>',
  pauze: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z"/></svg>',
  stop: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="3" width="10" height="10" rx="1.5"/></svg>',
  vink: '<svg viewBox="0 0 16 16" aria-hidden="true" class="lijn"><path d="M2.5 8.5l3.5 3.5 7.5-8"/></svg>'
};

let S = {groep:'', stap:'muziek', soort:'gevoel', muziek:null, sfeer:null, geluiden:[], opname:null, koptelefoon:false};
/* bij elke wijziging ook de bewaarknop bijwerken: zo klopt 'nog niet bewaard' altijd */
const bewaar = () => { Opslag.bewaarStaat(S); if(S.stap === 'opnemen') renderBewaarKnop(); };

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
  $('#verder').textContent = i === 0 ? 'Naar stap 2 →' : 'Naar stap 3 →';
  if(S.stap !== 'opnemen') $('#o-bewaar').hidden = true;
  $('#groep-naam').textContent = S.groep || 'Ons groepje';
  if(S.stap === 'muziek') renderMuziek();
  if(S.stap === 'geluiden') renderGeluiden();
  if(S.stap === 'opnemen') renderOpnemen();
  document.body.classList.toggle('breed', S.stap === 'opnemen');
}

/* ================= 01 muziek ================= */
const lijstVan = soort => soort === 'gevoel' ? Bibliotheek.GEVOEL : Bibliotheek.PLEK;
const groepVan = stuk => [...Bibliotheek.GEVOEL, ...Bibliotheek.PLEK].find(g => g.id === stuk.groep);
const slotVan = soort => soort === 'gevoel' ? 'muziek' : 'sfeer';
const gezichtHtml = g => '<span class="gezicht" style="--c:var(--c-' + g.kleur + ')">' + Gezichten.html(g.id, g.uitdr) + '</span>';
/* gezichtje van een stukje muziek; valt terug op dat van zijn gevoel of plek */
const stukGezicht = s => { const g = groepVan(s); return '<span class="gezicht" style="--c:var(--c-' + g.kleur + ')">' + Gezichten.html((window.GEZICHTEN || {})[s.id] ? s.id : g.id, g.uitdr) + '</span>'; };

function renderMuziek(){ renderVakken(); renderRaster(); }

function renderVakken(){
  [['gevoel', 'muziek', '#vak-m', '#weg-m'], ['plek', 'sfeer', '#vak-s', '#weg-s']].forEach(([soort, slot, vak, weg]) => {
    const s = S[slot] && Bibliotheek.zoek(S[slot]);
    $(vak).innerHTML = s
      ? '<button type="button" class="vak-play" data-speel="' + s.id + '" aria-label="' + esc(s.titel) + ' afspelen">' + stukGezicht(s) + '<span class="badge" aria-hidden="true"></span></button><b>' + esc(s.titel) + '</b>'
      : '<span class="leeg">nog leeg</span>';
    $(weg).hidden = !s;
    const el = document.querySelector('.vak[data-soort="' + soort + '"]');
    el.classList.toggle('open', S.soort === soort);
    el.classList.toggle('vol', !!s);
    el.querySelector('.vak-tab').setAttribute('aria-selected', String(S.soort === soort));
  });
  $('#samen').hidden = !(S.muziek && S.sfeer);
  renderSpeelknoppen();
}
document.querySelectorAll('.vak-tab').forEach(b => {
  b.addEventListener('click', e => {
    if(e.target.closest('.vak-play')) return;
    if(S.soort === b.dataset.soort) return;
    S.soort = b.dataset.soort; bewaar(); renderMuziek();
  });
  b.addEventListener('keydown', e => {
    if(e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if(S.soort === b.dataset.soort) return;
    S.soort = b.dataset.soort; bewaar(); renderMuziek();
  });
});
document.querySelector('.vakken').addEventListener('click', e => {
  const p = e.target.closest('.vak-play'); if(!p) return;
  e.stopPropagation();
  const id = p.dataset.speel;
  (speelt && speelt.id === id) ? stopAlles() : speelStuk(id);
});
$('#weg-m').onclick = () => { if(speelt) stopAlles(); S.muziek = null; bewaar(); render(); };
$('#weg-s').onclick = () => { if(speelt) stopAlles(); S.sfeer = null; bewaar(); render(); };

function renderRaster(){
  const el = $('#kiesraster'); el.innerHTML = '';
  lijstVan(S.soort).forEach(g => {
    const groep = document.createElement('div'); groep.className = 'rgroep';
    const kop = document.createElement('p'); kop.className = 'rkop'; kop.textContent = g.naam; groep.append(kop);
    const rij = document.createElement('div'); rij.className = 'rrij'; groep.append(rij); el.append(groep);
    g.stukken.forEach(s => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'rtegel'; b.dataset.speel = s.id;
      b.innerHTML = '<span class="rgezicht">' + stukGezicht(s) + '<span class="badge" aria-hidden="true"></span></span><span class="naam"></span>';
      b.querySelector('.naam').textContent = s.titel;
      b.onclick = () => { if(b.dataset.gesleept){ delete b.dataset.gesleept; return; } tikStuk(s); };
      sleepNaarVak(b, s);
      rij.append(b);
    });
  });
  renderSpeelknoppen();
}
function renderSpeelknoppen(){
  document.querySelectorAll('#kiesraster [data-speel]').forEach(b => {
    const s = Bibliotheek.zoek(b.dataset.speel);
    const aan = speelt && speelt.wat === 'stuk' && speelt.id === b.dataset.speel;
    const laadt = speelt && speelt.wat === 'laden' && speelt.id === b.dataset.speel;
    const gekozen = s && S[slotVan(s.soort)] === s.id;
    b.classList.toggle('speelt', !!aan); b.classList.toggle('gekozen', !!gekozen);
    const badge = b.querySelector('.badge'); if(badge) badge.innerHTML = laadt ? '…' : aan ? ICOON.stop : gekozen ? ICOON.vink : ICOON.speel;
    b.setAttribute('aria-pressed', String(!!gekozen));
    b.setAttribute('aria-label', (s ? s.titel : '') + (aan ? ', speelt. Tik om te stoppen.' : gekozen ? ', gekozen' : ', luisteren en kiezen'));
  });
  document.querySelectorAll('.vak-play').forEach(b => {
    const aan = speelt && (speelt.wat === 'stuk' || speelt.wat === 'samen') && (speelt.id === b.dataset.speel || speelt.wat === 'samen');
    const laadt = speelt && speelt.wat === 'laden' && speelt.id === b.dataset.speel;
    b.classList.toggle('speelt', !!aan);
    const badge = b.querySelector('.badge'); if(badge) badge.innerHTML = laadt ? '…' : aan ? ICOON.stop : ICOON.speel;
  });
  const samenAan = speelt && speelt.wat === 'samen';
  document.querySelectorAll('.vak').forEach(el => el.classList.toggle('samen-speelt', !!samenAan));
  const samen = $('#samen');
  samen.innerHTML = samenAan ? ICOON.stop + ' Stoppen' : ICOON.speel + ' Samen luisteren';
}
/* één tik: luisteren én kiezen; nog een tik: stil */
function tikStuk(s){
  if(speelt && speelt.id === s.id){ stopAlles(); return; }
  S[slotVan(s.soort)] = s.id;
  if(S.bedden && S.bedden[slotVan(s.soort)]) S.bedden[slotVan(s.soort)].uit = false;   /* nieuwe keuze speelt weer mee */
  bewaar(); mixCache = null;
  render();
  speelStuk(s.id);
}
async function speelStuk(id){
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
/* met de muis een gezichtje naar een vak slepen */
function sleepNaarVak(tegelEl, s){
  let start = null, spook = null;
  const vak = document.querySelector('.vak[data-soort="' + s.soort + '"]');
  const boven = e => { const r = vak.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; };
  tegelEl.addEventListener('pointerdown', e => { if(e.pointerType === 'touch') return; start = {x: e.clientX, y: e.clientY}; tegelEl.setPointerCapture(e.pointerId); });
  tegelEl.addEventListener('pointermove', e => {
    if(!start) return;
    if(!spook && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8){
      spook = document.createElement('div'); spook.className = 'rspook'; spook.innerHTML = stukGezicht(s);
      document.body.append(spook); tegelEl.dataset.gesleept = '1';
    }
    if(!spook) return;
    spook.style.left = e.clientX + 'px'; spook.style.top = e.clientY + 'px';
    vak.classList.toggle('doel', boven(e));
  });
  const eind = e => {
    if(!start) return; start = null; vak.classList.remove('doel');
    if(!spook) return; spook.remove(); spook = null;
    if(e.type === 'pointerup' && boven(e)){ S[slotVan(s.soort)] = s.id; bewaar(); mixCache = null; render(); }
  };
  tegelEl.addEventListener('pointerup', eind);
  tegelEl.addEventListener('pointercancel', eind);
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
  $('#s-geluiden').classList.toggle('heeft', S.geluiden.length > 0);
  const el = $('#g-lijst'); el.innerHTML = '';
  if(!S.geluiden.length){ el.innerHTML = '<div class="leeg-vak">Nog geen geluiden. Neem er hierboven een op.</div>'; return; }
  S.geluiden.forEach(g => {
    const wrap = document.createElement('div'); wrap.className = 'tegel-wrap';
    const t = tegel(g); t.onclick = () => speelGeluid(g, t);
    const x = document.createElement('button'); x.type = 'button'; x.className = 'weg'; x.textContent = '✕';
    x.setAttribute('aria-label', g.naam + ' weggooien');
    x.onclick = () => {
      S.geluiden = S.geluiden.filter(y => y.id !== g.id); Opslag.wisAudio(g.id); buffers.delete(g.id); mixCache = null;
      bewaar(); render(); toast('"' + g.naam + '" is weggegooid.');
    };
    wrap.append(t, x); el.append(wrap);
  });
}
function tegel(g, toets){
  const b = document.createElement('button'); b.type = 'button'; b.className = 'tegel';
  b.style.setProperty('--c', 'var(--c-' + g.kleur + ')');
  b.innerHTML = '<span class="gezicht">' + Gezichten.htmlGeluid(g.gez) + '</span><span class="naam">' + esc(g.naam) + ' <span class="meta">' + fmtKort(g.duur) + '</span></span>' +
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
$('#g-opnieuw').onclick = () => {
  pending = null; Geluid.stop();
  $('#g-naamvak').hidden = true; $('#g-knop').hidden = false; $('#g-klok').textContent = '';
  melding($('#g-melding'), 'Weggegooid. Tik op Opnemen als je klaar bent voor een nieuwe poging.');
  $('#g-knop').focus();
};
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
  const g = {id, naam, kleur, gez: Gezichten.voorGeluid(nummer, S.geluiden.map(x => x.gez && x.gez.sleutel)), duur: p.samples.length / p.rate};
  buffers.set(id, p.buf);
  const ok = await Opslag.bewaarAudio(id, Geluid.wav([p.samples], p.rate));
  S.geluiden.push(g); bewaar();
  $('#g-naamvak').hidden = true; $('#g-knop').hidden = false; melding($('#g-melding'), '');
  render();
  toast(ok ? '"' + naam + '" staat bij jullie geluiden. Maak er nog een, of tik op Naar stap 3.' : '"' + naam + '" werkt zolang deze pagina open blijft. Bewaren op dit apparaat lukte niet.', 5000);
}

/* ================= 03 opnemen ================= */
/* Stap 3 is één montagescherm: een knoppenbalk en een tijdlijn met sporen.
   S.opname = {stemmen:[{id, t, duur, pieken, perSec}], tikken:[{g, t}]}
   S.bedden = {muziek:{van, tot, uit}, sfeer:{van, tot, uit}}; tot = null: loopt mee met de stemmen */
let oRec = null, mixCache = null;
let luister = null;       // {start, vanaf} tijdens het terugluisteren
const stemBufs = new Map();
const stemmen = () => (S.opname && S.opname.stemmen) || [];
function totaal(){ let d = 1; stemmen().forEach(s => { d = Math.max(d, s.t + s.duur); }); return d; }
const LEEG_DUUR = 15;   // lengte van de tijdlijn zolang er nog niets is ingesproken
function bed(slot){
  S.bedden = S.bedden || {};
  return S.bedden[slot] || (S.bedden[slot] = {van: 0, tot: null, uit: false});
}
const bedTot = slot => bed(slot).tot != null ? bed(slot).tot : (S.opname ? totaal() : LEEG_DUUR);
const bedActief = slot => !!S[slot] && !bed(slot).uit;
function tijdlijnDuur(){
  let d = S.opname ? totaal() : LEEG_DUUR;
  ['muziek', 'sfeer'].forEach(slot => { if(S[slot]) d = Math.max(d, bedTot(slot)); });
  if(S.opname) S.opname.tikken.forEach(k => { const g = S.geluiden.find(x => x.id === k.g); d = Math.max(d, k.t + (g ? g.duur : 0)); });
  return d;
}

/* afspeelknop in de hoek van de tijdlijn: alleen een icoon */
function luisterKnop(stand){ const k = $('#o-luister'); k.innerHTML = stand === 'bezig' ? '<span class="bezig" aria-hidden="true"></span>' : ICOON[stand]; k.setAttribute('aria-label', stand === 'pauze' ? 'Pauze' : stand === 'bezig' ? 'Samenvoegen' : 'Luisteren'); }

function renderOpnemen(){
  const heeft = !!S.opname, bezig = !!oRec;
  document.body.classList.toggle('neemt-op-tl', bezig);
  $('#o-kop').checked = !!S.koptelefoon;
  $('#o-knop').querySelector('.tekst').textContent = bezig ? 'Stop' : 'Opnemen';
  $('#o-knop').setAttribute('aria-label', bezig ? 'Stop opname' : 'Opnemen');
  $('#o-knop').classList.toggle('aan', bezig);
  $('#o-luister').hidden = !heeft || bezig;
  if(!luister && !$('#o-luister').disabled) luisterKnop('speel');
  $('#o-kop').closest('.schakel').hidden = bezig;
  $('#o-bewaar').hidden = !heeft || bezig;
  renderBewaarKnop();
  $('#o-balans').hidden = !heeft || bezig || !(S.muziek || S.sfeer);
  $('#o-balans-schuif').value = S.balans || 0;
  $('#o-alles-opnieuw').hidden = !heeft || bezig;
  if(!bezig){ $('#o-klok').textContent = ''; tekenTijdlijn(); }

  const el = $('#o-lijst'); el.innerHTML = '';
  S.geluiden.forEach(g => {
    const t = tegel(g, ''); t.title = g.naam; t.setAttribute('aria-label', g.naam);
    t.onclick = () => { if(t.dataset.gesleept){ delete t.dataset.gesleept; return; } tikGeluid(g, t); };
    if(heeft && !bezig) sleepUitRij(t, g);
    el.append(t);
  });
}
$('#o-kop').onchange = e => { S.koptelefoon = e.target.checked; bewaar(); };
$('#o-balans-schuif').onchange = e => {
  S.balans = +e.target.value; bewaar(); mixCache = null;
  if(speelt && speelt.wat === 'mix'){ stopAlles(); luisterVanaf(cursor); }   /* meteen horen hoe het nu klinkt */
};

/* groot kaartje: dit geluid klinkt nu */
let nuT = 0;
function nuKaart(g){
  const el = $('#o-nu');
  const zin = oRec ? (S.koptelefoon ? 'klinkt en zit erin ✓' : 'zit erin ✓') : luister ? 'erbij gezet ✓' : 'klinkt nu';
  el.innerHTML = '<span class="gezicht" style="--c:var(--c-' + g.kleur + ')">' + Gezichten.htmlGeluid(g.gez) + '</span><span><b>' + esc(g.naam) + '</b><small>' + zin + '</small></span><i style="animation-duration:' + Math.max(0.6, g.duur) + 's"></i>';
  el.style.setProperty('--c', 'var(--c-' + g.kleur + ')');
  el.classList.remove('toon'); void el.offsetWidth; el.classList.add('toon');
  clearTimeout(nuT); nuT = setTimeout(() => el.classList.remove('toon'), Math.max(1200, g.duur * 1000 + 400));
}

async function tikGeluid(g, el){
  flits(el);
  const c = Geluid.context();
  if(oRec){
    const t = oRec.startT + (oRec.rec.startTijd != null ? c.currentTime - oRec.rec.startTijd : (Date.now() - oRec.t0) / 1000);
    oRec.tikken.push({g: g.id, t: Math.max(0, t)});
    tekenClips([...(S.opname ? S.opname.tikken : []), ...oRec.tikken], false);
    nuKaart(g);
    if(S.koptelefoon) try{ Geluid.los(await geluidBuffer(g.id)); }catch(e){}
    return;
  }
  if(luister && S.opname){
    /* tijdens terugluisteren: geluid op dit moment toevoegen */
    const t = Math.min(totaal(), c.currentTime - luister.start + luister.vanaf);
    S.opname.tikken.push({g: g.id, t: Math.max(0, t)}); bewaar();
    tekenClips(S.opname.tikken, true);
    nuKaart(g);
    try{ Geluid.los(await geluidBuffer(g.id)); }catch(e){}
    return;
  }
  speelGeluid(g, null);
}

/* ---- muziek en plek live laten klinken (koptelefoon) vanaf moment 'vanaf' ---- */
async function bedLagen(vanaf = 0){
  const lagen = [];
  for(const [slot, vol] of [['muziek', 0.55], ['sfeer', 0.45]]){
    if(!bedActief(slot)) continue;
    const b = bed(slot), tot = bedTot(slot);
    if(vanaf >= tot) continue;
    lagen.push({buf: await Bibliotheek.laad(S[slot]), vol: vol * (VOL[b.vol] || 1), loop: true,
      wacht: Math.max(0, b.van - vanaf), vanaf: Math.max(0, vanaf - b.van),
      duur: b.tot != null ? tot - Math.max(vanaf, b.van) : null});
  }
  return lagen;
}

/* ---- tijdlijn: sporen onder elkaar, zoals in een montageprogramma ---- */
const PAD = 12, RIJ = 62;
const tNaarX = t => PAD + t * PX;
const xNaarT = x => (x - PAD) / PX;
function tijdlijnBreedte(duur){ return Math.max($('#tijdlijn').clientWidth - 4, Math.ceil(tNaarX(duur)) + 120); }
function bouwTijdlijn(duur){
  const golf = $('#golf'), kop = golf.querySelector('.kop:not(.opname)');
  golf.innerHTML = '<div class="liniaal"></div>' +
    '<div class="spoor stem"></div>' +
    '<div class="spoor fx"></div>' +
    '<div class="spoor bed" data-slot="muziek"></div>' +
    '<div class="spoor bed" data-slot="sfeer"></div>';
  $('#sporen-namen').innerHTML = '<span class="lin"></span><span>stem</span><span>geluiden</span><span>muziek</span><span>plek</span>';
  if(kop) golf.append(kop);
  zetBreedte(duur);
}
/* de namen links even hoog houden als de sporen */
function zetNamen(){
  const namen = $('#sporen-namen').children, delen = $('#golf').children;
  for(let i = 0; i < namen.length && i < delen.length; i++) namen[i].style.height = delen[i].offsetHeight + 'px';
}
if(window.ResizeObserver) new ResizeObserver(zetNamen).observe($('#golf'));
function zetBreedte(duur){
  const golf = $('#golf'), w = tijdlijnBreedte(duur);
  golf.style.width = w + 'px';
  let html = '';
  for(let s = 0; tNaarX(s) < w - 20; s += 5) html += '<span style="left:' + tNaarX(s) + 'px">' + fmt(s) + '</span>';
  golf.querySelector('.liniaal').innerHTML = html;
}
/* muziek en plek: stroken met gezichtje; slepen, rechterrand verslepen, ✕ */
function tekenBedden(bewerkbaar = true){
  ['muziek', 'sfeer'].forEach(slot => {
    const spoor = $('#golf .spoor.bed[data-slot="' + slot + '"]');
    spoor.querySelectorAll('.strook, .spoor-leeg').forEach(e => e.remove());
    const s = S[slot] && Bibliotheek.zoek(S[slot]);
    if(!s){
      const leeg = document.createElement('button'); leeg.type = 'button'; leeg.className = 'spoor-leeg';
      leeg.textContent = (slot === 'muziek' ? 'Geen muziek gekozen' : 'Geen plek gekozen') + ' · kies bij stap 1';
      leeg.onclick = () => { S.soort = slot === 'muziek' ? 'gevoel' : 'plek'; ga('muziek'); };
      spoor.append(leeg); return;
    }
    const b = bed(slot), van = b.van, tot = bedTot(slot);
    const d = document.createElement('div'); d.className = 'strook ' + (slot === 'muziek' ? 'm' : 's') + (b.uit ? ' uit' : '') + (b.tot == null ? ' auto' : '');
    d.dataset.slot = slot;
    d.style.left = tNaarX(van) + 'px'; d.style.width = Math.max(60, (tot - van) * PX) + 'px';
    d.innerHTML = stukGezicht(s) + '<span class="naam"></span>' + (b.uit ? '' : volMerk(b.vol)) +
      (b.uit ? '<button type="button" class="terug">terugzetten</button>'
             : (bewerkbaar ? '<button type="button" class="kruis" aria-label="' + esc(s.titel) + ' uitzetten">✕</button><span class="rand" aria-hidden="true"></span>' : ''));
    d.querySelector('.naam').textContent = s.titel;
    d.title = b.uit ? s.titel + ' (uit)' : s.titel + (b.tot == null ? ' · loopt mee met de stemmen' : '');
    if(b.uit) d.querySelector('.terug').onclick = e => { e.stopPropagation(); b.uit = false; bedGewijzigd(); };
    else if(bewerkbaar) maakStrookVersleepbaar(d, slot);
    spoor.append(d);
  });
}
function bedGewijzigd(){ bewaar(); mixCache = null; if(speelt && speelt.wat === 'mix') stopAlles(); render(); }
function maakStrookVersleepbaar(d, slot){
  const tl = $('#tijdlijn'), b = bed(slot);
  let x0 = null, s0 = 0, soortSleep = null, van0 = 0, tot0 = 0, geschoven = false;
  d.addEventListener('pointerdown', e => {
    if(oRec || e.target.closest('.kruis')) return;
    x0 = e.clientX; s0 = tl.scrollLeft; van0 = b.van; tot0 = bedTot(slot); geschoven = false;
    soortSleep = e.target.closest('.rand') ? 'eind' : 'hele';
    try{ d.setPointerCapture(e.pointerId); }catch(err){}
  });
  d.addEventListener('pointermove', e => {
    if(x0 == null) return;
    const dt = (e.clientX - x0 + (tl.scrollLeft - s0)) / PX;
    if(!geschoven && Math.abs(dt * PX) > 6){ geschoven = true; d.classList.add('sleept'); }
    if(!geschoven) return;
    if(soortSleep === 'eind'){
      const tot = Math.max(van0 + 1, tot0 + dt);
      d.style.width = Math.max(60, (tot - van0) * PX) + 'px'; d.dataset.tot = tot;
    } else {
      const van = Math.max(0, van0 + dt);
      d.style.left = tNaarX(van) + 'px'; d.dataset.van = van;
      if(b.tot != null) d.style.width = Math.max(60, (tot0 - van0) * PX) + 'px';
      else d.style.width = Math.max(60, (tot0 - van) * PX) + 'px';
    }
  });
  const los = () => {
    if(x0 == null) return; x0 = null;
    if(!geschoven) return kiesVolume(d, b);
    if(soortSleep === 'eind'){
      const tot = +d.dataset.tot;
      /* terug tegen het einde van de stemmen: dan loopt hij weer vanzelf mee */
      b.tot = (S.opname && Math.abs(tot - totaal()) < 0.4) ? null : Math.round(tot * 10) / 10;
    } else {
      const van = Math.round(+d.dataset.van * 10) / 10;
      if(b.tot != null) b.tot = Math.round((b.tot + (van - b.van)) * 10) / 10;
      b.van = van;
    }
    bedGewijzigd();
  };
  d.addEventListener('pointerup', los);
  d.addEventListener('pointercancel', () => { x0 = null; tekenTijdlijn(); });
  d.addEventListener('click', e => e.stopPropagation());
  d.querySelector('.kruis').addEventListener('pointerdown', e => e.stopPropagation());
  d.querySelector('.kruis').addEventListener('click', e => { e.stopPropagation(); b.uit = true; bedGewijzigd(); toast((slot === 'muziek' ? 'De muziek' : 'Het plekgeluid') + ' speelt niet meer mee.'); });
}
/* blokjes over rijen verdelen, zodat ze niet over elkaar vallen */
function plaatsInRij(rijEind, x, w){
  let r = rijEind.findIndex(e => e <= x + 2); if(r < 0){ r = rijEind.length; rijEind.push(0); }
  rijEind[r] = x + w; return r;
}
/* golfje: hoog = hard, laag = zacht, plat lijntje = stil */
function golfjeHtml(pieken, perSec = 4){
  const lijst = pieken || [];
  const max = Math.max(0.001, ...lijst);
  return '<span class="stemgolf">' + lijst.map((p, i) => {
    const v = p / max;
    return '<i class="' + (v < 0.12 ? 'golf-stil' : '') + '" style="left:' + (i / perSec * PX) + 'px;height:' + (v < 0.12 ? 2 : Math.round(4 + v * 40)) + 'px"></i>';
  }).join('') + '</span>';
}
function tekenStemmen(bewerkbaar){
  const spoor = $('#golf .spoor.stem');
  spoor.querySelectorAll('.clip, .spoor-leeg').forEach(e => e.remove());
  const rijEind = [];
  if(!stemmen().length && !oRec){
    const leeg = document.createElement('span'); leeg.className = 'spoor-leeg hint';
    leeg.textContent = 'Hier komen jullie stemmen';
    spoor.append(leeg);
  }
  stemmen().map((s, i) => ({s, i})).sort((a, b) => a.s.t - b.s.t).forEach(({s, i}, n) => {
    const x = tNaarX(s.t), w = Math.max(44, s.duur * PX);
    const r = plaatsInRij(rijEind, x, w);
    const c = document.createElement('div'); c.className = 'clip stemclip'; c.dataset.i = i; c.dataset.soort = 'stem';
    c.style.left = x + 'px'; c.style.width = w + 'px'; c.style.top = (10 + r * RIJ) + 'px';
    c.title = 'Stuk ' + (n + 1) + ' (' + fmtKort(s.duur) + ')';
    c.innerHTML = golfjeHtml(s.pieken, s.perSec || 4) + volMerk(s.vol) + (bewerkbaar ? '<button type="button" class="kruis" aria-label="Stuk ' + (n + 1) + ' weghalen">✕</button>' : '');
    if(bewerkbaar){
      c.tabIndex = 0; c.setAttribute('role', 'button');
      c.setAttribute('aria-label', 'Stuk ' + (n + 1) + ' op ' + fmt(s.t) + '. Tik om te luisteren, sleep om te verschuiven.');
      maakVersleepbaar(c);
    }
    spoor.append(c);
  });
  spoor.style.height = (Math.max(1, rijEind.length) * RIJ + 12) + 'px';
  return rijEind;
}
function tekenClips(tikken, bewerkbaar){
  const spoor = $('#golf .spoor.fx');
  spoor.querySelectorAll('.clip').forEach(e => e.remove());
  const rijEind = [];
  tikken.map((k, i) => ({k, i})).sort((a, b) => a.k.t - b.k.t).forEach(({k, i}) => {
    const g = S.geluiden.find(x => x.id === k.g); if(!g) return;
    const x = tNaarX(k.t), w = Math.max(bewerkbaar ? 72 : 50, g.duur * PX);
    const r = plaatsInRij(rijEind, x, w);
    const c = document.createElement('div'); c.className = 'clip' + (w < 120 ? ' smal' : ''); c.dataset.i = i; c.dataset.soort = 'fx'; c.title = g.naam + ' (' + fmtKort(g.duur) + ')';
    c.style.left = x + 'px'; c.style.width = w + 'px'; c.style.top = (10 + r * RIJ) + 'px';
    c.style.setProperty('--c', 'var(--c-' + g.kleur + ')');
    c.innerHTML = '<span class="gezicht">' + Gezichten.htmlGeluid(g.gez) + '</span><span class="naam"></span>' + volMerk(k.vol) +
      (bewerkbaar ? '<button type="button" class="kruis" aria-label="' + esc(g.naam) + ' weghalen">✕</button>' : '');
    c.querySelector('.naam').textContent = g.naam;
    if(bewerkbaar){
      c.tabIndex = 0; c.setAttribute('role', 'button');
      c.setAttribute('aria-label', g.naam + ' op ' + fmt(k.t) + '. Sleep of gebruik de pijltjes om te verschuiven.');
      maakVersleepbaar(c, g);
    }
    spoor.append(c);
  });
  spoor.style.height = (Math.max(1, rijEind.length) * RIJ + 12) + 'px';
  zetNamen();
}
function tekenTijdlijn(){
  bouwTijdlijn(tijdlijnDuur());
  tekenStemmen(!!S.opname);
  tekenBedden(true);
  tekenClips(S.opname ? S.opname.tikken : [], !!S.opname);
  if(S.opname) zetKop(cursor); else { const k = $('#golf .kop'); if(k) k.remove(); }
  zetNamen();
}

/* ---- blokjes slepen of weghalen (stemmen en geluiden) ---- */
const lijstVoor = soort => soort === 'stem' ? S.opname.stemmen : S.opname.tikken;
function maakVersleepbaar(c, g){
  const tl = $('#tijdlijn'), soort = c.dataset.soort;
  let x0 = null, s0 = 0, t0 = 0, tNu = 0, geschoven = false;
  c.addEventListener('pointerdown', e => {
    if(oRec || e.target.closest('.kruis')) return;
    x0 = e.clientX; s0 = tl.scrollLeft; t0 = tNu = lijstVoor(soort)[+c.dataset.i].t; geschoven = false;
    try{ c.setPointerCapture(e.pointerId); }catch(err){}
  });
  c.addEventListener('pointermove', e => {
    if(x0 == null) return;
    const dx = e.clientX - x0 + (tl.scrollLeft - s0);
    if(!geschoven && Math.abs(dx) > 6){ geschoven = true; c.classList.add('sleept'); }
    if(!geschoven) return;
    tNu = Math.max(0, t0 + dx / PX);
    c.style.left = tNaarX(tNu) + 'px';
    const r = tl.getBoundingClientRect();
    if(e.clientX > r.right - 40) tl.scrollLeft += 14; else if(e.clientX < r.left + 40) tl.scrollLeft -= 14;
  });
  c.addEventListener('pointerup', async () => {
    if(x0 == null) return; x0 = null;
    if(geschoven) return zetBlok(soort, +c.dataset.i, tNu);
    flits(c);
    const item = lijstVoor(soort)[+c.dataset.i];
    kiesVolume(c, item);
    if(soort === 'stem') return luisterVanaf(item.t);
    try{ Geluid.los(await geluidBuffer(g.id), 0.9 * (VOL[item.vol] || 1)); }catch(e){}
  });
  c.addEventListener('pointercancel', () => { x0 = null; tekenTijdlijn(); });
  c.addEventListener('click', e => e.stopPropagation());
  c.addEventListener('keydown', e => {
    const i = +c.dataset.i, k = lijstVoor(soort)[i];
    if(e.key === 'ArrowLeft' || e.key === 'ArrowRight'){ e.preventDefault(); zetBlok(soort, i, k.t + (e.key === 'ArrowLeft' ? -0.5 : 0.5)); const n = $('#golf .clip[data-soort="' + soort + '"][data-i="' + i + '"]'); if(n) n.focus(); }
    if(e.key === 'Delete' || e.key === 'Backspace'){ e.preventDefault(); soort === 'stem' ? verwijderStem(i) : verwijderTik(i); }
  });
  const kruis = c.querySelector('.kruis');
  kruis.addEventListener('pointerdown', e => e.stopPropagation());
  let zeker = 0;
  kruis.addEventListener('click', e => {
    e.stopPropagation();
    if(soort !== 'stem') return verwijderTik(+c.dataset.i);
    /* een stuk stem weghalen: twee keer tikken */
    if(!zeker){ kruis.classList.add('zeker'); kruis.textContent = 'weg?'; zeker = setTimeout(() => { zeker = 0; kruis.classList.remove('zeker'); kruis.textContent = '✕'; }, 3000); return; }
    clearTimeout(zeker); verwijderStem(+c.dataset.i);
  });
}
/* ---- zacht / normaal / hard per blokje ---- */
const VOL = {zacht: 0.5, hard: 1.8};
/* balans aan het eind: muziek en plek zachter (stemmen duidelijker) of voller */
const BALANS = {'-2': 1.6, '-1': 1.25, '0': 1, '1': 0.6, '2': 0.35};
const balansF = () => BALANS[S.balans || 0] || 1;
const volMerk = v => v ? '<span class="volmerk">' + v + '</span>' : '';
function sluitVolume(){ const o = $('.volkeuze'); if(o) o.remove(); document.removeEventListener('pointerdown', buitenVolume, true); }
function buitenVolume(e){ if(!e.target.closest('.volkeuze')) sluitVolume(); }
function kiesVolume(el, item){
  sluitVolume();
  const k = document.createElement('div'); k.className = 'volkeuze'; k.setAttribute('role', 'group'); k.setAttribute('aria-label', 'Hoe hard?');
  ['zacht', 'normaal', 'hard'].forEach(v => {
    const knop = document.createElement('button'); knop.type = 'button'; knop.textContent = v;
    const aan = (item.vol || 'normaal') === v; knop.setAttribute('aria-pressed', aan); if(aan) knop.className = 'aan';
    knop.onclick = () => {
      sluitVolume();
      if((item.vol || 'normaal') === v) return;
      if(v === 'normaal') delete item.vol; else item.vol = v;
      bewaar(); mixCache = null;
      const speelde = speelt && speelt.wat === 'mix';
      if(speelde) stopAlles();
      render();
      if(speelde) luisterVanaf(cursor);   /* meteen horen hoe het nu klinkt */
    };
    k.append(knop);
  });
  document.body.append(k);
  const r = el.getBoundingClientRect(), w = k.offsetWidth, h = k.offsetHeight;
  const x = Math.max(8, Math.min(innerWidth - w - 8, r.left + Math.min(r.width, 240) / 2 - w / 2));
  const y = r.bottom + h + 12 < innerHeight ? r.bottom + 8 : r.top - h - 8;
  k.style.left = x + 'px'; k.style.top = y + 'px';
  setTimeout(() => document.addEventListener('pointerdown', buitenVolume, true));
}
document.addEventListener('scroll', sluitVolume, {passive: true, capture: true});
document.addEventListener('keydown', e => { if(e.key === 'Escape') sluitVolume(); });
function zetBlok(soort, i, t){
  const k = lijstVoor(soort)[i]; if(!k) return;
  k.t = Math.max(0, Math.min(soort === 'stem' ? 600 : totaal(), Math.round(t * 20) / 20));
  bewaar(); mixCache = null;
  if(speelt && speelt.wat === 'mix') stopAlles();
  render();
}
function verwijderTik(i){
  const k = S.opname.tikken[i]; if(!k) return;
  const g = S.geluiden.find(x => x.id === k.g);
  S.opname.tikken.splice(i, 1); bewaar();
  if(speelt && speelt.wat === 'mix') stopAlles();
  tekenTijdlijn();
  toast((g ? '"' + g.naam + '"' : 'Het geluid') + ' is weggehaald.');
}
function verwijderStem(i){
  const st = S.opname.stemmen[i]; if(!st) return;
  if(speelt && speelt.wat === 'mix') stopAlles();
  S.opname.stemmen.splice(i, 1);
  Opslag.wisAudio(st.id); stemBufs.delete(st.id); mixCache = null;
  if(!S.opname.stemmen.length){ S.opname = null; cursor = 0; }
  else cursor = Math.min(cursor, totaal());
  bewaar(); render();
  toast('Het stuk is weggehaald.');
}
/* een geluid uit de rij de tijdlijn in slepen: met de muis meteen, met de vinger na even vasthouden */
function sleepUitRij(tegelEl, g){
  let start = null, spook = null, wacht = 0;
  const binnen = (x, y) => { const r = $('#tijdlijn').getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; };
  const pak = () => {
    spook = document.createElement('div'); spook.className = 'clip spook';
    spook.style.setProperty('--c', 'var(--c-' + g.kleur + ')');
    spook.innerHTML = '<span class="gezicht">' + Gezichten.htmlGeluid(g.gez) + '</span><span class="naam"></span>';
    spook.querySelector('.naam').textContent = g.naam;
    document.body.append(spook); tegelEl.dataset.gesleept = '1';
  };
  const beweeg = (x, y) => {
    spook.style.left = x + 'px'; spook.style.top = y + 'px';
    $('#tijdlijn').classList.toggle('doel', binnen(x, y));
    if(y < 70) window.scrollBy(0, -14); else if(y > innerHeight - 110) window.scrollBy(0, 14);
    const tl = $('#tijdlijn'), r = tl.getBoundingClientRect();
    if(binnen(x, y)){ if(x > r.right - 40) tl.scrollLeft += 12; else if(x < r.left + 40) tl.scrollLeft -= 12; }
  };
  const laat = (x, y, erin) => {
    start = null; clearTimeout(wacht); wacht = 0;
    $('#tijdlijn').classList.remove('doel');
    if(!spook) return;
    spook.remove(); spook = null;
    if(!erin || !binnen(x, y)) return;
    const gr = $('#golf').getBoundingClientRect();
    const t = Math.max(0, Math.min(totaal(), xNaarT(x - gr.left)));
    S.opname.tikken.push({g: g.id, t}); bewaar();
    if(speelt && speelt.wat === 'mix') stopAlles();
    tekenTijdlijn();
    toast('"' + g.naam + '" staat erbij.');
  };
  /* muis */
  tegelEl.addEventListener('pointerdown', e => {
    if(e.pointerType === 'touch' || !S.opname || oRec) return;
    start = {x: e.clientX, y: e.clientY}; try{ tegelEl.setPointerCapture(e.pointerId); }catch(err){}
  });
  tegelEl.addEventListener('pointermove', e => {
    if(e.pointerType === 'touch' || !start) return;
    if(!spook && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) pak();
    if(spook) beweeg(e.clientX, e.clientY);
  });
  tegelEl.addEventListener('pointerup', e => { if(e.pointerType !== 'touch' && start) laat(e.clientX, e.clientY, true); });
  tegelEl.addEventListener('pointercancel', e => { if(e.pointerType !== 'touch' && start) laat(0, 0, false); });
  /* vinger: even vasthouden (0,3 s), dan slepen; eerder bewegen = gewoon scrollen */
  tegelEl.addEventListener('touchstart', e => {
    if(!S.opname || oRec || e.touches.length > 1) return;
    const v = e.touches[0]; start = {x: v.clientX, y: v.clientY};
    wacht = setTimeout(() => { wacht = 0; if(!start) return; pak(); beweeg(start.x, start.y); if(navigator.vibrate) try{ navigator.vibrate(15); }catch(err){} }, 300);
  }, {passive: true});
  tegelEl.addEventListener('touchmove', e => {
    if(!start) return;
    const v = e.touches[0];
    if(!spook){ if(Math.hypot(v.clientX - start.x, v.clientY - start.y) > 10){ clearTimeout(wacht); wacht = 0; start = null; } return; }
    e.preventDefault();   /* niet scrollen tijdens het slepen */
    beweeg(v.clientX, v.clientY);
  }, {passive: false});
  tegelEl.addEventListener('touchend', e => { if(!start) return; const v = e.changedTouches[0]; laat(v.clientX, v.clientY, true); });
  tegelEl.addEventListener('touchcancel', () => { if(start) laat(0, 0, false); });
  tegelEl.addEventListener('contextmenu', e => { if(S.opname) e.preventDefault(); });   /* geen menu bij lang drukken */
}
/* tik op de tijdlijn: afspelen of pauze */
let geenKlik = false;
$('#golf').addEventListener('click', e => {
  if(geenKlik){ geenKlik = false; return; }
  if(oRec || !S.opname || e.target.closest('.clip, .strook, .spoor-leeg, .liniaal, .greep')) return;
  (speelt && speelt.wat === 'mix') ? stopAlles() : luisterVanaf(cursor);
});
/* afspeellijn slepen (of tikken op de tijdschaal), ook tijdens het afspelen */
let scrub = null;
const kopNaarMuis = e => { const r = $('#golf').getBoundingClientRect(); zetKop(xNaarT(e.clientX - r.left)); };
$('#golf').addEventListener('pointerdown', e => {
  if(oRec || !S.opname || !e.target.closest('.liniaal, .greep')) return;
  e.preventDefault();
  scrub = {speelde: !!(speelt && speelt.wat === 'mix')};
  if(scrub.speelde) stopAlles();
  try{ $('#golf').setPointerCapture(e.pointerId); }catch(err){}
  kopNaarMuis(e);
});
$('#golf').addEventListener('pointermove', e => {
  if(!scrub) return;
  kopNaarMuis(e);
  const tl = $('#tijdlijn'), r = tl.getBoundingClientRect();
  if(e.clientX > r.right - 40) tl.scrollLeft += 14; else if(e.clientX < r.left + 40) tl.scrollLeft -= 14;
});
const scrubKlaar = () => { if(!scrub) return; const s = scrub; scrub = null; geenKlik = true; setTimeout(() => geenKlik = false, 50); if(s.speelde) luisterVanaf(cursor); };
$('#golf').addEventListener('pointerup', scrubKlaar);
$('#golf').addEventListener('pointercancel', scrubKlaar);

/* ---- opnemen, direct in de tijdlijn ---- */
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
  const startT = S.opname ? totaal() : 0;   /* een nieuw stuk komt achteraan */
  const knop = $('#o-knop'); knop.disabled = true;
  let rec, lagen = [];
  try{ rec = await Geluid.maakRecorder('stem', {niveau: p => { knop.style.setProperty('--niveau', Math.min(1, p * 1.6)); if(oRec && oRec.bezig) oRec.pieken.push(p); }}); }
  catch(e){ knop.disabled = false; render(); melding($('#o-melding'), micFout(e), true); return; }
  if(S.koptelefoon){ try{ lagen = await bedLagen(startT); }catch(e){} }
  $('#o-balk').scrollIntoView({block: 'start', behavior: 'smooth'});
  await aftellen();
  knop.disabled = false;
  rec.begin();
  if(lagen.length) Geluid.speel(lagen);
  const t0 = Date.now();
  oRec = {rec, t0, startT, tikken:[], pieken:[], bezig:true, timer:0};
  houdWakker(true);
  render();
  /* het nieuwe stem-blokje groeit op de tijdlijn */
  const rijen = tekenStemmen(false);
  tekenClips(S.opname ? S.opname.tikken : [], false);
  tekenBedden(false);
  const live = document.createElement('div'); live.className = 'clip stemclip live';
  const r = plaatsInRij(rijen, tNaarX(startT), 99999);
  live.style.left = tNaarX(startT) + 'px'; live.style.top = (10 + r * RIJ) + 'px'; live.style.width = '44px';
  live.innerHTML = '<span class="stemgolf"></span>';
  const spoor = $('#golf .spoor.stem'); spoor.append(live);
  spoor.style.height = (Math.max(1, rijen.length) * RIJ + 12) + 'px';
  zetNamen();
  const golfje = live.querySelector('.stemgolf');
  const kop = document.createElement('div'); kop.className = 'kop opname'; $('#golf').append(kop);
  let getekend = 0;
  oRec.timer = setInterval(() => {
    const s = (Date.now() - t0) / 1000;
    $('#o-klok').textContent = fmt(s);
    /* live golfje: elke 0,25 s een streepje */
    while(getekend < s * 4){
      const p = oRec.pieken.length ? Math.max(...oRec.pieken.splice(0)) : 0.02;
      const i = document.createElement('i'); i.style.left = (getekend / 4 * PX) + 'px'; i.style.height = Math.max(3, Math.min(40, p * 70)) + 'px';
      golfje.append(i); getekend++;
    }
    live.style.width = Math.max(44, s * PX) + 'px';
    kop.style.left = tNaarX(startT + s) + 'px';
    if(getekend % 4 === 0){ const d = Math.max(tijdlijnDuur(), startT + s + 2); zetBreedte(d); }
    const tl = $('#tijdlijn'), x = tNaarX(startT + s);
    if(x > tl.scrollLeft + tl.clientWidth - 80) tl.scrollLeft = x - tl.clientWidth + 160;
    if(s >= MAX_OPNAME_SEC){ toast('Een stuk is maximaal 5 minuten.'); stopOpname(); }
  }, 250);
}
async function stopOpname(){
  if(!oRec) return;
  const r = oRec; r.bezig = false; clearInterval(r.timer);
  Geluid.stop();
  const knop = $('#o-knop'); knop.classList.remove('aan'); knop.style.setProperty('--niveau', 0);
  const {samples, rate} = await r.rec.eind();
  oRec = null; houdWakker(false);
  if(!samples.length || Geluid.isStil(samples)){
    render();
    melding($('#o-melding'), 'We hoorden niets. Kijk of de microfoon aan staat en probeer het nog een keer.', true);
    return;
  }
  /* golfje: 8 streepjes per seconde, gemiddeld volume, op schaal van deze opname */
  const perSec = 8, stap = Math.round(rate / perSec), ruw = [];
  for(let i = 0; i < samples.length; i += stap){ let som = 0, m = 0; for(let j = i; j < Math.min(samples.length, i + stap); j += 2){ som += samples[j] * samples[j]; m++; } ruw.push(Math.sqrt(som / Math.max(1, m))); }
  const hoog = [...ruw].sort((a, b) => a - b)[Math.floor(ruw.length * 0.95)] || 0.001;
  const pieken = ruw.map(v => +Math.min(1, v / hoog).toFixed(2));
  const stem = {id: uid('o_'), t: r.startT, duur: samples.length / rate, pieken, perSec};
  stemBufs.set(stem.id, Geluid.samplesNaarBuffer(samples, rate)); mixCache = null;
  if(!S.opname) S.opname = {stemmen: [stem], tikken: r.tikken};
  else { S.opname.stemmen.push(stem); S.opname.tikken.push(...r.tikken); }
  const ok = await Opslag.bewaarAudio(stem.id, Geluid.wav([samples], rate));
  bewaar();
  cursor = stem.t;
  render();
  if(!ok) toast('Let op: bewaren op dit apparaat lukte niet. Tik op Bewaren.', 5000);
  zetKop(stem.t);   /* afspeellijn aan het begin van het nieuwe stuk; luisteren doen ze zelf */
}
$('#o-knop').onclick = () => oRec ? stopOpname() : startOpname();

/* ---- mixen, luisteren, bewaren ---- */
async function stemBuffer(id){
  if(stemBufs.has(id)) return stemBufs.get(id);
  const blob = await Opslag.leesAudio(id); if(!blob) throw new Error('weg');
  const b = await Geluid.blobNaarBuffer(blob); stemBufs.set(id, b); return b;
}
/* alles wat de mix bepaalt; gelijk aan S.bewaard = deze versie is als mp3 bewaard */
const mixSleutel = () => [S.muziek, S.sfeer, S.geluiden.map(g => g.id).join(), JSON.stringify(S.opname), JSON.stringify(S.bedden || {}), S.balans || 0].join('|');
const nietBewaard = () => !!(S.opname && S.opname.stemmen && S.opname.stemmen.length) && S.bewaard !== mixSleutel();
function renderBewaarKnop(){
  const knop = $('#o-bewaar'); if(knop.disabled) return;
  const nog = nietBewaard();
  knop.classList.toggle('nog', nog); knop.classList.toggle('bewaard', !nog);
  knop.innerHTML = nog ? 'Bewaren als mp3<span class="nog-label">nog niet bewaard!</span>' : ICOON.vink + ' Bewaard';
}
async function maakMix(){
  const o = S.opname;
  const sleutel = mixSleutel();
  if(mixCache && mixCache.sleutel === sleutel) return mixCache.buf;
  const stemLijst = [];
  for(const s of o.stemmen){ try{ stemLijst.push({buf: await stemBuffer(s.id), t: s.t, vol: VOL[s.vol] || 1}); }catch(e){} }
  if(!stemLijst.length) throw new Error('weg');
  const tikken = [];
  for(const k of o.tikken){ const g = S.geluiden.find(x => x.id === k.g); if(!g) continue; try{ tikken.push({buf: await geluidBuffer(g.id), t: k.t, vol: VOL[k.vol] || 1}); }catch(e){} }
  const buf = await Geluid.mix({
    stemmen: stemLijst,
    muziek: bedActief('muziek') ? await Bibliotheek.laad(S.muziek) : null,
    sfeer: bedActief('sfeer') ? await Bibliotheek.laad(S.sfeer) : null,
    muziekVan: bed('muziek').van, muziekTot: bed('muziek').tot,
    sfeerVan: bed('sfeer').van, sfeerTot: bed('sfeer').tot,
    muziekVol: (VOL[bed('muziek').vol] || 1) * balansF(), sfeerVol: (VOL[bed('sfeer').vol] || 1) * balansF(),
    tikken
  });
  mixCache = {sleutel, buf};
  return buf;
}
let kopRaf = 0;
/* afspeellijn: blijft staan, ook als er niets speelt */
let cursor = 0;
function zetKop(t){
  cursor = Math.max(0, Math.min(S.opname ? tijdlijnDuur() : 0, t));
  let k = $('#golf .kop:not(.opname)');
  if(!k){ k = document.createElement('div'); k.className = 'kop'; k.innerHTML = '<span class="greep" aria-hidden="true"></span>'; $('#golf').append(k); }
  k.style.left = tNaarX(cursor) + 'px';
}
function stopKop(){
  if(luister) zetKop(Geluid.context().currentTime - luister.start + luister.vanaf);   /* pauze: lijn blijft waar het was */
  cancelAnimationFrame(kopRaf); kopRaf = 0; luister = null;
  luisterKnop('speel');
}
async function luisterVanaf(vanaf){
  stopAlles();
  if(vanaf >= tijdlijnDuur() - 0.2) vanaf = 0;
  const knop = $('#o-luister'); luisterKnop('bezig'); knop.disabled = true;
  let buf;
  try{ buf = await maakMix(); }
  catch(e){ knop.disabled = false; luisterKnop('speel'); toast('De opname staat niet meer op dit apparaat. Neem opnieuw op.'); return; }
  knop.disabled = false; luisterKnop('pauze');
  const start = Geluid.speel([{buf}], () => { speelt = null; stopKop(); zetKop(totaal()); }, vanaf);
  speelt = {wat:'mix', id:'mix'}; luister = {start, vanaf};
  zetKop(vanaf);
  const c = Geluid.context(), tl = $('#tijdlijn');
  const loop = () => {
    zetKop(Math.max(vanaf, c.currentTime - start + vanaf)); const x = tNaarX(cursor);
    if(x > tl.scrollLeft + tl.clientWidth - 60 || x < tl.scrollLeft) tl.scrollLeft = x - 60;
    kopRaf = requestAnimationFrame(loop);
  };
  loop();
}
$('#o-luister').onclick = () => { (speelt && speelt.wat === 'mix') ? stopAlles() : luisterVanaf(cursor); };
let opnieuwZeker = 0;
$('#o-alles-opnieuw').onclick = () => {
  const b = $('#o-alles-opnieuw');
  if(!opnieuwZeker){ b.textContent = nietBewaard() ? 'Nog niet bewaard! Toch weggooien? Tik nog een keer' : 'Alles weggooien? Tik nog een keer'; b.classList.add('gevaar'); opnieuwZeker = setTimeout(() => { opnieuwZeker = 0; b.textContent = 'Alleen de opname wissen'; b.classList.remove('gevaar'); }, 3500); return; }
  clearTimeout(opnieuwZeker); opnieuwZeker = 0; b.textContent = 'Alleen de opname wissen'; b.classList.remove('gevaar');
  stopAlles();
  stemmen().forEach(s => { Opslag.wisAudio(s.id); stemBufs.delete(s.id); });
  S.opname = null; S.bedden = {}; mixCache = null; cursor = 0; bewaar();
  if($('#groep-dlg').open) $('#groep-dlg').close();
  render();
  toast('Spreek het verhaal opnieuw in.');
};
$('#o-bewaar').onclick = async () => {
  const knop = $('#o-bewaar'); knop.disabled = true; knop.classList.remove('nog'); knop.textContent = 'Bezig…';
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
    S.bewaard = mixSleutel(); bewaar();
    toast(ext === 'mp3' ? 'Bewaard! Je vindt "' + naam + '.mp3" in de map Downloads.' : 'Bewaard als "' + naam + '.wav" in Downloads. (mp3 lukte niet zonder internet.)', 6000);
  }catch(e){ toast('Bewaren lukte niet. Probeer het nog een keer.'); }
  knop.disabled = false; renderBewaarKnop();
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
/* makers van de muziek en plekgeluiden (licentie) */
$('#bronnen').innerHTML = [...Bibliotheek.GEVOEL, ...Bibliotheek.PLEK].flatMap(m => m.stukken.filter(x => x.bron).map(x => '<li><b>' + esc(x.titel) + '</b> · ' + esc(x.bron) + '</li>')).join('');
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

$('#leerkracht-knop').onclick = () => { const d = $('#leerkracht'); d.showModal(); d.scrollTop = 0; $('#lk-titel').focus(); };
$('#lk-sluit').onclick = () => $('#leerkracht').close();
let wisZeker = 0;
$('#wis-alles').onclick = async () => {
  const b = $('#wis-alles');
  if(!wisZeker){ b.textContent = nietBewaard() ? 'Nog niet bewaard! Toch wissen? Tik nog een keer' : 'Zeker weten? Tik nog een keer'; wisZeker = setTimeout(() => { wisZeker = 0; b.textContent = 'Nieuw hoorspel beginnen'; }, 4000); return; }
  clearTimeout(wisZeker);
  stopAlles(); await Opslag.wisAlles(); location.reload();
};

/* geluid mag pas na een tik starten (iPad) */
document.addEventListener('pointerdown', () => Geluid.context(), {once:true, capture:true});
/* niet zomaar weg: tijdens opnemen, of als het hoorspel nog niet bewaard is */
window.addEventListener('beforeunload', e => { if(gRec || oRec || nietBewaard()){ e.preventDefault(); e.returnValue = ''; } });

/* ================= start ================= */
(async function start(){
  const ok = await Opslag.start();
  const oud = await Opslag.leesStaat();
  if(oud && typeof oud === 'object') S = Object.assign(S, oud);
  if(!STAPPEN.includes(S.stap)) S.stap = 'muziek';
  if(S.opname && !S.opname.stemmen){ const o = S.opname; S.opname = {stemmen: [{id: o.id, t: 0, duur: o.duur, pieken: o.pieken || []}], tikken: o.tikken || []}; bewaar(); }
  STAPPEN.forEach(n => $('#s-' + n).hidden = n !== S.stap);
  render();
  if(!S.groep) welkom();
  if(!ok) toast('Bewaren lukt niet in deze browser. Wat jullie maken, verdwijnt als je de pagina sluit.', 6000);
})();
})();
