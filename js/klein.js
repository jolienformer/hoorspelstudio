/* Hoorspelstudio Klein: voor groep 1 tot en met 4. Geen tekst, grote knoppen, geen koptelefoon.
   1 muziek en plek kiezen  2 opnemen: verhaal en geluiden tegelijk, in stilte.
   Daarna zet de computer muziek en plek eronder en klinkt alles samen. */
(() => {
const $ = s => document.querySelector(s);
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const STAPPEN = ['muziek', 'opnemen'];
const MAX_VERHAAL_SEC = 180, BALK_SEC = 30, PER_SEC = 10;
const esc = t => String(t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* silhouet-icoontjes (geen tekens als ▶: die tekent iOS als emoji) */
const L = 'fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"';
const IK = {
  noot: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l11-2v13" ' + L + '/><circle cx="6" cy="18" r="3" fill="currentColor"/><circle cx="17" cy="16" r="3" fill="currentColor"/></svg>',
  plek: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-7.4 7-13a7 7 0 0 0-14 0c0 5.6 7 13 7 13z" fill="currentColor"/><circle cx="12" cy="9" r="2.6" fill="var(--paper)"/></svg>',
  mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="2" width="7" height="12.5" rx="3.5" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5M8 21.5h8" ' + L + '/></svg>',
  praat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 4.5h17v11.5H10l-5.5 4.5v-4.5h-1z" fill="currentColor"/><circle cx="8.5" cy="10.2" r="1.3" fill="var(--paper)"/><circle cx="12" cy="10.2" r="1.3" fill="var(--paper)"/><circle cx="15.5" cy="10.2" r="1.3" fill="var(--paper)"/></svg>',
  speel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/></svg>',
  stop: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2.5" fill="currentColor"/></svg>',
  pauze: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.5h4v15H6zM14 4.5h4v15h-4z" fill="currentColor"/></svg>',
  verder: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 5.5l6.5 6.5-6.5 6.5" ' + L + ' stroke-width="3.2"/></svg>',
  terug: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H5M11 5.5L4.5 12l6.5 6.5" ' + L + ' stroke-width="3.2"/></svg>',
  opnieuw: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" ' + L + ' stroke-width="3"/><path d="M4 3.5v5h5" ' + L + ' stroke-width="3"/></svg>',
  bewaar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5v11M6.5 9.5l5.5 5.5 5.5-5.5M4.5 20h15" ' + L + ' stroke-width="3"/></svg>',
  hulp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 9h4l5-4.5v15l-5-4.5h-4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.8 5.5a9 9 0 0 1 0 13" ' + L + '/></svg>',
  kruis: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" ' + L + ' stroke-width="3.2"/></svg>',
  vink: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12.5l5 5 10-11" ' + L + ' stroke-width="3.4"/></svg>'
};
const STAP_IK = {muziek: 'noot', opnemen: 'mic'};

/* gesproken uitleg (de kinderen lezen nog niet) */
const UITLEG = {
  muziek: 'Kies muziek. Tik op een gezichtje en luister. Vind je het mooi? Dan is het gekozen. Tik daarna op de speld, en kies waar jullie verhaal is.',
  opnemen: 'Vertel jullie verhaal. Tik op de rode knop. Na drie, twee, één mag je beginnen. Maak er zelf geluiden bij, met je stem of met spullen. Ben je klaar? Tik op het vierkantje. Dan komt de muziek eronder.'
};
function spreek(tekst){
  const ss = window.speechSynthesis; if(!ss) return;
  ss.cancel();
  const u = new SpeechSynthesisUtterance(tekst); u.lang = 'nl-NL'; u.rate = 0.92;
  const stem = ss.getVoices().find(v => /^nl/i.test(v.lang)); if(stem) u.voice = stem;
  ss.speak(u);
}

let S = {stap:'muziek', soort:'gevoel', muziek:null, sfeer:null, verhaal:null};
const bewaar = () => Opslag.bewaarStaat(S);

/* ---------- afspelen: één ding tegelijk ---------- */
let speelt = null;   // {wat, id}
function stopAlles(){ Geluid.stop(); speelt = null; cancelAnimationFrame(balkRaf); renderKnoppen(); }

/* ================= navigatie ================= */
function ga(stap){
  if(vRec) return;
  stopAlles(); if(window.speechSynthesis) speechSynthesis.cancel();
  S.stap = stap; bewaar();
  render(); window.scrollTo(0, 0);
}
document.querySelectorAll('.k-stap').forEach(b => { b.innerHTML = IK[STAP_IK[b.dataset.stap]] + '<span class="k-ok" aria-hidden="true">' + IK.vink + '</span>'; b.onclick = () => ga(b.dataset.stap); });
$('#terug').innerHTML = IK.terug; $('#verder').innerHTML = IK.verder; $('#hulp').innerHTML = IK.hulp;
$('#terug').onclick = () => { const i = STAPPEN.indexOf(S.stap); if(i > 0) ga(STAPPEN[i - 1]); };
$('#verder').onclick = () => { const i = STAPPEN.indexOf(S.stap); if(i < STAPPEN.length - 1) ga(STAPPEN[i + 1]); };
$('#hulp').onclick = () => spreek(UITLEG[S.stap]);

function render(){
  const klaar = {muziek: !!(S.muziek || S.sfeer), opnemen: !!S.verhaal};
  STAPPEN.forEach(n => $('#s-' + n).hidden = n !== S.stap);
  document.querySelectorAll('.k-stap').forEach(b => {
    b.classList.toggle('klaar', klaar[b.dataset.stap]);
    if(b.dataset.stap === S.stap) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
  });
  const i = STAPPEN.indexOf(S.stap);
  $('#terug').hidden = i === 0;
  $('#verder').hidden = i === STAPPEN.length - 1;
  if(S.stap === 'muziek') renderMuziek();
  if(S.stap === 'opnemen') renderOpnemen();
}

/* ================= 1 muziek en plek ================= */
const lijstVan = soort => soort === 'gevoel' ? Bibliotheek.GEVOEL : Bibliotheek.PLEK;
const slotVan = soort => soort === 'gevoel' ? 'muziek' : 'sfeer';
const groepVan = s => [...Bibliotheek.GEVOEL, ...Bibliotheek.PLEK].find(g => g.id === s.groep);
const stukGezicht = s => { const g = groepVan(s); return '<span class="gezicht" style="--c:var(--c-' + g.kleur + ')">' + Gezichten.html((window.GEZICHTEN || {})[s.id] ? s.id : g.id, g.uitdr) + '</span>'; };

function renderMuziek(){
  document.querySelectorAll('.k-vak').forEach(v => {
    const soort = v.dataset.soort, s = S[slotVan(soort)] && Bibliotheek.zoek(S[slotVan(soort)]);
    v.querySelector('.k-vak-ik').innerHTML = IK[v.querySelector('.k-vak-ik').dataset.ik];
    v.querySelector('.k-vak-keus').innerHTML = s ? stukGezicht(s) : '<span class="k-leeg"></span>';
    v.classList.toggle('open', S.soort === soort);
    v.setAttribute('aria-pressed', String(S.soort === soort));
  });
  $('#samen').hidden = !(S.muziek && S.sfeer);
  const el = $('#raster'); el.innerHTML = '';
  lijstVan(S.soort).forEach(g => {
    const blok = document.createElement('div'); blok.className = 'k-groepblok';
    /* naam van het gevoel of de plek; een tik leest hem voor */
    const kop = document.createElement('button'); kop.type = 'button'; kop.className = 'k-groepnaam';
    kop.innerHTML = '<span>' + esc(g.naam) + '</span>' + IK.hulp; kop.setAttribute('aria-label', g.naam + ', voorlezen');
    kop.onclick = () => spreek(g.naam);
    const rij = document.createElement('div'); rij.className = 'k-groep'; rij.setAttribute('aria-label', g.naam);
    blok.append(kop, rij);
    g.stukken.forEach(s => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'k-tegel'; b.dataset.speel = s.id;
      b.setAttribute('aria-label', s.titel);
      b.innerHTML = stukGezicht(s) + '<span class="k-badge" aria-hidden="true"></span>';
      b.onclick = () => tikStuk(s);
      rij.append(b);
    });
    el.append(blok);
  });
  renderKnoppen();
}
document.querySelectorAll('.k-vak').forEach(v => v.onclick = () => {
  if(S.soort === v.dataset.soort) return;
  stopAlles(); S.soort = v.dataset.soort; bewaar(); renderMuziek();
});
function renderKnoppen(){
  document.querySelectorAll('.k-tegel[data-speel]').forEach(b => {
    const s = Bibliotheek.zoek(b.dataset.speel);
    const aan = speelt && speelt.wat === 'stuk' && speelt.id === b.dataset.speel;
    const laadt = speelt && speelt.wat === 'laden' && speelt.id === b.dataset.speel;
    const gekozen = s && S[slotVan(s.soort)] === s.id;
    b.classList.toggle('speelt', !!aan); b.classList.toggle('gekozen', !!gekozen); b.classList.toggle('laadt', !!laadt);
    b.querySelector('.k-badge').innerHTML = aan ? IK.stop : gekozen ? IK.vink : IK.speel;
    b.setAttribute('aria-pressed', String(!!gekozen));
  });
  const samen = speelt && speelt.wat === 'samen';
  $('#samen').innerHTML = samen ? IK.stop : IK.speel; $('#samen').classList.toggle('aan', !!samen);
  /* samen luisteren: beide vakken geel, want ze klinken allebei */
  document.querySelectorAll('.k-vak').forEach(v => v.classList.toggle('beide', !!samen));
  if(S.stap === 'opnemen') renderLuisterKnop();
}
function tikStuk(s){
  if(speelt && speelt.id === s.id){ stopAlles(); return; }
  S[slotVan(s.soort)] = s.id; S.verhaal && (mixCache = null); bewaar();
  renderMuziek(); speelStuk(s.id);
}
async function speelStuk(id){
  Geluid.stop(); speelt = {wat:'laden', id}; renderKnoppen();
  try{
    const buf = await Bibliotheek.laad(id);
    if(!speelt || speelt.id !== id) return;
    Geluid.speel([{buf, vol:0.85, loop:true}]); speelt = {wat:'stuk', id};
  }catch(e){ speelt = null; }
  renderKnoppen();
}
async function samenLuisteren(){
  if(speelt && speelt.wat === 'samen'){ stopAlles(); return; }
  Geluid.stop(); speelt = {wat:'samen', id:'samen'}; renderKnoppen();
  try{
    const lagen = [];
    if(S.muziek) lagen.push({buf: await Bibliotheek.laad(S.muziek), vol:0.6, loop:true});
    if(S.sfeer) lagen.push({buf: await Bibliotheek.laad(S.sfeer), vol:0.5, loop:true});
    if(!speelt || speelt.wat !== 'samen') return;
    Geluid.speel(lagen);
  }catch(e){ speelt = null; renderKnoppen(); }
}
$('#samen').onclick = samenLuisteren;

/* niets gehoord of geen microfoon: schudden, en de app zegt het hardop */
function schud(el){ el.classList.remove('schud'); void el.offsetWidth; el.classList.add('schud'); }
function micProbleem(el){ schud(el); spreek('De microfoon doet het niet. Vraag het aan de juf of meester.'); }

/* ================= 2 opnemen ================= */
/* S.verhaal = {id, duur, pieken:[0..1, PER_SEC per seconde]} */
let vRec = null, mixCache = null, balkRaf = 0, speelPos = null;   /* speelPos: {start, vanaf} tijdens luisteren */
/* balans: muziek en plek zachter (stemmen duidelijker) of voller */
const BALANS = {'-2': 1.6, '-1': 1.25, '0': 1, '1': 0.6, '2': 0.35};
const stemBufs = new Map();

/* ---- tijdbalk: het golfje van de opname; vol bij een halve minuut, daarna schuift alles in elkaar ---- */
function tekenGolf(pieken, duur){
  const cv = $('#golf'), r = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
  if(!w) return;
  cv.width = Math.round(w * r); cv.height = Math.round(h * r);
  const g = cv.getContext('2d'); g.scale(r, r); g.clearRect(0, 0, w, h);
  const schaal = Math.max(BALK_SEC, duur), stap = 4;   /* om de 4 px een streepje */
  const kleur = getComputedStyle(cv).color;
  g.fillStyle = kleur;
  const breed = Math.min(w, w * duur / schaal);
  for(let x = 0; x < breed; x += stap){
    const i0 = Math.floor(x / w * schaal * PER_SEC), i1 = Math.max(i0 + 1, Math.floor((x + stap) / w * schaal * PER_SEC));
    let p = 0; for(let i = i0; i < i1 && i < pieken.length; i++) p = Math.max(p, pieken[i]);
    const hh = Math.max(3, Math.min(h - 8, p * (h - 8)));
    g.beginPath(); g.roundRect ? g.roundRect(x, (h - hh) / 2, stap - 1.5, hh, 1.5) : g.rect(x, (h - hh) / 2, stap - 1.5, hh); g.fill();
  }
}
const zetKop = (t, duur) => { $('#kop').style.left = 'calc(12px + ' + Math.min(1, t / Math.max(BALK_SEC, duur)).toFixed(4) + ' * (100% - 24px))'; };

function renderOpnemen(){
  const heeft = !!S.verhaal, bezig = !!vRec;
  document.body.classList.toggle('neemt-op', bezig);
  $('#v-opneem').hidden = heeft && !bezig;
  $('#v-klaar').hidden = !heeft || bezig;
  $('#v-knop').classList.toggle('aan', bezig);
  $('#v-knop').setAttribute('aria-label', bezig ? 'Stop' : 'Opnemen');
  $('#v-opnieuw').innerHTML = IK.opnieuw; $('#v-bewaar').innerHTML = IK.bewaar;
  $('#v-balans').hidden = !(S.muziek || S.sfeer);
  $('#v-balans-schuif').value = S.balans || 0;
  $('#tijdbalk').classList.toggle('leeg', !heeft && !bezig);
  if(!bezig){
    tekenGolf(heeft ? S.verhaal.pieken || [] : [], heeft ? S.verhaal.duur : 0);
    zetKop(0, heeft ? S.verhaal.duur : 0);
    $('#kop').hidden = !heeft;
  }
  renderLuisterKnop();
}
window.addEventListener('resize', () => { if(S.stap === 'opnemen' && !vRec) tekenGolf(S.verhaal ? S.verhaal.pieken || [] : [], S.verhaal ? S.verhaal.duur : 0); });
function renderLuisterKnop(){
  const aan = speelt && speelt.wat === 'mix', laadt = speelt && speelt.wat === 'mixen';
  $('#v-luister').innerHTML = laadt ? '<span class="k-draai" aria-hidden="true"></span>' : aan ? IK.pauze : IK.speel;
  $('#v-luister').classList.toggle('aan', !!aan);
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
let wakeLock = null;
async function houdWakker(aan){
  try{
    if(aan && 'wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    else if(!aan && wakeLock){ await wakeLock.release(); wakeLock = null; }
  }catch(e){}
}
async function startOpname(){
  stopAlles();
  const knop = $('#v-knop'); knop.disabled = true;
  let rec, piek = 0;
  try{ rec = await Geluid.maakRecorder('stem', {niveau: p => { piek = Math.max(piek, p); knop.style.setProperty('--niveau', Math.min(1, p * 1.8)); }}); }
  catch(e){ knop.disabled = false; micProbleem(knop); return; }
  await aftellen();
  knop.disabled = false; rec.begin();
  const t0 = Date.now(), live = [];
  vRec = {rec, t0, live, timer: setTimeout(stopOpname, MAX_VERHAAL_SEC * 1000)};
  houdWakker(true); render();
  $('#kop').hidden = false;
  /* het golfje groeit mee: elke 0,1 s een stukje */
  vRec.iv = setInterval(() => {
    const t = (Date.now() - t0) / 1000;
    while(live.length < t * PER_SEC){ live.push(Math.min(1, piek * 1.6)); piek = 0; }
    tekenGolf(live, t); zetKop(t, t);
  }, 100);
}
async function stopOpname(){
  if(!vRec) return;
  const r = vRec; clearTimeout(r.timer); clearInterval(r.iv);
  const {samples, rate} = await r.rec.eind();
  vRec = null; houdWakker(false);
  $('#v-knop').style.setProperty('--niveau', 0);
  if(!samples.length || Geluid.isStil(samples)){ render(); schud($('#v-knop')); return; }
  if(S.verhaal){ Opslag.wisAudio(S.verhaal.id); stemBufs.delete(S.verhaal.id); }
  /* golfje voor later: gemiddelde sterkte per 0,1 s, op schaal van deze opname */
  const stap = Math.round(rate / PER_SEC), ruw = [];
  for(let i = 0; i < samples.length; i += stap){ let som = 0, m = 0; for(let j = i; j < Math.min(samples.length, i + stap); j += 2){ som += samples[j] * samples[j]; m++; } ruw.push(Math.sqrt(som / Math.max(1, m))); }
  const hoog = [...ruw].sort((a, b) => a - b)[Math.floor(ruw.length * 0.95)] || 0.001;
  const v = {id: uid('v_'), duur: samples.length / rate, pieken: ruw.map(x => +Math.min(1, x / hoog).toFixed(2))};
  stemBufs.set(v.id, Geluid.samplesNaarBuffer(samples, rate)); mixCache = null;
  S.verhaal = v; await Opslag.bewaarAudio(v.id, Geluid.wav([samples], rate)); bewaar();
  render();
  luister();   /* meteen de verrassing: alles samen */
}
$('#v-knop').onclick = () => vRec ? stopOpname() : startOpname();

async function stemBuffer(id){
  if(stemBufs.has(id)) return stemBufs.get(id);
  const blob = await Opslag.leesAudio(id); if(!blob) throw new Error('weg');
  const b = await Geluid.blobNaarBuffer(blob); stemBufs.set(id, b); return b;
}
async function maakMix(){
  const v = S.verhaal;
  const sleutel = [S.muziek, S.sfeer, v.id, S.balans || 0].join('|');
  const f = BALANS[S.balans || 0] || 1;
  if(mixCache && mixCache.sleutel === sleutel) return mixCache.buf;
  const buf = await Geluid.mix({
    stemmen: [{buf: await stemBuffer(v.id), t: 0}],
    muziek: S.muziek ? await Bibliotheek.laad(S.muziek) : null,
    sfeer: S.sfeer ? await Bibliotheek.laad(S.sfeer) : null,
    tikken: [], muziekVol: f, sfeerVol: f
  });
  mixCache = {sleutel, buf};
  return buf;
}
async function luister(vanaf = 0){
  if(speelt && speelt.wat === 'mix'){ stopAlles(); zetKop(0, S.verhaal.duur); return; }
  stopAlles(); speelt = {wat:'mixen'}; renderLuisterKnop();
  let buf;
  try{ buf = await maakMix(); }catch(e){ speelt = null; renderLuisterKnop(); schud($('#v-luister')); return; }
  if(!speelt || speelt.wat !== 'mixen') return;
  const c = Geluid.context(), duur = S.verhaal.duur;
  const start = Geluid.speel([{buf}], () => { speelt = null; speelPos = null; cancelAnimationFrame(balkRaf); zetKop(0, duur); renderLuisterKnop(); }, vanaf);
  speelt = {wat:'mix'}; speelPos = {start, vanaf}; renderLuisterKnop();
  const loop = () => { zetKop(Math.max(0, c.currentTime - start + vanaf), duur); balkRaf = requestAnimationFrame(loop); };
  loop();
}
$('#v-luister').onclick = () => luister();
$('#v-balans-schuif').onchange = e => {
  S.balans = +e.target.value; bewaar(); mixCache = null;
  /* speelt het al? dan meteen verder op dezelfde plek, met de nieuwe balans */
  if(speelt && speelt.wat === 'mix' && speelPos){ const pos = Geluid.context().currentTime - speelPos.start + speelPos.vanaf; stopAlles(); luister(pos); }
};
let opnieuwZeker = 0;
$('#v-opnieuw').onclick = () => {
  const b = $('#v-opnieuw');
  if(!opnieuwZeker){ b.classList.add('zeker'); opnieuwZeker = setTimeout(() => { opnieuwZeker = 0; b.classList.remove('zeker'); }, 3000); return; }
  clearTimeout(opnieuwZeker); opnieuwZeker = 0; b.classList.remove('zeker');
  stopAlles();
  Opslag.wisAudio(S.verhaal.id); stemBufs.delete(S.verhaal.id);
  S.verhaal = null; mixCache = null; bewaar();
  render();
};
$('#v-bewaar').onclick = async () => {
  const knop = $('#v-bewaar'); knop.disabled = true; knop.innerHTML = '<span class="k-draai" aria-hidden="true"></span>';
  const d = new Date(), naam = 'Hoorspel ' + d.getDate() + '-' + (d.getMonth() + 1) + ' ' + String(d.getHours()).padStart(2, '0') + '.' + String(d.getMinutes()).padStart(2, '0');
  try{
    const buf = await maakMix();
    let blob, ext = 'mp3';
    try{ blob = await Geluid.naarMp3(buf); }catch(e){ blob = Geluid.bufferNaarWav(buf); ext = 'wav'; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = naam + '.' + ext;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    knop.innerHTML = IK.vink; knop.classList.add('gelukt');
    setTimeout(() => { knop.innerHTML = IK.bewaar; knop.classList.remove('gelukt'); }, 2500);
  }catch(e){ knop.innerHTML = IK.bewaar; schud(knop); }
  knop.disabled = false;
};

/* ================= leerkracht ================= */
$('#bronnen').innerHTML = [...Bibliotheek.GEVOEL, ...Bibliotheek.PLEK].flatMap(m => m.stukken.filter(x => x.bron).map(x => '<li><b>' + esc(x.titel) + '</b> · ' + esc(x.bron) + '</li>')).join('');
$('#leerkracht-knop').onclick = () => { const d = $('#leerkracht'); d.showModal(); d.scrollTop = 0; $('#lk-titel').focus(); };
$('#lk-sluit').onclick = () => $('#leerkracht').close();
let wisZeker = 0;
$('#wis-alles').onclick = async () => {
  const b = $('#wis-alles');
  if(!wisZeker){ b.textContent = 'Zeker weten? Tik nog een keer'; wisZeker = setTimeout(() => { wisZeker = 0; b.textContent = 'Nieuw hoorspel beginnen'; }, 4000); return; }
  clearTimeout(wisZeker);
  stopAlles(); await Opslag.wisAlles(); location.reload();
};

/* geluid mag pas na een tik starten (iPad) */
document.addEventListener('pointerdown', () => Geluid.context(), {once:true, capture:true});
window.addEventListener('beforeunload', e => { if(vRec){ e.preventDefault(); e.returnValue = ''; } });
if(window.speechSynthesis) speechSynthesis.getVoices();   /* stemmen alvast laden */

(async function start(){
  await Opslag.start();
  const oud = await Opslag.leesStaat();
  if(oud && typeof oud === 'object') S = Object.assign(S, oud);
  if(!STAPPEN.includes(S.stap)) S.stap = 'muziek';
  render();
})();
})();
