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
		this._featureGroup.eachLayer( function (layer) {
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

		//need to reverse the order, so we unsplit each segment, building back to the original

		for (var i=0; i < layersToRevert.length; i++) {
			var childLayers = layersToRevert[i].childLayers;
			for (var j=0; j < childLayers.length; j++) {
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
		for (var i=0; i< latlngs.length;i++) {
			coords.push(latlngs[i]);
		}
		
				
		for (var i=0; i<coords.length - 1; i++) {		
			var line = [];
			line[0] = coords[i];
			line[1] = coords[i+1];
			//not a huge fan of this method, ideally we want to make the split point
			//on the normal (90 degrees) from the e.latlng down to the line.  At the moment
			//this will fail if two lines are within the tolerance supplied of the e.latlng
			if (this._isOnLine(line, e.latlng,0.000075)) {
				//we have found the segment to split at
				first = coords.splice(0,i + 1);
				first.push(e.latlng);

				second = coords;
				second.unshift(e.latlng);
				
				break;
			}
			
		}


		var firstSection = new L.Polyline(first);
		var secondSection = new L.Polyline(second);

		this._featureGroup.addLayer(firstSection);
		this._featureGroup.addLayer(secondSection);
		
		this._addToTrackingLayer(layer, firstSection, secondSection);
		
		this._featureGroup.removeLayer(layer);	

	},

	_addToTrackingLayer: function (preSplitLayer, firstSection, secondSection) {
		var splitFeature = {};
		splitFeature.childLayers = [];
		splitFeature.parentLayer = preSplitLayer;
		splitFeature.childLayers.push(firstSection);
		splitFeature.childLayers.push(secondSection);
		this._splitFeatures.push(splitFeature);	
	},


	_isOnLine: function (line, latlng, tolerance) {
		var p1 = new L.Point(line[0].lng,line[0].lat);
		var p2 = new L.Point(line[1].lng,line[1].lat);
		var p = new L.Point(latlng.lng,latlng.lat);
		var distance = L.LineUtil.pointToSegmentDistance(p,p1,p2);
		if (distance < tolerance) {
			return true;
		} else {
			return false;
		}
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