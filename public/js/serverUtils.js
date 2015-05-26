var Utils = {};

//Réactions au événemments

Utils.onLogin = function(data, socket){
	//data = {login, password}
	var _this = this;
	if(data.login && data.password && data.login.length > 0 && data.password.length > 0){
		db.query("SELECT * FROM users WHERE login = ? AND password = ?", [data.login, data.password], function(e, r, f){
			if(r.length > 0){
				var res = r[0];
				var alreadyOnline = false;
				for(var i in game.players){
					if(game.players[i].id == res.id){
						alreadyOnline = true;
						break;
					}
				}
				
				if(alreadyOnline){
					var p = game.players[i];
					_this.messageTo(p.socket, "login", true);
					p.socket = socket.id;
					socket.emit("playerID", p.id);
				}else{
					var p = new Player({id:res.id,socket:socket.id,pseudo:res.login,elo:res.elo});
					socket.emit("playerID", p.id);
					game.addPlayer(p);
					io.emit("nbPlayers", game.getNbPlayers());
					game.rooms[0].addPlayer(p);
					p.room = game.rooms[0];
					p.setCoordinate(p.room.map.player.x, p.room.map.player.y);
					for(var i in game.rooms[0].players){
						if(game.rooms[0].players[i].id != p.id){
							_this.messageTo(game.rooms[0].players[i].socket, "newPlayer", p.getInitInfo());
						}
					}
				}
				socket.emit("initRoom", p.room.getInitInfo());
			}
		});
	}
}

Utils.onSignin = function(data, socket){
	//data = {login, password}
	if(data.login && data.password && data.login.length > 0 && data.password.length > 0){
		db.query("SELECT * FROM users WHERE login = ?;", [data.login], function(e, r, f){
			if(r.length == 0){
				//inscription ok
				var d = {login:data.login, password:data.password, elo:1000};
				db.query("INSERT INTO users SET ?", d, function(e, r, f){
					console.log("ok");
				});
			}
		});
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
	if(io.sockets.connected[socket]){
		io.sockets.connected[socket].emit(type, message);
	}
}