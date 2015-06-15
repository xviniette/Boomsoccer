var Game = function(){
	this.players = {};
	this.rooms = [];
	this.maps = [];
	this.matchmaking = new Matchmaking(this);

}

Game.prototype.update = function(){
	for(var i in this.rooms){
		this.rooms[i].update();
	}
}

Game.prototype.updateSnapshot = function(){
	for(var i in this.rooms){
		this.rooms[i].sendSnapshot();
	}
}

Game.prototype.loadMaps = function(callback){
	var _this = this;
	db.query("SELECT * FROM maps", function(e, r, f){
		for(var i in r){
			var d = JSON.parse(r[i]["informations"]);
			d.id = r[i]['id'];
			d = JSON.stringify(d);
			_this.maps.push(d);
		}
		callback();
	});
}

Game.prototype.addPlayer = function(player){
	this.players[player.socket] = player;
}

Game.prototype.deletePlayer = function(socket){
	delete this.players[socket];
}

Game.prototype.initialRoom = function(){
	//Ajout de la room d'accueil
	var mapLobby = '{"name":"Accueil","tiles":[[1,1,1,1,1,1,1,1,1,1,"w;18;10","w;18;11",1,1,1,1,1,1,1,1,1,1,1,1,1],[1,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,1,1,1,1,1,1],[1,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,1,1,1,1],[1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,1,1],[1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,1],[1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1],[1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,1,0,0,0,1],[1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,1,1,0,0,1,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,1,0,0,0,1],["w",0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,"w;9;1"],["w",0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,"w;10;1"],[1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,1,0,0,0,1],[1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,1,1,0,0,1,0,0,0,1],[1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,1,0,0,0,1],[1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1],[1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,1],[1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,1,1],[1,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,1,1,1,1],[1,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1,"w;1;10","w;1;11",1,1,1,1,1,1,1,1,1,1,1,1,1]],"tilesize":20,"balls":[{"x":200,"y":180}],"player":{"x":200,"y":300}}';
	var room = new Room({id:uuid.v1(), ranked:false, name:"Accueil", spawningBall:false, spawningBomb:false, nbGoal:-1, score:{"1":"", "2":""}});
	room.map = new Map(JSON.parse(mapLobby));
	room.start();
	this.rooms.push(room);
}

Game.prototype.deleteRoom = function(roomId){
	for(var i in this.rooms){
		if(this.rooms[i].id == roomId){
			this.rooms.splice(i, 1);
		}
	}
}

Game.prototype.addRanked = function(p1, p2){
	p1.room.deletePlayer(p1);
	p2.room.deletePlayer(p2);
	var room = new Room({id:uuid.v1(), ranked:true, name:p1.pseudo+" VS "+p2.pseudo});
	room.map = new Map(JSON.parse(this.maps[Math.floor(Math.random() * this.maps.length)]));
	room.addPlayer(p1, 1);
	room.addPlayer(p2, 2);
	room.start();
	this.rooms.push(room);
}


Game.prototype.getPlayerBySocket = function(socket){
	if(this.players[socket]){
		return this.players[socket];
	}
	return null;
}

Game.prototype.getPlayerById = function(id){
	for(var i in this.players){
		if(this.players[i].id == id){
			return this.players[i];
		}
	}
	return null;
}

Game.prototype.getRoom = function(id){
	for(var i in this.rooms){
		if(this.rooms[i].id == id){
			return this.rooms[i];
		}
	}
	return null;
}

Game.prototype.getSpectableRooms = function(){
	var d = [];
	for(var i in this.rooms){
		var r = this.rooms[i];
		if(r.ranked){
			var avgElo = 0;for(var j = 0; j < r.players.length; j++){avgElo+=r.players[j].elo;}avgElo = Math.round(avgElo/j);
			d.push({id:r.id, name:r.name, score:r.score, elo:avgElo, map:{id:r.map.id, name:r.map.name}});
		}
	}
	return d;
}

Game.prototype.getNbPlayers = function(){
	return Object.keys(this.players).length;
}