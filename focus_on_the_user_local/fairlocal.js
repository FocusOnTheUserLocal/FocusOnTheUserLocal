function fl_initialize() {


    // Various regexes
    var configs = {
        // General, page-wide configs
        googleQuery: "input[name='q']", // Google query textbox
        googleSearchUrl: "https://www.google.com/search?q=", // The full url for performing a google query

        // Local per-result configs (appear for each local result)
        localResults: '._oL > div', // Each local row row
        resultLink: 'a[role="link"].rllt__link', // The result link (anything left of the website/directions buttons)
        resultTitle: 'div._rl', // The result title/name
        resultReviews: '._mfe', // The result reviews line (e.g. "4.3 <stars> 12 reviews")
        resultNoReviews: '._Juh', // The result reviews line when there are no reviews (where it says "No reviews")
        resultDirectionsButton: '.rllt__directions-button', // Results directions button
        resultClassification: '._tf', // Result classification (e.g. "barbershop") and distance information
        resultOpeningTimes: '.rllt__qs-status', // Result opening times
        resultVisitWebsite: '._cGe', // Result 'visit website' link
        resultImage: '._li', // Result image (container)
        resultPrice: '._Nl', // Result price
        resultProperties: '._Yig', // Result properties (e.g. free breakfast)
        resultRestaurantProperties: '._it', // Result restaurant-specific properties (e.g. Zagat rated)
        resultWebsiteButton: '._Jrh', // Result website icon
        resultZaggatRating: '._Dwh', // Result zaggat rating line
        resultHotelProperties: '._WQg', // Result hotel properties (e.g. "Free Wi-Fi")
        resultAddress: '._swf', // Result exact address

        moreResultsLink: 'a._B3g', // The link part (a href) that says "More barbershops" etc.

        // General local results configs (appear once in page)
        restaurantFilters: '._KPf', // Restaurant filters (e.g. by price, rating)
        hotelFilters: '._kZ', // Hotel filters (e.g. by price, rating)
        resultsMap: '#lu_map', // The map that displays the original results

        // Mapping between result domain URL to site name
        hostNameToSiteName: {
            'www.yelp.com': 'Yelp',
            'www.tripadvisor.com': 'TripAdvisor',
            'www.hotels.com': 'Hotels.com',
            'www.zocdoc.com': 'ZocDoc',
        }
    };

    var gLastGoogleQuery= null;

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
        return jQuery(configs.localResults);
    };


    // Decodes an address from a Google Maps direction URL
    var getAddressFromDirectionsUrl = function(url) {
        var address = decodeURIComponent(url.split('/').splice(-2,1)[0].replace(/\+/g, '%20'));
        return address;
    };

    var getLocationString = function() {
        var loc;
        var loc = getLocalResults().first().find(configs.resultDirectionsButton);
        var loc_string = loc.attr('href');

        if (loc_string) {
            return getAddressFromDirectionsUrl(loc_string);
        } else {
            return null;
        }
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
        $(configs.resultsMap).show();
        $('#new_map').hide();
        // Show restaurant filters
        $(document).find(configs.restaurantFilters).show();
        // Show hotel filters
        $(document).find(configs.hotelFilters).show();

        var moreResults = $(document).find(configs.moreResultsLink);
        moreResults.attr('href', moreResults.data('original_url'));
        var moreResultsText = moreResults.find('span');
        moreResultsText.html(moreResultsText.data('original_content'));


        return false;
    };
    var switchToFairLocal = function() {
        switchAllTo('organic_result', 'original_result');
        $(configs.resultsMap).hide();
        $('#new_map').show();
        return false;
    };

    function dropResultsInPlace(new_results, top_hosts) {
        console.error("dropResultsInPlace", getLocalResults().first().find(configs.resultTitle).text());

        console.log("new_results", new_results);
        console.log("top_hosts", top_hosts);
        if (alreadyReplacedOrEmpty()) {
            console.error('Already replaced!', getLocalResults());
            return;
        }
        getLocalResults().first().data('replaced', true);

        function afterGeoLocate(geo_loc) {
            // replace the map
            console.log(geo_loc);
            map_geo_loc = geo_loc; // save it for globals
            $(configs.resultsMap).parent().append('<div id="new_map" style="height:200px"></div>');
            init_map(geo_loc);
            $(configs.resultsMap).hide();
            $('#new_map').show();

            // init some services
            infowindow = new google.maps.InfoWindow();
            places_service = new google.maps.places.PlacesService(new_map);

            dropResultsInPlace2(new_results, top_hosts);
        }
        function failedGeoLocate() {
            console.log("Failed geo-location");
            dropResultsInPlace2(new_results, top_hosts);
        }
        console.log('getLocationString', getLocationString());
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
        var selector_entry = $('<li class="g"></li>').append(google_link);

        var selected_host_link = null;
        var selected_host_name = null;
        var selected_host_url = null;

        $.each(top_hosts, function(index, host) {
            if (host) {
                var host_link = $('<a href="#" class="fl"></a>').text(
                hostNameToSiteName(host) + ' results').click(function(e) {
                    switchToGoogle();
                    replaceLocalResultsWithNewResults(
                    new_results.filter(function(elt) {
                        return elt.host === host;
                    })
                    );
                    menuFormatting(this);
                    $(configs.resultsMap).hide();
                    $('#new_map').show();


                    var googleQuery = $(configs.googleQuery).first().val();
                    var moreResults = $(document).find(configs.moreResultsLink);
                    moreResults.attr('href', configs.googleSearchUrl + encodeURIComponent(googleQuery + ' site:' + host).replace(/ /g, '%20'));
                    var moreResultsText = moreResults.find('span');
                    moreResultsText.html(moreResultsText.data('original_content') + ' from ' + hostNameToSiteName(host));

                    return false;
                });
                selector_entry.append('<span> &bull; </span>').append(host_link);

                if (host == new_results[0].visible_url) {
                    selected_host_link = host_link;
                    selected_host_name = hostNameToSiteName(host);

                    var googleQuery = $(configs.googleQuery).first().val();
                    selected_host_url =  configs.googleSearchUrl + encodeURIComponent(googleQuery + ' site:' + host).replace(/ /g, '%20');
                }
            }
        });
        local_results.first().parent().prepend(selector_entry);

        $('.fl').css('white-space', 'no-wrap');

        replaceLocalResultsWithNewResults(new_results);
        if (selected_host_link != null) {
            menuFormatting(selected_host_link);

            var moreResults = $(document).find(configs.moreResultsLink);
            var moreResultsText = moreResults.find('span');
            moreResults.data('original_url', moreResults.attr('href'));
            moreResultsText.data('original_content', moreResultsText.html());
            moreResults.attr('href', selected_host_url);
            moreResultsText.html(moreResultsText.data('original_content') + ' from ' + selected_host_name);
        }

    }

    var find_places = function(new_results) {
        var local_results = getLocalResults();
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

            var set_location_url; // callback
            if (new_result) {

                if (new_result.title) {
                    var cleaned_name = new_result.title.match(/(^.+?)(?: [\(\,\-] )/)[1].trim();
                    cleaned_name = $('<div>' + cleaned_name + '</div>').text();
                }

                var title = $(this).find(configs.resultTitle);
                var old_title = title.text();
                title.empty().html(cleaned_name || new_result.title);
                var resultLink = $(this).find(configs.resultLink);
                resultLink.click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    window.location.href = new_result.url;

                    return false;
                });

                var reviews = $(this).find(configs.resultReviews);
                if (reviews.size() == 0) {
                    reviews = $(this).find(configs.resultNoReviews);
                }

                if (new_result.review_count) {
                    reviews.html('<span style="margin-right:5px" class="rtng" aria-hidden="true">' + new_result.rating.toFixed(1) + '</span>' +
                        '<g-review-stars><span class="_pxg _Jxg" aria-label="Rated ' + new_result.rating.toFixed(1) + ' out of 5"><span style="width:' + ((new_result.rating / 5.0) * 100) + '%"></span></span></g-review-stars>' +
                        '<div style="display:inline;font-size:13px;margin-left:5px"><span>' + new_result.review_count + ' ' + new_result.site_name + ' reviews</span></div>'
                        );
                } else {
                    // No reviews
                    reviews.remove();
                }


                // Remove classification and distance information
                $(this).find(configs.resultClassification).remove();
                // Remove opening times information
                $(this).find(configs.resultOpeningTimes).remove();
                // Make the website icon, if exists, with a null URL
                $(this).find(configs.resultWebsiteButton).click(function(e) { e.preventDefault(); return false; });
                // Remove Zagat rating
                $(this).find(configs.resultZaggatRating).remove();
                // Remove result address
                $(this).find(configs.resultAddress).remove();
                // Remove hotel properties 
                $(this).find(configs.resultHotelProperties).remove();
                // Remove 'visit website'
                $(this).find(configs.resultVisitWebsite).remove();
                if (new_result.image) {
                    $(this).find(configs.resultImage).find('img').attr('src', new_result.image);
                } else {
                    // Remove hotel photo
                    $(this).find(configs.resultImage).remove();
                }
                // Remove restaurant properties
                $(this).find(configs.resultRestaurantProperties).remove();
                // Remove hotel price
                $(this).find(configs.resultPrice).remove();
                // Remove hotel properties (e.g. free breakfast)
                $(this).find(configs.resultProperties).remove();
                // Hide restaurant filters
                $(document).find(configs.restaurantFilters).hide();
                // Hide hotel filters
                $(document).find(configs.hotelFilters).hide();

                var loc_box = $(this).find(configs.resultDirectionsButton);
                set_location_url = function(text) {
                    if (!text) {
                        // Remove the map marker if we have no address to show.
                        loc_box.remove();
                    } else {
                        loc_box.attr('href', "/maps/dir/''/" + encodeURIComponent(text));
                    }
                }

                addMapPointer(cleaned_name, function(result_info) {
                    console.log("addMapPointer", result_info);
                    add_marker(result_info.location, letters[idx], result_info.name);
                    set_location_url(result_info.address);
                }, function(results, status) {
 //                   console.log("didn't find " + no_html_name + " among " + results);
                    set_location_url(null);
                });

            } else {
                // No result to display, so just remove the corresponding placeholder div.
                $(this).empty().hide();
            }
        });

    };

    var hostNameToSiteName = function(host) {
        if (configs.hostNameToSiteName[host.toLowerCase()]) {
            return configs.hostNameToSiteName[host.toLowerCase()];
        }

        // Return default name - strip out the www. prefix and .com suffix
        var siteName = host.toLowerCase();
        if (siteName.startsWith('www.')) siteName = siteName.substr(4);
        var pieces = siteName.split('.');
        siteName = pieces.slice(0, pieces.length - 1).join('.');
        siteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);

        return siteName;
    };


    function main() {
        var searching = 0;
        var checkExist = setInterval(function() {
            searching++;
            console.log("Searching ", searching);
            if ( jQuery && !alreadyReplacedOrEmpty() ) {
                jQuery(window).on('hashchange', function() {
                    var googleQuery = $(configs.googleQuery).first().val();
                    console.error('hashchange', googleQuery);
                    if (googleQuery != gLastGoogleQuery) {
                        // New query - results will change inline (without reloading the page)
                        gLastGoogleQuery = googleQuery;
                        console.error('hashchange2', googleQuery);

                        // Wait for the new results to be replaced
                        var newResultsCheckCount = 0;
                        var checkNewResults = setInterval(function() {
                            newResultsCheckCount++;
                            var localResults = getLocalResults();
                            if (localResults && localResults.size() > 0) {
                                if (!localResults.first().data('replaced')) {
                                    // Inject our FOTU results
                                    console.error('inject!');
                                    clearInterval(checkNewResults);
                                    getSearchResult(googleQuery, dropResultsInPlace);
                                    return;
                                }
                            }

                            if (newResultsCheckCount > 10) {
                                clearInterval(checkNewResults);
                            }
                        }, 100);
                    }
                });

                clearInterval(checkExist);
                var googleQuery = $(configs.googleQuery).first().val();
                gLastGoogleQuery = googleQuery;
                console.error('inject0!');
                getSearchResult(googleQuery, dropResultsInPlace);
            } else if ( searching > 20 ) {
                clearInterval(checkExist);
            }
        }, 100);

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

        var totalResults = [];
        var cseExtract = function(raw_results) {

            totalResults = raw_results.results.concat(totalResults);

            if ((raw_results.results.length == 20) && (totalResults.length < 100)) {
                // We're still appending results
                return;
            }

            var host_to_site = {};
            var formattedResults = [];

            var results = totalResults;
            $.each(results, function(index, res) {
                var rating = 0;
                var review_count = 0;

                if ( typeof res.richSnippet !== 'undefined' ) {
                    if ( typeof res.richSnippet.aggregaterating !== 'undefined' ) {
                        if (res.richSnippet.aggregaterating.reviewcount) {
                            review_count = res.richSnippet.aggregaterating.reviewcount;
                        }  else if (res.richSnippet.aggregaterating.ratingcount) {
                            review_count = res.richSnippet.aggregaterating.ratingcount;
                        } else {
                            review_count = 0;
                        }

                        rating = res.richSnippet.aggregaterating.ratingvalue || 0;
                    } else if ( typeof res.richSnippet.review !== 'undefined' ) {
                        review_count = res.richSnippet.review.ratingcount || 0;
                        rating = res.richSnippet.review.ratingstars || 0;
                    }
                }

                if ((!res.titleNoFormatting.match(/(^.+?)(?: [\(\,\-] )/)) || (res.richSnippet && res.richSnippet.article)) {
                    // It's not a specific hotel/restaurant result (e.g. "Downtown Las Vegas Hotels: Find 21 Hotel Deals near Downtown")
                    return;
                }

                var image = null;

                if (res.richSnippet) {
                    if (res.richSnippet.cseThumbnail && res.richSnippet.cseThumbnail.src) {
                        image = res.richSnippet.cseThumbnail.src;
                    } else if (res.richSnippet.cseImage && res.richSnippet.cseImage.src) {
                        image = res.richSnippet.cseImage.src
                    }
                }

                console.log('raw result', res);

                var formattedResult = {
                    host: res.visibleUrl,
                    rating: parseFloat(rating),
                    image: image, 
                    site_name: hostNameToSiteName(res.visibleUrl),
                    review_count: parseFloat(review_count),
                    title: res.titleNoFormatting, // use res.titleNoFormatting if we don't want formatting
                    url_title: res.visibleUrl, // res.titleNoFormatting,
                    location: 'LOCATION',
                    wilson_score: wilsonScore(rating, review_count),
                    url: res.url,
                    visible_url: res.visibleUrl,
                    reviews: 'REVIEWS',
                };
                console.log('raw result 2', formattedResult.rating, formattedResult.review_count, formattedResult.image);
                formattedResults.push(formattedResult);
                if (host_to_site.hasOwnProperty(res.visibleUrl)) {
                    host_to_site[res.visibleUrl] += 1;
                } else {
                    host_to_site[res.visibleUrl] = 1;
                }
            });

            formattedResults = rescoreResults(formattedResults);


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

            if (query in cache) {
                return callback(cache[query]);
            }

            var key = 'AIzaSyCVAXiUzRYsML1Pv6RwSG1gunmMikTzQqY';
            var cx = '014217999532204992474:pt-ex0x0afq';
            var num = 20; // 20 is the max value
            var start = 0;
            var cse_callback = 'cseExtract';

            totalResults = [];
            var requests = [];
            while (start < 100) {
                url = 'https://www.googleapis.com/customsearch/v1element?key='+ key +'&rsz=filtered_cse&num='+ num +'&hl=en&start='+ start +'&prettyPrint=false&source=gcsc&gss=.com&sig=4a6d242b76a3ebb1316dedbc04cd169&cx='+ cx +'&q=' + encodeURIComponent(query) + '&sort=&googlehost=www.google.com&gs_l=partner.3...58689.59870.1.60206.13.2.11.0.0.2.149.296.0j2.2.0.gsnos%2Cn%3D13...0.59934j3446915266j14j1..1ac.1.25.partner..24.2.49.hMX8NMgJybc'; //&callback='+ cse_callback +'&nocache=1406137220276';

                requests.push($.ajax({ url: url , dataType: 'json', success: function(data) {
                    cseExtract(data);
                    }
                , error: function(e) {
                    console.log("error", e);
                }}));
                start += num;
            }

            $.when.apply(this, requests).done(function() {
                console.log("done");
            });


        };
    })();
    console.log("fairlocal");

    main();
}
