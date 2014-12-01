var simflux = window.simflux || (typeof simflux !== 'undefined' ? simflux : require('simflux'));

var SimfluxGraph = require('./SimfluxGraph');

// printf-ish-style formatting
function fstr(str) {
  var args = Array.prototype.slice.call(arguments, 1);
  return str.replace(/{(\d+)}/g, function(match, number) {
    return typeof args[number] != 'undefined'
      ? args[number]
      : match
      ;
  });
}

// generates graph viz text output
// http://cpettitt.github.io/project/dagre-d3/latest/demo/interactive-demo.html
simflux.generateHistoryGraph = function (idx) {
  var historyObj = simflux.history[idx],
    acName = historyObj.actionCreator.name || '[actionCreator]',
    storeIdx = 0,
    r = "digraph {\n";

  r += "node [rx=5 ry=5 labelStyle=\"font: 300 14px 'Helvetica Neue', Helvetica\"];\n";
  r += "edge [labelStyle=\"font: 300 14px 'Helvetica Neue', Helvetica\"];\n";
  r += fstr("V [labelType=\"html\" label=\"<h2>{0}</h2><small>{1}</small>\"];\n", historyObj.view, historyObj.viewLocation);
  r += fstr("PA [labelType=\"html\" label=\"{0}.<b>{1}</b>\" style=\"fill: #0a0; font-weight: bold\"];\n", acName, historyObj.preAction);
  r += "V->PA\n";

  historyObj.actionHistory.forEach(function (a, i) {
    r += fstr("A{0} [label=\"{1}\" style=\"fill: #f77; font-weight: bold\"];\n", i, a);
    r += fstr("PA->A{0};\n", i);

    if (historyObj.executedStoreActions[a]) {
      historyObj.executedStoreActions[a].forEach(function (store) {
        var storeName = store.storeName || '[store]';
        storeIdx++;
        r += fstr("S{0} [label=\"{1}.{2}\" style=\"fill: #aa8; font-weight: bold\"];\n", storeIdx, storeName, a);
        r += fstr("A{0}->S{1};\n", i, storeIdx);
      });
    }
  });

  r += "}\n";

  return r;
};

simflux.generateHistoryGraphURL = function (idx) {
  return 'http://cpettitt.github.io/project/dagre-d3/latest/demo/interactive-demo.html?graph=' + encodeURIComponent(simflux.generateHistoryGraph(idx));
};

simflux.generateLastHistoryGraphURL = function () {
  return simflux.generateHistoryGraphURL(simflux.history.length-1);
};

simflux.generateHistoryGraphJSON = function (idx) {
  var historyObj = simflux.history[idx],
    acName = historyObj.actionCreator.name || '[actionCreator]',
    storeIdx = 0,
    graph = new SimfluxGraph();

  graph.addNode('V', { type: 'view', view: historyObj.view, location: historyObj.viewLocation });
  graph.addNode('PA', {
    type: 'preAction',
    acName:acName,
    preAction:historyObj.preAction,
    fnName: historyObj.actionCreator.$$$stackInfo.fnName,
    location: historyObj.actionCreator.$$$stackInfo.location
  });
  graph.addArrow('V','PA');

  historyObj.actionHistory.forEach(function (action, i) {
    var actionNodeName = 'A'+i;
    graph.addNode(actionNodeName, { type: 'action', action: action });
    graph.addArrow('PA', actionNodeName);

    if (historyObj.executedStoreActions[action]) {
      historyObj.executedStoreActions[action].forEach(function (store) {
        var storeName = store.storeName || '[store]';
        var storeNodeName = 'S'+storeIdx;
        storeIdx++;
        graph.addNode(storeNodeName, {
          type: 'store',
          store: storeName,
          action: action,
          fnName: store.$$$stackInfo.fnName,
          location: store.$$$stackInfo.location
        });
        graph.addArrow(actionNodeName, storeNodeName);
      });
    }
  });

  return JSON.stringify(graph.toObject());
};

var contEl, historyMax = 5, updateCount = 0;

simflux.initHistoryGraph = function () {
  if (!contEl) {
    contEl = document.createElement("div");
    contEl.id = "simflux-history-container";
    contEl.style.display = 'none';
    contEl.dataset.updateCount = 0;
    document.body.appendChild(contEl);
  }
};

// @todo: auto-debounce graph updates
simflux.updateHistoryGraph = function(idx, graphFn) {
  simflux.initHistoryGraph();

  var id = 'simflux-history-'+idx;
  var el = document.getElementById('simflux-history-'+idx);
  var graph = graphFn(idx);

  if (!el) {
    el = document.createElement('pre');
    el.id = id;
    el.innerText = graph;
    contEl.appendChild(el);

    // remove oldest graph if reached buffer limit
    if (idx >= historyMax) {
      el = document.getElementById('simflux-history-'+(idx-historyMax));
      contEl.removeChild(el);
      contEl.dataset.startIndex = idx-historyMax+1;
    }
  } else {
    el.innerText = graph;
  }

  // we'll use this to monitor for changes
  contEl.dataset.updateCount = updateCount++;
};

module.exports = simflux;