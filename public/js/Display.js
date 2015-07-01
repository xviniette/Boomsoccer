var Display = function(json){
	this.client;
	this.canvas = document.getElementById('canvas');
	this.ctx = this.canvas.getContext('2d');

	this.helpPopup = $("#informationPanel");

	this.images = {};
	this.sprites = {};
	this.particles = [];

	this.scale = 1.4;
	this.middleScreen = {x:this.canvas.width/2, y:this.canvas.height/2};
	this.center = {x:this.middleScreen.x, y:this.middleScreen.y};

	this.init(json);
}

Display.prototype.init = function(json){
	for(var i in json){
		this[i] = json[i];
	}
}

Display.prototype.initSprites = function(){
	this.sprites = {
		"ball":{img:this.images["sprites"],name:"ball", x:0, y:40, w:40, h:40, animation:[0], fps:1},
		"bomb":{img:this.images["sprites"],name:"bomb", x:200, y:0, w:40, h:60, animation:[0], fps:1},
		"explosion":{img:this.images["sprites"],name:"explosion", x:240, y:0, w:110, h:110, animation:[0], fps:1},
		"dirt":{img:this.images["sprites"],name:"dirt", x:0, y:0, w:40, h:40, animation:[0], fps:1},
		"grass":{img:this.images["sprites"],name:"grass", x:40, y:0, w:40, h:40, animation:[0], fps:1},
		"panneau":{img:this.images["sprites"],name:"panneau", x:40, y:40, w:40, h:40, animation:[0], fps:1},
		"goal2":{img:this.images["sprites"],name:"goal2", x:80, y:0, w:40, h:40, animation:[0], fps:1},
		"goal1":{img:this.images["sprites"],name:"goal1", x:120, y:0, w:40, h:40, animation:[0], fps:1},
		"warp":{img:this.images["sprites"],name:"warp", x:160, y:0, w:40, h:40, animation:[0], fps:1},
		"player":{img:this.images["sprites"],name:"player", x:0, y:80, w:54, h:60, animation:[0], fps:1},
		"running":{img:this.images["sprites"],name:"running", x:0, y:80, w:54, h:60, animation:[0, 1, 0, 2], fps:10},
		"marqueurgoal1":{img:this.images["sprites"],name:"marqueurgoal1", x:250, y:150, w:250, h:100, animation:[0], fps:1},
		"marqueurgoal2":{img:this.images["sprites"],name:"marqueurgoal2", x:0, y:150, w:250, h:100, animation:[0], fps:1},
		"mitemps":{img:this.images["sprites"],name:"mitemps", x:0, y:250, w:300, h:65, animation:[0], fps:1},
	};
}

Display.prototype.draw = function(){
	this.ctx.fillStyle = "#006BB7";
	this.ctx.fillRect(0, 0, this.canvas.width,this.canvas.height);

	var room = this.client.room;
	var players = room.players;
	var ball = room.ball;
	var bombs = room.bombs;
	var map = room.map;
	var tilesize = map.tilesize * this.scale;

	var spectator = true;
	this.helpPopup.text("");
	for(var i in players){
		if(players[i].id == this.client.pID){
			this.center.x = players[i].x * this.scale;
			this.center.y = players[i].y * this.scale;
			spectator = false;
			if(map.tiles[players[i].cx] && map.tiles[players[i].cx][players[i].cy] && map.tiles[players[i].cx][players[i].cy][0] == "p"){
				var infos = map.tiles[players[i].cx][players[i].cy].split(";");
				this.helpPopup.text(infos[1]);
			}
			break;
		}
	}
	if(spectator){
		if(ball){
			this.center.x = ball.x * this.scale;
			this.center.y = ball.y * this.scale;
		}
	}

	this.ctx.fillStyle = "#0094FF";
	var position = this.getRelativePosition(0, 0);
	this.ctx.fillRect(position.x, position.y, map.tiles.length * tilesize, map.tiles[0].length * tilesize);

	
	if(map){
		for(var i in map.tiles){
			for(var j in map.tiles[i]){
				var s = null;
				if(map.tiles[i][j] == 1){
					if(map.tiles[i][j - 1] != undefined && map.tiles[i][j - 1] != 1){
						var s = this.sprites["grass"];
					}else{
						var s = this.sprites["dirt"];
					}
					this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
					var position = this.getRelativePosition(i * tilesize + tilesize/10, j * tilesize + tilesize/10);
					this.ctx.fillRect(position.x, position.y, tilesize, tilesize);
				}else if(map.tiles[i][j] == 2){
					var s = this.sprites["goal1"];
				}else if(map.tiles[i][j] == 3){
					var s = this.sprites["goal2"];
				}else if(map.tiles[i][j][0] == "w"){
					var s = this.sprites["warp"];
				}else if(map.tiles[i][j][0] == "p"){
					var s = this.sprites["panneau"];
				}
				if(s){
					var position = this.getRelativePosition(tilesize * i, tilesize * j);
					this.ctx.drawImage(s.img, s.x, s.y, s.w, s.h, position.x, position.y, tilesize, tilesize);
				}
			}
		}
	}

	
	var letterSpace = 8;
	this.ctx.font = "14px Arial";
	for(var i in players){
		this.ctx.fillStyle = "white";
		if(players[i].team == 0){
			if(players[i].id == this.client.pID){
				this.ctx.fillStyle = "yellow";
			}
		}else{
			if(players[i].team == 1){
				this.ctx.fillStyle = "blue";
			}else{
				this.ctx.fillStyle = "red";
			}
		}
		var position = this.getRelativePosition(players[i].x * this.scale, players[i].y * this.scale);
		this.ctx.fillText(players[i].pseudo, position.x - (players[i].pseudo.length / 2) * letterSpace, position.y - players[i].radius * this.scale - letterSpace);
		if(players[i].sprite == null){
			players[i].sprite = new Sprite(this.sprites["player"]);
		}
		if(Math.abs(players[i].dx) > 0.001 && players[i].sprite.name == "player"){
			players[i].sprite = new Sprite(this.sprites["running"]);
		}else if(Math.abs(players[i].dx) < 0.001 && players[i].sprite.name == "running"){
			players[i].sprite = new Sprite(this.sprites["player"]);
		}

		this.ctx.save();
		if(players[i].direction == -1){
			this.ctx.translate(canvas.width, 0);
			this.ctx.scale(-1, 1);
			var position = this.getRelativePosition(players[i].x * this.scale, players[i].y * this.scale);
			players[i].sprite.draw(this.ctx, canvas.width - position.x - players[i].radius * this.scale, position.y - players[i].radius * this.scale, players[i].radius * 2 * this.scale, players[i].radius * 2 * this.scale);
		}else{
			var position = this.getRelativePosition(players[i].x * this.scale, players[i].y * this.scale);
			players[i].sprite.draw(this.ctx, position.x - players[i].radius * this.scale, position.y - players[i].radius * this.scale, players[i].radius * 2 * this.scale, players[i].radius * 2 * this.scale);

		}
		this.ctx.restore();
	}

	for(var i in bombs){
		if(!bombs[i].sprite){
			bombs[i].sprite = new Sprite(this.sprites["bomb"]);
		}
		var position = this.getRelativePosition(bombs[i].x * this.scale, bombs[i].y * this.scale);
		bombs[i].sprite.draw(this.ctx, position.x - bombs[i].radius * this.scale, position.y - bombs[i].radius * 2 * this.scale, bombs[i].radius*2*this.scale, bombs[i].radius*3*this.scale);
	}

	if(ball){
		this.ctx.save(); 
		var position = this.getRelativePosition(ball.x * this.scale, ball.y * this.scale);
		this.ctx.translate(position.x, position.y); 
		var deg = ball.x * Math.round(360 / (2 * Math.PI * ball.radius));
		this.ctx.rotate(deg * Math.PI/180); 
		if(!ball.sprite){
			ball.sprite = new Sprite(this.sprites["ball"]);
		}
		ball.sprite.draw(this.ctx, -ball.radius * this.scale, -ball.radius * this.scale, ball.radius*2 * this.scale, ball.radius*2 * this.scale);
		this.ctx.restore();
	}

	for(var i in this.particles){
		if(this.particles[i].life == 0){
			delete this.particles[i];
		}else{
			this.particles[i].draw(this.ctx, this);
		}
	}

	this.ctx.font = "10px Arial";
	this.ctx.fillStyle = "#FF3300";
	if(this.client.ping <= 80){
		this.ctx.fillStyle = "#00FF21";
	}else if(this.client.ping <= 150){
		this.ctx.fillStyle = "#B6FF00";
	}else if(this.client.ping <= 200){
		this.ctx.fillStyle = "#FF6A00";
	}
	this.ctx.fillText(this.client.ping+"ms", 0, 10);
}

Display.prototype.getRelativePosition = function(x, y){
	var map = this.client.room.map;
	var tilesize = map.tilesize * this.scale;
	if(this.center.x < this.middleScreen.x){
		this.center.x = this.middleScreen.x;
	}else if(map.tiles.length * tilesize - this.center.x < this.middleScreen.x){
		this.center.x = map.tiles.length * tilesize - this.middleScreen.x;
	}
	if(this.center.y < this.middleScreen.y){
		this.center.y = this.middleScreen.y;
	}else if(map.tiles[0].length * tilesize - this.center.y < this.middleScreen.y){
		this.center.y = map.tiles[0].length * tilesize - this.middleScreen.y;
	}

	if(this.canvas.width >= map.tiles.length * tilesize){
		this.center.x = map.tiles.length/2 * tilesize;
	}
	if(this.canvas.height >= map.tiles[0].length * tilesize){
		this.center.y = map.tiles[0].length/2 * tilesize
	}
	return {x:Math.round(x+(this.middleScreen.x - this.center.x)), y:Math.round(y+(this.middleScreen.y - this.center.y))};
}

Display.prototype.initRoom = function(){
	var room = this.client.room;
	$("#score1").text(room.score["1"]);
	$("#score2").text(room.score["2"]);
	$("#roomName").text(htmlEntities(room.name));
}

Display.prototype.displayRoomPlayers = function(){
	var html = "<table>";
	html += "<tr><th>Pseudo</th><th>Elo</th><th>Gagné</th><th>Joué</th><th>Ratio</th></tr>";
	if(this.client.room){
		var p = this.client.room.players;
		for(var i in p){
			var rank = getRank(p[i].elo, p[i].played);
			html += "<tr><td><span class='pointer' onclick='profil("+p[i].id+")'>"+p[i].pseudo+"</span></td><td><img src='public/img/ranks/"+rank.rank+".png' height='25px'>+"+rank.points+"</td><td>"+p[i].won+"</td><td>"+p[i].played+"</td><td>"+(p[i].played == 0 ? 0 : Math.round(p[i].won/p[i].played*100))+"%</td></tr>";
		}
	}
	html += "</table>";
	$("#roomPlayers").html(html);
	$("#nbRoomPlayer").html("Nombre de joueur : "+this.client.room.players.length);
}

Display.prototype.ranking = function(data){
	var html = "Classement des joueurs classés ("+NBGAMEPLACEMENT+" parties jouées).<table>";
	html += "<tr><th>n°</th><th>Pseudo</th><th>Grade</th><th>Gagné</th><th>Joué</th><th>Ratio</th></tr>";
	for(var i in data){
		var rank = getRank(data[i].elo, data[i].played);
		html += "<tr><td>"+(parseInt(i)+1)+"</td><td><span class='pointer' onclick='profil("+data[i].id+")'>"+data[i].pseudo+"</span></td><td><img src='public/img/ranks/"+rank.rank+".png' height='25px'>+"+rank.points+"</td><td>"+data[i].won+"</td><td>"+data[i].played+"</td><td>"+(data[i].played == 0 ? 0 : Math.round(data[i].won/data[i].played*100))+"%</td></tr>";
	}
	html += "</table>";
	this.showPopup(html);
}

Display.prototype.profil = function(data){
	var rank = getRank(data.elo, data.played);
	var html = "<h1>"+data.pseudo+" (<img src='public/img/ranks/"+rank.rank+".png' height='35px'>+"+rank.points+")</h1>";
	html += "<h2>"+data.won+"/"+data.played+" - "+(data.played == 0 ? 0 : Math.round(data.won/data.played*100))+"%</h2>";
	html += "Les 50 derniers matchs<table>";
	for(var i in data.games){
		var color = "#FF3A3A";
		if((data.games[i].user1 == data.id && data.games[i].score1 > data.games[i].score2) || (data.games[i].user2 == data.id && data.games[i].score2 > data.games[i].score1)){
			color = "#2DC61F";
		}
		if(data.games[i].score1 == data.games[i].score2){
			color = "#FFE800";
		}
		var g = data.games[i];
		html += "<tr style=\"background-color:"+color+"\"><td>"+g.score1+"</td><td>"+g.name+"</td><td>"+g.score2+"</td></tr>";
	}
	html += "</table>";
	this.showPopup(html);
}

Display.prototype.inProgressGames = function(data){
	var html = "<button onclick='menuOptions(\"games\");'>Rafraichir</button><h1>Parties : "+data.length+"</h1><table>";
	html += "<tr><th>Type</th><th>Partie</th><th>Scores</th><th>Elo</th><th>Map</th><th>Joueur</th><th>Spectateur</th></tr>";
	for(var i in data){
		html += "<tr>";
		if(data[i].ranked){
			html += "<td><b>Classé</b></td>";
		}else{
			html += "<td><b>Fun</b></td>";
		}
		var rank = getRank(data[i].elo);

		html += "<td>"+data[i].name+"</td><td>"+data[i].score["1"]+" - "+data[i].score["2"]+"</td><td><img src='public/img/ranks/"+rank.rank+".png' height='25px'></td><td>"+data[i].map.name+"</td><td>"+data[i].nbPlayer+"</td><td>"+data[i].nbSpectator+"</td>";
		if(data[i].spectable){
			html += "<td><button onclick='spectate(\""+data[i].id+"\")'>Regarder</button></td>";
		}
		if(data[i].joinable){
			html += "<td><input type='password' placeholder='Mot de passe' size='5' id='password_"+data[i].id+"'><button onclick='join(\""+data[i].id+"\")'>Rejoindre</button></td>";
		}
		html += "</tr>";
	}
	html += "</table>";
	this.showPopup(html);
}

Display.prototype.gameCreation = function(data){
	var html = "";
	html += "<h2>Match classé</h2>";
	html += 'Maps :';
	var choosenMaps = localStorage.getItem("choosenMaps");
	for(var i in data.maps){
		//checked ou pas
		if(choosenMaps == null || choosenMaps.indexOf(data.maps[i].id) != -1){
			html += ' <INPUT class="mapChoice" type="checkbox" name="choix1" value="'+data.maps[i].id+'" checked>'+data.maps[i].name;
		}else{
			html += ' <INPUT class="mapChoice" type="checkbox" name="choix1" value="'+data.maps[i].id+'">'+data.maps[i].name;
		}
	}
	html += '</br><button class="big" onclick="matchmaking();">JOUER !</button>';

	html += "<h2>Match fun</h2>";
	html += '<input type="text" id="creation_nom" placeholder="Nom partie"> ';
	html += '<select id="creation_map">';
	for(var i in data.maps){
		html += '<option value="'+data.maps[i].id+'">'+data.maps[i].name+'</option>';
	}
	html += '</select> ';
	html += '<input type="password" id="creation_password" placeholder="Mot de passe (Optionnel)"> ';
	html += '<button onclick="createParty();">Créer</button>';
	this.showPopup(html);
}

Display.prototype.options = function(){
	var html = "<table>";
	for(var i in inputsKeyCode){
		var val = "";
		switch(i) {
			case "up":
			val = "Saut";
			break;
			case "left":
			val = "Gauche";
			break;
			case "right":
			val = "Droite";
			break;
			case "down":
			val = "Lever";
			break;
			case "kick":
			val = "Frapper";
			break;
		}
		html += "<tr><td>"+val+"</td><td><button onclick='changeInput(\""+i+"\");'>"+keyboardMap[inputsKeyCode[i]]+"</button></td></tr>";
	}
	html += "</table>";
	this.showPopup(html);
}

Display.prototype.help = function(){
	var html = "<h1>Aide BoomSoccer</h1>";;
	html += "<h2>Les contrôles</h2>";
	html += "<p><ul><li>Touches directionnelles pour se déplacer</li><li>Touche Haut pour sauter</li><li>Touche Bas pour lever le ballon</li><li>Entrer pour taper dans le ballon et les bombes. Sinon pas de contact avec le ballon ou un bombe, crée une bombe</li></ul>Ces touches sont modifiables dans les options.</p>";
	html += "<h2>Jouer</h2>";
	html += "<p>Inscription à une partie contre un joueur de votre niveau. Le gagnant est le joueur qui atteint en premier un certain nombre de but marqué.</p>";
	html += "<h2>L'accueil</h2>";
	html += "<p>L'accueil est la salle principale où les joueurs se retrouvent entre les parties. Il n'y a ni ballon ni bombe dans cette salle.</p>";
	html += "<h2>Commandes disponibles</h2>";
	html += "<p>Différentes commande à faire dans le tchat existent : ";
	html += "<ul><li>/w \<pseudo\> \<message\> : Permet d'envoyer un message privé.</li>";
	html += "<li>/ball : Lance un vote pour faire renaître la balle.</li>";
	html += "<li>/respawn : Nous fait réapparaitre à la position d'origine.</li></ul></p>";
	html += "<li>/ignore <pseudo> : Permet d'ignorer ou de ne plus ignorer les messages d'un joueur.</li></ul></p>";
	this.showPopup(html);
}

Display.prototype.scoreboard = function(data){
	var html = "<h1>"+data.name+"</h1>";
	html += "<table>";
	for(var i = 1; i <= 2; i++){
		html += "<tr><th>Equipe "+i+"</th><th>"+data.score[i]+"</th></tr>";
		for(var j in data.players){
			if(data.players[j].team == i){
				var rank = getRank(data.players[j].elo, data.players[j].played);
				html += "<tr><td>"+data.players[j].pseudo+"</td><td><img src='public/img/ranks/"+rank.rank+".png' height='25px'>+"+rank.points+"</td><td>"+( data.players[j].deltaElo > 0 ? "+"+data.players[j].deltaElo : data.players[j].deltaElo)+"</td></rt>";
			}
		}
	}
	html += "</table>";
	this.showPopup(html);
}

Display.prototype.showPopup = function(data){
	$("#popupContent").html(data);
	$("#popup").show();
}

