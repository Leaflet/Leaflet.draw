var deps = {
	Core: {
		src: [
			'ext/LineUtil.js',
			'ext/Polyline.js',
			'ext/Polygon.js',
			'Tooltip.js',
			'Control.Toolbar.js',
		],
		desc: 'The core of the plugin.'
	},

	Draw: {
		src: [
			'draw/Control.Draw.js',
			'draw/Handler.Draw.js',
			'draw/shapes/Polyline.Draw.js',
			'draw/shapes/Polygon.Draw.js',
			'draw/shapes/SimpleShape.Draw.js',
			'draw/shapes/Circle.Draw.js',
			'draw/shapes/Rectangle.Draw.js',
			'draw/shapes/Marker.Draw.js'
		],
		desc: 'Drawing tools used to create vectors and markers.',
		deps: ['Core']
	},

	Edit: {
		src: [
			'TODO'
		],
		desc: 'Editing tools used to edit and delete vectors and markers.',
		deps: ['Core']
	}
};

if (typeof exports !== 'undefined') {
	exports.deps = deps;
}