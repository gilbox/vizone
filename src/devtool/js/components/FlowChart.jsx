var React = require('react');
var Chart = require('../lib/Chart');
var Morearty = require('morearty');

var FlowChart = React.createClass({
  displayName: 'FlowChart',
  mixins: [Morearty.Mixin],

  shouldComponentUpdateOverride: function (shouldComponentUpdate, nextProps) {

    if (shouldComponentUpdate()) {
      this.chart.renderChart(
        this.getDefaultBinding().toJS()
      );
    }

    // always return false because d3 will take care of re-render
    return false;
  },

  componentDidMount: function () {
    this.chart = new Chart(this.getDOMNode());
  },

  render: function(){
    return (
      <svg className="fill"></svg>
    );
  }
});

module.exports = FlowChart;
