/**
 * Created by Roadkill on 5/6/15.
 */
(function() {
    'use strict';
    var resultsPerPage = 10;
    (function () {
        require([{
            'Promise': 'es6-promise.min.js'
        }]);

        var searchForm = document.getElementById('searchForm');
        searchForm.addEventListener('submit', function (e) {
            var searchTerm = document.getElementById('txtSearch').value;
            document.getElementById('pagination').setAttribute('data-search-term',document.getElementById('txtSearch').value);
            e.preventDefault();
            getData(searchTerm,0);
        }, false);
        document.getElementById('pagination').addEventListener('click', nextPrevPage, false);

    })();

    function createJsonPTwitchPromise(searchTerm,offset) {
        var jsonp = new Promise(function (resolve, reject) {
            if (isNaN(offset)) {
                console.log("Error: number of results to offset is not a number");
                reject();
                return;
            }
            if(searchTerm.trim() === ""){
                alert("Search term cannot be empty");
                reject();
                return;
            }
            searchTerm = encodeURIComponent(searchTerm);
            var callback = 'jsonp_' + Math.floor(Math.random() * 100000);
            var src = "https://api.twitch.tv/kraken/search/streams?q=" + searchTerm + '&callback=' + callback + '&offset=' + offset;
            var s = loadScript(src);
            s.onerror = reject;
            window[callback] = function (data) {
                data._offset = offset;
                resolve(data);
                document.getElementsByTagName('head')[0].removeChild(s);
               try{ delete window[callback]; }
               catch(e){ window[callback] = undefined; }
            };
        });

        return jsonp;
    }


    function getData(searchTerm,offset) {
        document.getElementById('loadingInfo').style.display = "inline";
        var promise = createJsonPTwitchPromise(searchTerm,offset);
        promise
            .then(function (data) {
                document.getElementById('loadingInfo').style.display = "none";
                renderUI(data);
            })
            ['catch'](function (error) {
                document.getElementById('loadingInfo').style.display = "none";
                document.getElementById('streams').textContent = "An error occurred while loading the data.";
            if(error)
                 console.log(error.message);
            });
    }

    function renderUI(data) {
        var total = data._total;
        var streamsDiv = document.getElementById('streams');
        var pagination = document.getElementById('pagination');
        document.getElementById('resultsCount').textContent = "Total Results: " + total;
        if (total === 0) {
            streamsDiv.textContent = "No results found.";
            pagination.style.display = 'none';
            return;
        }
        var offset = data._offset;
        var currentPage = offset / resultsPerPage === 0 ? 1 : (offset / resultsPerPage) + 1;
        var totalPages = Math.ceil(data._total / resultsPerPage);

        document.getElementById('currentPage').textContent = currentPage.toString() + "/" + totalPages.toString();
        pagination.style.display = 'block';
        pagination.setAttribute('data-total-results', total);
        pagination.setAttribute('data-offset', offset);
        var documentFragment = document.createDocumentFragment();
        var streams = data.streams;
        streams.forEach(function (stream) {
            var streamContainer = createElement('div', '', 'stream');
            var leftDiv = createElement('div', '', 'left');
            var streamImg = createElement('img');
            streamImg.src = stream.preview.medium;
            streamImg.style.display = 'none';
            streamImg.onload = function(){this.style.display = 'block';}
            var rightDiv = createElement('div', '', 'right');
            var streamHeading = createElement('h2', stream.channel.display_name);
            var viewersText = stream.game + " - " + stream.viewers.toString() + " viewers";
            var gameViewers = createElement('div', viewersText, 'gameViewers');
            var status = createElement('div', stream.channel.status);
           addChild(documentFragment,
               addChild(streamContainer,
                   addChild(leftDiv, streamImg),
                   addChild(rightDiv, streamHeading, gameViewers, status)
               )
           );

        });
        streamsDiv.innerHTML = '';
        streamsDiv.appendChild(documentFragment);
    }

    function createElement(tag, text, cssClass) {
        var ele = document.createElement(tag);
        if (typeof text != 'undefined' && text !== '')
            ele.textContent = text;
        if (typeof cssClass != 'undefined')
            ele.classList.add(cssClass);
        return ele;

    }

    function addChild(parent) {
        var children = Array.prototype.slice.call(arguments, 1);
        children.forEach(function (child) {
            parent.appendChild(child);
        });
        return parent;
    }

    function nextPrevPage(e) {
        var target = e.target;
        var totalResults= parseInt(this.getAttribute('data-total-results'), 10);
        var offset = parseInt(this.getAttribute('data-offset'), 10);
        var searchTerm = this.getAttribute('data-search-term')
        if (target.getAttribute('data-action') === "prev" && offset !== 0) {
            offset -= resultsPerPage;
            getData(searchTerm,offset);
        }
        if (target.getAttribute('data-action') === 'next' && (offset + resultsPerPage) < totalResults) {
            offset += resultsPerPage;
            getData(searchTerm,offset);
        }
    }

    function require(list){
       list.forEach(function(dependency){
           var key = Object.keys(dependency)[0];
           if(!window[key])
            loadScript(dependency[key]);
       });
    }

    function loadScript(src){
        var s = document.createElement('script');
        s.type = "text/javascript";
        s.src = src;
        s.async = true;
        document.getElementsByTagName('head')[0].appendChild(s);
        return s;
    }

})();
