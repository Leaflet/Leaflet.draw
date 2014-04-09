// This isn't full Touch support. This is just to get makers to also support dom touch events after creation
// #TODO: find a better way of getting markers to support touch.

L.Marker.Touch = L.Marker.extend({

    // This is an exact copy of https://github.com/Leaflet/Leaflet/blob/v0.7/src/layer/marker/Marker.js
    // with the addition of the touch event son line 15.
    _initInteraction: function () {

        if (!this.options.clickable) { return; }

        // TODO refactor into something shared with Map/Path/etc. to DRY it up

        var icon = this._icon,
            events = ['dblclick', 'mousedown', 'mouseover', 'mouseout', 'contextmenu', 'touchstart', 'touchend', 'touchmove'];

        L.DomUtil.addClass(icon, 'leaflet-clickable');
        L.DomEvent.on(icon, 'click', this._onMouseClick, this);
        L.DomEvent.on(icon, 'keypress', this._onKeyPress, this);

        for (var i = 0; i < events.length; i++) {
            L.DomEvent.on(icon, events[i], this._fireMouseEvent, this);
        }

        if (L.Handler.MarkerDrag) {
            this.dragging = new L.Handler.MarkerDrag(this);

            if (this.options.draggable) {
                this.dragging.enable();
            }
        }
    }
})