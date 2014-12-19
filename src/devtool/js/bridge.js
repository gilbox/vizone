var graphContEl,
    pollFreq = 500;

function insertScriptLoader(src) {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.id = src;
  script.innerText =
        "var s = document.createElement('script');" +
        "s.type = 'text/javascript';" +
        "s.src = '"+src+"';" +
        "document.body.appendChild(s);";
  document.body.appendChild(script);
}

//var scriptUrls = [
//  "http://localhost:3101/demo/vizone-bundle.js",
//  "http://localhost:3101/demo/simflux-viz-bundle.js"
//];
//"https://rawgit.com/gilbox/simflux-viz/master/dist/vizone-bundle.js"
var scriptUrls = JSON.parse(window.vizoneScripts);

scriptUrls.forEach(function (url) {
  if (! document.getElementById(url)) {
    insertScriptLoader(url);
  }
});


function pollGraph() {
  if (graphContEl.children.length) {

    var el,
        data = {
          tabId: window.vizoneTabId,
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
  graphContEl = document.getElementById("vizone");
  if (!graphContEl) return setTimeout(findGraphEl, pollFreq);
  pollGraph();
}

findGraphEl();