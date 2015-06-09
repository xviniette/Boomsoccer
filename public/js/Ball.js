var Ball = function(json){
	this.room;

	this.name;

	this.x = 0;
	this.y = 0;
	this.cx = 0;
	this.cy = 0;
	this.rx = 0;
	this.ry = 0;
	this.dx = 0;
	this.dy = 0;

	this.radius = 10;
	this.rapport = this.radius/20;

	this.kick = {x:20,y:-10};
	this.up = {x:5,y:40};

	this.gravity = 1.1;
	this.friction = {x:0.95,y:0.9};
	this.bounce = {x:0.8,y:0.8};

	this.positions = [];

	this.sprite = null;

	this.init(json);
}

Ball.prototype = Object.create(Objet.prototype);

Ball.prototype.init = function(json){
	for(var i in json){
		this[i] = json[i];
	}
}

Ball.prototype.setCoordinate = function(x, y){
	var tilesize = this.room.map.tilesize;
	this.x = x;
	this.y = y;

	this.cx = Math.floor(x/tilesize);
	this.cy = Math.floor(y/tilesize);

	this.rx = (x-this.cx*tilesize)/tilesize;
	this.ry = (y-this.cy*tilesize)/tilesize;
}

Ball.prototype.update = function(){
	this.physic();
	this.saveState(Date.now(), 200);
	if(isServer){
		var goal = this.hasGoalCollision(this.cx, this.cy);
		if(goal){
			this.room.goal(goal);
		}
	}
}

//effets
Ball.prototype.kicked = function(direction){
	var delta = this.room.deltaTime;
	this.dx = direction * delta * this.kick.x;
	this.dy = delta * this.kick.y;
}

Ball.prototype.uped = function(direction){
	var delta = this.room.deltaTime;
	this.dx = (this.dx + (direction * delta)) * this.up.x;
	this.dy = - delta * this.up.y;
}


Ball.prototype.hasWallCollision = function(cx, cy){
	tiles = this.room.map.tiles;
	if(cx < 0 || cx >= tiles.length || cy < 0 || cy >= tiles[cx].length){
		return true;
	}
	return (tiles[cx][cy] === 1);
}

Ball.prototype.hasWarpCollision = function(cx, cy){
	//test collision warp, si c'est le cas, on donne position nouveau warp
	tiles = this.room.map.tiles;
	if(tiles[cx] && tiles[cx][cy] && typeof tiles[cx][cy] == "string" && tiles[cx][cy].substr(0, 1) == "w" && tiles[cx][cy].length > 1){
		var vals = tiles[cx][cy].split(";");
		return {cx:parseInt(vals[1]),cy:parseInt(vals[2])};
	}
	return false;
}

Ball.prototype.hasObjectCollision = function(obj){
	var distance = Math.sqrt(Math.pow(obj.x - this.x, 2) + Math.pow(obj.y - this.y, 2));
	if(distance <= this.radius + obj.radius){
		var d = Math.round(distance * 100)/100;
		return d > 0 ? d : 1
	}
	return false;
}

Ball.prototype.hasGoalCollision = function(cx, cy){
	if(this.room.map.tiles[cx][cy] == 3){
		return 2;
	}
	if(this.room.map.tiles[cx][cy] == 2){
		return 1;
	}
	return false;
}	


Ball.prototype.getSnapshotInfo = function(){
	return {
		radius:this.radius,
		x:this.x,
		y:this.y,
		dx:this.dx,
		dy:this.dy
	}
}