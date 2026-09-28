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

let S = {groep:'', stap:'muziek', soort:'gevoel', muziek:null, sfeer:null, geluiden:[], opname:null, koptelefoon:false};
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
function stopAlles(){ Geluid.stop(); speelt = null; stopKop(); renderSpeelknoppen(); if(oefent){ oefent = false; document.body.classList.remove('compact', 'oefent'); if(S.stap === 'opnemen') renderOpnemen(); } }

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
  if(stap === 'opnemen') kopGekozen = false;
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
  $('#verder').textContent = i === 0 ? 'Naar stap 02 →' : 'Naar stap 03 →';
  $('#groep-naam').textContent = S.groep || 'Ons groepje';
  if(S.stap === 'muziek') renderMuziek();
  if(S.stap === 'geluiden') renderGeluiden();
  if(S.stap === 'opnemen') renderOpnemen();
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
    $(vak).innerHTML = s ? stukGezicht(s) + '<b>' + esc(s.titel) + '</b>' : '<span class="leeg">nog leeg</span>';
    $(weg).hidden = !s;
    const el = document.querySelector('.vak[data-soort="' + soort + '"]');
    el.classList.toggle('open', S.soort === soort);
    el.classList.toggle('vol', !!s);
    el.querySelector('.vak-tab').setAttribute('aria-selected', String(S.soort === soort));
  });
  $('#samen').hidden = !(S.muziek && S.sfeer);
  renderSpeelknoppen();
}
document.querySelectorAll('.vak-tab').forEach(b => b.onclick = () => {
  if(S.soort === b.dataset.soort) return;
  S.soort = b.dataset.soort; bewaar(); renderMuziek();
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
  document.querySelectorAll('[data-speel]').forEach(b => {
    const s = Bibliotheek.zoek(b.dataset.speel);
    const aan = speelt && speelt.wat === 'stuk' && speelt.id === b.dataset.speel;
    const laadt = speelt && speelt.wat === 'laden' && speelt.id === b.dataset.speel;
    const gekozen = s && S[slotVan(s.soort)] === s.id;
    b.classList.toggle('speelt', !!aan); b.classList.toggle('gekozen', !!gekozen);
    const badge = b.querySelector('.badge'); if(badge) badge.textContent = laadt ? '…' : aan ? '■' : gekozen ? '✓' : '▶';
    b.setAttribute('aria-pressed', String(!!gekozen));
    b.setAttribute('aria-label', (s ? s.titel : '') + (aan ? ', speelt. Tik om te stoppen.' : gekozen ? ', gekozen' : ', luisteren en kiezen'));
  });
  const samen = $('#samen');
  const aan = speelt && speelt.wat === 'samen';
  samen.textContent = aan ? '■ Stoppen' : '▶ Samen luisteren';
}
/* één tik: luisteren én kiezen; nog een tik: stil */
function tikStuk(s){
  if(speelt && speelt.id === s.id){ stopAlles(); return; }
  S[slotVan(s.soort)] = s.id; bewaar(); mixCache = null;
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
  const g = {id, naam, kleur, gez: Gezichten.voorGeluid(nummer), duur: p.samples.length / p.rate};
  buffers.set(id, p.buf);
  const ok = await Opslag.bewaarAudio(id, Geluid.wav([p.samples], p.rate));
  S.geluiden.push(g); bewaar();
  $('#g-naamvak').hidden = true; $('#g-knop').hidden = false; melding($('#g-melding'), '');
  render();
  toast(ok ? '"' + naam + '" staat bij jullie geluiden. Maak er nog een, of tik op Naar stap 03.' : '"' + naam + '" werkt zolang deze pagina open blijft. Bewaren op dit apparaat lukte niet.', 5000);
}

/* ================= 03 opnemen ================= */
let oRec = null, stemBuf = null, mixCache = null, oefent = false;
let luister = null;   // {start, vanaf} tijdens het terugluisteren
let kopGekozen = false;   // koptelefoon-vraag beantwoord voor deze opname
let afzetten = false;     // na opname met koptelefoon: eerst afzetten, dan samen luisteren

function renderOpnemen(){
  const m = S.muziek && Bibliotheek.zoek(S.muziek), s = S.sfeer && Bibliotheek.zoek(S.sfeer);
  $('#o-gekozen').innerHTML =
    (m ? '<span class="mini">' + stukGezicht(m) + '<b>' + esc(m.titel) + '</b></span>' : '<span class="mini"><b>geen muziek</b></span>') +
    (s ? '<span class="mini">' + stukGezicht(s) + '<b>' + esc(s.titel) + '</b></span>' : '<span class="mini"><b>geen plek</b></span>') +
    '<span class="wijzig">wijzig ›</span>';

  const heeft = !!S.opname, bezig = !!oRec;
  $('#s-opnemen').classList.toggle('heeft', heeft && !bezig);
  $('#o-kopvraag').hidden = kopGekozen;
  $('#o-stil').hidden = !kopGekozen;
  $('#o-stil').innerHTML = S.koptelefoon
    ? '🎧 <b>Met koptelefoon.</b> Alleen de geluidstechnicus hoort de muziek. <button type="button" class="linkknop" id="o-kop-wijzig">wijzig</button>'
    : '🤫 <b>Zonder koptelefoon.</b> Het is stil tijdens het opnemen. Bij Luisteren hoor je alles. <button type="button" class="linkknop" id="o-kop-wijzig">wijzig</button>';
  $('#o-kop-wijzig').onclick = () => { kopGekozen = false; render(); };
  $('#o-voor').hidden = heeft || bezig;
  $('#o-oefen').textContent = oefent ? '■ Klaar met oefenen' : '▶ Oefenen met muziek';
  $('#o-oefen').classList.toggle('aan', oefent);
  $('#o-knop').hidden = (heeft && !bezig) || oefent || (!bezig && !kopGekozen);
  $('#o-knop').querySelector('.tekst').innerHTML = bezig ? 'Stop' : 'Start<br>opname';
  $('#o-afzetten').hidden = !(heeft && !bezig && afzetten);
  $('#o-daarna').hidden = !heeft || bezig;
  $('#tijdlijn').hidden = !heeft && !bezig;
  $('#o-tip').hidden = !heeft || bezig;
  if(heeft && !bezig) tekenTijdlijn();
  if(!heeft && !bezig) $('#o-klok').textContent = '';
  if(heeft && !bezig) $('#o-klok').textContent = 'Jullie hoorspel duurt ' + fmt(S.opname.duur);
  renderMee();

  $('#o-geluiden-kop').textContent = bezig ? 'Tik op het goede moment' : heeft ? 'Geluid erbij zetten' : 'Jullie eigen geluiden';
  $('#o-geluiden-uitleg').textContent = bezig ? '' : heeft
    ? (matchMedia('(hover: hover)').matches ? 'Sleep een geluid naar de balk, of tik erop tijdens Luisteren.' : 'Tik tijdens Luisteren op een geluid om het erbij te zetten.')
    : oefent ? 'Tik op een geluid. Iedereen hoort het.' : 'Tik op een geluid om het te horen.';
  const el = $('#o-lijst'); el.innerHTML = '';
  if(!S.geluiden.length){ el.innerHTML = '<div class="leeg-vak">Nog geen geluiden. Die maak je bij stap 02. Zonder geluiden kun je ook opnemen.</div>'; return; }
  S.geluiden.forEach((g, i) => {
    const t = tegel(g, i < 9 ? String(i + 1) : '');
    t.onclick = () => { if(t.dataset.gesleept){ delete t.dataset.gesleept; return; } tikGeluid(g, t); };
    if(heeft && !bezig) sleepUitRij(t, g);
    el.append(t);
  });
}
$('#o-gekozen').onclick = () => ga('muziek');
document.querySelectorAll('[data-kop]').forEach(b => b.onclick = () => {
  S.koptelefoon = b.dataset.kop === '1'; kopGekozen = true; bewaar(); render();
  $('#o-knop').scrollIntoView({block:'center', behavior:'smooth'});
});

/* balk die laat zien welke muziek er meeklinkt */
function renderMee(){
  const el = $('#o-mee');
  const zichtbaar = (oRec || oefent) && (S.muziek || S.sfeer);
  el.hidden = !zichtbaar;
  if(!zichtbaar) return;
  const stukken = [S.muziek, S.sfeer].filter(Boolean).map(id => Bibliotheek.zoek(id)).filter(Boolean);
  const tekst = oefent ? 'Samen oefenen: muziek speelt'
    : S.koptelefoon ? 'Muziek speelt in de koptelefoon'
    : 'Muziek speelt mee';
  el.innerHTML = '<span class="dansers">' + stukken.map(stukGezicht).join('') + '</span><span><b>' + tekst + '</b><small>' +
    stukken.map(s => esc(s.titel)).join(' + ') + (oRec && !S.koptelefoon ? ' · je hoort het bij Luisteren' : '') + '</small></span>';
}
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
    const t = oRec.rec.startTijd != null ? c.currentTime - oRec.rec.startTijd : (Date.now() - oRec.t0) / 1000;
    oRec.tikken.push({g: g.id, t: Math.max(0, t)});
    tekenClips(oRec.tikken, false);
    nuKaart(g);
    if(S.koptelefoon) try{ Geluid.los(await geluidBuffer(g.id)); }catch(e){}
    return;
  }
  if(luister && S.opname){
    /* tijdens terugluisteren: geluid op dit moment toevoegen */
    const t = Math.min(S.opname.duur, c.currentTime - luister.start + luister.vanaf);
    S.opname.tikken.push({g: g.id, t: Math.max(0, t)}); bewaar();
    tekenClips(S.opname.tikken, true);
    nuKaart(g);
    try{ Geluid.los(await geluidBuffer(g.id)); }catch(e){}
    return;
  }
  if(oefent){
    nuKaart(g);
    try{ Geluid.los(await geluidBuffer(g.id)); }catch(e){ toast('Dit geluid is niet meer op dit apparaat.'); }
    return;
  }
  speelGeluid(g, null);
}

/* ---- oefenen ---- */
async function bedLagen(){
  const lagen = [];
  if(S.muziek) lagen.push({buf: await Bibliotheek.laad(S.muziek), vol:0.55, loop:true});
  if(S.sfeer) lagen.push({buf: await Bibliotheek.laad(S.sfeer), vol:0.45, loop:true});
  return lagen;
}
async function startOefenen(){
  stopAlles(); oefent = true; document.body.classList.add('compact', 'oefent'); render(); window.scrollTo(0, 0);
  try{ Geluid.speel(await bedLagen()); speelt = {wat:'oefen', id:'oefen'}; }
  catch(e){ toast('De muziek kan nu niet spelen.'); }
  if(!S.muziek && !S.sfeer) toast('Er is geen muziek gekozen. Je kunt wel met de geluiden oefenen.');
}
function stopOefenen(){ if(!oefent) return; oefent = false; document.body.classList.remove('compact', 'oefent'); Geluid.stop(); speelt = null; render(); }
$('#o-oefen').onclick = () => oefent ? stopOefenen() : startOefenen();

/* ---- tijdlijn: sporen onder elkaar, zoals in MovieMaker ---- */
const PAD = 12, RIJ = 54;
const tNaarX = t => PAD + t * PX;
const xNaarT = x => (x - PAD) / PX;
function tijdlijnBreedte(duur){ return Math.max($('#tijdlijn').clientWidth - 4, Math.ceil(tNaarX(duur)) + 120); }
function bouwTijdlijn(duur){
  const golf = $('#golf'), kop = golf.querySelector('.kop');
  golf.innerHTML = '<div class="liniaal"></div>' +
    '<div class="spoor stem"><span class="spoor-naam">stemmen</span></div>' +
    '<div class="spoor fx"><span class="spoor-naam">geluiden</span></div>' +
    '<div class="spoor bed"><span class="spoor-naam">muziek en plek</span></div>';
  if(kop) golf.append(kop);
  zetBreedte(duur);
}
function zetBreedte(duur){
  const golf = $('#golf'), w = tijdlijnBreedte(duur);
  golf.style.width = w + 'px';
  let html = '';
  for(let s = 0; tNaarX(s) < w - 20; s += 5) html += '<span style="left:' + tNaarX(s) + 'px">' + fmt(s) + '</span>';
  golf.querySelector('.liniaal').innerHTML = html;
}
function zetStreep(t, p){
  const i = document.createElement('i');
  i.style.left = tNaarX(t) + 'px'; i.style.height = Math.max(3, Math.min(52, p * 90)) + 'px';
  $('#golf .spoor.stem').append(i);
}
function tekenBedden(duur){
  const spoor = $('#golf .spoor.bed');
  spoor.querySelectorAll('.strook').forEach(e => e.remove());
  [[S.muziek, 'm'], [S.sfeer, 's']].forEach(([id, soort]) => {
    const s = id && Bibliotheek.zoek(id); if(!s) return;
    const d = document.createElement('div'); d.className = 'strook ' + soort;
    d.style.left = tNaarX(0) + 'px'; d.style.width = Math.max(40, duur * PX) + 'px';
    d.textContent = s.titel; spoor.append(d);
  });
}
function tekenClips(tikken, bewerkbaar){
  const spoor = $('#golf .spoor.fx');
  spoor.querySelectorAll('.clip').forEach(e => e.remove());
  const rijEind = [];
  tikken.map((k, i) => ({k, i})).sort((a, b) => a.k.t - b.k.t).forEach(({k, i}) => {
    const g = S.geluiden.find(x => x.id === k.g); if(!g) return;
    const x = tNaarX(k.t), w = Math.max(150, g.duur * PX);
    let r = rijEind.findIndex(e => e <= x); if(r < 0){ r = rijEind.length; rijEind.push(0); }
    rijEind[r] = x + w + 4;
    const c = document.createElement('div'); c.className = 'clip'; c.dataset.i = i;
    c.style.left = x + 'px'; c.style.width = w + 'px'; c.style.top = (22 + r * RIJ) + 'px';
    c.style.setProperty('--c', 'var(--c-' + g.kleur + ')');
    c.innerHTML = '<span class="gezicht">' + Gezichten.htmlGeluid(g.gez) + '</span><span class="naam"></span>' +
      (bewerkbaar ? '<button type="button" class="kruis" aria-label="' + esc(g.naam) + ' weghalen">✕</button>' : '');
    c.querySelector('.naam').textContent = g.naam;
    if(bewerkbaar){
      c.tabIndex = 0; c.setAttribute('role', 'button');
      c.setAttribute('aria-label', g.naam + ' op ' + fmt(k.t) + '. Sleep of gebruik de pijltjes om te verschuiven.');
      maakVersleepbaar(c, g);
    }
    spoor.append(c);
  });
  spoor.style.height = (Math.max(1, rijEind.length) * RIJ + 24) + 'px';
}
function tekenTijdlijn(){
  const o = S.opname;
  bouwTijdlijn(o.duur);
  (o.pieken || []).forEach((p, i) => zetStreep(i / 4, p));
  tekenBedden(o.duur);
  tekenClips(o.tikken, true);
}

/* ---- geluiden slepen of weghalen ---- */
function maakVersleepbaar(c, g){
  const tl = $('#tijdlijn');
  let x0 = null, s0 = 0, t0 = 0, tNu = 0, geschoven = false;
  c.addEventListener('pointerdown', e => {
    if(oRec || e.target.closest('.kruis')) return;
    x0 = e.clientX; s0 = tl.scrollLeft; t0 = tNu = S.opname.tikken[+c.dataset.i].t; geschoven = false;
    c.setPointerCapture(e.pointerId);
  });
  c.addEventListener('pointermove', e => {
    if(x0 == null) return;
    const dx = e.clientX - x0 + (tl.scrollLeft - s0);
    if(!geschoven && Math.abs(dx) > 6){ geschoven = true; c.classList.add('sleept'); }
    if(!geschoven) return;
    tNu = Math.max(0, Math.min(S.opname.duur, t0 + dx / PX));
    c.style.left = tNaarX(tNu) + 'px';
    const r = tl.getBoundingClientRect();
    if(e.clientX > r.right - 40) tl.scrollLeft += 14; else if(e.clientX < r.left + 40) tl.scrollLeft -= 14;
  });
  c.addEventListener('pointerup', async () => {
    if(x0 == null) return; x0 = null;
    if(geschoven) return zetTik(+c.dataset.i, tNu);
    flits(c);
    try{ Geluid.los(await geluidBuffer(g.id)); }catch(e){}
  });
  c.addEventListener('pointercancel', () => { x0 = null; tekenTijdlijn(); });
  c.addEventListener('click', e => e.stopPropagation());
  c.addEventListener('keydown', e => {
    const i = +c.dataset.i, k = S.opname.tikken[i];
    if(e.key === 'ArrowLeft' || e.key === 'ArrowRight'){ e.preventDefault(); zetTik(i, k.t + (e.key === 'ArrowLeft' ? -0.5 : 0.5)); const n = $('#golf .clip[data-i="' + i + '"]'); if(n) n.focus(); }
    if(e.key === 'Delete' || e.key === 'Backspace'){ e.preventDefault(); verwijderTik(i); }
  });
  const kruis = c.querySelector('.kruis');
  kruis.addEventListener('pointerdown', e => e.stopPropagation());
  kruis.addEventListener('click', e => { e.stopPropagation(); verwijderTik(+c.dataset.i); });
}
function zetTik(i, t){
  const k = S.opname.tikken[i]; if(!k) return;
  k.t = Math.max(0, Math.min(S.opname.duur, Math.round(t * 20) / 20));
  bewaar();
  if(speelt && speelt.wat === 'mix') stopAlles();
  tekenTijdlijn();
}
function verwijderTik(i){
  const k = S.opname.tikken[i]; if(!k) return;
  const g = S.geluiden.find(x => x.id === k.g);
  S.opname.tikken.splice(i, 1); bewaar();
  if(speelt && speelt.wat === 'mix') stopAlles();
  tekenTijdlijn();
  toast((g ? '"' + g.naam + '"' : 'Het geluid') + ' is weggehaald.');
}
/* met de muis een geluid uit de rij de tijdlijn in slepen */
function sleepUitRij(tegelEl, g){
  let start = null, spook = null;
  const binnen = e => { const r = $('#tijdlijn').getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; };
  tegelEl.addEventListener('pointerdown', e => {
    if(e.pointerType === 'touch' || !S.opname || oRec) return;
    start = {x: e.clientX, y: e.clientY}; tegelEl.setPointerCapture(e.pointerId);
  });
  tegelEl.addEventListener('pointermove', e => {
    if(!start) return;
    if(!spook && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8){
      spook = document.createElement('div'); spook.className = 'clip spook';
      spook.style.setProperty('--c', 'var(--c-' + g.kleur + ')');
      spook.innerHTML = '<span class="gezicht">' + Gezichten.htmlGeluid(g.gez) + '</span><span class="naam"></span>';
      spook.querySelector('.naam').textContent = g.naam;
      document.body.append(spook); tegelEl.dataset.gesleept = '1';
    }
    if(!spook) return;
    spook.style.left = e.clientX + 'px'; spook.style.top = e.clientY + 'px';
    $('#tijdlijn').classList.toggle('doel', binnen(e));
    if(e.clientY < 70) window.scrollBy(0, -14); else if(e.clientY > innerHeight - 110) window.scrollBy(0, 14);
  });
  const eind = e => {
    if(!start) return; start = null;
    $('#tijdlijn').classList.remove('doel');
    if(!spook) return;
    spook.remove(); spook = null;
    if(e.type !== 'pointerup' || !binnen(e)) return;
    const gr = $('#golf').getBoundingClientRect();
    const t = Math.max(0, Math.min(S.opname.duur, xNaarT(e.clientX - gr.left)));
    S.opname.tikken.push({g: g.id, t}); bewaar();
    if(speelt && speelt.wat === 'mix') stopAlles();
    tekenTijdlijn();
    toast('"' + g.naam + '" staat erbij.');
  };
  tegelEl.addEventListener('pointerup', eind);
  tegelEl.addEventListener('pointercancel', eind);
}
/* tik op de tijdlijn: luisteren vanaf dat punt */
$('#golf').addEventListener('click', e => {
  if(oRec || !S.opname || e.target.closest('.clip')) return;
  const r = $('#golf').getBoundingClientRect();
  luisterVanaf(Math.max(0, Math.min(S.opname.duur - 0.5, xNaarT(e.clientX - r.left))));
});

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
  oefent = false; document.body.classList.remove('oefent'); stopAlles(); melding($('#o-melding'), '');
  const knop = $('#o-knop'); knop.disabled = true;
  let rec, lagen = [];
  try{ rec = await Geluid.maakRecorder('stem', {niveau: p => { knop.style.setProperty('--niveau', Math.min(1, p * 1.6)); if(oRec && oRec.bezig) oRec.pieken.push(p); }}); }
  catch(e){ knop.disabled = false; render(); melding($('#o-melding'), micFout(e), true); return; }
  if(S.koptelefoon){ try{ lagen = await bedLagen(); }catch(e){} }
  await aftellen();
  knop.disabled = false;
  rec.begin();
  if(lagen.length) Geluid.speel(lagen);
  const t0 = Date.now();
  oRec = {rec, t0, tikken:[], pieken:[], bezig:true, timer:0};
  $('#golf').innerHTML = ''; $('#tijdlijn').hidden = false; bouwTijdlijn(0);
  let getekend = 0;
  oRec.timer = setInterval(() => {
    const s = (Date.now() - t0) / 1000;
    $('#o-klok').textContent = '● ' + fmt(s);
    /* live golfje: elke 0,25 s een streepje */
    while(getekend < s * 4){
      const p = oRec.pieken.length ? Math.max(...oRec.pieken.splice(0)) : 0.02;
      zetStreep(getekend / 4, p); getekend++;
    }
    if(getekend % 4 === 0){ zetBreedte(s); tekenBedden(s); }
    const tl = $('#tijdlijn'); tl.scrollLeft = tl.scrollWidth;
    if(s >= MAX_OPNAME_SEC){ toast('De opname is 5 minuten. Langer kan niet.'); stopOpname(); }
  }, 250);
  zetOpneemknop(knop, 'Stop', true, 'Stop opname');
  houdWakker(true);
  document.body.classList.add('compact', 'neemt-op');
  render();
  window.scrollTo(0, 0);
}
async function stopOpname(){
  if(!oRec) return;
  const r = oRec; r.bezig = false; clearInterval(r.timer);
  Geluid.stop();
  const knop = $('#o-knop'); zetOpneemknop(knop, 'Start<br>opname', false, 'Start opname');
  const {samples, rate} = await r.rec.eind();
  oRec = null; houdWakker(false);
  document.body.classList.remove('compact', 'neemt-op');
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
  $('#o-klok').scrollIntoView({block:'start', behavior:'smooth'});
  if(!ok) toast('Let op: bewaren op dit apparaat lukte niet. Tik op Bewaren.', 5000);
  kopGekozen = false;
  if(S.koptelefoon){ afzetten = true; render(); toast('Opgenomen! Doe de koptelefoon af en tik samen op Luisteren.', 5000); }
  else luisterVanaf(0);   /* meteen samen terugluisteren */
}
$('#o-knop').onclick = () => oRec ? stopOpname() : startOpname();

/* ---- mixen, luisteren, bewaren ---- */
async function maakMix(){
  const o = S.opname;
  const sleutel = [o.id, S.muziek, S.sfeer, S.geluiden.map(g => g.id).join(), JSON.stringify(o.tikken)].join('|');
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
function stopKop(){
  cancelAnimationFrame(kopRaf); kopRaf = 0; luister = null;
  const k = document.querySelector('#golf .kop'); if(k) k.remove();
  $('#o-luister').textContent = '▶ Luisteren';
}
async function luisterVanaf(vanaf){
  stopAlles();
  const knop = $('#o-luister'); knop.textContent = 'Even samenvoegen…'; knop.disabled = true;
  let buf;
  try{ buf = await maakMix(); }
  catch(e){ knop.disabled = false; knop.textContent = '▶ Luisteren'; toast('De opname staat niet meer op dit apparaat. Neem opnieuw op.'); return; }
  knop.disabled = false; knop.textContent = '■ Stoppen';
  const start = Geluid.speel([{buf}], () => { speelt = null; stopKop(); }, vanaf);
  speelt = {wat:'mix', id:'mix'}; luister = {start, vanaf};
  const kop = document.createElement('div'); kop.className = 'kop'; $('#golf').append(kop);
  const c = Geluid.context(), tl = $('#tijdlijn');
  const loop = () => {
    const t = c.currentTime - start + vanaf; const x = tNaarX(Math.max(vanaf, t));
    const k = document.querySelector('#golf .kop'); if(k) k.style.left = x + 'px';
    if(x > tl.scrollLeft + tl.clientWidth - 60 || x < tl.scrollLeft) tl.scrollLeft = x - 60;
    kopRaf = requestAnimationFrame(loop);
  };
  loop();
}
$('#o-luister').onclick = () => { if(afzetten){ afzetten = false; $('#o-afzetten').hidden = true; } (speelt && speelt.wat === 'mix') ? stopAlles() : luisterVanaf(0); };
let opnieuwZeker = 0;
$('#o-opnieuw').onclick = () => {
  const b = $('#o-opnieuw');
  if(!opnieuwZeker){ b.textContent = 'Zeker? Tik nog een keer'; b.classList.add('gevaar'); opnieuwZeker = setTimeout(() => { opnieuwZeker = 0; b.textContent = 'Opnieuw inspreken'; b.classList.remove('gevaar'); }, 3500); return; }
  clearTimeout(opnieuwZeker); opnieuwZeker = 0; b.textContent = 'Opnieuw inspreken'; b.classList.remove('gevaar');
  stopAlles();
  if(S.opname) Opslag.wisAudio(S.opname.id);
  S.opname = null; stemBuf = null; mixCache = null; kopGekozen = false; afzetten = false; bewaar();
  $('#golf').innerHTML = ''; render();
  toast('Oefen nog een keer, of spreek het opnieuw in.');
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
  knop.disabled = false; knop.innerHTML = 'Bewaren<small>als mp3-bestand</small>';
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
