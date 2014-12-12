var simflux = require('simflux'),
    Morearty = require('morearty'),
    Immutable = require('immutable');

window.Immutable = Immutable; // just for console playing
window.Morearty = Morearty; // just for console playing

var dispatcher = simflux.instantiateDispatcher('simflux-viz dispatcher');

var actionCreator = dispatcher.registerActionCreator({
  clickTimelineDot: function (dot) {
    dispatcher.dispatch('click:timeline:dot', dot);
  },
  init: function () {
    var tabId = chrome.devtools.inspectedWindow.tabId;

    //Create a port with background page for continuous message communication
    var port = chrome.extension.connect({
      name: "simflux connection"
    });

    // @todo: does it make sense to have a data stream in an action creator?
    //        (maybe we should think of the stream as a view component)
    // Listen to messages from the background page
    port.onMessage.addListener(function(message) {
      if (message.tabId === tabId && 'startIdx' in message) {
        //_this.processHistory(message);
        dispatcher.dispatch('process:chart:data', {history:message});
      }
    });
  }
});


var appStore = dispatcher.registerStore({
  storeName: 'App Store',
  'click:timeline:dot': function (dot) {
    var rootBinding = ctx.getBinding(),
        index = dot.index,
        history = rootBinding.get('history');

    rootBinding
      .set('currentChart', history[index])
      .set('currentChartIndex', index)
  },
  'process:chart:data': function (data) {
    var rootBinding = ctx.getBinding(),
        history = rootBinding.get('history'),
        currentChart = rootBinding.get('currentChart'),
        currentChartIndex = rootBinding.get('currentChartIndex'),
        lastIdx = history.count - 1 + history.startIdx;

    if (currentChart === null || currentChartIndex == lastIdx) {
      // if this is the first data set, or if the current chart is the last chart
      // ... then select the very last chart of new data set

      var newCurrentChartIndex = data.history.count - 1 + data.history.startIdx;

      rootBinding
        .set('currentChart', data.history[newCurrentChartIndex])
        .set('currentChartIndex', newCurrentChartIndex);
    } else if (currentChartIndex >= data.history.startIdx) {
      // update if index of current chart is in new data set

      rootBinding
        .set('currentChart', data.history[currentChartIndex]);
    }

    rootBinding.set('history', data.history);
  }
});

// @todo: where should this live?
// This sets up the root-level Immutable data object.
// The react view components will be bound directly to this root
// or any of its descendant bindings (created via binding.sub(..)) via Morearty.Mixin
var ctx = Morearty.createContext(Immutable.Map({
  history: {
    startIdx: 0,
    count: 0
  },
  currentChart: null,
  currentChartIndex: 0
}));

var flux = {
  dispatcher: dispatcher,
  actionCreator: actionCreator,
  appStore: appStore,
  ctx: ctx
};

module.exports = flux;