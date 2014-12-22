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