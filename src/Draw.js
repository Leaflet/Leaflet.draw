import DrawControl from './Control';
import L from 'leaflet';
import './styles/draw.less';

L.Draw = L.Evented.extend({
    options: {
        version: 2.0,
        controls: true,
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
                circle: {
                    tooltips: {
                        create: 'Draw a circle',
                        start: 'Click and drag to draw circle.'
                    },
                    radius: 'Radius'
                },
                marker: {
                    tooltips: {
                        create: 'Draw a marker',
                        start: 'Click map to place marker.'
                    }
                },
                polygon: {
                    tooltips: {
                        create: 'Draw a polygon',
                        start: 'Click to start drawing shape.',
                        cont: 'Click to continue drawing shape.',
                        end: 'Click first point to close this shape.'
                    }
                },
                polyline: {
                    error: '<strong>Error:</strong> shape edges cannot cross!',
                    tooltips: {
                        create: 'Create a polyline',
                        start: 'Click to start drawing line.',
                        cont: 'Click to continue drawing line.',
                        end: 'Click last point to finish line.'
                    }
                },
                rectangle: {
                    tooltips: {
                        create: 'Create a rectangle',
                        start: 'Click and drag to draw rectangle.'
                    }
                },
                simpleshape: {
                    tooltips: {
                        create: 'I\' not enabled right now, but I should do something about that',
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
        if (this.options.controls) {
            this.createConfiguredControls();
        }
    },

    createConfiguredControls: function () {
        for (let [handler, enabled] of Object.entries(this.options.draw.handlers)) {
            if (enabled) {
                const geometryName = handler.charAt(0).toUpperCase() + handler.slice(1).toLowerCase();
                const callbackName = 'start' + geometryName;
                if (typeof this.map.editTools[callbackName] === 'function') {
                    let tooltips = this.options.draw.toolbar[handler].tooltips;
                    let options = {
                        callback: this.map.editTools[callbackName],
                        handlerType: handler,
                        tooltipMessages: (tooltips) ? tooltips : {}
                    };
                    this.controls.push(L['New' + geometryName + 'Control'] = DrawControl.extend({options}));
                } else {
                    console.error('Geometry type ' + geometryName + ' does not exist as an edit tool.');
                }
            }
        }
        this.controls.forEach(function (Control) {
            this.map.addControl(new Control());
        }, this);
    }
});

export default L.Draw;
