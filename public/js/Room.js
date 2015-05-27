var Room = function(json){
	this.id;
	this.name;

	this.map;
	this.ball;
	this.players = [];
	this.idBomb = 1;
	this.bombs = [];

	this.ranked = false;
	this.score = {"1":0, "2":0};

	this.nbGoal = 10;

	this.fps = FPS;
	this.deltaTime = 1/this.fps;

	this.networkfps = NETWORKFPS;
	this.deltaNetwork = 1/this.networkfps;

	this.iterateur = 0;
	this.lastFrame = Date.now();
	this.lastFrameNetwork = Date.now();

	this.init(json);
}

Room.prototype.init = function(json){
	for(var i in json){
		this[i] = json[i];
	}
}

Room.prototype.start = function(){
	this.newBall();
}

Room.prototype.update = function(){
	var now = Date.now();
	var d = this.deltaTime * 1000;
	while(now - this.lastFrame >= d){
		this.physic();
		this.lastFrame += d;
	}

	var dn = this.deltaNetwork * 1000;
	while(now - this.lastFrameNetwork >= dn){
		this.sendSnapshot();
		this.lastFrameNetwork += dn;
	}
}

Room.prototype.physic = function(){
	for(var i in this.players){
		this.players[i].update();
	}
	for(var i in this.bombs){
		this.bombs[i].update();
	}
	if(this.ball != null){
		this.ball.update();
	}
}

Room.prototype.sendSnapshot = function(){
	var snap = this.getSnapshotInfo();
	for(var i in this.players){
		Utils.messageTo(this.players[i].socket, "snapshot", JSON.stringify(snap));
	}
}

Room.prototype.addPlayer = function(p){
	this.players.push(p);
}

Room.prototype.deletePlayer = function(p){
	for(var i in this.players){
		if(this.players[i].id == p.id){
			this.players.splice(i, 1);
			break;
		}
	}
}

Room.prototype.newBall = function(){
	this.ball = new Ball({room:this});
	var coord = this.map.balls[Math.round(Math.random() * (this.map.balls.length - 1))];
	this.ball.setCoordinate(coord.x, coord.y);
}

Room.prototype.goal = function(team){
	this.ball = null;
	this.score[team]++;
	for(var i in this.players){
		Utils.messageTo(this.players[i].socket, "goal", {team:team, score:this.score[team]});
	}
	var _this = this;
	if(this.score[team] == this.nbGoal){
		//Fin de partie répartition gain elo etc
		this.endMatch();
	}else{
		if(this.score["1"] + this.score["2"] == this.nbGoal - 1){
			//changement de side
			this.changeSide();
			for(var i in this.players){
				Utils.messageTo(this.players[i].socket, "changeSide", "");
			}
		}
		//réapparition de la balle
		setTimeout(function(){
			_this.newBall();
		}, 3000);
	}
}

Room.prototype.endMatch = function(){

}

Room.prototype.newBomb = function(player){
	var bomb = new Bomb({room:this,id:this.idBomb});
	this.idBomb++;
	bomb.setCoordinate(player.x, player.y);
	bomb.player = player;
	if(!player.onGround){
		bomb.dx = bomb.jumpCreation.x * player.direction * this.deltaTime;
		bomb.dy = bomb.jumpCreation.y * this.deltaTime;
	}
	this.bombs.push(bomb);
}

Room.prototype.deleteBomb = function(pID){
	for(var i in this.bombs){
		if(this.bombs[i].player.id == pID){
			this.bombs.splice(i, 1);
			return;
		}
	}
}

Room.prototype.changeSide = function(){
	for(var i in this.map.tiles){
		for(var j in this.map.tiles[i]){
			if(this.map.tiles[i][j] == 3){
				this.map.tiles[i][j] = 2;
			}else if(this.map.tiles[i][j] == 2){
				this.map.tiles[i][j] = 3;
			}
		}
	}
}

Room.prototype.getInitInfo = function(){
	var data = {};
	data.map = this.map.getInitInfos();
	data.name = this.name;
	data.score = this.score;
	data.players = [];
	for(var i in this.players){
		data.players.push(this.players[i].getInitInfo());
	}
	return data;
}

Room.prototype.getSnapshotInfo = function(){
	var data = {};
	data.players = [];
	for(var i in this.players){
		data.players.push(this.players[i].getSnapshotInfo());
	}
	data.bombs = [];
	for(var i in this.bombs){
		data.bombs.push(this.bombs[i].getSnapshotInfo());
	}
	if(this.ball){
		data.ball = this.ball.getSnapshotInfo();
	}
	return data;
}
