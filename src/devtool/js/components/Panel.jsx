var React = require('react'),
    Timeline = require('./Timeline.jsx'),
    FlowChart = require('./FlowChart.jsx'),
    flux = require('../lib/flux');

var Panel = React.createClass({
  getInitialState: function() {
    return {
      chart: {},
      message: {}
    }
  },
  componentDidMount: function () {
    var _this = this,
        tabId = chrome.devtools.inspectedWindow.tabId;

    //Create a port with background page for continuous message communication
    var port = chrome.extension.connect({
      name: "simflux connection"
    });

    // Listen to messages from the background page
    port.onMessage.addListener(function(message) {
      if (message.tabId === tabId) {
        if ('startIdx' in message) _this.setState({message: message, chart:message[message.startIdx + message.count - 1]});
      }
    });

    flux.appStore.on('change-chart', function (e) {
      console.log("change-chart-->e.index: ", e.index);
      _this.setState({chart:e.chart});
    });

  },
  render: function() {
    return (
      <div className="fill">
        <FlowChart chart={this.state.chart} />
        <Timeline message={this.state.message} />
      </div>
    )
  }
});
module.exports = Panel;