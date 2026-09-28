# Hoorspelstudio

Een gratis webapp waarmee kinderen (groep 5 t/m 8) in drie stappen een hoorspel maken:

1. **Muziek**: muziek kiezen op gevoel en een sfeergeluid op plek.
2. **Geluiden**: zelf geluiden opnemen en een naam geven.
3. **Opnemen**: het verhaal inspreken en op het juiste moment op de geluiden tikken. Daarna bewaren als mp3.

Hoort bij de lessenserie *De samenstelling* van Jolien Former (Rijnbrink, Taal eens anders).

## Privacy

Opnames blijven in de browser op het apparaat (IndexedDB). Er gaat niets naar een server. Alleen de knop *Bewaren als mp3* maakt een bestand, en dat komt in Downloads.

## Mappen

| Map | Wat staat erin |
| --- | --- |
| `index.html` | De pagina |
| `css/stijl.css` | De stijl (zoals de GevoelsAtlas) |
| `js/app.js` | De schermen en de flow |
| `js/audio.js` | Opnemen, afspelen, samenvoegen en mp3 |
| `js/bibliotheek.js` | De lijst met gevoelens, plekken en stukjes muziek |
| `js/opslag.js` | Bewaren in de browser |
| `js/gezichten.js` | De gezichtjes (getekend of voorlopig) |
| `images/gezichten/` | Getekende gezichtjes + `lijst.js` |
| `audio/` | Hier komen later de echte muziekbestanden |

## Gezichtjes toevoegen

Zet de tekeningen in `images/gezichten/` en schrijf in `images/gezichten/lijst.js` welk gezichtje waarbij hoort. Staat er niets, dan tekent de app zelf een eenvoudig gezichtje.

## Muziek toevoegen

Nu worden alle stukjes muziek en sfeergeluid in de browser gemaakt. Een echt bestand voeg je toe in `js/bibliotheek.js`:

```js
{titel:'Sluipen', synth:'spannend', v:0, bestand:'audio/muziek/spannend-1.mp3', bron:'Maker, CC0'}
```

Gebruik alleen bestanden met een licentie die verspreiden toestaat (CC0, of CC-BY met naamsvermelding).

## Online zetten met GitHub Pages

1. Maak op github.com een nieuwe repository, bijvoorbeeld `hoorspelstudio`.
2. Zet de inhoud van deze map `website` in de repository.
3. Ga naar *Settings › Pages*, kies *Deploy from a branch*, branch `main`, map `/ (root)`.
4. Na een minuut staat de app op `https://<gebruikersnaam>.github.io/hoorspelstudio/`.

De app staat op **https://www.hoorspelstudio.nl**. Het bestand `CNAME` koppelt dat webadres aan GitHub Pages.

## Nieuwe versie online zetten

Verhoog bij elke wijziging het versienummer `?v=...` achter de css- en js-bestanden in `index.html`. Dan laadt de browser de pagina en de scripts altijd samen opnieuw, en niet een mengsel van oud en nieuw.

## Lokaal testen

```bash
python3 -m http.server 8123 --directory website
```

Open daarna http://localhost:8123. De microfoon werkt alleen via `localhost` of `https`.
