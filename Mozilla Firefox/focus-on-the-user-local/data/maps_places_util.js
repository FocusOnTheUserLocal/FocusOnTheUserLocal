var new_map;
var infowindow;
var places_service;
var map_geo_loc;
var map_markers = [];

function clearMapMarkers() {
    for (var i in map_markers) {
      map_markers[i].setMap(null);
    }
}

var places_cache = {};

function addMapPointer(name, success_cb, failure_cb) {
  var name_words = name.trim().toLowerCase().split(/\W+/);

  if ((!_gmaps) || (!_gmaps.places) || (!map_geo_loc)) {
    return;
  }

  var places_callback = function(results, status) {
    if (!results) {
      return;
    }

    places_cache[name] = [results, status];
    console.log("done geocoding places -- got " + results.length + " places");
    if (status == _gmaps.places.PlacesServiceStatus.OK) {
      for (var i = 0; i < results.length; i++) {
        var result_info = {
          name: results[i].name,
          name_trimmed: results[i].name.trim().toLowerCase(),
          name_words: results[i].name.trim().toLowerCase().split(/\W+/),
          address: results[i].vicinity, // unfortunately, just a string
          location: results[i].geometry.location };
        // console.log(result_info);

        // calculate score
        var score = 0;
        name_words.map(function(nw) {
            var prefix = nw.substring(0, 4);
            // console.log("prefix " + prefix);
            if (result_info.name_trimmed.indexOf(prefix) != -1) {
              score += 1. / name_words.length;
            }
          });

        if (score > 0.2) {
          success_cb(result_info);
          return;
        }
      }
    }
    if (failure_cb) { failure_cb(results, status); }
  }

  var request = {
    // bounds: map_geo_loc.geometry.bounds,
    location: map_geo_loc.geometry.location,
    radius: 10000, // radius in meters
    // NOTE: for some reason, 'keyword' works better than 'name'
    keyword: name_words
  };
  var cache_val = places_cache[name];
  if (!cache_val) {
    places_service.nearbySearch(request, places_callback);
  } else {
    console.log("using cache");
    places_callback(cache_val[0], cache_val[1]);
  }
  console.log("new nearby search");
}

function init_map(geo_loc) {
  new_map = new _gmaps.Map($('#new_map')[0], {
    mapTypeId: _gmaps.MapTypeId.ROADMAP,
    // bounds: geo_loc.geometry.bounds,
    center: geo_loc.geometry.location,
    zoom: 12,
    mapTypeControl: false,
    panControl: false,
  });
  // this is typically too far zoomed out
  // new_map.fitBounds(geo_loc.geometry.bounds);
  // NOTE: CSS for width/height is very important!
}

var add_marker = function(loc, letter, info_content) {
  var marker = new _gmaps.Marker({
    map: new_map,
    icon: 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=' + letter + '|f47266|000000',
    position: loc
  });
  map_markers.push(marker);

  _gmaps.event.addListener(marker, 'click', function() {
    infowindow.setContent(info_content);
    infowindow.open(new_map, this);
  });
}

function setMapLocation(address, success_callback, failure_callback) {
  if ((!_gmaps) || (!_gmaps.Geocoder) || (!address)) {
    failure_callback();
  } else {
      var geocoder = new _gmaps.Geocoder();
      geocoder.geocode( { 'address': address}, function(results, status) {
        if (status == _gmaps.GeocoderStatus.OK) {
          success_callback(results[0]);
        } else {
          alert('Geocode of "' + address +
              '" was not successful for the following reason: ' + status);
          failure_callback();
        }
      });
    }
}
