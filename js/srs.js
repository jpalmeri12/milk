var srs = {};

var df = "YYYY-MM-DD";

function loadSRS() {
    var saveData = localStorage.getItem("milkSRS");
    if (saveData == null) {
        loadNew();
    }
    else {
        srs = JSON.parse(saveData);
        if (srs.learned > 2300) {
          srs.learned = 2300;  
        }
        loadMenu();
    }
}

function saveSRS() {
    localStorage.setItem("milkSRS", JSON.stringify(srs));
}

function getCurrentTask() {
    // Iterate over kanji, noting those that are due for review
    var today = moment().format(df);
    var toReview = [];
    for (var i = 0; i < srs.kanji.length; i++) {
        var k = srs.kanji[i];
        if (!k.isNew && k.next != null && !moment(k.next).isAfter(today)) {
            toReview.push(i);
        }
    }
    // If any are due for review, review them
    if (toReview.length > 0) {
        toReview = shuffle(toReview);
        return {
            type: "review",
            kanji: toReview
        }
    }
    // Count kanji to relearn
    var toLearn = [];
    for (var i = 0; i < srs.kanji.length; i++) {
        var k = srs.kanji[i];
        if (k.isNew) {
            toLearn.push(i);
        }
    }
    // Check date to see if we should learn new kanji
    if (moment(today).isAfter(srs.lastLearnedDay)) {
        var toAdd = srs.perDay;
        if (srs.limit > 0 && toAdd + toLearn.length > srs.limit) {
            toAdd = srs.limit - toLearn.length;
        }
        if (srs.learned + toAdd > srs.kanji.length) {
            toAdd = srs.kanji.length - toAdd;
        }
        for (var i = srs.learned; i < Math.min(2300, srs.learned + toAdd); i++) {
            srs.kanji[i].isNew = true;
            toLearn.push(i);
        }
        srs.learned = Math.min(2300, srs.learned + toAdd);
        srs.lastLearnedDay = today;
    }
    // Check for new kanji
    if (toLearn.length > 0) {
        return {
            type: "learn",
            kanji: toLearn
        }
    }
    return {
        type: "none",
        kanji: []
    }

}

function startNewSRS(kanjiPerDay, kanjiLimit, startFrom) {
    if (kanjiPerDay <= 0) {
        kanjiPerDay = 10;
    }
    if (kanjiLimit < 0) {
        kanjiLimit = 0;
    }
    if (startFrom < 0) {
        startFrom = 0;
    }
    if (startFrom > 2300) {
        startFrom = 2300;
    }
    // Initialize blank SRS record
    srs = {};
    var kanji = [];
    for (var i = 0; i < 2300; i++) {
        kanji.push({
            lv: 0,
            next: null,
            isNew: false
        });
    }
    // Retroactively apply "correct" to all kanji at the correct day until now
    var days = 0;
    if (startFrom > 0) {
        days = Math.ceil(startFrom / kanjiPerDay);
        var today = moment().format(df);
        for (var i = 0; i < days; i++) {
            for (var j = 0; j < kanjiPerDay; j++) {
                var kid = i * kanjiPerDay + j;
                // Day the kanji was introduced
                var day = moment(today).subtract(days - i, "days").format(df);
                // Keep track of level
                var level = 0;
                // Increment level until it's after today
                while (moment(day).isBefore(today)) {
                    // Number of days to add to get to the next one
                    level += 1;
                    var daysToAdd = Math.floor(Math.pow(1.8, level));
                    // Wiggle room; a bit of randomness
                    var maxDayModifier = Math.floor(daysToAdd / 10);
                    daysToAdd += Math.floor(Math.random() * (2 * maxDayModifier + 1)) - maxDayModifier;
                    day = moment(day).add(daysToAdd, "days").format(df);
                }
                var k = kanji[kid];
                k.lv = level;
                k.next = day;
            }
        }
    }
    srs.kanji = kanji;
    srs.learned = startFrom;
    srs.perDay = kanjiPerDay;
    srs.limit = kanjiLimit;
    srs.tolerance = 20;
    srs.startDay = moment(today).subtract(days, "days").format(df);
    srs.lastLearnedDay = moment(today).subtract(1, "days").format(df);
    console.log("It's over")
    saveSRS();
}

function srsAdvanceKanji(kanji, deltaLevel) {
    // If level 0, need a start date (today)
    if (kanji.lv == 0) {
        kanji.next = moment().format(df);
    }
    console.log(kanji);
    kanji.lv += deltaLevel;
    var daysToAdd = Math.floor(Math.pow(1.8, kanji.lv));
    // Wiggle room; a bit of randomness
    var maxDayModifier = Math.floor(daysToAdd / 10);
    daysToAdd += Math.floor(Math.random() * (2 * maxDayModifier + 1)) - maxDayModifier;
    console.log(daysToAdd);
    kanji.next = moment(kanji.next).add(daysToAdd, "days").format(df);
}

function srsLevelSummary(indices, srsResults) {
    var levels = [];
    for (var i = 0; i < 10; i++) {
        levels.push(0);
    }
    for (var i = 0; i < srs.kanji.length; i++) {
        var kanji = srs.kanji[i];
        if (kanji.next != null || kanji.isNew) {
            var lv = kanji.lv;
            if (indices) {
                var idx = indices.indexOf(i);
                if (idx > -1) {
                    var mod = srsResults[idx];
                    if (mod.complete) {
                        if (!mod.passed) {
                            lv = 0;
                        } else {
                            lv += mod.lvDiff;
                        }
                    }
                }
            }
            if (lv < 0) {
                lv = 0;
            }
            if (lv > 9) {
                lv = 9;
            }
            levels[lv] += 1;
        }
    }
    return levels;
}
