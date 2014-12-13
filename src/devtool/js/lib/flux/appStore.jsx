var simflux = require('simflux'),
    Immutable = require('immutable'),
    dispatcher = require('./dispatcher.jsx'),
    ctx = require('./appContext.jsx');

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

module.exports = appStore;