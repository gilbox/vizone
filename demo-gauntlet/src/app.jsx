var simflux = require('simflux'),
    React = require('react');

var dispatcher = simflux.instantiateDispatcher('Gauntlet Dispatcher');

var actionCreator = dispatcher.registerActionCreator({
  name: "Gauntlet Action Creator",
  one: function(data) {
    dispatcher.dispatch('one', data);
    setTimeout( dispatcher.dispatch.bind(dispatcher, 'two', data), 125);
    setTimeout( dispatcher.dispatch.bind(dispatcher, 'three', data), 250);
  },
  two: function(data) {
    setTimeout( dispatcher.dispatch.bind(dispatcher, 'one', data), 25);
    setTimeout( dispatcher.dispatch.bind(dispatcher, 'two', data), 125);
    setTimeout( dispatcher.dispatch.bind(dispatcher, 'three', data), 225);
  },
  three: function(data) {
    setTimeout( dispatcher.dispatch.bind(dispatcher, 'one', data), 25);
    setTimeout( dispatcher.dispatch.bind(dispatcher, 'two', data), 125);
    setTimeout( dispatcher.dispatch.bind(dispatcher, 'three', data), 225);
  },
  four: function(data) {
    setTimeout( dispatcher.dispatch.bind(dispatcher, 'one', data), 15);
    setTimeout( dispatcher.dispatch.bind(dispatcher, 'two', data), 25);
    setTimeout( dispatcher.dispatch.bind(dispatcher, 'three', data), 30);
  }
});

var storeA = dispatcher.registerStore({
  storeName: 'Store A',
  one: function () {
    console.log("A.one");
  },
  two: function () {
    console.log("A.two");
  },
  three: function () {
    dispatcher.waitFor([storeB]);
    console.log("A.three");
  }
});

var storeB = dispatcher.registerStore({
  storeName: 'Store B',
  one: function () {
    console.log("B.one");
  },
  two: function () {
    console.log("B.two");
  },
  three: function () {
    console.log("B.three");
  }
});

App = React.createClass( {
  clickGo: function () {
    actionCreator.one('111');

    actionCreator.one('22222');
    
    setTimeout( actionCreator.two.bind(actionCreator, '3333333'), 100);

    setTimeout( actionCreator.three.bind(actionCreator, '4444'), 200);

    setTimeout( actionCreator.four.bind(actionCreator, '55555555555'), 300);
  },
  render: function () {
    return <button onClick={this.clickGo}>Go</button>
  }
});

React.render(<App />, document.getElementById('app'));