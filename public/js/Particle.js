var Particle = function(data){
	// data = {sprite, x, y, w, h, life}
	this.sprite = data.sprite;
	this.x = data.x || 0;
	this.y = data.y || 0;
	this.width = data.w || 0;
	this.height = data.h || 0;
	this.life = data.life || 0;
}

Particle.prototype.draw = function(ctx, center, middleScreen){
	if(this.life > 0){
		var getRelativePosition = function(x, y){
			return {x:x+(middleScreen.x - center.x), y:y+(middleScreen.y - center.y)};
		}
		var position = getRelativePosition(this.x, this.y);
		this.sprite.draw(ctx, position.x, position.y, this.width, this.height);
		this.life--;
	}
}