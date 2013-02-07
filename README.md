#Leaflet.draw
Adds support for drawing and editing vectors and markers on [Leaflet maps](https://github.com/Leaflet/Leaflet). Check out the [demo](http://leaflet.github.com/Leaflet.draw/)

#### Upgrading from Leaflet.draw 0.1

Leaflet.draw 0.2 changes a LOT of things from 0.1. Please see [BREAKING CHANGES](https://github.com/Leaflet/Leaflet.draw/blob/master/BREAKINGCHANGES.md) for how to upgrade.

## Table of Contents
[Using the plugin](#using)  
[Advanced Options](#options)  
[Command tasks](#tasks)  
[Thanks](#thanks)  

<a name="using" />
## Using the plugin

The default state for the control is the draw toolbar just below the zoom control. This will allow map users to draw vectors and markers. **Please note the edit toolbar is not enabled by default.**

Too add the draw toolbar set the option `drawControl: true` in the map options.

````js
// create a map in the "map" div, set the view to a given place and zoom
var map = L.map('map', {drawControl: true}).setView([51.505, -0.09], 13);

// add an OpenStreetMap tile layer
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
````

### Adding the edit toolbar

To use the edit toolbar you must initialise the Leaflet.draw control and manually add it to the map.

````js
// create a map in the "map" div, set the view to a given place and zoom
var map = L.map('map', {drawControl: true}).setView([51.505, -0.09], 13);

// add an OpenStreetMap tile layer
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Initialize the FeatureGroup to store editable layers
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Initialize the draw control and pass it the FeatureGroup of editable layers
var drawControl = new L.Control.Draw({
	edit: {
		featureGroup: drawnItems
	}
});
map.addControl(drawControl);
````

The key here is the `featureGroup` option. This tells the plugin which `FeatureGroup` that contains the layers that should be editable.

<a name="options" />
## Advanced options

You can configure the plugin by using the different options listed here.

### Control.Draw

These options make up the root object that is used when initializing the Leaflet.draw control.

| Option | Type | Default | Description
| --- | --- | --- | ---
| position | String | `'topleft'` | The initial position of the control (one of the map corners). See [control positions](http://leafletjs.com/reference.html#control-positions).
| draw | [DrawOptions](#drawoptions) | `{}` | The options used to configure the draw toolbar.
| edit | [EditOptions](#editoptions) | `false` | The options used to configure the edit toolbar.

<a name="drawoptions" />
### DrawOptions

These options will allow you to configure the draw toolbar and it's handlers.

| Option | Type | Default | Description
| --- | --- | --- | ---
| polyline | [PolylineOptions](#polylineoptions) | `{ title: 'Draw a polyline' }` | Polyline draw handler options.
| polygon | [PolygonOptions](#polygonoptions) | `{ title: 'Draw a polygon' }` | Polygon draw handler options.
| rectangle | [RectangleOptions](#rectangleoptions) | `{ title: 'Draw a rectangle' }` | Rectangle draw handler options.
| circle | [CircleOptions](#circleoptions) | `{ title: 'Draw a circle' }` | Circle draw handler options.
| marker | [MarkerOptions](#markeroptions) | `{ title: 'Add a marker' }` | Marker draw handler options.

### Draw handler options

The following options will allow you to configure the individual draw handlers.

<a name="polylineoptions" />
<a name="polygonoptions" />
#### PolylineOptions and PolygonOptions

Polyline and Polygon drawing handlers take the same options.

| Option | Type | Default | Description
| --- | --- | --- | ---
| title | String | `'Draw a Polyline (Polygon)'` | The title used for the polyline/polygon button.
| allowIntersection | Bool | `true` | Determines if line segements can cross.
| drawError | Object | [See code]() | Configuration options for the error that displays if an intersection is detected.
| guidelineDistance | Number | `20` | Distance in pixels between each guide dash.
| shapeOptions | [Leaflet Polyline options](http://leafletjs.com/reference.html#polyline-options) | [See code]() | The options used when drawing the polyline/polygon on the map.
| zIndexOffset | Number | `2000` | This should be a high number to ensure that you can draw over all other layers on the map.

<a name="rectangleoptions" />
#### RectangleOptions

| Option | Type | Default | Description
| --- | --- | --- | ---
| title | String | `'Draw a rectangle.'` | The title used for the rectangle button.
| shapeOptions | [Leaflet Path options](http://leafletjs.com/reference.html#path-options) | [See code]() | The options used when drawing the rectangle on the map.

<a name="circleoptions" />
#### CircleOptions

| Option | Type | Default | Description
| --- | --- | --- | ---
| title | String | `'Draw a circle.'` | The title used for the circle button.
| shapeOptions | [Leaflet Path options](http://leafletjs.com/reference.html#path-options) | [See code]() | The options used when drawing the circle on the map.

<a name="markeroptions" />
#### MarkerOptions

| Option | Type | Default | Description
| --- | --- | --- | ---
| title | String | `'Add a marker.'` | The title used for the marker button.
| icon | [Leaflet Icon](http://leafletjs.com/reference.html#icon) | `L.Icon.Default()` | The icon displayed when drawing a marker.
| zIndexOffset | Number | `2000` | This should be a high number to ensure that you can draw over all other layers on the map.

<a name="editoptions" />
### EditOptions

These options will allow you to configure the draw toolbar and its handlers.

| Option | Type | Default | Description
| --- | --- | --- | ---
| featureGroup | [Leaflet FeatureGroup](http://leafletjs.com/reference.html#featuregroup) | `null` | This is the FeatureGroup that stores all editable shapes. **THIS iS REQUIRED FOR THE EDIT TOOLBAR TO WORK**
| edit | [EditHandlerOptions](#edithandleroptions) | `{ title: 'Edit layers' }` | Edit handler options.
| remove | [DeleteHandlerOptions](#deletehandleroptions) | `{ title: 'Delete layers' }` | Delete handler options.

<a name="edithandleroptions" />
#### EditHandlerOptions

| Option | Type | Default | Description
| --- | --- | --- | ---
| title | String | `'Edit Layers'` | The title used for the edit button.
| selectedPathOptions | [Leaflet Path options](http://leafletjs.com/reference.html#path-options) | [See code]() | The path options for how the layers will look like while in edit mode.

<a name="deletehandleroptions" />
#### DeleteHandlerOptions

| Option | Type | Default | Description
| --- | --- | --- | ---
| title | String | `'Remove Layers'` | The title used for the delete button.

<a name="commontasks" />
## Common tasks

The following examples outline some common tasks.

### Example Leaflet.draw config

The following example will show you how to:

1. Change the position of the control's toolbar.
2. Customize the styles of a vector layer.
3. Use a custom marker.
4. Disable the delete functionality.

````js
var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png',
	cloudmade = new L.TileLayer(cloudmadeUrl, {maxZoom: 18}),
	map = new L.Map('map', {layers: [cloudmade], center: new L.LatLng(-37.7772, 175.2756), zoom: 15 });

var editableLayers = new L.FeatureGroup();
map.addLayer(editableLayers);

var MyCustomMarker = L.Icon.extend({
	options: {
		shadowUrl: null,
		iconAnchor: new L.Point(12, 12),
		iconSize: new L.Point(24, 24),
		iconUrl: 'link/to/image.png'
	}
});

var options = {
	position: 'topright',
	draw: {
		polyline: {
			title: 'Draw a kick ass polyline!'
			shapeOptions: {
				color: '#f357a1',
				weight: 10
			}
		},
		polygon: {
			allowIntersection: false, // Restricts shapes to simple polygons
			drawError: {
				color: '#e1e100, // Color the shape will turn when intersects
				message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect
			},
			shapeOptions: {
				color: '#bada55'
			}
		},
		circle: false, // Turns off this drawing tool
		rectangle: {
			shapeOptions: {
				clickable: false
			}
		},
		marker: {
			icon: new MyCustomMarker()
		}
	},
	edit: {
		featureGroup: editableLayers, //REQUIRED!!
		remove: false
	}
};

var drawControl = new L.Control.Draw(options);
map.addControl(drawControl);

map.on('draw:created', function (e) {
	var type = e.layerType,
		layer = e.layer;

	if (type === 'marker') {
		layer.bindPopup('A popup!');
	}

	drawnItems.addLayer(layer);
});
````

### Disabling a toolbar

If you do not want a particular toolbar in your app you can turn it off by setting the toolbar to false.

````js
var drawControl = new L.Control.Draw({
	draw: false,
	edit: {
		featureGroup: editableLayers
	}
});
````

### Disabling a toolbar item

If you want to turn off a particular toolbar item, set it to false. The following disables drawing polygons and markers. It also turns off the ability to edit layers.

````js
var drawControl = new L.Control.Draw({
	draw: {
		polygon: false,
		marker: false
	},
	edit: {
		featureGroup: editableLayers,
		edit: false
	}
});
````

<a name="thanks" />
## Thanks

Thanks so much to [@brunob](https://github.com/brunob), [@tnightingale](https://github.com/tnightingale), and [@shramov](https://github.com/shramov). I got a lot of ideas from their Leaflet plugins.

All the [contributors](https://github.com/Leaflet/Leaflet.draw/graphs/contributors) and issue reporters of this plugin rock. Thanks for tidying up my mess and keeping the plugin on track.

The icons used for some of the toolbar buttons are either from http://glyphicons.com/ or inspired by them. <3 Glyphicons!

Finally, [@mourner](https://github.com/mourner) is the man! Thanks for dedicating so much of your time to creating the gosh darn best JavaScript mapping library around.
