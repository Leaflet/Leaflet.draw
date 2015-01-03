L.DrawToolbar.Control = L.Toolbar.Control.extend({
	options: {
		actions: [
			L.Draw.Polygon,
			L.Draw.Polyline,
			L.Draw.Marker,
			L.Draw.Rectangle,
			L.Draw.Circle
		],
		className: 'leaflet-draw-toolbar'
	}
});

/* Include sub-toolbars. */
L.setOptions(L.Draw.Polygon.prototype, {
	subToolbar: new L.Toolbar({ actions: [L.Draw.Cancel, L.Draw.RemoveLastPoint] })
});

L.setOptions(L.Draw.Polyline.prototype, {
	subToolbar: new L.Toolbar({ actions: [L.Draw.Cancel, L.Draw.RemoveLastPoint] })
});

L.setOptions(L.Draw.Marker.prototype, {
	subToolbar: new L.Toolbar({ actions: [L.Draw.Cancel] })
});

L.setOptions(L.Draw.Rectangle.prototype, {
	subToolbar: new L.Toolbar({ actions: [L.Draw.Cancel] })
});

L.setOptions(L.Draw.Circle.prototype, {
	subToolbar: new L.Toolbar({ actions: [L.Draw.Cancel] })
});