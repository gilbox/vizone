// This one acts in the context of the panel in the Dev Tools
//
// Can use
// chrome.devtools.*
// chrome.extension.*

//var React = require('react');
var ChartNode = require('../components/ChartNode.jsx');

//React.render(<ChartNode />, document.getElementById('chart-node'));

(function createChannel() {
  //Create a port with background page for continuous message communication
  var port = chrome.extension.connect({
    name: "simflux connection"
  });

  // Listen to messages from the background page
  port.onMessage.addListener(function(message) {
    if ('startIdx' in message) renderGraph(message[message.startIdx + message.count - 1]);
  });

}());

// printf-ish-style formatting
function fstr(str) {
  var args = Array.prototype.slice.call(arguments, 1);
  return str.replace(/{(\d+)}/g, function(match, number) {
    return typeof args[number] != 'undefined'
      ? args[number]
      : match
      ;
  });
}

// templates for generating graph node html
var strTransform = {
  view: ['<b>{0}</b>', 'view'],
  viewSimple: ['{0}', 'view'],
  preAction: ['{0}.<b>{1}</b>', 'acName', 'preAction'],
  preActionSimple: ['{0}', 'acName'],
  action: ['<h3 class="NodeAction-action">{0}</h3><pre class="NodeAction-code">{1}</pre>', 'action', 'args' ],
  actionSimple: ['{0}', 'action'],
  store: ['<h3 class="NodeStore-store">{0}</h3><small class="NodeStore-action">{1}</small>', 'store', 'action'],
  storeSimple: ['{0}', 'store']
};
_.forEach(strTransform,function (meta, type) {
  strTransform[type] = function(o) {
    var args = [meta[0]];
    for (var i = 1; i<meta.length; i++) {
      args.push(o[meta[i]]);
    }
    return fstr.apply(null, args);
  }
});

// Set up an SVG group so that we can translate the final graph.
var svg = d3.select("svg"),
  inner = svg.append("g");

function renderGraph(data) {
  var g = new dagreD3.graphlib.Graph().setGraph({});

  data.nodes.forEach(function(node) {
    var name = node.name,
        value = {};

    value.label = strTransform[node.type](node);
    value.simpleName = strTransform[node.type+'Simple'](node);
    value.labelType = 'html';
    value.location = node.location;
    value.rx = value.ry = 5;
    value.id = "some-id";
    value.class = "Node";

    g.setNode(name, value);
  });

  data.arrows.forEach(function (arrow) {
    g.setEdge(arrow.a, arrow.b, {label:'', lineInterpolate:'basis'});
  });

  // Create the renderer
  var render = new dagreD3.render();


  // Set up zoom support
  var zoom = d3.behavior.zoom().on("zoom", function() {
    inner.attr("transform", "translate(" + d3.event.translate + ")" +
    "scale(" + d3.event.scale + ")");
  });
  svg.call(zoom);

  // Simple function to style the tooltip for the given node.
  //var styleTooltip = function(name, description) {
  //  return "<p class='name'>" + name + "</p><p class='description'>" + description + "</p>";
  //};

  // Run the renderer. This is what draws the final graph.
  render(inner, g);

  inner.selectAll("g.node")
    .attr("data-clickable", function(v) { return g.node(v).location ? 'true' : 'false' })
    .each(function(v) {
      this.addEventListener('click', function () {
        var url = g.node(v).location;
        if (url) {
          var consoleMsg = url + '  <-- ' + g.node(v).simpleName;
          sendObjectToInspectedPage({action: "code", content: "console.log('%c"+consoleMsg+"', 'border: 1px solid orange; background: orange; color:white; border-radius: 5px; padding: 5px; line-height:25px;')"});
        }
      })
    });

  // Center the graph
  var initialScale = 0.75,
      svgEl = svg[0][0],
      w = svgEl.clientWidth;

  zoom
    .translate([(w - g.graph().width * initialScale) / 2, 20])
    .scale(initialScale)
    .event(svg);
  //svg.attr('height', g.graph().height * initialScale + 40);
}

// This sends an object to the background page
// where it can be relayed to the inspected page
function sendObjectToInspectedPage(message) {
  message.tabId = chrome.devtools.inspectedWindow.tabId;
  chrome.extension.sendMessage(message);
}
