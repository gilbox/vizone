var React = require('react'),
    Morearty = require('morearty'),
    flux = require('../lib/flux');

var AppEnabler = React.createClass({
  displayName: 'AppEnabler',
  mixins: [Morearty.Mixin],

  toggle: function (enabled) {
    flux.actionCreator.setVizoneEnabled({enabled:enabled});
  },

  render: function(){
    var binding = this.getDefaultBinding(),
        checked = binding.get();

    return (
      <label className="AppEnabler">
        <input
          type="checkbox"
          checked={checked}
          onChange={this.toggle.bind(null, !checked)}
          className="AppEnabler-checkbox"
        />
        <span className="AppEnabler-copy">
          enable vizone for this page
        </span>
      </label>
    );
  }
});

module.exports = AppEnabler;