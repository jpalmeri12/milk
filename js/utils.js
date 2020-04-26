// Fades to a particular div with the given name.
function showScreen(scr) {
    $(".screenBox").removeClass("anim_fadeIn").addClass("anim_fadeOut");
    setTimeout(function () {
        $("#" + scr).removeClass("anim_fadeOut").addClass("anim_fadeIn");
        $(".anim_fadeIn").show();
    }, 250);
    setTimeout(function () {
        $(".anim_fadeOut").hide();
    }, 500);
}

// Shuffles an array.
function shuffle(array) {
    var m = array.length,
        t, i;
    while (m) {
        i = Math.floor(Math.random() * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
    return array;
}

function getbyid(id) {
    var element = document.getElementById(id);
    return element;
}

function clear(o) {
    while (o.firstChild)
        o.removeChild(o.firstChild);
}

function refresh(svg) {
    $(svg).html($(svg).html());
}

Array.prototype.first = function (n) {
    var out = [];
    for (var i = 0; i < n; i++) {
        if (i < this.length) {
            out.push(this[i]);
        }
    }
    return out;
}

Array.prototype.max = function () {
    var max = this[0];
    for (var i = 1; i < this.length; i++) {
        if (this[i] > max) {
            max = this[i];
        }
    }
    return max;
}
