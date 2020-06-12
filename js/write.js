var drawkanji;

function initDrawCanvas() {
    drawkanji = new DrawKanji();
}

function DrawKanji() {
    this.canvas = new DrawCanvas();
    this.canvas_size = 300;
    var self = this;
    $(this.canvas.element).mouseup(function (event) {
        self.mouseup(event);
    });
    var el = this.canvas.element;
    el.onmousedown = function (event) {
        alert("mouse down")
        self.mousedown(event);
    }
    el.onmousemove = function (event) {
        alert("mouse move")
        self.mousemove(event);
    }
//     el.ontouchstart = function (event) {
//         alert("touch start");
//         self.touch_start(event);
//     }
//     el.ontouchmove = function (event) {
//         alert("touch move");
//         self.touch_move(event);
//     }
//     el.ontouchend = function (event) {
//         alert("touch end");
//         self.touch_end(event);
//     }
    el.addEventListener('touchstart', function(event) {
        //alert("touch start");
        self.touch_start(event);
    });
    el.addEventListener('touchmove', function(event) {
        //alert("touch move");
        self.touch_move(event);
    });
    el.addEventListener('touchend', function(event) {
        //alert("touch end");
        self.touch_end(event);
    });
    el.onmouseout = function (event) {
        self.mouseout(event);
    }
    this.clear();
    this.tolerance = 20;
    this.strokes = [];
}

DrawKanji.prototype.mouseup = function (event) {
    if (!game.kanjiComplete && !game.kanjiFailed) {
        if (this.active) {
            this.mouse_trace(event);
            this.finish_line();
        }
    }
}
DrawKanji.prototype.mousemove = function (event) {
    if (!game.kanjiComplete && !game.kanjiFailed) {
        this.mouse_trace(event);
    }
}
DrawKanji.prototype.mousedown = function (event) {
    if (!game.kanjiComplete && !game.kanjiFailed) {
        this.start_line();
        this.mouse_trace(event);
        if (event.preventDefault) {
            event.preventDefault();
        } else {
            event.returnValue = false;
        }
    }
    return false;
}
DrawKanji.prototype.mouseout = function (event) {
    if (!game.kanjiComplete && !game.kanjiFailed) {
        if (this.active) {
            this.finish_line();
        }
    }
}

DrawKanji.prototype.touch_end = function (event) {
    if (!game.kanjiComplete && !game.kanjiFailed) {
        if (this.active) {
            this.touch_trace(event);
            this.finish_line();
        }
        this.touching = false;
    }
}
DrawKanji.prototype.touch_move = function (event) {
    if (!game.kanjiComplete && !game.kanjiFailed) {
        this.touch_trace(event);
    }
}
DrawKanji.prototype.touch_start = function (event) {
    if (!game.kanjiComplete && !game.kanjiFailed) {
        this.start_line();
        this.touching = true;
        this.touch_trace(event);
    }
}

DrawKanji.prototype.mouse_trace = function (event) {
    if (!game.kanjiComplete && !game.kanjiFailed) {
        if (!this.active) {
            return;
        }
        if (this.touching) {
            return;
        }
        var pos = getCanvasPosition(event.pageX, event.pageY);
        this.trace(pos);
    }
}

function getCanvasPosition(pageX, pageY) {
    var x = pageX - $('#svgDraw').offset().left;
    var y = pageY - $('#svgDraw').offset().top;
    var w = $('#svgDraw').width();
    var h = $('#svgDraw').height();
    return {
        x: x / w,
        y: y / h
    };
}

DrawKanji.prototype.start_line = function () {
    this.active = true;
}

DrawKanji.prototype.finish_line = function () {
    if (this.point_num > 1) {
        this.finishStroke();
    } else {
        this.sequence[this.stroke_num] = [];
        this.reset_brush();
    }
}
DrawKanji.prototype.finishStroke = function () {
    // Check if the stroke was correct
    var isStrokeCorrect = this.checkStroke(this.stroke_num);
    if (isStrokeCorrect) {
        this.stroke_num++;
        this.reset_brush();
        this.canvas.update(this.sequence);
        if (this.stroke_num >= this.strokes.length) {
            kanjiComplete();
        }
    } else {
        this.active = false;
        this.sequence[this.stroke_num] = [];
        this.point_num = 0;
        this.canvas.update(this.sequence);
    }
    this.updateStrokeColors();
}

DrawKanji.prototype.touch_trace = function (event) {
    if (!game.kanjiComplete && !game.kanjiFailed) {
        if (!this.active) {
            return;
        }
        if (event.changedTouches.length > 0) {
            var touch = event.changedTouches[0];
            var pos = getCanvasPosition(touch.pageX, touch.pageY);
            this.trace(pos);
        }
        event.preventDefault();
    }
}

DrawKanji.prototype.trace = function (pos) {
    this.addPoint(pos.x, pos.y);
}

DrawKanji.prototype.clear = function () {
    this.reset_brush();
    this.sequence = [];
    this.stroke_num = 0;
    this.canvas.update();
    this.updateStrokeColors();
}

DrawKanji.prototype.reset_brush = function () {
    this.active = false;
    this.point_num = 0;
}

DrawKanji.prototype.addPoint = function (x, y) {
    if (this.point_num == 0) {
        this.sequence[this.stroke_num] = new Array;
        var sq = this.sequence[this.stroke_num];
        sq[0] = {
            x: x,
            y: y
        };
        this.point_num++;
    } else {
        var sq = this.sequence[this.stroke_num];
        var n = this.point_num;
        var prev = this.point_num - 1;
        var dx = x - sq[prev].x;
        var dy = y - sq[prev].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > .01) {
            sq[n] = {
                x: x,
                y: y
            };
            this.point_num++;
        }
    }
    this.canvas.update(this.sequence);
}

// Sets the kanji to be drawn.
DrawKanji.prototype.setKanji = async function (kanji, settings) {
    // Clear
    this.clear();
    // Load kanji SVG and add it to the file
    var kanjiFile = await $.ajax("files/kanji/" + kanji.file, {
        dataType: "text"
    });
    var container = $("#svgTrace");
    container.html(kanjiFile);
    // Only keep the strokes
    var groups = container.find("g");
    var strokeGroup = "";
    for (var i = 0; i < groups.length; i++) {
        var id = $(groups[i]).attr("id");
        if (id.indexOf("StrokePaths") > -1) {
            strokeGroup = $(groups[i])[0].outerHTML;
        }
    }
    container.css("opacity", settings.opacity);
    // Clear SVG and append the stroke group only
    container.empty();
    var svg = $(`<svg width="100%" height="100%" viewBox="0 0 109 109"></svg>`);
    svg.html(strokeGroup);
    container.append(svg);
    // Opacity for learn mode
    this.highlightCurrentStroke = settings.highlightCurrentStroke;
    this.updateStrokeColors();
    // Store stroke info
    this.strokes = document.getElementById("svgTrace").getElementsByTagName("path");
}

DrawKanji.prototype.updateStrokeColors = function () {
    if (this.highlightCurrentStroke) {
        var paths = $("#svgTrace").find("path");
        for (var i = 0; i < paths.length; i++) {
            var path = paths[i];
            if (i < this.stroke_num) {
                $(path).attr("style", "stroke: #000000; oapcity: 1;");
            } else if (i == this.stroke_num) {
                $(path).attr("style", "stroke: #40bd74; opacity: 1;");
            } else if (i > this.stroke_num) {
                $(path).attr("style", "stroke: #000000; opacity: 1;");
            }
        }
    }
}

function pathToPoints(inputPath, numPoints) {
    var path = inputPath.replace(' ', ',');
    var pathLength = Raphael.getTotalLength(path);
    var points = [];
    for (var i = 0; i <= numPoints; i++) {
        points.push(Raphael.getPointAtLength(path, i / numPoints * pathLength));
    }
    return points;
}

function strokeDistance(a, b) {
    var sum = 0;
    for (var i = 0; i < a.length; i++) {
        var dx = a[i].x - b[i].x;
        var dy = a[i].y - b[i].y;
        sum += Math.sqrt(dx * dx + dy * dy);
    }
    return sum / (a.length + 1);
}

// Checks if a stroke was correct.
DrawKanji.prototype.checkStroke = function (strokeId) {
    // Number of points in comparison strokes
    var numPoints = 30;
    // Stroke to compare to
    var stroke = this.strokes[strokeId];
    // Convert to points
    var strokePoints = pathToPoints($(stroke).attr('d'), numPoints);
    // Drawn stroke
    var drawn = this.sequence[strokeId];
    // Convert to path
    var drawnPath = sequenceToPath(drawn, 109);
    // Convert to points
    var drawnPoints = pathToPoints(drawnPath, numPoints);
    // Sum of distances, squared, then take average
    var dist = strokeDistance(strokePoints, drawnPoints);
    if (dist < this.tolerance) {
        return true;
    }
    return false;
}

function DrawCanvas() {
    var canvas = document.getElementById("svgDraw");
    this.size = canvas.offsetWidth;
    this.element = canvas;
    var self = this;
}

DrawCanvas.prototype.clear = function () {
    this.update();
}

function sequenceToPath(stroke, size) {
    var path = "";
    for (var i = 0; i < stroke.length; i++) {
        var pt = stroke[i];
        var x = pt.x * size;
        var y = pt.y * size;
        if (i == 0) {
            path += `M ${x} ${y}`;
        } else {
            path += ` L ${x} ${y}`;
        }
    }
    return path;
}

DrawCanvas.prototype.update = function (strokes) {
    var svg = this.element;
    $("#inputStrokes").empty();
    if (strokes) {
        for (var i = 0; i < strokes.length; i++) {
            var stroke = strokes[i];
            var path = sequenceToPath(stroke, 100);
            $("#inputStrokes").append(`<path d="${path}" style="stroke: #000000; stroke-width: 3px; fill: none; stroke-linecap: round;"></path>`);
        }
    }
    $(svg).html($(svg).html());
}
