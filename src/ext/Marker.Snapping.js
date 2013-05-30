L.Marker.include({
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
    return latlng;
  }
  
});