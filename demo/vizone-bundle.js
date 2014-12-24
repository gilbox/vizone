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
// prevent double-load
if (window.vizone) return;

window.vizone = require('./vizone');
console.log("%cvizone loaded", "color:white; background-color:orange; font-size: 14pt; border-radius:8px; padding: 0 10px; font-family:Verdana;");

},{"./vizone":3}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
var vizoneDOM = require('./vizone-dom');

vizoneDOM.initHistoryGraph();

// Calling vizone will append an item to the application
// flow tree
// (An item describes an application flow occurrence)
//
// fn (optional) will be called and its result returned
// A forked zone is created to execute fn()
// If a falsey value is provided in place of fn,
// then newItem is guaranteed to be a leaf
//
// Assuming fn is provided...
// We append newItem to history, and then create
// a forked zone in which to execute fn()
// By recursively creating forked zones we build
// the tree of application flow
//
// parentItem is optional: it will additionally insert an item
// as the only parent of newItem
//
// forceRoot will make this occurrence a root node even
// if it would have had a parent node under normal circumstances.
// Note that if parentItem is supplied, then it will be the root,
// and newItem will be the only child of parentItem.
function vizone(fn, newItem, parentItem, forceRoot) {

  // abbreviate args because we might expect args to be passed
  // along willy-nilly (like vizone.patch does)
  if (newItem.args) newItem.args = abbreviateArray(newItem.args);

  // inserting a parent item involves creating two separate
  // vizone calls
  if (parentItem) {
    return vizone(vizone.bind(null, fn, newItem), parentItem, undefined, forceRoot);
  }

  // If the current zone already has a historyObj, we need
  // to create a new zone to force this item to be root
  if (forceRoot && zone.historyObj) {
    return zone.fork().run(vizone.bind(null, fn, parentItem, newItem));
  }

  // right now historyObj is just responsible for keeping
  // track of items. If there isn't a historyObj attached to the
  // current zone, create it now
  var historyObj = zone.historyObj || {
        items: []
      };

  if (zone.historyObj) {
    // child:
    // if we are inside of a viz-forked zone (a "leaf") then attach
    // this item to the tree

    newItem.$$$parent = zone.historyItem.$$$index;
    newItem.$$$zoneIndex = zone.historyObj.zoneIndex;

  } else {
    // root:
    // if the current zone doesn't have a historyObj property,
    // this must be the root item

    zone.history = zone.history || [];
    newItem.$$$zoneIndex = historyObj.zoneIndex = zone.history.length;
    zone.history.push(historyObj);

  }

  // append item to the items array
  newItem.$$$index = historyObj.items.length;
  historyObj.items.push(newItem);

  vizoneDOM.appendToHistoryGraph(newItem);

  if (fn) {
    var fz = zone.fork();

    fz.historyObj = historyObj;
    fz.historyItem = newItem;

    // fn is executed within the forked zone...
    // and this will return the result of fn()
    return fz.run(fn);
  }
}

// maximum string length for property value
var MAX_STRING_LEN = 30;

// maximum number of properties an object may have
var MAX_OBJECT_PROPS = 30;

// objects that should always be converted directly toString()
var directlyAbbreviateObjects = {
  Date: true
};

// Converts anything to a scalar value
function abbreviateVal(v) {
  var t = typeof v;

  if (t === 'string') {
    return v.substr(0, MAX_STRING_LEN);
  } else if (t === 'number') {
    return v;
  } else if (v instanceof Object && 'toString' in v) {
    return v.toString().substr(0,MAX_STRING_LEN);
  } else {
    return '[' + t + ']';
  }
}

// Makes a simplified copy of the array,
// removing any nesting and converting to
// string when possible (except for numbers)
function abbreviateArray(arr) {
  return arr.map(function (v) {
    if (v instanceof Object && ! directlyAbbreviateObjects[v.constructor.name]) {
      var newv = {}, count = 0;
      for (var k in v) {
        if (v.hasOwnProperty(k)) newv[k] = abbreviateVal(v[k]); // @todo: handle elipses
        if (++count > MAX_OBJECT_PROPS) break;
      }
      return newv;
    } else {
      return abbreviateVal(v);
    }
  });
}

// Allows you to quickly patch a function without too much
// effort, but offers less power and control than using the
// vizone function directly.
//
// @param obj (Object) name of the object
// @param key (String) where obj[key] is the function you
//                     want to track
// @param options (Object) this corresponds to the newItem param of the
//                         vizone function, however args will be filled
//                         in for you automatically
vizone.patch = function (obj, key, options) {
  var ofn = obj[key];

  options = options || {};
  options.title = options.title || key;

  obj[key] = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    options.args = args;

    return vizone(
      Function.apply.bind(ofn, obj, args),
      options
    );
  };
};

module.exports = vizone;
},{"./vizone-dom":2}]},{},[1]);
