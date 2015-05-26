var Display = function(json){
	this.client;
	this.canvas = document.getElementById('canvas');
	this.ctx = this.canvas.getContext('2d');
	this.background = "black";
	this.init(json);
}

Display.prototype.init = function(json){
	for(var i in json){
		this[i] = json[i];
	}
}

Display.prototype.draw = function(){
	this.ctx.fillStyle = this.background;
	this.ctx.fillRect(0, 0, this.canvas.width,this.canvas.height);
	var room = this.client.room;
	var players = room.players;
	var ball = room.ball;
	var bombs = room.bombs;

	this.ctx.font = "10px Arial";

	//MAP
	var map = room.map;
	if(map){
		for(var i in map.tiles){
			for(var j in map.tiles[i]){
				if(map.tiles[i][j] == 1){
					this.ctx.fillStyle = "blue";
				}else if(map.tiles[i][j] == 2){
					this.ctx.fillStyle = "red";
				}else if(map.tiles[i][j] == 3){
					this.ctx.fillStyle = "green";
				}else if(map.tiles[i][j][0] == "w"){
					this.ctx.fillStyle = "#B200FF";
				}
				if(map.tiles[i][j] != 0){
					this.ctx.fillRect(i *map.tilesize, j * map.tilesize, map.tilesize, map.tilesize);
				}
			}
		}
	}

	//PERSO
	
	var letterSpace = 5
	for(var i in players){
		this.ctx.fillStyle = "white";
		if(players[i].id == this.client.pID){
			this.ctx.fillStyle = "yellow";
		}
		this.ctx.fillText(players[i].pseudo, players[i].x - (players[i].pseudo.length / 2) * letterSpace, players[i].y - players[i].radius - letterSpace);
		this.ctx.fillStyle = "red";
		this.ctx.beginPath();
		this.ctx.arc(players[i].x,players[i].y,players[i].radius,0,2*Math.PI);
		this.ctx.fill();
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
	}

	//PING
	this.ctx.fillStyle = "white";
	this.ctx.fillText(this.client.ping, 0, 10);
}