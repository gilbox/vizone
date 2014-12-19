vizone
======

Application-flow graphing.
Still in early stages of development, but fully functional.

![screenshot](https://lh6.googleusercontent.com/dh3psZcxaajmkV-q3oR40t8oCiTTieJhkxmpMoMw7VXvhdyzEWWbuQ3Df8XW-Kk88IeK3IzqXg=s1280-h800-e365-rw)

why?
====

vizone flow charts can help developers quickly grasp the underpinnings of an application.

install
=======

- Install the extension: **[vizone devtool in the Chrome Web Store](https://chrome.google.com/webstore/detail/vizone-devtool/idfhbgmlikkpjkkfaeajolmofdkaoinb)**
- Open your page that you want to visualize
- Open devtools and click `vizone` tab
- Refresh the page, and you should see `vizone loaded` in the console in orange
- If the page you refresh has a library with a corresponding patch loaded into vizone, you should
  also see an orange console message for that library. If using simflux the message is `simflux-viz loaded`.
- Now every time an action occurs in the application, you will see a flow chart generated in real time.

usage: chrome extension
=======================

When viewing a chart in the chrome extension, some nodes will be clickable. Clicking on a clickable
node will log a source-code link in the console which, when clicked, will take you to the code
related to that node.

developing vizone
=======

If you just want to install the chrome extension, see the [install section](#install).
Otherwise, to work with the latest version from the repo, follow these steps:

- clone this repo
- build:


          npm install
          gulp


- Manually *Load unpacked extension* (chrome://extensions/) using this repo's `devtool/` dir in chrome.
- Open your page which uses vizone
- Open devtools and click `vizone` tab
- Refresh the page
- Now in the console you can access the `vizone` and `vizone.patch` functions

creating patches (vizone plugins)
========

You may use simflux-viz as an example for building your own patch. However, although simflux-viz
exclusively uses the `vizone` function to patch simflux, there is nothing stopping you from
using the `vizone.patch` function which is a much simpler way to create a patch.

Follow these guidelines when creating a patch:

- patches should access the `vizone` and/or `vizone.patch` function via the `window` scope
- patches should fail silently if their host frameworks are missing
- patches should announce load success by printing colorful message to the console
- patches should detect and prevent double-loading themselves

**You may develop patches without cloning this repo.** Just open the vizone plugin
background page (via chrome://extensions) and type the following to get a list of
loaded patches:

    scripts = JSON.parse(localStorage.getItem('vizone-scripts'));

Now to add your script do something like:

    scripts.push('http://localhost:3000/mylib-viz-bundle.js');
    localStorage.setItem('vizone-scripts', JSON.stringify(scripts));

In order for this change to take effect, close and reopen any devtool windows
where you are using vizone.

under the hood
=======

The vizone chrome developer tools panel is itself a [simflux](https://github.com/gilbox/simflux)
application, which uses [React](https://github.com/facebook/react) and [D3](http://d3js.org/) with
[dagreD3](https://github.com/cpettitt/dagre-d3)
to render the view. [Morearty](https://github.com/moreartyjs/moreartyjs)
with [immutable.js](https://github.com/facebook/immutable-js) is used for data binding.


simflux-viz
=====

Originally, simflux-viz was a standalone visualization tool for simflux. However,
I subsequently broke out the visualization tool into it's own library called vizone.
Now simflux-viz is completely decoupled from vizone and can easily be augmented or replaced
by other vizone plugins.

simflux-viz: developing
----------

- read the vizone [developing section](#developing-vizone)
- Optionally, you can directly include `simflux-viz-bundle.js` in your project which will ensure that
  all actions (including actions dispatched during application startup) are recorded. If you don't
  include `simflux-viz-bundle.js` it will be loaded on-the-fly directly from *rawgit*.
- Open your page which uses vizone
- Open devtools and click `vizone` tab
- Refresh the page, and you should see `simflux-viz loaded` in the console in orange
- Now every time an action occurs in the application, you will see a flow chart generated in real time.

simflux-viz: setup
-----

Normally when using `simflux`, some registration functions are optional. However, `simflux-viz`
will only be able to analyse your application if you use the registration functions listed below.

- `dispatcher.registerStore({...})`: Register a store.
- `dispatcher.registerActionCreator({...}`; Register an Action Creator.

simflux-viz: how?
====

By combining **zone.js** with the predictability of Flux architecture we can easily abstract
application flow. `simflux-viz` uses **zone.js** and monkey patches the `simflux` library
in order to record application flow in real-time.

cred
====

- This project borrowed a lot from [`devtools-extension`](https://github.com/thingsinjars/devtools-extension) project