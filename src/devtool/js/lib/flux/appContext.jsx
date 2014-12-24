var Morearty = require('morearty'),
    Immutable = require('immutable');

// Morearty is managing data<->view binding utilising immutable.js

// This sets up the root-level Immutable data object.
// The react view components will be bound directly to this root
// or any of its descendant bindings (created via binding.sub(..)) via Morearty.Mixin
var ctx = Morearty.createContext(Immutable.fromJS({
  history: {
    startIdx: 0,
    count: 0
  },
  currentChart: null,
  currentChartIndex: 0,
  vizoneEnabled: false
}));

module.exports = ctx;