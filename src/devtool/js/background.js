// Chrome automatically creates a background.html page for this to execute.
// This can access the inspected page via executeScript
// 
// Can use:
// chrome.tabs.*
// chrome.extension.*

chrome.extension.onConnect.addListener(function(port) {

  // @todo: use this instead of chrome.webNavigation.onCompleted ?
  //chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  //  if (changeInfo.status === 'complete') {
  //    console.log("chrome.tabs.onUpdated!!!!!!!");
  //    //chrome.tabs.executeScript(chrome.devtools.inspectedWindow.tabId, {file: "bridge.js"});
  //  }
  //});

  chrome.webNavigation.onCompleted.addListener(function(details) {
    if (! details.url.match(/^chrome:|about:/)) {
      chrome.extension.sendMessage({
        tabId: details.tabId,
        type: 'vizone-reset'
      });

      // @todo: there must be a better way to determine the tabId from bridge.js ?!
      chrome.tabs.executeScript(details.tabId, {code: "window.simfluxTabId="+details.tabId+";"});

      chrome.tabs.executeScript(details.tabId, {file: "js/bridge.js"});
    }
  });

  var extensionListener = function(message, sender, sendResponse) {
    if (message.tabId && message.content) {

      //Evaluate script in inspectedPage
      if (message.action === 'code') {
        chrome.tabs.executeScript(message.tabId, {code: message.content});

        //Attach script to inspectedPage
      } else if (message.action === 'script') {
        chrome.tabs.executeScript(message.tabId, {file: message.content});

        //Pass message to inspectedPage
      } else {
        chrome.tabs.sendMessage(message.tabId, message, sendResponse);
      }

      // This accepts messages from the inspectedPage and 
      // sends them to the panel
    } else {
      port.postMessage(message);
    }
    sendResponse(message);
  };

  // Listens to messages sent from the panel
  chrome.extension.onMessage.addListener(extensionListener);

  port.onDisconnect.addListener(function(port) {
    chrome.extension.onMessage.removeListener(extensionListener);
  });

  // port.onMessage.addListener(function (message) {
  //   port.postMessage(message);
  // });

});

// @todo? remove this?
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  return true;
});