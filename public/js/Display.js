var Display = function(json){
	this.client;
	this.canvas = document.getElementById('canvas');
	this.ctx = this.canvas.getContext('2d');
	this.background = "#0094FF";

	this.images = {};
	this.sprites = {};
	this.particles = [];

	this.scale = this.canvas.width/400;

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
		"goal2":{img:this.images["sprites"],name:"goal2", x:80, y:0, w:40, h:40, animation:[0], fps:1},
		"goal1":{img:this.images["sprites"],name:"goal1", x:120, y:0, w:40, h:40, animation:[0], fps:1},
		"warp":{img:this.images["sprites"],name:"warp", x:160, y:0, w:40, h:40, animation:[0], fps:1},
		"player":{img:this.images["sprites"],name:"player", x:0, y:80, w:54, h:60, animation:[0], fps:1},
		"running":{img:this.images["sprites"],name:"running", x:0, y:80, w:54, h:60, animation:[0, 1, 0, 2], fps:10},
	};
}

Display.prototype.draw = function(){
	this.ctx.fillStyle = this.background;
	this.ctx.fillRect(0, 0, this.canvas.width,this.canvas.height);

	var room = this.client.room;
	var players = room.players;
	var ball = room.ball;
	var bombs = room.bombs;
	var map = room.map;
	var tilesize = map.tilesize * this.scale;

	var middleScreen = {x:this.canvas.width/2, y:this.canvas.height/2};
	var center = {x:middleScreen.x, y:middleScreen.y};

	var spectator = false;
	for(var i in players){
		if(players[i].id == this.client.pID){
			center.x = players[i].x * this.scale;
			center.y = players[i].y * this.scale;
			spectator = true;
		}
	}
	if(spectator){
		if(ball){
			center.x = ball.x * this.scale;
			center.y = ball.y * this.scale;
		}
	}

	var getRelativePosition = function(x, y){
		if(center.x < middleScreen.x){
			center.x = middleScreen.x;
		}else if(map.tiles.length * tilesize - center.x < middleScreen.x){
			center.x = map.tiles.length * tilesize - middleScreen.x;
		}
		if(center.y < middleScreen.y){
			center.y = middleScreen.y;
		}else if(map.tiles[0].length * tilesize - center.y < middleScreen.y){
			center.y = map.tiles[0].length * tilesize - middleScreen.y;
		}
		return {x:x+(middleScreen.x - center.x), y:y+(middleScreen.y - center.y)};
	}

	this.ctx.font = "10px Arial";
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
					var position = getRelativePosition(i * tilesize + tilesize/10, j * tilesize + tilesize/10);
					this.ctx.fillRect(position.x, position.y, tilesize, tilesize);
				}else if(map.tiles[i][j] == 2){
					var s = this.sprites["goal1"];
				}else if(map.tiles[i][j] == 3){
					var s = this.sprites["goal2"];
				}else if(map.tiles[i][j][0] == "w"){
					var s = this.sprites["warp"];
				}
				if(s){
					var position = getRelativePosition(tilesize * i, tilesize * j);
					this.ctx.drawImage(s.img, s.x, s.y, s.w, s.h, position.x, position.y, tilesize, tilesize);
				}
			}
		}
	}

	
	var letterSpace = 5;
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
		var position = getRelativePosition(players[i].x * this.scale, players[i].y * this.scale);
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
			var position = getRelativePosition(players[i].x * this.scale, players[i].y * this.scale);
			players[i].sprite.draw(this.ctx, canvas.width - position.x - players[i].radius * this.scale, position.y - players[i].radius * this.scale, players[i].radius * 2 * this.scale, players[i].radius * 2 * this.scale);
		}else{
			var position = getRelativePosition(players[i].x * this.scale, players[i].y * this.scale);
			players[i].sprite.draw(this.ctx, position.x - players[i].radius * this.scale, position.y - players[i].radius * this.scale, players[i].radius * 2 * this.scale, players[i].radius * 2 * this.scale);

		}
		this.ctx.restore();
	}

	for(var i in bombs){
		if(!bombs[i].sprite){
			bombs[i].sprite = new Sprite(this.sprites["bomb"]);
		}
		var position = getRelativePosition(bombs[i].x * this.scale, bombs[i].y * this.scale);
		bombs[i].sprite.draw(this.ctx, position.x - bombs[i].radius * this.scale, position.y - bombs[i].radius * 2 * this.scale, bombs[i].radius*2*this.scale, bombs[i].radius*3*this.scale);
	}

	if(ball){
		this.ctx.save(); 
		var position = getRelativePosition(ball.x * this.scale, ball.y * this.scale);
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
			this.particles[i].draw(this.ctx, center, middleScreen, this);
		}
	}

	this.ctx.fillStyle = "white";
	this.ctx.fillText(this.client.ping+"ms", 0, 10);
}

Display.prototype.initRoom = function(){
	var room = this.client.room;
	$("#score1").text(room.score["1"]);
	$("#score2").text(room.score["2"]);
	$("#roomName").text(room.name);
}

Display.prototype.displayRoomPlayers = function(){
	var html = "<table>";
	html += "<tr><th>Pseudo</th><th>ELo</th><th>Gagné</th><th>Joué</th><th>Ratio</th></tr>";
	if(this.client.room){
		var p = this.client.room.players;
		for(var i in p){
			html += "<tr><td>"+p[i].pseudo+"</td><td>"+p[i].elo+"</td><td>"+p[i].won+"</td><td>"+p[i].played+"</td><td>"+(p[i].played == 0 ? 0 : Math.round(p[i].won/p[i].played*100))+"%</td></tr>";
		}
	}
	html += "</table>";
	$("#roomPlayers").html(html);
	$("#nbRoomPlayer").html("Nombre de joueur : "+this.client.room.players.length);
}

Display.prototype.ranking = function(data){
	var html = "<table>";
	html += "<tr><th>n°</th><th>Pseudo</th><th>ELo</th><th>Gagné</th><th>Joué</th><th>Ratio</th></tr>";
	for(var i in data){
		html += "<tr><td>"+(parseInt(i)+1)+"</td><td>"+data[i].pseudo+"</td><td>"+data[i].elo+"</td><td>"+data[i].won+"</td><td>"+data[i].played+"</td><td>"+(data[i].played == 0 ? 0 : Math.round(data[i].won/data[i].played*100))+"%</td></tr>";
	}
	html += "</table>";
	this.showPopup(html);
}

Display.prototype.watching = function(data){
	var html = "Partie en cours : "+data.length+"<table>";
	html += "<tr><th>Partie</th><th>Scores</th><th>Elo</th><th>Map</th></tr>";
	for(var i in data){
		html += "<tr><td>"+data[i].name+"</td><td>"+data[i].score["1"]+" - "+data[i].score["2"]+"</td><td>"+data[i].elo+"</td><td>"+data[i].map.name+"</td><td><button onclick='spectate(\""+data[i].id+"\")'>Regarder</button></td></tr>";
	}
	html += "</table>";
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
	html += "<li>/leave : Permet de quitter une partie (sauf si on est en ranked).</li>";
	html += "<li>/ball : Lance un vote pour faire renaître la balle.</li>";
	html += "<li>/respawn : Nous fait réapparaitre à la position d'origine.</li></ul></p>";
	this.showPopup(html);
}

Display.prototype.showPopup = function(data){
	$("#popupContent").html(data);
	$("#popup").show();
}

