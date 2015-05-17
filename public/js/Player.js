var Player = function(json){
	this.room;

	this.id;
	this.pseudo;
	this.socket;

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

	this.gravity = 1.2;
	this.friction = {x:0.3,y:0.9};
	this.bounce = {x:0,y:0};

	this.stun = 0;
	this.timestun = {min:1000, max:5000};

	this.speed = 10;
	this.jump = 40;

	this.direction = -1 //-1 left; 1 right;
	this.onGround = false; //sur le sol

	this.inputs = [];
	this.lastInput = null;

	this.init(json);
}

Player.prototype = Object.create(Objet.prototype);

Player.prototype.init = function(json){
	for(var i in json){
		this[i] = json[i];
	}
}

Player.prototype.update = function(){
	var delta = this.room.deltaTime;
	var tilesize = this.room.map.tilesize;
	var tiles = this.room.map.tiles;

	if(this.isStun()){
		this.friction = {x:0.95,y:0.9};
		this.bounce = {x:0.5,y:0.5};
	}else{
		this.friction = {x:0.3,y:0.9};
		this.bounce = {x:0,y:0};
	}


	for(var i in this.inputs){
		var inp = this.inputs[i];
		if(!this.isStun()){
			if(inp.u){
				if(this.onGround){
					this.dy = -this.jump * delta;
				}
			}
			if(inp.l){
				this.dx = -this.speed * delta;
				this.direction = -1;
			}
			if(inp.r){
				this.dx = this.speed * delta;
				this.direction = 1;
			}
			if(inp.k && this.lastInput != null && this.lastInput.k == false){
				this.kick();
			}
			if(inp.d && this.lastInput != null && this.lastInput.d == false){
				this.up();
			}
		}
		this.lastInput = inp;
		this.physic();
	}
	this.inputs = [];
}

Player.prototype.isStun = function(){
	return Date.now() < this.stun;
}

Player.prototype.toStun = function(ratio){
	this.stun = Date.now() + (this.timestun.max - this.timestun.min) * ratio + this.timestun.min;
}


//effets

Player.prototype.kick = function(){
	//appui taper : taper ball && || taper bombe XOR poser bombe
	var tape = false;
	if(this.room.ball && this.hasObjectCollision(this.room.ball)){
		//collision ballon
		this.room.ball.kicked(this.direction);
		tape = true;
	}
	for(var i in this.room.bombs){
		if(this.hasObjectCollision(this.room.bombs[i])){
			//collision bombe -> on tape la bombe dans la direction
			tape = true;
			this.room.bombs[i].kicked(this.direction);
		}
	}
	if(!tape){
		//pose bombe -> on check s'il n'a pas déjà une bombe puis on la crée en fonction de l'état (en l'air)
		var abombe = false;
		for(var i in this.room.bombs){
			if(this.room.bombs[i].player.id == this.id){
				abombe = true;
				break;
			}
		}
		if(!abombe){
			this.room.newBomb(this);
		}
	}
}

Player.prototype.up = function(){
	if(this.room.ball && this.hasObjectCollision(this.room.ball)){
		//collision ballon
		this.room.ball.uped(this.direction);
	}
	for(var i in this.room.bombs){
		if(this.hasObjectCollision(this.room.bombs[i])){
			//collision bombe
			this.room.bombs[i].uped(this.direction);
		}
	}
}

//COMMUN

Player.prototype.hasWallCollision = function(cx, cy){
	tiles = this.room.map.tiles;
	if(cx < 0 || cx >= tiles.length || cy < 0 || cy >= tiles[cx].length){
		return true;
	}
	return (tiles[cx][cy] == 1);
}

Player.prototype.hasWarpCollision = function(cx, cy){
	//test collision warp, si c'est le cas, on donne position nouveau warp
	tiles = this.room.map.tiles;
	if(tiles[cx] && tiles[cx][cy] && typeof tiles[cx][cy] == "string" && tiles[cx][cy].substr(0, 1) == "w" && tiles[cx][cy].length > 1){
		var vals = tiles[cx][cy].split(";");
		return {cx:parseInt(vals[1]),cy:parseInt(vals[2])};
	}
	return false;
}

Player.prototype.hasObjectCollision = function(obj){
	var distance = Math.sqrt(Math.pow(obj.x - this.x, 2) + Math.pow(obj.y - this.y, 2));
	if(distance <= this.radius + obj.radius){
		var d = Math.round(distance * 100)/100;
		return d > 0 ? d : 1
	}
	return false;
}



Player.prototype.getInitInfo = function(){
	return {
		id:this.id,
		pseudo:this.pseudo,
		radius:this.radius,
		x:this.x,
		y:this.y
	};
}

Player.prototype.getSnapshotInfo = function(){
	var seq = 0;
	if(this.lastInput && this.lastInput.seq){
		seq = this.lastInput.seq;
	}
	return {
		id:this.id,
		x:this.x,
		y:this.y,
		seq:seq
	};
}