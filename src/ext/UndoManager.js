L.Draw.UndoManager =  L.Class.extend({
    options: {
		maxStackSize: 20, // set to -1 for infinite
		undoKey: 'ctrl+z',
		redoKey: 'ctrl+y'
    },
    
    initialize: function (map, drawnItems, options) {
        L.setOptions(this, options);
        
        this._map = map;
        this._drawnItems = drawnItems;
        
        // mode is either 'main', as the default, or 'nested', to refer to
        // vertex-drawing mode, deleting mode, or editing mode. actions during
        // nested mode are tracked seperately while the nested mode is active, 
        // but then "squashed" when mode returns to main
        this.mode = 'main';
        
        // if we're in a nested mode, we essentially keep a separate
        // stack just for that mode. thus, if we trigger an undo
        // when our nested stack is empty, we just put it back
        this.nestedUndoCount = 0;
        
        // we need to keep track of the vertices of the currently drawn
        // polygon in order to figure out what the new one is
        this.currentVertexCount = 0;
        this.currentVertexInfo = {};
        
        // the events triggered for move and resize edits are essentially
        // fired continuously while a marker is moved, so we keep track of
        // whatever the first and most-recent one so that when the editdone
        // event is triggered, we have starting and end points
        this.originalEditInfo = null;
        this.currentEditInfo = null;
        this.currentEditType = null;
        
        // we continuously sample the currently initialized edit handler
        // from each fired event and track of them here, by leaflet_id;
        // accessing them directly from .editing or .snapediting leads to
        // very strange bugs where sometimes the data in the handler appears
        // out of date. trust me here!
        this.editHandlerIndex = {};
        
        // for some actions, the handler method needed to carry out the action and inverse action is the same method that fired the event
        // so, we simply block the next fired event whenever we call those
        // methods
        this.eventBlock = 0;
        
        // some event actions need to call callbacks and then have other code run, so we use this flag to deal with it.
        this.incompleteAdd = false;
        this.incompleteRemove = false;
        
        var manager = this;
        
        var undoAction = function (e, x) {
            var actionType = (x == null) ? e.actionType : x.actionType;
            var params = (x == null) ? e.params : x.params;
            
            if (manager.mode == 'nested') {
                if (manager.nestedUndoCount == 0) {
                
                    // allow back-to-back edit sessions to "merge" into each other
                    if (actionType.indexOf('edit') > -1) {
                        manager.undoNested(actionType, params);
                    }
                    else {
                        manager.stateHandler.putbackLastUndo();
                        return;
                    }
                }
                else {
                    manager.nestedUndoCount --;
                    manager.undoNested(actionType, params);
                }
            }
            else {
                manager.undoMain(actionType, params);
            }
        };
        
        var redoAction = function (e, x) {
            var actionType = (x == null) ? e.actionType : x.actionType;
            var params = (x == null) ? e.params : x.params;
            
            if (manager.mode == 'nested') {
                manager.nestedUndoCount ++;
                manager.redoNested(actionType, params);
            }
            else {
                manager.redoMain(actionType, params);
            }
        };
        
        this.stateHandler = new L.Draw.StateHandler(this._map, undoAction, redoAction, this.options);
        
        this._enabled = false;
        this.enable();
    },
    
    enabled: function () {
        return this._enabled;
    },
    
    enable: function () {
        if (this._enabled) {
            return;
        }
        this._enabled = true;
        
        this.stateHandler.enable();
        this._map.on(L.Draw.Event.DRAWSTART, this.drawstart, this);
        this._map.on(L.Draw.Event.DRAWSTOP, this.drawstop, this);
        this._map.on(L.Draw.Event.CANCELED, this.canceled, this);
        this._map.on(L.Draw.Event.CREATED, this.created, this);
        this._map.on(L.Draw.Event.DRAWVERTEX, this.drawvertex, this);
        this._map.on(L.Draw.Event.DELETESTART, this.deletestart, this);
        this._map.on(L.Draw.Event.DELETESTOP, this.deletestop, this);
        this._map.on(L.Draw.Event.DELETED, this.deleted, this);
        this._map.on(L.Draw.Event.EDITSTART, this.editstart, this);
        this._map.on(L.Draw.Event.EDITHOOK, this.edithook, this);
        this._map.on(L.Draw.Event.EDITSTOP, this.editstop, this);
        this._map.on(L.Draw.Event.EDITDONE, this.editdone, this);
        this._map.on(L.Draw.Event.EDITVERTEX, this.editvertex, this);
        this._map.on(L.Draw.Event.EDITMOVE, this.editmove, this);
        this._map.on(L.Draw.Event.EDITRESIZE, this.editresize, this);
        this._map.on(L.Draw.Event.EDITREVERT, this.editrevert, this);
    },
    
    disable: function () {
        if (! this._enabled) {
            return;
        }
        this._enabled = false;
    
        this._map.off(L.Draw.Event.DRAWSTART, this.drawstart, this);
        this._map.off(L.Draw.Event.DRAWSTOP, this.drawstop, this);
        this._map.off(L.Draw.Event.CANCELED, this.canceled, this);
        this._map.off(L.Draw.Event.CREATED, this.created, this);
        this._map.off(L.Draw.Event.DRAWVERTEX, this.drawvertex, this);
        this._map.off(L.Draw.Event.DELETESTART, this.deletestart, this);
        this._map.off(L.Draw.Event.DELETESTOP, this.deletestop, this);
        this._map.off(L.Draw.Event.DELETED, this.deleted, this);
        this._map.off(L.Draw.Event.EDITSTART, this.editstart, this);
        this._map.off(L.Draw.Event.EDITHOOK, this.edithook, this);
        this._map.off(L.Draw.Event.EDITSTOP, this.editstop, this);
        this._map.off(L.Draw.Event.EDITDONE, this.editdone, this);
        this._map.off(L.Draw.Event.EDITVERTEX, this.editvertex, this);
        this._map.off(L.Draw.Event.EDITMOVE, this.editmove, this);
        this._map.off(L.Draw.Event.EDITRESIZE, this.editresize, this);
        this._map.off(L.Draw.Event.EDITREVERT, this.editrevert, this);
        this.stateHandler.disable();
    },
    
    reset: function () {
        this._startMainMode(false);
        this.stateHandler.clear();
    },
    
    _startNestedMode: function () {
        this.mode = 'nested';
        this.nestedUndoCount = 0;
    },
    
    _startMainMode: function (clearNested) {
        if (clearNested) {
            this.stateHandler.clearNested(this.nestedUndoCount);
        }
        
        this.mode = 'main';
        this.eventBlock = 0;
        this.nestedUndoCount = 0;
        this.currentVertexCount = 0;
        this.currentVertexInfo = {};
        this.originalEditInfo = null;
        this.currentEditInfo = null;
        this.currentEditType = null;
        this.incompleteAdd = false;
        this.incompleteRemove = false;
    },
    
    pushUndo: function (actionType, info) {
        this.stateHandler.pushUndo(actionType, info);
    },
    
    _setEditHandler: function (obj, editHandler, isVertex) {
        var key = obj._leaflet_id;
        // poly vertex handlers are tracked separately from the main poly
        // editHandler, but still keyed by the poly's _leaflet_id
        if (isVertex) {
            key = 'v' + key;
        }
        this.editHandlerIndex[key] = editHandler;
    },
    
    _getEditHandler: function (obj, isVertex) {
        var key = obj._leaflet_id;
        // poly vertex handlers are tracked separately from the main poly
        // editHandler, but still keyed by the poly's _leaflet_id
        if (isVertex) {
            key = 'v' + key;
        }
        
        return this.editHandlerIndex[key];
    },
    
    // Compatibility method to normalize Poly* objects
	// between 0.7.x and 1.0+
    // pulled from code from L.Edit.Poly in Leaflet.Draw
	_defaultShape: function (latlngs) {
		if (!L.Polyline._flat) { return latlngs; }
		return L.Polyline._flat(latlngs) ? latlngs : latlngs[0];
	},
    
    _pIntersects: function (poly) {
        if (poly.options.poly && (!poly.options.poly.allowIntersection && poly.intersects())) {
            return true;
        }
        return false;
    },
    
    /*
     *************************************
     */
    
    canceled: function (e) {
        this._startMainMode(true);
    },
    
    drawstart: function (e) {
        this._startNestedMode();
    },
    
    drawstop: function (e) {
        this._startMainMode();
    },
    
    created: function (e) {
        this._startMainMode(true);
        this.pushUndo('created', e);
    },
    
    deletestart: function (e) {
        this._startNestedMode();
    },
    
    deletestop: function (e) {
        this._startMainMode();
    },
    
    deleted: function (e) {
        this.pushUndo('deleted', e);
        this.nestedUndoCount ++;
    },
    
    drawvertex: function (e) {
        // why this is here: the methods used by Leaflet.Draw to add or delete a vertex from
        // a polygon are the same methods that fire an event. thus, the very act of undoing/redoing
        // a vertex will add false actions to the undo stack! thus, we use a state variable to prevent that from happening. 
        if (this.eventBlock > 0) {
            this.eventBlock --;
            return;
        }
            
        // if our current count is smaller, we added a vertex
        if (this.currentVertexCount < e.drawHandler._markers.length) {
            this.currentVertexCount ++;
            this.nestedUndoCount ++;
            
            // figure out what the new vertex is
            var addedPoint;
            for (var leafletId in e.layers._layers) {
                if (! this.currentVertexInfo.hasOwnProperty(leafletId)) {
                    this.currentVertexInfo[leafletId] = e.layers._layers[leafletId].getLatLng().clone();
                    addedPoint = this.currentVertexInfo[leafletId];
                }
            }
            
            this.pushUndo('drawvertex/Add', {
                'drawHandler' : e.drawHandler,
                'point' : addedPoint,
            });
        }
        
        // otherwise, the user clicked on "delete last point"
        else if (this.currentVertexCount > e.drawHandler._markers.length) {
            this.currentVertexCount --;
            this.nestedUndoCount ++;
            
            var removedPoint;
            // figure out which the missing vertex was
            for (var leafletId in e.layers._layers) {
                if (! this.currentVertexInfo.hasOwnProperty(leafletId)) {
                    removedPoint = this.currentVertexInfo[leafletId];
                    delete this.currentVertexInfo[leafletId];
                }
            }
            
            this.pushUndo('drawvertex/Remove', {
                'drawHandler' : e.drawHandler,
                'point' : removedPoint
            });
        }
    },
    
    editstart: function (e) {
        this._startNestedMode();
    },
    
    editstop: function (e) {
        this._startMainMode(false);
    },
    
    edithook: function (e) {
        if (e.hasOwnProperty('vertex')) {
            this._setEditHandler(e.layer, e.editHandler, true);
        }
        else {
            this._setEditHandler(e.layer, e.editHandler);
        }
    },
    
    editrevert: function (e) {
        this.stateHandler.discardLastPush();
        this.nestedUndoCount = Math.max(0, this.nestedUndoCount - 1);
    },
    
    editvertex: function (e) {
        console.log(e);
    
        // re-adding a marker is a two step process, begun by undoNested, and then finished here when
        // the event triggered by the manual .click() call there has fired
        if (this.incompleteAdd) {
            this.incompleteAdd = false;
            var editHandler = this._getEditHandler(this.currentEditInfo.poly, true);
        
            editHandler._originalLatLng = this.currentEditInfo.originalLatLng;
            this.currentEditInfo.marker.setLatLng(this.currentEditInfo.originalLatLng);
                
            editHandler._onMarkerDrag({'target' : this.currentEditInfo.marker});
            editHandler.updateMarkers();
            editHandler._poly.fire('edit');
            
            this.currentEditInfo = null;
            
            return;
        }
        
        else if (this.incompleteRemove) {
            this.incompleteRemove = false;
            var editHandler = this._getEditHandler(this.currentEditInfo.poly, true);
        
            editHandler.updateMarkers();
            
            this.currentEditInfo.poly.fire('edit');
            this.currentEditInfo = null;
            return;
        }
        
        if (this.eventBlock > 0) {
            this.eventBlock --;
            return;
        }
        
        this.nestedUndoCount ++;
        this._setEditHandler(e.poly, e.editHandler, true);
        
        if (e.editType == 'editvertex/Move') {
            this.pushUndo(e.editType, {
                'poly' : e.poly,
                'marker' : e.marker,
                'index': e.editInfo.index,
                'originalLatLng' : e.editInfo.originalLatLng.clone(),
                'newLatLng' : e.editInfo.newLatLng.clone(),
            });
        }
        else {
            this.pushUndo(e.editType, {
                'poly' : e.poly,
                'marker' : e.marker,
                'originalIndex' : e.editInfo.index,
                'originalLatLng' : e.editInfo.originalLatLng.clone(),
                'prevIndex' : e.editInfo.prevIndex,
                'nextIndex' : e.editInfo.nextIndex,
            });
        }
    },
    
    editdone: function (e) {
        if (this.currentEditType != null) {
            this.currentEditInfo.original = this.originalEditInfo;
            this.pushUndo(this.currentEditType, this.currentEditInfo);
            this.nestedUndoCount ++;
            this.originalEditInfo = null;
            this.currentEditInfo = null;
            this.currentEditType = null;
        }
    },
    
    editmove: function (e) {
        this._setEditHandler(e.layer, e.editHandler);
        
        if (! e.hasOwnProperty('editType')) {
            return;
        }
        
        if (this.eventBlock > 0) {
            this.eventBlock --;
            return;
        }
        
        if (this.originalEditInfo == null) {
            this.originalEditInfo = e;
        }
        
        // a marker move is different from the shapes/poly/vertices; the move event only fires at dragend,
        // not continuously during the move like for the others
        if (e.editType == 'editmarker/Move') {
            this.pushUndo(e.editType, e);
            this.nestedUndoCount ++;
            this.originalEditInfo = null;
            this.currentEditInfo = null;
            this.currentEditType = null;
        }
        else {
            this.currentEditInfo = e;
            this.currentEditType = e.editType;
        }
    },
    
    editresize: function (e) {
        if (! e.hasOwnProperty('editType')) {
            return;
        }
        
        if (this.eventBlock > 0) {
            this.eventBlock --;
            return;
        }
        
        if (this.originalEditInfo == null) {
            this.originalEditInfo = e;
        }
        
        this._setEditHandler(e.layer, e.editHandler);
        this.currentEditInfo = e;
        this.currentEditType = e.editType;
    },
    
    /*
     *************************************
     */
    
    // we have to do the edits differently in main mode than nested mode, because, for
    // example, shapes are drawn with dotted lines and have ghost markers in edit mode
    // but are solid with no markers in main mode. luckily, main mode is simpler than
    // nested mode.
    undoMain: function (type, params) {
        if (type == 'created') {
            this._drawnItems.removeLayer(params.layer);
        }
        
        else if (type == 'deleted') {
            this._drawnItems.addLayer(params.layer);
        }
        
        else if (type == 'editvertex/Move') {
            var latlngs = this._defaultShape(params.poly.getLatLngs());
            latlngs[params.index] = params.originalLatLng;
            params.poly._convertLatLngs(latlngs, true);
            params.poly.redraw();
        }
        
        else if (type == 'editvertex/Add') {
            var latlngs = this._defaultShape(params.poly.getLatLngs());
            latlngs.splice(params.originalIndex, 1);
            params.poly._convertLatLngs(latlngs, true);
            params.poly.fire('edit');
        }
        
        else if (type == 'editvertex/Remove') {
            var latlngs = this._defaultShape(params.poly.getLatLngs());
            latlngs.splice(params.originalIndex, 0, params.originalLatLng);
            params.poly._convertLatLngs(latlngs, true);
            params.poly.redraw();
        }
        
        else if (type == 'editmarker/Move') {
            params.layer.setLatLng(params.originalLatLng);
        }
        
        else if (type == 'editrect/Move') {
            params.layer.setLatLngs(params.original.originalLatLngs);
        }
        
        else if (type == 'editcircle/Move') {
            params.layer.setLatLng(params.original.originalCenter);
        }
        
        else if (type == 'editrect/Resize') {
            params.layer.setBounds(params.original.originalBounds);
        }
        
        else if (type == 'editcircle/Resize') {
            params.layer.setRadius(params.original.originalRadius);
        }
        
        else if (type == 'editpoly/Move') {
            var latlngs = this._defaultShape(params.layer.getLatLngs());
            for (var i = 0; i < latlngs.length; ++i) {
                latlngs[i].lat -= params.latMove;
                latlngs[i].lng -= params.lngMove;
            }
            this._poly.redraw();
        }
    },
    
    redoMain: function (type, params) {
        if (type == 'created') {
            this._drawnItems.addLayer(params.layer);
        }
        
        else if (type == 'deleted') {
            this._drawnItems.removeLayer(params.layer);
        }
        
        else if (type == 'editvertex/Move') {
            var latlngs = this._defaultShape(params.poly.getLatLngs());
            latlngs[params.index] = params.newLatLng;
            params.poly._convertLatLngs(latlngs, true);
            params.poly.redraw();
        }
        
        else if (type == 'editvertex/Add') {
            var latlngs = this._defaultShape(params.poly.getLatLngs());
            latlngs.splice(params.originalIndex, 0, params.originalLatLng);
            params.poly._convertLatLngs(latlngs, true);
            params.poly.redraw();
            params.poly.fire('edit');
        }
        
        else if (type == 'editvertex/Remove') {
            var latlngs = this._defaultShape(params.poly.getLatLngs());
            latlngs.splice(params.originalIndex, 1);
            params.poly._convertLatLngs(latlngs, true);
            params.poly.fire('edit');
        }
        
        else if (type == 'editmarker/Move') {
            params.layer.setLatLng(params.newLatLng);
        }
        
        else if (type == 'editrect/Move') {
            params.layer.setLatLngs(params.newLatLngs);
        }
        
        else if (type == 'editcircle/Move') {
            params.layer.setLatLng(params.newCenter);
        }
        
        else if (type == 'editrect/Resize') {
            params.layer.setBounds(params.newBounds);
        }
        
        else if (type == 'editcircle/Resize') {
            params.layer.setRadius(params.newRadius);
        }
        
        else if (type == 'editpoly/Move') {
            var latlngs = this._defaultShape(params.layer.getLatLngs());
            for (var i = 0; i < latlngs.length; ++i) {
                latlngs[i].lat += params.latMove;
                latlngs[i].lng += params.lngMove;
            }
            this._poly.redraw();
        }
    },
    
    undoNested : function (type, params) {
        if (type == 'drawvertex/Add') {
            this.eventBlock ++;
            params.drawHandler.deleteLastVertex();
        }
        
        else if (type == 'drawvertex/Remove') {
            this.eventBlock ++;
            params.drawHandler._mouseDownOrigin = null;
            params.drawHandler.addVertex(params.point);
        }
        
        else if (type == 'editvertex/Move') {
            var editHandler = this._getEditHandler(params.poly, true);
            var marker = editHandler._markers[params.index];
            
            marker.setLatLng(params.originalLatLng);
            editHandler._onMarkerDrag({'target' : marker});
            
            params.poly.redraw();
            params.poly.fire('edit');
        }
        
        else if (type == 'editvertex/Remove') {
            this._addVertex(params);
        }
        
        else if (type == 'editvertex/Add') {
            this._removeVertex(params);
        }
        
        else if (type == 'editmarker/Move') {
            params.layer.setLatLng(params.originalLatLng);
        }
        
        else if (type == 'editpoly/Move') {
            this.eventBlock ++;
            var editHandler = this._getEditHandler(params.layer);
            editHandler._move(params.original.originalLatLng);
        }
        
        else if (type == 'editrect/Move') {
            this.eventBlock ++;
            var editHandler = this._getEditHandler(params.layer);
            editHandler._move(params.original.originalCenter);
        }
        
        else if (type == 'editcircle/Move') {
            this.eventBlock ++;
            var editHandler = this._getEditHandler(params.layer);
            editHandler._move(params.original.originalCenter); 
        }
        
        else if (type == 'editrect/Resize') {
            this._resizeEditRect(params.layer, params.original.originalBounds);
        }
        
        else if (type == 'editcircle/Resize') {
            this._resizeEditCircle(params.layer, params.original.originalRadius);
        }
    },
    
    redoNested: function(type, params) {
        if (type == 'drawvertex/Add') {
            this.eventBlock ++;
            params.drawHandler._mouseDownOrigin = null;
            params.drawHandler.addVertex(params.point);
        }
        
        else if (type == 'drawvertex/Remove') {
            this.eventBlock ++;
            params.drawHandler.deleteLastVertex();
        }
        
        else if (type == 'editvertex/Move') {
            var editHandler = this._getEditHandler(params.poly, true);
            var marker = editHandler._markers[params.index];
            
            marker.setLatLng(params.newLatLng);
            editHandler._onMarkerDrag({'target' : marker});
        }
        
        else if (type == 'editvertex/Remove') {
            this._removeVertex(params);
        }
        
        else if (type == 'editvertex/Add') {
            this._addVertex(params);
        }
        
        else if (type == 'editpoly/Move') {
            this.eventBlock ++;
            var editHandler = this._getEditHandler(params.poly);
            editHandler._move(params.newLatLng);
        }
        
        else if (type == 'editmarker/Move') {
            params.layer.setLatLng(params.newLatLng);
        }
        
        else if (type == 'editrect/Move') {
            this.eventBlock ++;
            var editHandler = this._getEditHandler(params.layer);
            editHandler._move(params.newCenter);
        }
        
        else if (type == 'editcircle/Move') {
            this.eventBlock ++;
            var editHandler = this._getEditHandler(params.layer);
            editHandler._move(params.newCenter); 
        }
        
        else if (type == 'editrect/Resize') {
            this._resizeRect(params.layer, params.newBounds);
        }
        
        else if (type == 'editcircle/Resize') {
            this._resizeCircle(params.layer, params.newRadius);
        }
    },
    
    /*
     *************************************
     */
    
    _removeVertex: function (params) {
        this.incompleteRemove = true;
        var editHandler = this._getEditHandler(params.poly, true);
        
        var nextIndex = params.nextIndex;
        if (nextIndex == editHandler._markers.length) {
            nextIndex = 0;
        }
        
        this.currentEditInfo = params;
        params.marker.fire('click');
    },
    
    _addVertex: function (params) {
        this.incompleteAdd = true;
        
        var editHandler = this._getEditHandler(params.poly, true);
        
        var nextIndex = params.nextIndex;
        if (nextIndex == editHandler._markers.length) {
            nextIndex = 0;
        }
        
        var prev = editHandler._markers[params.prevIndex];
        var next = editHandler._markers[nextIndex];
        
        if (prev._middleRight) {
            editHandler._markerGroup.removeLayer(prev._middleRight);
        }
        
        if (next._middleLeft) {
            editHandler._markerGroup.removeLayer(next._middleLeft);
        }
        
        params.marker = editHandler._createMiddleMarker(prev, next, params.originalLatLng, params.originalIndex);
        
        this.currentEditInfo = params;
        params.marker.fire('click');
    },
    
    _resizeEditCircle: function (radius, layer) {
        var editHandler = this._getEditHandler(layer);
        layer.setRadius(radius);
        var resizeMarkerPoint = editHandler._getResizeMarkerPoint(layer.getLatLng())
        editHandler._resizeMarkers[0].setLatLng(resizeMarkerPoint);
    },
    
    _resizeEditRect: function (layer, bounds) {
        var editHandler = this._getEditHandler(layer);
        layer.setBounds(newBounds);
        editHandler._moveMarker.setLatLng(newBounds.getCenter());
        editHandler._repositionCornerMarkers();
    },
    
});