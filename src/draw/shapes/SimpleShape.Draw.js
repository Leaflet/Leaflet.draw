L.SimpleShape = {};

L.SimpleShape.Draw = L.Handler.Draw.extend({
	addHooks: function () {
		L.Handler.Draw.prototype.addHooks.call(this);
		if (this._map) {
			this._map.dragging.disable();
			//TODO refactor: move cursor to styles
			this._container.style.cursor = 'crosshair';

			this._updateLabelText({ text: this._initialLabelText });

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

			// If the box element doesn't exist they must not have moved the mouse, so don't need to destroy/return
			if (this._shape) {
				this._map.removeLayer(this._shape);
				delete this._shape;
			}
		}
		this._isDrawing = false;
	},

	_onMouseDown: function (e) {
		this._isDrawing = true;
		
		this._updateLabelText({ text: 'Release mouse to finish drawing.' });

		this._startLatLng = this._map.mouseEventToLatLng(e);

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
			this._drawShape(latlng);
		}
	},

	_onMouseUp: function (e) {
		this._endLatLng = this._map.mouseEventToLatLng(e);

		this._fireCreatedEvent();
		
		this.disable();
	}
});