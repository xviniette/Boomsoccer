var Particle = function(data){
	// data = {sprite, x, y, w, h, life}
	this.sprite = data.sprite;
	this.x = data.x || 0;
	this.y = data.y || 0;
	this.width = data.w || 0;
	this.height = data.h || 0;
	this.life = data.life || 0;
}

Particle.prototype.draw = function(ctx, center, middleScreen, display){
	if(this.life > 0){
		var getRelativePosition = function(x, y){
			var tilesize = display.client.room.map.tilesize * display.scale;
			if(center.x < middleScreen.x){
				center.x = middleScreen.x;
			}else if(display.client.room.map.tiles.length * tilesize - center.x < middleScreen.x){
				center.x = display.client.room.map.tiles.length * tilesize - middleScreen.x;
			}
			if(center.y < middleScreen.y){
				center.y = middleScreen.y;
			}else if(display.client.room.map.tiles[0].length * tilesize - center.y < middleScreen.y){
				center.y = display.client.room.map.tiles[0].length * tilesize - middleScreen.y;
			}
			return {x:x+(middleScreen.x - center.x), y:y+(middleScreen.y - center.y)};
		}
		var position = getRelativePosition(this.x, this.y);
		this.sprite.draw(ctx, position.x, position.y, this.width, this.height);
		this.life--;
	}
}