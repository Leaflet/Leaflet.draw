/**
 * Transform based on a 3 x 3 matrix manipulation (covers rotation, translation and scaling).
 */
L.AffineTransform = L.Class.extend({

    initialize: function (options) {
        this._array = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        this._pre = options.pre || function(x) {return x;};
        this._post = options.post || function(x) {return x;};
        this._angle = 0;
    },

    scale: function (sx, sy) {
        this._array = this._multiply([[sx, 0, 0], [0, sy, 0], [0, 0, 1]], this._array);
        return this;
    },

    translate: function (dx, dy) {
        this._array = this._multiply([[1, 0, dx], [0, 1, dy], [0, 0, 1]], this._array);
        return this;
    },


    rotate: function (angle) {
        var cos = Math.cos(angle), sin = Math.sin(angle);
        this._array = this._multiply([[cos, -sin, 0], [sin, cos, 0], [0, 0, 1]], this._array);
        this._angle += angle;
        return this;
    },

    move: function(pt1, pt2) {
        pt1 = this._pre(pt1);
        pt2 = this._pre(pt2);
        return this.translate(pt2.x - pt1.x, pt2.y - pt1.y);
    },

    rotateFrom: function (fromAngle, origin, pt) {
        origin = this._pre(origin);
        pt = this._pre(pt);
        var angle = Math.atan2(pt.y - origin.y, pt.x - origin.x);
        return this.translate(-origin.x, -origin.y).
            rotate(angle - fromAngle).
            translate(origin.x, origin.y);
    },

    resize: function(origin, pt1, pt2) {
        origin = this._pre(origin);
        pt1 = this._pre(pt1);
        pt2 = this._pre(pt2);

        // translate so the opposite corner becomes the new origin
        this.translate(-origin.x, -origin.y);

        // resizing by moving corner pt1 to pt2 is now a simple scale operation along x and y-axis
        var f = this._applyPts(pt1);
        var t = this._applyPts(pt2);
        var scaleX = (t.x / f.x);
        var scaleY = (t.y / f.y);

        // guard against zero-division or too small values
        if(!isFinite(scaleX) || Math.abs(scaleX) < 1E-7) {
            scaleX = 1;
        }
        if (!isFinite(scaleY) || Math.abs(scaleY) < 1E-7) {
            scaleY = 1;
        }
        // perform the scale operation and translate back
        return this.scale(scaleX, scaleY).translate(origin.x, origin.y);
    },

    getAngle: function () {
        return this._angle;
    },

    apply: function (pts) {
        return this._post(this._applyPts(this._pre(pts)));
    },

    _applyPts : function (pts) {
        if (L.Util.isArray(pts)) {
            var result = [], i, length = pts.length;
            for (i = 0; i < length; i++) {
                result.push(this._applyPts(pts[i]));
            }
            return result;
        } else {
            var xyz = this._applyXYZ([pts.x, pts.y, 1]);
            return L.point(xyz[0], xyz[1]);
        }
    },

    _applyXYZ: function (xyz) {
        var result = [], i, j, sum;
        for (i = 0; i < 3; i++) {
            result[i] = 0;
            for (j = 0; j < 3; j++) {
                result[i] += this._array[i][j]*xyz[j];
             }
        }
        return result;
    },

    _multiply: function (m1, m2) {
        var result = [], i, j, sum;
        for (i = 0; i < 3; i++) {
            result[i] = [];
            for (j = 0; j < 3; j++) {
                result[i][j] = 0;
                for (k = 0; k < 3; k++) {
                    result[i][j] += m1[i][k] * m2[k][j];
                }
            }
        }
        return result;
    }

});
