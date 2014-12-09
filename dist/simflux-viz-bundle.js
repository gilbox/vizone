if (!window.zone) {
(function(){

'use strict';


function Zone(parentZone, data) {
  var zone = (arguments.length) ? Object.create(parentZone) : this;

  zone.parent = parentZone;

  Object.keys(data || {}).forEach(function(property) {

    var _property = property.substr(1);

    // augment the new zone with a hook decorates the parent's hook
    if (property[0] === '$') {
      zone[_property] = data[property](parentZone[_property] || function () {});

    // augment the new zone with a hook that runs after the parent's hook
    } else if (property[0] === '+') {
      if (parentZone[_property]) {
        zone[_property] = function () {
          var result = parentZone[_property].apply(this, arguments);
          data[property].apply(this, arguments);
          return result;
        };
      } else {
        zone[_property] = data[property];
      }

    // augment the new zone with a hook that runs before the parent's hook
    } else if (property[0] === '-') {
      if (parentZone[_property]) {
        zone[_property] = function () {
          data[property].apply(this, arguments);
          return parentZone[_property].apply(this, arguments);
        };
      } else {
        zone[_property] = data[property];
      }

    // set the new zone's hook (replacing the parent zone's)
    } else {
      zone[property] = (typeof data[property] === 'object') ?
                        JSON.parse(JSON.stringify(data[property])) :
                        data[property];
    }
  });

  return zone;
}


Zone.prototype = {
  constructor: Zone,

  fork: function (locals) {
    this.onZoneCreated();
    return new Zone(this, locals);
  },

  bind: function (fn, skipEnqueue) {
    skipEnqueue || this.enqueueTask(fn);
    var zone = this.fork();
    return function zoneBoundFn() {
      return zone.run(fn, this, arguments);
    };
  },

  bindOnce: function (fn) {
    var boundZone = this;
    return this.bind(function () {
      var result = fn.apply(this, arguments);
      boundZone.dequeueTask(fn);
      return result;
    });
  },

  run: function run (fn, applyTo, applyWith) {
    applyWith = applyWith || [];

    var oldZone = window.zone,
        result;

    window.zone = this;

    try {
      this.beforeTask();
      result = fn.apply(applyTo, applyWith);
    } catch (e) {
      if (zone.onError) {
        zone.onError(e);
      } else {
        throw e;
      }
    } finally {
      this.afterTask();
      window.zone = oldZone;
    }
    return result;
  },

  beforeTask: function () {},
  onZoneCreated: function () {},
  afterTask: function () {},
  enqueueTask: function () {},
  dequeueTask: function () {}
};


Zone.patchSetClearFn = function (obj, fnNames) {
  fnNames.map(function (name) {
    return name[0].toUpperCase() + name.substr(1);
  }).
  forEach(function (name) {
    var setName = 'set' + name;
    var clearName = 'clear' + name;
    var delegate = obj[setName];

    if (delegate) {
      var ids = {};

      if (setName === 'setInterval') {
        zone[setName] = function (fn) {
          var id;
          arguments[0] = function () {
            delete ids[id];
            return fn.apply(this, arguments);
          };
          var args = Zone.bindArguments(arguments);
          id = delegate.apply(obj, args);
          ids[id] = true;
          return id;
        };
      } else {
        zone[setName] = function (fn) {
          var id;
          arguments[0] = function () {
            delete ids[id];
            return fn.apply(this, arguments);
          };
          var args = Zone.bindArgumentsOnce(arguments);
          id = delegate.apply(obj, args);
          ids[id] = true;
          return id;
        };
      }


      obj[setName] = function () {
        return zone[setName].apply(this, arguments);
      };

      var clearDelegate = obj[clearName];

      zone[clearName] = function (id) {
        if (ids[id]) {
          delete ids[id];
          zone.dequeueTask();
        }
        return clearDelegate.apply(this, arguments);
      };

      obj[clearName] = function () {
        return zone[clearName].apply(this, arguments);
      };
    }
  });
};


Zone.patchSetFn = function (obj, fnNames) {
  fnNames.forEach(function (name) {
    var delegate = obj[name];

    if (delegate) {
      zone[name] = function (fn) {
        arguments[0] = function () {
          return fn.apply(this, arguments);
        };
        var args = Zone.bindArgumentsOnce(arguments);
        return delegate.apply(obj, args);
      };

      obj[name] = function () {
        return zone[name].apply(this, arguments);
      };
    }
  });
};

Zone.patchPrototype = function (obj, fnNames) {
  fnNames.forEach(function (name) {
    var delegate = obj[name];
    if (delegate) {
      obj[name] = function () {
        return delegate.apply(this, Zone.bindArguments(arguments));
      };
    }
  });
};

Zone.bindArguments = function (args) {
  for (var i = args.length - 1; i >= 0; i--) {
    if (typeof args[i] === 'function') {
      args[i] = zone.bind(args[i]);
    }
  }
  return args;
};


Zone.bindArgumentsOnce = function (args) {
  for (var i = args.length - 1; i >= 0; i--) {
    if (typeof args[i] === 'function') {
      args[i] = zone.bindOnce(args[i]);
    }
  }
  return args;
};

Zone.patchableFn = function (obj, fnNames) {
  fnNames.forEach(function (name) {
    var delegate = obj[name];
    zone[name] = function () {
      return delegate.apply(obj, arguments);
    };

    obj[name] = function () {
      return zone[name].apply(this, arguments);
    };
  });
};

Zone.patchProperty = function (obj, prop) {
  var desc = Object.getOwnPropertyDescriptor(obj, prop) || {
    enumerable: true,
    configurable: true
  };

  // A property descriptor cannot have getter/setter and be writable
  // deleting the writable and value properties avoids this error:
  //
  // TypeError: property descriptors must not specify a value or be writable when a
  // getter or setter has been specified
  delete desc.writable;
  delete desc.value;

  // substr(2) cuz 'onclick' -> 'click', etc
  var eventName = prop.substr(2);
  var _prop = '_' + prop;

  desc.set = function (fn) {
    if (this[_prop]) {
      this.removeEventListener(eventName, this[_prop]);
    }

    if (typeof fn === 'function') {
      this[_prop] = fn;
      this.addEventListener(eventName, fn, false);
    } else {
      this[_prop] = null;
    }
  };

  desc.get = function () {
    return this[_prop];
  };

  Object.defineProperty(obj, prop, desc);
};

Zone.patchProperties = function (obj, properties) {

  (properties || (function () {
      var props = [];
      for (var prop in obj) {
        props.push(prop);
      }
      return props;
    }()).
    filter(function (propertyName) {
      return propertyName.substr(0,2) === 'on';
    })).
    forEach(function (eventName) {
      Zone.patchProperty(obj, eventName);
    });
};

Zone.patchEventTargetMethods = function (obj) {
  var addDelegate = obj.addEventListener;
  obj.addEventListener = function (eventName, fn) {
    arguments[1] = fn._bound = zone.bind(fn);
    return addDelegate.apply(this, arguments);
  };

  var removeDelegate = obj.removeEventListener;
  obj.removeEventListener = function (eventName, fn) {
    arguments[1] = arguments[1]._bound || arguments[1];
    var result = removeDelegate.apply(this, arguments);
    zone.dequeueTask(fn);
    return result;
  };
};

Zone.patch = function patch () {
  Zone.patchSetClearFn(window, [
    'timeout',
    'interval',
    'immediate'
  ]);

  Zone.patchSetFn(window, [
    'requestAnimationFrame',
    'mozRequestAnimationFrame',
    'webkitRequestAnimationFrame'
  ]);

  Zone.patchableFn(window, ['alert', 'prompt']);

  // patched properties depend on addEventListener, so this needs to come first
  if (window.EventTarget) {
    Zone.patchEventTargetMethods(window.EventTarget.prototype);

  // Note: EventTarget is not available in all browsers,
  // if it's not available, we instead patch the APIs in the IDL that inherit from EventTarget
  } else {
    [ 'ApplicationCache',
      'EventSource',
      'FileReader',
      'InputMethodContext',
      'MediaController',
      'MessagePort',
      'Node',
      'Performance',
      'SVGElementInstance',
      'SharedWorker',
      'TextTrack',
      'TextTrackCue',
      'TextTrackList',
      'WebKitNamedFlow',
      'Window',
      'Worker',
      'WorkerGlobalScope',
      'XMLHttpRequestEventTarget',
      'XMLHttpRequestUpload'
    ].
    filter(function (thing) {
      return window[thing];
    }).
    map(function (thing) {
      return window[thing].prototype;
    }).
    forEach(Zone.patchEventTargetMethods);
  }

  if (Zone.canPatchViaPropertyDescriptor()) {
    Zone.patchViaPropertyDescriptor();
  } else {
    Zone.patchViaCapturingAllTheEvents();
    Zone.patchClass('XMLHttpRequest');
  }

  // patch promises
  if (window.Promise) {
    Zone.patchPrototype(Promise.prototype, [
      'then',
      'catch'
    ]);
  }
  Zone.patchMutationObserverClass('MutationObserver');
  Zone.patchMutationObserverClass('WebKitMutationObserver');
  Zone.patchDefineProperty();
  Zone.patchRegisterElement();
};

//
Zone.canPatchViaPropertyDescriptor = function () {
  Object.defineProperty(HTMLElement.prototype, 'onclick', {
    get: function () {
      return true;
    }
  });
  var elt = document.createElement('div');
  var result = !!elt.onclick;
  Object.defineProperty(HTMLElement.prototype, 'onclick', {});
  return result;
};

// for browsers that we can patch the descriptor:
// - eventually Chrome once this bug gets resolved
// - Firefox
Zone.patchViaPropertyDescriptor = function () {
  Zone.patchProperties(HTMLElement.prototype, Zone.onEventNames);
  Zone.patchProperties(XMLHttpRequest.prototype);
};

// Whenever any event fires, we check the event target and all parents
// for `onwhatever` properties and replace them with zone-bound functions
// - Chrome (for now)
Zone.patchViaCapturingAllTheEvents = function () {
  Zone.eventNames.forEach(function (property) {
    var onproperty = 'on' + property;
    document.addEventListener(property, function (event) {
      var elt = event.target, bound;
      while (elt) {
        if (elt[onproperty] && !elt[onproperty]._unbound) {
          bound = zone.bind(elt[onproperty]);
          bound._unbound = elt[onproperty];
          elt[onproperty] = bound;
        }
        elt = elt.parentElement;
      }
    }, true);
  });
};

// wrap some native API on `window`
Zone.patchClass = function (className) {
  var OriginalClass = window[className];
  if (!OriginalClass) {
    return;
  }
  window[className] = function () {
    var a = Zone.bindArguments(arguments);
    switch (a.length) {
      case 0: this._o = new OriginalClass(); break;
      case 1: this._o = new OriginalClass(a[0]); break;
      case 2: this._o = new OriginalClass(a[0], a[1]); break;
      case 3: this._o = new OriginalClass(a[0], a[1], a[2]); break;
      case 4: this._o = new OriginalClass(a[0], a[1], a[2], a[3]); break;
      default: throw new Error('what are you even doing?');
    }
  };

  var instance = new OriginalClass(className.substr(-16) === 'MutationObserver' ? function () {} : undefined);

  var prop;
  for (prop in instance) {
    (function (prop) {
      if (typeof instance[prop] === 'function') {
        window[className].prototype[prop] = function () {
          return this._o[prop].apply(this._o, arguments);
        };
      } else {
        Object.defineProperty(window[className].prototype, prop, {
          set: function (fn) {
            if (typeof fn === 'function') {
              this._o[prop] = zone.bind(fn);
            } else {
              this._o[prop] = fn;
            }
          },
          get: function () {
            return this._o[prop];
          }
        });
      }
    }(prop));
  };
};

// wrap some native API on `window`
Zone.patchMutationObserverClass = function (className) {
  var OriginalClass = window[className];
  if (!OriginalClass) {
    return;
  }
  window[className] = function (fn) {
    this._o = new OriginalClass(zone.bind(fn, true));
  };

  var instance = new OriginalClass(function () {});

  window[className].prototype.disconnect = function () {
    var result = this._o.disconnect.apply(this._o, arguments);
    this._active && zone.dequeueTask();
    this._active = false;
    return result;
  };

  window[className].prototype.observe = function () {
    if (!this._active) {
      zone.enqueueTask();
    }
    this._active = true;
    return this._o.observe.apply(this._o, arguments);
  };

  var prop;
  for (prop in instance) {
    (function (prop) {
      if (typeof window[className].prototype !== undefined) {
        return;
      }
      if (typeof instance[prop] === 'function') {
        window[className].prototype[prop] = function () {
          return this._o[prop].apply(this._o, arguments);
        };
      } else {
        Object.defineProperty(window[className].prototype, prop, {
          set: function (fn) {
            if (typeof fn === 'function') {
              this._o[prop] = zone.bind(fn);
            } else {
              this._o[prop] = fn;
            }
          },
          get: function () {
            return this._o[prop];
          }
        });
      }
    }(prop));
  }
};

// might need similar for object.freeze
// i regret nothing
Zone.patchDefineProperty = function () {
  var _defineProperty = Object.defineProperty;
  var _getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
  var _create = Object.create;

  Object.defineProperty = function (obj, prop, desc) {
    if (isUnconfigurable(obj, prop)) {
      throw new TypeError('Cannot assign to read only property \'' + prop + '\' of ' + obj);
    }
    if (prop !== 'prototype') {
      desc = rewriteDescriptor(obj, prop, desc);
    }
    return _defineProperty(obj, prop, desc);
  };

  Object.defineProperties = function (obj, props) {
    Object.keys(props).forEach(function (prop) {
      Object.defineProperty(obj, prop, props[prop]);
    });
    return obj;
  };

  Object.create = function (obj, proto) {
    if (typeof proto === 'object') {
      Object.keys(proto).forEach(function (prop) {
        proto[prop] = rewriteDescriptor(obj, prop, proto[prop]);
      });
    }
    return _create(obj, proto);
  };

  Object.getOwnPropertyDescriptor = function (obj, prop) {
    var desc = _getOwnPropertyDescriptor(obj, prop);
    if (isUnconfigurable(obj, prop)) {
      desc.configurable = false;
    }
    return desc;
  };

  Zone._redefineProperty = function (obj, prop, desc) {
    desc = rewriteDescriptor(obj, prop, desc);
    return _defineProperty(obj, prop, desc);
  };

  function isUnconfigurable (obj, prop) {
    return obj && obj.__unconfigurables && obj.__unconfigurables[prop];
  }

  function rewriteDescriptor (obj, prop, desc) {
    desc.configurable = true;
    if (!desc.configurable) {
      if (!obj.__unconfigurables) {
        _defineProperty(obj, '__unconfigurables', { writable: true, value: {} });
      }
      obj.__unconfigurables[prop] = true;
    }
    return desc;
  }
};

Zone.patchRegisterElement = function () {
  if (!('registerElement' in document)) {
    return;
  }
  var _registerElement = document.registerElement;
  var callbacks = [
    'createdCallback',
    'attachedCallback',
    'detachedCallback',
    'attributeChangedCallback'
  ];
  document.registerElement = function (name, opts) {
    callbacks.forEach(function (callback) {
      if (opts.prototype[callback]) {
        var descriptor = Object.getOwnPropertyDescriptor(opts.prototype, callback);
        if (descriptor.value) {
          descriptor.value = zone.bind(descriptor.value || opts.prototype[callback]);
          Zone._redefineProperty(opts.prototype, callback, descriptor);
        }
      }
    });
    return _registerElement.apply(document, [name, opts]);
  };
}

Zone.eventNames = 'copy cut paste abort blur focus canplay canplaythrough change click contextmenu dblclick drag dragend dragenter dragleave dragover dragstart drop durationchange emptied ended input invalid keydown keypress keyup load loadeddata loadedmetadata loadstart mousedown mouseenter mouseleave mousemove mouseout mouseover mouseup pause play playing progress ratechange reset scroll seeked seeking select show stalled submit suspend timeupdate volumechange waiting mozfullscreenchange mozfullscreenerror mozpointerlockchange mozpointerlockerror error webglcontextrestored webglcontextlost webglcontextcreationerror'.split(' ');
Zone.onEventNames = Zone.eventNames.map(function (property) {
  return 'on' + property;
});

Zone.init = function init () {
  if (typeof module !== 'undefined' && module && module.exports) {
    module.exports = new Zone();
  } else {
    window.zone = new Zone();
  }
  Zone.patch();
};


Zone.init();


})();
}
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"./simflux-viz-graphs":3,"simflux":"simflux","zone.js":"zone.js"}],2:[function(require,module,exports){
// A Simple way to represent nodes in a graph

function SimfluxGraph() {
  this.nodes = [];
  this.nodeHash = {};
  this.nodeHashIndex = {};
  this.arrows = [];
}

SimfluxGraph.prototype.addNode = function (name, o) {
  o.name = name;
  this.nodeHashIndex[name] = this.nodes.length;
  this.nodes.push(this.nodeHash[name] = o);
};

SimfluxGraph.prototype.addArrow = function (a,b) {
  this.arrows.push({a:a,b:b});
};

SimfluxGraph.prototype.toObject = function () {
  return {
    nodes: this.nodes,
    nodeHashIndex: this.nodeHashIndex,
    arrows: this.arrows
  };
};

module.exports = SimfluxGraph;
},{}],3:[function(require,module,exports){
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

  historyObj.actionHistory.forEach(function (actionHistoryObj, i) {
    r += fstr("A{0} [label=\"{1}\" style=\"fill: #f77; font-weight: bold\"];\n", i, actionHistoryObj.action);
    r += fstr("PA->A{0};\n", i);

    actionHistoryObj.stores.forEach(function (store) {
      var storeName = store.storeName || '[store]';
      storeIdx++;
      r += fstr("S{0} [label=\"{1}.{2}\" style=\"fill: #aa8; font-weight: bold\"];\n", storeIdx, storeName, actionHistoryObj.action);
      r += fstr("A{0}->S{1};\n", i, storeIdx);
    });
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

  historyObj.actionHistory.forEach(function (actionHistoryObj, i) {
    var actionNodeName = 'A'+i;
    var args = actionHistoryObj.args
                .filter(function(v){return typeof v === 'string'})
                .map(function (v) { return v.substr(0,50) })
                .join("\n");

    graph.addNode(actionNodeName, {
      type: 'action',
      action: actionHistoryObj.action,
      args: args
    });
    graph.addArrow('PA', actionNodeName);

    actionHistoryObj.stores.forEach(function (store) {
      var storeName = store.storeName || '[store]';
      var storeNodeName = 'S'+storeIdx;
      storeIdx++;
      graph.addNode(storeNodeName, {
        type: 'store',
        store: storeName,
        action: actionHistoryObj.action,
        fnName: store.$$$stackInfo.fnName,
        location: store.$$$stackInfo.location
      });
      graph.addArrow(actionNodeName, storeNodeName);
    });
  });

  return JSON.stringify(graph.toObject());
};

var contEl, historyMax = 10, updateCount = 0;

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
},{"./SimfluxGraph":2,"simflux":"simflux"}]},{},[1]);
