L.Edit = L.Edit || {};
/**
 * @class L.Edit.Circle
 * @aka Edit.Circle
 * @inherits L.Edit.SimpleShape
 */
L.Edit.Circle = L.Edit.SimpleShape.extend({
	_createMoveMarker: function () {
		var center = this._shape.getLatLng();

		this._moveMarker = this._createMarker(center, this.options.moveIcon);
	},

	_createResizeMarker: function () {
		var center = this._shape.getLatLng(),
			resizemarkerPoint = this._getResizeMarkerPoint(center);

		this._resizeMarkers = [];
		this._resizeMarkers.push(this._createMarker(resizemarkerPoint, this.options.resizeIcon));
	},

	_getResizeMarkerPoint: function (latlng) {
		// From L.shape.getBounds()
		var delta = this._shape._radius * Math.cos(Math.PI / 4),
			point = this._map.project(latlng);
		return this._map.unproject([point.x + delta, point.y - delta]);
	},

	_move: function (latlng) {
        var moveOk = true;
        
        var originalCenter = this._shape.getLatLng().clone();
        var bbounds = this._map.options.maxBounds;
        
		// force moves to be inside our bounds
        var originalRadius = L.LatLngUtil.radiusToBounds(bbounds, originalCenter, this._getResizeMarkerPoint(originalCenter));
        
        if (bbounds) {
            var resizemarkerPoint = this._getResizeMarkerPoint(latlng);
            var moveToRadius = L.LatLngUtil.radiusToBounds(bbounds, latlng, resizemarkerPoint);
            moveOk = (originalRadius - moveToRadius) < 0.01;
        }
        
        if (moveOk) {
            // Move the resize marker
            this._resizeMarkers[0].setLatLng(resizemarkerPoint);

            // Move the circle
            this._shape.setLatLng(latlng);
            this._moveMarker.setLatLng(latlng);

            this._map.fire(L.Draw.Event.EDITMOVE, {
                layer: this._shape,
                originalCenter: originalCenter,
                newCenter: latlng,
                editType: 'editcircle/Move',
                editHandler: this
            });
        }
        else {
            this._moveMarker.setLatLng(originalCenter);
        }
	},

	_resize: function (latlng) {
        var originalCenter = this._shape.getLatLng();
        var bbounds = this._map.options.maxBounds;
        
        var originalRadius = L.LatLngUtil.radiusToBounds(bbounds, originalCenter, this._getResizeMarkerPoint(originalCenter));
        
		var moveLatLng = this._moveMarker.getLatLng();
        var radius = L.LatLngUtil.radiusToBounds(bbounds, moveLatLng, latlng);
		this._shape.setRadius(radius);
        
		this._map.fire(L.Draw.Event.EDITRESIZE, {
            layer: this._shape,
            originalRadius: originalRadius,
            newRadius: radius,
            editType: 'editcircle/Resize',
            editHandler: this
        });
	}
});

L.Circle.addInitHook(function () {
	if (L.Edit.Circle) {
		this.editing = new L.Edit.Circle(this);

		if (this.options.editable) {
			this.editing.enable();
		}
	}

	this.on('add', function () {
		if (this.editing && this.editing.enabled()) {
			this.editing.addHooks();
		}
	});

	this.on('remove', function () {
		if (this.editing && this.editing.enabled()) {
			this.editing.removeHooks();
		}
	});
});