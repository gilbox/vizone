var React = require('react'),
    flux = require('../lib/flux'),
    Morearty = require('morearty');

var Timeline = React.createClass({
  displayName: 'Timeline',
  mixins: [Morearty.Mixin],

  getInitialState: function() {
    return {hoverDotIdx:undefined}
  },

  clickDot: function (i) {
    flux.actionCreator.clickTimelineDot({index: i});
  },

  hoverDot: function (i) {
    this.setState({hoverDotIdx:i});
  },

  render: function() {
    var binding = this.getDefaultBinding(),
        history = binding.get('history'),
        currentChartIndex = binding.get('currentChartIndex'),
        dots = [],
        lastIdx = history.startIdx+history.count;

    for (var i = history.startIdx; i < lastIdx; i++) {
      var classes = 'Timeline-dot';
      if (i === currentChartIndex) classes += ' is-selected';

      dots.push(<a
        className={classes}
        key={i}
        onMouseEnter={this.hoverDot.bind(this, i)}
        onMouseLeave={this.hoverDot.bind(this, -1)}
        onClick={this.clickDot.bind(this, i)}
      >
        { i === this.state.hoverDotIdx && <div className="Timeline-hint"><div className="Timeline-hintTab">{'Chart ' + this.state.hoverDotIdx}</div></div> }
      </a>);
    }

    return (
      <div className="Timeline">
        {dots}
      </div>
    );
  }
});

module.exports = Timeline;