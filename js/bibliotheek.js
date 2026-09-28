/* De bibliotheek met muziek (op gevoel) en sfeergeluid (op plek).

   Voorlopig worden alle stukjes in de browser gemaakt ("synth").
   Later komen hier echte, rechtenvrije bestanden bij. Zet dan bij een stukje:
     bestand: 'audio/muziek/spannend-1.mp3', bron: 'Naam maker, licentie CC0'
   Een stukje met een bestand gebruikt dat bestand, anders de synth.
   Alles wordt bij het laden op dezelfde sterkte gebracht (muziek 0,15 en plek 0,1 rms). */
(() => {
const M = (id, naam, kleur, uitdr, stukken) => ({id, naam, kleur, uitdr, stukken});

const GEVOEL = [
  M('spannend', 'Spannend', 'blauw', 'bang', [
    {titel:'Sluipen', synth:'spannend', v:0, bestand:'audio/muziek/spannend-1.mp3', bron:'"Sneaky Snitch" Kevin MacLeod (incompetech.com), CC BY 4.0'},
    {titel:'Wie is daar?', synth:'spannend', v:1, bestand:'audio/muziek/spannend-2.mp3', bron:'"Crypto" Kevin MacLeod (incompetech.com), CC BY 4.0'}]),
  M('eng', 'Eng', 'paars', 'schrik', [
    {titel:'Spookhuis', synth:'eng', v:0},
    {titel:'Iets onder het bed', synth:'eng', v:1}]),
  M('vrolijk', 'Vrolijk', 'geel', 'blij', [
    {titel:'Zonnige ochtend', synth:'vrolijk', v:0},
    {titel:'Huppelpas', synth:'vrolijk', v:1}]),
  M('droevig', 'Droevig', 'blauw', 'verdrietig', [
    {titel:'Regen op het raam', synth:'droevig', v:0},
    {titel:'Afscheid', synth:'droevig', v:1}]),
  M('geheimzinnig', 'Geheimzinnig', 'groen', 'sluw', [
    {titel:'De verborgen kamer', synth:'geheimzinnig', v:0},
    {titel:'Het oude boek', synth:'geheimzinnig', v:1}]),
  M('magisch', 'Magisch', 'roze', 'verwonderd', [
    {titel:'Sterrenstof', synth:'magisch', v:0},
    {titel:'De toverspreuk', synth:'magisch', v:1}]),
  M('achtervolging', 'Achtervolging', 'oranje', 'schrik', [
    {titel:'Op de vlucht', synth:'achtervolging', v:0},
    {titel:'Race tegen de klok', synth:'achtervolging', v:1}]),
  M('stoer', 'Stoer', 'rood', 'boos', [
    {titel:'De held komt eraan', synth:'stoer', v:0},
    {titel:'Het grote gevecht', synth:'stoer', v:1}]),
  M('grappig', 'Grappig', 'geel', 'lachen', [
    {titel:'Oeps!', synth:'grappig', v:0},
    {titel:'Het rare dier', synth:'grappig', v:1}]),
  M('dromerig', 'Dromerig', 'paars', 'slaperig', [
    {titel:'Wolken kijken', synth:'dromerig', v:0},
    {titel:'In een droom', synth:'dromerig', v:1}]),
  M('feestelijk', 'Feestelijk', 'oranje', 'lachen', [
    {titel:'Hoera!', synth:'feestelijk', v:0},
    {titel:'Het grote feest', synth:'feestelijk', v:1}]),
  M('rustig', 'Rustig', 'groen', 'tevreden', [
    {titel:'Theetijd', synth:'rustig', v:0},
    {titel:'Lezen in de zon', synth:'rustig', v:1}]),
  M('hoopvol', 'Hoopvol', 'roze', 'tevreden', [
    {titel:'Een nieuw begin', synth:'hoopvol', v:0},
    {titel:'Toch weer vrienden', synth:'hoopvol', v:1}])
];

const PLEK = [
  M('bos', 'Bos', 'groen', 'tevreden', [
    {titel:'Vogels in het bos', synth:'bos', v:0, bestand:'audio/plek/bos-1.mp3', bron:'GammaGool (freesound.org/s/850507), CC0'},
    {titel:'Bos bij nacht', synth:'bos', v:1, bestand:'audio/plek/bos-2.mp3', bron:'fribergmusic2024 (freesound.org/s/719558), CC0'}]),
  M('zee', 'Zee', 'blauw', 'verwonderd', [
    {titel:'Golven op het strand', synth:'zee', v:0},
    {titel:'Storm op zee', synth:'zee', v:1}]),
  M('stad', 'Stad', 'bruin', 'sluw', [
    {titel:'Drukke straat', synth:'stad', v:0},
    {titel:'Stad bij nacht', synth:'stad', v:1}]),
  M('kasteel', 'Kasteel', 'paars', 'bang', [
    {titel:'De grote zaal', synth:'kasteel', v:0},
    {titel:'De kerker', synth:'kasteel', v:1}]),
  M('ruimte', 'Ruimte', 'blauw', 'verwonderd', [
    {titel:'In het ruimteschip', synth:'ruimte', v:0},
    {titel:'Zweven tussen de sterren', synth:'ruimte', v:1}]),
  M('onderwater', 'Onder water', 'groen', 'verwonderd', [
    {titel:'Bubbels', synth:'onderwater', v:0},
    {titel:'Diepe zee', synth:'onderwater', v:1}]),
  M('weer', 'Regen en onweer', 'blauw', 'verdrietig', [
    {titel:'Regen', synth:'weer', v:0},
    {titel:'Onweer', synth:'weer', v:1}]),
  M('nacht', 'Nacht', 'paars', 'slaperig', [
    {titel:'Krekels', synth:'nacht', v:0},
    {titel:'Uil in de nacht', synth:'nacht', v:1}]),
  M('school', 'School', 'oranje', 'blij', [
    {titel:'Klas vol kinderen', synth:'school', v:0},
    {titel:'De lege gang', synth:'school', v:1}]),
  M('kermis', 'Kermis', 'rood', 'lachen', [
    {titel:'Druk op de kermis', synth:'kermis', v:0},
    {titel:'Botsauto\'s', synth:'kermis', v:1}]),
  M('boerderij', 'Boerderij', 'bruin', 'blij', [
    {titel:'Koeien en kippen', synth:'boerderij', v:0},
    {titel:'Kippenhok', synth:'boerderij', v:1}]),
  M('oerwoud', 'Oerwoud', 'groen', 'schrik', [
    {titel:'Apen en vogels', synth:'oerwoud', v:0},
    {titel:'Kikkers in de regen', synth:'oerwoud', v:1}])
];

[['gevoel', GEVOEL], ['plek', PLEK]].forEach(([soort, lijst]) => lijst.forEach(g => g.stukken.forEach((s, i) => {
  s.id = g.id + '-' + (i + 1); s.soort = soort; s.groep = g.id;
})));
const ALLE = [...GEVOEL, ...PLEK].flatMap(g => g.stukken);
const zoek = id => ALLE.find(s => s.id === id) || null;

/* ================= synth ================= */
const RATE = 44100;
const rnd = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
const TOON = {
  majeur:[0,2,4,5,7,9,11], mineur:[0,2,3,5,7,8,10], frygisch:[0,1,4,5,7,8,10],
  heel:[0,2,4,6,8,10], penta:[0,2,4,7,9]
};

function nieuw(sec){
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const staart = 2.5;
  const oc = new OAC(2, Math.ceil((sec + staart) * RATE), RATE);
  const uit = oc.createGain(); uit.gain.value = 0.8;
  const comp = oc.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3;
  uit.connect(comp); comp.connect(oc.destination);
  return {oc, uit, sec};
}
/* rendert en vouwt de staart terug naar het begin: zo loopt de lus naadloos */
async function klaar({oc, sec}){
  const b = await new Promise((res, rej) => { oc.oncomplete = e => res(e.renderedBuffer); const p = oc.startRendering(); if(p && p.then) p.then(res, rej); });
  const n = Math.round(sec * RATE);
  const lus = Geluid.context().createBuffer(2, n, RATE);
  for(let k = 0; k < 2; k++){
    const bron = b.getChannelData(k), doel = lus.getChannelData(k);
    doel.set(bron.subarray(0, n));
    for(let i = n; i < bron.length; i++) doel[(i - n) % n] += bron[i];
  }
  /* alle stukjes even hard */
  let piek = 0;
  for(let k = 0; k < 2; k++){ const d = lus.getChannelData(k); for(let i = 0; i < d.length; i++){ const v = Math.abs(d[i]); if(v > piek) piek = v; } }
  if(piek > 0){ const f = 0.6 / piek; for(let k = 0; k < 2; k++){ const d = lus.getChannelData(k); for(let i = 0; i < d.length; i++) d[i] *= f; } }
  return lus;
}
function ruis(oc, sec, soort = 'wit'){
  const b = oc.createBuffer(1, Math.ceil(sec * RATE), RATE), d = b.getChannelData(0);
  let last = 0;
  for(let i = 0; i < d.length; i++){
    const w = Math.random() * 2 - 1;
    if(soort === 'bruin'){ last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    else d[i] = w;
  }
  return b;
}
function filter(oc, type, f, q = 0.7){ const x = oc.createBiquadFilter(); x.type = type; x.frequency.value = f; x.Q.value = q; return x; }
function pan(oc, p){ if(!oc.createStereoPanner) return oc.createGain(); const x = oc.createStereoPanner(); x.pan.value = p; return x; }
function keten(...nodes){ for(let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]); return nodes[nodes.length - 1]; }

/* toon met omhullende */
function noot(S, {f, t, dur, type = 'sine', vol = 0.2, a = 0.01, r = 0.2, naar, p = 0, filt}){
  const {oc, uit} = S;
  const o = oc.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
  if(naar) o.frequency.exponentialRampToValueAtTime(naar, t + dur);
  const g = oc.createGain(); g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + a);
  g.gain.setValueAtTime(vol, t + Math.max(a, dur - r));
  g.gain.linearRampToValueAtTime(0, t + dur);
  const ketting = [o]; if(filt) ketting.push(filter(oc, 'lowpass', filt)); ketting.push(g, pan(oc, p), uit);
  keten(...ketting); o.start(t); o.stop(t + dur + 0.05);
}
function tik(S, {t, dur = 0.1, type = 'highpass', f = 6000, vol = 0.2, p = 0, q = 0.7}){
  const {oc, uit} = S;
  const s = oc.createBufferSource(); s.buffer = ruis(oc, dur + 0.05);
  const g = oc.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  keten(s, filter(oc, type, f, q), g, pan(oc, p), uit); s.start(t);
}
function kick(S, t, vol = 0.7){ noot(S, {f:120, naar:40, t, dur:0.3, vol, a:0.003, r:0.25}); }

/* ---------- muziek ---------- */
const MUZIEK = {
  spannend:     {toon:'mineur', bpm:92, grond:45, akk:[0,5,3,4], lagen:['puls','drone','hart','hoog']},
  eng:          {toon:'frygisch', bpm:60, grond:40, akk:[0,1,0,1], lagen:['drone','bellen-eng','melodie-eng']},
  vrolijk:      {toon:'majeur', bpm:120, grond:48, akk:[0,5,3,4], lagen:['arp','bas','kick','hihat']},
  droevig:      {toon:'mineur', bpm:66, grond:45, akk:[0,5,2,6], lagen:['pad','melodie']},
  geheimzinnig: {toon:'heel', bpm:80, grond:50, akk:[0,1,0,2], lagen:['arp-zacht','drone']},
  magisch:      {toon:'penta', bpm:100, grond:60, akk:[0,3,1,4], lagen:['bellen','pad']},
  achtervolging:{toon:'mineur', bpm:150, grond:38, akk:[0,0,5,6], maten:8, lagen:['puls16','kick4','snare','hihat']},
  stoer:        {toon:'mineur', bpm:100, grond:40, akk:[0,5,6,4], lagen:['macht','kick','snare']},
  grappig:      {toon:'majeur', bpm:128, grond:50, akk:[0,3,4,0], lagen:['bas-spring','arp-kort','hihat']},
  dromerig:     {toon:'majeur', bpm:70, grond:53, akk:[0,3,5,4], lagen:['pad','arp-zacht','bellen']},
  feestelijk:   {toon:'majeur', bpm:128, grond:50, akk:[0,4,5,3], lagen:['arp','bas','kick4','snare','hihat']},
  rustig:       {toon:'majeur', bpm:72, grond:48, akk:[0,3,0,4], lagen:['pad','melodie']},
  hoopvol:      {toon:'majeur', bpm:84, grond:45, akk:[5,3,0,4], lagen:['pad','arp-zacht']}
};

function maakMuziek(naam, v){
  const P = MUZIEK[naam]; const r = rnd(naam.length * 97 + v * 13 + 7);
  const grond = P.grond + (v ? [3, -2, 5][naam.length % 3] : 0);
  const tel = 60 / P.bpm, maten = P.maten || 4, sec = maten * 4 * tel;
  const S = nieuw(sec); const ladder = TOON[P.toon];
  const stapNaarMidi = s => grond + ladder[((s % ladder.length) + ladder.length) % ladder.length] + 12 * Math.floor(s / ladder.length);
  const akkoord = m => { const d = P.akk[m % P.akk.length]; return [d, d + 2, d + 4].map(stapNaarMidi); };
  const patroon = v ? [0, 2, 1, 2, 0, 2, 1, 2] : [0, 1, 2, 1, 0, 1, 2, 1];

  for(let m = 0; m < maten; m++){
    const t0 = m * 4 * tel, ak = akkoord(m);
    P.lagen.forEach(laag => {
      switch(laag){
        case 'pad': ak.forEach((n, i) => noot(S, {f:hz(n + 12), t:t0, dur:4 * tel + 0.3, type:'triangle', vol:0.06, a:0.6, r:0.8, p:(i - 1) * 0.4, filt:1800})); break;
        case 'arp': for(let i = 0; i < 8; i++) noot(S, {f:hz(ak[patroon[i]] + 24), t:t0 + i * tel / 2, dur:tel * 0.45, type:'triangle', vol:0.12, r:0.15, p:0.2}); break;
        case 'arp-zacht': for(let i = 0; i < 8; i++) noot(S, {f:hz(ak[patroon[i]] + 24), t:t0 + i * tel / 2, dur:tel * 0.9, type:'sine', vol:0.08, a:0.03, r:0.4, p:(i % 2 ? 0.3 : -0.3)}); break;
        case 'arp-kort': for(let i = 0; i < 8; i++) if(r() > 0.25) noot(S, {f:hz(ak[patroon[i]] + 24), t:t0 + i * tel / 2, dur:0.08, type:'square', vol:0.05, a:0.003, r:0.05, filt:2500}); break;
        case 'bas': for(let i = 0; i < 4; i++) noot(S, {f:hz(ak[0] - 12), t:t0 + i * tel, dur:tel * 0.8, type:'triangle', vol:0.22, r:0.1}); break;
        case 'bas-spring': for(let i = 0; i < 8; i++) noot(S, {f:hz(ak[0] - (i % 2 ? 0 : 12)), t:t0 + i * tel / 2, dur:tel * 0.3, type:'square', vol:0.08, a:0.003, r:0.05, filt:900}); break;
        case 'puls': for(let i = 0; i < 8; i++) noot(S, {f:hz(ak[0] - 12), t:t0 + i * tel / 2, dur:tel * 0.35, type:'sawtooth', vol:0.12, a:0.005, r:0.1, filt:500}); break;
        case 'puls16': for(let i = 0; i < 16; i++) noot(S, {f:hz(ak[0] - 12 + (i % 4 === 3 ? 7 : 0)), t:t0 + i * tel / 4, dur:tel * 0.22, type:'sawtooth', vol:0.11, a:0.003, r:0.05, filt:700}); break;
        case 'macht': [0, 7, 12].forEach(d => noot(S, {f:hz(ak[0] - 12 + d), t:t0, dur:4 * tel, type:'sawtooth', vol:0.05, a:0.02, r:0.3, filt:1200})); break;
        case 'drone': if(m === 0) [0, 7].forEach((d, i) => { noot(S, {f:hz(grond - 12 + d), t:0, dur:sec + 1, type:'sawtooth', vol:0.05, a:1.5, r:1.5, filt:300, p:i ? 0.3 : -0.3}); noot(S, {f:hz(grond - 12 + d) * 1.004, t:0, dur:sec + 1, type:'sawtooth', vol:0.04, a:1.5, r:1.5, filt:300}); }); break;
        case 'hoog': if(m % 2 === 0) noot(S, {f:hz(grond + 25), t:t0, dur:8 * tel, type:'sine', vol:0.025, a:2, r:2}); break;
        case 'hart': [0, 0.28].forEach(d => kick(S, t0 + d, 0.5)); [0, 0.28].forEach(d => kick(S, t0 + 2 * tel + d, 0.4)); break;
        case 'kick': kick(S, t0); kick(S, t0 + 2 * tel); break;
        case 'kick4': for(let i = 0; i < 4; i++) kick(S, t0 + i * tel, 0.55); break;
        case 'snare': [1, 3].forEach(i => tik(S, {t:t0 + i * tel, dur:0.18, type:'bandpass', f:1800, vol:0.35})); break;
        case 'hihat': for(let i = 0; i < 8; i++) tik(S, {t:t0 + i * tel / 2, dur:0.04, f:8000, vol:i % 2 ? 0.08 : 0.04, p:0.2}); break;
        case 'bellen': for(let i = 0; i < 4; i++) if(r() > 0.3) noot(S, {f:hz(stapNaarMidi(Math.floor(r() * 8) + 7)), t:t0 + i * tel + r() * 0.2, dur:1.8, type:'sine', vol:0.07, a:0.005, r:1.7, p:r() - 0.5}); break;
        case 'bellen-eng': if(r() > 0.3) noot(S, {f:hz(grond + 36 + Math.floor(r() * 3)), t:t0 + r() * 3 * tel, dur:2.5, type:'sine', vol:0.05, a:0.005, r:2.4, p:r() - 0.5}); break;
        case 'melodie': for(let i = 0; i < 4; i += 2) noot(S, {f:hz(stapNaarMidi(P.akk[m % 4] + [0, 2, 4, 1][Math.floor(r() * 4)] + 7)), t:t0 + i * tel, dur:tel * 1.9, type:'sine', vol:0.08, a:0.08, r:0.6}); break;
        case 'melodie-eng': noot(S, {f:hz(grond + 24 + (m % 2)), t:t0 + tel, dur:tel * 2.5, type:'sine', vol:0.05, a:0.4, r:1, naar:hz(grond + 23)}); break;
      }
    });
  }
  return klaar(S);
}

/* ---------- sfeergeluid ---------- */
const SFEER = {
  bos:        [['wind', 'vogels'], ['wind', 'krekels', 'uil']],
  zee:        [['golven', 'meeuwen'], ['golven-hard', 'storm']],
  stad:       [['brom', 'auto', 'geroezemoes'], ['brom', 'auto']],
  kasteel:    [['wind-laag', 'vuur', 'druppels'], ['brom', 'druppels', 'stappen']],
  ruimte:     [['zoem', 'piepjes'], ['zoem', 'zonnewind']],
  onderwater: [['water', 'bubbels'], ['diep', 'walvis', 'bubbels-los']],
  weer:       [['regen'], ['regen', 'donder']],
  nacht:      [['krekels', 'wind-zacht'], ['krekels', 'uil', 'wind-zacht']],
  school:     [['geroezemoes', 'geroezemoes', 'stappen'], ['brom-zacht', 'stappen-galm']],
  kermis:     [['geroezemoes', 'geroezemoes', 'ratel'], ['brom', 'botsen', 'geroezemoes']],
  boerderij:  [['wind-zacht', 'vogels', 'koe', 'kip'], ['kip', 'kip', 'wind-zacht']],
  oerwoud:    [['vogels', 'vogels', 'kikkers', 'regen-zacht'], ['regen', 'kikkers']]
};

function bed(S, {type = 'wit', filt = [['lowpass', 1000]], vol = 0.2, lfo = 0, diepte = 0.5, p = 0}){
  const {oc, uit} = S; const sec = S.sec + 2.5;
  const s = oc.createBufferSource(); s.buffer = ruis(oc, sec, type);
  const g = oc.createGain(); g.gain.value = vol;
  const nodes = [s, ...filt.map(([t, f, q]) => filter(oc, t, f, q)), g, pan(oc, p), uit];
  keten(...nodes); s.start(0);
  if(lfo){
    const o = oc.createOscillator(); o.frequency.value = lfo;
    const og = oc.createGain(); og.gain.value = vol * diepte;
    o.connect(og); og.connect(g.gain); o.start(0);
  }
}
function maakSfeer(naam, v){
  const sec = 24; const S = nieuw(sec); const r = rnd(naam.length * 31 + v * 7 + 3);
  const tijden = (n, min = 0) => [...Array(n)].map(() => min + r() * (sec - min));
  SFEER[naam][v].forEach(laag => {
    switch(laag){
      case 'wind': bed(S, {filt:[['bandpass', 500, 0.6]], vol:0.25, lfo:0.08, diepte:0.7}); break;
      case 'wind-zacht': bed(S, {filt:[['bandpass', 400, 0.5]], vol:0.12, lfo:0.06, diepte:0.6}); break;
      case 'wind-laag': bed(S, {filt:[['bandpass', 250, 1]], vol:0.25, lfo:0.07, diepte:0.8}); break;
      case 'storm': bed(S, {filt:[['bandpass', 700, 0.8]], vol:0.3, lfo:0.15, diepte:0.9}); break;
      case 'zonnewind': bed(S, {filt:[['bandpass', 2500, 3]], vol:0.08, lfo:0.05, diepte:0.9}); break;
      case 'golven': bed(S, {filt:[['lowpass', 900]], vol:0.35, lfo:1/8, diepte:0.95}); bed(S, {filt:[['highpass', 3000]], vol:0.04, lfo:1/8, diepte:0.9, p:0.3}); break;
      case 'golven-hard': bed(S, {type:'bruin', filt:[['lowpass', 700]], vol:0.6, lfo:1/5, diepte:0.8}); break;
      case 'regen': bed(S, {filt:[['highpass', 800], ['lowpass', 6000]], vol:0.2}); tijden(90).forEach(t => noot(S, {f:1800 + r() * 2500, t, dur:0.04, vol:0.03, a:0.002, r:0.03, p:r() * 2 - 1})); break;
      case 'regen-zacht': bed(S, {filt:[['highpass', 1200], ['lowpass', 5000]], vol:0.07}); break;
      case 'donder': [2, 11, 19].forEach(t => { const s = S.oc.createBufferSource(); s.buffer = ruis(S.oc, 5, 'bruin'); const g = S.oc.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1.2, t + 0.15); g.gain.exponentialRampToValueAtTime(0.4, t + 1.2); g.gain.exponentialRampToValueAtTime(0.001, t + 4.5); keten(s, filter(S.oc, 'lowpass', 400), g, S.uit); s.start(t); }); break;
      case 'vogels': tijden(14).forEach(t => { const n = 2 + Math.floor(r() * 4), f = 2500 + r() * 2500, p = r() * 2 - 1; for(let i = 0; i < n; i++) noot(S, {f, naar:f * (0.7 + r() * 0.6), t:t + i * 0.12, dur:0.08, vol:0.05, a:0.005, r:0.04, p}); }); break;
      case 'meeuwen': tijden(6).forEach(t => { const p = r() * 2 - 1; [0, 0.35, 0.7].forEach(d => noot(S, {f:1400, naar:900, t:t + d, dur:0.3, type:'sawtooth', vol:0.03, a:0.02, r:0.15, filt:2200, p})); }); break;
      case 'krekels': for(let t = 0; t < sec; t += 0.7 + r() * 0.3){ const p = r() > 0.5 ? 0.5 : -0.5; for(let i = 0; i < 4; i++) noot(S, {f:4600, t:t + i * 0.035, dur:0.025, vol:0.03, a:0.003, r:0.015, p}); } break;
      case 'uil': [4, 14].forEach(t => { noot(S, {f:420, naar:400, t, dur:0.35, vol:0.1, a:0.05, r:0.2, p:-0.4}); noot(S, {f:410, naar:380, t:t + 0.6, dur:0.8, vol:0.1, a:0.08, r:0.4, p:-0.4}); }); break;
      case 'brom': bed(S, {type:'bruin', filt:[['lowpass', 200]], vol:0.5}); break;
      case 'brom-zacht': bed(S, {type:'bruin', filt:[['lowpass', 160]], vol:0.25}); break;
      case 'auto': [2, 9, 16].forEach(t => { const s = S.oc.createBufferSource(); s.buffer = ruis(S.oc, 4); const f = filter(S.oc, 'lowpass', 300); f.frequency.setValueAtTime(300, t); f.frequency.linearRampToValueAtTime(1400, t + 1.8); f.frequency.linearRampToValueAtTime(300, t + 3.6); const g = S.oc.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.25, t + 1.8); g.gain.linearRampToValueAtTime(0, t + 3.6); const pn = pan(S.oc, 0); if(pn.pan){ pn.pan.setValueAtTime(-0.8, t); pn.pan.linearRampToValueAtTime(0.8, t + 3.6); } keten(s, f, g, pn, S.uit); s.start(t); }); break;
      case 'geroezemoes': for(let t = 0; t < sec; t += 0.15 + r() * 0.2) noot(S, {f:180 + r() * 180, naar:150 + r() * 200, t, dur:0.15 + r() * 0.25, type:'sawtooth', vol:0.012, a:0.03, r:0.08, filt:900 + r() * 600, p:r() * 1.6 - 0.8}); break;
      case 'vuur': bed(S, {type:'bruin', filt:[['lowpass', 400]], vol:0.15}); tijden(160).forEach(t => tik(S, {t, dur:0.01 + r() * 0.02, f:2000 + r() * 4000, vol:0.05 + r() * 0.1, p:r() - 0.5})); break;
      case 'druppels': tijden(12).forEach(t => { const f = 1400 + r() * 1400; [0, 0.25, 0.5].forEach((d, i) => noot(S, {f, naar:f * 1.4, t:t + d, dur:0.06, vol:0.08 / (i * 2 + 1), a:0.002, r:0.05, p:0.3})); }); break;
      case 'stappen': [3, 3.6, 4.2, 4.8, 13, 13.6, 14.2].forEach(t => { tik(S, {t, dur:0.12, type:'lowpass', f:600, vol:0.5}); kick(S, t, 0.12); }); break;
      case 'stappen-galm': [5, 5.6, 6.2, 6.8, 7.4].forEach(t => [0, 0.18, 0.36].forEach((d, i) => tik(S, {t:t + d, dur:0.12, type:'bandpass', f:900, vol:0.35 / (i * 2 + 1)}))); break;
      case 'zoem': noot(S, {f:55, t:0, dur:sec + 2.5, vol:0.12, a:1, r:1}); noot(S, {f:110.5, t:0, dur:sec + 2.5, vol:0.05, a:1, r:1}); bed(S, {filt:[['lowpass', 300]], vol:0.08}); break;
      case 'piepjes': tijden(10).forEach(t => { const f = 900 + Math.floor(r() * 4) * 300; noot(S, {f, t, dur:0.08, type:'square', vol:0.02, a:0.003, r:0.02, filt:3000, p:r() - 0.5}); noot(S, {f:f * 1.5, t:t + 0.11, dur:0.08, type:'square', vol:0.02, a:0.003, r:0.02, filt:3000}); }); break;
      case 'water': bed(S, {filt:[['lowpass', 500]], vol:0.25, lfo:0.2, diepte:0.3}); break;
      case 'diep': bed(S, {type:'bruin', filt:[['lowpass', 250]], vol:0.5, lfo:0.1, diepte:0.4}); break;
      case 'bubbels': tijden(40).forEach(t => { const n = 1 + Math.floor(r() * 4); for(let i = 0; i < n; i++) noot(S, {f:300 + r() * 300, naar:900 + r() * 600, t:t + i * 0.07, dur:0.06, vol:0.06, a:0.004, r:0.03, p:r() - 0.5}); }); break;
      case 'bubbels-los': tijden(10).forEach(t => noot(S, {f:250, naar:700, t, dur:0.08, vol:0.05, a:0.004, r:0.04})); break;
      case 'walvis': [3, 14].forEach(t => noot(S, {f:180, naar:380, t, dur:3, vol:0.07, a:0.8, r:1.2, filt:900})); break;
      case 'ratel': for(let t = 0; t < sec; t += 0.09) tik(S, {t, dur:0.02, type:'bandpass', f:2500, vol:0.03 + 0.03 * Math.sin(t), p:0.5}); break;
      case 'botsen': [3, 8.5, 15, 20].forEach(t => { tik(S, {t, dur:0.3, type:'lowpass', f:900, vol:0.7}); kick(S, t, 0.4); }); break;
      case 'koe': [5, 17].forEach(t => noot(S, {f:130, naar:105, t, dur:1.4, type:'sawtooth', vol:0.12, a:0.15, r:0.4, filt:700, p:-0.3})); break;
      case 'kip': tijden(8).forEach(t => { const p = r() - 0.5; for(let i = 0; i < 3 + Math.floor(r() * 3); i++) noot(S, {f:700 + r() * 200, naar:600, t:t + i * 0.15, dur:0.09, type:'square', vol:0.03, a:0.005, r:0.04, filt:2000, p}); }); break;
      case 'kikkers': tijden(20).forEach(t => { const p = r() - 0.5, f = 90 + r() * 60; for(let i = 0; i < 3; i++) noot(S, {f, t:t + i * 0.09, dur:0.07, type:'square', vol:0.05, a:0.005, r:0.03, filt:900, p}); }); break;
    }
  });
  return klaar(S);
}

/* ================= laden ================= */
const cache = new Map();
function laad(id){
  if(cache.has(id)) return cache.get(id);
  const s = zoek(id);
  if(!s) return Promise.reject(new Error('onbekend'));
  const p = (async () => {
    if(s.bestand){
      const r = await fetch(s.bestand); if(!r.ok) throw new Error('niet gevonden');
      /* mp3 heeft aan begin en eind een paar ms stilte van de encoder; weg ermee, anders hapert de lus */
      return Geluid.maakGelijk(Geluid.knipRand(await Geluid.decodeer(await r.arrayBuffer())), s.soort === 'gevoel' ? 0.15 : 0.1);
    }
    return Geluid.maakGelijk(await (s.soort === 'gevoel' ? maakMuziek(s.synth, s.v) : maakSfeer(s.synth, s.v)), s.soort === 'gevoel' ? 0.15 : 0.1);
  })();
  cache.set(id, p);
  p.catch(() => cache.delete(id));
  return p;
}

window.Bibliotheek = {GEVOEL, PLEK, zoek, laad};
})();
