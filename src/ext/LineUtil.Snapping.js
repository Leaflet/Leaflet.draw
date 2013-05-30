L.Util.extend(L.LineUtil, {
  
  /**
   * Snap to all layers
   *
   * @param <Latlng> latlng - original position
   * @param <Number> id - leaflet unique id
   * @param <Object> opts - snapping options
   *
   * @return <Latlng> closest point
  */
  snapToLayers: function(latlng, id, opts) {
    var i, j, keys, feature, res, senitivity, vertexonly, layers, minDist, minPoint, map;
    
    sensitivity = opts.sensitivity || 10;
     vertexonly = opts.vertexonly || false;
         layers = opts.layers || [];
        minDist = Infinity;
       minPoint = latlng;
            map = opts.layers[0]._map; // @todo check for undefined
    
    for (i = 0; i < opts.layers.length; i++) {
      keys = Object.keys(opts.layers[i]._layers);
      for (j = 0; j < keys.length; j++) {
        feature = opts.layers[i]._layers[keys[j]];
        
        // Don't even try snapping to itself!
        if (id === feature._leaflet_id) { continue; }
        
        // Marker
        if (feature instanceof L.Marker) {
          res = this._snapToLatlngs(latlng, [feature.getLatLng()], map, sensitivity, vertexonly, minDist);
          
        // Polyline
        } else if (feature instanceof L.Polyline) {
          res = this._snapToLatlngs(latlng, feature.getLatLngs(), map, sensitivity, vertexonly, minDist);
        
        // MultiPolyline
        } else if (feature instanceof L.MultiPolyline) {
          console.error('Snapping to MultiPolyline is currently unsupported', feature);
          res = {'minDist': minDist, 'minPoint': minPoint};

        // Polygon
        } else if (feature instanceof L.Polygon) {
          res = this._snapToPolygon(latlng, feature, map, sensitivity, vertexonly, minDist);
        
        // MultiPolygon
        } else if (feature instanceof L.MultiPolygon) {
          res = this._snapToMultiPolygon(latlng, feature, map, sensitivity, vertexonly, minDist);
                  
        // Unknown
        } else {
          console.error('Unsupported snapping feature', feature);
          res = {'minDist': minDist, 'minPoint': minPoint};
        }
        
        if (res.minDist < minDist) {
          minDist = res.minDist;
          minPoint = res.minPoint;
        }
        
      }
    }
    
    return minPoint;
  },
  
  /**
   * Snap to Polygon
   *
   * @param <Latlng> latlng - original position
   * @param <L.Polygon> feature - 
   * @param <L.Map> map - 
   * @param <Number> sensitivity - 
   * @param <Boolean> vertexonly - 
   * @param <Number> minDist - 
   *
   * @return <Object> minDist and minPoint
  */
  _snapToPolygon: function(latlng, polygon, map, sensitivity, vertexonly, minDist) {
    var res, hole, minPoint;
    
    minPoint = null;
    
    res = this._snapToLatlngs(latlng, polygon.getLatLngs(), map, sensitivity, vertexonly, minDist);
    if (res.minDist < minDist) {
      minDist = res.minDist;
      minPoint = res.minPoint;
    }
    
    for (hole in polygon._holes) {
      res = this._snapToLatlngs(latlng, polygon._holes[hole], map, sensitivity, vertexonly, minDist);      
      if (res.minDist < minDist) {
        minDist = res.minDist;
        minPoint = res.minPoint;
      }
    }
    
    return {'minDist': minDist, 'minPoint': minPoint};
  },

  /**
   * Snap to MultiPolygon
   *
   * @param <Latlng> latlng - original position
   * @param <L.Polygon> feature - 
   * @param <L.Map> map - 
   * @param <Number> sensitivity - 
   * @param <Boolean> vertexonly - 
   * @param <Number> minDist - 
   *
   * @return <Object> minDist and minPoint
  */
  _snapToMultiPolygon: function(latlng, multipolygon, map, sensitivity, vertexonly, minDist) {
    var key, res, minPoint;
    
    minPoint = null;

    for (key in multipolygon._layers) {
      res = this._snapToPolygon(latlng, multipolygon._layers[key], map, sensitivity, vertexonly, minDist);

      if (res.minDist < minDist) {
        minDist = res.minDist;
        minPoint = res.minPoint;
      }
    }        

    return {'minDist': minDist, 'minPoint': minPoint};
  },


  /**
   * Snap to <Array> of <Latlang>
   *
   * @param <LatLng> latlng - cursor click
   * @param <Array> latlngs - array of <L.LatLngs> to snap to
   * @param <Object> opts - snapping options
   * @param <Boolean> isPolygon - if feature is a polygon
   *
   * @return <Object> minDist and minPoint
  */
  _snapToLatlngs: function (latlng, latlngs, map, sensitivity, vertexonly, minDist) {
    var tmpDist, minPoint, p, p1, p2, d2, p3, d3;
    
      p = map.latLngToLayerPoint(latlng);
     p1 = minPoint = null;
        
    for (var i in latlngs) {      
      p2 = map.latLngToLayerPoint(latlngs[i]);
      
      if (!vertexonly && p1 != null) {        
        tmpDist = L.LineUtil.pointToSegmentDistance(p, p1, p2);
        if (tmpDist < minDist && tmpDist <= sensitivity) {
          minDist = tmpDist;
          minPoint = map.layerPointToLatLng(L.LineUtil.closestPointOnSegment(p, p1, p2));
        }
      } else if ((d2 = p.distanceTo(p2)) && d2 <= sensitivity && d2 < minDist) {
        minDist = d2;
        minPoint = latlngs[i];
      }
      
      p1 = p2;
    }
    
    return {'minDist': minDist, 'minPoint': minPoint};
  }
    
});