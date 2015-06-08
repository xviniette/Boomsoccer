var Bomb = function(json){
	this.room;

	this.id;

	this.x = 0;
	this.y = 0;
	this.cx = 0;
	this.cy = 0;
	this.rx = 0;
	this.ry = 0;
	this.dx = 0;
	this.dy = 0;

	this.radius = 7;
	this.rapport = this.radius/20;

	this.player;

	this.kick = {x:20,y:-10};
	this.up = {x:5,y:40};
	this.jumpCreation = {x:15,y:-5};

	this.creationTime = Date.now(); 
	this.timeExplosion = 1200;
	this.radiusExplosion = 50;
	this.powerExplosion = {min:5, max:20};

	this.gravity = 1.1;
	this.friction = {x:0.95,y:0.9};
	this.bounce = {x:0,y:0.8};

	this.positions = [];

	this.sprite = null;

	this.init(json);
}

Bomb.prototype = Object.create(Objet.prototype);

Bomb.prototype.init = function(json){
	for(var i in json){
		this[i] = json[i];
	}
}

Bomb.prototype.setCoordinate = function(x, y){
	var tilesize = this.room.map.tilesize;
	this.x = x;
	this.y = y;

	this.cx = Math.floor(x/tilesize);
	this.cy = Math.floor(y/tilesize);

	this.rx = (x-this.cx*tilesize)/tilesize;
	this.ry = (y-this.cy*tilesize)/tilesize;
}

Bomb.prototype.update = function(){
	this.physic();
	if(Date.now() > this.creationTime + this.timeExplosion){
		this.explosion();
	}
}


//effets

Bomb.prototype.kicked = function(direction){
	this.getDistance(this.player);
	var delta = this.room.deltaTime;
	this.dx = direction * delta * this.kick.x;
	this.dy = delta * this.kick.y;
}

Bomb.prototype.uped = function(direction){
	var delta = this.room.deltaTime;
	this.dx = (this.dx + (direction * delta)) * this.up.x;
	this.dy = - delta * this.up.y;
}

Bomb.prototype.explosion = function(){
	var delta = this.room.deltaTime;
	if(this.room.ball){
		var d = this.getDistance(this.room.ball);
		if(d <= this.radiusExplosion){
			var dir = this.getDirection(this.room.ball);
			this.room.ball.dx += this.powerExplosion.max * dir.x * delta;
			this.room.ball.dy += this.powerExplosion.max * dir.y * delta;
		}
	}

	for(var i in this.room.players){
		var p = this.room.players[i];
		var d = this.getDistance(p);
		if(d <= this.radiusExplosion){
			var dir = this.getDirection(p);
			p.dx += this.powerExplosion.max * dir.x * delta;
			p.dy += this.powerExplosion.max * dir.y * delta;
			p.toStun(1 - d/this.radiusExplosion);
		}
	}
	this.room.deleteBomb(this.player.id);
}

Bomb.prototype.getDistance = function(obj){
	return Math.sqrt(Math.pow(obj.x - this.x, 2) + Math.pow(obj.y - this.y, 2));
}

Bomb.prototype.getAngle = function(obj){
	return Math.atan2(obj.y - this.y, obj.x - this.x) * 180 / Math.PI;
}

Bomb.prototype.getDirection = function(obj){
	var distx = Math.abs(obj.x - this.x);
	var disty = Math.abs(obj.y - this.y);
	var px = distx/(distx + disty);
	var py = 1 - px;
	var signex = 1;
	if(obj.x < this.x){
		signex = -1;
	}
	signey = 1;
	if(obj.y < this.y){
		signey = -1;
	}
	return {"x":px*signex,"y":py*signey};
}

//banal

Bomb.prototype.hasWallCollision = function(cx, cy){
	tiles = this.room.map.tiles;
	if(cx < 0 || cx >= tiles.length || cy < 0 || cy >= tiles[cx].length){
		return true;
	}
	return (tiles[cx][cy] === 1);
}

Bomb.prototype.hasWarpCollision = function(cx, cy){
	//test collision warp, si c'est le cas, on donne position nouveau warp
	tiles = this.room.map.tiles;
	if(tiles[cx] && tiles[cx][cy] && typeof tiles[cx][cy] == "string" && tiles[cx][cy].substr(0, 1) == "w" && tiles[cx][cy].length > 1){
		var vals = tiles[cx][cy].split(";");
		return {cx:parseInt(vals[1]),cy:parseInt(vals[2])};
	}
	return false;
}

Bomb.prototype.hasObjectCollision = function(obj){
	var distance = Math.sqrt(Math.pow(obj.x - this.x, 2) + Math.pow(obj.y - this.y, 2));
	if(distance <= this.radius + obj.radius){
		var d = Math.round(distance * 100)/100;
		return d > 0 ? d : 1
	}
	return false;
}


Bomb.prototype.getSnapshotInfo = function(){
	return {
		id:this.id,
		radius:this.radius,
		x:this.x,
		y:this.y
	}
}