'use strict';

var contEl, historyMax = 1000, historyCount = 0;

function initHistoryGraph() {
  if (!contEl) {
    contEl = document.createElement("div");
    contEl.id = "vizone";
    contEl.style.display = 'none';
    contEl.dataset.updateCount = 0;
    document.body.appendChild(contEl);
  }
}

function appendToHistoryGraph(historyObj, newItem) {
  var id = 'vizone-'+historyCount;

  var el = document.createElement('pre');
  el.id = id;
  el.innerText = JSON.stringify(newItem);
  contEl.appendChild(el);

  // remove oldest graph if reached buffer limit
  if (historyCount >= historyMax) {
    el = document.getElementById('vizone-'+(historyCount-historyMax));
    if (el) {
      contEl.removeChild(el);
    }
  }

  // we'll use this to monitor for changes
  contEl.dataset.updateCount = historyCount++;
}

module.exports = {
  appendToHistoryGraph: appendToHistoryGraph,
  initHistoryGraph: initHistoryGraph
};