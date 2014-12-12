var React = require('react'),
    Timeline = require('./Timeline.jsx'),
    FlowChart = require('./FlowChart.jsx'),
    flux = require('../lib/flux'),
    Morearty = require('morearty');

var Panel = React.createClass({
  displayName: 'Panel',
  mixins: [Morearty.Mixin],
  componentDidMount: function () {
    // @todo: is this the best place for this?
    flux.actionCreator.init();
  },
  render: function() {
    var binding = this.getDefaultBinding();

    return (
      <div className="fill">
        <FlowChart binding={binding.sub('currentChart')} />
        <Timeline binding={binding} />
      </div>
    )
  }
});
module.exports = Panel;