L.Circle.Draw = L.Handler.Draw.extend({
	options: {
		shapeOptions: {
			stroke: true,
			color: '#f06eaa',
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,
			clickable: true
		}
	},

	addHooks: function () {
		L.Handler.Draw.prototype.addHooks.call(this);
		if (this._map) {
			this._map.dragging.disable();
			//TODO refactor: move cursor to styles
			this._container.style.cursor = 'crosshair';

			this._updateLabelText({ text: 'Click and drag to draw circle.' });

			L.DomEvent
				.addListener(this._container, 'mousedown', this._onMouseDown, this)
				.addListener(document, 'mousemove', this._onMouseMove, this);
		}
	},

	removeHooks: function () {
		L.Handler.Draw.prototype.removeHooks.call(this);
		if (this._map) {
			this._map.dragging.enable();
			//TODO refactor: move cursor to styles
			this._container.style.cursor = '';

			L.DomEvent
				.removeListener(this._container, 'mousedown', this._onMouseDown)
				.removeListener(document, 'mousemove', this._onMouseMove)
				.removeListener(document, 'mouseup', this._onMouseUp);

			// If the circle element doesn't exist they must not have moved the mouse, so don't need to destroy/return
			if (this._circ) {
				this._map.removeLayer(this._circ);
				delete this._circ;
			}
		}
		this._isDrawing = false;
	},

	_onMouseDown: function (e) {
		this._isDrawing = true;
		
		this._updateLabelText({ text: 'Release mouse to finish drawing.' });

		this._startLatLng = this._map.mouseEventToLatLng(e);

		this._startLayerPoint = this._map.mouseEventToLayerPoint(e);

		L.DomEvent
			.addListener(document, 'mouseup', this._onMouseUp, this)
			.preventDefault(e);
	},

	_onMouseMove: function (e) {
		var layerPoint = this._map.mouseEventToLayerPoint(e),
			latlng = this._map.mouseEventToLatLng(e);

		this._updateLabelPosition(layerPoint);

		if (this._isDrawing) {
			this._updateLabelPosition(layerPoint);
			if (!this._circ) {
				this._circ = new L.Circle(this._startLatLng, this._startLatLng.distanceTo(latlng), this.options.shapeOptions);
				this._map.addLayer(this._circ);
			} else {
				this._circ.setRadius(this._startLatLng.distanceTo(latlng));
			}
		}
	},

	_onMouseUp: function (e) {
		this._endLatLng = this._map.mouseEventToLatLng(e);
		
		this._map.fire(
			'draw:circle-created',
			{ circ: new L.Circle(this._startLatLng, this._startLatLng.distanceTo(this._endLatLng), this.options.shapeOptions) }
		);
		
		this.disable();
	}
});