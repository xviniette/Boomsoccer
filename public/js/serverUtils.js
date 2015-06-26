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
					//Connexion
					p = new Player({id:res.id,socket:socket.id,pseudo:res.pseudo,elo:res.elo,won:res.won,played:res.played});
					_this.messageTo(p.socket, "playerID", p.id);
					game.addPlayer(p);
					if(data.first){
						//TUTORIEL
						var tutomap = '{"name":"Tutoriel","tiles":[[1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,1,1,1],[1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,"p;L\'objectif est de marquer des buts. Utilise la touche Entrer pour taper dans un ballon quand tu es dessus. Si tu n\'es pas sur la balle, ça pose une bombe.",1,0,0,1,"w","w",1],[1,0,0,"p;Bienvenue dans ce tutoriel. Utilise les touches directionnelles Gauche et Droite pour te déplacer.",1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,1,1,1,1,0,0,0,0,0,0,1,0,0,1,0,"p;Utilise la touche fléchée Bas pour lever le ballon.",1],[1,0,0,0,1,0,0,0,1,0,0,1,0,0,0,0,0,"p;Utilise ce téléporteur pour te rendre à l\'autre.",1,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,1,0,"p;Tu peux passer à travers les sols en sautant par dessous.",1,0,0,0,0,0,0,1,0,0,1,0,0,1],[1,0,0,0,1,1,1,1,1,0,0,1,0,0,0,1,"w;1;22","w;1;23",1,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,"p;Enfin marque un but pour finir ce tutoriel.",1,0,0,1],[1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,1,0,0,1],[1,0,0,0,1,1,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,1],[1,0,0,0,0,0,0,0,0,0,"p;Utilise la touche fléchée Haut pour sauter. Tu peux modifier ces touches dans les options.",1,0,0,0,0,0,0,0,0,0,1,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,2,2,1,0,0,1],[1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1]],"tilesize":20,"balls":[{"x":50,"y":330}],"player":{"x":40,"y":60}}';
						var room = new Room({id:uuid.v1(), ranked:false, name:"Tutoriel - Lisez l'aide", spawningBall:true, spawningBomb:true, nbGoal:1});
						room.map = new Map(JSON.parse(tutomap));
						room.addPlayer(p, 1);
						_this.messageTo(p.socket, "information", "Voici une map Tutoriel qui vous fait découvrir les différentes fonctionnalitées de BoomSoccer. N'hésitez pas à lire l'aide. Amenez le Ballon dans les cages ! Vous pouvez quitter cette Map en écrivant /leave dans le tchat.");
						room.start();
						game.rooms.push(room);
					}else{
						//Connexion lobby
						game.getInitRoom().addPlayer(p);
					}
				}else{
					//Déjà connecté -> déconnexion de l'autre
					_this.messageTo(p.socket, "login", true);
					_this.messageTo(p.socket, "nbPlayers", game.getNbPlayers());
					game.deletePlayer(p.socket);
					p.socket = socket.id;
					p.isConnected = true;
					game.addPlayer(p);
					_this.messageTo(p.socket, "playerID", p.id);
					if(p.room){
						_this.messageTo(p.socket, "initRoom", p.room.getInitInfo());
					}
				}	
			}else{
				//probleme login
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
			}else{
				//Login utilisé
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
					if(game.players[i].pseudo.toLowerCase() == split[1].toLowerCase()){
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
			var type = "general";
			if(!p.room.isPlayer(p)){
				type = "spectator";
			}
			for(var i in p.room.players){
				this.messageTo(p.room.players[i].socket, "tchat", {type:type, pID:p.id, pseudo:p.pseudo, message:data});
			}
			for(var i in p.room.spectators){
				this.messageTo(p.room.spectators[i].socket, "tchat", {type:type, pID:p.id, pseudo:p.pseudo, message:data});
			}
		}
	}
}

//OK
Utils.onMatchmaking = function(data, socket){
	var p = game.getPlayerBySocket(socket.id);
	if(!p){return;}
	if(!(p.room && p.room.ranked == true && p.room.isPlayer(p))){
		if(!game.matchmaking.isInQueue(p)){
			game.matchmaking.addPlayer(p);
		}else{
			game.matchmaking.removePlayer(p);
		}
	}
}

Utils.onGetFunGame = function(data, socket){
	var p = game.getPlayerBySocket(socket.id);
	if(!p){return;}
	var d = {};
	d.maps = [];
	for(var i in game.maps){
		var m = JSON.parse(game.maps[i]);
		d.maps.push({id:m.id, name:m.name});
	}
	d.games = game.getFunGames();
	this.messageTo(p.socket, "funGames", d);
}

Utils.onCreateFunGame = function(data, socket){
	var p = game.getPlayerBySocket(socket.id);
	if(!p){return;}
	this.onLeaveGame("", socket);
	var basicData = {
		map:JSON.parse(game.maps[0]),
	};

	if(data.map){
		for(var i in game.maps){
			var m = JSON.parse(game.maps[i]);
			if(m.id == parseInt(data.map)){
				basicData.map = m;
				break;
			}
		}
	}

	var room = new Room({id:uuid.v1(), ranked:false, name:"Partie de "+p.pseudo,nbGoal:-1});
	if(data.name && data.name.length > 0){
		room.name = data.name;
	}
	if(data.password && data.password.length > 0){
		room.password = data.password;
	}
	room.map = new Map(m);
	p.room.playerLeave(p);
	room.addPlayer(p);
	room.start();
	game.rooms.push(room);
}

Utils.onJoinFunGame = function(data, socket){
	var p = game.getPlayerBySocket(socket.id);
	if(!p){return;}
	if(!(p.room && p.room.ranked == true && p.room.isPlayer(p))){
		var room = game.getRoom(data.id);
		if(room){
			if(!room.password || data.password == room.password){
				p.room.playerLeave(p);
				room.addPlayer(p);
			}
		}
	}
}

Utils.onSpectate = function(data, socket){
	var p = game.getPlayerBySocket(socket.id);
	if(!p){return;}
	var room = game.getRoom(data.id);
	if(room){
		if(p.room && !(p.room.ranked == true && p.room.isPlayer(p))){
			p.room.playerLeave(p);
			room.addSpectator(p);
		}

		var initRoom = game.getInitRoom();
		for(var i in initRoom.players){
			this.messageTo(initRoom.players[i].socket, "information", p.pseudo+" observe "+room.name);
		}
	}
}

Utils.onLeaveGame = function(data, socket){
	var p = game.getPlayerBySocket(socket.id);
	if(!p){return;}
	if(p.room){
		p.room.playerLeave(p);
		game.getInitRoom().addPlayer(p);
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
	db.query("SELECT id, pseudo, elo, won, played FROM users WHERE played >= "+NBGAMEPLACEMENT+" ORDER BY elo DESC;", [data], function(e, r, f){
		_this.messageTo(socket.id, "ranking", r);
	});
}

//OK à finir pour reconnexion en combat
Utils.onDisconnect = function(socket){
	var p = game.getPlayerBySocket(socket.id);
	if(!p){return;}
	//On l'enleve du matchmaking
	game.matchmaking.removePlayer(p);
	if(p.room && p.room.isPlayer(p) && p.room.ranked){
		//si classé on le déconnecte pas
		p.isConnected = false;
	}else{
		if(p.room){
			p.room.playerLeave(p);
		}
		game.deletePlayer(socket.id);
	}
}


Utils.messageTo = function(socket, type, message){
	if(io.sockets.connected[socket]){
		io.sockets.connected[socket].emit(type, message);
	}
}