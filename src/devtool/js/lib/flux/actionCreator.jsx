var simflux = require('simflux'),
    dispatcher = require('./dispatcher.jsx'),
    port = require('../chromePort'),
    rootBinding = require('./appContext.jsx').getBinding(),
    tabId = chrome.devtools.inspectedWindow.tabId;

function sendEnabledStatusToPanel() {
  var enabled = rootBinding.get('vizoneEnabled');
  port.postMessage({type: 'set-vizone-enabled', enabled:enabled, tabId:tabId});
}

var actionCreator = dispatcher.registerActionCreator({

  // Simple pass-through to dispatcher
  // this is a way to make sure everything gets routed through
  // the Action Creator without a lot of boilerplate
  //dispatch: function (action) {
  //  dispatcher.dispatch.apply(dispatcher, Array.prototype.slice.call(arguments, 0));
  //},

  setVizoneEnabled: function (o) {
    port.postMessage({type: 'set-vizone-enabled', enabled:o.enabled, tabId:tabId});
    dispatcher.dispatch('set:vizone:enabled', o);
  },

  clickTimelineDot: function (dot) {
    dispatcher.dispatch('click:timeline:dot', dot);
  },

  init: function () {

    port.postMessage({type: 'init-vizone', tabId:tabId});

    sendEnabledStatusToPanel();

    // @todo: does it make sense to have a data stream in an action creator?
    //        (maybe we should think of the stream as a view component)
    // Listen to messages from the background page
    port.onMessage.addListener(function(message) {
      if (message.tabId === tabId) {

        if (message.type === 'vizone-history') {
          dispatcher.dispatch('process:chart:data', message);
        }

        else if (message.type === 'vizone-reset') {
          dispatcher.dispatch('reset');
          if (message.title) dispatcher.dispatch('init', {title:message.title});
          sendEnabledStatusToPanel();
        }

      }
    });
  }
});

module.exports = actionCreator;