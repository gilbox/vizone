var React = require('react'),
    Timeline = require('./Timeline.jsx'),
    FlowChart = require('./FlowChart.jsx');

var Panel = React.createClass({
  getInitialState: function() {
    return {
      graph: {}
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
        if ('startIdx' in message) _this.setState({graph:message[message.startIdx + message.count - 1]}); //renderGraph(message[message.startIdx + message.count - 1]);
      }
    });
  },
  render: function() {
    return (
      <div className="fill">
        <FlowChart graph={this.state.graph} />
        <Timeline />
      </div>
    )
  }
});
module.exports = Panel;