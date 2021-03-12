
CurveCommon = {
	init: function() {
		this.initVars();
		if (!this._markerGroup) {
			this._markerGroup = new L.LayerGroup();
			this._map.addLayer(this._markerGroup);
		}
		if (!this._path) {
			this._path = new L.Curve([], this.options.shapeOptions);
		}
	},
	initVars: function() {
		this._markers = [];
		this._instructions = []; 	// array of SVG instructions (['M', 'Q', ...])
		this._latlngs = [];			// array of corresponding lat/lng coordinates, varying in size depending on the instruction
	},

	delete: function() {
		this._map.removeLayer(this._markerGroup);
		delete this._markerGroup;
		delete this._markers;
		delete this._instructions;
		delete this._latlngs;	 
	},

	_closeShape: function() {
		if (!this._instructions.length) { return; }
		var firstPoint = this._latlngs[0][0];
		this._createGoTo(firstPoint, 'L');
	},

	_createGoTo: function(latlng, instruction) {
		var currentIndex = this._instructions.length;
		var markerDest = new L.Marker.Touch(latlng, this.markerOptions);
		markerDest.index = [currentIndex, 0]
		this._instructions.push(instruction);
		this._latlngs.push([latlng]);
		this._markers.push(markerDest);
		this._markerGroup.addLayer(markerDest);
		this._updatePath();
		return markerDest;
	},

	_getLastPoint: function() {
		var lastCoords = this._getLastLatLngs();
		return lastCoords[lastCoords.length - 1];
	},
	_getLastLatLngs: function() {
		return this._latlngs[this._latlngs.length - 1];
	},
	_getReconstructed: function() {
		var reconstructed = [];
		for (var i = 0; i < this._instructions.length; ++i) {
			reconstructed.push(this._instructions[i]);
			reconstructed.push.apply(reconstructed, this._latLngToArray(this._latlngs[i]));
		}
		return reconstructed;
	},
	_updatePath: function() {
		this._path.setPath(this._getReconstructed());
	},

	_latLngToArray: function(latlngArray) {
		var asArrays = [];
		for (var i = 0; i < latlngArray.length; ++i) {
			var latlng = latlngArray[i];
			if (!Array.isArray(latlng)) { latlng = [latlng.lat, latlng.lng];}
			asArrays.push(latlng);
		}
		return asArrays;
	},

};
