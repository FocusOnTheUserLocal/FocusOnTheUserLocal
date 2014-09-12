function fl_initialize() {

    if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)) {
        alert(
        "Unfortunately, this tool does not currently work in Internet Explorer. " +
        "Please try another browser such as Firefox, Chrome, or Safari.");
        return;
    }

    // setup google maps
    if ((!google) || (!google.maps)) {
        alert("Google maps undefined!");
    }
    _gmaps = google.maps;

    var getLocalResults = function() {
        return $('div.vslru');
    };

    var getLocationString = function() {
        var loc;
        // Pull out the city from Google's results to display the map.
        var loc_box = getLocBox(getLocalResults().first());
        // If the address has 2 lines, pull the city from the second line
        if (loc_box && loc_box.contents().length >= 4 && loc_box.contents()[1].nodeName == "BR") {
            loc = loc_box.contents().eq(2).text();
        } else {
            // If the address is short just use the first node's text value.
            loc = loc_box.contents().text();
            var loc_description = $('div.intrlu:last a em').text();
            loc = loc_description ? loc_description + ', ' + loc : loc;
        }
        return loc;
    };

    var alreadyReplacedOrEmpty = function() {
        var local_results = getLocalResults();
        return (local_results.length === 0) || local_results.first().data('replaced');
    };

    // args:
    // - a single div.vlsru local result, with a jQuery data key
    //   'to_result', and a key to store current contents.
    // switch to google: switchTo(elt, 'original_result', 'organic_result')
    // switch back to organic: switchTo(elt, 'organic_result', 'original_result')
    var switchTo = function(elt, to_key, store_curr_key) {
        var switch_to = elt.data(to_key);
        if (switch_to) {
            var current = elt.clone();
            elt.replaceWith(switch_to);
            switch_to.data('replaced', true);
            switch_to.data(store_curr_key, current);
            return true;
        }
    };
    var switchAllTo = function(to_key, store_curr_key) {
        getLocalResults().each(function() {
            switchTo($(this), to_key, store_curr_key);
        });
    };
    var switchToGoogle = function() {
        switchAllTo('original_result', 'organic_result');
        menuFormatting('.fl-google');
        return false;
    };
    var switchToFairLocal = function() {
        switchAllTo('organic_result', 'original_result');
        return false;
    };

    function dropResultsInPlace(new_results, top_hosts) {
        if (alreadyReplacedOrEmpty()) {
            return;
        }
        getLocalResults().first().data('replaced', true);

        function afterGeoLocate(geo_loc) {
            // replace the map
            console.log(geo_loc);
            map_geo_loc = geo_loc; // save it for globals
            $('div.rhsvw').attr('id', 'new_map').css('height', '400px');
            init_map(geo_loc);

            // init some services
            infowindow = new google.maps.InfoWindow();
            places_service = new google.maps.places.PlacesService(new_map);

            dropResultsInPlace2(new_results, top_hosts);
        }
        function failedGeoLocate() {
            console.log("Failed geo-location");
            dropResultsInPlace2(new_results, top_hosts);
        }
        setMapLocation(getLocationString(), afterGeoLocate, failedGeoLocate);
    }

    var menuFormatting = function(selected) {
        $('.fl').css({
            'font-weight': 'normal',
            'color': '#12c'
        });
        $(selected).css('font-weight', 'bold');
    };

    function dropResultsInPlace2(new_results, top_hosts) {
        var local_results = getLocalResults();
        console.log("Found " + local_results.length + " local results.");

        // add a little selector button
        var google_link = $('<a href="#" class="fl fl-google"></a>').text(
        'Google+ only results').click(switchToGoogle);
        var fair_link = $('<a href="#" class="fl"></a>').text(
        'Organic results').click(function() {
            switchToGoogle();
            replaceLocalResultsWithNewResults(
            new_results
            );
            menuFormatting(this);
            return false;
        });

        var selector_entry = $('<li class="g"></li>').append(
        google_link).append('<span> &bull; </span>').append(fair_link);

        $.each(top_hosts, function(index, host) {
            if (host) {
                var host_link = $('<a href="#" class="fl"></a>').text(
                host + ' results').click(function(e) {
                    switchToGoogle();
                    replaceLocalResultsWithNewResults(
                    new_results.filter(function(elt) {
                        return elt.host === host;
                    })
                    );
                    menuFormatting(this);
                    return false;
                });
                selector_entry.append('<span> &bull; </span>').append(host_link);
            }
        });
        local_results.first().parent().prepend(selector_entry);

        $('.fl').css('white-space', 'no-wrap');

        replaceLocalResultsWithNewResults(new_results);
        menuFormatting(fair_link);
    }

    var find_places = function(new_results) {
        var local_results = getLocalResults();
    }

    var getLocBox = function(ths) {
        // it's a small one
        if ($(ths).children('h3.r').length === 0) {
            return $(ths).find('div.g div').last();
        }

        // it's a larger local results box, which uses totally different HTML
        else {
            var loc_box_container = $(ths).find('table.intrlu');
            return loc_box_container.find('tr td:nth-child(2)');
        }
    }

    var replaceLocalResultsWithNewResults = function(new_results) {
        var local_results = getLocalResults();
        local_results.first().data('replaced', true);

        // clone to google
        local_results.each(function() {
            $(this).data('original_result', $(this).clone());
        });

        clearMapMarkers();
        letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
        local_results.each(function(idx) {
            var new_result = new_results[idx];

            var set_location_text; // callback
            if (new_result) {

                if (new_result.title) {
                    var cleaned_name = new_result.title.match(/^[^\(\,\-]+/)[0].trim();
                }

/*
                if ($(this).find('h3.r').length === 0) {
                    // There are no h3 title elements -- therefore, this is a smaller
                    // element
                    var title = $(this).find('h4.r');
                    var old_title = title.text();
                    title.empty().append(
                    $('<a class="l" href="' + new_result.url + '"></a>')
                    .text(cleaned_name || new_result.title));

                    var url_box = $(this).find('div.g div span cite');
                    url_box.text(new_result.url_title);

                    var reviews = $(this).find('div.g div a.fl');
                    if (reviews.prev().text().match(/Score|Zagat/g)) {
                        // Remove extra styling ·
                        reviews.parent().contents()[5].remove();
                        // Removes Score
                        reviews.prev().remove();
                    }
                    reviews.replaceWith(new_result.reviews);

                    var loc_box = getLocBox(this);
                    loc_box.text(new_result.location);
                    set_location_text = function(text) {
                        if (!text) {
                            // Remove the map marker if we have no address to show.
                            loc_box.empty();
                            loc_box.prev().empty();
                        } else {
                            loc_box.text(text);
                        }
                    }
                } else {
*/
                    var title = $(this).find('h3.r');
                    var old_title = title.text();
                    title.empty().append(
                    $('<a class="l" href="' + new_result.url + '"></a>')
                    .html(cleaned_name || new_result.title));

                    var url_box = $(this).find('div.g span cite');
                    url_box.empty().text(new_result.url_title);

                    // delete the share link since it forces stuff over margin
                    $(this).find('a.pplsrsla').remove();

                    var reviews = $(this).find('.rtng').parent();
                    if (reviews.length === 0) {
                        reviews = $(this).find('a[jsaction]');
                        if (reviews.length === 0) {
                          reviews = $(this).find('span:contains("Google+ page")');
                        }
                    }

                    // remove "x google reviews" link and booking dropdown
                    reviews.nextAll().remove();
                    reviews.parent().contents()
                        .filter(function() {
                            return this.nodeType === 3;
                        })
                        .remove();
                    if ( new_result.review_count ) {
                        reviews.html('<span style="margin-right:5px" class="rtng">'+ new_result.rating.toFixed(1) + '</span><span class="star star-s"><span style="width:'+ parseInt(new_result.rating * 14)  +'px"></span></span>');
                        reviews.parent().append('<a class="fl" href="'+ new_result.url +'""><span><span style="white-space:nowrap">'+ new_result.review_count +' review'+ (new_result.review_count == 1 ? '' : 's') +'</span></span></a>');
                    } else {
                        reviews.remove();
                    }
                    // Make sure the text under the links doesn't overflow into the address.
                    $(this).find('.f.kv').width($(this).find('h3').width());

                    var loc_box = getLocBox(this);
                    set_location_text = function(text) {
                        if (!text) {
                            // Remove the map marker if we have no address to show.
                            // loc_box.empty();
                            // loc_box.prev().empty();
                        } else {
                            loc_box.text(text);
                        }
                    }
//                }

                var no_html_name = cleaned_name.replace(/(<([^>]+)>)/ig,"");
                addMapPointer(no_html_name, function(result_info) {
                    add_marker(result_info.location, letters[idx], result_info.name);
                    set_location_text(result_info.address);
                }, function(results, status) {
 //                   console.log("didn't find " + no_html_name + " among " + results);
                    set_location_text(null);
                });

            } else {
                // No result to display, so just remove the corresponding placeholder div.
                $(this).empty().hide();
            }
        });
        // Remove buttons for google's righthand detail panel.
        $('.vspiic, .vspib').remove()
    };

    function main() {
        var searching = 0;
        var checkExist = setInterval(function() {
            searching++;
            if ( !alreadyReplacedOrEmpty() ) {
                clearInterval(checkExist);
                var googleQuery = $('#gbqfq').first().val();
                getSearchResult(googleQuery, dropResultsInPlace);
            } else if ( searching > 10 ) {
                clearInterval(checkExist);
            }
        }, 300);
    }

    // Functions for fetching data

    // Given a query string and a callback, this function will perform an
    // asynchronous Google search for the top 100 results, parse the response into
    // HTMLLIElement DOM nodes, filter that set down to only meaningful socially
    // relevent results, fetch photos for the linked profiles of those results,
    // and invoke the callback provided with a sorted list of result objects.
    var getSearchResult = (function() {

        // Takes a 0-5 average rating and the number of reviews
        // and returns the lower bound of the 99% binomial confidence
        // interval (in [0,5])
        var wilsonScore = function(rating, review_count) {
            if (review_count === 0.0) {
                return 0.0;
            }

            var p = (rating / 5.0);
            var n = review_count;

            var z = 2.576;
            var z_sq = z * z;

            var est_den = (z_sq / n) + 1.0;
            var p_hat = (p + (z_sq / (2 * n))) / est_den;

            var error = Math.sqrt(((p * (1.0 - p)) / n) + (z_sq / (4 * n * n)));
            error /= est_den;

            return 5.0 * (p_hat - z * error);
        };

        var cseExtract = function(raw_results) {

            var results = rescoreResults(raw_results.results);
            var host_to_site = {};
            var formattedResults = [];

            $.each(results, function(index, res) {
                var rating = 0;
                var review_count = 0;

                if ( typeof res.richSnippet !== 'undefined' ) {
                    if ( typeof res.richSnippet.aggregaterating !== 'undefined' ) {
                        review_count = res.richSnippet.aggregaterating.reviewcount || 0;
                        rating = res.richSnippet.aggregaterating.ratingvalue || 0;
                    } else if ( typeof res.richSnippet.review !== 'undefined' ) {
                        review_count = res.richSnippet.review.ratingcount || 0;
                        rating = res.richSnippet.review.ratingstars || 0;
                    }
                }
                formattedResults.push({
                    host: res.visibleUrl,
                    rating: parseFloat(rating),
                    review_count: parseFloat(review_count),
                    title: res.title, // use res.titleNoFormatting if we don't want formatting
                    url_title: res.visibleUrl, // res.titleNoFormatting,
                    location: 'LOCATION',
                    wilson_score: wilsonScore(rating, review_count),
                    url: res.url,
                    reviews: 'REVIEWS',
                });
                if (host_to_site.hasOwnProperty(res.visibleUrl)) {
                    host_to_site[res.visibleUrl] += 1;
                } else {
                    host_to_site[res.visibleUrl] = 1;
                }
            });

            var hosts = [];
            for (var host in host_to_site) {
                hosts.push(host);
            }
            hosts.sort(function(a, b) {
                return host_to_site[b] - host_to_site[a];
            });

            var top_hosts = [];
            for (var i = 0; top_hosts.length < 3 && i < hosts.length; i++) {
                var host = hosts[i];
                var host_root = host.match(/.*?\./g)[1] || host;
                var similar_host_found = false;
                for (var j = 0; j < top_hosts.length; j++) {
                    if (top_hosts[j].indexOf(host_root) > -1) {
                        similar_host_found = true;
                        break;
                    }
                }

                if (!similar_host_found) {
                    top_hosts.push(host);
                }
            }
//            console.log('top hosts: ' + top_hosts);

            dropResultsInPlace(formattedResults, top_hosts);
        }

        var rescoreResults = function(results) {
            var filtered = results.filter(function(elt) {
                // Can add filtering by site here if we want...

                // For now, just drop things with 0 scores
                return true;
            });
            filtered.sort(function(a, b) {
                return b.wilson_score - a.wilson_score;
            });
            return filtered;
        };

        var cache = {};
        return function(query, callback) {

//            console.log('Searching for: ' + query);
//            var query = query + siteQueryExtension;

            if (query in cache) {
                return callback(cache[query]);
            }

            var url = '/search?q=' + encodeURIComponent(query) + '&xhr=t&fp=1&psi=1&num=20&complete=0&pws=0';
            var key = 'AIzaSyCVAXiUzRYsML1Pv6RwSG1gunmMikTzQqY';
            var cx = '014217999532204992474:pt-ex0x0afq';
            var num = 20; // 20 is the max value
            var start = 0;
            var cse_callback = 'cseExtract';

            url = 'https://www.googleapis.com/customsearch/v1element?key='+ key +'&rsz=filtered_cse&num='+ num +'&hl=en&start='+ start +'&prettyPrint=false&source=gcsc&gss=.com&sig=4a6d242b76a3ebb1316dedbc04cd169&cx='+ cx +'&q=' + encodeURIComponent(query) + '&sort=&googlehost=www.google.com&gs_l=partner.3...58689.59870.1.60206.13.2.11.0.0.2.149.296.0j2.2.0.gsnos%2Cn%3D13...0.59934j3446915266j14j1..1ac.1.25.partner..24.2.49.hMX8NMgJybc&callback='+ cse_callback +'&nocache=1406137220276';

            var req = new XMLHttpRequest();
            req.onreadystatechange = function(evt) {
                if (req.readyState === 4) {
                    eval(req.responseText);
                }
            };
            req.open("GET", url, true);
            req.send(null);
        };
    })();

    main();
}
