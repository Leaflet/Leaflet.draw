L.Edit = L.Edit || {};

/**
 * @class L.Edit.Marker
 * @aka Edit.Marker
 */
L.Edit.Marker = L.Handler.extend({
	// @method initialize(): void
	initialize: function (marker, options) {
		this._marker = marker;
		L.setOptions(this, options);
	},

	// @method addHooks(): void
	// Add listener hooks to this handler
	addHooks: function () {
		var marker = this._marker;
        
        if (this._marker._map) {
            this._map = this._marker._map;
        
            marker.dragging.enable();
            marker.on('dragstart', this._onDragStart, marker);
            marker.on('dragend', this._onDragEnd, marker);
            this._toggleMarkerHighlight();
            
            this._map.fire(L.Draw.Event.EDITHOOK, {
                'editHandler' : this,
                'layer': this._marker
            });
        }
	},

	// @method removeHooks(): void
	// Remove listener hooks from this handler
	removeHooks: function () {
		var marker = this._marker;

		marker.dragging.disable();
		marker.off('dragstart', this._onDragStart, marker);
		marker.off('dragend', this._onDragEnd, marker);
		this._toggleMarkerHighlight();
	},

	_onDragStart: function (e) {
        this._originalLatLng = e.target.getLatLng().clone();
    },
    
	_onDragEnd: function (e) {
		var layer = e.target;
        
        var newLatLng = L.LatLngUtil.pointToBounds(this._map.options.maxBounds, layer.getLatLng());
        e.target.setLatLng(newLatLng);
        
		layer.edited = true;
		this._map.fire(L.Draw.Event.EDITMOVE, {
            layer: layer,
            newLatLng: newLatLng,
            originalLatLng: this._originalLatLng.clone(),
            editType: 'editmarker/Move',
            editHandler: this
        });
	},

	_toggleMarkerHighlight: function () {
		var icon = this._marker._icon;


		// Don't do anything if this layer is a marker but doesn't have an icon. Markers
		// should usually have icons. If using Leaflet.draw with Leaflet.markercluster there
		// is a chance that a marker doesn't.
		if (!icon) {
			return;
		}

		// This is quite naughty, but I don't see another way of doing it. (short of setting a new icon)
		icon.style.display = 'none';

		if (L.DomUtil.hasClass(icon, 'leaflet-edit-marker-selected')) {
			L.DomUtil.removeClass(icon, 'leaflet-edit-marker-selected');
			// Offset as the border will make the icon move.
			this._offsetMarker(icon, -4);

		} else {
			L.DomUtil.addClass(icon, 'leaflet-edit-marker-selected');
			// Offset as the border will make the icon move.
			this._offsetMarker(icon, 4);
		}

		icon.style.display = '';
	},

	_offsetMarker: function (icon, offset) {
		var iconMarginTop = parseInt(icon.style.marginTop, 10) - offset,
			iconMarginLeft = parseInt(icon.style.marginLeft, 10) - offset;

		icon.style.marginTop = iconMarginTop + 'px';
		icon.style.marginLeft = iconMarginLeft + 'px';
	}
});

L.Marker.addInitHook(function () {
	if (L.Edit.Marker) {
		this.editing = new L.Edit.Marker(this);

		if (this.options.editable) {
			this.editing.enable();
		}
	}
});
