// Acts in the context of the panel in the Dev Tools
//
// Can use
// chrome.devtools.*
// chrome.extension.*

var React = require('react');
var Panel = require('./components/Panel.jsx');
var flux = require('./lib/flux');

// Morearty will pass root binding to Panel
var BootstrapPanel = flux.ctx.bootstrap(Panel);

React.render(<BootstrapPanel />, document.getElementById('panel'));

window.panel = panel;  // just for console playing
