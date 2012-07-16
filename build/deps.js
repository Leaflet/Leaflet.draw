var deps = {
	LeafletExtensions: {
		src: [
			'ext/LineUtil.js',
			'ext/Polyline.js',
			'ext/Polygon.js'
		],
		desc: 'Extensions to Leaflet to add intersection detection.'
	},

	DrawHandler: {
		src: ['draw/Handler.Draw.js'],
		desc: 'The base class for drawing.',
		deps: ['LeafletExtensions']
	},

	Polys: {
		src: [
			'draw/shapes/Polyline.Draw.js',
			'draw/shapes/Polygon.Draw.js'
		],
		desc: 'Polyline and Polygon drawing handlers.',
		deps: ['DrawHandler']
	},
	
	SimpleShapes: {
		src: [
			'draw/shapes/SimpleShape.Draw.js',
			'draw/shapes/Circle.Draw.js',
			'draw/shapes/Rectangle.Draw.js'
		],
		desc: 'Simple Shape drawing handlers.',
		deps: ['DrawHandler']
	},
	
	Markers: {
		src: ['draw/shapes/Marker.Draw.js'],
		desc: 'Marker drawing handlers.',
		deps: ['DrawHandler']
	},
	
	DrawingControl: {
		src: ['draw/Control.Draw.js'],
		desc: 'Drawing control.',
		deps: [
			'Polys',
			'SimpleShapes',
			'Markers'
		]
	}
};

if (typeof exports !== 'undefined') {
	exports.deps = deps;
}