/* Gezichtjes. Staat er een getekend gezichtje in images/gezichten/lijst.js,
   dan wordt dat gebruikt. Anders tekent de app een eenvoudig voorlopig gezichtje. */
(() => {
const OOG = {
  punt:  '<circle cx="34" cy="42" r="5"/><circle cx="66" cy="42" r="5"/>',
  groot: '<circle cx="34" cy="42" r="11" fill="#fff" stroke-width="4"/><circle cx="66" cy="42" r="11" fill="#fff" stroke-width="4"/><circle cx="34" cy="43" r="4.5"/><circle cx="66" cy="43" r="4.5"/>',
  dicht: '<path d="M26 44 q8 6 16 0 M58 44 q8 6 16 0" fill="none" stroke-width="4.5"/>',
  lach:  '<path d="M26 45 q8 -9 16 0 M58 45 q8 -9 16 0" fill="none" stroke-width="4.5"/>',
  boos:  '<path d="M24 32 l16 7 M76 32 l-16 7" stroke-width="4.5"/><circle cx="34" cy="46" r="5"/><circle cx="66" cy="46" r="5"/>',
  sluw:  '<path d="M26 42 h16 M58 42 h16" stroke-width="4.5"/><circle cx="38" cy="45" r="3.5"/><circle cx="70" cy="45" r="3.5"/>',
  zorg:  '<path d="M25 36 l14 -5 M75 36 l-14 -5" stroke-width="4"/><circle cx="34" cy="46" r="5"/><circle cx="66" cy="46" r="5"/>'
};
const MOND = {
  lach:   '<path d="M32 64 q18 16 36 0" fill="none" stroke-width="5"/>',
  groot:  '<path d="M30 62 q20 26 40 0 z" fill="#fff" stroke-width="4.5"/>',
  sip:    '<path d="M34 74 q16 -12 32 0" fill="none" stroke-width="5"/>',
  o:      '<ellipse cx="50" cy="70" rx="8" ry="10" fill="#111"/>',
  recht:  '<path d="M36 70 h28" stroke-width="5"/>',
  golf:   '<path d="M30 70 q5 -6 10 0 t10 0 t10 0 t10 0" fill="none" stroke-width="4.5"/>',
  scheef: '<path d="M36 72 q14 -2 28 -8" fill="none" stroke-width="5"/>',
  tanden: '<rect x="32" y="62" width="36" height="14" rx="3" fill="#fff" stroke-width="4"/><path d="M41 62 v14 M50 62 v14 M59 62 v14" stroke-width="3"/>'
};
const UITDR = {
  blij:['punt','lach'], lachen:['lach','groot'], verdrietig:['zorg','sip'], bang:['groot','golf'],
  schrik:['groot','o'], boos:['boos','tanden'], sluw:['sluw','scheef'], verwonderd:['groot','o'],
  slaperig:['dicht','recht'], tevreden:['dicht','lach']
};
const LIJST = Object.keys(UITDR);

function svg(uitdr){
  const [o, m] = UITDR[uitdr] || UITDR.blij;
  return '<svg viewBox="0 0 100 100" aria-hidden="true" fill="#111" stroke="#111" stroke-linecap="round" stroke-linejoin="round">' + OOG[o] + MOND[m] + '</svg>';
}
/* sleutel: naam in lijst.js, uitdr: reserve-uitdrukking */
function html(sleutel, uitdr){
  const bestanden = window.GEZICHTEN || {};
  const bestand = bestanden[sleutel];
  if(bestand) return '<img src="' + bestand + '" alt="" decoding="async">';
  return svg(uitdr);
}
/* gezichtjes voor zelfgemaakte geluiden */
function voorGeluid(i){
  const extra = (window.GEZICHTEN_GELUID || []);
  if(extra.length) return {sleutel:'geluid:' + (i % extra.length), uitdr:LIJST[i % LIJST.length]};
  return {sleutel:null, uitdr:LIJST[(i * 3 + 1) % LIJST.length]};
}
function htmlGeluid(g){
  const extra = window.GEZICHTEN_GELUID || [];
  if(extra.length){
    const i = g.sleutel && g.sleutel.startsWith('geluid:') ? +g.sleutel.slice(7) : LIJST.indexOf(g.uitdr);
    const b = extra[Math.max(0, i) % extra.length];
    return '<img src="' + b + '" alt="" decoding="async">';
  }
  return svg(g.uitdr);
}

window.Gezichten = {html, svg, voorGeluid, htmlGeluid, LIJST};
})();
