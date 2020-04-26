$(function () {
    resizeWindow();
});

// Fix aspect ratio of the stage
$(window).resize(function () {
    resizeWindow();
});

var RATIO = 1;

// Resize the window
function resizeWindow() {
    // Get window width and height
    var w = $(window).width();
    var h = $(window).height();
    // If the aspect ratio is greater than or equal to 4:3, fix height and set width based on height
    if ((w / h) >= RATIO) {
        stageHeight = h;
        stageWidth = RATIO * h;
        stageLeft = (w - stageWidth) / 2;
        stageTop = 0;
    }
    // If the aspect ratio is less than 4:3, fix width and set height based on width
    else {
        stageWidth = w;
        stageHeight = 1 / RATIO * w;
        stageTop = (h - stageHeight) / 2;
        stageLeft = 0;
    }

    // Set "screen" object width and height to stageWidth and stageHeight, and center screen
    $(".screen").css({
        width: stageWidth + "px",
        height: stageHeight + "px",
        left: stageLeft + "px",
        top: stageTop + "px"
    });

    // Resize corner border radii based on stage height
    var cornerSize = .015 * stageHeight;
    $(".rounded").css({
        '-webkit-border-radius': cornerSize + "px",
        '-moz-border-radius': cornerSize + "px",
        'border-radius': cornerSize + "px"
    });

    // Resize text based on stage height
    $("html").css("font-size", (stageHeight / 15) + "px");

    $("body").css("opacity", 1);
}