'use strict';

var contEl, historyMax = 1000, historyCount = 0;

// create a div that will house all
// elements for vizone communication
// with the devtool
function initHistoryGraph(rootEl) {
  if (!contEl) {
    contEl = document.createElement("div");
    contEl.id = "vizone";
    contEl.style.display = 'none';
    (rootEl || document.body).appendChild(contEl);
  }
}

// every item represents an application
// flow occurrence (usually a function call)
//
// Items are added to div#vizone.
//
// bridge.js is responsible for removing an item
// as soon as it has been parsed and sent
// to the chart visualization tool
//
// We also handle automatically removing the
// oldest item if the list gets too long but
// if it comes to this then something has probably
// gone wrong because all items should be removed
// by bridge.js immediately after they are added
function appendToHistoryGraph(newItem) {
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

  historyCount++;
}

module.exports = {
  appendToHistoryGraph: appendToHistoryGraph,
  initHistoryGraph: initHistoryGraph
};