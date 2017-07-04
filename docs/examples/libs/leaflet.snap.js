/* globals L:true */

L.Snap = {};

L.Snap.isDifferentLayer = function (marker, layer) {
    var i;
    var n;
    var markerId = L.stamp(marker);
    
    if (layer.hasOwnProperty('_snapIgnore')) {
        return false;
    }
    
    if (layer.hasOwnProperty('_topOwner') && marker.hasOwnProperty('_topOwner')) {
        return layer._topOwner !== marker._topOwner;
    }
    
    if (layer instanceof L.Marker) {
        return markerId !== L.stamp(layer);
    }
    
    if (layer.editing && layer.editing._enabled) {
        if (layer.editing._verticesHandlers) {
            var points = layer.editing._verticesHandlers[0]._markerGroup.getLayers();
            for(i = 0, n = points.length; i < n; i++) {
                if (L.stamp(points[i]) == markerId) {
                    return false;
                }
            }
        }
        
        else if (layer.editing._resizeMarkers) {
            for(i = 0; i < layer.editing._resizeMarkers.length; i++) {
                var resizeMarker = layer.editing._resizeMarkers[i];
                if (L.stamp(resizeMarker) == markerId) {
                    return false;
                }
            }
            
            if (layer.editing._moveMarker) {
                return markerId !== L.stamp(layer.editing._moveMarker);
            }
            
            return true;
        }
    }

    return true;
};

L.Snap.processGuide = function (latlng, marker, guide, snaplist, buffer) {
    // Guide is a layer group and has no L.LayerIndexMixin (from Leaflet.LayerIndex)
    if ((guide._layers !== undefined) && (typeof guide.searchBuffer !== 'function')) {
        for (var id in guide._layers) {
            if (guide._layers.hasOwnProperty(id)) {
                L.Snap.processGuide(latlng, marker, guide._layers[id], snaplist, buffer);
            }
        }
    }
    
    // Search snaplist around mouse
    else if (typeof guide.searchBuffer === 'function') {
        var nearlayers = guide.searchBuffer(latlng, buffer);
        snaplist = snaplist.concat(nearlayers.filter(function(layer) {
            return L.Snap.isDifferentLayer(layer);
        }));
    }
    
    // Make sure the marker doesn't snap to itself or an associated polyline layer
    else if (L.Snap.isDifferentLayer(marker, guide)) {
        snaplist.push(guide);
    }
};

L.Snap.findClosestLayerSnap = function (map, layers, latlng, tolerance, withVertices) {
    var closest = L.GeometryUtil.nClosestLayers(map, layers, latlng, 6);
    
    // code to correct prefer snap to shapes (and their vertices, if withVertices is true) to gridlines and guidelines, and then guidelines to gridlines
    var withinTolerance = [];
    var shapesWithinTolerance = [];
    var guidesWithinTolerance = [];
    for (var c=0; c<closest.length; c++) {
        var layerInfo = closest[c];
        if (layerInfo.distance < tolerance) {
            withinTolerance.push(layerInfo);
            
            if ((! layerInfo.layer.hasOwnProperty('_gridlineGroup')) && (! layerInfo.layer.hasOwnProperty('_guidelineGroup'))) {
                shapesWithinTolerance.push(layerInfo);
            }
            else if (layerInfo.layer.hasOwnProperty('_guidelineGroup')) {
                guidesWithinTolerance.push(layerInfo);
            }
        }
    }
    
    if (withinTolerance.length === 0) {
        return null;
    }
    
    var intInfo;
    var returnLayer = withinTolerance[0].layer;
    var returnLatLng = withinTolerance[0].latlng;
    
    if (shapesWithinTolerance.length > 0) {
        var shapeInfo = shapesWithinTolerance[0];
        returnLayer = shapeInfo.layer;
        returnLatLng = shapeInfo.latlng;
        
        // this is code from L.GeometryUtil.closestSnap that will find
        // the closest vertex of this layer to the point
        if (withVertices && (typeof shapeInfo.layer.getLatLngs == 'function')) {
            var vertexLatLng = L.GeometryUtil.closest(map, shapeInfo.layer, shapeInfo.latlng, true);
            
            if (vertexLatLng) {
                var d = L.GeometryUtil.distance(map, latlng, vertexLatLng);
                if (d < tolerance) {
                    returnLatLng = new L.LatLng(vertexLatLng.lat, vertexLatLng.lng);
                }
            }
        }
    }
    
    else if (guidesWithinTolerance.length > 0) {
        var guideInfo = guidesWithinTolerance[0];
        var guideType = guideInfo.layer._guidelineGroup;
        
        for (var i=0; i<withinTolerance.length; i++) {
            if (withinTolerance[i].layer._gridlineGroup != guideType) {
                intInfo = L.Snap.findGuideIntersection('guide', map, latlng, [guideInfo, withinTolerance[i]]);
                if (intInfo.distance < tolerance) {
                    returnLatLng = intInfo.intersection;
                    break;
                }
            }
        }
    }
    
    else {
        if (withinTolerance.length == 2) {
            intInfo = L.Snap.findGuideIntersection('grid', map, latlng, withinTolerance);
            if (intInfo.distance < tolerance) {
                returnLatLng = intInfo.intersection;
            }
        }
    }
    
    return {
        'layer' : returnLayer,
        'latlng': returnLatLng
    };
};


// Compatibility method to normalize Poly* objects
// between 0.7.x and 1.0+
// pulled from code from L.Edit.Poly in Leaflet.Draw
L.Snap.defaultShape = function (latlngs) {
    if (!L.Polyline._flat) { return latlngs; }
    return L.Polyline._flat(latlngs) ? latlngs : latlngs[0];
};

// try to prefer the corner of guidelines, or the the intersection of gridlines, if we're within the tolerance of two
L.Snap.findGuideIntersection = function (gType, map, latlng, guides) {
    var nsi = (guides[0].layer['_' + gType + 'lineGroup'] == 'NS') ? 1 : 0;
    var wei = (guides[0].layer['_' + gType + 'lineGroup'] == 'NS') ? 0 : 1;
    
    var ns = L.Snap.defaultShape(guides[nsi].layer._latlngs)[0];
    var we = L.Snap.defaultShape(guides[wei].layer._latlngs)[0];
    
    var intersection = new L.LatLng(ns.lat, we.lng);
    var distance = L.GeometryUtil.distance(map, intersection, latlng);
    return {
        'intersection': intersection,
        'distance': distance
    };
};

L.Snap.updateSnap = function (marker, layer, latlng) {
    if (! marker.hasOwnProperty('_latlng')) {
        return;
    }

    if (layer && latlng) {
        // don't call setLatLng so that we don't fire an unnecessary 'move' event
        marker._latlng = L.latLng(latlng);
        marker.update();
        if (marker.snap != layer) {
            marker.snap = layer;
            if (marker._icon) {
                L.DomUtil.addClass(marker._icon, 'marker-snapped');
            }
            marker.fire('snap', {layer:layer, latlng: latlng});
        }
    }
    else {
        if (marker.snap) {
            if (marker._icon) {
                L.DomUtil.removeClass(marker._icon, 'marker-snapped');
            }
            marker.fire('unsnap', {layer: marker.snap});
        }
        
        delete marker.snap;
    }
};

L.Snap.snapMarker = function (e, guides, map, options, buffer) {
    var marker = e.target;
    var latlng = e.target._latlng || e.latlng;
    
    if (! latlng) {
        return;
    }
    
    var snaplist = [];
    for (var i=0, n = guides.length; i < n; i++) {
        var guide = guides[i];
        
        // don't snap to vertices of a poly object for poly move
        if (marker.hasOwnProperty('_owner') && (guide._leaflet_id == marker._owner)) {
            continue;
        }
        
        L.Snap.processGuide(latlng, marker, guide, snaplist, buffer);
    }
    
    if (snaplist.length === 0) {
        return;
    }
    
    var closest = L.Snap.findClosestLayerSnap(map, snaplist, latlng, options.snapDistance, options.snapVertices);

    closest = closest || {layer: null, latlng: null};
    L.Snap.updateSnap(marker, closest.layer, closest.latlng);
    
    if (e.latlng && closest.latlng) {
        e.latlng = closest.latlng;
    }
    
    return closest;
};

L.Handler.MarkerSnap = L.Handler.extend({
    options: {
        snapDistance: 15, // in pixels
        snapVertices: true
    },

    initialize: function (map, marker, options) {
        L.Handler.prototype.initialize.call(this, map);
        this._markers = [];
        this._guides = [];

        if (arguments.length == 2) {
            if (!(marker instanceof L.Class)) {
                options = marker;
                marker = null;
            }
        }

        L.Util.setOptions(this, options || {});

        if (marker) {
            // new markers should be draggable !
            if (!marker.dragging) marker.dragging = new L.Handler.MarkerDrag(marker);
            marker.dragging.enable();
            this.watchMarker(marker);
        }

        // Convert snap distance in pixels into buffer in degres, for searching around mouse
        // It changes at each zoom change.
        function computeBuffer() {
            this._buffer = map.layerPointToLatLng(new L.Point(0,0)).lat -
                           map.layerPointToLatLng(new L.Point(this.options.snapDistance, 0)).lat;
        }
        map.on('zoomend', computeBuffer, this);
        map.whenReady(computeBuffer, this);
        computeBuffer.call(this);
    },

    enable: function () {
        this.disable();
        for (var i=0; i<this._markers.length; i++) {
            this.watchMarker(this._markers[i]);
        }
    },

    disable: function () {
        for (var i=0; i<this._markers.length; i++) {
            this.unwatchMarker(this._markers[i]);
        }
    },

    watchMarker: function (marker) {
        if (this._markers.indexOf(marker) == -1)
            this._markers.push(marker);
        marker.on('move', this._snapMarker, this);
        this._map.on('touchmove', this._snapMarker, this);
    },

    unwatchMarker: function (marker) {
        marker.off('move', this._snapMarker, this);
        this._map.off('touchmove', this._snapMarker, this);
        delete marker.snap;
    },

    addGuideLayer: function (layer) {
        for (var i=0, n=this._guides.length; i<n; i++)
            if (L.stamp(layer) == L.stamp(this._guides[i]))
                return;
        this._guides.push(layer);
    },

    _snapMarker: function(e) {
        var closest = L.Snap.snapMarker(e, this._guides, this._map, this.options, this._buffer);
        
        if (e.originalEvent && e.originalEvent.clientX && closest.layer && closest.latlng) {
            var snapTouchPoint = this._map.project(closest.latlng, this._map.getZoom());
            e.originalEvent.clientX = snapTouchPoint.x;
            e.originalEvent.clientY = snapTouchPoint.y;
            e.originalEvent.snapped = true;
        }
    }
});

L.Handler.PolylineSnap = L.Edit.Poly.extend({
    initialize: function (map, poly, options) {
        var that = this;

        L.Edit.Poly.prototype.initialize.call(this, poly, options);
        this._snapper = new L.Handler.MarkerSnap(map, options);
        poly.on('remove', function() {
            that.disable();
        });
    },
    
    addGuideLayer: function (layer) {
        this._snapper.addGuideLayer(layer);
    },
    
    _createMoveMarker: function (latlng, icon) {
        var marker = L.Edit.Poly.prototype._createMoveMarker.call(this, latlng, icon);
        this._poly.snapediting._snapper.watchMarker(marker);
        return marker;
    },
    
    _initHandlers: function () {
        this._verticesHandlers = [];
        for (var i = 0; i < this.latlngs.length; i++) {
            this._verticesHandlers.push(new L.Edit.PolyVerticesEditSnap(this._poly, this.latlngs[i], this.options));
        }
    }
});

L.Edit.PolyVerticesEditSnap = L.Edit.PolyVerticesEdit.extend({
    _createMarker: function (latlng, index) {
       var marker = L.Edit.PolyVerticesEdit.prototype._createMarker.call(this, latlng, index);

        // Treat middle markers differently
        var isMiddle = ((index === null) || (typeof(index) == 'undefined'));
        if (isMiddle) {
            // Snap middle markers, only once they were touched
            marker.on('dragstart', function () {
                this._poly.snapediting._snapper.watchMarker(marker);
            }, this);
        }
        else {
            this._poly.snapediting._snapper.watchMarker(marker);
        }
        return marker;
    }
});

L.Handler.RectangleSnap = L.Edit.Rectangle.extend({
    initialize: function (map, shape, options) {
        L.Edit.Rectangle.prototype.initialize.call(this, shape, options);
        this._snapper = new L.Handler.MarkerSnap(map, options);
    },
    
    _createMarker: function (latlng, icon) {
        var marker = L.Edit.Rectangle.prototype._createMarker.call(this, latlng, icon);
        this._shape.snapediting._snapper.watchMarker(marker);
        return marker;
    },
    
    addGuideLayer: function (layer) {
        this._snapper.addGuideLayer(layer);
    },
});

L.Handler.CircleSnap = L.Edit.Circle.extend({
    initialize: function (map, shape, options) {
        L.Edit.Circle.prototype.initialize.call(this, shape, options);
        this._snapper = new L.Handler.MarkerSnap(map, options);
    },
    
    _createMarker: function (latlng, icon) {
        var marker = L.Edit.Circle.prototype._createMarker.call(this, latlng, icon);
        this._shape.snapediting._snapper.watchMarker(marker);
        return marker;
    },
    
    addGuideLayer: function (layer) {
        this._snapper.addGuideLayer(layer);
    },
});

L.EditToolbar.SnapEdit = L.EditToolbar.Edit.extend({
    snapOptions: {
        snapDistance: 15, // in pixels
        snapVertices: true
    },

    initialize: function(map, options) {
        L.EditToolbar.Edit.prototype.initialize.call(this, map, options);

        if (options.snapOptions) {
            L.Util.extend(this.snapOptions, options.snapOptions);
        }

        if (Array.isArray(this.snapOptions.guideLayers)) {
            this._guideLayers = this.snapOptions.guideLayers;
        } else if (options.guideLayers instanceof L.LayerGroup) {
            this._guideLayers = this.snapOptions.guideLayers.getLayers();
        } else {
            this._guideLayers = [];
        }
    },

    addGuideLayer: function(layer) {
        var index = this._guideLayers.findIndex(function(guideLayer) {
            return L.stamp(layer) == L.stamp(guideLayer);
        });

        if (index == -1) {
            this._guideLayers.push(layer);
            this._featureGroup.eachLayer(function(layer) {
                if (layer.snapediting) {
                    layer.snapediting._guides.push(layer);
                }
            });
        }
    },

    removeGuideLayer: function(layer) {
      var index = this._guideLayers.findIndex(function(guideLayer) {
          return L.stamp(layer) == L.stamp(guideLayer);
      });

      if (index !== -1) {
          this._guideLayers.splice(index, 1);
          this._featureGroup.eachLayer(function(layer) {
              if (layer.snapediting) { layer.snapediting._guides.splice(index, 1); }
          });
      }
    },

    clearGuideLayers: function() {
        this._guideLayers = [];
        this._featureGroup.eachLayer(function(layer) {
            if (layer.snapediting) { layer.snapediting._guides = []; }
        });
    },

    // essentially, the idea here is that we're gonna find the currently instantiated L.Edit handler, figure out its type,
    // get rid of it, and then replace it with a snapedit instead
    _enableLayerEdit: function(e) {
        L.EditToolbar.Edit.prototype._enableLayerEdit.call(this, e);

        var layer = e.layer || e.target || e;

        if (!layer.snapediting) {
            if (layer.hasOwnProperty('_mRadius')) {
                if (layer.editing) {
                    layer.editing._markerGroup.clearLayers();
                    delete layer.editing;
                }
                layer.editing = layer.snapediting = new L.Handler.CircleSnap(layer._map, layer, this.snapOptions);
            }
            
            else if (layer.getLatLng) {
                layer.snapediting = new L.Handler.MarkerSnap(layer._map, layer, this.snapOptions);
            }
            
            else {
                if (layer.editing) {
                    if (layer.editing.hasOwnProperty('_shape')) {
                        layer.editing._markerGroup.clearLayers();
                        if (layer.editing._shape instanceof L.Rectangle) {
                            delete layer.editing;
                            layer.editing = layer.snapediting = new L.Handler.RectangleSnap(layer._map, layer, this.snapOptions);
                        }
                        else if (layer.editing._shape instanceof L.FeatureGroup) {
                            delete layer.editing;
                            layer.editing = layer.snapediting = new L.Handler.FeatureGroupSnap(layer._map, layer, this.snapOptions);
                        }
                        else {
                            delete layer.editing;
                            layer.editing = layer.snapediting = new L.Handler.CircleSnap(layer._map, layer, this.snapOptions);
                        }
                    }
                    else {
                        layer.editing._markerGroup.clearLayers();
                        layer.editing._verticesHandlers[0]._markerGroup.clearLayers();
                        delete layer.editing;
                        layer.editing = layer.snapediting = new L.Handler.PolylineSnap(layer._map, layer, this.snapOptions);
                    }
                }
                else {
                    layer.editing = layer.snapediting = new L.Handler.PolylineSnap(layer._map, layer, this.snapOptions);
                }
            }

            for (var i = 0, n = this._guideLayers.length; i < n; i++) {
                layer.snapediting.addGuideLayer(this._guideLayers[i]);
            }
        }

        layer.snapediting.enable();
    }
});

L.EditToolbar.prototype.getEditHandler = function (map, featureGroup) {
    return new L.EditToolbar.SnapEdit(map, {
        snapOptions: this.options.snapOptions,
        featureGroup: featureGroup,
        selectedPathOptions: this.options.edit.selectedPathOptions,
        poly: this.options.poly
    });
};

L.Draw.Feature.SnapMixin = {
    _snap_initialize: function () {
        this.on('enabled', this._snap_on_enabled, this);
        this.on('disabled', this._snap_on_disabled, this);
    },

    _snap_on_enabled: function () {
        if (!this.options.guideLayers) {
            return;
        }

        if (! this._mouseMarker) {
            this._map.on('layeradd', this._snap_on_enabled, this);
            return;
        }
        else {
            this._map.off('layeradd', this._snap_on_enabled, this);
        }
        
        if (!this._snapper) {
            this._snapper = new L.Handler.MarkerSnap(this._map);
            if (this.options.snapDistance) {
                this._snapper.options.snapDistance = this.options.snapDistance;
            }
            if (this.options.snapVertices) {
                this._snapper.options.snapVertices = this.options.snapVertices;
            }
        }

        for (var i=0, n=this.options.guideLayers.length; i<n; i++) {
            this._snapper.addGuideLayer(this.options.guideLayers[i]);
        }

        var marker = this._mouseMarker;
        this._snapper.watchMarker(marker);
        
        // Show marker when (snap for user feedback)
        var icon = marker.options.icon;
        marker.on('snap', function (e) {
            marker.setIcon(this.options.icon);
            marker.setOpacity(1);
        }, this);
        
        marker.on('unsnap', function (e) {
            marker.setIcon(icon);
            marker.setOpacity(0);
        }, this);

        marker.on('click', this._snap_on_click, this);
        
        this._map.on('mousedown', this._snap_on_click, this);
        this._map.on('touchstart', this._snap_on_click, this);
    },

    _snap_on_click: function (e) {
        if (this._errorShown) {
            return;
        }
        
        // for touch 
        if (this._markers) {
            var markerCount = this._markers.length;
            var marker = this._markers[markerCount - 1];
            
            if (marker && this._mouseMarker.snap) {
                L.DomUtil.addClass(marker._icon, 'marker-snapped');
            }
        }
        
        // for shapes
        if (this._startLatLng) {
            var closest = this._manuallyCorrectClick(this._startLatLng);
            
            if (closest.latlng) {
                this._mouseMarker.setLatLng(closest.latlng);
                this._startLatLng = closest.latlng;
            }
        }
        
        // for poly vertices
        if (this._mouseDownOrigin) {
            var z = this._map.getZoom();
            var mdOrigin = this._map.unproject(this._mouseDownOrigin, z);
            var closestMDO = this._manuallyCorrectClick(mdOrigin);
            
            if (closestMDO.latlng) {
                this._mouseMarker.setLatLng(closestMDO.latlng);
                this._mouseDownOrigin = this._map.project(closestMDO.latlng, z);
            }
    
            if (e.originalEvent) {
                var oeOrigin = this._map.unproject([e.originalEvent.clientX, e.originalEvent.clientY], z);
                var closestOE = this._manuallyCorrectClick(oeOrigin);
                
                if (closestOE.latlng) {
                    e.originalEvent = this._map.project(closestOE.latlng, z);
                }
            }
        }
    },
    
    _manuallyCorrectClick: function (originalLatLng) {
        var ex = {
            'target': this._mouseMarker,
            'latlng': originalLatLng
        };
        
        if (! this._mouseMarker) {
            return {
                'latlng': null
            };
        }

        var buffer = 0;
        if (this.hasOwnProperty('_snapper') && this._snapper.hasOwnProperty('_buffer')) {
            buffer = this._snapper._buffer;
        }
        
        return L.Snap.snapMarker(ex, this.options.guideLayers || [], this._map, this.options, buffer);
    },
    
    _snap_on_disabled: function () {
        delete this._snapper;
    },
};

L.Draw.Feature.include(L.Draw.Feature.SnapMixin);
L.Draw.Feature.addInitHook('_snap_initialize');