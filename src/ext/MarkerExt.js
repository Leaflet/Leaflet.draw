/**
 * A marker that has a fixed pixel offset w.r.t. its marker position.
 *
 */
L.MarkerExt = L.Marker.extend({

    options: {
        dx: 0,
        dy: 0
    },

    initialize: function (latlng, options) {
        L.Marker.prototype.initialize.call(this, latlng, options);
        this._dx = this.options.dx;
        this._dy = this.options.dy;
    },

    setOffset: function(dx, dy) {
        this._dx = dx;
        this._dy = dy;
        this.update();
    },

    _setPos : function (pos) {
        pos.x += this._dx;
        pos.y += this._dy;
        L.Marker.prototype._setPos.call(this, pos);
    }

});

L.markerExt = function (latlng, options) {
    return new L.MarkerExt(latlng, options);
};
