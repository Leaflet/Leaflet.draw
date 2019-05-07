/**
 * @class L.Draw.Line
 * @aka Draw.Line
 * @inherits L.Draw.Line
 */
L.Draw.Line = L.Draw.Polyline.extend({
  statics: {
    TYPE: 'line'
  },

  Line: L.Line,

  // @method initialize(): void
  initialize: function (map, options) {
    // if touch, switch to touch icon
    if (L.Browser.touch) {
      this.options.icon = this.options.touchIcon;
    }

    // Need to set this here to ensure the correct message is used.
    this.options.drawError.message = L.drawLocal.draw.handlers.polyline.error;

    // Merge default drawError options with custom options
    if (options && options.drawError) {
      options.drawError = L.Util.extend({}, this.options.drawError, options.drawError);
    }

    // Save the type so super can fire, need to do this as cannot do this.TYPE :(
    this.type = L.Draw.Line.TYPE;

    L.Draw.Feature.prototype.initialize.call(this, map, options);
  },

  _getTooltipText: function () {
		var showLength = this.options.showLength,
			labelText, distanceStr;
		if (this._markers.length === 0) {
			labelText = {
				text: L.drawLocal.draw.handlers.line.tooltip.start
			};
		} else {
			distanceStr = showLength ? this._getMeasurementString() : '';

			if (this._markers.length === 1) {
				labelText = {
					text: L.drawLocal.draw.handlers.line.tooltip.cont,
					subtext: distanceStr
				};
			} else {
				labelText = {
					text: L.drawLocal.draw.handlers.line.tooltip.end,
					subtext: distanceStr
				};
			}
		}
		return labelText;
	},

  // @method addVertex(): void
  // Add a vertex to the end of the polyline
  addVertex: function (latlng) {

    this._poly.addLatLng(latlng);

    if (this._poly.getLatLngs().length === 2) {
      this._map.addLayer(this._poly);
      this._finishShape();
    }
  }
});