//Create a port with background page for continuous message communication
var port = chrome.extension.connect({
  name: "simflux connection"
});

module.exports = port;