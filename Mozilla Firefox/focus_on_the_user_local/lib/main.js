var buttons = require('sdk/ui/button/action');
var tabs = require('sdk/tabs');

var button = buttons.ActionButton({
  id: 'fotu-link',
  label: 'Visit Focus On The User',
  icon: {
    '16': './icon-16.png',
    '32': './icon-32.png',
    '64': './icon-64.png'
  },
  onClick: function handleClick(state) {
    tabs.open('http://focusontheuser.eu/');
  }
});

var data = require("sdk/self").data;
var manifest = JSON.parse(data.load('manifest.json'));
var pageMod = require("sdk/page-mod");

var basePageMod = function (includeUri) {
  return {
    include: includeUri,
    contentScriptFile: [
	  data.url("injector.js")
    ],
	onAttach: function(worker) {
      worker.port.emit("loadScript", data.url("maps_places_util.js"));
      worker.port.emit("loadScript", data.url("fairlocal.js"));
      worker.port.emit("loadMaps", "");
    }
  }
};


var domainMatches = manifest.content_scripts[0].matches;

for (var domain in domainMatches) {
  var domainName = domainMatches[domain];
  domainName = domainName.replace('://www', ''); // Remove protocol and 'www'
  domainName = domainName.substr(0, domainName.length - 2); // Remove wildcard at the end
  console.log('init pagemod for ' + domainName);
  pageMod.PageMod(basePageMod(domainName));
}

tabs.on('ready', function(tab) {
  console.log('tab is loaded', tab.title, tab.url);
});

tabs.open('https://google.nl/');