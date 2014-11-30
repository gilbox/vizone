simflux-viz
===========

Application-flow graphing for simflux.
Still in early stages of development, but fully functional.
Here's what it looks like...

![screenshot](http://i.imgur.com/GD3kadG.png?1)

install
=======

- build:


      npm install
      gulp


- Manually [Load unpacked extension](chrome://extensions/) for `devtool/` dir in chrome.
- Make sure that the web page you wish to use with `simflux-viz` hosts the `simflux-viz-bundle.js` file.
  Optionally, you can directly include `simflux-viz-bundle.js` in your project which will ensure that
  all actions (including actions dispatched during application startup) are recorded.
- Open your page which uses simflux
- Open devtools and click `simflux` tab
- Refresh the page, and you should see `simflux-viz loaded` in the console in orange
- Now every time an action occurs in the application, you will see a flow chart generated in real time.

why?
====

simflux flow charts can help developers quickly grasp the underpinnings of an application.

how?
====

By combining **zone.js** with the predictability of Flux architecture we can easily abstract
application flow. `simflux-viz` uses **zone.js** and monkey patches the `simflux` library
in order to record application flow in real-time.

cred
====

- This project borrowed a lot from `devtools-extension` project