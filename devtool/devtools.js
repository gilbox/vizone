// Can use
// chrome.devtools.*
// chrome.extension.*

// Create a tab in the devtools area
chrome.devtools.panels.create("simflux", "toast.png", "panel.html", function(panel) {});

// @todo: we can intercept loading of simflux.js here... utilize this?
//chrome.devtools.inspectedWindow.onResourceAdded.addListener(function() {
//  console.log("onResourceAdded-->arguments: ", arguments[0].url);
//});

