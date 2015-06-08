var Display = function(json){
	this.client;
	this.canvas = document.getElementById('canvas');
	this.ctx = this.canvas.getContext('2d');
	this.background = "black";

	this.images = {};
	this.sprites = {};

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
		"dirt":{img:this.images["sprites"],name:"dirt", x:0, y:0, w:40, h:40, animation:[0], fps:1},
		"grass":{img:this.images["sprites"],name:"grass", x:40, y:0, w:40, h:40, animation:[0], fps:1},
		"goal2":{img:this.images["sprites"],name:"goal2", x:80, y:0, w:40, h:40, animation:[0], fps:1},
		"goal1":{img:this.images["sprites"],name:"goal1", x:120, y:0, w:40, h:40, animation:[0], fps:1},
		"warp":{img:this.images["sprites"],name:"warp", x:160, y:0, w:40, h:40, animation:[0], fps:1},
		"player":{img:this.images["sprites"],name:"player", x:0, y:80, w:54, h:60, animation:[0], fps:1},
		"running":{img:this.images["sprites"],name:"running", x:0, y:80, w:54, h:60, animation:[0, 1, 0, 2], fps:10},
	}
}

Display.prototype.draw = function(){
	this.ctx.fillStyle = this.background;
	this.ctx.fillRect(0, 0, this.canvas.width,this.canvas.height);
	var room = this.client.room;
	var players = room.players;
	var ball = room.ball;
	var bombs = room.bombs;
	var map = room.map;
	var tilesize = map.tilesize;

	this.ctx.font = "10px Arial";
	//MAP
	if(map){
		for(var i in map.tiles){
			for(var j in map.tiles[i]){
				this.ctx.fillStyle = "#0094FF";
				this.ctx.fillRect(i * tilesize, j * tilesize, tilesize, tilesize);
				if(map.tiles[i][j] == 1){
					if(map.tiles[i][j - 1] != undefined && map.tiles[i][j - 1] != 1){
						var s = new Sprite(this.sprites["grass"]);
					}else{
						var s = new Sprite(this.sprites["dirt"]);
					}
					s.draw(this.ctx, i * tilesize, j * tilesize, tilesize, tilesize);
				}else if(map.tiles[i][j] == 2){
					var s = new Sprite(this.sprites["goal1"]);
					s.draw(this.ctx, i * tilesize, j * tilesize, tilesize, tilesize);
				}else if(map.tiles[i][j] == 3){
					var s = new Sprite(this.sprites["goal2"]);
					s.draw(this.ctx, i * tilesize, j * tilesize, tilesize, tilesize);
				}else if(map.tiles[i][j][0] == "w"){
					var s = new Sprite(this.sprites["warp"]);
					s.draw(this.ctx, i * tilesize, j * tilesize, tilesize, tilesize);
				}
			}
		}
	}

	//PERSO
	
	var letterSpace = 5
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
		this.ctx.fillText(players[i].pseudo, players[i].x - (players[i].pseudo.length / 2) * letterSpace, players[i].y - players[i].radius - letterSpace);
		if(players[i].sprite == null){
			players[i].sprite = new Sprite(this.sprites["running"]);
		}
		/*this.ctx.fillStyle = "red";
		this.ctx.beginPath();
		this.ctx.arc(players[i].x,players[i].y,players[i].radius,0,2*Math.PI);
		this.ctx.fill();*/

		this.ctx.save();
		if(players[i].direction == -1){
			this.ctx.translate(canvas.width, 0);
			this.ctx.scale(-1, 1);
		players[i].sprite.draw(this.ctx, canvas.width -players[i].x - players[i].radius, players[i].y - players[i].radius, players[i].radius * 2, players[i].radius * 2);

		}else{
		players[i].sprite.draw(this.ctx, players[i].x - players[i].radius, players[i].y - players[i].radius, players[i].radius * 2, players[i].radius * 2);

		}
		this.ctx.restore();
	}

	this.ctx.fillStyle = "yellow";
	for(var i in bombs){
		this.ctx.beginPath();
		this.ctx.arc(bombs[i].x,bombs[i].y,bombs[i].radius,0,2*Math.PI);
		this.ctx.fill();
	}

	if(ball){
		this.ctx.fillStyle = "green";
		this.ctx.beginPath();
		this.ctx.arc(ball.x,ball.y,ball.radius,0,2*Math.PI);
		this.ctx.fill();

		this.ctx.save(); 
		this.ctx.translate(ball.x, ball.y); 
		var deg = ball.x * Math.round(360 / (2 * Math.PI * ball.radius));
		this.ctx.rotate(deg * Math.PI/180); 
		var s = new Sprite(this.sprites["ball"]);
		s.draw(this.ctx, -ball.radius, -ball.radius, ball.radius*2, ball.radius*2);
		this.ctx.restore();
	}

	//PING
	this.ctx.fillStyle = "white";
	this.ctx.fillText(this.client.ping, 0, 10);
}

Display.prototype.initRoom = function(){
	var room = this.client.room;
	$("#score1").text(room.score["1"]);
	$("#score2").text(room.score["2"]);
	$("#roomName").text(room.name);
}

Display.prototype.displayRoomPlayers = function(){
	var html = "";
	if(this.client.room){
		var p = this.client.room.players;
		for(var i in p){
			html += "<li>"+p[i].pseudo+" ("+p[i].elo+")"+"</li>";
		}
	}
	$("#roomPlayers").html(html);
	$("#nbRoomPlayer").html(this.client.room.players.length);
}