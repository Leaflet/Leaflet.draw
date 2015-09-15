/**
 * A 2-point line-shaped marker. The first point is the marker point.
 *
 */
L.LineMarker = L.Polyline.extend({
    initialize: function (latLng, dx, dy, options) {
        // create line with 2 identical points, we will move the 2nd point in _simplifyPoints()
        L.Polyline.prototype.initialize.call(this, [latLng, latLng], options);
        this._dx = dx;
        this._dy = dy;
    },

    /**
     * Set the marker point of the line marker
     * @param latLng
     */
    setLatLng: function(latLng) {
        this.setLatLngs([latLng, latLng]);
        this.redraw();
    },

    /**
     * Set the 2nd point of the line marker (in relative pixels, y-axis negative)
     * @param dx
     * @param dy
     */
    setMoveTo: function(dx, dy) {
        this._dx = dx;
        this._dy = dy;
        this.redraw();
    },

    _simplifyPoints: function () {
        if(this._parts && this._parts.length != 0) {
            var pt1 = this._parts[0][0];
            // displace point 2
            var pt2 =  L.point(pt1.x + this._dx, pt1.y + this._dy);
             this._parts[0] = [pt1, pt2];
        }
        L.Polyline.prototype._simplifyPoints.call(this);
    }

});

L.lineMarker = function (latLng, dx, dy, options) {
    return new L.LineMarker(latLng, dx, dy, options);
};

