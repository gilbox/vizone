if (window.simflux && window.simflux.history) return;  // prevent double-loading

var zone = window.zone || (typeof zone !== 'undefined' ? zone : require('zone.js')),
    simflux = window.simflux || (typeof simflux !== 'undefined' ? simflux : require('simflux'));

var simfluxVizGraphs = require('./simflux-viz-graphs');

var simfluxViz = function () {

  simflux.history = [];

  // make sure simflux is attached to window since by default it doesn't have to be
  window.simflux = simflux;

  function warn() {
    var args = [
      '%c' + arguments[0],
      'color:darkorange'
    ].concat(Array.prototype.slice.call(arguments, 1));

    // use console.error to get a proper stack trace
    console.error.apply(console, args);
  }

  function extendExecutedActions(a,b) {
    for (var p in b) {
      if (a[p])
        a.concat(b[p]);
      else
        a[p] = b[p];
    }
  }

  function updateHistoryGraph(historyObj) {
    simfluxVizGraphs.updateHistoryGraph(historyObj.index, simfluxVizGraphs.generateHistoryGraphJSON);
  }

  function patchDispatcher(dispatcher) {
    //dispatcher.dispatchedActions = [];
    dispatcher.actionHash = {};
    //dispatcher.executedStoreActions = {};
    dispatcher.history = [];
  }

  function patchStore(dispatcher, store) {
    store.$$$stackInfo = parseStackLine2(store.$$$stack, '[store]');
    for (var a in store) {
      if (store.hasOwnProperty(a) && typeof store[a] === 'function') {
        (function(a, fn) {
          store[a] = function() {
            if (dispatcher.actionHash[a]) {
              //dispatcher.executedStoreActions[a] = dispatcher.executedStoreActions[a] || [];
              //dispatcher.executedStoreActions[a].push(store);
              var historyObj = zone.historyObj;

              if (historyObj) {
                //historyObj.executedStoreActions[a] = historyObj.executedStoreActions[a] || [];
                //historyObj.executedStoreActions[a].push(store);
                historyObj.actionHistory[historyObj.actionHistory.length-1].stores.push(store);
                updateHistoryGraph(historyObj);
              } else {
                warn("simflux-viz: store action handler invoked outside of viz zone");
              }
            }
            return fn.apply(this, Array.prototype.slice.call(arguments, 0));
          };
        })(a, store[a]);
      }
    }
  }

  function parseStackLine2(stack, defaultFnName) {

    var stackInfo = stack.match(/\n.+\n\s+at\s+(.+)\n/);
    stackInfo = stackInfo.length>1 ? stackInfo[1] : defaultFnName;
    stackInfo = stackInfo.match(/^(.+)\((.+)\)$/);

    return {
      fnName: stackInfo.length>1 ? stackInfo[1].trim() : defaultFnName,
      location: stackInfo.length>2 ? stackInfo[2] : ''
    };
  }

  function patchActionCreator(dispatcher, ac) {
    ac.$$$stackInfo = parseStackLine2(ac.$$$stack, '[actionCreator]');
    for (var a in ac) {
      if (ac.hasOwnProperty(a) && typeof ac[a] === 'function') {
        (function(pa, fn) {
          ac[pa] = function() {

            var stack = new Error().stack;
            //console.log("-->stack: ", stack);
            var viewInfo = parseStackLine2(stack, '[view]');

            var historyObj = {
              index: simflux.history.length,
              dispatcher: dispatcher,
              preAction: pa,
              preActionFn: fn,
              actionCreator: ac,
              actionHistory: [],
              view: viewInfo.fnName,
              viewLocation: viewInfo.location,
              //executedStoreActions: {},
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
                // @todo: do we still need this?
                //historyObj.actionHistory = historyObj.actionHistory.concat(dispatcher.dispatchedActions);
                //dispatcher.dispatchedActions = [];
                //extendExecutedActions(historyObj.executedStoreActions, dispatcher.executedStoreActions);
                //dispatcher.executedStoreActions = {};
                updateHistoryGraph(historyObj);
              }
            }).run(function () {
              zone.historyObj = historyObj;
              zone.index = historyObj.index;
              r = fn.apply(thisObj, args); // this runs synchronously so r is always returned below
            });
            return r;
          };
        })(a, ac[a]);
      }
    }
  }

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

  var odispatch = simflux.Dispatcher.prototype.dispatch;
  simflux.Dispatcher.prototype.dispatch = function(action) {
    //this.dispatchedActions.push(action);
    var args = Array.prototype.slice.call(arguments, 0);

    this.actionHash[action] = 1;

    if (zone.historyObj) {
      var actionHistoryObj = {
        action: action,
        stores: [],
        args: args.slice(1)
      };
      zone.historyObj.actionHistory.push(actionHistoryObj);
      updateHistoryGraph(zone.historyObj);
    } else {
      warn("simflux-viz: dispatched outside of viz zone");
    }

    //setTimeout(function () {},0); // catch stray actions

    return odispatch.apply(this, args);
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

  console.log("%csimflux-viz loaded", "color:white; background-color:orange; font-size: 14pt; border-radius:8px; padding: 0 10px; font-family:Verdana;");
};

simfluxVizGraphs.initHistoryGraph();
simfluxViz();