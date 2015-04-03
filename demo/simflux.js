var simflux;

(function() {

  var Flux = window.Flux;

  if (!Flux && ((typeof module !== 'undefined' && module.exports) || typeof define == 'function' && typeof define.amd == 'object' && define.amd)) {
    Flux = require('flux');
  }

  var SimfluxDispatcher = function(name) {
    this.name = name;
    this.fluxDispatcher = new Flux.Dispatcher();
    this.actionCreators = [];
    this.stores = [];
  };

  SimfluxDispatcher.prototype.registerStore = function(store) {
    this.stores.push(store);
    store.$$$stack = new Error().stack;
    store.$$$dispatcherToken = this.fluxDispatcher.register(function(payload) {
      if (store[payload.action]) store[payload.action].apply(store, payload.args);
    });
    return store;
  };

  SimfluxDispatcher.prototype.unregisterStore = function(store) {
    this.fluxDispatcher.unregister(store.$$$dispatcherToken);
    delete store.$$$dispatcherToken;
    return store;
  };

  // unlike Facebook's dispatcher, the first argument is action and after that
  // we can pass in any number of arguments
  //
  // Original: dispatcher.dispatch({ type: 'ACTION_TYPE', data: {whatever:data} })
  //      New: dispatcher.dispatch('ACTION_TYPE', arg1, arg2, ...)
  SimfluxDispatcher.prototype.dispatch = function(action) {
    return this.fluxDispatcher.dispatch({
      action: action,
      args: Array.prototype.slice.call(arguments, 1)
    });
  };

  // waitFor takes a list of stores instead of tokens
  SimfluxDispatcher.prototype.waitFor = function (stores) {
    var tokens = [];
    for (var i=0; i<stores.length; i++) {
      tokens.push(stores[i].$$$dispatcherToken);
    }
    return this.fluxDispatcher.waitFor(tokens);
  };

  // todo: use prototypical inheritance instead
  SimfluxDispatcher.prototype.isDispatching=function() {
    return this.fluxDispatcher.isDispatching();
  };

  SimfluxDispatcher.prototype.registerActionCreator = function (ac) {
    ac.$$$stack = new Error().stack;
    this.actionCreators.push(ac);
    return ac;
  };

  simflux = {
    version: 'pre-beta',
    Dispatcher: SimfluxDispatcher,
    dispatchers: [],

    // use this instead of the Dispatcher constructor if you plan on using simflux-viz
    instantiateDispatcher: function (name) {
      var d = new SimfluxDispatcher(name || ('Dispatcher #'+(simflux.dispatchers.length+1)));
      simflux.dispatchers.push(d);
      return d;
    }
  };

  // requirejs compatibility
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    define(function() {
      return simflux;
    });
  } else {
    window.simflux = simflux;
  }

})();

if (typeof module !== 'undefined' && module.exports) module.exports = simflux;
