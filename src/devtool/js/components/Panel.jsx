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
    var binding = this.getDefaultBinding(),
        chartBinding = binding.sub('currentChart');

    return (
      <div className="fill">
        <FlowChart binding={ chartBinding } />
        <Timeline binding={binding} />
      </div>
    )
  }
});
module.exports = Panel;