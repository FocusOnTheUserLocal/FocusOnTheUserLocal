(function() {
  var _anchor = (document.head||document.documentElement);

  function getScript(src) {
    console.log("wrote to document...");
    var s = document.createElement('script');
    s.src = src;
    s.type = "text/javascript";
    _anchor.appendChild(s);
  }

  for (var i in _fairlocal_scripts) {
      var script = _fairlocal_scripts[i];
      console.log("Loading script " + script);
      getScript(script);
  }
})();
