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
  if (parentItem) {
    return vizone(vizone.bind(null, fn, newItem), parentItem);
  }

  var zone = window.zone;

  if (forceRoot && zone.historyObj) {
    zone.fork().run(vizone.bind(null, fn, parentItem, newItem));
  }

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
    var r,
      fz = window.zone.fork();

    fz.run(function() {
      fz.historyObj = historyObj;
      fz.historyItem = newItem;
      r = fn(); // this runs synchronously so r is always returned below
    });

    return r;
  }
}

module.exports = vizone;