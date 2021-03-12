/**
 * @class L.Draw.Curve
 * @aka Draw.Curve
 * @inherits L.Draw.Feature
 */
L.Draw.Curve = L.Draw.Feature.include(CurveCommon).extend({
	statics: {
		TYPE: 'curve'
	},

	Curve: L.Curve,

	options: {
		repeatMode: false,
		icon: new L.DivIcon({
			iconSize: new L.Point(8, 8),
			className: 'leaflet-div-icon leaflet-editing-icon'
		}),
		shapeOptions: {
			stroke: true,
			color: '#3388ff',
			weight: 4,
			opacity: 0.5,
			fill: false,
			clickable: true
		},
		shapeGuideOptions: {
			color: '#ff3c3c',
			weight: 3,
			opacity: 0.8,
		},
		zIndexOffset: 2000, // This should be > than the highest z-index any map layers
	},

	// @method initialize(): void
	initialize: function (map, options) {
		this.markerOptions = {
			icon: this.options.icon,
			zIndexOffset: this.options.zIndexOffset * 2,
		};
		// Save the type so super can fire
		this.type = L.Draw.Curve.TYPE;
		L.Draw.Feature.prototype.initialize.call(this, map, options);
	},
	
	// @method addHooks(): void
	// Add listener hooks to this handler
	addHooks: function () {
		L.Draw.Feature.prototype.addHooks.call(this);
		if (this._map) {
			this.init();
			this._tooltip.updateContent(this._getTooltipText());
			this._futurePath = new L.Curve([], this.options.shapeGuideOptions).addTo(this._map);
			this._futureDest = null;
	
			this._map
				.on('mousedown', this._onTouch, this)
				.on('mousemove', this._mouseMoveDragging, this);
		}
	},

	// @method removeHooks(): void
	// Remove listener hooks from this handler.
	removeHooks: function () {
		L.Draw.Feature.prototype.removeHooks.call(this);
		// remove markers from map
		this.delete();

		this._map.removeLayer(this._path);
		delete this._path;
		this._map.removeLayer(this._futurePath);
		delete this._futurePath;

		this._map
			.off('mousedown', this._onTouch, this)
			.off('mousemove', this._mouseMoveDragging, this);
	},



	completeShape: function () {
		if (this._markers.length < 2) {
			return;
		}
		this._fireCreatedEvent();
		this.disable();
		if (this.options.repeatMode) {
			this.enable();
		}
	},

	_finishShape: function () {
		this._fireCreatedEvent();
		this.disable();
		if (this.options.repeatMode) {
			this.enable();
		}
	},
	_finishClose: function() {
		this._closeShape();
		this.completeShape();
	},

	_onTouch: function (e) {
		if (e.originalEvent.target.classList.contains('leaflet-marker-icon')) { return; }
		this._futureDest = [e.latlng.lat, e.latlng.lng];
		this._map.on('mouseup', this._drawConfirm, this);
		if (!this._instructions.length) return;
		this._map.dragging.disable();
	},

	// called when the mouse is release (mouseup)
	_drawConfirm: function (e) {
		this._map.dragging.enable();
		this.draggingControl = false;
		this._futureDest = null;
		this._map.off('mouseup', this._drawConfirm, this);

		if (!this._instructions.length) { 
			var firstMarker = this._createGoTo([e.latlng.lat, e.latlng.lng], 'M');
			firstMarker.on('click', this._finishClose, this);
			this._map.fire(L.Draw.Event.DRAWVERTEX, {layers: this._markerGroup});
			// var firstMarker = new L.Marker.Touch(e.latlng, this.markerOptions).addTo(this._markerGroup);
			return;
			// firstMarker.on('click', this._finishShape, this);
		}
		if (!this._futurePathDef.length) { return; }
		this._map.fire(L.Draw.Event.DRAWVERTEX, {layers: this._markerGroup});
		this._instructions.push(this._futurePathDef[0]);
		this._latlngs.push(this._futurePathDef.slice(1));
		this._updateFinishMarker();
		this._futurePathDef = [];
		this._futurePath.setPath([]);
		if (!this._map.hasLayer(this._path)) {
			this._map.addLayer(this._path);
		}
		this._updatePath();
	},

	// called continuously while the mouse is pressed after adding a new point
	_mouseMoveDragging: function(e) {
		this._updateTooltip(e.latlng);
		if (!this._instructions.length) return;
		if (this._futureDest != null) {
			this.draggingControl = true;
		}
		else {
			this.draggingControl = false;
		}
		this._updateFuturePath(e);
	},

	// @method deleteLastVertex(): void
	// Remove the last point from the path. Does nothing if only 2 points or less.
	deleteLastVertex: function () {
		if (this._markers.length < 2) {  return; }
        var marker = this._markers.pop();
		this._instructions.pop();
		this._latlngs.pop();
		this._markerGroup.removeLayer(marker);
        this._map.fire(L.Draw.Event.DRAWVERTEX, {layers: this._markerGroup});
		this._updatePath();
	},

	_updateFuturePath: function(e) {
		var latlng = [e.latlng.lat, e.latlng.lng]; // dest on hover, control on drag
		var lastInstruction = this._instructions[this._instructions.length - 1];
		var lastCoords = this._getLastPoint();
		var lastLatlngs = this._getLastLatLngs();
		var startPoint = ['M', lastCoords];
		if (lastInstruction == 'M' || lastInstruction == 'L') {
			if (this.draggingControl) {
				this._futurePathDef = ['C', lastCoords, latlng, this._futureDest];
			}
			else {
				this._futurePathDef = ['L', latlng];
			}
		}
		else if (lastInstruction == 'C') {
			var previousControl = lastLatlngs[1];
			var symetric = L.GeometryUtil.getPointSymetric(lastCoords, previousControl);
			if (this.draggingControl) {
				this._futurePathDef = ['C', symetric, latlng, this._futureDest];
			} else if (previousControl == lastLatlngs[2]) {
				this._futurePathDef = ['L', latlng];
			} else {
				this._futurePathDef = ['C', symetric, latlng, latlng];
			}
		}
		this._futurePath.setPath(startPoint.concat(this._futurePathDef));
	},


	_onMouseOut: function () {
		if (this._tooltip) {
			this._tooltip._onMouseOut.call(this._tooltip);
		}
	},

	_updateFinishMarker: function() {
		var markerCount = this._markers.length;
		var lastCoord = this._getLastPoint();
		if (markerCount > 1) {
			var lastMarker = this._markers[markerCount - 1];
			lastMarker.setLatLng(lastCoord)
		}
		else {
			var markerFinish = new L.Marker.Touch(lastCoord, this.markerOptions).addTo(this._markerGroup);
			this._markers.push(markerFinish);
			markerFinish.on('click', this._finishShape, this);
		}
	},

	_updateTooltip: function (latLng) {
		var text = this._getTooltipText();
		if (latLng) {
			this._tooltip.updatePosition(latLng);
		}
		this._tooltip.updateContent(text);
	},

	_getTooltipText: function () {
		var text;
		if (this._markers.length === 0) {
			text = L.drawLocal.draw.handlers.curve.tooltip.start;
		} else {
			if (this._markers.length === 1) {
				if (this.draggingControl) {
					text = L.drawLocal.draw.handlers.curve.tooltip.drag;
				}
				else { text = L.drawLocal.draw.handlers.curve.tooltip.cont; }
			} else {
				text = L.drawLocal.draw.handlers.curve.tooltip.end;
			}
		}
		return {text: text};
	},

	_fireCreatedEvent: function () {
		var path = new this.Curve(this._path.getPath(), this.options.shapeOptions);
		L.Draw.Feature.prototype._fireCreatedEvent.call(this, path);
	}
});
