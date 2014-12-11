// Can use
// chrome.devtools.*
// chrome.extension.*

// @todo: use chrome.devtools.inspectedWindow.eval for
//        - checking for presence of simflux on window
//        - injecting scripts?

// Create a tab in the devtools area
chrome.devtools.panels.create("simflux", "simflux.png", "panel.html", function(panel) {});

// @todo: we can intercept loading of simflux.js here... utilize this?
//.devtools.inspectedWindow.onResourceAdded.addListener(function() {
  // possibly use chrome.runtime.sendMessage
  //console.log("onResourceAdded-->arguments: ", arguments, arguments[0].url);
//});

