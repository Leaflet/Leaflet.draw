L.Draw.Tooltip = L.Layer.extend({
  options: {
    pane: 'popupPane',
    nonBubblingEvents: ['mouseover', 'mousemove'],
    position: 'left',
    className: 'tooltip',
    arrowClass: 'tooltip-arrow',
    contentClass: 'tooltip-inner',
    subtextClass: 'tooltip-subtext',
    showClass: 'in',
    noWrap: false,
    wrapScreen: true,
    offset: [10, 5]
  },

  statics: {

    POSITIONS: {
      TOP: 'top',
      LEFT: 'left',
      BOTTOM: 'bottom',
      RIGHT: 'right'
    }
  },

  initialize: function (options, source) {
    this._container = null;
    this._arrow = null;
    this._contentNode = null;
    this._subtext = null;

    L.Util.setOptions(this, options);
    this._source = source;
  },

  _initLayout: function () {
    var options = this.options;
    if (options.noWrap) {
      options.className += ' nowrap';
    }
    this._container = L.DomUtil.create('div',
      options.className + ' ' + options.position +
      ' ' + options.showClass);
    this._arrow = L.DomUtil.create('div',
      options.arrowClass, this._container);
    this._contentNode = L.DomUtil.create('div',
      options.contentClass, this._container);
    this._subtext = L.DomUtil.create('div',
      options.subtextClass, this._container);
  },

  onAdd: function (map) {
    this._map = map;
    this._initLayout();
    if (this.options.content) {
      this.setContent(this.options.content);
    }
    this.getPane().appendChild(this._container);
    this._map.on('zoomend', this.updatePosition, this);
    return this;
  },


  show: function () {
    L.DomUtil.addClass(this._container, this.options.showClass);
    return this;
  },


  hide: function () {
    L.DomUtil.removeClass(this._container, this.options.showClass);
    return this;
  },

  onRemove: function (map) {
    L.Util.cancelAnimFrame(this._updateTimer);
    this.getPane().removeChild(this._container);
    this._map.off('zoomend', this.updatePosition, this);
    this._map = null;
    return this;
  },

  setContent: function (content) {
    this.options.content = content;
    if (this._map) {
      this._contentNode.innerHTML = content;
      this.updatePosition();
    }
    return this;
  },

  setSubtext: function (text) {
    this._subtext.innerHTML = text;
    this.updatePosition();
    return this;
  },

  setLatLng: function (latlng) {
    this._latlng = latlng;
    this.updatePosition();
    return this;
  },

  _getOffset: function (point, position) {
    var container = this._container;
    var options = this.options;
    var width = container.offsetWidth;
    var height = container.offsetHeight;
    var POSITIONS = L.Tooltip.POSITIONS;

    if (this.options.wrapScreen) {
      var mapSize = this._map.getSize();
      point = this._map.layerPointToContainerPoint(point);
      if (point.x + width / 2 > mapSize.x) {
        position = POSITIONS.LEFT;
      }
      if (point.x - width < 0) {
        position = POSITIONS.RIGHT;
      }

      if (point.y - height < 0) {
        position = POSITIONS.BOTTOM;
      }

      if (point.y + height > mapSize.y) {
        position = POSITIONS.TOP;
      }
    }

    this._container.className = (options.className + ' ' + position +
    ' ' + options.showClass);

    var offset = options.offset;
    if (position === POSITIONS.LEFT) {
      return new L.Point(-width - offset[0], -height / 2)._floor();
    } else if (position === POSITIONS.RIGHT) {
      return new L.Point(0 + offset[0], -height / 2)._floor();
    } else if (position === POSITIONS.TOP) {
      return new L.Point(-width / 2, -height - offset[1])._floor();
    } else if (position === POSITIONS.BOTTOM) {
      return new L.Point(-width / 2, 0 + offset[1])._floor();
    }
  },

  updatePosition: function (point) {
    this._updateTimer = L.Util.requestAnimFrame(function () {
      if (this._map) {
        point = point || this._map.latLngToLayerPoint(this._latlng);
        L.DomUtil.setPosition(this._container, point.add(
          this._getOffset(point, this.options.position))._floor());
      }
    }, this);
  }

});

L.tooltip = function (options, source) {
  return new L.Tooltip(options, source);
};
