DebugSprite.prototype.update = function() {
	
}

/**
 * test class to draw a simple sprite for debugging purposes
 * @param x: our starting x coordinate
 * @param y: our starting y coordinate
 * @param imageName: our sprite image
 * @param cnv: our canvas
 * @param rot: our starting rotation
 */
function DebugSprite(x,y,imageName,cnv,rot) {
	this.x = x;
	this.y = y;
	this.image = imageName;
	this.canvas = cnv;
	this.rotation = rot;
}