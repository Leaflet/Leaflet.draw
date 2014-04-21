L.EditToolbar.Colorable = L.Handler.extend({
    statics: {
        TYPE: 'colorable'
    },

    includes: L.Mixin.Events,

    initialize: function (map, options) {
        L.Handler.prototype.initialize.call(this, map);

        L.Util.setOptions(this, options);

        // Store the selectable layer group for ease of access
        this._colorableLayers = this.options.featureGroup;

        if (!(this._colorableLayers instanceof L.FeatureGroup)) {
            throw new Error('options.featureGroup must be a L.FeatureGroup');
        }

        // Save the type so super can fire, need to do this as cannot do this.TYPE :(
        this.type = L.EditToolbar.Colorable.TYPE;
    },

    enable: function () {
        if (this._enabled || !this._hasAvailableLayers()) {
            return;
        }
        this.fire('enabled', { handler: this.type});

        this._map.fire('draw:colorablestart', { handler: this.type });

        L.Handler.prototype.enable.call(this);

        this._colorableLayers
            .on('layeradd', this._enableLayerColorable, this)
            .on('layerremove', this._disableLayerColorable, this);
    },

    disable: function () {
        if (!this._enabled) { return; }

        this._colorableLayers
            .off('layeradd', this._enableLayerColorable, this)
            .off('layerremove', this._disableLayerColorable, this);

        L.Handler.prototype.disable.call(this);

        this._map.fire('draw:colorablestop', { handler: this.type });

        this.fire('disabled', { handler: this.type});
    },

    addHooks: function () {
        var map = this._map;

        if (map) {
            map.getContainer().focus();

            this._colorableLayers.eachLayer(this._enableLayerColorable, this);
            this._coloredLayers = new L.layerGroup();

            this._tooltip = new L.Tooltip(this._map);
            this._tooltip.updateContent({ text: L.drawLocal.edit.handlers.remove.tooltip.text });
        }
    },

    removeHooks: function () {
        if (this._map) {
            this._colorableLayers.eachLayer(this._disableLayerColorable, this);
            this._coloredLayers = null;

            this._tooltip.dispose();
            this._tooltip = null;

            this._map.off('mousemove', this._onMouseMove, this);
        }
    },

    revertLayers: function () {
        // Iterate of the deleted layers and add them back into the featureGroup
        this._coloredLayers.eachLayer(function (layer) {
            this._colorableLayers.addLayer(layer);
        }, this);
    },

    save: function () {
        this._map.fire('draw:colored', { layers: this._coloredLayers });
    },

    _enableLayerColorable: function (e) {
        var layer = e.layer || e.target || e;

        layer.on('click', this._colorLayer, this);
    },

    _disableLayerColorable: function (e) {
        var layer = e.layer || e.target || e;

        layer.off('click', this._colorLayer, this);

        // Remove from the deleted layers so we can't accidently revert if the user presses cancel
        //this._coloredLayers.removeLayer(layer);
    },

    _colorLayer: function (e) {
        var layer = e.layer || e.target || e;
        //drawControl.setDrawingOptions({ rectangle: { shapeOptions: { color: '#004a80' } } });
        //this._colorableLayers.removeLayer(layer);
        this._coloredLayers.addLayer(layer);
        layer.setStyle({color:"#000000"});
    },

    _hasAvailableLayers: function () {
        return this._colorableLayers.getLayers().length !== 0;
    }
});
