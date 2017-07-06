/**
 * ### Events
 * Once you have successfully added the Leaflet.draw plugin to your map you will want to respond to the different
 * actions users can initiate. The following events will be triggered on the map:
 *
 * @class L.Draw.Event
 * @aka Draw.Event
 *
 * Use `L.Draw.Event.EVENTNAME` constants to ensure events are correct.
 *
 * @example
 * ```js
 * map.on(L.Draw.Event.CREATED; function (e) {
 *    var type = e.layerType;
 *        layer = e.layer;
 *
 *    if (type === 'marker') {
 *        // Do marker specific actions
 *    }
 *
 *    // Do whatever else you need to. (save to db; add to map etc)
 *    map.addLayer(layer);
 *});
 * ```
 */
 
L.Draw.Event = { ID: 'LeafetDraw' };

/**
 * @event draw:created: PolyLine; Polygon; Rectangle; Circle; Marker | String
 *
 * attributes:
 *     layer: Layer that was just created.
 *     layerType: The type of layer this is. One of: `polyline`; `polygon`; `rectangle`; `circle`; `marker`
 *
 * Triggered when a new vector or marker has been created.
 *
 */
L.Draw.Event.CREATED = 'draw:created';

/**
 * @event draw:canceled: PolyLine; Polygon; Rectangle; Circle; Marker | String
 *
 * attributes:
 *     layerType: The type of layer this is. One of: `polyline`; `polygon`; `rectangle`; `circle`; `marker`
 *
 * Triggered when a new vector or marker has been created.
 *
 */
L.Draw.Event.CANCELED = 'draw:canceled';

/**
 * @event draw:edited: LayerGroup
 *
 * attributes:
 *     layers: List of all layers just edited on the map.
 *
 * Triggered when layers in the FeatureGroup; initialised with the plugin; have been edited and saved.
 *
 * @example
 * ```js
 *      map.on('draw:edited'; function (e) {
 *          var layers = e.layers;
 *          layers.eachLayer(function (layer) {
 *              //do whatever you want; most likely save back to db
 *          });
 *      });
 * ```
 */
L.Draw.Event.EDITED = 'draw:edited';

/**
 * @event draw:deleted: LayerGroup
 *
 * attributes:
 *     layers: List of all layers just removed from the map.
 *
 * Triggered when layers have been removed (and saved) from the FeatureGroup.
 */
L.Draw.Event.DELETED = 'draw:deleted';

/**
 * @event draw:deletedlayer: LayerGroup
 *
 * attributes:
 *     layer: Layer that was just deleted.
 *
 * Triggered when a layer has just been deleted
 */
L.Draw.Event.DELETEDLAYER = 'draw:deletedlayer';

/**
 * @event draw:drawstart: String
 *
 * attributes:
 *     layerType: The type of layer this is. One of:`polyline`; `polygon`; `rectangle`; `circle`; `marker`
 *
 * Triggered when the user has chosen to draw a particular vector or marker.
 */
L.Draw.Event.DRAWSTART = 'draw:drawstart';

/**
 * @event draw:drawstop: String
 *
 * attributes:
 *     layerType: The type of layer this is. One of: `polyline`; `polygon`; `rectangle`; `circle`; `marker`
 *
 * Triggered when the user has finished a particular vector or marker.
 */

L.Draw.Event.DRAWSTOP = 'draw:drawstop';

/**
 * @event draw:drawvertex: LayerGroup
 *
 * attributes:
 *     layers: List of all layers just being added from the map.
 *     drawHandler: Currently active L.Draw.Polyline handler.
 *
 * Triggered when a vertex is created on a polyline or polygon.
 */
L.Draw.Event.DRAWVERTEX = 'draw:drawvertex';

/**
 * @event draw:editstart: String
 *
 * attributes:
 *     handler: The type of edit this is. One of: `edit`
 *
 * Triggered when the user starts edit mode by clicking the edit tool button.
 */

L.Draw.Event.EDITSTART = 'draw:editstart';

/**
 * @event draw:editmove: ILayer
 *
 * attributes:
 *    layer: Layer that was just moved.
 *    editHandler: The currently active edit handler for this layer.
 *    editType: The type of edit. One of: 'editmarker/Move',
 *              'editpoly/Move', 'editrect/Move', 'editcircle/Move'
 *
 * additional attributes based on editType:
 *    for 'editmarker/Move':
 *        originalLatLng: the original latlng for this marker, from before the move
 *        newLatLng: the new latlng for this marker, from after the move
 *
 *    for 'editpoly/Move':
 *        newLatLng: the new latlng "center" for this poly object, from after the move
 *        latMove: the lat move offset
 *        lngMove: the lng move offset
 *
 *    for 'editrect/Move':
 *        originalCenter: the original latlng center for this rect, from before the move
 *        originalLatLngs: the original latlng corners for this rect, from before the move
 *        newCenter: the new latlng center for this rect, from after the move
 *        newLatLngs: the new latlng corners for this rect, from after the move
 *
 *    for 'editcircle /Move':
 *        originalCenter: the original latlng circle for this rect, from before the move
 *        newCenter: the new latlng center for this circle, from after the move
 *
 * Triggered as the user moves a poly, rectangle, circle, or marker.
 */
L.Draw.Event.EDITMOVE = 'draw:editmove';

/**
 * @event draw:editresize: ILayer
 *
 * Layer that was just resized.
 *
 * attributes:
 *     layer: Layer that was just resized,
 *     editHandler: The currently active edit handler
 *     editType: either 'editrect/Resize' or 'editcircle/Resize'
 *          
 * additional attributes based on editType:
 *     for 'editrect/Resize'
 *         originalBounds: the original bounds, before resizing
 *         newBounds: the new bounds, after resizing
 *
 *     for 'editcircle/Resize':
 *         originalRadius: the original radius, before resizing
 *         newRadius: the new radius, after resizing
 *       
 * Triggered as the user resizes a rectangle or circle.
 */
L.Draw.Event.EDITRESIZE = 'draw:editresize';

/**
 * @event draw:editvertex: LayerGroup
 *
 * List of all layers just being edited from the map.
 *
 * attributes:
 *      layers: this._markerGroup,
 *      editHandler: the currently active L.Edit.PolyVerticesEdit
 *      editType: either 'editvertex/Move' or 'editvertex/Remove'
 *      editInfo: additional information about the edit
 *      poly: the corresponding poly object for this vertex
 *      marker: the corresponding marker for this vertex, from before it was removed
 *          
 * editInfo is based on editType:
 *      for 'editvertex/Move':
 *          index: the index of the moved vertex
 *          originalLatLng: the original latlng of the vertex, before the move
 *          newLatLng: the new latlng of the vertex, after the move
 *          
 *      for 'editvertex/Remove' and 'editvertex/Add':
 *          index: the vertex's original index, before the remove
 *          originalLatLng: the vertex's original latlng
 *          prev: the index of the previous vertex, from before the remove (needed to access the corresponding middle-marker)
 *          next: the index of the next vertex, from before the remove (needed to access the corresponding middle-marker)
 *          
 * Triggered when a vertex is edited on a polyline or polygon.
 */
L.Draw.Event.EDITVERTEX = 'draw:editvertex';

/**
 * @event draw:editstop: String
 *
 * attributes:
 *     handler: The type of edit this is. One of: `edit`
 *
 * Triggered when the user has finshed editing (edit mode) and saves edits.
 */
L.Draw.Event.EDITSTOP = 'draw:editstop';

/**
 * @event draw:edithook: String
 *
 * attributes:
 *     layer: the currently active 
 *     editHandler: The currently active edit handler.
       vertex : existant and true if this is a PolyVerticesEdit object
 *
 * Triggered once for each editable layer, including each vertex set.
 *
 * Triggered immediately after addHooks is called; this is needed for using undo with snap,
 * as simply grabbing layer.editing or layer.snapediting will fail if the user tries to 
 * undo immediately after entering edit mode (say, after saving some prior edits, so that
 * there exists history in the editstack) but before they touch any objects for that edit
 * session.  
 */
L.Draw.Event.EDITHOOK = 'draw:edithook';

/**
 * @event draw:editdone: String
 *
 * attributes:
 *     handler: The type of edit this is. One of: `edit`
 *
 * Triggered when the user has finshed editing (edit mode) and saves edits.
 */
L.Draw.Event.EDITDONE = 'draw:editdone';

/**
 * @event draw:editrevert: String
 *
 *
 * Triggered when the user has intersected a poly during edit mode, in order
 * to signal to the undomanager to ignore the last editvertex event.
 */
L.Draw.Event.EDITREVERT = 'draw:editrevert';

/**
 * @event draw:deletestart: String
 *
 * attributes:
 *     handler: The type of edit this is. One of: `remove`
 *
 * Triggered when the user starts remove mode by clicking the remove tool button.
 */
L.Draw.Event.DELETESTART = 'draw:deletestart';

/**
 * @event draw:deletestop: String
 *
 * attributes:
 *     handler: The type of edit this is. One of: `remove`
 *
 * Triggered when the user has finished removing shapes (remove mode) and saves.
 */
L.Draw.Event.DELETESTOP = 'draw:deletestop';

/**
 * @event draw:undoaction: String
 * @event draw:redoaction: String
 * @event draw:pushundo: String
 * @event draw:undomain: String
 * @event draw:undonested: String
 * @event draw:redomain: String
 * @event draw:redonested: String
 *
 * undoaction: triggered whenever a user presses ctrl-z
 * redoaction: triggered whenever a user presses ctrl-y
 * pushundo: triggered whenever an undoable action originally occurs
 *
 * undomain: triggered just after an action is undoed in main mode
 * redomain: triggered just after an action is redoed in main mode
 * undonested: triggered just after an action is undoed in nested mode (e.g. edit mode, delete mode, etc)
 * redonested: triggered just after an action is redoed in nested mode (e.g. edit mode, delete mode, etc)
 *
 * attributes:
 *     stackItem: an undo stack item. contains:
 *         actionType: the type of action performed by leaflet draw. derived from the above events.
 *             params: parameters of the calling event
 *             undoId: a unique id generated by L.StateManager for each action.
 *           moduleId: equal to 'LeafletDraw' if the event is generated by this
 *                     module. could be different if the generated action was
 *                     installed with L.UndoManager.addExtension.
 *                tag: optional string; allows undo items to be selectively removed
 *                     by tag name using L.StateHandler 
 *         
 * Triggered when the user has finished removing shapes (remove mode) and saves.
 */

L.Draw.Event.UNDOACTION = 'draw:undoaction';
L.Draw.Event.REDOACTION = 'draw:redoaction';
L.Draw.Event.PUSHUNDO = 'draw:pushundo';
L.Draw.Event.UNDOMAIN = 'draw:undomain';
L.Draw.Event.UNDONESTED = 'draw:undonested';
L.Draw.Event.REDOMAIN = 'draw:redomain';
L.Draw.Event.REDONESTED = 'draw:redonested';
