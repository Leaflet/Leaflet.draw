L.Util.extend(L.LineUtil, {
	/**
	 * Get closes point on a line
	 *
	 * @param <Point> a - line start
	 * @param <Point> b - line end
	 * @param <Point> p - point to messure from
	 *
	 * @return <Point> 
	 *
	 * @source http://www.gamedev.net/topic/444154-closest-point-on-a-line/
	 */
	getClosestPoint: function (A, B, P) {
		var AP = P.subtract(A);
		var AB = B.subtract(A);
		
		var ab2 = AB.x*AB.x + AB.y*AB.y;
		var ap_ab = AP.x*AB.x + AP.y*AB.y;
		
		var t = ap_ab / ab2;
		
		if (t < 0.0) t = 0.0;
		else if (t > 1.0) t = 1.0;
		
		return A.add(AB.multiplyBy(t));
	}
});