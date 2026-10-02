# Hoorspelstudio

Een gratis webapp waarmee kinderen een hoorspel maken. Hoort bij de lessenserie *De samenstelling* van Jolien Former (Rijnbrink, Taal eens anders).

- **https://www.hoorspelstudio.nl** — groep 5 t/m 8, in drie stappen:
  1. **Muziek**: muziek kiezen op gevoel en een sfeergeluid op plek.
  2. **Geluiden**: zelf geluiden opnemen en een naam geven.
  3. **Opnemen**: het verhaal inspreken en op de geluiden tikken, alles bijschaven op de tijdlijn, bewaren als mp3.
- **https://www.hoorspelstudio.nl/klein/** — groep 1 t/m 4, zonder tekst en zonder koptelefoon:
  1. Muziek en plek kiezen.
  2. Opnemen: verhaal en geluiden tegelijk, live in de klas. Daarna zet de computer muziek en plek eronder.

## Privacy

Opnames blijven in de browser op het apparaat (IndexedDB). Er gaat niets naar een server. Alleen *Bewaren* maakt een bestand, en dat komt in Downloads. De grote en de kleine versie bewaren apart van elkaar.

## Mappen

| Map | Wat staat erin |
| --- | --- |
| `index.html` | De grote versie |
| `klein/index.html` | De kleine versie (gebruikt `<base href="../">`, dus dezelfde paden als de grote) |
| `css/stijl.css` | De stijl, in de huisstijl van de GevoelsAtlas |
| `css/klein.css` | Extra stijl voor de kleine versie |
| `js/app.js` | De schermen en de flow van de grote versie |
| `js/klein.js` | De schermen en de flow van de kleine versie |
| `js/audio.js` | Opnemen, afspelen, samenvoegen en mp3 (gedeeld) |
| `js/bibliotheek.js` | Alle gevoelens, plekken en stukjes muziek (gedeeld) |
| `js/opslag.js` | Bewaren in de browser (gedeeld) |
| `js/gezichten.js` | Gezichtjes tonen (gedeeld) |
| `images/gezichten/` | De gezichtjes (240 × 240 px) en `lijst.js` |
| `audio/muziek/`, `audio/plek/` | De muziek en plekgeluiden als naadloze lussen |

## Muziek of een plekgeluid toevoegen

1. Gebruik alleen bestanden met een licentie die verspreiden toestaat: CC0, of CC BY met naamsvermelding.
2. Maak er een naadloze lus van met gelijk volume. Het script staat buiten deze map, in `Hoorspel_studio/hulpmiddelen/`:
   ```bash
   afconvert -f WAVE -d LEF32@44100 bron.mp3 tussen.wav
   node hulpmiddelen/maak-lus.js tussen.wav website/audio/plek/zee-3.mp3 plek 3 60 lame.min.js
   ```
   Voor muziek: `muziek 3 0` (hele stuk), voor plekgeluid: `plek 3 60` (hooguit een minuut).
   `lame.min.js` komt van https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js.
3. Zet het stukje **achteraan** de juiste groep in `js/bibliotheek.js`:
   ```js
   {titel:'Golven bij nacht', bestand:'audio/plek/zee-3.mp3', bron:'Maker (freesound.org/s/12345), CC0'}
   ```
   Het id (`zee-3`) volgt uit de plek in de lijst. Daarom achteraan: anders schuiven de gezichtjes op.
   De maker komt vanzelf bij *Voor de leerkracht*.

## Een gezichtje toevoegen

1. De originelen staan buiten deze map, in `Hoorspel_studio/images/` (`nummer_kleur_gevoel.jpg`).
2. Maak een kopie van 240 × 240 px in `images/gezichten/`, met het id als naam, bijvoorbeeld `zee-3.jpg`:
   ```bash
   sips -s format jpeg -z 240 240 images/1234_blauw_verwonderd.jpg --out website/images/gezichten/zee-3.jpg
   ```
3. Zet een regel in `images/gezichten/lijst.js`, met het origineel erachter als commentaar:
   ```js
   'zee-3': 'images/gezichten/zee-3.jpg', // 1234_blauw_verwonderd.jpg
   ```
   Zonder regel krijgt een stukje het gezichtje van zijn gevoel of plek.
4. Controleer of alles schoolgeschikt is, en bekijk de nieuwe gezichtjes ook zelf:
   ```bash
   python3 hulpmiddelen/controleer-gezichten.py
   ```

## Iconen

Gebruik voor knoppen altijd svg-icoontjes (`ICOON` in `app.js`, `IK` in `klein.js`), nooit tekens als ▶: die tekent een iPhone als emoji.

## Nieuwe versie online zetten

Verhoog bij elke wijziging het versienummer `?v=...` achter de css- en js-bestanden in **beide** `index.html`-bestanden. Dan laadt de browser alles samen opnieuw, en niet een mengsel van oud en nieuw. Daarna `git push`: GitHub Pages zet het binnen een minuut online. Het bestand `CNAME` koppelt www.hoorspelstudio.nl aan GitHub Pages.

## Lokaal testen

```bash
python3 -m http.server 8123 --directory website
```

Open daarna http://localhost:8123 of http://localhost:8123/klein/. De microfoon werkt alleen via `localhost` of `https`.
