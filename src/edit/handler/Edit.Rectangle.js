L.Edit = L.Edit || {};
/**
 * @class L.Edit.Rectangle
 * @aka Edit.Rectangle
 * @inherits L.Edit.SimpleShape
 */
L.Edit.Rectangle = L.Edit.SimpleShape.extend({
	_createMoveMarker: function () {
		var bounds = this._shape.getBounds(),
			center = bounds.getCenter();

		this._moveMarker = this._createMarker(center, this.options.moveIcon);
	},

	_createResizeMarker: function () {
		var corners = this._getCorners();

		this._resizeMarkers = [];

		for (var i = 0, l = corners.length; i < l; i++) {
			this._resizeMarkers.push(this._createMarker(corners[i], this.options.resizeIcon));
			// Monkey in the corner index as we will need to know this for dragging
			this._resizeMarkers[i]._cornerIndex = i;
		}
	},

	_onMarkerDragStart: function (e) {
		L.Edit.SimpleShape.prototype._onMarkerDragStart.call(this, e);

		// Save a reference to the opposite point
		var corners = this._getCorners(),
			marker = e.target,
			currentCornerIndex = marker._cornerIndex;

		this._oppositeCorner = corners[(currentCornerIndex + 2) % 4];

		this._toggleCornerMarkers(0, currentCornerIndex);
	},

	_onMarkerDragEnd: function (e) {
		var marker = e.target,
			bounds, center;

		// Reset move marker position to the center
		if (marker === this._moveMarker) {
			bounds = this._shape.getBounds();
			center = bounds.getCenter();

			marker.setLatLng(center);
		}

		this._toggleCornerMarkers(1);

		this._repositionCornerMarkers();

		L.Edit.SimpleShape.prototype._onMarkerDragEnd.call(this, e);
	},

	_move: function (newCenter) {
		var latlngs = this._shape._defaultShape ? this._shape._defaultShape() : this._shape.getLatLngs(),
			bounds = this._shape.getBounds(),
			center = bounds.getCenter(),
			offset, newLatLngs = [];
            
        // Offset the latlngs to the new center
		// but enforce move to be inside our maxBounds
        var bbounds = this._map.options.maxBounds;
            
		// enforce move to be inside our maxBounds
        var okToMove = true;
        var originals = [];
        for (var i = 0, l = latlngs.length; i < l; i++) {
            originals.push(latlngs[i].clone());
            offset = [latlngs[i].lat - center.lat, latlngs[i].lng - center.lng];
            var newLat = newCenter.lat + offset[0];
            var newLng = newCenter.lng + offset[1];
            var newLatLng = new L.LatLng(newLat, newLng);
            if (bbounds && (! bbounds.contains(newLatLng))) {
                okToMove = false;
            }
            newLatLngs.push([newLat, newLng]);
        }
        
        // only move if all corners are inside the maxbound
        if (okToMove) {
            // Offset the latlngs to the new center
            this._shape.setLatLngs(newLatLngs);

            // Reposition the resize markers
            this._repositionCornerMarkers();
            this._moveMarker.setLatLng(newCenter);

            this._map.fire(L.Draw.Event.EDITMOVE, {
                layer: this._shape,
                newCenter: newCenter,
                originalCenter: center,
                originalLatLngs: originals,
                newLatLngs: newLatLngs,
                editType: 'editrect/Move',
                editHandler: this
            });
        }
        else {
            this._moveMarker.setLatLng(center);
        }
	},

	_resize: function (latlng) {
		var bounds;
        var bbounds = this._map.options.maxBounds;
        
		var originalBounds = this._shape.getBounds();
        
		// Update the shape based on the current position of this corner and the opposite point
        if (bbounds) {
            this._shape.setBounds(L.LatLngUtil.boxToBounds(bbounds, this._oppositeCorner, latlng));
        }
        else {
            this._shape.setBounds(L.latLngBounds(latlng, this._oppositeCorner));
        }
        
		// Reposition the move marker
		bounds = this._shape.getBounds();
		this._moveMarker.setLatLng(bounds.getCenter());

		this._map.fire(L.Draw.Event.EDITRESIZE, {
            layer: this._shape,
            originalBounds: originalBounds,
            newBounds: bounds,
            editType: 'editrect/Resize',
            editHandler: this
        });
	},

	_getCorners: function () {
		var bounds = this._shape.getBounds(),
			nw = bounds.getNorthWest(),
			ne = bounds.getNorthEast(),
			se = bounds.getSouthEast(),
			sw = bounds.getSouthWest();

		return [nw, ne, se, sw];
	},

	_toggleCornerMarkers: function (opacity) {
		for (var i = 0, l = this._resizeMarkers.length; i < l; i++) {
			this._resizeMarkers[i].setOpacity(opacity);
		}
	},

	_repositionCornerMarkers: function () {
		var corners = this._getCorners();

		for (var i = 0, l = this._resizeMarkers.length; i < l; i++) {
			this._resizeMarkers[i].setLatLng(corners[i]);
		}
	}
});

L.Rectangle.addInitHook(function () {
	if (L.Edit.Rectangle) {
		this.editing = new L.Edit.Rectangle(this);

		if (this.options.editable) {
			this.editing.enable();
		}
	}
});
