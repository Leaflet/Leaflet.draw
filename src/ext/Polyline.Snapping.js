L.Polyline.include({
  /**
   * Temporarily snapping variables
   */
  _snapVars: {
    map       : null,
    minPoint  : null,
    minDist   : null    
  },

  /**
   * Snap to function
   *
   * @param <LatLng> latlng - cursor click
   *
   * @return <LatLng> - snapped to
   *
   * @todo find the closest point before returning?
   */
  snapTo: function (latlng) {
    var layers = this.options.snapping.layers;    
    this._snapVars.minPoint = latlng;
    this._snapVars.minDist = Infinity;
    
    // Loop through layers
    for (var l1 in layers) {
      //console.log(layers[l1]);
      for (var l2 in layers[l1]._layers) {
        this._snapVars.map = layers[l1]._layers[l2]._map;
        if (typeof layers[l1]._layers[l2]._latlngs !== "undefined") {
          if (layers[l1]._layers[l2]._leaflet_id !== this._leaflet_id) {
            // Polygon
            if (typeof layers[l1]._layers[l2]._holes !== 'undefined') {
              var latlngs = layers[l1]._layers[l2]._latlngs.slice(0);
              latlngs.push(latlngs[0]);
              this._snapToObject(latlng, latlngs, true);
              // Polygon Holes
              for (var i in layers[l1]._layers[l2]._holes) {
                this._snapToObject(latlng, layers[l1]._layers[l2]._holes[i], true);
              }
            // Polyline
            } else {
              this._snapToObject(latlng, layers[l1]._layers[l2]._latlngs, false);
            }
          }
        } else if (typeof layers[l1]._layers[l2]._layers !== "undefined") {
          for (var l3 in layers[l1]._layers[l2]._layers) {
            if (layers[l1]._layers[l2]._layers[l3]._leaflet_id !== this._leaflet_id) {
              // Polygon
              if (typeof layers[l1]._layers[l2]._layers[l3]._holes !== 'undefined') {
                var latlngs = layers[l1]._layers[l2]._layers[l3]._latlngs.slice(0);
                latlngs.push(latlngs[0]);
                this._snapToObject(latlng, latlngs, true);
                // Polygon Holes
                for (var i in layers[l1]._layers[l2]._layers[l3]._holes) {
                  this._snapToObject(latlng, layers[l1]._layers[l2]._layers[l3]._holes[i], true);
                }
              // Polyline
              } else {
                this._snapToObject(latlng, layers[l1]._layers[l2]._layers[l3]._latlngs, false);
              }
            }
          }
        } 
      }
    }
    
    return this._snapVars.minPoint;
  },
  
  /**
   * Snap to object
   *
   * @param <LatLng> latlng - cursor click
   * @param <Array> latlngs - array of <L.LatLngs> to snap to
   * @param <Boolean> isPolygon - if feature is a polygon
  */
  _snapToObject: function (latlng, latlngs, isPolygon) {
    var sensitivity = this.options.snapping.sensitivity
          lastPoint = null,
                map = this._snapVars.map;
    
    for (var j in latlngs) {
      var ll = latlngs[j],
          p1 = map.latLngToLayerPoint(latlng),
          p2 = map.latLngToLayerPoint(ll);
      
      if (lastPoint != null && !this.options.snapping.vertexonly) {
        p3 = L.LineUtil.getClosestPoint(lastPoint, p2, p1, false);
        var tmpDist = p1.distanceTo(p3);
        if (tmpDist <= sensitivity && tmpDist < this._snapVars.minDist) {
          this._snapVars.minDist = tmpDist;
          this._snapVars.minPoint = map.layerPointToLatLng(p3);
        }
      } else if (p1.distanceTo(p2) <= sensitivity && p1.distanceTo(p2) < this._snapVars.minDist) {
        this._snapVars.minDist = p1.distanceTo(p2);
        this._snapVars.minPoint = ll;
      }
      
      lastPoint = p2;
    }
  }
});