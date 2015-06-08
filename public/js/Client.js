var Client = function(){
	this.pID;
	this.ping = 0;
	this.display = new Display({client:this});

	this.input_seq = 0;
	this.keys = [];

	this.lastFrame = Date.now();
	this.room;
}

Client.prototype.initRoom = function(data){
	this.room = new Room();
	this.room.map = new Map(data.map);
	delete data.map;
	this.room.players = [];
	for(var i in data.players){
		data.players[i].room = this.room;
		var p = new Player(data.players[i]);
		p.setCoordinate(data.players[i].x, data.players[i].y);
		this.room.addPlayer(p, data.players[i].team);
	}
	delete data.players;
	this.room.init(data);
	this.display.initRoom();
}

Client.prototype.snapshot = function(data){
	//Joueurs
	var d = Date.now();
	for(var i in data.players){
		for(var j in this.room.players){
			if(this.room.players[j].id == data.players[i].id){
				if(data.players[i].id == this.pID){
					//Joueur local
					for(var k in this.room.players[j].inputs){
						var input = this.room.players[j].inputs[k];
						if(input.seq == data.players[i].seq){
							//on supprime toutes les inputs avant et compris
							this.room.players[j].inputs.splice(0, k);
							if(input.pos.x != data.players[i].x || input.pos.y != data.players[i].y){
								//probleme dans coordonnées
								this.room.players[j].setCoordinate(data.players[i].x, data.players[i].y);
								this.room.players[j].stun = data.players[i].stun;
								this.room.players[j].dx = data.players[i].dx;
								this.room.players[j].dy = data.players[i].dy;
								this.room.players[j].lastInput = input;
								this.room.players[j].update();
								//on le remet dans l'état et on execute tout ce qui c'est passé
							}
							break;
						}
					}
				}else{
					//Autres joueurs = interpolation
					data.players[i].t = d;
					this.room.players[j].positions.push(data.players[i]);
				}
			}
		}
	}

	for(var i in data.bombs){
		var found = false;
		for(var j in this.room.bombs){
			if(this.room.bombs[j].id == data.bombs[i].id){
				data.bombs[i].t = d;
				this.room.bombs[j].positions.push(data.bombs[i]);
				found = true;
				break;
			}
		}
		if(!found){
			this.room.bombs.push(new Bomb(data.bombs[i]));
		}
	}

	for(var i in this.room.bombs){
		var found = false;
		for(var j in data.bombs){
			if(this.room.bombs[i].id == data.bombs[j].id){
				found = true;
				break;
			}
		}
		if(!found){
			this.room.bombs.splice(i, 1);
		}
	}

	//Ball
	if(data.ball){
		if(this.room.ball){
			data.ball.t = d;
			this.room.ball.positions.push(data.ball);
		}else{
			this.room.ball = new Ball(data.ball);
		}
	}else{
		this.room.ball = null;
	}
}

Client.prototype.update = function(){
	if(this.room != null){
		var d = Date.now();
		var input = this.checkKeys();
		for(var i in this.room.players){
			if(this.room.players[i].id == this.pID){
				//Joueur local
				this.input_seq++;
				input.seq = this.input_seq;
				socket.emit("keyboard", JSON.stringify(input));
				var inputs = this.room.players[i].inputs;
				this.room.players[i].inputs = [input];
				this.room.players[i].update();
				input.pos = {x:this.room.players[i].x, y:this.room.players[i].y};
				inputs.push(input);
				this.room.players[i].inputs = inputs;
			}else{
				//On interpole la position des autres joueurs
				this.room.players[i].interpolate(d);
			}
		}

		for(var i in this.room.bombs){
			this.room.bombs[i].interpolate(d);
		}

		if(this.room.ball){
			this.room.ball.interpolate(d);
		}

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

Client.prototype.loadImages = function(sources, callback){
	var _this = this;
	var images = {};
	var loadedImages = 0;
	var numImages = 0;
	for(var src in sources) {
		numImages++;
	}
	for(var src in sources) {
		images[src] = new Image();
		images[src].onload = function() {
			if(++loadedImages >= numImages) {
				_this.display.images = images;
				callback();
			}
		};
		images[src].src = sources[src];
	}
}