var Renderer = {};

Renderer.pathtracer = function(opts) {

	this.defaults = {
		traceDepth: 6
	}
	this.options = extend(this.defaults, opts);

	this.getOrtho = function(v) {
		return Math.abs(v.elements[0]) > Math.abs(v.elements[2]) ? 
			$V([-v.elements[1], v.elements[0], 0.0]) :
			$V([0.0, -v.elements[2], v.elements[1]]);
	}

	this.rand2D = function() {
		globals.seed2d = globals.seed2d.add($V([-1, 1]));
		var r = $V([
			(Math.sin(globals.seed2d.dot($V([12.9898, 78.233]))) * 43758.5453) % 1,
			(Math.cos(globals.seed2d.dot($V([14.898,7.23]))) * 23421.631) % 1
		]);
		return r;
	}

	this.getRandomVectorInHemisphere = function(normal) {
		var o1 = this.getOrtho(normal);
		var o2 = normal.cross(o1);
		var r  = this.rand2D();

		r.elements[0] = r.elements[0] * 2.0 * Math.PI;

		var oneminus = Math.sqrt(1.0 - r.elements[1] * r.elements[1]);

		var v1 = o1.multiply(oneminus * Math.cos(r.elements[0]));
		var v2 = o2.multiply(oneminus * Math.sin(r.elements[0]));
		var v3 = normal.multiply(r.elements[1]);

		var finalVector = v1.add(v2.add(v3));

		if( finalVector.dot(normal) < 0 ) {
			finalVector = finalVector.multiply(-1);
		}

		return finalVector;
	}

	this.getBackground = function(direction) {
		return new Color(1.0);
	}

	this.getColorForRay = function(initialRay, luminance, depth) {
		
		var Albedo = 1.2;
		var matColor = 0.45;

		if( depth === undefined ) {
			depth = 0;
		}

		if( luminance === undefined ) {
			luminance = new Color(1.0);
		}

		if( depth < this.options.traceDepth ) {

			globals.seed2d = globals.seed2d.multiply(depth + 1);

			var intersection = initialRay.cast(Engine.objects);

			if( intersection ) {
				var hitPosition = intersection.ray.lastHitPosition;
				var hitNormal = intersection.ray.lastHitNormal;

				var newDir = this.getRandomVectorInHemisphere(hitNormal);
				luminance = luminance.multiply( 2.0 * matColor * Albedo * newDir.dot(hitNormal) );
				var newOrigin = hitPosition.add(hitNormal.multiply(MIN_VECTOR_DIST_ADD * 2));

				var newRay = new Ray(newOrigin, newDir);
				
				return this.getColorForRay(newRay, luminance, depth + 1);
			}
		}
			
		return luminance.multiply(this.getBackground(initialRay.direction));
	}
}

Renderer.zBuffer = function(opts) {

	this.defaults = {
		minDepth: 0,
		maxDepth: 20 
	}
	this.options = extend(this.defaults, opts);

	this.getColorForRay = function(initialRay) {
		var intersection = initialRay.cast(Engine.objects);

		if( intersection ) {

			var hitPosition = intersection.ray.origin.add(intersection.ray.direction.multiply(intersection.distance));
			var zValue = hitPosition.elements[2];

			if( zValue < this.options.minDepth ) {
				zValue = this.options.minDepth;
			}
			if( zValue > this.options.maxDepth ) {
				zValue = this.options.maxDepth;
			}
			zValue /= (this.options.maxDepth - this.options.minDepth);

			return new Color(zValue);
		}

		return new Color(0.0);
	}
}