var React = require('react'),
    flux = require('../lib/flux');

var Timeline = React.createClass({
  getInitialState: function() {
    return {
      hint: undefined
    }
  },
  clickDot: function (i, chart) {
    flux.actionCreator.clickTimelineDot({index: i, chart: chart});
  },
  hoverDot: function (i) {
    this.setState({hoverDotIdx:i});
  },
  render: function() {
    var message = this.props.message,
        dots = [],
        lastIdx = message.startIdx+message.count;

    for (var i = message.startIdx; i < lastIdx; i++) {
      dots.push(<a
        className="Timeline-dot"
        key={i}
        onMouseEnter={this.hoverDot.bind(this, i)}
        onMouseLeave={this.hoverDot.bind(this, -1)}
        onClick={this.clickDot.bind(this, i, message[i])}
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