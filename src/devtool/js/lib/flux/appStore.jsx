'use strict';

var simflux = require('simflux'),
    Immutable = require('immutable'),
    dispatcher = require('./dispatcher.jsx'),
    ctx = require('./appContext.jsx'),
    rootBinding = ctx.getBinding();


var appStore = dispatcher.registerStore({
  storeName: 'App Store',
  inspectedTitle: '',

  getEnabledStorageKey: () => 'vizoneEnabled:'+appStore.inspectedTitle,

  'init': function (o) {
    this.inspectedTitle = o.title;
    var enabled = localStorage.getItem(this.getEnabledStorageKey()) === 'true';
    rootBinding.set('vizoneEnabled', enabled);
  },

  'click:timeline:dot': function (dot) {
    var index = dot.index,
        historyBinding = rootBinding.get('history');

    rootBinding
      .set('currentChartIndex', index)
      .set('currentChart', historyBinding.get(index))
  },

  'process:chart:data': function (data) {
    var historyBinding = rootBinding.sub('history'),
        count = historyBinding.get('count'),
        currentChartIndex = rootBinding.get('currentChartIndex'),
        maxZoneIndex = count ? count-1 : 0,
        currentChartIsLast = maxZoneIndex == currentChartIndex;

    window.rootBinding = rootBinding;
    window.historyBinding = historyBinding;

    data.items.forEach(function (item) {
      if (! historyBinding.get(item.$$$zoneIndex)) {
        historyBinding.set(item.$$$zoneIndex, Immutable.List([]));
      }

      historyBinding.update(item.$$$zoneIndex, items => items.push(item));
      if (item.$$$zoneIndex > maxZoneIndex) maxZoneIndex = item.$$$zoneIndex;
    });

    historyBinding.set('count', maxZoneIndex+1);

    if (currentChartIsLast) {
      rootBinding
        .set('currentChartIndex', maxZoneIndex)
        .set('currentChart', historyBinding.get(maxZoneIndex))
    }
  },

  'reset': function () {
    ctx.resetState();
  },

  'set:vizone:enabled': function (o) {
    localStorage.setItem(this.getEnabledStorageKey(), o.enabled.toString());
    rootBinding.set('vizoneEnabled', o.enabled);
  }
});

window.rootBinding = rootBinding;
window.appStore = appStore;

module.exports = appStore;