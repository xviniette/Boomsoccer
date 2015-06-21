var Particle = function(data){
	// data = {sprite, x, y, w, h, life}
	this.sprite = data.sprite;
	this.x = data.x || 0;
	this.y = data.y || 0;
	this.width = data.w || 0;
	this.height = data.h || 0;
	this.life = data.life || 0;
}

Particle.prototype.draw = function(ctx, display){
	if(this.life > 0){
		var position = display.getRelativePosition(this.x, this.y);
		this.sprite.draw(ctx, position.x, position.y, this.width, this.height);
		this.life--;
	}
}