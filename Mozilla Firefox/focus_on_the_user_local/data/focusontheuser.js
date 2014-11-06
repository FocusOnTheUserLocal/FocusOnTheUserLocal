(function(){

if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)) {
  alert(
    "Unfortunately, this tool does not currently work in Internet Explorer. " +
    "Please try another browser such as Firefox, Chrome, or Safari.");
  return;
}

var anchor = document.getElementsByTagName('script')[0];
if (!anchor) { return; }

var link = document.createElement('link');
link.rel = 'stylesheet';
link.type = 'text/css';
link.href = '//focusontheuser.org/dontbeevil/style.css?3';
anchor.parentNode.insertBefore(link, anchor);

var script = document.createElement('script');
script.src = '//ajax.googleapis.com/ajax/libs/mootools/1.4.1/mootools-yui-compressed.js';
script.onload = main;
anchor.parentNode.insertBefore(script, anchor);

// Main Application

function main() {
  // A custom pseudo selector for finding highlighted typeahead entries.
  Slick.definePseudo('highlighted', function() {
    return this.getStyle('background-color') != 'transparent';
  });

  // Debounce to prevent updatePage from being called too often.
  var debouncedUpdatePage = debounce(updatePage);

  // The main results div will serve as our flag. Store a reference to this
  // node, and get it by id in a loop. Update the page whenever it changes.
  var getFlag = function() { return $('rso'); };
  var oldFlag = getFlag();
  var compare = function() {
    var newFlag = getFlag();
    if (newFlag != oldFlag) {
      oldFlag = newFlag;
      debouncedUpdatePage();
    }
  };

  setInterval(compare, 100);
  setupTypeahead();
  updatePage();
}

function updatePage() {
  updateTypeahead();
  updateRelatedBox();
  updateResultStats();
  updateContentLinks();
  updateRelatedLinks();
}

// When the user searchs for a Twitter username including the leading @,
// redirect them directly to Twitter if their search shows up on the page.
function redirectIfTwitterUsername() {
  var input = $$('input[name=q]')[0];
  if (input && (/^@[A-Za-z0-9_]+$/).test(input.value)) {
    var username = input.get('value').substr(1).toLowerCase();
    $$('li.g div.s div.f cite').some(function(item) {
      var path = item.get('text').toLowerCase();
      if (path == ("twitter.com/" + username) ||
          path == ("twitter.com/#!/" + username) ||
          path == ("twitter.com/#!/@" + username)) {
        document.location = "https://twitter.com/" + username;
      }
    });
  }
}

// Attach some event listeners to the main text input, so we can navigate when
// the user uses enter to select a result from the typeahead.
function setupTypeahead() {
  var href;
  var input = $('gbqfq') || $$('input[name=q]')[0];
  if (input) {
    input.addEvents({
      keyup: function() {
        var span = $$('body > table tr:highlighted span:contains(".com")')[0];
        href = span && span.retrieve('href') || '';
      },
      keydown: function(event) {
        if (event.key != 'enter') { return; }
        if (href) {
          window.open(href);
          event.stop();
        } else {
          redirectIfTwitterUsername();
        }
      }
    });
  }
}

// Look for any typeahead entries that contain '.com' in a span, since this is
// one differentiating feature of the Google+ entries. For each result, perform
// a full search for the text of that entry, and 'replace' the Google+ results
// with the highest ranked result as returned by the full search.
function updateTypeahead() {
  var spans = $$('body > table tr span:contains(".com")');
  spans.each(function(span) {
    var row = span.getParent('tr');
    var cell = row.getLast('td');
    var span = cell.getLast('span');
    // Some entries might contain .com, but not be the double height G+ entries.
    if (!span) { return; }
    var name = cell.getFirst('span').get('text');
    getSearchResult(name, function(result) {
      if (!result) { return; }
      var img = row.getElement('img');
      var item = row.getParent('tr');
      // Attach a click listener, which will be used to navigate on select, to
      // each entry in the typeahead. Results are reused, so only attach once.
      if (item && !item.retrieve('attached')) {
        item.store('attached', true);
        item.addEvent('click', function(event) {
          window.open(span.retrieve('href'));
        });
      }
      // If we have a photo for this item, update the typeahead entry, otherwise
      // memoize the existing photo in our result object for later use.
      result.photo ? (img.src = result.photo) : (result.photo = img.src);
      // Update the site that's displayed.
      span.set('text', ' \xb7 ' + result.site);
      // Store a reference to the href needed for navigation (used with 'enter').
      span.store('href', result.href);
    });
  });
}

// This tweaks the text in the right hand column to say "People and Pages from
// the Social Web", rather than "People and Pages on Google+". The column gets
// completely replaced on every search, so we need to run this every time.
function updateRelatedBox() {
  var fieldset = $('aerhs');
  if (fieldset) {
    var legend = fieldset.getFirst('legend');
    legend && legend.set('text', 'People and Pages from the Social Web');
  }
}

// Show a little blurb with a link in the result stats area. This also needs to
// be updated along with every query.
function updateResultStats() {
  var stats = $$('#appbar :contains("seconds")').pop();
  if (stats) {
    // Probably only need to do this once, but it doesn't hurt.
    stats.setStyle('overflow', 'visible');
    stats.getParent('div').setStyle('overflow', 'visible');
    stats.adopt([
      new Element('span').adopt([
        document.createTextNode('\xb7 '),
        new Element('span', {'class': 'dbe_stats'}).adopt([
          document.createTextNode('results improved by '),
          new Element('a', {
            href: 'http://www.focusontheuser.org',
            text: 'FocusOnTheUser.org'
          })
        ])
      ])
    ]);
  }
}

// Find the special Google+ links attached directly to search results in the
// middle column, and replace them with the most relevant social result.
function updateContentLinks() {
  var link = $$('#rso a[href*="plus.google.com"].l')[0];
  if (!link) { return; }
  var text = link.get('text').replace(' - Google+', '');
  if (!text) { return; }
  var item = link.getParent('li.g');
  if (!item) { return; }
  getSearchResult(text, function(result) {
    if (!result) { return; }
    // Memoize the node, and apply the style from the item we're replacing.
    if (!result.plusNode) {
      result.plusNode = result.node.set('style', item.get('style')).adopt(result.links);
    }
    // Plus links are indented.. this seems to be a pretty simple way to make
    // sure we only replace the correct links.
    if (parseInt(item.getStyle('margin-left'), 10) > 0) {
      // Oh, why not use a little superfluous animation.
      item.get('morph').start({opacity: [1, 0]}).chain(function() {
        var morph = result.plusNode.get('morph').set({opacity: 0});
        result.plusNode.replaces(item).highlight('#fea');
        morph.start({opacity: [0, 1]});
      });
    }
  });
}

// Find the Google+ links in the right hand column and replace them with the
// most relevant social results, including all links to social sites that show
// up in the top 100 results, ranked by Google.
function updateRelatedLinks() {
  var links = $$('#rhs_block a[href*="profiles.google.com"]');
  links.each(function(link) {
    var text = (link.get('text') || '').replace(/\.com$/, '');
    if (!text) { return; }
    var item = link.getParent('table');
    if (!item) { return; }
    getSearchResult(text, function(result) {
      if (!result) { return; }
      if (!result.profileBlock) {
        result.profileBlock = (result.site != 'plus.google.com') ?
          buildProfileBlockMarkup(result, item.getElement('img').get('src')) :
          item.clone();
      }
      item.get('morph').start({opacity: [1, 0]}).chain(function() {
        var div = new Element('div', {'class': 'dbe_results'});
        var morph = div.get('morph').set({opacity: 0});
        div.adopt([result.profileBlock, result.links]).replaces(item).highlight('#fea');
        morph.start({opacity: [0, 1]});
      });
    })
  });
}

// For the most part, we're just going to use the markup as returned to us by
// Google's servers, and inject it into the various places on the page. We do
// want to modify it a little bit, adding photos, like / tweet buttons, etc,
// and then we'll memoize the node for later use.
function buildProfileBlockMarkup(result, defaultPhoto) {
  var node = result.node;
  var site = result.site;
  var text = node.getElement('h3');
  var link = text.getElement('a');
  var href = link.get('href');
  link.set('title', link.get('text')).set('text', result.text);

  // Remove the 'Person Shared This' box.
  var div = text.getNext().getNext();
  div && div.dispose();

  var src = '', html = '', span;
  if (site == 'facebook.com') {
    // The Facebook like button is dumb, and even shows up for profiles,
    // where subscribe should be the default action - override for zuck.
    var buttonType = href.indexOf('/zuck') > 0 ? 'subscribe' : 'like';
    src  = '//connect.facebook.net/en_US/all.js#xfbml=1';
    html = '<div href="' + href + '" class="fb-' + buttonType + '" data-show-faces="false" data-layout="button_count" data-width="120" data-send="false"></div>';
  } else if (site == 'twitter.com') {
    src  = '//platform.twitter.com/widgets.js';
    html = '<a href="' + href + '" class="twitter-follow-button" data-show-screen-name="false"></a>';
    // Remove the repetitive twitter default sign up text.
    span = node.getElement('span:contains("Sign up for Twitter")');
    span && span.set('text', span.get('text').replace(/(\s+|^)Sign up for Twitter[\s\w\-]+\(@\w+\)\.\s+/, ''));
  } else if (site == 'linkedin.com') {
    span = node.getElement('span:contains("professional profile on LinkedIn")');
    if (span) {
      var blurb = span.getPrevious();
      span.set('text', blurb.get('text'));
      blurb.dispose();
    }
  }

  if (src) {
    var script = new Element('script', {src: src, onload: function() { script.dispose(); }}).inject(anchor, 'top');
    new Element('div', {'class': 'dbe_button', html: html}).inject(text, 'bottom');
  }

  new Element('a', {href: href})
    .adopt(new Element('img', {src: result.photo || defaultPhoto, 'class': 'dbe_img'}))
    .inject(text.getNext(), 'top');

  return new Element('ul', {'class': 'dbe_first'}).adopt(node);
}

// This function builds the little div of &middot separated links that shows
// up below the most relevant search result in the middle and right columns.
function buildLinksDiv(results) {
  var nodes = [];
  results.each(function(result, index) {
    nodes.push(new Element('a', {
      href: result.href,
      text: siteMap[result.site].name
    }));
    if (index < results.length - 1) {
      nodes.push(document.createTextNode(' \xb7 '));
    }
  });

  return new Element('div', {'class': 'dbe_extra'}).adopt(nodes);
}

// Functions for fetching data

// Given a query string and a callback, this function will perform an
// asynchronous Google search for the top 100 results, parse the response into
// HTMLLIElement DOM nodes, filter that set down to only meaningful socially
// relevent results, fetch photos for the linked profiles of those results,
// and invoke the callback provided with a sorted list of result objects.
var getSearchResult = (function() {

  // Figure out where the search result passed in points to, by looking at the
  // first anchor element inside the node.
  var getHrefFromNode = function(node) {
    var link = $(node).getElement('a');
    return link ? link.get('href') : '';
  }

  // Retrieve a photo for the provided result object, based either on a
  // specially crafted Google image query (for Twitter), or on a query to
  // Google's own richsnippets web tool.
  var getPhoto = function(result, callback) {
    if (!siteMap[result.site].photo) {
      return callback();
    }
    var href = result.href;
    var url = '//www.google.com/';
    if (result.site == 'twitter.com') {
      // Get Twitter profile pic by google image searching for the twitter
      // profile's url, e.g. "site:twitter.com/britneyspears", and then
      // extracting the first result. This seems to usually get the right thing,
      // though often the wrong size.
      url += 'search?gbv=2&tbm=isch&fp=1&biw=1&bih=1&tch=1&q=' + encodeURIComponent('site:' + href);
      xhr(url, function(text) {
        var matches = unescape(text).match(/imgurl\\=(https?:\/\/[^.]+\.twimg\.com\/profile_images\/\d+\/[^\\&]+)/);
        var match = matches ? matches[1].replace(/_(?:bigger|mini|normal|reasonably_small)/, '').replace(/\.jpg$/, '_normal.jpg') : '';
        callback(match);
      });
    } else {
      url += 'webmasters/tools/richsnippets?view=cse&url=' + encodeURIComponent(href);
      xhr(url, function(text) {
        var matches = text.match(/(?:image|photo)\s*=\s*(.+?)\s*<br\s*\/>/m);
        var match = matches ? matches[1] : '';
        callback(match);
      });
    }
  };

  // Out of all the results in the result set, find the socially meaningful
  // ones, discarding all the rest. This function is used to return a sorted
  // list of results for each query, and should aggressively filter out
  // unrelated results.
  var findMeaningfulResults = function(text, results) {
    var hrefs = [];
    var sources = [];
    var matched = {};
    return results.filter(function(result) {
      // Filter out any results without an href.
      var href = getHrefFromNode(result);
      if (!href) { return false; }
      // Filter down to only the sites we care about.
      var matches = href.match(siteMatcher);
      if (!matches) { return false; }
      // Make sure we haven't already found a higher ranked site match.
      var site = matches[1];
      var alreadyMatched = matched[site];
      if (alreadyMatched) { return false; }
      // If we have a whitelist for this site, make sure it matches.
      var whitelist = siteMap[site].whitelist;
      if (whitelist && !whitelist.test(href)) { return false; }
      // If we have a blacklist for this site, make sure it doesn't match.
      var blacklist = siteMap[site].blacklist;
      if (blacklist && blacklist.test(href)) { return false; }
      // Store at most one match per site, including site name and href.
      hrefs.push(href);
      sources.push(site);
      return (matched[site] = true);
    }).map(function(node, index) {
      return {
        node: node,
        text: text,
        href: hrefs[index],
        site: sources[index]
      }
    });
  };

  // This crazy function will parse a Google XHR response, pulling it apart
  // into chunks, and turning each of those individual chunks into a DOM node
  // that can then be analyzed / inserted into the DOM.
  var parseResponseText = function(text) {
    var offset = 0;
    var openTag = "\\x3c!--m--\\x3e";
    var closeTag = "\\x3c!--n--\\x3e";
    var tagLength = 14;
    var getNextResult = function() {
      var result = null;
      var open = text.indexOf(openTag, offset);
      var close = text.indexOf(closeTag, offset);
      var nextOpen = text.indexOf(openTag, open + tagLength);
      var nextClose = text.indexOf(closeTag, close + tagLength);
      if (nextOpen < close) {
        close = nextOpen;
        offset = nextClose + tagLength;
      } else {
        offset = close + tagLength;
      }
      if (open >= 0 && close >= 0) {
        var html = unescape(text.substring(open + tagLength, close));
        result = new Element('ul', {html: html}).getFirst();
      }
      return result;
    };
    var results = [];
    var nextResult = null;
    while (nextResult = getNextResult()) {
      results.push(nextResult);
    }
    return results;
  };

  var cache = {};
  return function(query, callback) {
    if (query in cache) {
      return callback(cache[query]);
    }
    var url = '//www.google.com/search?q=' + encodeURIComponent(query) + '&xhr=t&fp=1&psi=1&num=100&complete=0&pws=0';
    xhr(url, function(text) {
      var results = findMeaningfulResults(query, parseResponseText(text));
      var result = results[0];
      if (result) {
        result.links = buildLinksDiv(results.slice(1));
        getPhoto(result, function(photo) {
          result.photo = photo || '';
          cache[query] = result;
          callback(result);
        });
      }
    });
  };

})();

// Generic Utilities

function debounce(func) {
  var timer = null;
  return function() {
    clearTimeout(timer);
    timer = setTimeout(func, 500);
  }
}

var unescape = (function() {
  var regex = /\\x22|\\x26|\\x27|\\x3c|\\x3d|\\x3e/g;
  var callback = function(match) {
    switch (match) {
      case "\\x22": return '"';
      case "\\x26": return "&";
      case "\\x27": return "'";
      case "\\x3c": return "<";
      case "\\x3d": return "=";
      case "\\x3e": return ">";
    }
  };
  return function(str) {
    return str.replace(regex, callback);
  };
})();

function xhr(url, callback) {
  var req = google.xhr();
  req.open("GET", url, true);
  req.onreadystatechange = function(evt) {
    if (req.readyState === 4) {
      callback(req.responseText);
    }
  };
  req.send(null);
}

// Sites

var siteMap = {
  'crunchbase.com': {
    name: 'CrunchBase',
    whitelist: /(?:^|[\/.])crunchbase\.com\/(person|company)\/(\w+)\/?$/i
  },
  'facebook.com': {
    name: 'Facebook',
    photo: true,
    whitelist: /(?:^|[\/.])facebook\.com\/([a-zA-Z0-9.]+)\/?$/i
  },
  'flickr.com': {
    name: 'Flickr',
    whitelist: /(?:^|[\/.])flickr\.com\/people\/(\w+)\/?$/i
  },
  'foursquare.com': {
    name: 'Foursquare',
    whitelist: /(?:^|[\/.])foursquare\.com\/(\w+)\/?$/i
  },
  'friendfeed.com': {
    name: 'FriendFeed',
    whitelist: /(?:^|[\/.])friendfeed\.com\/(\w+)\/?$/i
  },
  'github.com': {
    name: 'GitHub',
    whitelist: /(?:^|[\/.])github\.com\/(\w+)\/?$/i
  },
  'linkedin.com': {
    name: 'LinkedIn',
    photo: true,
    whitelist: /(?:^|[\/.])linkedin\.com\/in\/(\w+)\/?$/i
  },
  'myspace.com': {
    name: 'MySpace',
    photo: true,
    whitelist: /(?:^|[\/.])myspace\.com\/(\w+)\/?$/i
  },
  'plus.google.com': {
    name: 'Google+',
    whitelist: /(?:^|[\/.])plus\.google\.com\/(\w+)\/?$/i
  },
  'quora.com': {
    name: 'Quora',
    photo: true,
    whitelist: /(?:^|[\/.])quora\.com\/([\w\-]+)\/?$/i,
    blacklist: /\/(who|what|when|where|why|how)\-/i
  },
  'stackoverflow.com': {
    name: 'Stack Overflow',
    whitelist: /(?:^|[\/.])stackoverflow\.com\/users\/(\w+)\/?/i
  },
  'tumblr.com': {
    name: 'Tumblr',
    whitelist: /(?:^|[\/.])(\w+)\.tumblr\.com\/?$/,
    blacklist: /\/tagged\//
  },
  'twitter.com': {
    photo: true,
    name: 'Twitter',
    whitelist: /(?:^|[\/.])twitter\.com\/(\w+)\/?$/i,
    blacklist: /\/statuses\//
  },
  'youtube.com': {
    name: 'YouTube',
    whitelist: /(?:^|[\/.])youtube\.com\/user\/(\w+)(?:\/featured)?\/?$/
  }
};

var siteMatcher = (function(){
  var sites = [];
  for (var site in siteMap) { sites.push(site); }
  return new RegExp('[\/.](' + sites.join('|').replace('.', '\\.') + ')');
})();

})();
