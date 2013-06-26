/*
 * Leaflet.draw assumes that you have already included the Leaflet library.
 */

L.drawVersion = '0.2.0-dev';

L.drawLocal = {
	draw: {
		toolbar: {
			title: 'Cancel drawing',
			text: 'Cancel',
			polyline: 'Draw a polyline',
			polygon: 'Draw a polygon',
			rectangle: 'Draw a rectangle',
			circle: 'Draw a circle',
			marker: 'Draw a marker'
		},
		circle: {
			tooltip: {
				start: 'Click and drag to draw circle.'
			}
		},
		marker: {
			tooltip: {
				start: 'Click map to place marker.'
			}
		},
		polygon: {
			tooltip: {
				start: 'Click to start drawing shape.',
				cont: 'Click to continue drawing shape.',
				end: 'Click first point to close this shape.'
			}
		},
		polyline: {
			error: '<strong>Error:</strong> shape edges cannot cross!',
			tooltip: {
				start: 'Click to start drawing line.',
				cont: 'Click to continue drawing line.',
				end: 'Click last point to finish line.'
			}
		},
		rectangle: {
			tooltip: {
				start: 'Click and drag to draw rectangle.'
			}
		},
		simpleshape: {
			tooltip: {
				end: 'Release mouse to finish drawing.'
			}
		}
	},
	edit: {
		toolbar: {
			edit: {
				title: 'Edit layers',
				save: {
					title: 'Save changes.',
					text: 'Save'
				},
				cancel: {
					title: 'Cancel editing, discards all changes.',
					text: 'Cancel'
				}
			},
			remove: {
				title: 'Delete layers',
				tooltip: 'Click on a feature to remove'
			}
		},
		tooltip: {
			text: 'Drag handles, or marker to edit feature.',
			subtext: 'Click cancel to undo changes.'
		}
	}
};