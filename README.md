#Leaflet.draw
Adds support for drawing polys to Leaflet.

Check out the [demo](http://leaflet.github.com/Leaflet.draw/)

This plugin was inspired by @brunob's [draw plugin](https://github.com/brunob/leaflet.draw). I decided to create a new repo rather than forking as I wanted to take the coding style and functionality in a different direction.

#Using the plugin
If you are happy with the control being displayed below the zoom controls just set ````drawControl = true```` when declaring your Leaflet map.

E.g.:

````
var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png',
cloudmade = new L.TileLayer(cloudmadeUrl, {maxZoom: 18}),
map = new L.Map('map', {layers: [cloudmade], center: new L.LatLng(-37.7772, 175.2756), zoom: 15, drawControl: true });
````

If you would like to reposition the control, turn off a type or customize the styles then add the control manually:

````
var drawControl = new L.Control.Draw({
	position: 'topright',
	polyline: false
});
map.addControl(drawControl);
````

See [example/map-polydraw.html](https://github.com/leaflet/Leaflet.draw/blob/master/example/drawing.html) for a working example.

#Customize shape styles

L.Control.Draw can take an options object. You can customize the look and behaviour like so:

````
var options = {
	polyline: {
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
}
````

The shape styles are the leaflet [Path](http://leaflet.cloudmade.com/reference.html#path-options) and [Polyline](http://leaflet.cloudmade.com/reference.html#polyline-options) options.

#Custom marker

To use a different image as the marker, simple override the icon option of option.marker:

````
// Declare a new Leaflet Icon
var MyCustomMarker = L.Icon.extend({
	options: {
		shadowUrl: null,
		iconAnchor: new L.Point(12, 12),
		iconSize: new L.Point(24, 24),
		iconUrl: 'link/to/image.png'
	}
});

// Pass this new icon in using options.marker
var drawControl = new L.Control.Draw({
	marker: {
		icon: new MyCustomMarker()
	}
});
````
