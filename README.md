#Leaflet.draw
Adds support for drawing polys to Leaflet.

Check out the [demo](http://jacobtoye.github.com/Leaflet.draw/)

This plugin was inspired by @brunob's [draw plugin](https://github.com/brunob/leaflet.draw). I decided to create a new repo rather than forking as I wanted to take the coding style and functionality in a different direction.

#Using the plugin
If you are happy with the control being displayed below the zoom controls just set ````drawControl = true```` when declaring your Leaflet map.

E.g.:

````
var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png',
cloudmade = new L.TileLayer(cloudmadeUrl, {maxZoom: 18}),
map = new L.Map('map', {layers: [cloudmade], center: new L.LatLng(-37.7772, 175.2756), zoom: 15, drawControl: true });
````

If you would like to reposition the control, turn off a type or customize the styles (see next chapter) then add the control manually:

````
var drawControl = new L.Control.Draw({
    position: 'topright'
});
map.addControl(drawControl);
````

See [example/map-polydraw.html](https://github.com/jacobtoye/Leaflet.draw/blob/master/example/drawing.html) for a working example.

#Customize shape styles

L.Control.Draw can take an options object. You can define which shapes (polyline, poligon, rectangle, circle or marker) will be displayed and its properties:

````
var options = {
    // overrids all default shapes
    shapes: [
        { // enable a circle
            type: 'circle',
            title: 'Add a circle'
        },
        { // add a simple marker
            type: 'marker',
            title: 'Add a marker'
        },
        { // add another marker with a custom icon
            name: 'custom',  // name on events
            type: 'marker',
            title: 'Add a marker',
            icon: new L.DivIcon() // use a custom icon
        },
        {
            type: 'polygon',
            allowIntersection: false, // Restricts shapes to simple polygons
            drawError: {
                color: '#e1e100, // Color the shape will turn when intersects
                message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect
            },
            shapeOptions: {
                color: '#bada55'
            }
        }
    ]
}
````

The shape styles are the leaflet [Path](http://leaflet.cloudmade.com/reference.html#path-options) and [Polyline](http://leaflet.cloudmade.com/reference.html#polyline-options) options.

# multiple shapes with same type

Each event has a name attribute, which is empty or specified by the shape options to distinguish shapes with the same type:

````
map.on('draw:marker-created', function (e) {
    if (e.name === '') {
        // default marker
    } else if (e.name === 'custom') {
        // our custom marker
    }
});
````

If a name is specified, its corresponding button gets an additional css class for customization, e.g.
````
type: circle
name: red

class: circle-red
````

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

// Pass this new icon to the options 
var drawControl = new L.Control.Draw({
    shapes: [
        /* .. */
        {
            type: 'marker',
            icon: new MyCustomMarker()
        },
        /* .. */
    }
});
````
