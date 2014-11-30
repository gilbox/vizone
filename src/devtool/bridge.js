function insertScript(src) {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = src;
  //document.body.insertBefore(script, document.body.firstChild);
  document.body.appendChild(script);
}

insertScript("simflux-viz-bundle.js");

var graphContEl,
    pollFreq = 1000,
    prevGraphCount = 0;

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

    chrome.extension.sendMessage(data);
    prevGraphCount = count;
  }
  setTimeout(pollGraph, pollFreq);
}

function findGraphEl() {
  graphContEl = document.getElementById("simflux-history-container");
  if (!graphContEl) return setTimeout(findGraphEl, pollFreq);
  pollGraph();
}

findGraphEl();