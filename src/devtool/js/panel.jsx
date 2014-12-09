// Acts in the context of the panel in the Dev Tools
//
// Can use
// chrome.devtools.*
// chrome.extension.*

var React = require('react');
var Panel = require('./components/Panel.jsx');

var panel = <Panel />;

React.render(panel, document.getElementById('panel'));

window.panel = panel;
