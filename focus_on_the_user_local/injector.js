var _anchor = (document.head||document.documentElement);

function load_script(uri) {
  var s = document.createElement('script');
  s.src = uri;
  s.type = "text/javascript";
  _anchor.appendChild(s);
}

// == Option 1: Use a separate loader. Not giving any advantage now.
//
// var scripts = [
//   chrome.extension.getURL("unset_google.js"),
//   "//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"
//   ];
//
// var scripts_json = JSON.stringify(scripts);
//
// var s = document.createElement('script');
// s.innerHTML = ('var _fairlocal_scripts = ' + scripts_json + ';');
// s.type = "text/javascript";
// _anchor.appendChild(s);
//
// var s = document.createElement('script');
// s.src = chrome.extension.getURL("load_scripts.js");
// s.type = "text/javascript";
// _anchor.appendChild(s);

//var scripts
//function getScript(src) {
  //document.write('<' + 'script src="' + src + '"' +
                 //' type="text/javascript"><' + '/script>');
//}

console.log("yelp extension");
load_script(chrome.extension.getURL("maps_places_util.js"));
load_script(chrome.extension.getURL("fairlocal.js"));
load_script("//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js");
load_script("//maps.googleapis.com/maps/api/js?v=3.exp&sensor=true&" +
    "libraries=places&callback=fl_initialize");
