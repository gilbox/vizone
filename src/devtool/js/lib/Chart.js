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

function sendObjectToInspectedPage(message) {
  message.tabId = chrome.devtools.inspectedWindow.tabId;
  chrome.extension.sendMessage(message);
}


function Chart(el) {
  this.svg = d3.select(el);
  this.inner = this.svg.append("g");
  this.clickEventListeners = [];
}

Chart.prototype.renderChart = function(data) {
  var svg = this.svg,
      inner = this.inner,
      _this = this;

  var g = new dagreD3.graphlib.Graph().setGraph({});

  data.nodes.forEach(function(node, i) {
    var name = node.name,
      value = {};

    value.label = strTransform[node.type](node);
    value.simpleName = strTransform[node.type+'Simple'](node);
    value.labelType = 'html';
    value.location = node.location;
    value.rx = value.ry = 5;
    value.id = "node-"+i;
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

  this.clickEventListeners.forEach(function (obj) {
    obj.o.removeEventListener('click', obj.f);
  });
  this.clickEventListeners = [];

  inner.selectAll("g.node")
    .attr("data-clickable", function(v) { return g.node(v).location ? 'true' : 'false' })
    .each(function(v) {
      var clickListener = function () {
        var url = g.node(v).location;
        if (url) {
          var consoleMsg = url + '  <-- ' + g.node(v).simpleName;
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
    .translate([(w - g.graph().width * initialScale) / 2, 20])
    .scale(initialScale)
    .event(svg);
  //svg.attr('height', g.graph().height * initialScale + 40);
};

module.exports = Chart;