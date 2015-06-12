var Objet = function(){
	this.room;
	this.x = 0;
	this.y = 0;
	this.cx = 0;
	this.cy = 0;
	this.rx = 0;
	this.ry = 0;
	this.dx = 0;
	this.dy = 0;
	this.radius = 1;
	this.rapport = 1;
}

Objet.prototype.setCoordinate = function(x, y){
	var tilesize = this.room.map.tilesize;
	this.x = x;
	this.y = y;

	this.cx = Math.floor(x/tilesize);
	this.cy = Math.floor(y/tilesize);

	this.rx = (x-this.cx*tilesize)/tilesize;
	this.ry = (y-this.cy*tilesize)/tilesize;
}

Objet.prototype.physic = function(){
	var delta = this.room.deltaTime;
	var tilesize = this.room.map.tilesize;
	var tiles = this.room.map.tiles;
	//gestion du X
	this.rx += this.dx;
	this.dx *= this.friction.x;
	this.dx = Math.round(this.dx * 10000)/10000;

	if(!(this.hasWallCollision(this.cx, this.cy) && this.cx > 0 && this.cx < tiles.length - 1)){
		//si pas bloqué
		if(this.hasWallCollision(this.cx - 1, this.cy) && this.rx < this.rapport && this.dx < 0){
			//collision gauche
			this.dx *= this.bounce.x * -1;
			this.rx = this.rapport;
		}
		if(this.hasWallCollision(this.cx + 1, this.cy) && this.rx > 1 - this.rapport && this.dx > 0){
			//collision droite
			this.dx *= this.bounce.x * -1;
			this.rx = 1 - this.rapport;
		}
	}

	//On met les bonnes valeurs pour rx/cx
	while(this.rx < 0){this.rx++;this.cx--;}
	while(this.rx > 1){this.rx--;this.cx++;}

	//gestion du Y
	this.onGround = false;
	this.dy += this.gravity * delta;
	this.ry += this.dy;
	this.dy *= this.friction.y;
	this.dy = Math.round(this.dy * 10000)/10000;

	if(((this.hasWallCollision(this.cx, this.cy + 1) && this.ry > 1 - this.rapport) || //dessous
		(this.hasWallCollision(this.cx + 1, this.cy + 1) && this.ry > 1 - this.rapport && this.rx > 1 - this.rapport/2) || //gauche dessous
		(this.hasWallCollision(this.cx - 1, this.cy + 1) && this.ry > 1 - this.rapport && this.rx < this.rapport/2)) //droite dessous
		&& this.dy >= 0 && !this.hasWallCollision(this.cx, this.cy)){
		//collision en dessous
	this.dy *= this.bounce.y * -1;
	this.ry = 1 - this.rapport;
	this.onGround = true;
}

	//On met les bonnes valeurs pour ry/cy
	while(this.ry < 0){this.ry++;this.cy--;}
	while(this.ry > 1){this.ry--;this.cy++;}

	warp = this.hasWarpCollision(this.cx, this.cy);
	if(warp){
		this.cx = warp.cx;
		this.cy = warp.cy;
	}

	//On arrondi
	this.rx = Math.round(this.rx * 100)/100;
	this.ry = Math.round(this.ry * 100)/100;

	this.x = Math.floor((this.cx + this.rx) * tilesize);
	this.y = Math.floor((this.cy + this.ry) * tilesize);
}

Objet.prototype.interpolate = function(tps){
	var interptime = tps - INTERPOLATION;
	var limitDistance = 200;
	for(var i = 0; i < this.positions.length - 1; i++){
		if(this.positions[i].t <= interptime && this.positions[i + 1].t >= interptime){
			var distance = Math.sqrt(Math.pow(this.positions[i + 1].x - this.positions[i].x, 2) + Math.pow(this.positions[i + 1].y - this.positions[i].y, 2));
			if(distance <= limitDistance){
				var ratio = (interptime - this.positions[i].t)/(this.positions[i + 1].t - this.positions[i].t);
				var x = Math.round(this.positions[i].x + ratio * (this.positions[i + 1].x - this.positions[i].x));
				var y = Math.round(this.positions[i].y + ratio * (this.positions[i + 1].y - this.positions[i].y));
				if(this.direction){
					if(this.x > x){
						this.direction = -1;
					}else if(this.x < x){
						this.direction = 1;
					}
				}
				this.x = x;
				this.y = y;
			}
			this.positions.splice(0, i - 1);
			break;
		}
	}
}

Objet.prototype.hasWallCollision = function(cx, cy){
	tiles = this.room.map.tiles;
	if(cx < 0 || cx >= tiles.length || cy < 0 || cy >= tiles[cx].length){
		return true;
	}
	return (tiles[cx][cy] === 1);
}

Objet.prototype.hasWarpCollision = function(cx, cy){
	//test collision warp, si c'est le cas, on donne position nouveau warp
	tiles = this.room.map.tiles;
	if(tiles[cx] && tiles[cx][cy] && typeof tiles[cx][cy] == "string" && tiles[cx][cy].substr(0, 1) == "w" && tiles[cx][cy].length > 1){
		var vals = tiles[cx][cy].split(";");
		return {cx:parseInt(vals[1]),cy:parseInt(vals[2])};
	}
	return false;
}

Objet.prototype.hasObjectCollision = function(obj){
	var distance = Math.sqrt(Math.pow(obj.x - this.x, 2) + Math.pow(obj.y - this.y, 2));
	if(distance <= this.radius + obj.radius){
		var d = Math.round(distance * 100)/100;
		return d > 0 ? d : 1
	}
	return false;
}

Objet.prototype.isOutsideMap = function(){
	var tilesize = this.room.map.tilesize;
	var tiles = this.room.map.tiles;
	if(this.x < 0 || this.x > tiles.length * tilesize || this.y > tiles[0].length * tilesize){
		return true;
	}
	return false;
}

Objet.prototype.saveState = function(tps, limit){
	//tps temps courrant, limit temps maximum (ms) dans le buffer
	if(this.positions){
		this.positions.push({t:tps, x:this.x, y:this.y, radius: this.radius});
	}
	if(this.positions[0] && this.positions[0].t < tps - limit){
		this.positions.splice(0, 1);
	}
}

Objet.prototype.getTimeState = function(tps){
	var min = -1;
	var minIndex = 0;
	if(this.positions && this.positions.length > 0){
		for(var i in this.positions){
			var ecart = Math.abs(tps - this.positions[i].t);
			if(min == -1 || ecart <= min){
				min = ecart;
				minIndex = i;
			}else{
				return this.positions[minIndex];
			}
		}
	}
	//On retourne la position actuelle si pas de systeme de position
	return {x:this.x, y:this.y, radius: this.radius};
}