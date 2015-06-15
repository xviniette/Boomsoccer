var Particle = function(data){
	// data = {sprite, x, y, w, h, life}
	this.sprite = data.sprite;
	this.x = data.x || 0;
	this.y = data.y || 0;
	this.width = data.w || 0;
	this.height = data.h || 0;
	this.life = data.life || 0;
}

Particle.prototype.draw = function(ctx){
	if(this.life > 0){
		this.sprite.draw(ctx, this.x, this.y, this.width, this.height);
		this.life--;
	}
}