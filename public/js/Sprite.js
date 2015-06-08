var Sprite = function(data){
	// data = {img, name, startx, starty, width, height, animation, fps, opt loop}
	this.img = data.img;
	this.name = data.name;
	this.startX = data.x || 0;
	this.startY = data.y || 0;
	this.width = data.w;
	this.height = data.h;
	this.transitions = data.animation;
	this.fps = data.fps;
	this.loop = data.loop || true;
	this.nbLoop = 0;

	this.index = 0;
	this.lastChangeTransiTime = 0;
}

Sprite.prototype.draw = function(ctx, x, y, width, height){
	if(Date.now() > this.lastChangeTransiTime + 1000/this.fps){
		//changement de transition
		this.index++;
		if(this.index >= this.transitions.length){
			if(this.loop){
				this.nbLoop++;
				this.index = 0;
			}else{
				this.index = this.transitions.length-1;
				if(this.nbLoop == 0){
					this.nbLoop++;
				}
			}
		}
		this.lastChangeTransiTime = Date.now();
	}
		
	var w = this.width;
	if(width){
		w = width;
	}
	var h = this.height;
	if(height){
		h = height;
	}
	ctx.drawImage(this.img, this.startX + this.transitions[this.index] * this.width, this.startY, this.width, this.height, x, y, w, h);
}