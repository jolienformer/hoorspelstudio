/* Welk getekend gezichtje hoort waarbij?
   De tekeningen komen uit de GevoelsAtlas (originelen staan in de map images/ van het project).
   Laat een regel weg, dan tekent de app zelf een voorlopig gezichtje.

   GEZICHTEN: per gevoel of plek (bijv. 'spannend') en per stukje muziek (bijv. 'spannend-1')
   GEZICHTEN_GELUID: gezichtjes voor de zelfgemaakte geluiden, op volgorde */
window.GEZICHTEN = {
  'spannend': 'images/gezichten/spannend.jpg', // 1566_paars_gespannen.jpg
  'spannend-1': 'images/gezichten/spannend-1.jpg', // 1149_groen_gespannen.jpg
  'spannend-2': 'images/gezichten/spannend-2.jpg', // 474_geel_gespannen.jpg
  'eng': 'images/gezichten/eng.jpg', // 1087_grijs_griezelig.jpg
  'eng-1': 'images/gezichten/eng-1.jpg', // 201_roze_griezelig.jpg
  'eng-2': 'images/gezichten/eng-2.jpg', // 325_blauw_griezelig.jpg
  'vrolijk': 'images/gezichten/vrolijk.jpg', // 1470_oranje_opgewekt.jpg
  'vrolijk-1': 'images/gezichten/vrolijk-1.jpg', // 1410_blauw_vrolijk.jpg
  'vrolijk-2': 'images/gezichten/vrolijk-2.jpg', // 1335_blauw_opgewekt.jpg
  'droevig': 'images/gezichten/droevig.jpg', // 681_wit_droevig.jpg
  'droevig-1': 'images/gezichten/droevig-1.jpg', // 1036_groen_verdrietig.jpg
  'droevig-2': 'images/gezichten/droevig-2.jpg', // 188_roze_verdrietig.jpg
  'geheimzinnig': 'images/gezichten/geheimzinnig.jpg', // 286_blauw_geheimzinnig.jpg
  'geheimzinnig-1': 'images/gezichten/geheimzinnig-1.jpg', // 1445_blauw_mysterieus.jpg
  'geheimzinnig-2': 'images/gezichten/geheimzinnig-2.jpg', // 991_paars_mysterieus.jpg
  'magisch': 'images/gezichten/magisch.jpg', // 638_roze_magisch.jpg
  'magisch-1': 'images/gezichten/magisch-1.jpg', // 1817_oranje_magisch.jpg
  'magisch-2': 'images/gezichten/magisch-2.jpg', // 318_blauw_magisch.jpg
  'achtervolging': 'images/gezichten/achtervolging.jpg', // 133_roze_snel.jpg
  'achtervolging-1': 'images/gezichten/achtervolging-1.jpg', // 1510_paars_geschrokken.jpg
  'achtervolging-2': 'images/gezichten/achtervolging-2.jpg', // 524_grijs_gehaast.jpg
  'stoer': 'images/gezichten/stoer.jpg', // 1395_blauw_stoer.jpg
  'stoer-1': 'images/gezichten/stoer-1.jpg', // 1797_oranje_stoer.jpg
  'stoer-2': 'images/gezichten/stoer-2.jpg', // 1866_rood_stoer.jpg
  'grappig': 'images/gezichten/grappig.jpg', // 123_wit_grappig.jpg
  'grappig-1': 'images/gezichten/grappig-1.jpg', // 1826_geel_melig.jpg
  'grappig-2': 'images/gezichten/grappig-2.jpg', // 1186_bruin_melig.jpg
  'dromerig': 'images/gezichten/dromerig.jpg', // 542_groen_slaperig.jpg
  'dromerig-1': 'images/gezichten/dromerig-1.jpg', // 1293_blauw_slaperig.jpg
  'dromerig-2': 'images/gezichten/dromerig-2.jpg', // 743_blauw_afwezig.jpg
  'feestelijk': 'images/gezichten/feestelijk.jpg', // 1528_geel_feestelijk.jpg
  'feestelijk-1': 'images/gezichten/feestelijk-1.jpg', // 1348_groen_feestelijk.jpg
  'feestelijk-2': 'images/gezichten/feestelijk-2.jpg', // 1694_groen_feestelijk.jpg
  'rustig': 'images/gezichten/rustig.jpg', // 246_paars_zen.jpg
  'rustig-1': 'images/gezichten/rustig-1.jpg', // 1294_blauw_sereen.jpg
  'rustig-2': 'images/gezichten/rustig-2.jpg', // 146_roze_vredig.jpg
  'hoopvol': 'images/gezichten/hoopvol.jpg', // 938_oranje_positief.jpg
  'hoopvol-1': 'images/gezichten/hoopvol-1.jpg', // 1801_geel_optimistisch.jpg
  'hoopvol-2': 'images/gezichten/hoopvol-2.jpg', // 1633_grijs_positief.jpg
  'bos': 'images/gezichten/bos.jpg', // 1210_paars_natuurlijk.jpg
  'bos-1': 'images/gezichten/bos-1.jpg', // 1323_blauw_dierlijk.jpg
  'bos-2': 'images/gezichten/bos-2.jpg', // 274_paars_dierlijk.jpg
  'zee': 'images/gezichten/zee.jpg', // 1148_blauw_verwaterd.jpg
  'zee-1': 'images/gezichten/zee-1.jpg', // 1641_grijs_verdronken.jpg
  'zee-2': 'images/gezichten/zee-2.jpg', // 1259_groen_verwaterd.jpg
  'stad': 'images/gezichten/stad.jpg', // 1742_grijs_digitaal.jpg
  'stad-1': 'images/gezichten/stad-1.jpg', // 1491_roze_digitaal.jpg
  'stad-2': 'images/gezichten/stad-2.jpg', // 241_paars_digitaal.jpg
  'kasteel': 'images/gezichten/kasteel.jpg', // 1493_roze_koninklijk.jpg
  'kasteel-1': 'images/gezichten/kasteel-1.jpg', // 1214_paars_koninklijk.jpg
  'kasteel-2': 'images/gezichten/kasteel-2.jpg', // 1600_paars_spookachtig.jpg
  'ruimte': 'images/gezichten/ruimte.jpg', // 124_roze_buitenaards.jpg
  'ruimte-1': 'images/gezichten/ruimte-1.jpg', // 1392_blauw_buitenaards.jpg
  'ruimte-2': 'images/gezichten/ruimte-2.jpg', // 290_blauw_buitenaards.jpg
  'onderwater': 'images/gezichten/onderwater.jpg', // 1155_groen_dierlijk.jpg
  'onderwater-1': 'images/gezichten/onderwater-1.jpg', // 1451_blauw_dierlijk.jpg
  'onderwater-2': 'images/gezichten/onderwater-2.jpg', // 379_blauw_dierlijk.jpg
  'weer': 'images/gezichten/weer.jpg', // 1676_wit_verdronken.jpg
  'weer-1': 'images/gezichten/weer-1.jpg', // 1325_blauw_ongelukkig.jpg
  'weer-2': 'images/gezichten/weer-2.jpg', // 1461_blauw_ongelukkig.jpg
  'nacht': 'images/gezichten/nacht.jpg', // 1624_paars_vermoeid.jpg
  'nacht-1': 'images/gezichten/nacht-1.jpg', // 1611_paars_elementair.jpg
  'nacht-2': 'images/gezichten/nacht-2.jpg', // 1032_groen_vermoeid.jpg
  'school': 'images/gezichten/school.jpg', // 1257_groen_slim.jpg
  'school-1': 'images/gezichten/school-1.jpg', // 585_bruin_slim.jpg
  'school-2': 'images/gezichten/school-2.jpg', // 1143_blauw_geleerd.jpg
  'kermis': 'images/gezichten/kermis.jpg', // 1107_roze_uitgelaten.jpg
  'kermis-1': 'images/gezichten/kermis-1.jpg', // 1315_blauw_uitgelaten.jpg
  'kermis-2': 'images/gezichten/kermis-2.jpg', // 665_roze_uitgelaten.jpg
  'boerderij': 'images/gezichten/boerderij.jpg', // 759_groen_dierlijk.jpg
  'boerderij-1': 'images/gezichten/boerderij-1.jpg', // 1772_bruin_dierlijk.jpg
  'boerderij-2': 'images/gezichten/boerderij-2.jpg', // 1119_oranje_dierlijk.jpg
  'oerwoud': 'images/gezichten/oerwoud.jpg', // 1541_bruin_dierlijk.jpg
  'oerwoud-1': 'images/gezichten/oerwoud-1.jpg', // 771_blauw_dierlijk.jpg
  'oerwoud-2': 'images/gezichten/oerwoud-2.jpg', // 405_groen_dierlijk.jpg
};
window.GEZICHTEN_GELUID = [
  'images/gezichten/geluid-01.jpg', // 1376_blauw_griezelig.jpg
  'images/gezichten/geluid-02.jpg', // 1649_blauw_griezelig.jpg
  'images/gezichten/geluid-03.jpg', // 1484_rood_vrolijk.jpg
  'images/gezichten/geluid-04.jpg', // 1198_roze_opgewekt.jpg
  'images/gezichten/geluid-05.jpg', // 1350_groen_opgewekt.jpg
  'images/gezichten/geluid-06.jpg', // 1379_blauw_opgewekt.jpg
  'images/gezichten/geluid-07.jpg', // 1452_blauw_opgewekt.jpg
  'images/gezichten/geluid-08.jpg', // 1264_groen_verdrietig.jpg
  'images/gezichten/geluid-09.jpg', // 1303_blauw_magisch.jpg
  'images/gezichten/geluid-10.jpg', // 137_roze_magisch.jpg
  'images/gezichten/geluid-11.jpg', // 1282_groen_geschrokken.jpg
  'images/gezichten/geluid-12.jpg', // 1331_blauw_geschrokken.jpg
  'images/gezichten/geluid-13.jpg', // 1394_blauw_geschrokken.jpg
  'images/gezichten/geluid-14.jpg', // 141_rood_geschrokken.jpg
  'images/gezichten/geluid-15.jpg', // 1428_paars_stoer.jpg
  'images/gezichten/geluid-16.jpg', // 148_rood_stoer.jpg
  'images/gezichten/geluid-17.jpg', // 1189_grijs_grappig.jpg
  'images/gezichten/geluid-18.jpg', // 465_groen_grappig.jpg
  'images/gezichten/geluid-19.jpg', // 1083_wit_melig.jpg
  'images/gezichten/geluid-20.jpg', // 1276_groen_melig.jpg
  'images/gezichten/geluid-21.jpg', // 1731_grijs_melig.jpg
  'images/gezichten/geluid-22.jpg', // 1850_oranje_melig.jpg
  'images/gezichten/geluid-23.jpg', // 1786_oranje_afwezig.jpg
  'images/gezichten/geluid-24.jpg', // 740_blauw_afwezig.jpg
  'images/gezichten/geluid-25.jpg', // 793_groen_feestelijk.jpg
  'images/gezichten/geluid-26.jpg', // 1657_blauw_uitgelaten.jpg
  'images/gezichten/geluid-27.jpg', // 353_blauw_uitgelaten.jpg
  'images/gezichten/geluid-28.jpg', // 480_geel_uitgelaten.jpg
  'images/gezichten/geluid-29.jpg', // 579_groen_uitgelaten.jpg
  'images/gezichten/geluid-30.jpg', // 651_roze_uitgelaten.jpg
  'images/gezichten/geluid-31.jpg', // 824_geel_ontspannen.jpg
  'images/gezichten/geluid-32.jpg', // 827_geel_ontspannen.jpg
  'images/gezichten/geluid-33.jpg', // 1304_wit_dierlijk.jpg
  'images/gezichten/geluid-34.jpg', // 1422_paars_dierlijk.jpg
  'images/gezichten/geluid-35.jpg', // 1447_blauw_dierlijk.jpg
  'images/gezichten/geluid-36.jpg', // 1476_roze_dierlijk.jpg
  'images/gezichten/geluid-37.jpg', // 1571_roze_dierlijk.jpg
  'images/gezichten/geluid-38.jpg', // 1675_wit_dierlijk.jpg
  'images/gezichten/geluid-39.jpg', // 229_roze_dierlijk.jpg
  'images/gezichten/geluid-40.jpg', // 275_paars_dierlijk.jpg
  'images/gezichten/geluid-41.jpg', // 324_blauw_dierlijk.jpg
  'images/gezichten/geluid-42.jpg', // 686_paars_dierlijk.jpg
  'images/gezichten/geluid-43.jpg', // 699_paars_dierlijk.jpg
  'images/gezichten/geluid-44.jpg', // 888_wit_dierlijk.jpg
];
