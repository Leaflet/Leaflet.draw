'use strict';
(function (factory, window) {
  // define an AMD module that relies on 'leaflet'
  if (typeof define === 'function' && define.amd) {
    define(['leaflet'], factory);

    // define a Common JS module that relies on 'leaflet'
  } else if (typeof exports === 'object') {
    module.exports = factory(require('leaflet'));
  }

  // attach your plugin to the global 'L' variable
  if (typeof window !== 'undefined' && window.L) {
    factory(window.L);
  }
}(function (L) {
  L.Draw = L.Evented.extend({
    options: {
      version: 1.0,
      draw: {
        toolbar: {
          // #TODO: this should be reorganized where actions are nested in actions
          // ex: actions.undo  or actions.cancel
          actions: {
            title: 'Cancel drawing',
            text: 'Cancel'
          },
          finish: {
            title: 'Finish drawing',
            text: 'Finish'
          },
          undo: {
            title: 'Delete last point drawn',
            text: 'Delete last point'
          },
          buttons: {
            polyline: 'Draw a polyline',
            polygon: 'Draw a polygon',
            rectangle: 'Draw a rectangle',
            circle: 'Draw a circle',
            marker: 'Draw a marker'
          },
          circle: {
            tooltip: {
              start: 'Click and drag to draw circle.'
            },
            radius: 'Radius'
          },
          marker: {
            tooltip: {
              start: 'Click map to place marker.'
            }
          },
          polygon: {
            tooltip: {
              start: 'Click to start drawing shape.',
              cont: 'Click to continue drawing shape.',
              end: 'Click first point to close this shape.'
            }
          },
          polyline: {
            error: '<strong>Error:</strong> shape edges cannot cross!',
            tooltip: {
              start: 'Click to start drawing line.',
              cont: 'Click to continue drawing line.',
              end: 'Click last point to finish line.'
            }
          },
          rectangle: {
            tooltip: {
              start: 'Click and drag to draw rectangle.'
            }
          },
          simpleshape: {
            tooltip: {
              end: 'Release mouse to finish drawing.'
            }
          }
        },
        handlers: {
          circle: true,
          marker: true,
          polygon: true,
          polyline: true,
          rectangle: true,
          simpleshape: false
        }
      },
      edit: {
        toolbar: {
          actions: {
            save: {
              title: 'Save changes.',
              text: 'Save'
            },
            cancel: {
              title: 'Cancel editing, discards all changes.',
              text: 'Cancel'
            },
            clearAll: {
              title: 'clear all layers.',
              text: 'Clear All'
            }
          },
          buttons: {
            edit: 'Edit layers.',
            editDisabled: 'No layers to edit.',
            remove: 'Delete layers.',
            removeDisabled: 'No layers to delete.'
          },
          edit: {
            tooltip: {
              text: 'Drag handles, or marker to edit feature.',
              subtext: 'Click cancel to undo changes.'
            }
          },
          remove: {
            tooltip: {
              text: 'Click on a feature to remove'
            }
          }
        },
        handlers: {
          edit: true,
          remove: true
        }
      }
    },
    controls: [],
    tooltip: null,

    initialize: function (map, options) {
      L.setOptions(this, options);
      this._lastZIndex = this.options.zIndex;
      this.map = map;
      this.createConfiguredControls();
      this.startEventListeners();
    },

    createConfiguredControls: function () {
      var that = this;
      console.log(L.tooltip);
      if (L.tooltip) {
        this.tooltip = L.tooltip({
            position: 'left',
            noWrap: true
          })
          .setContent('');
      }
      for (var toolbarElement in this.options.draw.handlers) {

        var geometryName = toolbarElement.charAt(0).toUpperCase() + toolbarElement.slice(1).toLowerCase();
        var callbackName = 'start' + geometryName;
        if (typeof this.map.editTools[callbackName] === 'function') {
          console.log(this.options.draw.toolbar[toolbarElement]);
          var control = L['New' + geometryName + 'Control'] = L.DrawControl.extend({
            options: {
              callback: this.map.editTools[callbackName],
              kind: toolbarElement,
              html: toolbarElement,
              tooltips: this.options.draw.toolbar[toolbarElement]
            }
          });
          this.controls.push(control)
        } else {
          console.error('Geometry type ' + geometryName + ' does not exist as an edit tool.');
        }
      }
      this.controls.forEach(function (control) {
        that.map.addControl(new control());
      })
    },

    startEventListeners: function () {
      var that = this;
      if (that.tooltip !== null) {
        that.map.on('mousemove', function (e) {
          that.tooltip.updatePosition(e.layerPoint);
        })
      }
    }
  });

  L.DrawUtilities = {
    convertLegacyOptions: function (legacyOptions) {
      var options = { version: 1.0, draw: {}, edit: {} };

      for (var legacyOption in legacyOptions) {
        if (legacyOption) {
          options[legacyOption].toolbar = {};
          options[legacyOption].handlers = {};
          for (var legacyHandler in legacyOptions[legacyOption].handlers) {
            if (legacyHandler) {
              options[legacyOption].toolbar[legacyHandler] = legacyOptions[legacyOption].handlers[legacyHandler];
              options[legacyOption].handlers[legacyHandler] = true;
            } else {
              options[legacyOption].handlers[legacyHandler] = false;
            }
          }
        }
      }

      return options;
    }
  };

  L.DrawControl = L.Control.extend({
    options: {
      position: 'topright',
      callback: null,
      kind: '',
      html: '',
      tooltips: {}
    },

    onAdd: function (map) {
      var container = this._container = L.DomUtil.create('div', 'leaflet-control leaflet-bar'),
        link = L.DomUtil.create('a', '', container);

      link.href = '#';
      link.title = '';
      link.innerHTML = this.options.html;

      this.hookEvents(link);
      return container;
    },

    hookEvents: function (link) {
      L.DomEvent
        .on(link, 'click', L.DomEvent.stop)
        .on(link, 'click', function () {
          window.LAYER = this.options.callback.call(map.editTools);
        }, this);
    }
  });

  L.Map.mergeOptions({
    drawToolsClass: L.Draw,
    draw: false,
    drawOptions: {}

  });

  L.Map.addInitHook(function () {
    this.whenReady(function () {
      if (this.options.draw) {
        if (this.options.drawOptions && !(Object.keys(this.options.drawOptions).length === 0)) {
          var version = this.options.drawOptions.version;
          if (version <= 1.0 || version === undefined) {
            // Assuming options given is prior to 1.0 - replace with 1.0 version
            this.options.drawOptions = L.DrawUtilities.convertLegacyOptions(this.options.drawOptions);
          }
        }
        this.drawTools = new this.options.drawToolsClass(this, this.options.drawOptions);
      }
    });

  });
}, window));
