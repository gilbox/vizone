var React = require('react'),
    Timeline = require('./Timeline.jsx'),
    FlowChart = require('./FlowChart.jsx'),
    AppEnabler = require('./AppEnabler.jsx'),
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
        chartBinding = binding.sub('currentChart'),
        enabledBinding = binding.sub('vizoneEnabled'),
        enabled = enabledBinding.get(),
        enabledClass = enabled ? ' is-appEnabled' : '';

    return (
      <div className={'Panel fill'+enabledClass}>
        <FlowChart binding={ chartBinding } />

        <Timeline binding={binding} />

        <div className="Panel-appEnabler">
          <AppEnabler binding={enabledBinding} />
        </div>
      </div>
    )
  }
});
module.exports = Panel;