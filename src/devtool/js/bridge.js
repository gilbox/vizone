var graphContEl,
    pollFreq = 500,
    scriptsInserted = false,
    timer;

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

// insert scripts into the webpage which will
// handle monkey patching and adding #vizone and #vizone-historyX
// elements to the page
function insertScripts() {
  var scriptUrls = JSON.parse(window.vizoneScripts);

  scriptUrls.forEach(function (url) {
    if (! document.getElementById(url)) {
      insertScriptLoader(url);
    }
    scriptsInserted = true
  });
}

// regularly check for new #vizone-historyX elements
// and send them to the devtool, then remove them from the page immediately
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
  timer = setTimeout(pollGraph, pollFreq);
}

// find #vizone
function findGraphEl() {
  graphContEl = document.getElementById("vizone");
  if (!graphContEl) return timer = setTimeout(findGraphEl, pollFreq);
  pollGraph();
}

// also works with chrome.runtime.onMessage.addListener
chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {

  if (message.type = "set-vizone-enabled") {

    // enable the devtool
    if (message.enabled) {
      if (!scriptsInserted) {
        insertScripts();
      }

      clearTimeout(timer);
      findGraphEl();

    } else {  // disable the devtool

      // @todo: if disabled after enabled, vizone will continue
      // appending to page (won't be picked up by panel until re-enabling)
      // should probably try to figure out a way to pause history accumulation
      clearTimeout(timer);
    }

  }

});