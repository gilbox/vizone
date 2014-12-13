var dispatcher = require('./dispatcher.jsx'),
    actionCreator = require('./actionCreator.jsx'),
    appStore = require('./appStore.jsx'),
    ctx = require('./appContext.jsx');


var Morearty = require('morearty'),
    Immutable = require('immutable');
window.Immutable = Immutable; // just for console playing
window.Morearty = Morearty; // just for console playing


var flux = {
  dispatcher: dispatcher,
  actionCreator: actionCreator,
  appStore: appStore,
  ctx: ctx
};

module.exports = flux;