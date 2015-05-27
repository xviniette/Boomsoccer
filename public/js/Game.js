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
			_this.maps.push(new Map(d));
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

Game.prototype.newRoom = function(){
	var room = new Room({id:nbRooms});
	room.map = this.maps[0];
	room.start();
	nbRooms++;
	this.rooms.push(room);
	return room;
}

Game.prototype.deleteRoom = function(roomId){
	for(var i in this.rooms){
		if(this.rooms[i].id == roomId){
			this.rooms.splice(i, 1);
		}
	}
}

Game.prototype.addMatch = function(p1, p2, ranked){
	var room = new Room({id:uuid.v1(), ranked:ranked});
	room.map = new Map(this.maps[0].getInitInfos());
	p1.team = 1;
	p2.team = 2;
	room.addPlayer(p1);
	room.addPlayer(p2);
	this.rooms.push(room);
	for(var i in room.players){
		Utils.messageTo(room.players[i].socket, "initRoom", room.getInitInfo());
	}
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

Game.prototype.getNbPlayers = function(){
	return Object.keys(this.players).length;
}