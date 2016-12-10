(function () {

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
    },

    unwatchMarker: function (marker) {
        marker.off('move', this._snapMarker, this);
        delete marker['snap'];
    },

    addGuideLayer: function (layer) {
        for (var i=0, n=this._guides.length; i<n; i++)
            if (L.stamp(layer) === L.stamp(this._guides[i]))
                return;
        this._guides.push(layer);
    },

    _snapMarker: function(e) {
        var marker = e.target,
            latlng = marker.getLatLng(),
            snaplist = [];
            
        if (! latlng) {
            return;
        }

        function isDifferentLayer(layer) {
            if (layer.getLatLng) {
                return L.stamp(marker) !== L.stamp(layer);
            } else {
                if (layer.editing && layer.editing._enabled) {
                    if (layer.editing._verticesHandlers) {
                        var points = layer.editing._verticesHandlers[0]._markerGroup.getLayers();
                        for(var i = 0, n = points.length; i < n; i++) {
                            if (L.stamp(points[i]) === L.stamp(marker)) { return false; }
                        }
                    }
                }
            }

            return true;
        }

        function processGuide(guide) {
            if ((guide._layers !== undefined) &&
                (typeof guide.searchBuffer !== 'function')) {
                // Guide is a layer group and has no L.LayerIndexMixin (from Leaflet.LayerIndex)
                for (var id in guide._layers) {
                    processGuide(guide._layers[id]);
                }
            }
            else if (typeof guide.searchBuffer === 'function') {
                // Search snaplist around mouse
                var nearlayers = guide.searchBuffer(latlng, this._buffer);
                snaplist = snaplist.concat(nearlayers.filter(function(layer) {
                    return isDifferentLayer(layer);
                }));
            }
            // Make sure the marker doesn't snap to itself or the associated polyline layer
            else if (isDifferentLayer(guide)) {
                snaplist.push(guide);
            }
        }

        for (var i=0, n = this._guides.length; i < n; i++) {
            var guide = this._guides[i];
            
            // don't snap to vertices of a poly object for poly move
            if (marker.hasOwnProperty('_owner') && (guide._leaflet_id == marker._owner)) {
                continue;
            }
            
            processGuide.call(this, guide);
        }

        var closest = this._findClosestLayerSnap(this._map,
                                                 snaplist,
                                                 latlng,
                                                 this.options.snapDistance,
                                                 this.options.snapVertices);

        closest = closest || {layer: null, latlng: null};
        this._updateSnap(marker, closest.layer, closest.latlng);
    },

    _findClosestLayerSnap: function (map, layers, latlng, tolerance, withVertices) {
        var closest = L.GeometryUtil.nClosestLayers(map, layers, latlng, 6);
        
        // code to correct prefer snap to shapes (and their vertices, if withVertices is true) to gridlines and guidelines, and then guidelines to gridlines
        var withinTolerance = [];
        var shapesWithinTolerance = [];
        var guidesWithinTolerance = [];
        for (var c in closest) {
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
        
        if (withinTolerance.length == 0) {
            return null
        }
        
        var returnLayer = withinTolerance[0].layer;
        var returnLatLng = withinTolerance[0].latlng;
        
        if (shapesWithinTolerance.length > 0) {
            var shapeInfo = shapesWithinTolerance[0];
            returnLayer = shapeInfo.layer;
            returnLatLng = shapeInfo.latlng;
            
            // this is code from L.GeometryUtil.closestSnap that will find
            // the closest vertex of this layer to the point
            if (withVertices && (typeof shapeInfo.layer.getLatLngs == 'function')) {
                vertexLatLng = L.GeometryUtil.closest(map, shapeInfo.layer, shapeInfo.latlng, true);
                
                if (L.GeometryUtil.distance(map, returnLatLng, vertexLatLng) < 2*tolerance) {
                    returnLatLng = vertexLatLng;
                }
            }
        }
        
        // if there's no shapes but there's a guide, we won't be intersecting with another guide. we'll either intersect with a gridline or not at all
        else if (guidesWithinTolerance.length > 0) {
            var guideInfo = guidesWithinTolerance[0];
            var guideType = guideInfo.layer._guidelineGroup;
            
            for (var i=0; i<withinTolerance.length; i++) {
                if (withinTolerance[i].layer._gridlineGroup != guideType) {
                    var intInfo = this._findGuideIntersection('guide', map, latlng, [guideInfo, withinTolerance[i]]);
                    if (intInfo.distance < tolerance) {
                        returnLatLng = intInfo.intersection;
                        break;
                    }
                }
            }
            
        }
        
        else {
            if (withinTolerance.length == 2) {
                var intInfo = this._findGuideIntersection('grid', map, latlng, withinTolerance);
                if (intInfo.distance < tolerance) {
                    returnLatLng = intInfo.intersection;
                }
            }
        }
        
        return {
            'layer' : returnLayer,
            'latlng': returnLatLng
        }

        //return L.GeometryUtil.closestLayerSnap(map, layers, latlng, tolerance, withVertices);
    },
    
    // try to prefer the corner of guidelines, or the the intersection of gridlines, if we're within the tolerance of two
    _findGuideIntersection: function (gType, map, latlng, guides) {
        var nsi = (guides[0].layer['_' + gType + 'lineGroup'] == 'NS') ? 1 : 0;
        var wei = (guides[0].layer['_' + gType + 'lineGroup'] == 'NS') ? 0 : 1;
        var ns = guides[nsi].latlng;
        var we = guides[wei].latlng;
        var intersection = new L.LatLng(ns.lat, we.lng);
        var distance = L.GeometryUtil.distance(map, intersection, latlng);
        return {'intersection' : intersection, 'distance' : distance}
    },

    _updateSnap: function (marker, layer, latlng) {
        if (layer && latlng) {
            marker._latlng = L.latLng(latlng);
            marker.update();
            if (marker.snap != layer) {
                marker.snap = layer;
                if (marker._icon) L.DomUtil.addClass(marker._icon, 'marker-snapped');
                marker.fire('snap', {layer:layer, latlng: latlng});
            }
        }
        else {
            if (marker.snap) {
                if (marker._icon) L.DomUtil.removeClass(marker._icon, 'marker-snapped');
                marker.fire('unsnap', {layer:marker.snap});
            }
            delete marker['snap'];
        }
    }
});


if (!L.Edit) {
    // Leaflet.Draw not available.
    return;
}


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
        var isMiddle = index === undefined;
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
            return L.stamp(layer) === L.stamp(guideLayer);
        });

        if (index === -1) {
            this._guideLayers.push(layer);
            this._featureGroup.eachLayer(function(layer) {
                if (layer.snapediting) { layer.snapediting._guides.push(layer); }
            });
        }
    },

    removeGuideLayer: function(layer) {
      var index = this._guideLayers.findIndex(function(guideLayer) {
          return L.stamp(layer) === L.stamp(guideLayer);
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

L.Draw.Feature.SnapMixin = {
    _snap_initialize: function () {
        this.on('enabled', this._snap_on_enabled, this);
        this.on('disabled', this._snap_on_disabled, this);
    },

    _snap_on_enabled: function () {
        if (!this.options.guideLayers) {
            return;
        }

        if (!this._mouseMarker) {
            this._map.on('layeradd', this._snap_on_enabled, this);
            return;
        }else{
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
              }, this)
              .on('unsnap', function (e) {
                  marker.setIcon(icon);
                  marker.setOpacity(0);
              }, this);

        marker.on('click', this._snap_on_click, this);
    },

    _snap_on_click: function (e) {
        if (this._errorShown) {
            return;
        }
    
        if (this._markers) {
            var markerCount = this._markers.length,
                marker = this._markers[markerCount - 1];
            if (this._mouseMarker.snap) {
                if(e){
                  // update the feature being drawn to reflect the snapped location:
                  marker.setLatLng(e.target._latlng);
                  if (this._poly){
                    var polyPointsCount = this._poly._latlngs.length;
                    this._poly._latlngs[polyPointsCount - 1] = e.target._latlng;
                    this._poly.redraw();
                  }
                }

                L.DomUtil.addClass(marker._icon, 'marker-snapped');
            }
        }
    },
    
    _snap_on_disabled: function () {
        delete this._snapper;
    },
};

L.Draw.Feature.include(L.Draw.Feature.SnapMixin);
L.Draw.Feature.addInitHook('_snap_initialize');

// next, we set up a tracker for L.Draw's mouse marker

// essentially, this will hook us into the current shape being drawn so that we
// can access map._currentLDrawMarker._snapper immediately after this, when the draw:drawstart event
// gets called, which is where we draw the guidelines. this needs to be defined before the draw control
// gets created. A LITTLE BIT CONVOLUTED.

L.Map.include({
    _numGridEnabled: 0,
    _currentLDrawMarker: null
});

// these properties track gridlines; gridlineGroup tracks whether a line is NS/WE,
// while gridlineOwner tracks which individual gridline belongs to which layergroup
L.LayerGroup.include({
    _gridlineGroup: '',
    _guidelineGroup: '',
    _gridlineOwner: 0
});

L.Layer.include({
    _gridlineGroup: '',
});

L.Draw.Feature.GuidelineMixin = {
    _guide_initialize: function () {
        this.on('enabled', function () {
            map._currentLDrawMarker = this;
        }, this);
    },
};

L.Draw.Feature.include(L.Draw.Feature.GuidelineMixin);
L.Draw.Feature.addInitHook('_guide_initialize');

L.Snap = L.Snap || {};
L.Snap.Guidelines = L.Class.extend({
    defaultOptions : {
        '_enabled' : true,
        'guideStyle' : {
            'weight' : 2,
            'color' : 'black',
            'dashArray' : '15, 10, 5',
            'opacity' : 0.2
        },
    },
    
    initialize : function (map, snapGuideLayers, passedOptions) {
        this._map = map;
        this.snapGuideLayers = snapGuideLayers;
        this.realGuideLayerCount = 0;
        map._currentLDrawMarker = null;
        
        if (! passedOptions.hasOwnProperty('_enabled')) {
            this._enabled = true;
        }
        else {
            this._enabled = passedOptions._enabled;
        }
        
        this.guideStyle = {};
        for (var o in this.defaultOptions.guideStyle) {
            this.guideStyle[o] = this.defaultOptions.guideStyle[o]; 
        }
        
        if (passedOptions.hasOwnProperty('guideStyle')) {
            for (var o in passedOptions.guideStyle) {
                var v = passedOptions.guideStyle[o];
                this.guideStyle[o] = v;
            }
        }
        
        // if grid is enabled, then we need to account for the NS and WE grid layergroups
        // late night TODO: move to call just before use
        
        // !!!!!!!!!!!!!!!!!!!!!!!!
        // L.Snap.Gridlines does not make any assumptions about where the Gridlines are in the guideLayer list, but L.Snap.Guidelines does - is this a problem?!?
        // take a look at grid and guide disable/removal!!!
        
        
        if (! map.options.maxBounds) {
            return;
        }
        
        if (this._enabled) {
            this._enable();
        }
    },
    
    enabled: function () {
        return this._enabled;
    },
    
    enable: function () {
        if (this._enabled) {
            return;
        }
        
        this._enable();
    },
        
    _enable: function () {
        this._enabled = true;
        this.addHooks();
        this._map.fire('guidelines:enabled', {});
    },
    
    disable: function () {
        if (!this._enabled) {
            return;
        }
        
        this._enabled = false;
        this.removeHooks();
        this._map.fire('guidelines:disabled', {});
    },

    addHooks : function (e) {
        var map = this._map;
        
        if (map) {
            // add guidelayers for each existing shape when we start drawing
            map.on('draw:drawstart', this.drawGuideLayers, this);
            
            // remove guides when drawing or editing has been completed or canceled
            map.on('draw:drawstop', this.clearGuides, this);
            map.on('draw:canceled', this.clearGuides, this);
            map.on('draw:editstop', this.clearGuides, this);

            // add the new layer to items to the snap collection
            map.on('draw:created', this.addGuideLayer, this);

            // remove the deleted item(s) from the snap collection
            map.on('draw:deleted', this.deleteGuideLayers, this);
        }
    },
    
    removeHooks: function (e) {
        var map = this._map;
        var guideLayers = this.snapGuideLayers;
        
        if (map) {
            var toRemove = {};
            
            var startingCount = 2*map._numGridEnabled;
            for (var i=startingCount; i<this.realGuideLayerCount+startingCount; i++) {
                if (guideLayers[i].hasOwnProperty('_guidelineGroup')) {
                    toRemove[i] = true;
                }
            }
            
            for (var i in toRemove) {
                guideLayers.splice(i, 1);
            }
        }
    },
    
    drawGuideLayers : function(e) {
        if (!this._enabled) {
            return;
        }
    
        var map = this._map;
        var guideLayers = this.snapGuideLayers;

        var processGuideLayers = function (N) {
            for (var d=1; d<=N; d++) {
                map._currentLDrawMarker._snapper.addGuideLayer(guideLayers[guideLayers.length-d]);
                guideLayers[guideLayers.length-d].addTo(map);
                guideLayers[guideLayers.length-d]._guidelineGroup = (d%2) ? 'WE' : 'NS';
            }
        };
        
        // we only draw guides for when the user wants to draw a rectangle or circle; it wouldn't make sense for polygons
        var layerType = e.layerType;
        if ((layerType == 'rectangle') || (layerType == 'circle')) {
            var guideWest = map.options.maxBounds.getWest();
            var guideEast = map.options.maxBounds.getEast();
            var guideNorth = map.options.maxBounds.getNorth();
            var guideSouth = map.options.maxBounds.getSouth();
            
            var startingCount = 2*map._numGridEnabled;
            for (var i=startingCount; i<this.realGuideLayerCount+startingCount; i++) {
                var shape = guideLayers[i];
                
                // in addition, we only draw guidelines for rectangles and circles
                if ((shape instanceof L.Rectangle) || (shape instanceof L.Circle)) {
                    var b = shape.getBounds();
                    guideLayers.push(
                        new L.Polyline([[b.getNorth(), guideWest], [b.getNorth(), guideEast]], this.guideStyle),
                        new L.Polyline([[guideNorth, b.getWest()], [guideSouth, b.getWest()]], this.guideStyle),
                        new L.Polyline([[b.getSouth(), guideWest], [b.getSouth(), guideEast]], this.guideStyle),
                        new L.Polyline([[guideNorth, b.getEast()], [guideSouth, b.getEast()]], this.guideStyle)
                    );
                    processGuideLayers(4);
                    
                    if (shape instanceof L.Circle) {
                        var c = b.getCenter();
                        guideLayers.push(
                            new L.Polyline([[c.lat, guideWest], [c.lat, guideEast]], this.guideStyle),
                            new L.Polyline([[guideNorth, c.lng], [guideSouth, c.lng]], this.guideStyle)
                        );
                        processGuideLayers(2);
                        
                    }
                }
            }
        }
    }, 
    
    addGuideLayer : function(e) {
        var layer = e.layer;
        
        // can't use push here, because draw:drawstop is actually fired after draw:created
        var startingCount = 2*map._numGridEnabled;
        this.snapGuideLayers.splice(this.realGuideLayerCount+startingCount, 0, layer);
        this.realGuideLayerCount ++;
    },
    
    clearGuides : function(e) {
        if (!this._enabled) {
            return;
        }
        
        var layerType = e.layerType;
        
        if ((layerType == 'rectangle') || (layerType == 'circle')) {
            var startingCount = 2*map._numGridEnabled;
            var toDelete = this.snapGuideLayers.length - this.realGuideLayerCount - startingCount;
            
            for (var i=0; i<toDelete; i++) {
                this.snapGuideLayers[this.realGuideLayerCount+startingCount+i].removeFrom(map);
            }
            this.snapGuideLayers.splice(startingCount+this.realGuideLayerCount, toDelete);
        }
    },
    
    deleteGuideLayers : function (e) {
        if (!this._enabled) {
            return;
        }
        
        var layers = e.layers;
        
        var layerIndex = {};
        layers.eachLayer(function(layer) {
            layerIndex[layer._leaflet_id] = 1;
        });
        
        var layersToRemove = [];
        var startingCount = 2*map._numGridEnabled;
        for (var i=startingCount; i<this.snapGuideLayers.length; i++) {
            if (layerIndex.hasOwnProperty(this.snapGuideLayers[i]._leaflet_id)) {
                layersToRemove.unshift(i);
            }
        }
        
        for (j in layersToRemove) {
            var index = layersToRemove[j];
            this.snapGuideLayers.splice(index, 1);
            this.realGuideLayerCount --;
        }
    }
});

L.Snap = L.Snap || {};
L.Snap.Gridlines =  L.Class.extend({
    defaultOptions: {
        // we can define numGridlinesLat/numGridlinesLng (or just numGridlines)
        // OR we can define gridSpacing, but not both.
        // numGridlinesLat/numGridlinesLng is the default
        //
        // for spacing and offset, we can define them in terms of pixels (at maxZoom), or lat/lng
        // LatOffset/LngOffset = 0 is the default.
    
        'numGridlines' : null,
        'numGridlinesLat' : 10, 
        'numGridlinesLng' : 10,
        
        'gridSpacingLat' : null,
        'gridSpacingLng' : null,
        'pixelSpacingX' : null,
        'pixelSpacingY' : null,
        
        'LatOffset' : 0,
        'LngOffset' : 0,
        'pixelOffsetX' : 0,
        'pixelOffsetY' : 0,
        
        'gridStyle' : {
            'weight' : 1,
            'color' : 'black',
            'opacity' : 0.1
        },
        '_enabled' : true,
        '_snapEnabled' : true,
        '_shown' : true,
        'delayDimensionCalculation' : false
    },

    initialize: function(map, snapGuideLayers, options) {
        this._map = map;
        this.snapGuideLayers = snapGuideLayers;
        
        this.isDrawn = false;
        this._enabled = false;
        this._shown = true;
        this._snapAdded = false;
        this.passedOptions = options || this.defaultOptions;
        
        L.stamp(this);
        
        if (!this.passedOptions.hasOwnProperty('_enabled')) {
            this._enabled = true;
        }
        else {
            this._enabled = this.passedOptions._enabled;
        }
        
        if (!this.passedOptions.hasOwnProperty('_snapEnabled')) {
            this._snapEnabled = true;
        }
        else {
            this._snapEnabled = this.passedOptions._snapEnabled;
        }
        
        if (this._enabled) {
            this._enable();
        }
    }, 
    
    enabled: function () {
        return this._enabled;
    },
    
    enable: function () {
        if (this._enabled) {
            return;
        }
        
        this._enable()
    },
    
    _enable: function () {
        this.addHooks();
        
        if (this.passedOptions.hasOwnProperty('_shown') && (!this.passedOptions._shown)) {
            this.hide();
        }
        
        this._enabled = true;
        this.calcDimensions(this.passedOptions);
        this.drawGrid();
    },
    
    disable: function () {
        if (!this._enabled) {
            return;
        }

        this.clearGrid();
        this.disableSnap();
        this.removeGrid();
        this._enabled = false;
        
        L.Handler.prototype.disable.call(this);
    },
    
    addHooks: function () {
        if (this._map) {
            this.gridlinesNS = L.layerGroup().addTo(map);
            this.gridlinesNS._gridlineGroup = 'NS';
            this.gridlinesNS._gridlineOwner = this._leaflet_id;
            this.gridlinesWE = L.layerGroup().addTo(map);
            this.gridlinesWE._gridlineGroup = 'WE';
            this.gridlinesWE._gridlineOwner = this._leaflet_id;
            this._map._numGridEnabled ++;
            
            if (this._snapEnabled) {
                this.enableSnap();
            }
        }
    },
    
    removeGrid: function() {
        this._map.removeLayer(this.gridlinesNS);
        this._map.removeLayer(this.gridlinesWE);
        this._map._numGridEnabled --;
    },
    
    enableSnap: function () {
        this._snapEnabled = true;
        if (this._snapAdded == false) {
            this.snapGuideLayers.unshift(this.gridlinesNS, this.gridlinesWE);
            this._snapAdded = true;
        }
    },
    
    disableSnap: function () {
        if (this._map) {
            // figure out where our gridlines are in the snap list, and then remove them
            var toRemove = [];
            for (var i=0; i<this.snapGuideLayers.length; i++) {
                if (this.snapGuideLayers[i]._leaflet_id == this.gridlinesNS._leaflet_id) {
                    toRemove.push(i);
                }
                if (this.snapGuideLayers[i]._leaflet_id == this.gridlinesWE._leaflet_id) {
                    toRemove.push(i);
                }
            }
            
            // remove in reverse order, so that the indices will be correct
            toRemove.sort();
            this.snapGuideLayers.splice(toRemove[1], 1);
            this.snapGuideLayers.splice(toRemove[0], 1);
            this._snapAdded = false;
            this._snapEnabled = false;
        }
    },
    
    calcDimensions: function(options) {
        var defaultOptions = this.defaultOptions;
        
        // lmfao, this is completely absurd but I'm so tired of hunting down bugs that turn
        // out to be because i passed in 'numGridLines' instead of 'numGridlines' !!!
        // reminder to take it out later...
        for (var key in options) {
            if (key.indexOf('Line') > 0) {
                var newKey = key.replace('line', 'Line');
                options[newKey] = options[key];
            }
        }
        
        // option checking
        //     1. we can either specify number of gridlines, or spacing, but not both
        //     2. if we specify spacing, we can do it in lat/lng or in pixel x/y, but not both
        //     3. we must have a maxBounds set, either on the map or in the options
        
        var usesNum = (options.hasOwnProperty('numGridlines') && (options.numGridlines != null))
                   || (options.hasOwnProperty('numGridlinesLat') && (options.numGridlinesLat != null))
                   || (options.hasOwnProperty('numGridlinesLng') && (options.numGridlinesLat != null));
        var usesLatLngSpacing = (options.hasOwnProperty('gridSpacingLat') && (options.gridSpacingLat != null)) 
                             || (options.hasOwnProperty('gridSpacingLng') && (options.gridSpacingLng != null));
        var usesPixelSpacing = (options.hasOwnProperty('pixelSpacingX') && (options.pixelSpacingX != null)) 
                             || (options.hasOwnProperty('pixelSpacingY') && (options.pixelSpacingY != null)) 
        var usesSpacing = usesLatLngSpacing || usesPixelSpacing;
        
        if (usesNum && usesSpacing) {
            this._enabled = false;
            throw 'ERROR calculating grid dimensions: cannot specify grid dimensions in terms of both number of gridlines in a dimensions as well as spacing between gridlines - use one or the other.';
        }
        
        if (usesLatLngSpacing && usesPixelSpacing) {
            this._enabled = false;
            throw 'ERROR calculating grid dimensions: cannot specify grid spacing in terms of both lat/lng and pixel - use one or the other. Returning without drawing.';
        }
        
        if (!(usesNum || usesSpacing)) {
            usesNum = true;
            options.numGridlinesLat = defaultOptions.numGridlinesLat;
            options.numGridlinesLng = defaultOptions.numGridlinesLng;
        }
        
        if (options.hasOwnProperty('maxBounds')) {
            this.maxBounds = options.maxBounds;
        }
        else {
            this.maxBounds = map.options.maxBounds;
        }
        
        if (! this.maxBounds) {
            this._enabled = false;
            throw 'ERROR calculating grid dimensions: cannot specify grid spacing without a max bounds - set one on the map, or pass an L.LatLngBounds object for maxBounds in the options.';
        }
        
        // edges of the grid. we always go to maxBounds even if there's an offset; the offset just determines the spacing from the left/top edges
    
        this.gridGuideWest = this.maxBounds.getWest();
        this.gridGuideEast = this.maxBounds.getEast();
        this.gridGuideNorth = this.maxBounds.getNorth();
        this.gridGuideSouth = this.maxBounds.getSouth();
        var maxZoom = map.getMaxZoom();
        
        ///////////////////////////
        // offset
        
        var latOffset = options.latOffset || 0;
        var lngOffset = options.lngOffset || 0;
        var pixelOffsetX = options.pixelOffsetX || 0;
        var pixelOffsetY = options.pixelOffsetY || 0;
        
        var projectedOffset = map.project([lngOffset, latOffset], maxZoom);
        this.pixelOffsetX = projectedOffset.x + pixelOffsetX;
        this.pixelOffsetY = projectedOffset.y + pixelOffsetY;
        
        var nwCorner = map.project([this.gridGuideWest, this.gridGuideNorth], maxZoom);
        var seCorner = map.project([this.gridGuideEast, this.gridGuideSouth], maxZoom);
        
        var pixelDrawWidth = nwCorner.x - seCorner.x;
        var pixelDrawHeight = nwCorner.x - seCorner.y;
        
        if (usesNum) {
            if (options.numGridlines) {
                this.numGridlinesLat = options.numGridlines;
                this.numGridlinesLng = options.numGridlines;
            }
            else {
                this.numGridlinesLat = options.numGridlinesLat;
                this.numGridlinesLng = options.numGridlinesLng;
            }
            
            this.pixelSpacingX = Math.floor(pixelDrawWidth/this.numGridlinesLat);
            this.pixelSpacingY = Math.floor(pixelDrawHeight/this.numGridlinesLng);
        }
        
        else if (usesSpacing) {
            if (usesLatLngSpacing) {
                var projectedSpacing = map.project([options.gridSpacingLat, options.gridSpacingLng], maxZoom);
                
                this.pixelSpacingX = Math.abs(projectedSpacing.x);
                this.pixelSpacingY = Math.abs(projectedSpacing.y);
            }
            else {
                this.pixelSpacingX = options.pixelSpacingX;
                this.pixelSpacingY = options.pixelSpacingY;
            }
            
            this.numGridlinesLat = Math.floor(pixelDrawWidth/this.pixelSpacingX);
            this.numGridlinesLng = Math.floor(pixelDrawHeight/this.pixelSpacingY);
        }
        
        this.gridStyle = {}
        for (var o in defaultOptions.gridStyle) {
            this.gridStyle[o] = defaultOptions.gridStyle[o]; 
        }
        
        if (options.hasOwnProperty('gridStyle')) {
            for (var o in options.gridStyle) {
                var v = options.gridStyle[o];
                this.gridStyle[o] = v;
            }
        }
        
        this.dimensionsSet = true;
    },
    
    drawGrid: function() {
        var map = this._map;
        
        if (! map.options.maxBounds) {
            return;
        }
        
        if (this.isDrawn) {
            this.clearGrid();
        }
        
        for (var i=0; i<this.numGridlinesLat; i++) {
            var ll = map.unproject([0, -i*this.pixelSpacingX + this.pixelOffsetX], map.getMaxZoom());
            
            var gridlineNS = new L.Polyline([[this.gridGuideNorth, ll.lat], [this.gridGuideSouth, ll.lat]], this.gridStyle);
            gridlineNS._gridlineGroup = 'NS';
            this.gridlinesNS.addLayer(gridlineNS);
        }
        
        for (var i=0; i<this.numGridlinesLng; i++) {
            var ll = map.unproject([-i*this.pixelSpacingY + this.pixelOffsetY, 0], map.getMaxZoom());
            
            var gridlineWE = new L.Polyline([[ll.lng, this.gridGuideWest], [ll.lng, this.gridGuideEast]], this.gridStyle);
            gridlineWE._gridlineGroup = 'WE';
            this.gridlinesWE.addLayer(gridlineWE);
        }
        
        this.isDrawn = true;
    },
    
    adjustGrid : function(options) {
        this.passedOptions = options || {};
        this.calcDimensions(this.passedOptions);
        this.drawGrid();
    },
    
    clearGrid : function() {
        this.gridlinesNS.clearLayers();
        this.gridlinesWE.clearLayers();
        this.isDrawn = false;
    },
    
    show : function () {
        if (this._shown) {
            return;
        }
    
        this._map.addLayer(this.gridlinesNS);
        this._map.addLayer(this.gridlinesWE);
        if (this._snapEnabled) {
            this.enableSnap();
        }
        this._shown = true;
    },
    
    hide : function () {
        if (!this._shown) {
            return;
        }
        
        // we call this.disableSnap for convenience here, but calling hide shouldn't
        // keep snap disabled if show is called afterwards if it wasn't disabled originally
        var sn = this._snapEnabled;
        this.disableSnap();
        this._snapEnabled = sn;
        
        this.removeGrid();
        this._shown = false;
    },
});

})();