var React = require('react'),
    Node = require('../components/Node.jsx');

function sendObjectToInspectedPage(message) {
  message.tabId = chrome.devtools.inspectedWindow.tabId;
  chrome.extension.sendMessage(message);
}

function Chart(el) {
  this.svg = d3.select(el);
  this.inner = this.svg.append("g");
  this.clickEventListeners = [];
}

Chart.prototype.renderChart = function(nodes) {
  nodes = nodes || [];

  var svg = this.svg,
      inner = this.inner,
      _this = this;

  var g = new dagreD3.graphlib.Graph().setGraph({});

  nodes.forEach(function(node, i) {
    var value = {};

    // @todo: it would probably be more performant to use Handlebars, or similar here
    value.label = React.renderToStaticMarkup(<Node node={node} />);

    value.labelType = 'html';
    if (node.sourceLink) {
      value.linkLabel = node.sourceLink.label;
      value.linkUrl = node.sourceLink.url;
    }

    value.rx = value.ry = 5;
    value.id = "node-"+i;
    value.class = node.class ? (node.class + ' Node') : 'Node';

    g.setNode(i, value);

    if (! isNaN(node.$$$parent)) {
      g.setEdge(node.$$$parent, i, {label:'', lineInterpolate:'basis'});
    }
  });

  //data.arrows.forEach(function (arrow) {
  //  g.setEdge(arrow.a, arrow.b, {label:'', lineInterpolate:'basis'});
  //});

  // Create the renderer
  var render = new dagreD3.render();

  if (nodes.length) {

    // Set up zoom support
    var zoom = d3.behavior.zoom().on("zoom", function() {
      inner.attr("transform", "translate(" + d3.event.translate + ")" +
      "scale(" + d3.event.scale + ")");
    });
    svg.call(zoom);

  }

  // Simple function to style the tooltip for the given node.
  //var styleTooltip = function(name, description) {
  //  return "<p class='name'>" + name + "</p><p class='description'>" + description + "</p>";
  //};

  // Run the renderer. This is what draws the final graph.
  render(inner, g);

  if (!nodes.length) return;

  this.clickEventListeners.forEach(function (obj) {
    obj.o.removeEventListener('click', obj.f);
  });
  this.clickEventListeners = [];

  inner.selectAll("g.node")
    .attr("data-clickable", function(v) { return g.node(v).linkUrl ? 'true' : 'false' })
    .each(function(v) {
      var clickListener = function () {
        var url = g.node(v).linkUrl;
        if (url) {
          var consoleMsg = url + '  <-- ' + g.node(v).linkLabel;
          sendObjectToInspectedPage({action: "code", content: "console.log('%c"+consoleMsg+"', 'border: 1px solid orange; background: orange; color:white; border-radius: 5px; padding: 5px; line-height:25px;')"});
        }
      };
      this.addEventListener('click', clickListener);
      _this.clickEventListeners.push({o: this, f: clickListener});
    });

  // Center the graph
  var initialScale = 0.75,
    svgEl = svg[0][0],
    w = svgEl.clientWidth;

  zoom
    .translate([(w - g.graph().width * initialScale) / 2, 40])
    .scale(initialScale)
    .event(svg);
  //svg.attr('height', g.graph().height * initialScale + 40);
};

module.exports = Chart;