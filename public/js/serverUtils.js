var Utils = {};

//Réactions au événemments

Utils.onLogin = function(data, socket){
	var pseudoPris = false;
	for(var i in game.players){
		if(game.players[i].pseudo == data){
			pseudoPris = true;
			socket.emit("login", false);
		}
	}
	if(!pseudoPris){
		var p = new Player({id:nbClients,socket:socket.id,pseudo:data});
		nbClients++;
		socket.emit("playerID", p.id);
		game.addPlayer(p);
		io.emit("nbPlayers", game.getNbPlayers());

		game.rooms[0].addPlayer(p);
		p.room = game.rooms[0];
		p.setCoordinate(game.rooms[0].map.player.x, game.rooms[0].map.player.y);
		socket.emit("initRoom", game.rooms[0].getInitInfo());
		for(var i in game.rooms[0].players){
			if(game.rooms[0].players[i].id != p.id){
				this.messageTo(game.rooms[0].players[i].socket, "newPlayer", p.getInitInfo());
			}
		}
	}
}

Utils.onKeyboard = function(data, socket){
	var p = game.getPlayerBySocket(socket.id);
	if(!p){return;}
	if(p.room){
		p.inputs.push(JSON.parse(data));
	}
}

Utils.onTchat = function(data, socket){
	var p = game.getPlayerBySocket(socket.id);
	if(!p){return;}
	if(p.room){	
		for(var i in p.room.players){
			this.messageTo(p.room.players[i].socket, "tchat", {pID:p.id, pseudo:p.pseudo, message:data});
		}
	}
}


Utils.onDisconnect = function(socket){
	var p = game.getPlayerBySocket(socket.id);
	if(!p){return;}
	if(p.room){
		p.room.deletePlayer(p);
	}
	game.deletePlayer(socket.id);
	for(var i in game.rooms[0].players){
		this.messageTo(game.rooms[0].players[i].socket, "deletePlayer", {id:p.id});
	}
	io.emit("nbPlayers", game.getNbPlayers());
}


Utils.messageTo = function(socket, type, message){
	io.sockets.connected[socket].emit(type, message);
}