if (window.simflux && window.simflux.history) return;  // prevent double-loading

var zone = window.zone || (typeof zone !== 'undefined' ? zone : require('zone.js')),
    simflux = window.simflux || (typeof simflux !== 'undefined' ? simflux : require('simflux'));

var simfluxVizGraphs = require('./simflux-viz-graphs');

var simfluxViz = function () {

  simflux.history = [];

  // make sure simflux is attached to window since by default it doesn't have to be
  window.simflux = simflux;

  function extendExecutedActions(a,b) {
    for (var p in b) {
      if (a[p])
        a.concat(b[p]);
      else
        a[p] = b[p];
    }
  }

  function patchDispatcher(dispatcher) {
    dispatcher.dispatchedActions = [];
    dispatcher.actionHash = {};
    dispatcher.executedStoreActions = {};
    dispatcher.history = [];
  }

  function patchStore(dispatcher, store) {
    for (var a in store) {
      if (store.hasOwnProperty(a) && typeof store[a] === 'function') {
        (function(a, fn) {
          store[a] = function() {
            if (dispatcher.actionHash[a]) {
              dispatcher.executedStoreActions[a] = dispatcher.executedStoreActions[a] || [];
              dispatcher.executedStoreActions[a].push(store);
            }
            return fn.apply(this, Array.prototype.slice.call(arguments, 0));
          };
        })(a, store[a]);
      }
    }
  }

  function parseView(stack) {

    var viewInfo = stack.match(/\n.+\n\s+at\s+(.+)\n/);
    viewInfo = viewInfo.length>1 ? viewInfo[1] : '[view]';
    viewInfo = viewInfo.match(/^(.+)\((.+)\)$/);

    return {
      view: viewInfo.length>1 ? viewInfo[1].trim() : '[view]',
      viewLocation: viewInfo.length>2 ? viewInfo[2] : ''
    };
  }

  function patchActionCreator(dispatcher, ac) {
    for (var a in ac) {
      if (ac.hasOwnProperty(a) && typeof ac[a] === 'function') {
        (function(pa, fn) {
          ac[pa] = function() {

            var stack = new Error().stack;
            //console.log("-->stack: ", stack);
            var viewInfo = parseView(stack);

            var historyObj = {
              index: simflux.history.length,
              dispatcher: dispatcher,
              preAction: pa,
              preActionFn: fn,
              actionCreator: ac,
              actionHistory: [],
              view: viewInfo.view,
              viewLocation: viewInfo.viewLocation,
              executedStoreActions: {},
              date: new Date()
            };

            simflux.history.push(historyObj);
            dispatcher.history.push(historyObj);

            var thisObj = this;
            var args = Array.prototype.slice.call(arguments, 0);
            var r;

            zone.index = 'root';
            zone.fork({
              afterTask: function () {
                // @todo: will this be incorrect for two sync pre-actions?
                historyObj.actionHistory = historyObj.actionHistory.concat(dispatcher.dispatchedActions);
                dispatcher.dispatchedActions = [];
                extendExecutedActions(historyObj.executedStoreActions, dispatcher.executedStoreActions);
                dispatcher.executedStoreActions = {};
                simfluxVizGraphs.updateHistoryGraph(historyObj.index, simfluxVizGraphs.generateHistoryGraphJSON);
              }
            }).run(function () {
              zone.index = historyObj.index;
              r = fn.apply(thisObj, args); // this runs synchronously so r is always returned below
            });
            return r;
          };
        })(a, ac[a]);
      }
    }
  }

  var odispatch = simflux.Dispatcher.prototype.dispatch;
  simflux.Dispatcher.prototype.dispatch = function(action) {
    this.dispatchedActions.push(action);
    this.actionHash[action] = 1;

    setTimeout(function () {},0); // catch stray actions

    return odispatch.apply(this, Array.prototype.slice.call(arguments, 0));
  };

  var oregisterActionCreator = simflux.Dispatcher.prototype.registerActionCreator;
  simflux.Dispatcher.prototype.registerActionCreator = function(ac) {
    var r = oregisterActionCreator.apply(this, Array.prototype.slice.call(arguments, 0));
    patchActionCreator(this, ac);
    return r;
  };

  var oregisterStore = simflux.Dispatcher.prototype.registerStore;
  simflux.Dispatcher.prototype.registerStore = function(store) {
    var r = oregisterStore.apply(this, Array.prototype.slice.call(arguments, 0));
    patchStore(this, store);
    return r;
  };

  var oinstantiateDispatcher = simflux.instantiateDispatcher;
  simflux.instantiateDispatcher = function(name) {
    var d = oinstantiateDispatcher.apply(this, Array.prototype.slice.call(arguments, 0));
    patchDispatcher(d);
    return d;
  };

  // when simflux-viz is loaded, immediately patch any existing
  // dispatchers, stores, and action creators
  simflux.dispatchers.forEach(function (dispatcher) {
    patchDispatcher(dispatcher);

    // monkey patch stores
    dispatcher.stores.forEach(function (store) {
      patchStore(dispatcher, store);
    });

    // monkey patch action creators
    dispatcher.actionCreators.forEach(function (ac) {
      patchActionCreator(dispatcher, ac);
    });

  });

  console.log("%csimflux-viz loaded", "color:white; background-color:orange; font-size: 14pt; border-radius:8px; padding: 0 10px; font-family:Verdana;");
};

simfluxVizGraphs.initHistoryGraph();
simfluxViz();