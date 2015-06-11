var Utils = {};

//Réactions au événemments

//OK
Utils.onLogin = function(data, socket){
	//data = {login, password}
	var _this = this;
	if(data.login && data.password && data.login.length > 0 && data.password.length > 0){
		db.query("SELECT * FROM users WHERE pseudo = ? AND password = ?", [data.login, data.password], function(e, r, f){
			if(r.length > 0){
				var res = r[0];

				var p = game.getPlayerById(res.id);
				if(p == null){
					//Pas en ligne
					p = new Player({id:res.id,socket:socket.id,pseudo:res.pseudo,elo:res.elo,won:res.won,played:res.played});
					_this.messageTo(p.socket, "playerID", p.id);
					game.addPlayer(p);
					game.rooms[0].addPlayer(p);
				}else{
					//déjà en ligne --> on déco l'autre et on le remplace
					_this.messageTo(p.socket, "login", true);
					game.deletePlayer(socket.id);
					p.socket = socket.id;
					game.addPlayer(p);
					_this.messageTo(p.socket, "playerID", p.id);
					if(p.room){
						//Si room, on lui envoi les infos de la game
						_this.messageTo(p.socket, "initRoom", p.room.getInitInfo());
					}
				}	
			}
		});
	}
}

//OK
Utils.onSignin = function(data, socket){
	//data = {login, password}
	_this = this;
	if(data.login && data.password && data.login.length > 0 && data.password.length > 0){
		db.query("SELECT * FROM users WHERE pseudo = ?;", [data.login], function(e, r, f){
			//On vérifie pseudo non utilisé
			if(r.length == 0){
				//inscription ok
				var d = {pseudo:data.login, password:data.password, elo:1200, won:0, played:0};
				db.query("INSERT INTO users SET ?", d, function(e, r, f){
					//Insertion puis auto login
					_this.onLogin(data, socket);
				});
			}
		});
	}
}

//Ok
Utils.onKeyboard = function(data, socket){
	var p = game.getPlayerBySocket(socket.id);
	if(!p){return;}
	if(p.room){
		p.inputs.push(JSON.parse(data));
	}
}

//A revoir avec traitement coté client
Utils.onTchat = function(data, socket){
	var p = game.getPlayerBySocket(socket.id);
	if(!p){return;}
	if(data[0] && data[0] == "/"){
		var split = data.split(" ");
		switch(split[0]) {
			case "/w":
			//message privé
			if(split.length >= 3){
				var dest = null;
				for(var i in game.players){
					if(game.players[i].pseudo == split[1]){
						dest = game.players[i];
						break;
					}
				}
				if(p){
					var msg = data.slice(split[0].length+split[1].length+1);
					this.messageTo(dest.socket, "tchat", {type:"private", from:true, pID:p.id, pseudo:p.pseudo, message:msg});
					this.messageTo(p.socket, "tchat", {type:"private", from:false, pID:dest.id, pseudo:dest.pseudo, message:msg});
				}
			}
			break;
			case "/leave":
			//message privé
			this.onLeaveGame({}, socket);
			break;
		}
	}else{
		if(p.room){	
			for(var i in p.room.players){
				this.messageTo(p.room.players[i].socket, "tchat", {type:"general", pID:p.id, pseudo:p.pseudo, message:data});
			}
		}
	}
}

//OK
Utils.onMatchmaking = function(data, socket){
	var p = game.getPlayerBySocket(socket.id);
	if(!p){return;}
	if(!(p.room && p.room.ranked == true)){
		if(!game.matchmaking.isInQueue(p)){
			game.matchmaking.addPlayer(p);
		}else{
			game.matchmaking.removePlayer(p);
		}
	}
}

Utils.onSpectate = function(data, socket){
	var p = game.getPlayerBySocket(socket.id);
	if(!p){return;}
	if(!(p.room && p.room.ranked == true)){
		var room = game.getRoom(data.id);
		if(room){
			p.room.deletePlayer(p);
			room.addSpectator(p);
		}
	}
}

Utils.onLeaveGame = function(data, socket){
	var p = game.getPlayerBySocket(socket.id);
	if(!p){return;}
	if(p.room){
		if(p.room.isPlayer(p)){
			//Si joueur
			if(p.room.ranked){
				//si ranked pour l'instant on peut pas leave
			}else{
				p.room.deletePlayer(p);
				game.rooms[0].addPlayer(p);
			}
		}else{
			//Si spectateur
			p.room.deleteSpectator(p);
			game.rooms[0].addPlayer(p);
		}
	}
}

//Get Match en cours
Utils.onGetSpectableRooms = function(data, socket){
	socket.emit("spectableRooms", game.getSpectableRooms());
}

//Get joueurs
Utils.onGetPlayerProfil = function(data, socket){
	var _this = this;
	db.query("SELECT id, pseudo, elo, won, played FROM users WHERE pseudo = ?;", [data], function(e, r, f){
		if(r.length != 0){
			_this.messageTo(socket.id, "profile", r[0]);
		}
	});
}

//Get classement
Utils.onGetRanking = function(data, socket){
	var _this = this;
	db.query("SELECT id, pseudo, elo, won, played FROM users ORDER BY elo DESC;", [data], function(e, r, f){
		_this.messageTo(socket.id, "ranking", r);
	});
}

//OK à finir pour reconnexion en combat
Utils.onDisconnect = function(socket){
	var p = game.getPlayerBySocket(socket.id);
	if(!p){return;}
	//On l'enleve du matchmaking
	game.matchmaking.removePlayer(p);
	if(p.room){
		if(p.room.isPlayer(p)){
			//Joueur
			if(p.room.ranked){
				//partie classé, on n'enleve pas le joueur (pour reconnexion)
				p.isConnected = false;
			}else{
				//partie fun
				p.room.deletePlayer(p);
				game.deletePlayer(socket.id);
			}
		}else{
			//Spectateur
			p.room.deleteSpectator(p);
			game.deletePlayer(socket.id);
		}
	}else{
		game.deletePlayer(socket.id);
	}
}


Utils.messageTo = function(socket, type, message){
	if(io.sockets.connected[socket]){
		io.sockets.connected[socket].emit(type, message);
	}
}