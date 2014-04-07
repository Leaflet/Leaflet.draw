L.Map.mergeOptions({
  touchExtend: true
});

L.Map.TouchExtend = L.Handler.extend({

    initialize: function (map) {
        this._map = map;
        this._container = map._container;
        this._pane = map._panes.overlayPane;
    },

    addHooks: function () {
        L.DomEvent.on(this._container, 'touchstart', this._onTouchStart, this);
        L.DomEvent.on(this._container, 'touchend', this._onTouchEnd, this);
        L.DomEvent.on(this._container, 'touchcancel', this._onTouchCancel, this);
        L.DomEvent.on(this._container, 'touchleave', this._onTouchLeave, this);
        L.DomEvent.on(this._container, 'touchmove', this._onTouchMove, this);
    },

    removeHooks: function () {
        L.DomEvent.off(this._container, 'touchstart', this._onTouchStart);
        L.DomEvent.off(this._container, 'touchend', this._onTouchEnd);
        L.DomEvent.off(this._container, 'touchcancel', this._onTouchCancel);
        L.DomEvent.off(this._container, 'touchleave', this._onTouchLeave);
        L.DomEvent.off(this._container, 'touchmove', this._onTouchMove);
    },
    
    _touchEvent: function (e, type) {
        // #TODO: fix the pageX error that is do a bug in Android where a single touch triggers two click events
        // _filterClick is what leaflet uses as a workaround.
        var containerPoint = this._map.mouseEventToContainerPoint(e.touches[0]);
            layerPoint = this._map.mouseEventToLayerPoint(e.touches[0]),
            latlng = this._map.layerPointToLatLng(layerPoint);

        this._map.fire(type, {
            latlng: latlng,
            layerPoint: layerPoint,
            containerPoint: containerPoint,
            pageX: e.touches[0].pageX,
            pageY: e.touches[0].pageY,
            originalEvent: e
        });
    },

    _onTouchStart: function (e) {
        if (!this._map._loaded) { return; }

        var type = 'touchstart';
        this._touchEvent(e, type);
        
    },

    _onTouchEnd: function (e) {
        if (!this._map._loaded) { return; }

        var type = 'touchend';
        this._touchEvent(e, type);
    },
    
    _onTouchCancel: function (e) {
        if (!this._map._loaded) { return; }

        var type = 'touchcancel';
        this._touchEvent(e, type);
    },

    _onTouchLeave: function (e) {
        if (!this._map._loaded) { return; }

        var type = 'touchleave';
        this._touchEvent(e, type);
    },

    _onTouchMove: function (e) {
        if (!this._map._loaded) { return; }

        var type = 'touchmove';
        this._touchEvent(e, type);
    }
});

L.Map.addInitHook('addHandler', 'touchExtend', L.Map.TouchExtend);