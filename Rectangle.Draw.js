L.Rectangle.Draw = L.Handler.Draw.extend({
	addHooks: function () {
		L.Handler.Draw.prototype.addHooks.call(this);
		if (this._map) {
			this._map.dragging.disable();
			//TODO refactor: move cursor to styles
			this._container.style.cursor = 'crosshair';

			this._updateLabelText({ text: 'Click and drag to draw rectangle.' });

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
			if (this._box) {
				this._pane.removeChild(this._box);
				delete this._box;

				this._map.fire(
					'draw:rectangle-created',
					{
						rect: new L.Rectangle(new L.LatLngBounds(this._startLatLng, this._endLatLng), this.options.shapeOptions)
					}
				);
			}
		}
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
		var layerPoint = this._map.mouseEventToLayerPoint(e);

		this._updateLabelPosition(layerPoint);

		if (this._isDrawing) {
			this._drawRectangle(layerPoint);
		}
	},

	_onMouseUp: function (e) {
		this._endLatLng = this._map.mouseEventToLatLng(e);

		this._isDrawing = false;
		
		this.disable();
	},

	_drawRectangle: function (layerPoint) {
		var offset = layerPoint.subtract(this._startLayerPoint),
			newPos = new L.Point(
				Math.min(layerPoint.x, this._startLayerPoint.x),
				Math.min(layerPoint.y, this._startLayerPoint.y));

		this._updateLabelPosition(layerPoint);

		if (!this._box) {
			this._box = L.DomUtil.create('div', 'leaflet-draw-rectangle', this._pane);
		}

		// hack the position of the div as in html land the top left is the top left of the border,
		// where as in svg world the top left seems to be the middle of the border?? (2 = border width / 2)
		newPos.x -= 2;
		newPos.y -= 2;

		L.DomUtil.setPosition(this._box, newPos);

		// TODO refactor: remove hardcoded 4 pixels (is not border width * 2 as the svg issue commented above)
		this._box.style.width  = (Math.abs(offset.x) - 4) + 'px';
		this._box.style.height = (Math.abs(offset.y) - 4) + 'px';
	}
});