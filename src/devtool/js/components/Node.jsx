var React = require('react');

var Node = React.createClass({
  render: function() {
    var title = <div className="Node-title" dangerouslySetInnerHTML={{__html: this.props.node.title}} />;

    var subtitle = this.props.node.subtitle ?
      <div className="Node-subtitle" dangerouslySetInnerHTML={{__html: this.props.node.subtitle}} />
      : null;

    var args = this.props.node.args ? argsToDOM(this.props.node.args) : null;

    return (
      <div className="Node-node">
        {title}
        {subtitle}
        {args}
      </div>
    );
  }
});

function argsToDOM(args) {
  var r = [],
      MAX_OBJECT_COUNT = 3;

  args.forEach(function (arg, i) {
    if (typeof arg === 'object') {

      var count = 0,
          ro = [],
          total = Object.keys(arg).length;

      for (var k in arg) {
        var v = arg[k];
        ro.push(
          <div className="Node-argObjectItem">
            <span className="Node-argObjectKey">{k}</span>
            <span className="Node-argObjectVal">{v}</span>
          </div>
        );
        if (++count >= MAX_OBJECT_COUNT-1 && total > MAX_OBJECT_COUNT) {
          ro.push(
            <div className="Node-argObjectEllipses" />
          );
          break;
        }
      }

      r.push(
        <div  className={'Node-arg'+i+' Node-arg Node-arg--object'}>{ro}</div>
      )

    } else {

      r.push(
        <div  className={'Node-arg'+i+' Node-arg'}>{arg}</div>
      );

    }
  });

  return r;
}

module.exports = Node;