var deps = {
	Core: {
		src: [
			'Leaflet.draw.js',
			'Leaflet.Draw.Event.js',
		],
		desc: 'The core of the plugin. Currently only includes the version.'
	},
	
	Common: {
		src: ['ext/CurveCommon.js'],
		desc: 'The files shared with multiple objects of the plugin.'
	},

	DrawHandlers: {
		src: [
			'draw/handler/Draw.Feature.js',
			'draw/handler/Draw.Polyline.js',
			'draw/handler/Draw.Curve.js',
			'draw/handler/Draw.Polygon.js',
			'draw/handler/Draw.SimpleShape.js',
			'draw/handler/Draw.Rectangle.js',
			'draw/handler/Draw.Marker.js',
			'draw/handler/Draw.CircleMarker.js',
			'draw/handler/Draw.Circle.js'
		],
		desc: 'Drawing handlers for: polylines, polygons, rectangles, circles, circlemarkers and markers.',
		deps: ['Core', 'Common']
	},

	EditHandlers: {
		src: [
			'edit/handler/Edit.Marker.js',
			'edit/handler/Edit.Poly.js',
			'edit/handler/Edit.Curve.js',
			'edit/handler/Edit.SimpleShape.js',
			'edit/handler/Edit.Rectangle.js',
      		'edit/handler/Edit.CircleMarker.js',
			'edit/handler/Edit.Circle.js'
		],
		desc: 'Editing handlers for: polylines, curves, polygons, rectangles, circlemarkers and circles.',
		deps: ['Core', 'Common']
	},

	Extensions: {
		src: [
			'ext/TouchEvents.js',
			'ext/LatLngUtil.js',
			'ext/GeometryUtil.js',
			'ext/LineUtil.Intersect.js',
			'ext/Polyline.Intersect.js',
			'ext/Polygon.Intersect.js'
		],
		desc: 'Extensions of leaflet classes.'
	},

	CommonUI: {
		src: [
			'Control.Draw.js',
			'Toolbar.js',
			'Tooltip.js'
		],
		desc: 'Common UI components used.',
		deps: ['Extensions']
	},

	DrawUI: {
		src: [
			'draw/DrawToolbar.js'
		],
		desc: 'Draw toolbar.',
		deps: ['DrawHandlers', 'CommonUI']
	},

	EditUI: {
		src: [
			'edit/EditToolbar.js',
			'edit/handler/EditToolbar.Edit.js',
			'edit/handler/EditToolbar.Delete.js'
		],
		desc: 'Edit toolbar.',
		deps: ['EditHandlers', 'CommonUI']
	}
};

if (typeof exports !== 'undefined') {
	exports.deps = deps;
}
