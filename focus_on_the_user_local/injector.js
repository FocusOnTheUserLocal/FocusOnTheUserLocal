var _anchor = (document.head||document.documentElement);

function load_script(uri) {
  var s = document.createElement('script');
  s.src = uri;
  s.type = "text/javascript";
  _anchor.appendChild(s);
}

console.log("yelp extension");
load_script(chrome.extension.getURL("maps_places_util.js"));
load_script(chrome.extension.getURL("fairlocal.js"));
load_script("//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js");
load_script("//maps.googleapis.com/maps/api/js?v=3.exp&sensor=true&" +
    "libraries=places&callback=fl_initialize");
