var db = [];

var game = {};

var task = {};

// https://ant.design/docs/spec/colors
// 5th of each of the first 10 colors
var levelColors = ["#ff4d4f", "#ff7a45", "#ffa940", "#ffc53d", "#ffec3d", "#bae637", "#73d13d", "#36cfc9", "#40a9ff", "#597ef7"];

$(async function () {
    // Hide everything
    $(".screenBox").hide();
    // Numpads
    $('input').numpad();
    // Load kanji database
    db = await makeKodanshaKanjiJSON();
    // Set up the drawing area
    initDrawCanvas();
    // Rank boxes
    initRankBoxes();
    // Set up buttons
    initGameButtons();
    // Init graph
    initGraph();
    // Load SRS
    loadSRS();
});

function loadNew() {
    showScreen("newScreen");
}

function initGameButtons() {
    $("#newStart").click(function () {
        startNewFile();
    });
    $("#menuStart").click(function () {
        beginTask();
    });
    $("#undoButton").click(function () {
        undoLastResult();
    });
    $("#resetButton").click(function () {
        resetDrawing();
    });
    $("#giveUpButton").click(function () {
        kanjiGiveUp();
    });
    $("#saveButton").click(function () {
        endGame();
    });
    $("#resultButtonHard").click(function () {
        kanjiSRSResult(-1);
    });
    $("#resultButtonOK").click(function () {
        kanjiSRSResult(1);
    });
    $("#resultButtonEasy").click(function () {
        kanjiSRSResult(2);
    });
    $("#menuOptions").click(function () {
        showOptions();
    });
    $("#optionsReturn").click(function () {
        showScreen("menuScreen");
    });
    $("#giveUpContinueButton").click(function() {
        kanjiSRSReset();
    });
}

function startNewFile() {
    var kanjiPerDay = parseInt($("#newNewKanji").val());
    var kanjiLimit = parseInt($("#newKanjiLimit").val());
    var kanjiStartFrom = parseInt($("#newStartFromKanji").val());
    if (isNaN(kanjiPerDay) || kanjiPerDay <= 0) {
        kanjiPerDay = 10;
    }
    if (isNaN(kanjiLimit) || kanjiLimit < 0) {
        kanjiLimit = 0;
    }
    if (isNaN(kanjiStartFrom) || kanjiStartFrom < 0) {
        kanjiStartFrom = 0;
    }
    startNewSRS(kanjiPerDay, kanjiLimit, kanjiStartFrom);
    loadMenu();
}

function initRankBoxes() {
    var rankBoxes = $("#rankBoxes");
    rankBoxes.empty();
    for (var i = 0; i < 10; i++) {
        var rankBox = $(`<div id="rankBox${i}" class="rankBox"></div>`);
        rankBox.append(`<div id="rankBoxText${i}" class="rankBoxText">${i}</div>`);
        rankBox.css({
            'top': (i * .75 + .875) + "rem",
            'background-color': levelColors[i]
        });
        rankBoxes.append(rankBox);
    }
}

function initGraph() {
    var container = $("#menuGraphBars");
    container.empty();
    for (var i = 0; i < 10; i++) {
        var barBox = $(`<div class="menuGraphBarBox"></div>`);
        var bar = $(`<div id="menuGraphBar${i}" class="menuGraphBar"></div>`);
        var num = $(`<div id="menuGraphNumber${i}" class="menuGraphNumber">1234</div>`)
        barBox.append(bar);
        bar.append(num);
        container.append(barBox);
        bar.css("background-color", levelColors[i]);
        barBox.css("left", (1.4 * i) + "rem");
    }
}

function loadMenu() {
    // Get the current task
    task = getCurrentTask();
    // Update day number
    var day = moment(moment().format(df)).diff(srs.startDay, "days") + 1;
    $("#menuDay").text("Day " + day);
    // Update start button
    var color = "#808080";
    var taskText = "All done!"
    if (task.type == "review") {
        color = "#367d4d";
        taskText = "Review Kanji"
    } else if (task.type == "learn") {
        color = "#2d5da8";
        taskText = "Learn Kanji"
    }
    $("#menuStartLabelText").text(taskText);
    var toLearn = task.kanji.length;
    $("#menuStartNumberText").text(toLearn > 0 ? toLearn : "~");
    $("#menuStart").css("background-color", color);
    // Update graph
    var srsLevels = srsLevelSummary();
    var maxBar = srsLevels.max();
    if (maxBar == 0) {
        maxBar = 1;
    }
    for (var i = 0; i < srsLevels.length; i++) {
        $("#menuGraphNumber" + i).text(srsLevels[i]);
        var barHeight = 5 / maxBar * srsLevels[i];
        $("#menuGraphBar" + i).css({
            "height": barHeight + "rem",
            "top": (5 - barHeight) + "rem"
        });
        var numHeight = 0;
        if (barHeight < 0.7) {
            numHeight = -0.6;
        }
        $("#menuGraphNumber" + i).css("top", numHeight + "rem");
    }
    // SRS learned number
    $("#menuProgressText").text(srs.learned);
    showScreen("menuScreen");
}

function beginTask() {
    if (task.type != "none") {
        startGame({
            mode: task.type,
            kanjiIds: task.kanji
        });
    }
}

function startGame(gameProps) {
    game = {
        mode: gameProps.mode,
        kanjiIds: gameProps.kanjiIds,
        currentKanji: 0,
        learnCount: 0,
        learnToProceed: 6,
        learnOpacity: [.4, .2, .05, 0, 0, 0],
        kanjiComplete: false
    };
    var srsResults = [];
    for (var i = 0; i < game.kanjiIds.length; i++) {
        srsResults.push({
            complete: false,
            passed: false,
            lvDiff: 0
        });
    }
    game.srsResults = srsResults;
    setCurrentKanji();
    showScreen("gameScreen")
}

// Updates the game for the current kanji (use at start of kanji drawing session)
function setCurrentKanji() {
    // Get current kanji
    var kanjiId = game.kanjiIds[game.currentKanji];
    var kanji = db[kanjiId];
    drawkanji.setKanji(kanji, {
        "leeway": 0.05,
        "opacity": game.learnOpacity[game.learnCount],
        "highlightCurrentStroke": true
    });
    // Update display (number/keyword/readings)
    var padId = "" + (kanjiId + 1);
    while (padId.length < 4) {
        padId = "0" + padId;
    }
    $("#headerNumText").text(padId);
    $("#headerKeywordText").text(kanji.keyword);
    var readings = [];
    if (kanji.entry.on.length > 0) {
        readings.push(kanji.entry.on.join(", "));
    }
    if (kanji.entry.kun.length > 0) {
        readings.push(kanji.entry.kun.join(", "));
    }
    $("#headerReadingText").text(readings.join(" | "));
    // Status (mode, num left)
    if (game.mode == "learn") {
        $("#statusModeText").text("Learn");
    } else if (game.mode == "review") {
        $("#statusModeText").text("Review");
    }
    $("#statusNumLeftText").text(game.kanjiIds.length - game.currentKanji);
    game.kanjiComplete = false;
    game.kanjiFailed = false;
    updateGameButtons();
    updateKanjiDisplay();
    // Update SRS display
    updateSRSDisplay(game.kanjiIds, game.srsResults, srs.kanji[kanjiId].lv);
    // Reset shrink if applicable
    unshrinkKanji();
}

function shrinkKanji() {
    $("#draw").addClass("anim_drawShrink");
    $("#svgTrace").addClass("anim_traceShrink");
}

function unshrinkKanji() {
    $("#draw").removeClass("anim_drawShrink");
    $("#svgTrace").removeClass("anim_traceShrink");
}

function updateSRSDisplay(indices, srsResults, current) {
    // Update graph
    var srsLevels = srsLevelSummary(indices, srsResults);
    for (var i = 0; i < srsLevels.length; i++) {
        $("#rankBoxText" + i).text(srsLevels[i]);
    }
    $(".rankBoxSelected").removeClass("rankBoxSelected");
    $("#rankBox" + current).addClass("rankBoxSelected");
}

function resetDrawing() {
    drawkanji.clear();
}

function kanjiComplete() {
    // Mode
    if (game.mode == "learn") {
        // Learn: write it until it goes away
        game.learnCount++;
        if (game.learnCount >= game.learnToProceed) {
            game.srsResults[game.currentKanji] = {
                complete: true,
                passed: true,
                lvDiff: 1
            };
            nextKanji();

        } else {
            setCurrentKanji();
        }
    } else if (game.mode == "review") {
        // Review: show SRS buttons
        game.kanjiComplete = true;
        shrinkKanji();
        updateKanjiDisplay();
        updateGameButtons();
    }
}

function nextKanji() {
    if (game.mode == "learn") {
        game.learnCount = 0;
    }
    game.currentKanji++;
    if (game.currentKanji < game.kanjiIds.length) {
        setCurrentKanji();
    } else {
        endGame();
    }
}

function kanjiGiveUp() {
    if (game.mode == "learn") {
        game.learnCount = 0;
        setCurrentKanji();
    } else if (game.mode == "review") {
        game.kanjiFailed = true;
        shrinkKanji();
        updateKanjiDisplay();
        updateGameButtons();
    }
}

function updateGameButtons() {
    if (game.kanjiComplete) {
        $("#drawingButtons").hide();
        $("#giveUpButtons").hide();
        $("#resultButtons").show();
    } else {
        if (game.kanjiFailed) {
            $("#resultButtons").hide();
            $("#drawingButtons").hide();
            $("#giveUpButtons").show();
        } else {
            $("#resultButtons").hide();
            $("#giveUpButtons").hide();
            $("#drawingButtons").show();
            if (game.currentKanji > 0) {
                $("#undoButton").show();
                $("#saveButton").show();
            } else {
                $("#undoButton").hide();
                $("#saveButton").hide();
            }
        }
    }
}

function updateKanjiDisplay() {
    if (game.mode == "learn") {
        $("#svgTrace").show();
    } else if (game.mode == "review") {
        if (game.kanjiComplete || game.kanjiFailed) {
            $("#svgTrace").show();
        } else {
            $("#svgTrace").hide();
        }
    }
}

function kanjiSRSResult(lvDiff) {
    game.srsResults[game.currentKanji] = {
        complete: true,
        passed: true,
        lvDiff: lvDiff
    };
    nextKanji();
}

function kanjiSRSReset() {
    game.srsResults[game.currentKanji] = {
        complete: true,
        passed: false,
        lvDiff: 0
    };
    nextKanji();
}

function undoLastResult() {
    if (game.currentKanji > 0) {
        game.currentKanji -= 1;
        game.srsResults[game.currentKanji] = {
            complete: false,
            passed: false,
            lvDiff: 0
        };
        setCurrentKanji();
    }
}

function endGame() {
    var results = game.srsResults;
    for (var i = 0; i < results.length; i++) {
        var result = results[i];
        var kanji = srs.kanji[game.kanjiIds[i]];
        if (result.complete) {
            if (result.passed) {
                srsAdvanceKanji(kanji, result.lvDiff);
                kanji.isNew = false;
            } else {
                kanji.lv = 0;
                kanji.isNew = true;
            }
        }
    }
    saveSRS();
    loadMenu();
}

function showOptions() {
    showScreen("optionScreen");
}
