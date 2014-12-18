var graphContEl,
    pollFreq = 500;

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
//insertScriptLoader("http://localhost:3101/demo/vizone-bundle.js");
  insertScriptLoader("https://rawgit.com/gilbox/simflux-viz/master/dist/vizone-bundle.js");
}

function pollGraph() {
  if (graphContEl.children.length) {

    var el,
        data = {
          tabId: window.simfluxTabId,
          type: 'vizone-history',
          items: []
        };

    while (el = graphContEl.children[0]) {
      data.items.push(JSON.parse(el.innerText));
      el.remove();
    }

    chrome.extension.sendMessage(data);

  }
  setTimeout(pollGraph, pollFreq);
}

function findGraphEl() {
  if ( ! document.getElementById('simflux-not-present') ) {
    graphContEl = document.getElementById("vizone");
    if (!graphContEl) return setTimeout(findGraphEl, pollFreq);
    pollGraph();
  }
}

if (! simfluxNotPresent) findGraphEl();