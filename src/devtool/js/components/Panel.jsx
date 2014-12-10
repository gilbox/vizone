var React = require('react'),
    Timeline = require('./Timeline.jsx'),
    FlowChart = require('./FlowChart.jsx'),
    flux = require('../lib/flux');

var Panel = React.createClass({
  getInitialState: function() {
    return {
      chart: {},
      message: {},
      selectedIndex: 0
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
        if ('startIdx' in message) {
          var lastIdx = message.startIdx + message.count - 1;
          if (_this.state.selectedIndex === lastIdx-1 || lastIdx === 0) {
            // go to latest chart
            _this.setState({message: message, selectedIndex:lastIdx, chart:message[lastIdx]});
          } else {
            // remain at current chart
            _this.setState({message: message, chart:message[_this.state.selectedIndex]});
          }
        }
      }
    });

    flux.appStore.on('change-chart', function (e) {
      _this.setState({chart:e.chart, selectedIndex:e.index});
    });

  },
  render: function() {
    return (
      <div className="fill">
        <FlowChart chart={this.state.chart} />
        <Timeline message={this.state.message} selectedIndex={this.state.selectedIndex} />
      </div>
    )
  }
});
module.exports = Panel;