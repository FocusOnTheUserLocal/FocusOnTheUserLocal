function loadScript(url, callback) {
    var script = document.createElement("script")
        script.type = "text/javascript";

    script.onload = function () {
        callback();
    };

    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
}


// Load all scripts by injecting them into the document (so they run as part of the document DOM and JS window stack)
var i = 0;
function loadNextScript() {
    loadScript(self.options.filesToLoad[i], function() {
        i++;
        if (i < self.options.filesToLoad.length) {
            loadNextScript();
        }
    });
}

loadNextScript();

