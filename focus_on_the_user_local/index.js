var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");

// Add the main injector script as a content script
pageMod.PageMod({
    include: '*',
    contentScriptWhen: 'end',
    contentScriptOptions: {
        filesToLoad: [
            data.url("maps_places_utils.js"),
            data.url("fairlocal.js"),
            "//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js",
            "//maps.googleapis.com/maps/api/js?v=3.exp&sensor=true&libraries=places&callback=fl_initialize"
        ]
    },
    contentScriptFile: [ data.url("injector.js") ]
});

