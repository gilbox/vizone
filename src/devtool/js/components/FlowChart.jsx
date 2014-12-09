var React = require('react');
var Chart = require('../lib/Chart');

var FlowChart = React.createClass({
  shouldComponentUpdate: function (nextProps, nextState) {
    this.chart.renderChart(nextProps.graph);
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
