var simflux = require('simflux');

var dispatcher = simflux.instantiateDispatcher('simflux-viz dispatcher');

var actionCreator = dispatcher.registerActionCreator({
  clickTimelineDot: function (dot) {
    dispatcher.dispatch('click:timeline:dot', dot);
  }
});

var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

window.eee = EventEmitter;

var appStore = dispatcher.registerStore(assign({}, EventEmitter.prototype, {
  storeName: 'App Store',
  'click:timeline:dot': function (dot) {
    this.emit('change-chart', dot);
  }
}));

var flux = {
  dispatcher: dispatcher,
  actionCreator: actionCreator,
  appStore: appStore
};

module.exports = flux;