
L.Edit = L.Edit || {};
/**
 * @class L.Edit.Curve
 * @aka L.Edit.Curve
 * @aka Edit.Curve
 */
L.Edit.Curve = L.Handler.include(CurveCommon).extend({
    options: {
		icon: new L.DivIcon({
			iconSize: new L.Point(10, 10),
			className: 'leaflet-div-icon leaflet-editing-icon'
		}),
        iconEdit: new L.DivIcon({
			iconSize: new L.Point(8, 8),
			className: 'leaflet-div-icon leaflet-editing-icon leaflet-editing-handle'
		}),
        lineGuideStyle: {
            color: '#ff3c3c',
            weight: 2,
            opacity: 0.7,
        },
        zIndexOffset: 2000,
    },
	// @method initialize(): void
	initialize: function (path, options) {
        this.markerOptions = {
			icon: this.options.icon,
            draggable: true,
            zIndexOffset: this.options.zIndexOffset * 2,
		};
        this.markerEditOptions = {
            icon: this.options.iconEdit,
            draggable: true,
            zIndexOffset: this.options.zIndexOffset * 2,
        }
        this.lineStyle = this.options.lineGuideStyle;
        this._path = path;
		this._path.on('revert-edited', this._setPath, this);
	},

    reset: function() {
		if (this._markerGroup) { this._markerGroup.clearLayers(); }
		if (this._editMarkers) { this._editMarkers.clearLayers(); }
		this.init();
	},

    _setPath: function() {
        this.initFromCoords(this._path._coords);
    },

	// @method addHooks(): void
	// Add listener hooks to this handler
	addHooks: function () {
        if (this._path._map) { 
            this._map = this._path._map;
            if (this._path.options.original) {
                this._path.options.editing.fill = false;
                delete this._path.options.editing.dashArray;
                this._path.setStyle(this._path.options.editing);
            }
            this._setupEdition(this._path._coords);
        }
	},

	// @method removeHooks(): void
	// Remove listener hooks from this handler
	removeHooks: function () {
        this.delete();
        this._map.removeLayer(this._editMarkers);
        delete this._editMarkers;
        this._path.setStyle(this._path.options.original);
	},

    _setupEdition: function(coords) {
        if (!this._editMarkers) { this._editMarkers = new L.LayerGroup().addTo(this._map); }
        this.reset();
        this.initFromCoords(coords);
        this._updateDeleteHandler();
        this._updateMarkerEdition();
    },

    _updateDeleteHandler: function() {
        var markerCount = this._markers.length;
		if (markerCount > 1) {
			this._markers[markerCount - 1].on('click', this.deleteLastVertex, this);
		}
    },

    // @method deleteLastVertex(): void
	// Remove the last point from the path. Does nothing if only 2 points or less.
	deleteLastVertex: function () {
		if (this._markers.length < 3) {  return; }
        var marker = this._markers.pop();
		this._instructions.pop();
		this._latlngs.pop();
		this._markerGroup.removeLayer(marker);
        this._map.fire(L.Draw.Event.EDITVERTEX, {layers: this._markerGroup});
        var reconstructed = this._getReconstructed();
        this._setupEdition(reconstructed);
        this._path.edited = true;
	},

    _updateMarkerEdition: function() {
        var self = this;
        for (var i = 0; i < this._markers.length; i++) {
            var marker = this._markers[i];
            marker.on('drag', function() {
                self._path.fire('edit');
            });
            marker.on('dragend', this._vertexChanged, this);
        }
    },

    _vertexChanged: function () {
		this._map.fire(L.Draw.Event.EDITVERTEX, {layers: this._markerGroup});
	},

    initFromCoords: function(coords) {
		this.initVars();
		var lastInstruction = null;
		var i = 0;
		var coordsAccum = [];
		while (i < coords.length) {
			var current = coords[i];
			i += 1;
			if (typeof current === 'string') {
				if (coordsAccum.length) {
					this.addFromCoords(lastInstruction, coordsAccum);
					coordsAccum = [];
				}
				lastInstruction = current;
				continue;
			}
			coordsAccum.push(current);
		}
		this.addFromCoords(lastInstruction, coordsAccum);
        this._setupControlMarkersEdit();
	},

	addFromCoords: function(instruction, coords) {
		switch (instruction) {
			case 'L':
			case 'M':
				this._createGoTo(coords[0], instruction);
				break;
			case 'Q':
				this._createQuadraticFromCoords(coords);
				break;
			case 'C':
				this._createCubicFromCoords(coords);
				break;
		}
        this._updatePath();
	},

    _createQuadraticFromCoords: function(coords) {
		var control = coords[0];
		var dest = coords[1];
		var markerDest = new L.Marker.Touch(dest, this.markerOptions).addTo(this._markerGroup);
		this._markers.push( markerDest);
		this._instructions.push('Q');
		this._latlngs.push([control, dest]);
	},

	_createCubicFromCoords: function(coords) {
		var firstControl = coords[0];
		var secondControl = coords[1];
		var dest = coords[2];
		var markerDest = new L.Marker.Touch(dest, this.markerOptions).addTo(this._markerGroup);
		this._markers.push(markerDest);
		this._instructions.push('C');
		this._latlngs.push([firstControl, secondControl, dest]);
	},

    _setupControlMarkersEdit: function() {
        for (var i = 0; i < this._markers.length; i++) {
            this._setupControlMarkerEdit(i);
        }
        this.markerSelected = 0;
    },

    _setupControlMarkerEdit: function(markerIndex) {
		var self = this;
        var marker = this._markers[markerIndex];
        marker._index = markerIndex;
        var nbInstructions = this._instructions.length;
        var currentInstruction = this._instructions[markerIndex];
        var isLast = markerIndex == nbInstructions - 1;
        var nextIsCubic = markerIndex < nbInstructions - 1 && this._instructions[markerIndex + 1] == 'C';
        var currentLatlngs = this._latlngs[markerIndex];
        var destSameSecondControl = currentLatlngs[2] == currentLatlngs[1];
        if (currentInstruction == 'C') {
            if (nextIsCubic && !destSameSecondControl) {
                marker._setupDouble = true;
                marker._coordsIndex = [[markerIndex, 2]];
                marker.on('drag click', self._onDragMarker, self);
            }
            else {
                marker._coordsIndex = [[markerIndex, 2]];
                    // only one handle, moving the second control point (if first defined) and the destination
                if (!isLast) {  marker._coordsIndex.push([markerIndex, 1]); }
                // one handle for destination, one handle for second control point
                else if (!destSameSecondControl) {
                    marker._setupSimple = true;
                }
                marker.on('drag click', self._onDragMarker, self);
            }
        }
        // update current position, + first control point of next if cubic
        else {
            marker._coordsIndex = [[markerIndex, 0]];
            if (nextIsCubic) { marker._coordsIndex.push([markerIndex + 1, 0]); }
            marker.on('drag click', self._onDragMarker, self);
        }
        this._setupDragStartEnd(marker);
	},

    _setupDragStartEnd: function(marker) {
        var self = this;
        marker.on('dragstart', function() {
            self._updateTooltip(false);
            self._path.edited = true;
        });
        marker.on('dragend', function() {
            self._updateTooltip(true);
        });
    },

    _setupSimpleHandle: function(e) {
        var marker = e.target;
        var markerIndex = marker._index;
        var currentCoords = this._latlngs[markerIndex];
        var markerControl = new L.Marker.Touch(currentCoords[1], this.markerEditOptions).addTo(this._editMarkers);
        var line = L.polyline([currentCoords[1], currentCoords[2]], this.lineStyle).addTo(this._editMarkers);
        var lineArgs = { line: line, coordsIndex: [[markerIndex, 1], [markerIndex, 2]] };
        this._initMarkerArgs(markerControl, markerIndex, [[markerIndex, 1]], null, lineArgs);
        marker._translateArgs = [markerControl];
        marker._line = lineArgs;
    },
    // create 3 handles : one for the destination of current, one for the 2nd control of current, one for the 1st control of next
    // the marker for the point already exists : attach a callback
    _setupDoubleHandle: function(e) {
        var marker = e.target;
        var markerIndex = marker._index;
        var currentCoords = this._latlngs[markerIndex];
        var nextCoords = this._latlngs[markerIndex + 1];
        var line = L.polyline([currentCoords[1], nextCoords[0]], this.lineStyle).addTo(this._editMarkers);
        var lineArgs = { line: line, coordsIndex: [[markerIndex, 1], [markerIndex + 1, 0]] };
        var markerControl2 = new L.Marker.Touch(currentCoords[1], this.markerEditOptions).addTo(this._editMarkers);
        var markerControl1 = new L.Marker.Touch(nextCoords[0], this.markerEditOptions).addTo(this._editMarkers);
        this._initMarkerArgs(markerControl1, markerIndex, [[markerIndex + 1, 0]], {ref: [markerIndex, 2], marker: markerControl2}, lineArgs);
        this._initMarkerArgs(markerControl2, markerIndex, [[markerIndex, 1]], {ref: [markerIndex, 2], marker: markerControl1}, lineArgs);
        marker._line = lineArgs;
        marker._translateArgs = [markerControl1, markerControl2];
    },
    
    _initMarkerArgs: function(marker, index, coords, symetric, lineArgs) {
        marker._coordsIndex = coords
        marker._index = index;
        if (symetric) { marker._symetricArgs = symetric; }
        marker._line = lineArgs;
        marker.on('drag', this._onDragMarker, this);
        this._setupDragStartEnd(marker);
    },

    _updateSymetric: function(latlng, symetricArgs) {
        var indexRef = symetricArgs.ref;
        var indexChanged = symetricArgs.marker._coordsIndex[0];
        var pointRef = this._latlngs[indexRef[0]][indexRef[1]];
        var symetric = L.GeometryUtil.getPointSymetric(pointRef, latlng);
        this._latlngs[indexChanged[0]][indexChanged[1]] = symetric;
        symetricArgs.marker.setLatLng(symetric);
    },

    _updateTranslate: function(e, translatedMarkers) {
        if (!e.target.previousLatlng) {
            e.target.previousLatlng = e.target._latlng;
        }
        var difLat = e.latlng.lat - e.target.previousLatlng.lat; 
        var difLng = e.latlng.lng - e.target.previousLatlng.lng;
        e.target.previousLatlng = e.target._latlng;
        for (var i = 0; i < translatedMarkers.length; i++) {
            var marker = translatedMarkers[i];
            var coordsIndex = marker._coordsIndex[0];
            var coords = this._latlngs[coordsIndex[0]][coordsIndex[1]];
            var newCoords = [coords[0] + difLat, coords[1] + difLng];
            this._latlngs[coordsIndex[0]][coordsIndex[1]] = newCoords;
            marker.setLatLng(newCoords);
        }
    },

    _updateLine: function(lineObj) {
        var poly = lineObj.line;
        var coords =  lineObj.coordsIndex;
        var origin = this._latlngs[coords[0][0]][coords[0][1]];
        var dest = this._latlngs[coords[1][0]][coords[1][1]];
        poly.setLatLngs([origin, dest]);
    },

    _onDragMarker: function(e) {
        var indexMarker = e.target._index;
        var coordsArray = e.target._coordsIndex;
        var latlng = [e.latlng.lat, e.latlng.lng];
        if (indexMarker != this.markerSelected  ) {
            this._editMarkers.clearLayers();
            if (e.target._setupDouble) { this._setupDoubleHandle(e); }
            if (e.target._setupSimple) { this._setupSimpleHandle(e); }
            this.markerSelected = indexMarker;
        }
        if (e.target._line) {
            this._updateLine(e.target._line);
        }
        var symetric = e.target._symetricArgs;
        if (symetric) {
            this._updateSymetric(latlng, symetric);
        }
        if (e.target._translateArgs) {
            this._updateTranslate(e, e.target._translateArgs);
        }
        for (var i = 0; i < coordsArray.length; i++) {
            var coords = coordsArray[i];
            this._latlngs[coords[0]][coords[1]] = latlng;
        }
        this._updatePath();
    },

    _updateTooltip: function(display) {
        var tooltip = this._map._editTooltip;
        if (!tooltip) { return; }
        var updated = {}; 
        if (!display) {
            updated.text = '';
        } else {
            updated = {
                text: L.drawLocal.edit.handlers.edit.tooltip.text,
                subtext: L.drawLocal.edit.handlers.edit.tooltip.subtext
            }
        }
        tooltip.updateContent(updated);
    },


});

if (L.Curve) {
    L.Curve.addInitHook(function () {
    
        // Check to see if handler has already been initialized.
        if (this.editing) {
            return;
        }
    
        if (L.Edit.Curve) {
    
            this.editing = new L.Edit.Curve(this);
    
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
}
