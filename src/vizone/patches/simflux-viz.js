var simflux = window.simflux || (typeof simflux !== 'undefined' ? simflux : (require && require.defined && require.defined('simflux') && require('simflux')));

if (!simflux) return; // fail silently

if (simflux && simflux.simfluxVizLoaded) return;  // prevent double-loading
simflux.simfluxVizLoaded = true;

var vizone = window.vizone;

var simfluxViz = function () {

  // make sure simflux is attached to window since by default it doesn't have to be
  window.simflux = simflux;

  //function warn() {
  //  var args = [
  //    '%c' + arguments[0],
  //    'color:darkorange'
  //  ].concat(Array.prototype.slice.call(arguments, 1));
  //
  //  // use console.error to get a proper stack trace
  //  console.error.apply(console, args);
  //}

  function patchStore(store) {
    store.$$$stackInfo = parseStackLine2(store.$$$stack, '[store]');
    for (var a in store) {
      if (store.hasOwnProperty(a) && typeof store[a] === 'function') {
        (function(a, fn) {
          store[a] = function() {
            var storeName = store.storeName || '[Store]';
            return vizone(
              Function.apply.bind(fn, this, Array.prototype.slice.call(arguments, 0)),
              {
                title: storeName,
                subtitle: a,
                class: 'Node--store',
                sourceLink: {
                  label: storeName,
                  url: store.$$$stackInfo.location
                }
              }
            );
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

  function patchActionCreator(ac) {
    ac.$$$stackInfo = parseStackLine2(ac.$$$stack, '[actionCreator]');
    for (var a in ac) {
      if (ac.hasOwnProperty(a) && typeof ac[a] === 'function') {
        (function(pa, fn) {
          ac[pa] = function() {

            var stack = new Error().stack;
            //console.log("-->stack: ", stack);
            var viewInfo = parseStackLine2(stack, '[view]'),
                args = Array.prototype.slice.call(arguments, 0),
                acName = (ac.name || '[Action Creator]');

            var historyObj = {
              title: acName + '.<b>' + pa + '</b>',
              args: args,
              sourceLink: {
                label: acName,
                url: ac.$$$stackInfo.location
              },
              class: 'Node--actionCreator'
            };

            var parentObj = {
              title: viewInfo.fnName,
              sourceLink: {
                label: viewInfo.fnName,
                url: viewInfo.location
              },
              class: 'Node--actionOriginator'
            };

            return vizone(Function.apply.bind(fn, this, args), historyObj, parentObj);
          };
        })(a, ac[a]);
      }
    }
  }

  // when simflux-viz is loaded, immediately patch any existing
  // dispatchers, stores, and action creators
  simflux.dispatchers.forEach(function (dispatcher) {
    // monkey patch stores
    dispatcher.stores.forEach(function (store) {
      patchStore(store);
    });

    // monkey patch action creators
    dispatcher.actionCreators.forEach(function (ac) {
      patchActionCreator(ac);
    });

  });

  var odispatch = simflux.Dispatcher.prototype.dispatch;
  simflux.Dispatcher.prototype.dispatch = function(action) {
    return vizone(
      Function.apply.bind(odispatch, this, Array.prototype.slice.call(arguments, 0)),
      {
        title: action,
        args: Array.prototype.slice.call(arguments, 1),
        class: 'Node--action'
      }
    );
  };

  var oregisterActionCreator = simflux.Dispatcher.prototype.registerActionCreator;
  simflux.Dispatcher.prototype.registerActionCreator = function(ac) {
    var r = oregisterActionCreator.apply(this, Array.prototype.slice.call(arguments, 0));
    patchActionCreator(ac);
    return r;
  };

  var oregisterStore = simflux.Dispatcher.prototype.registerStore;
  simflux.Dispatcher.prototype.registerStore = function(store) {
    var r = oregisterStore.apply(this, Array.prototype.slice.call(arguments, 0));
    patchStore(store);
    return r;
  };

  console.log("%csimflux-viz loaded", "color:white; background-color:orange; font-size: 14pt; border-radius:8px; padding: 0 10px; font-family:Verdana;");
};

simfluxViz();