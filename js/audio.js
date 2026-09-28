/* Alles wat met geluid te maken heeft: afspelen, opnemen, mixen en bewaren. */
(() => {
let ctx = null;

function context(){
  if(!ctx){
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
  }
  if(ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/* ---------- afspelen ---------- */
let bezig = [];   // lopende bronnen van één "speler"
let losse = [];   // losse geluiden die over de speler heen klinken
function dempen(lijst){
  const c = ctx; if(!c) return;
  lijst.forEach(({src, gain}) => {
    try{
      const t = c.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.25);
      src.stop(t + 0.3);
    }catch(e){}
  });
}
function stop(){ dempen(bezig); dempen(losse); bezig = []; losse = []; }
/* speel een of meer buffers tegelijk; lagen: [{buf, vol, loop}]; vanaf: seconden */
function speel(lagen, klaar, vanaf = 0){
  stop();
  const c = context(); const t = c.currentTime + 0.02;
  const eigen = [];
  lagen.forEach(({buf, vol = 1, loop = false}) => {
    const src = c.createBufferSource(); src.buffer = buf; src.loop = loop;
    const gain = c.createGain(); gain.gain.value = vol;
    src.connect(gain); gain.connect(c.destination);
    src.start(t, loop ? vanaf % buf.duration : Math.min(vanaf, buf.duration));
    eigen.push({src, gain});
  });
  bezig = eigen;
  if(klaar && eigen[0]) eigen[0].src.onended = () => { if(bezig === eigen){ bezig = []; klaar(); } };
  return t;
}
/* één geluid over wat er al speelt heen */
function los(buf, vol = 0.9){
  const c = context();
  const src = c.createBufferSource(); src.buffer = buf;
  const gain = c.createGain(); gain.gain.value = vol;
  src.connect(gain); gain.connect(c.destination); src.start();
  const item = {src, gain}; losse.push(item);
  src.onended = () => { losse = losse.filter(x => x !== item); };
}

/* ---------- decoderen ---------- */
function decodeer(arrayBuffer){
  return new Promise((res, rej) => {
    try{ const p = context().decodeAudioData(arrayBuffer, res, rej); if(p && p.then) p.then(res, rej); }
    catch(e){ rej(e); }
  });
}
async function blobNaarBuffer(blob){ return decodeer(await blob.arrayBuffer()); }

/* ---------- opnemen ---------- */
const WORKLET = `
class Rec extends AudioWorkletProcessor{
  constructor(){ super(); this.aan = false; this.buf = []; this.n = 0; this.piek = 0; this.tel = 0;
    this.port.onmessage = e => {
      if(e.data === 'start'){ this.aan = true; this.port.postMessage({type:'start', t: currentTime}); }
      if(e.data === 'stop'){ this.flush(); this.aan = false; this.port.postMessage({type:'stop'}); }
    };
  }
  flush(){ if(!this.n) return; const out = new Float32Array(this.n); let o = 0;
    for(const b of this.buf){ out.set(b, o); o += b.length; }
    this.port.postMessage({type:'data', d: out, piek: this.piek}, [out.buffer]); this.buf = []; this.n = 0; this.piek = 0; }
  process(inputs){
    const ch = inputs[0] && inputs[0][0];
    if(ch){ let p = 0; for(let i = 0; i < ch.length; i++){ const v = Math.abs(ch[i]); if(v > p) p = v; }
      if(p > this.piek) this.piek = p;
      if(this.aan){ this.buf.push(ch.slice(0)); this.n += ch.length; if(this.n >= 4096) this.flush(); }
      else if(++this.tel % 8 === 0){ this.port.postMessage({type:'niveau', piek: this.piek}); this.piek = 0; }
    }
    return true;
  }
}
registerProcessor('hs-rec', Rec);`;
let workletKlaar = null;

async function microfoon(soort){
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('geen-mic');
  const c = soort === 'stem'
    ? {echoCancellation:false, noiseSuppression:false, autoGainControl:true}
    : {echoCancellation:false, noiseSuppression:false, autoGainControl:false};
  try{ return await navigator.mediaDevices.getUserMedia({audio:c}); }
  catch(e){
    if(e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) throw new Error('geweigerd');
    if(e && e.name === 'NotFoundError') throw new Error('geen-mic');
    throw new Error('mislukt');
  }
}

/* Maakt een recorder. opties.niveau(0..1) wordt steeds aangeroepen voor de meter.
   Geeft {begin(), eind() -> {samples, rate}, startTijd, sluit()} */
async function maakRecorder(soort, opties = {}){
  const c = context();
  const stream = await microfoon(soort);
  const bron = c.createMediaStreamSource(stream);
  const stil = c.createGain(); stil.gain.value = 0; stil.connect(c.destination);
  const stukken = []; let n = 0;
  let node, startTijd = null, stopBelofte = null, stopKlaar = null;

  const ontvang = msg => {
    if(msg.type === 'data'){ stukken.push(msg.d); n += msg.d.length; opties.niveau && opties.niveau(msg.piek); }
    else if(msg.type === 'niveau'){ opties.niveau && opties.niveau(msg.piek); }
    else if(msg.type === 'start'){ startTijd = msg.t; }
    else if(msg.type === 'stop'){ stopKlaar && stopKlaar(); }
  };

  if(c.audioWorklet && window.AudioWorkletNode){
    if(!workletKlaar){
      const url = URL.createObjectURL(new Blob([WORKLET], {type:'application/javascript'}));
      workletKlaar = c.audioWorklet.addModule(url);
    }
    await workletKlaar;
    node = new AudioWorkletNode(c, 'hs-rec', {numberOfInputs:1, numberOfOutputs:1, channelCount:1, channelCountMode:'explicit'});
    node.port.onmessage = e => ontvang(e.data);
  } else {
    /* reserve voor oudere browsers */
    node = c.createScriptProcessor(4096, 1, 1); let aan = false;
    node.onaudioprocess = e => {
      const d = e.inputBuffer.getChannelData(0); let p = 0;
      for(let i = 0; i < d.length; i++){ const v = Math.abs(d[i]); if(v > p) p = v; }
      if(aan){ const kopie = new Float32Array(d); stukken.push(kopie); n += kopie.length; }
      opties.niveau && opties.niveau(p);
    };
    node.port = {postMessage: m => {
      if(m === 'start'){ aan = true; startTijd = c.currentTime; }
      if(m === 'stop'){ aan = false; setTimeout(() => stopKlaar && stopKlaar(), 0); }
    }};
  }
  bron.connect(node); node.connect(stil);

  return {
    begin(){ node.port.postMessage('start'); },
    get startTijd(){ return startTijd; },
    async eind(){
      stopBelofte = new Promise(r => stopKlaar = r);
      node.port.postMessage('stop');
      await Promise.race([stopBelofte, new Promise(r => setTimeout(r, 800))]);
      this.sluit();
      const samples = new Float32Array(n); let o = 0;
      for(const s of stukken){ samples.set(s, o); o += s.length; }
      return {samples, rate: c.sampleRate};
    },
    sluit(){
      try{ bron.disconnect(); node.disconnect(); stil.disconnect(); }catch(e){}
      stream.getTracks().forEach(t => t.stop());
    }
  };
}

/* stilte aan begin en eind weghalen (voor zelfgemaakte geluiden) */
function knipStilte(samples, rate){
  let piek = 0; for(let i = 0; i < samples.length; i++){ const v = Math.abs(samples[i]); if(v > piek) piek = v; }
  if(piek < 0.01) return null;
  const drempel = Math.max(0.008, piek * 0.08);
  let a = 0; while(a < samples.length && Math.abs(samples[a]) < drempel) a++;
  let b = samples.length - 1; while(b > a && Math.abs(samples[b]) < drempel) b--;
  a = Math.max(0, a - Math.round(rate * 0.03));
  b = Math.min(samples.length, b + Math.round(rate * 0.25));
  const uit = samples.slice(a, b);
  const f = Math.min(Math.round(rate * 0.01), uit.length);
  for(let i = 0; i < f; i++){ uit[i] *= i / f; uit[uit.length - 1 - i] *= i / f; }
  return uit;
}
function isStil(samples){ let p = 0; for(let i = 0; i < samples.length; i += 4){ const v = Math.abs(samples[i]); if(v > p) p = v; } return p < 0.01; }

function samplesNaarBuffer(samples, rate){
  const b = context().createBuffer(1, Math.max(1, samples.length), rate);
  b.getChannelData(0).set(samples);
  return b;
}

/* ---------- wav ---------- */
function wav(kanalen, rate){
  const nk = kanalen.length, len = kanalen[0].length;
  const buf = new ArrayBuffer(44 + len * nk * 2); const v = new DataView(buf);
  const str = (o, s) => { for(let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + len * nk * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, nk, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * nk * 2, true); v.setUint16(32, nk * 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, len * nk * 2, true);
  let o = 44;
  for(let i = 0; i < len; i++) for(let k = 0; k < nk; k++){
    const s = Math.max(-1, Math.min(1, kanalen[k][i])); v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7FFF, true); o += 2;
  }
  return new Blob([buf], {type:'audio/wav'});
}
const bufferNaarWav = b => wav([...Array(b.numberOfChannels)].map((_, i) => b.getChannelData(i)), b.sampleRate);

/* ---------- mixen ---------- */
/* stemmen: [{buf, t}]; muziek/sfeer: AudioBuffer|null; tikken: [{buf, t}] */
async function mix({stemmen, muziek, sfeer, tikken}){
  const rate = 44100;
  let stemEind = 0;
  stemmen.forEach(s => { stemEind = Math.max(stemEind, s.t + s.buf.duration); });
  let eind = stemEind + 1.2;
  tikken.forEach(k => { eind = Math.max(eind, k.t + k.buf.duration + 0.3); });
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const oc = new OAC(2, Math.ceil(eind * rate), rate);
  const uit = oc.createGain(); uit.connect(oc.destination);

  /* wanneer wordt er gepraat? per 0,1 s kijken, over alle stemmen samen */
  const praat = new Array(Math.ceil(eind * 10) + 1).fill(false);
  stemmen.forEach(({buf, t}) => {
    const s = oc.createBufferSource(); s.buffer = buf; s.connect(uit); s.start(t);
    const d = buf.getChannelData(0), stap = Math.round(buf.sampleRate * 0.1);
    for(let i = 0, n = 0; i < d.length; i += stap, n++){
      let som = 0, m = 0; for(let j = i; j < Math.min(d.length, i + stap); j += 2){ som += d[j] * d[j]; m++; }
      if(Math.sqrt(som / Math.max(1, m)) > 0.02){ const k = Math.round(t * 10) + n; if(k < praat.length) praat[k] = true; }
    }
  });
  /* even vasthouden zodat het niet pompt */
  const vast = praat.map((_, i) => praat.slice(Math.max(0, i - 1), i + 5).some(Boolean));

  const bed = (buf, hoog, laag) => {
    if(!buf) return;
    const src = oc.createBufferSource(); src.buffer = buf; src.loop = true;
    const g = oc.createGain();
    g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(vast[0] ? laag : hoog, 0.8);
    let vorige = vast[0];
    vast.forEach((p, i) => { if(i > 8 && p !== vorige){ g.gain.setTargetAtTime(p ? laag : hoog, i * 0.1, p ? 0.08 : 0.35); vorige = p; } });
    g.gain.setTargetAtTime(0, eind - 1.8, 0.4);
    src.connect(g); g.connect(uit); src.start(0); src.stop(eind);
  };
  bed(muziek, 0.55, 0.2);
  bed(sfeer, 0.45, 0.17);

  tikken.forEach(k => {
    const src = oc.createBufferSource(); src.buffer = k.buf;
    const g = oc.createGain(); g.gain.value = 0.9;
    src.connect(g); g.connect(uit); src.start(Math.max(0, k.t));
  });

  const buf = await new Promise((res, rej) => {
    oc.oncomplete = e => res(e.renderedBuffer);
    const p = oc.startRendering(); if(p && p.then) p.then(res, rej);
  });
  /* netjes op volume brengen */
  let piek = 0;
  for(let k = 0; k < buf.numberOfChannels; k++){ const c = buf.getChannelData(k); for(let i = 0; i < c.length; i++){ const v = Math.abs(c[i]); if(v > piek) piek = v; } }
  const f = piek > 0 ? Math.min(3, 0.92 / piek) : 1;
  if(Math.abs(f - 1) > 0.02) for(let k = 0; k < buf.numberOfChannels; k++){ const c = buf.getChannelData(k); for(let i = 0; i < c.length; i++) c[i] *= f; }
  return buf;
}

/* ---------- mp3 ---------- */
let lame = null;
function laadLame(){
  if(window.lamejs) return Promise.resolve();
  if(lame) return lame;
  lame = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js';
    s.onload = () => window.lamejs ? res() : rej(new Error('lame'));
    s.onerror = () => rej(new Error('lame'));
    document.head.append(s);
  });
  lame.catch(() => { lame = null; });
  return lame;
}
async function naarMp3(buf){
  await laadLame();
  const enc = new lamejs.Mp3Encoder(2, buf.sampleRate, 128);
  const L = buf.getChannelData(0), R = buf.getChannelData(buf.numberOfChannels > 1 ? 1 : 0);
  const i16 = f => { const o = new Int16Array(f.length); for(let i = 0; i < f.length; i++){ const s = Math.max(-1, Math.min(1, f[i])); o[i] = s < 0 ? s * 0x8000 : s * 0x7FFF; } return o; };
  const l = i16(L), r = i16(R), delen = [];
  for(let i = 0; i < l.length; i += 1152){
    const m = enc.encodeBuffer(l.subarray(i, i + 1152), r.subarray(i, i + 1152));
    if(m.length) delen.push(new Uint8Array(m));
  }
  const e = enc.flush(); if(e.length) delen.push(new Uint8Array(e));
  return new Blob(delen, {type:'audio/mpeg'});
}

window.Geluid = {context, speel, los, stop, decodeer, blobNaarBuffer, maakRecorder, knipStilte, isStil, samplesNaarBuffer, wav, bufferNaarWav, mix, naarMp3};
})();
