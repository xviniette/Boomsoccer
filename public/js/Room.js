var Room = function(json){
	this.id;
	this.name;
	this.password;

	this.map;
	this.ball;
	this.players = [];
	this.idBomb = 1;
	this.bombs = [];

	this.spectators = [];

	this.ranked = false;
	this.score = {"1":0, "2":0};

	this.pollBall = [];

	this.nbGoal = 5;
	this.spawningBall = true;
	this.spawningBomb = true;

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
	var _this = this;
	setTimeout(function(){
		_this.newBall();
	}, 8000);
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
	var _this = this;
	var now = Date.now();
	//nombre de joueur déco
	var nbDisconnectedPlayers = 0;
	for(var i in this.players){
		this.players[i].update();
		if(this.players[i].isOutsideMap()){
			//Joueurs en dehors de la map
			this.players[i].setCoordinate(_this.map.player.x, _this.map.player.y);
		}
		if(!this.players[i].isConnected){
			nbDisconnectedPlayers++;
		}
	}
	//Si tous le joueurs déco et pas game initiale
	if((this.players.length == 0 && this.id != 0) || (nbDisconnectedPlayers > 0 && nbDisconnectedPlayers == this.players.length)){
		this.endMatch(-1); // On clos la game et tous les joueurs sont perdants
		return;
	}
	for(var i in this.bombs){
		this.bombs[i].update();
	}
	if(this.ball != null){
		this.ball.update();
		if(this.ball && this.ball.isOutsideMap()){
			//Si balle bloqué
			_this.newBall();
		}
	}
}

Room.prototype.sendSnapshot = function(){
	var snap = JSON.stringify(this.getSnapshotInfo());
	for(var i in this.players){
		Utils.messageTo(this.players[i].socket, "snapshot", snap);
	}
	for(var i in this.spectators){
		Utils.messageTo(this.spectators[i].socket, "snapshot", snap);
	}
}

Room.prototype.addPlayer = function(p, team){
	if(team){
		p.team = team;
	}else{
		p.team = 0;
	}
	var toAdd = true;
	for(var i in this.players){
		if(this.players[i].id == p.id){
			toAdd = false;
			break;
		}
	}
	if(isServer){
		if(toAdd){
			for(var i in this.players){
				Utils.messageTo(this.players[i].socket, "newPlayer", p.getInitInfo());
				Utils.messageTo(this.players[i].socket, "information", p.pseudo+" a rejoint la partie.");
			}
			for(var i in this.spectators){
				Utils.messageTo(this.spectators[i].socket, "newPlayer", p.getInitInfo());
				Utils.messageTo(this.spectators[i].socket, "information", p.pseudo+" a rejoint la partie.");
			}
			p.room = this;
			p.reset();
			p.setCoordinate(this.map.player.x, this.map.player.y);
			this.players.push(p);
			Utils.messageTo(p.socket, "initRoom", this.getInitInfo());
			if(this.ranked){
				Utils.messageTo(p.socket, "information", "Le premier à "+this.nbGoal+" gagne le match !");
				Utils.messageTo(p.socket, "information", "Lorsque que "+(this.nbGoal - 1)+" buts seront marqué, les cages changent de côté.");
			}
		}
		
	}else{
		if(toAdd){
			this.players.push(p);
		}
	}
}

Room.prototype.deletePlayer = function(p){
	var del = false;
	for(var i in this.players){
		if(this.players[i].id == p.id){
			this.players.splice(i, 1);
			del = true;
		}
	}
	if(isServer){
		if(del){
			p.room = null;
			for(var i in this.players){
				Utils.messageTo(this.players[i].socket, "deletePlayer", {id:p.id});
				Utils.messageTo(this.players[i].socket, "information", p.pseudo+" quitte la partie.");
			}
			for(var i in this.spectators){
				Utils.messageTo(this.spectators[i].socket, "deletePlayer", {id:p.id});
				Utils.messageTo(this.spectators[i].socket, "information", p.pseudo+" quitte la partie.");
			}
		}
	}
	return del;
}

Room.prototype.isPlayer = function(p){
	for(var i in this.players){
		if(this.players[i].id == p.id){
			return true;
		}
	}
	return false;
}

Room.prototype.addSpectator = function(p){
	var toAdd = true;
	for(var i in this.spectators){
		if(this.spectators[i].id == p.id){
			toAdd = false;
			break;
		}
	}
	if(isServer){
		if(toAdd){
			p.room = this;
			this.spectators.push(p);
			Utils.messageTo(p.socket, "initRoom", this.getInitInfo());
			for(var i in this.players){
				Utils.messageTo(this.players[i].socket, "information", p.pseudo+" observe la partie.");
			}
			for(var i in this.spectators){
				Utils.messageTo(this.spectators[i].socket, "information", p.pseudo+" observe la partie.");
			}
		}
	}else{
		if(toAdd){
			this.spectators.push(p);
		}
	}
}

Room.prototype.deleteSpectator = function(p){
	if(isServer){
		for(var i in this.spectators){
			if(this.spectators[i].id == p.id){
				p.room = null;
				this.spectators.splice(i, 1);
				for(var i in this.players){
					Utils.messageTo(this.players[i].socket, "information", p.pseudo+" n'observe plus la partie.");
				}
				for(var i in this.spectators){
					Utils.messageTo(this.spectators[i].socket, "information", p.pseudo+" n'observe plus la partie.");
				}
				break;
			}
		}
	}
}

Room.prototype.playerLeave = function(p){
	if(this.isPlayer(p)){
		//Player
		if(this.ranked){
			//Abandon
			this.giveUp(p);
		}else{
			this.deletePlayer(p);
		}
	}else{
		//spectator
		this.deleteSpectator(p);
	}
}

Room.prototype.newBall = function(){
	if(!this.spawningBall){
		return;
	}
	this.ball = new Ball({room:this});
	var coord = this.map.balls[Math.round(Math.random() * (this.map.balls.length - 1))];
	this.ball.setCoordinate(coord.x, coord.y);
}

Room.prototype.pollNewBall = function(p){
	var _this = this;
	var nBall = false;
	if(this.ball && this.ball.isOutsideMap()){
		//Si ball hors map on autorise la demande de recréation balle
		nBall = true;
	}else{
		//Sinon on peut respawn la ball
		var present = false;
		for(var i in this.pollBall){
			if(this.pollBall[i] == p.id){
				present = true;
				break;
			}
		}
		if(!present){
			this.pollBall.push(p.id);
			//On averti les autres
			for(var i in this.players){
				Utils.messageTo(this.players[i].socket, "information", p.pseudo+" vote /ball.");
			}
		}

		if(this.pollBall.length >= Math.ceil((this.players.length + 1)/2)){
			//si assez de joueur
			nBall = true;
		}else{
			//Sinon on regarde sur le nombre de joueurs encore co (si ya du déco)
			var nbPlayerConnected = 0;
			for(var i in this.players){
				if(this.players[i].isConnected){
					nbPlayerConnected++;
				}
			}
			if(this.pollBall.length >= Math.ceil((nbPlayerConnected + 1)/2)){
				nBall = true;
			}
		}
	}

	if(nBall){
		setTimeout(function(){
			_this.pollBall = [];
			_this.newBall();
		}, 5000);
	}
}

Room.prototype.goal = function(team){
	this.ball = null;
	this.score[team]++;
	for(var i in this.players){
		Utils.messageTo(this.players[i].socket, "goal", {team:team, score:this.score[team]});
	}
	for(var i in this.spectators){
		Utils.messageTo(this.spectators[i].socket, "goal", {team:team, score:this.score[team]});
	}
	var _this = this;
	if(this.score[team] == this.nbGoal){
		//Fin de partie répartition gain elo etc
		this.endMatch(team);
	}else{
		if(this.score["1"] + this.score["2"] == this.nbGoal - 1){
			//changement de side
			this.changeSide();
			for(var i in this.players){
				Utils.messageTo(this.players[i].socket, "changeSide", "");
				Utils.messageTo(this.players[i].socket, "information", "LES CAGES CHANGENT DE CÔTE !");
			}
			for(var i in this.spectators){
				Utils.messageTo(this.spectators[i].socket, "changeSide", "");
			}
		}
		//réapparition de la balle
		setTimeout(function(){
			_this.newBall();
		}, 3000);
	}
}

Room.prototype.giveUp = function(p){
	if(p.team == 1){
		this.endMatch(2);
	}else{
		this.endMatch(1);
	}	
}

Room.prototype.endMatch = function(team){
	var scoreboard = this.getInitInfo();
	scoreboard.teamWin = team;
	scoreboard.players = [];
	if(this.ranked){
		var now = new Date();
		var date = now.getFullYear()+"-"+parseInt(now.getMonth() + 1)+"-"+now.getDate()+" "+now.getHours()+":"+now.getMinutes()+":"+now.getSeconds();
		var d = {name:this.name, user1:this.players[0].id, user2:this.players[1].id, map:this.map.id, score1:this.score["1"], score2:this.score["2"], date:date};
		db.query("INSERT INTO matchs SET ?", d, function(e, r, f){});

		teamFacingElo = {"1":this.players[1].elo, "2":this.players[0].elo};

		for(var i in this.players){
			this.players[i].played++;
			if(this.players[i].team == team){
				this.players[i].won++;
				var resultat = 1;
			}else{
				var resultat = 0;
			}
			var oldElo = this.players[i].elo;
			this.players[i].calcNewElo(teamFacingElo[this.players[i].team], resultat, Math.abs(this.score["1"] - this.score["2"]));
			this.players[i].dbSave();

			Utils.messageTo(this.players[i].socket, "information", (resultat == 1 ? "Victoire !" : "Défaite !")+" "+this.score["1"]+" - "+this.score["2"]+".");
			var playerData = this.players[i].getInitInfo();
			playerData.deltaElo = playerData.elo - oldElo;
			scoreboard.players.push(playerData);
		}
	}
	//On supprimes les joueurs de la room et ajoute à la room principale
	for(var i in this.players){
		if(this.players[i].isConnected){
			game.getInitRoom().addPlayer(this.players[i]);
			Utils.messageTo(this.players[i].socket, "scoreboard", scoreboard);
		}else{
			game.deletePlayer(this.players[i].socket);
		}
	}
	for(var i in this.spectators){
		game.getInitRoom().addPlayer(this.spectators[i]);
		Utils.messageTo(this.spectators[i].socket, "scoreboard", scoreboard);
	}
	game.deleteRoom(this.id);
	//On supprime la room
}

Room.prototype.newBomb = function(player){
	if(!this.spawningBomb){
		return;
	}
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
	var data = {
		id:this.id,
		name:this.name,
		score:this.score,
		nbGoal:this.nbGoal
	};
	data.map = this.map.getInitInfos();
	data.players = [];
	for(var i in this.players){
		data.players.push(this.players[i].getInitInfo());
	}
	return data;
}

Room.prototype.getSnapshotInfo = function(){
	var data = {};
	data.time = Date.now();
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