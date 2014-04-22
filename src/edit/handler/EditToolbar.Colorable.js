// Color is depended on Jquery and Spectrum.js
// Spectrum was picked for the community support and features with pallets, alpha, touch and multi instance
// This is included for demo only. You should grab the latest version
// of it here: https://github.com/bgrins/spectrum
// Specrum is dependent on jquery but that's cool :P

L.EditToolbar.Colorable = L.Handler.extend({
    statics: {
        TYPE: 'colorable'
    },

    includes: L.Mixin.Events,

    initialize: function (map, options) {
        var colorable = this; // cache this to target in jquery

        L.Handler.prototype.initialize.call(this, map);

        L.Util.setOptions(this, options);

        // Save the type so super can fire, need to do this as cannot do this.TYPE :(
        this.type = L.EditToolbar.Colorable.TYPE;

        this._setColor('#fe57a1'); // Set color for all tools on load

        $(document).ready(function(){ // initialize after dom creation
            // Color is depended on Jquery and Spectrum.js
            $(".leaflet-draw-edit-colorable").spectrum({
                chooseText: 'Ok',
                color: '#fe57a1', /* Hot pink all the things! */
                showAlpha: true,
                showPalette: true,
                palette: [ ],
                change: function(color) {
                    var hexColor = color.toHexString(); // #ff0000
                    colorable._setColor(hexColor);
                }
            });
        });        
    },

    _setColor: function (color) {
        drawControl.setDrawingOptions({ 
            polyline: { shapeOptions: { color: color } },
            polygon: { shapeOptions: { color: color } },
            rectangle: { shapeOptions: { color: color } },
            circle: { shapeOptions: { color: color } },
            marker: { shapeOptions: { color: color } }
        });
    },
});
