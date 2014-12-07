var graphContEl,
    pollFreq = 1000,
    prevGraphCount = 0;

function insertScriptLoader(src) {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.id = 'simflux-viz-script';
  script.innerText =
      "if (window.simflux || (typeof require === 'function' && require.isDefined && require.isDefined('simflux'))) {" +
        "var s = document.createElement('script');" +
        "s.type = 'text/javascript';" +
        "s.src = '"+src+"';" +
        "document.body.appendChild(s);" +
      "} else {" +
        "var s = document.getElementById('simflux-viz-script'); s.id = 'simflux-not-present'; s.innerText='';" +
      "}";
  document.body.appendChild(script);
}

var simfluxNotPresent = !! document.getElementById('simflux-not-present');

if (! document.getElementById('simflux-viz-script') && ! simfluxNotPresent) {
//insertScriptLoader("http://0.0.0.0:3101/demo/simflux-viz-bundle.js");
  insertScriptLoader("https://rawgit.com/gilbox/simflux-viz/master/dist/simflux-viz-bundle.js");
}

function pollGraph() {
  var count = ~~graphContEl.dataset.updateCount;
  if (count !== prevGraphCount) {
    // graph count changed

    var idx = ~~ graphContEl.dataset.startIndex,
        el,
        data = {
          startIdx: idx,
          count: 0
        };

    while (el = document.getElementById('simflux-history-'+idx)) {
      data[idx] = JSON.parse(el.innerText);
      data.count++;
      idx++;
    }

    data.tabId = window.simfluxTabId;

    chrome.extension.sendMessage(data);
    prevGraphCount = count;
  }
  setTimeout(pollGraph, pollFreq);
}

function findGraphEl() {
  if ( ! document.getElementById('simflux-not-present') ) {
    graphContEl = document.getElementById("simflux-history-container");
    if (!graphContEl) return setTimeout(findGraphEl, pollFreq);
    pollGraph();
  }
}

if (! simfluxNotPresent) findGraphEl();