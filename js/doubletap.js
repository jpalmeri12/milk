$(window).bind('touchend', function (e) {
    console.log(e);
    e.preventDefault();
    $(e.target).click();
});