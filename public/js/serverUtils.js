var Utils = {};

//Réactions au événemments

//OK
Utils.onLogin = function(data, socket){
	//data = {login, password}
	var _this = this;
	if(data.login && data.password && data.login.length > 0 && data.password.length > 0){
		var pwd = crypto.createHash('sha256').update(data.password).digest("hex");
		db.query("SELECT * FROM users WHERE pseudo = ? AND password = ?", [data.login, pwd], function(e, r, f){
			if(r.length > 0){
				var res = r[0];

				var p = game.getPlayerById(res.id);
				if(p == null){
					//Pas en ligne
					p = new Player({id:res.id,socket:socket.id,pseudo:res.pseudo,elo:res.elo,won:res.won,played:res.played});
					_this.messageTo(p.socket, "playerID", p.id);
					game.addPlayer(p);
					if(data.first){
						var tutomap = '{"name":"Tutoriel","tiles":[[1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,1,1,1],[1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,"p;L\'objectif est de marquer des buts. Utilise la touche Entrer pour taper dans un ballon quand tu es dessus. Si tu n\'es pas sur la balle, ça pose une bombe.",1,0,0,1,"w","w",1],[1,0,0,"p;Bienvenue dans ce tutoriel. Utilise les touches directionnelles Gauche et Droite pour te déplacer.",1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,1,1,1,1,0,0,0,0,0,0,1,0,0,1,0,"p;Utilise la touche fléchée Bas pour lever le ballon.",1],[1,0,0,0,1,0,0,0,1,0,0,1,0,0,0,0,0,"p;Utilise ce téléporteur pour te rendre à l\'autre.",1,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,1,0,"p;Tu peux passer à travers les sols en sautant par dessous.",1,0,0,0,0,0,0,1,0,0,1,0,0,1],[1,0,0,0,1,1,1,1,1,0,0,1,0,0,0,1,"w;1;22","w;1;23",1,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,"p;Enfin marque un but pour finir ce tutoriel.",1,0,0,1],[1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,1,0,0,1],[1,0,0,0,1,1,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,1],[1,0,0,0,0,0,0,0,0,0,"p;Utilise la touche fléchée Haut pour sauter. Tu peux modifier ces touches dans les options.",1,0,0,0,0,0,0,0,0,0,1,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,2,2,1,0,0,1],[1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1]],"tilesize":20,"balls":[{"x":50,"y":330}],"player":{"x":40,"y":60}}';
						var room = new Room({id:uuid.v1(), ranked:false, name:"Tutoriel - Lisez l'aide", spawningBall:true, spawningBomb:true, nbGoal:1});
						room.map = new Map(JSON.parse(tutomap));
						room.addPlayer(p, 1);
						_this.messageTo(p.socket, "information", "Voici une map Tutoriel qui vous fait découvrir les différentes fonctionnalitées de BoomSoccer. N'hésitez pas à lire l'aide. Amenez le Ballon dans les cages ! Vous pouvez quitter cette Map en écrivant /leave dans le tchat.");
						room.start();
						game.rooms.push(room);
					}else{
						game.rooms[0].addPlayer(p);
					}
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
	if(data.login && data.password && data.login.length > 0 && data.password.length > 0 && isValidPseudo(data.login)){
		db.query("SELECT * FROM users WHERE pseudo = ?;", [data.login], function(e, r, f){
			//On vérifie pseudo non utilisé
			if(r.length == 0){
				//inscription ok
				var pwd = crypto.createHash('sha256').update(data.password).digest("hex");
				var d = {pseudo:data.login, password:pwd, elo:1200, won:0, played:0};
				db.query("INSERT INTO users SET ?", d, function(e, r, f){
					//Insertion puis auto login
					data.first = true;
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
				if(dest){
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
			case "/ball":
			//vote ball
			if(p.room){
				p.room.pollNewBall(p);
			}
			break;
			case "/respawn":
			//réapparition
			if(p.room){
				setTimeout(function(){
					p.setCoordinate(p.room.map.player.x, p.room.map.player.y);
				}, 5000);
			}
			break;
		}
	}else{
		if(p.room){	
			for(var i in p.room.players){
				this.messageTo(p.room.players[i].socket, "tchat", {type:"general", pID:p.id, pseudo:p.pseudo, message:data});
			}
			for(var i in p.room.spectators){
				this.messageTo(p.room.spectators[i].socket, "tchat", {type:"general", pID:p.id, pseudo:p.pseudo, message:data});
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
			var initRoom = game.getInitRoom();
			p.room.deletePlayer(p);
			room.addSpectator(p);
			for(var i in initRoom.players){
				this.messageTo(initRoom.players[i].socket, "information", p.pseudo+" observe "+room.name);
			}
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
				p.room.giveUp(p);
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
	db.query("SELECT id, pseudo, elo, won, played FROM users WHERE won >= "+NBGAMEPLACEMENT+" ORDER BY elo DESC;", [data], function(e, r, f){
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