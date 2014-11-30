// This one acts in the context of the panel in the Dev Tools
//
// Can use
// chrome.devtools.*
// chrome.extension.*



//function sendObjectToInspectedPage(message) {
//  console.log("send it!");
//  message.tabId = chrome.devtools.inspectedWindow.tabId;
//  chrome.extension.sendMessage(message);
//}
(function createChannel() {
  //Create a port with background page for continous message communication
  var port = chrome.extension.connect({
    name: "Sample Communication" //Given a Name
  });

  // Listen to messages from the background page
  port.onMessage.addListener(function(message) {
    //if (message.content) {
    //  document.querySelector('#insertmessagebutton').innerHTML = message.content;
    //} else {
    //document.querySelector('#data').innerText = JSON.stringify(message);
    console.log("-->message: ", message);
    if ('startIdx' in message) graphit(message[message.startIdx]);
    //}
    // port.postMessage(message);
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

var strTransform = {
  view: ['<b>{0}</b>', 'view'],
  preAction: ['{0}.<b>{1}</b>', 'acName', 'preAction'],
  action: ['{0}', 'action'],
  store: ['{0}.{1}', 'store', 'action']
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

function graphit(data) {
  var g = new dagreD3.graphlib.Graph().setGraph({});

  data.nodes.forEach(function(node) {
    var name = node.name,
        value = {};

    value.label = strTransform[node.type](node);
    value.labelType = 'html';
    value.rx = value.ry = 5;

    console.log("node-->name, value.label: ", name, value.label);
    g.setNode(name, value);
  });

  data.arrows.forEach(function (arrow) {
    console.log("arrow-->arrow.a, arrow.b: ", arrow.a, arrow.b);
    g.setEdge(arrow.a, arrow.b, {label:''});
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

  //inner.selectAll("g.node")
  //  .attr("title", function(v) { return styleTooltip(v, g.node(v).description) })
  //  .each(function(v) { $(this).tipsy({ gravity: "w", opacity: 1, html: true }); });

  // Center the graph
  var initialScale = 0.75,
      svgEl = svg[0][0],
      w = svgEl.clientWidth,
      h = svgEl.clientHeight;

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

console.log("HELLO");

angular.module('sfvDev', [])

  .directive('sfvMain', function() {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'panel-main.html',
      controller: function($scope) {
        $scope.executeScript = function() {
          console.log('oooo');
          //sendObjectToInspectedPage({action: "code", content: "console.log('Inline script executed')"});
          //sendObjectToInspectedPage({action: "script", content: "vendor/zone.js"});
          sendObjectToInspectedPage({action: "script", content: "bridge.js"});
        }
      }
    }
  });

//document.querySelector('#executescript').addEventListener('click', function() {
//    sendObjectToInspectedPage({action: "code", content: "console.log('Inline script executed')"});
//}, false);
//
//document.querySelector('#insertscript').addEventListener('click', function() {
//    sendObjectToInspectedPage({action: "script", content: "inserted-script.js"});
//}, false);
//
//document.querySelector('#insertmessagebutton').addEventListener('click', function() {
//    sendObjectToInspectedPage({action: "code", content: "document.body.innerHTML='<button>Send message to DevTools</button>'"});
//    sendObjectToInspectedPage({action: "script", content: "messageback-script.js"});
//}, false);