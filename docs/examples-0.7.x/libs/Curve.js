/*
 * Leaflet.curve v0.7.0 - a plugin for Leaflet mapping library. https://github.com/elfalem/Leaflet.curve
 * (c) elfalem 2015-2020
 */
/*
 * note that SVG (x, y) corresponds to (long, lat)
 */

L.Curve = L.Path.extend({
	options: {
	},

	initialize: function(path, options){
		L.setOptions(this, options);
		this._setPath(path);
	},

	// Added to follow the naming convention of L.Polyline and other Leaflet component classes:
	// (https://leafletjs.com/reference-1.6.0.html#polyline-setlatlngs)
	setLatLngs: function(path) {
		return this.setPath(path);
	},

	_updateBounds: function() {
		var tolerance = this._clickTolerance();
		var tolerancePoint = new L.Point(tolerance, tolerance);

		//_pxBounds is critical for canvas renderer, used to determine area that needs redrawing
		this._pxBounds = new L.Bounds([
			this._rawPxBounds.min.subtract(tolerancePoint),
			this._rawPxBounds.max.add(tolerancePoint)
		]);
	},

	getPath: function(){
		return this._coords;
	},

	setPath: function(path){
		this._setPath(path);
		return this.redraw();
	},

	getBounds: function() {
		return this._bounds;
	},

	_setPath: function(path){
		this._coords = path;
		this._bounds = this._computeBounds();
	},

	_computeBounds: function(){
		var bound = new L.LatLngBounds();
		var lastPoint;
		var lastCommand;
		var coord;
		for(var i = 0; i < this._coords.length; i++){
			coord = this._coords[i];
			if(typeof coord == 'string' || coord instanceof String){
				lastCommand = coord;
			}else if(lastCommand == 'H'){
				bound.extend([lastPoint.lat,coord[0]]);
				lastPoint = new L.latLng(lastPoint.lat,coord[0]);
			}else if(lastCommand == 'V'){
				bound.extend([coord[0], lastPoint.lng]);
				lastPoint = new L.latLng(coord[0], lastPoint.lng);
			}else if(lastCommand == 'C'){
				var controlPoint1 = new L.latLng(coord[0], coord[1]);
				coord = this._coords[++i];
				var controlPoint2 = new L.latLng(coord[0], coord[1]);
				coord = this._coords[++i];
				var endPoint = new L.latLng(coord[0], coord[1]);

				bound.extend(controlPoint1);
				bound.extend(controlPoint2);
				bound.extend(endPoint);

				endPoint.controlPoint1 = controlPoint1;
				endPoint.controlPoint2 = controlPoint2;
				lastPoint = endPoint;
			}else if(lastCommand == 'S'){
				var controlPoint2 = new L.latLng(coord[0], coord[1]);
				coord = this._coords[++i];
				var endPoint = new L.latLng(coord[0], coord[1]);

				var controlPoint1 = lastPoint;
				if(lastPoint.controlPoint2){
					var diffLat = lastPoint.lat - lastPoint.controlPoint2.lat;
					var diffLng = lastPoint.lng - lastPoint.controlPoint2.lng;
					controlPoint1 = new L.latLng(lastPoint.lat + diffLat, lastPoint.lng + diffLng);
				}

				bound.extend(controlPoint1);
				bound.extend(controlPoint2);
				bound.extend(endPoint);

				endPoint.controlPoint1 = controlPoint1;
				endPoint.controlPoint2 = controlPoint2;
				lastPoint = endPoint;
			}else if(lastCommand == 'Q'){
				var controlPoint = new L.latLng(coord[0], coord[1]);
				coord = this._coords[++i];
				var endPoint = new L.latLng(coord[0], coord[1]);

				bound.extend(controlPoint);
				bound.extend(endPoint);

				endPoint.controlPoint = controlPoint;
				lastPoint = endPoint;
			}else if(lastCommand == 'T'){
				var endPoint = new L.latLng(coord[0], coord[1]);

				var controlPoint = lastPoint;
				if(lastPoint.controlPoint){
					var diffLat = lastPoint.lat - lastPoint.controlPoint.lat;
					var diffLng = lastPoint.lng - lastPoint.controlPoint.lng;
					controlPoint = new L.latLng(lastPoint.lat + diffLat, lastPoint.lng + diffLng);
				}

				bound.extend(controlPoint);
				bound.extend(endPoint);

				endPoint.controlPoint = controlPoint;
				lastPoint = endPoint;
			}else{
				bound.extend(coord);
				lastPoint = new L.latLng(coord[0], coord[1]);
			}
		}
		return bound;
	},

	getCenter: function () {
		return this._bounds.getCenter();
	},

	// _update() is invoked by Path._reset()
	_update: function(){
		if (!this._map) { return; }

		// TODO: consider implementing this._clipPoints(); and this._simplifyPoints(); to improve performance
		this._updatePath();
	},

	_updatePath: function() {
		// the following can be thought of as this._renderer.updateCurve() in both SVG/Canvas renderers
		// similar to Canvas._updatePoly(), Canvas._updateCircle(), etc...
		if(this._usingCanvas){
			this._updateCurveCanvas();
		}else{
			this._updateCurveSvg();
		}
	},

	//_project() is invoked by Path._reset()
	_project: function() {
		var coord, lastCoord, curCommand, curPoint;

		this._points = [];

		for(var i = 0; i < this._coords.length; i++){
			coord = this._coords[i];
			if(typeof coord == 'string' || coord instanceof String){
				this._points.push(coord);
				curCommand = coord;
			}else {
				switch(coord.length){
					case 2:
						curPoint = this._map.latLngToLayerPoint(coord);
						lastCoord = coord;
					break;
					case 1:
						if(curCommand == 'H'){
							curPoint = this._map.latLngToLayerPoint([lastCoord[0], coord[0]]);
							lastCoord = [lastCoord[0], coord[0]];
						}else{
							curPoint = this._map.latLngToLayerPoint([coord[0], lastCoord[1]]);
							lastCoord = [coord[0], lastCoord[1]];
						}
					break;
				}
				this._points.push(curPoint);
			}
		}

		if(this._bounds.isValid()){
			var northWestLayerPoint = this._map.latLngToLayerPoint(this._bounds.getNorthWest());
			var southEastLayerPoint = this._map.latLngToLayerPoint(this._bounds.getSouthEast());
			this._rawPxBounds = new L.Bounds(northWestLayerPoint, southEastLayerPoint);
			this._updateBounds();
		}
	},

	_curvePointsToPath: function(points){
		var point, curCommand, str = '';
		for(var i = 0; i < points.length; i++){
			point = points[i];
			if(typeof point == 'string' || point instanceof String){
				curCommand = point;
				str += curCommand;
			}else{
				switch(curCommand){
					case 'H':
						str += point.x + ' ';
						break;
					case 'V':
						str += point.y + ' ';
						break;
					default:
						str += point.x + ',' + point.y + ' ';
						break;
				}
			}
		}
		return str || 'M0 0';
	},

	beforeAdd: function(map){
		L.Path.prototype.beforeAdd.call(this, map);

		this._usingCanvas = this._renderer instanceof L.Canvas;

		if(this._usingCanvas){
			this._pathSvgElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		}
	},

	onAdd: function(map){
		if(this._usingCanvas){
			// determine if dash array is set by user
			this._canvasSetDashArray = !this.options.dashArray;
		}

		L.Path.prototype.onAdd.call(this, map); // calls _update()

		if(this._usingCanvas){
			if(this.options.animate && typeof(TWEEN) === 'object'){
				this._normalizeCanvasAnimationOptions();

				this._tweenedObject = {offset: this._pathSvgElement.getTotalLength()};
				this._tween = new TWEEN.Tween(this._tweenedObject)
					.to({offset: 0}, this.options.animate.duration)
					// difference of behavior with SVG, delay occurs on every iteration
					.delay(this.options.animate.delay)
					.repeat(this.options.animate.iterations - 1)
					.onComplete(function(scope){
						return function(){
							scope._canvasAnimating = false;
						}
					}(this))
					.start();

				this._canvasAnimating = true;
				this._animateCanvas();
			}else{
				this._canvasAnimating = false;
			}
		}else{
			if(this.options.animate && this._path.animate){
				var length = this._svgSetDashArray();

				this._path.animate([
					{strokeDashoffset: length},
					{strokeDashoffset: 0}
				], this.options.animate);
			}
		}
	},

	// SVG specific logic
	_updateCurveSvg: function(){
		this._renderer._setPath(this, this._curvePointsToPath(this._points));

		if(this.options.animate){
			this._svgSetDashArray();
		}
	},

	_svgSetDashArray: function(){
		var path = this._path;
		var length = path.getTotalLength();

		if(!this.options.dashArray){
			path.style.strokeDasharray = length + ' ' + length;
		}
		return length;
	},

	// Needed by the `Canvas` renderer for interactivity
	_containsPoint: function(layerPoint) {
		return this._bounds.contains(this._map.layerPointToLatLng(layerPoint));
	},

	// Canvas specific logic below here
	_normalizeCanvasAnimationOptions: function(){
		var opts = {
			delay: 0,
			duration: 0,
			iterations:	1
		};
		if(typeof(this.options.animate) == "number"){
			opts.duration = this.options.animate;
		}else{
			if(this.options.animate.duration){
				opts.duration = this.options.animate.duration;
			}
			if(this.options.animate.delay){
				opts.delay =this.options.animate.delay;
			}
			if(this.options.animate.iterations){
				opts.iterations = this.options.animate.iterations;
			}
		}

		this.options.animate = opts;
	},

	_updateCurveCanvas: function(){
		var pathString = this._curvePointsToPath(this._points);
		this._pathSvgElement.setAttribute('d', pathString);

		if(this.options.animate && typeof(TWEEN) === 'object' && this._canvasSetDashArray){
			this.options.dashArray = this._pathSvgElement.getTotalLength() + '';
			this._renderer._updateDashArray(this);
		}

		this._curveFillStroke(new Path2D(pathString), this._renderer._ctx);
	},

	_animateCanvas: function(){
		TWEEN.update();
		
		// clear out area and re-render all layers
		this._renderer._updatePaths();

		if(this._canvasAnimating){
			this._animationFrameId = L.Util.requestAnimFrame(this._animateCanvas, this);
		}
	},

	// similar to Canvas._fillStroke(ctx, layer)
	_curveFillStroke: function (path2d, ctx) {		
		ctx.lineDashOffset = this._canvasAnimating ? this._tweenedObject.offset : 0.0;

		var options = this.options;

		if (options.fill) {
			ctx.globalAlpha = options.fillOpacity;
			ctx.fillStyle = options.fillColor || options.color;
			ctx.fill(path2d, options.fillRule || 'evenodd');
		}

		if (options.stroke && options.weight !== 0) {
			if (ctx.setLineDash) {
				ctx.setLineDash(this.options && this.options._dashArray || []);
			}
			ctx.globalAlpha = options.opacity;
			ctx.lineWidth = options.weight;
			ctx.strokeStyle = options.color;
			ctx.lineCap = options.lineCap;
			ctx.lineJoin = options.lineJoin;
			ctx.stroke(path2d);
		}
	},

	// path tracing logic below here
	trace: function(t){
		// initially map is undefined, but then null if curve was added and removed
		if(this._map === undefined || this._map === null)
		{
			return [];
		}

		t = t.filter(function(element){
			return element >= 0 && element <= 1;
		});

		var point, curCommand, curStartPoint, curEndPoint;
		var p1, p2, p3;
		var samples = [];
		for(var i = 0; i < this._points.length; i++){
			point = this._points[i];
			if(typeof point == 'string' || point instanceof String){
				curCommand = point;

				if(curCommand == 'Z'){
					samples = samples.concat(this._linearTrace(t, curEndPoint, curStartPoint));
				}
			}else{
				switch(curCommand){
					case 'M':
						curStartPoint = point;
						curEndPoint = point;
						break;
					case 'L':
					case 'H':
					case 'V':
						samples = samples.concat(this._linearTrace(t, curEndPoint, point));

						curEndPoint = point;
						break;
					case 'C':
						p1 = point;
						p2 = this._points[++i];
						p3 = this._points[++i];
						samples = samples.concat(this._cubicTrace(t, curEndPoint, p1, p2, p3));

						curEndPoint = p3;
						break;
					case 'S':
						p1 = this._reflectPoint(p2, curEndPoint);
						p2 = point;
						p3 = this._points[++i];
						samples = samples.concat(this._cubicTrace(t, curEndPoint, p1, p2, p3));

						curEndPoint = p3;
						break;
					case 'Q':
						p1 = point;
						p2 = this._points[++i];
						samples = samples.concat(this._quadraticTrace(t, curEndPoint, p1, p2));

						curEndPoint = p2;
						break;
					case 'T':
						p1 = this._reflectPoint(p1, curEndPoint);
						p2 = point;
						samples = samples.concat(this._quadraticTrace(t, curEndPoint, p1, p2));

						curEndPoint = p2;
						break;
					default:
						break;
				}
			}
		}
		return samples;
	},
	_linearTrace: function(t, p0, p1){
		var self = this;
		return t.map(function(interval) {
			var x = self._singleLinearTrace(interval, p0.x, p1.x);
			var y = self._singleLinearTrace(interval, p0.y, p1.y);
			return self._map.layerPointToLatLng([x, y]);
		});
	},
	_quadraticTrace: function(t, p0, p1, p2){
		var self = this;
		return t.map(function(interval) {
			var x = self._singleQuadraticTrace(interval, p0.x, p1.x, p2.x);
			var y = self._singleQuadraticTrace(interval, p0.y, p1.y, p2.y);
			return self._map.layerPointToLatLng([x, y]);
		});
	},
	_cubicTrace: function(t, p0, p1, p2, p3){
		var self = this;
		return t.map(function(interval) {
			var x = self._singleCubicTrace(interval, p0.x, p1.x, p2.x, p3.x);
			var y = self._singleCubicTrace(interval, p0.y, p1.y, p2.y, p3.y);
			return self._map.layerPointToLatLng([x, y]);
		});
	},
	_singleLinearTrace: function(t, p0, p1){
		return p0 + t * (p1 - p0);
	},
	_singleQuadraticTrace: function(t, p0, p1, p2){
		var oneMinusT = 1 - t;
		return Math.pow(oneMinusT, 2) * p0 +
		2 * oneMinusT * t * p1 +
		Math.pow(t, 2) * p2;
	},
	_singleCubicTrace: function(t, p0, p1, p2, p3){
		var oneMinusT = 1 - t;
		return Math.pow(oneMinusT, 3) * p0 +
		3 * Math.pow(oneMinusT, 2) * t * p1 +
		3 * oneMinusT * Math.pow(t, 2) * p2 +
		Math.pow(t, 3) * p3;
	},
	_reflectPoint: function(point, over){
		x = over.x + (over.x - point.x);
		y = over.y + (over.y - point.y);
		return L.point(x, y);
	}
});

L.curve = function (path, options){
	return new L.Curve(path, options);
};
