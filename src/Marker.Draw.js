L.Marker.Draw = L.Handler.Draw.extend({
	options: {
		icon: new L.Icon.Default()
	},
	
	addHooks: function () {
		L.Handler.Draw.prototype.addHooks.call(this);
		//this._marker = null;
		if (this._map) {
			this._updateLabelText({
				text: (L.Browser.touch ? 'Tap' : 'Click') + ' map to place marker.'
			});
			L.DomEvent.addListener(this._container, 'mousemove', this._onMouseMove, this);
			if (L.Browser.touch) {
				L.DomEvent.addListener(this._container, 'touchmove', this._onMouseMove, this);
				L.DomEvent.addListener(this._container, 'touchend', this._onClick, this);
			}
		}
	},

	removeHooks: function () {
		L.Handler.Draw.prototype.removeHooks.call(this);
		
		if (this._map) {
			if (this._marker) {
				L.DomEvent
				.removeListener(this._marker, 'click', this._onClick)
				.removeListener(this._map, 'click', this._onClick);
				
				if (L.Browser.touch) {
					L.DomEvent
					.removeListener(this._marker, 'touchend', this._onClick);
				}
				this._map.removeLayer(this._marker);
				delete this._marker;
			}

			L.DomEvent.removeListener(this._container, 'mousemove', this._onMouseMove);
			if (L.Browser.touch) {
				L.DomEvent
				.removeListener(this._container, 'touchmove', this._onMouseMove)
				.removeListener(this._container, 'touchend', this._onClick);
			}
		}
	},

	_onMouseMove: function (e) {
		var newPos = this._map.mouseEventToLayerPoint(e.touches ? e.touches[0] : e),
		latlng = this._map.mouseEventToLatLng(e.touches ? e.touches[0] : e);
		
		if (e.touches) {
			// This is necessary to stop the map from panning
			L.DomEvent.stopPropagation(e);
		}

		this._updateLabelPosition(newPos);

		if (!this._marker) {
			this._marker = new L.Marker(latlng, this.options.icon);
			this._map.addLayer(this._marker);
			// Bind to both marker and map to make sure we get the click event.
			L.DomEvent
			.addListener(this._marker, 'click', this._onClick, this)
			.addListener(this._map, 'click', this._onClick, this);
			
			if (L.Browser.touch) {
				L.DomEvent
				.addListener(this._marker, 'touchend', this._onClick, this);
			}
		}
		else {
			this._marker.setLatLng(latlng);
		}
	},

	_onClick: function (e) {
		if (e.touches) {
			// This might be a bit greedy
			L.DomEvent.stopPropagation(e);
		}
		this._map.fire(
			'draw:marker-created',
			{
				marker: new L.Marker(this._marker ? this._marker.getLatLng() : this._map.mouseEventToLatLng(e.changedTouches ? e.changedTouches[0] : e), this.options.icon)
			}
			);
		this.disable();
	}
});