L.SplitToolbar.Split = L.Handler.extend({
	statics: {
		TYPE: 'split'
	},

	includes: L.Mixin.Events,
	_backupLayerGroup: {},

	options: {
		selectedPathOptions: {
			color: '#fe57a1', /* Hot pink all the things! */
			opacity: 0.6,
			dashArray: '10, 10',

			fill: true,
			fillColor: '#fe57a1',
			fillOpacity: 0.1
		}
	},

	initialize: function (map, options) {
		L.Handler.prototype.initialize.call(this, map);

		// Set options to the default unless already set
		options.selectedPathOptions = options.selectedPathOptions || this.options.selectedPathOptions;

		L.Util.setOptions(this, options);

		// Store the selectable layer group for ease of access
		this._featureGroup = this.options.featureGroup;
		this._backupLayerGroup = new L.LayerGroup([]);


		if (!(this._featureGroup instanceof L.FeatureGroup)) {
			throw new Error('options.featureGroup must be a L.FeatureGroup');
		}


		this._uneditedLayerProps = {};

		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.SplitToolbar.Split.TYPE;
	},

	enable: function () {
		if (this._enabled) { return; }

		L.Handler.prototype.enable.call(this);
		//empty the _splitFeatures array when enabled
		this._splitFeatures = [];
				
		this._backupLayerGroup = new L.LayerGroup();
		var backupLayerGroup = this._backupLayerGroup;

		//backup the current layers
		this._featureGroup.eachLayer(function (layer) {
			backupLayerGroup.addLayer(layer);
		});


		this._featureGroup
			.on('layeradd', this._enableLayerSplit, this)
			.on('layerremove', this._disableLayerSplit, this);

		this.fire('enabled', {handler: this.type});
	},

	disable: function () {
		if (!this._enabled) { return; }

		this.fire('disabled', {handler: this.type});
		
		this._featureGroup
			.off('layeradd', this._enableLayerEdit)
			.off('layerremove', this._disableLayerEdit);

		//this._featureGroup = this._backedupLayers;

		L.Handler.prototype.disable.call(this);
	},
	

	addHooks: function () {
		if (this._map) {

			this._featureGroup.eachLayer(this._enableLayerSplit, this);

			this._tooltip = new L.Tooltip(this._map);
			this._tooltip.updateContent({ text: 'Click on line to split.', subtext: 'Click cancel to undo changes.' });

			this._map.on('mousemove', this._onMouseMove, this);
		}
	},

	removeHooks: function () {
		if (this._map) {
			
			this._featureGroup.eachLayer(this._disableLayerSplit, this);

			this._tooltip.dispose();
			this._tooltip = null;

			this._map.off('mousemove', this._onMouseMove);
		}
	},

	revertLayers: function () {

		var layersToRevert = this._splitFeatures;
		var featureGroup = this._featureGroup;

		for (var i = 0; i < layersToRevert.length; i++) {
			var childLayers = layersToRevert[i].childLayers;
			for (var j = 0; j < childLayers.length; j++) {
				featureGroup.removeLayer(childLayers[j]);
			}
		}

		this._backupLayerGroup.eachLayer(function (layer) {
			featureGroup.addLayer(layer);
		});

	
	},

	save: function () {
		this._map.fire('draw:split', {splitLayers: this._splitFeatures});

	},


	_enableLayerSplit: function (e) {
		var layer = e.layer || e.target || e;
			
		layer.on('click', this._splitLayer, this);
	},

	_splitLayer: function (e) {
		var layer = e.layer || e.target || e;
		
		//clone the coordinates (because we want to keep the original layer un modified)
		
		var coords = [];
		var latlngs = layer.getLatLngs();
		for (var i = 0; i < latlngs.length;i++) {
			coords.push(latlngs[i]);
		}
		
		var closestPoint = this._closestPointOnLine(coords, e.latlng);
		var first = coords.splice(0, closestPoint.index + 1);
		first.push(closestPoint.latlng);

		var second = coords;
		second.unshift(closestPoint.latlng);

		var firstSection = new L.Polyline(first);
		var secondSection = new L.Polyline(second);

		this._featureGroup.addLayer(firstSection);
		this._featureGroup.addLayer(secondSection);
		
		this._addToTrackingLayer(layer, firstSection, secondSection);
		
		this._featureGroup.removeLayer(layer);

	},

	_closestPointOnLine: function (latlngs, latlng) {
		
		var closestPoint = {};
		var smallestDistance = 0;
		var savedIndex = 0;

		for (var i = 0; i < latlngs.length - 1; i++) {
			var p = new L.Point(latlng.lng, latlng.lat);
			var p1 = new L.Point(latlngs[i].lng, latlngs[i].lat);
			var p2 = new L.Point(latlngs[i + 1].lng, latlngs[i + 1].lat);
		
			if (i === 0) {
				smallestDistance = L.LineUtil.pointToSegmentDistance(p, p1, p2);
				closestPoint = L.LineUtil.closestPointOnSegment(p, p1, p2);
			} else {
				if (L.LineUtil.pointToSegmentDistance(p, p1, p2) < smallestDistance) {
					smallestDistance = L.LineUtil.pointToSegmentDistance(p, p1, p2);
					closestPoint = L.LineUtil.closestPointOnSegment(p, p1, p2);
					savedIndex = i;
				}
			}
			
		}
		
		var closestLatLng = new L.LatLng(closestPoint.y, closestPoint.x);
		return { latlng: closestLatLng, index : savedIndex };
	},

	_addToTrackingLayer: function (preSplitLayer, firstSection, secondSection) {
		var splitFeature = {};
		splitFeature.childLayers = [];
		splitFeature.parentLayer = preSplitLayer;
		splitFeature.childLayers.push(firstSection);
		splitFeature.childLayers.push(secondSection);
		this._splitFeatures.push(splitFeature);
	},

	_disableLayerSplit: function (e) {
		var layer = e.layer || e.target || e;
		layer.split = false;
		layer.off('click', this._splitLayer);
	},

	_onMarkerDragEnd: function (e) {
		var layer = e.target;
	},

	_onMouseMove: function (e) {
		this._tooltip.updatePosition(e.latlng);
	}
});