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

				var now = new Date();
				var date = now.getFullYear()+"-"+parseInt(now.getMonth() + 1)+"-"+now.getDate()+" "+now.getHours()+":"+now.getMinutes()+":"+now.getSeconds();
				
				var d = [{
					connectionDate:date,
					online:true
				}, res.id];
				db.query("UPDATE users SET ? WHERE id = ?", d);

				var p = game.getPlayerById(res.id);
				if(p == null){
					//Connexion
					p = new Player({id:res.id,socket:socket.id,pseudo:res.pseudo,elo:res.elo,won:res.won,played:res.played});
					_this.messageTo(p.socket, "playerID", p.id);
					game.addPlayer(p);
					if(data.first){
						//Tutoriel
						_this.onTutorial({}, socket);
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
				var now = new Date();
				var date = now.getFullYear()+"-"+parseInt(now.getMonth() + 1)+"-"+now.getDate()+" "+now.getHours()+":"+now.getMinutes()+":"+now.getSeconds();
				var pwd = crypto.createHash('sha256').update(data.password).digest("hex");
				var d = {pseudo:data.login, password:pwd, elo:1200, won:0, played:0, registrationDate:date, connectionDate:date, online:false};
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
		p.inputs.push(data);
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
			case "/tuto":
			//réapparition
			this.onTutorial({}, socket);
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
			game.matchmaking.addPlayer(p, data);
		}else{
			game.matchmaking.removePlayer(p);
		}
	}
}

Utils.onTutorial = function(data, socket){
	var p = game.getPlayerBySocket(socket.id);
	if(!p){return;}
	if(!(p.room && p.room.ranked == true && p.room.isPlayer(p))){
		if(p.room){
			p.room.playerLeave(p);
		}
		var tutomap = '{"name":"Tutoriel","tiles":[[1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,1,1,1],[1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,"p;Utilise la touche Entrée pour taper dans la balle ! Si tu n\'es pas sur la balle, tu poses une bombe.",1,0,0,1,"w","w",1],[1,0,0,"p;Bienvenue ! Utilise les flèches du clavier pour te déplacer.",1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,1,1,1,1,0,0,0,0,0,0,1,0,0,1,0,"p;La flèche du bas permet de lever le ballon et les bombes !",1],[1,0,0,0,1,0,0,0,1,0,0,1,0,0,0,0,0,"p;Utilise ce téléporteur pour te rendre à l\'autre !",1,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,1,0,"p;Tu peux sauter à travers un plafond !.",1,0,0,0,0,0,0,1,0,0,1,0,0,1],[1,0,0,0,1,1,1,1,1,0,0,1,0,0,0,1,"w;1;22","w;1;23",1,0,"p;Pour finir ce tutoriel, marque un but dans les cages bleues !",1,0,0,1],[1,0,0,0,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,"p;Il y a deux modes de jeu : <ul><li>Partie classée : recherche d\'un adversaire de même niveau pour un duel ! Ce mode compte dans le classement et le rang des joueurs.</li><li>Mode libre : Créez vos parties ! Pratique pour s\'entraîner sur des maps spéciales !</li></ul> Nous vous conseillons de réussir toutes les maps d\'entraînement avant de s\'attaquer au parties classées..",1,0,0,1],[1,0,0,0,1,1,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,1,0,0,1],[1,0,0,0,0,0,0,0,0,0,"p;Pour sauter, utilise la flèche du haut.",1,0,0,0,0,0,0,1,0,0,1,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,1,0,0,1],[1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,2,2,1,1,1,1,1,1,1]],"tilesize":20,"balls":[{"x":50,"y":330}],"player":{"x":40,"y":60}}';
		var room = new Room({id:uuid.v1(), ranked:false, name:"Tutoriel de "+p.pseudo, spawningBall:true, spawningBomb:true, nbGoal:1, joinable:false});
		room.map = new Map(JSON.parse(tutomap));
		room.addPlayer(p, 1);
		room.start(0);
		game.rooms.push(room);
		game.sendNbGames();
	}
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
	room.start(0);
	game.rooms.push(room);
	game.sendNbGames();
}

Utils.onJoinFunGame = function(data, socket){
	var p = game.getPlayerBySocket(socket.id);
	if(!p){return;}
	if(!(p.room && p.room.ranked == true && p.room.isPlayer(p))){
		var room = game.getRoom(data.id);
		if(room && room.joinable && room.nbMaxPlayers > room.players.length){
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
	if(room && room.spectable){
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
	if(p.room && p.room.id != 0){
		p.room.playerLeave(p);
		game.getInitRoom().addPlayer(p);
	}
}

Utils.onGameCreation = function(data, socket){
	var p = game.getPlayerBySocket(socket.id);
	if(!p){return;}
	var d = {};
	d.maps = [];
	for(var i in game.maps){
		var m = JSON.parse(game.maps[i]);
		d.maps.push({id:m.id, name:m.name, type:m.type, difficulty:m.difficulty});
	}
	this.messageTo(p.socket, "gameCreation", d);
}

//Get Match en cours
Utils.onInProgresGames = function(data, socket){
	socket.emit("inProgressGames", game.getInProgressRooms());
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
	db.query("SELECT id, pseudo, elo, won, xp, played, online FROM users WHERE played >= "+NBGAMEPLACEMENT+" ORDER BY elo DESC;", [data], function(e, r, f){
		_this.messageTo(socket.id, "ranking", r);
	});
}

Utils.onGetProfil = function(data, socket){
	var _this = this;
	var d = {};
	db.query("SELECT id, pseudo, elo, xp, won, played FROM users WHERE id = ?;", [data], function(e, r, f){
		if(r[0]){
			d = r[0];
			db.query("SELECT m.id, m.name, m.score1, m.score2, m.user1, m.user2, m.date, m.winner, c.id as idMap, c.name as nameMap FROM matchs m, maps c WHERE (m.user1 = ? OR m.user2 = ?) AND c.id = m.map ORDER BY id DESC LIMIT 0,50;", [data, data], function(e, r, f){
				d.games = r;
				_this.messageTo(socket.id, "profil", d);
			});
		}
	});
}

Utils.onPlayersStats = function(data, socket){
	var _this = this;
	var d = {
		online:game.getNbPlayers()
	};

	var now = new Date();
	now.setTime(Date.now() - 15 * 24 * 3600 * 1000);
	var data = now.getFullYear()+"-"+parseInt(now.getMonth() + 1)+"-"+now.getDate()+" "+now.getHours()+":"+now.getMinutes()+":"+now.getSeconds();
	db.query("SELECT COUNT(*) FROM users WHERE connectionDate > ?;", [data], function(e, r, f){
		if(r[0]){
			d.active = r[0]["COUNT(*)"];
			db.query("SELECT COUNT(*) FROM users;", function(e, r, f){
				if(r[0]){
					d.register = r[0]["COUNT(*)"];
					_this.messageTo(socket.id, "playersStats", d);
				}
			});
		}
	});
}

//OK 
Utils.onDisconnect = function(socket){
	var p = game.getPlayerBySocket(socket.id);
	if(!p){return;}

	var d = [{
		online:false
	}, p.id];
	db.query("UPDATE users SET ? WHERE id = ?", d);

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