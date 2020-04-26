async function makeKodanshaKanjiJSON() {
    // All kanji
    var kanji = await $.ajax("files/allKanji.json");
    // Kodansha list
    var kodansha = await $.ajax("files/kanjilist.txt");
    // Split into rows
    var rows = kodansha.split("\n");
    var out = [];
    for (var i=0; i<rows.length-1; i++) {
        var row = rows[i].split("\t");
        var kobj = {
            "kanji": row[0],
            "keyword": row[1]
        }
        var entry = kanji.find(function(k) {
            return k.literal == row[0];
        });
        kobj.entry = entry;
        kobj.file = `0${kobj.kanji.charCodeAt(0).toString(16)}.svg`;
        out.push(kobj);
    }
    return out;
}