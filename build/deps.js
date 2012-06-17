var deps = {
	DrawHandler: {
		src: ['Handler.Draw.js'],
		desc: 'The base class for drawing.',
	},

	Polys: {
		src: ['Polyline.Draw.js',
		      'Polygon.Draw.js'],
		desc: 'Polyline and Polygon drawing handlers.',
		deps: ['DrawHandler']
	},
	
	SimpleShapes: {
		src: ['SimpleShape.Draw.js',
		      'Circle.Draw.js',
		      'Rectangle.Draw.js'],
		desc: 'Simple Shape drawing handlers.',
		deps: ['DrawHandler']
	},
	
	Markers: {
		src: ['Marker.Draw.js'],
		desc: 'Marker drawing handlers.',
		deps: ['DrawHandler']
	},
	
	DrawingControl: {
		src: ['Control.Draw.js'],
		desc: 'Drawing control.',
		deps: ['Polys',
			   'SimpleShapes',
			   'Markers']
	}
};

if (typeof exports !== 'undefined') {
	exports.deps = deps;
}