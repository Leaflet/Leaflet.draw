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
  },

  removeHooks: function () {
    L.DomEvent.off(this._container, 'touchstart', this._onTouchStart);
    L.DomEvent.off(this._container, 'touchend', this._onTouchEnd);
  },

  _onTouchStart: function (e) {
    if (!this._map._loaded) { return; }

    var type = 'touchstart';

    var containerPoint = this._map.mouseEventToContainerPoint(e),
        layerPoint = this._map.containerPointToLayerPoint(containerPoint),
        latlng = this._map.layerPointToLatLng(layerPoint);

    this._map.fire(type, {
      latlng: latlng,
      layerPoint: layerPoint,
      containerPoint: containerPoint,
      originalEvent: e
    });
  },

  _onTouchEnd: function (e) {
    if (!this._map._loaded) { return; }

    var type = 'touchend';

    this._map.fire(type, {
      originalEvent: e
    });
  }
});

L.Map.addInitHook('addHandler', 'touchExtend', L.Map.TouchExtend);