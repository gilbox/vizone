// A Simple way to represent nodes in a graph

function SimfluxGraph() {
  this.nodes = [];
  this.nodeHash = {};
  this.nodeHashIndex = {};
  this.arrows = [];
}

SimfluxGraph.prototype.addNode = function (name, o) {
  o.name = name;
  this.nodeHashIndex[name] = this.nodes.length;
  this.nodes.push(this.nodeHash[name] = o);
};

SimfluxGraph.prototype.addArrow = function (a,b) {
  this.arrows.push({a:a,b:b});
};

SimfluxGraph.prototype.toObject = function () {
  return {
    nodes: this.nodes,
    nodeHashIndex: this.nodeHashIndex,
    arrows: this.arrows
  };
};

module.exports = SimfluxGraph;