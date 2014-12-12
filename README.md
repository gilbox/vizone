simflux-viz
===========

Application-flow graphing for simflux.
Still in early stages of development, but fully functional.
Here's what it looks like...

![screenshot](http://i.imgur.com/YtDsEcL.png)

install
=======

- Go here: **[simflux visualization devtool in the Chrome Web Store](https://chrome.google.com/webstore/detail/simflux-visualization-dev/idfhbgmlikkpjkkfaeajolmofdkaoinb)**
- Open your page which uses simflux
- Open devtools and click `simflux` tab
- Refresh the page, and you should see `simflux-viz loaded` in the console in orange
- Now every time an action occurs in the application, you will see a flow chart generated in real time.

developing
=======

If you just want to install the chrome extension, see the [install section](#install).
Otherwise, to work with the latest version from the repo, follow these steps:

- clone this repo
- build:


          npm install
          gulp


- Manually *Load unpacked extension* (chrome://extensions/) using this repo's `devtool/` dir in chrome.
- Optionally, you can directly include `simflux-viz-bundle.js` in your project which will ensure that
  all actions (including actions dispatched during application startup) are recorded. If you don't
  include `simflux-viz-bundle.js` it will be loaded on-the-fly directly from *rawgit*.
- Open your page which uses simflux
- Open devtools and click `simflux` tab
- Refresh the page, and you should see `simflux-viz loaded` in the console in orange
- Now every time an action occurs in the application, you will see a flow chart generated in real time.

usage
=====

usage: setup
-----

Normally when using `simflux`, some registration functions are optional. However, `simflux-viz`
will only be able to analyse your application if you use the registration functions listed below.

- `dispatcher = simflux.instantiateDispatcher('App Dispatcher')`: Instantiate a dispatcher
  (This will call `new simflux.Dispatcher()` for you)
- `dispatcher.registerStore({...})`: Register a store.
- `dispatcher.registerActionCreator({...}`; Register an Action Creator.

usage: from the console
----------------

Number of charts:

    simflux.history.length

Generate a link to a chart:

    simflux.generateLastHistoryGraphURL()   # most recent chart
    simflux.generateHistoryGraphURL(idx)    # chart by index

usage: chrome extension
-----------------------

When viewing a graph in the chrome extension, some nodes will be clickable. Clicking on a clickable
node will log a source-code link in the console which, when clicked, will take you to the code
related to that node.

why?
====

simflux flow charts can help developers quickly grasp the underpinnings of an application.

how?
====

By combining **zone.js** with the predictability of Flux architecture we can easily abstract
application flow. `simflux-viz` uses **zone.js** and monkey patches the `simflux` library
in order to record application flow in real-time.

The simflux-viz chrome developer tools panel is itself a [simflux](https://github.com/gilbox/simflux)
application, which uses [React](https://github.com/facebook/react) and [D3](http://d3js.org/) with
[dagreD3](https://github.com/cpettitt/dagre-d3)
to render the view. [Morearty](https://github.com/moreartyjs/moreartyjs)
with [immutable.js](https://github.com/facebook/immutable-js) is used for data binding.

cred
====

- This project borrowed a lot from [`devtools-extension`](https://github.com/thingsinjars/devtools-extension) project