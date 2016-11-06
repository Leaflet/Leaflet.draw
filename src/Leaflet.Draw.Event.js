
/**
 * ### Events
 * Once you have successfully added the Leaflet.draw plugin to your map you will want to respond to the different
 * actions users can initiate. The following events will be triggered on the map:
 *
 *
 * #### draw:created
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | layer | [Polyline](http://leafletjs.com/reference.html#polyline)/[Polygon](http://leafletjs.com/reference.html#polygon)/[Rectangle](http://leafletjs.com/reference.html#rectangle)/[Circle](http://leafletjs.com/reference.html#circle)/[Marker](http://leafletjs.com/reference.html#marker) | Layer that was just created.
 * | layerType | String | The type of layer this is. One of: `polyline`, `polygon`, `rectangle`, `circle`, `marker`
 *
 *
 * Triggered when a new vector or marker has been created.
 *
 * @example
 * ```js
 * map.on(L.Draw.Event.CREATED, function (e) {
 *    var type = e.layerType,
 *        layer = e.layer;
 *
 *    if (type === 'marker') {
 *        // Do marker specific actions
 *    }
 *
 *    // Do whatever else you need to. (save to db, add to map etc)
 *    map.addLayer(layer);
 *});
 * ```
 */
L.Draw.Event.CREATED = 'draw:created';

/**
 * #### draw:edited
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | layers | [LayerGroup](http://leafletjs.com/reference.html#layergroup) | List of all layers just edited on the map.
 *
 *
 * Triggered when layers in the FeatureGroup, initialised with the plugin, have been edited and saved.
 *
 * ```js
 * map.on('draw:edited', function (e) {
 *    var layers = e.layers;
 *    layers.eachLayer(function (layer) {
 *        //do whatever you want, most likely save back to db
 *    });
 *});
 * ```
 *
 */

/**
 * #### draw:deleted
 *
 * Triggered when layers have been removed (and saved) from the FeatureGroup.
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | layers | [LayerGroup](http://leafletjs.com/reference.html#layergroup) | List of all layers just removed from the map.
 *
 *
 */

/**
 * #### draw:drawstart
 *
 * Triggered when the user has chosen to draw a particular vector or marker.
 *
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | layerType | String | The type of layer this is. One of: `polyline`, `polygon`, `rectangle`, `circle`, `marker`
 *
 *
 */

/**
 * #### draw:drawstop
 *
 * Triggered when the user has finished a particular vector or marker.
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | layerType | String | The type of layer this is. One of: `polyline`, `polygon`, `rectangle`, `circle`, `marker`
 *
 */

/**
 * #### draw:drawvertex
 *
 * Triggered when a vertex is created on a polyline or polygon.
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | layers | [LayerGroup](http://leafletjs.com/reference.html#layergroup) | List of all layers just being added from the map.
 *
 */

/**
 * #### draw:editstart
 *
 * Triggered when the user starts edit mode by clicking the edit tool button.
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | handler | String | The type of edit this is. One of: `edit`
 *
 */

/**
 * #### draw:editmove
 *
 * Triggered as the user moves a rectangle, circle or marker.
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | layer | [ILayer](http://leafletjs.com/reference.html#ilayer) | Layer that was just moved.
 *
 */

/**
 * #### draw:editresize
 *
 * Triggered as the user resizes a rectangle or circle.
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | layer | [ILayer](http://leafletjs.com/reference.html#ilayer) | Layer that was just moved.
 *
 */

/**
 * #### draw:editvertex
 *
 * Triggered when a vertex is edited on a polyline or polygon.
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | layers | [LayerGroup](http://leafletjs.com/reference.html#layergroup) | List of all layers just being edited from the map.
 *
 */

/**
 * #### draw:editstop
 *
 * Triggered when the user has finshed editing (edit mode) and saves edits.
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | handler | String | The type of edit this is. One of: `edit`
 *
 */

/**
 * #### draw:deletestart
 *
 * Triggered when the user starts remove mode by clicking the remove tool button.
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | handler | String | The type of edit this is. One of: `remove`
 *
 */

/**
 * #### draw:deletestop
 *
 * Triggered when the user has finished removing shapes (remove mode) and saves.
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | handler | String | The type of edit this is. One of: `remove`
 *
 */