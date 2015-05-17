var Client = function(){
	this.pID;
	this.ping = 0;
	this.display = new Display({client:this});

	this.keys = [];
	this.input_seq = 0;


	this.room;
}

Client.prototype.initRoom = function(data){
	console.log("init");
	this.room = new Room();
	this.room.map = new Map();
	this.room.players = [];
	for(var i in data.players){
		data.players[i].room = this.room;
		var p = new Player(data.players[i]);
		p.setCoordinate(data.players[i].x, data.players[i].y);
		this.room.addPlayer(p);
	}
}

Client.prototype.snapshot = function(data){
	//Joueurs
	for(var i in data.players){
		for(var j in this.room.players){
			if(this.room.players[j].id == data.players[i].id){
				/*if(data.players[i].id == this.pID){
					for(var k in this.room.players[j].inputs){
						var input = this.room.players[j].inputs[k];
						if(input.seq == data.players[i].seq){
							if(input.pos.x == data.players[i].x && input.pos.y == data.players[i].y){
								//les coordonnées correspondent
							}else{
							}
							break;
						}
					}
				}else{
				}*/
				this.room.players[j].init(data.players[i]);
			}
		}
	}

	this.room.bombs = [];
	for(var i in data.bombs){
		data.bombs[i].room = this.room;
		var bomb = new Bomb(data.bombs[i]);
		bomb.setCoordinate(data.bombs[i].x, data.bombs[i].y);
		this.room.bombs.push(bomb);
	}

	//Ball
	if(data.ball){
		if(this.room.ball){
			this.room.ball.init(data.ball);
		}else{
			this.room.ball = new Ball(data.ball);
		}
	}else{
		this.room.ball = null;
	}
}

Client.prototype.update = function(){
	if(this.room != null){
		var input = this.checkKeys();
		/*for(var i in this.room.players){
			if(this.room.players[i].id == this.pID){
				this.input_seq++;
				input.seq = this.input_seq;
				var inputs = this.room.players[i].inputs;
				this.room.players[i].inputs = [input];

				this.room.players[i].update();

				input.pos = {x:this.room.players[i].x, y:this.room.players[i].y};
				inputs.push(input);
				this.room.players[i].inputs = inputs;
			}
		}*/
		socket.emit("keyboard", JSON.stringify(input));
		this.display.draw();
	}
}

Client.prototype.checkKeys = function(){
	var input = {u:false,d:false,l:false,r:false,k:false};
	if(this.keys[38]){
		input.u = true;
	}
	if(this.keys[39]){
		input.r = true;
	}
	if(this.keys[40]){
		input.d = true;
	}
	if(this.keys[37]){
		input.l = true;
	}
	if(this.keys[13]){
		input.k = true;
	}
	return input;
}