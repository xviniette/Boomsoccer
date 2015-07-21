var Client = function(){
	this.pID;
	this.ping = 0;
	this.display = new Display({client:this});

	this.serverTime = 0;
	this.svTimeSnapshots = [];

	this.input_seq = 0;
	this.keys = [];

	this.lastFrame = Date.now();
	this.room;

	this.ignoredPlayers = {};
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
	//Gestion temps serveur
	this.svTimeSnapshots.push({t:d, svtime:data.time});
	//Gestion des joueurs
	for(var i in data.players){
		for(var j in this.room.players){
			if(this.room.players[j].id == data.players[i].id){
				if(data.players[i].id == this.pID){
					//Joueur local
					for(var k in this.room.players[j].inputs){
						var input = this.room.players[j].inputs[k];
						if(input.seq == data.players[i].seq){
							//on supprime toutes les inputs avant et compris
							this.room.players[j].inputs.splice(0, k + 1);
							if((data.players[i].x != undefined && input.pos.x != data.players[i].x) || (data.players[i].y != undefined && input.pos.y != data.players[i].y)){
								console.log("soucis");
								//probleme dans coordonnées
								this.room.players[j].setCoordinate(data.players[i].x, data.players[i].y);
								this.room.players[j].stun = data.players[i].stun;
								this.room.players[j].dx = data.players[i].dx;
								this.room.players[j].dy = data.players[i].dy;
								var inputs = this.room.players[j].inputs;
								this.room.players[j].inputs = [];
								var resInputs = [];
								for(var i in inputs){
									this.room.players[j].inputs = [inputs[i]];
									this.room.players[j].update();
									inputs[i].pos = {x:this.room.players[j].x, y:this.room.players[j].y};
									resInputs.push(inputs[i]);
								}
								this.room.players[j].inputs = resInputs;
							}
							break;
						}
					}
				}else{
					//Autres joueurs = interpolation
					/*var dataPlayer = clone(data.players[i]);
					delete dataPlayer.x;
					delete dataPlayer.y;*/

					this.room.players[j].init({dx:data.players[i].dx, dy:data.players[i].dy, stun:data.players[i].stun});
					data.players[i].t = d;
					/*var longueur = this.room.players[j].positions.length - 1;
					if(data.players[i].x == undefined){
						data.players[i].x = this.room.players[j].x;
						if(this.room.players[j].positions[longueur]){
							data.players[i].x = this.room.players[j].positions[longueur].x;
						}
					}
					if(data.players[i].y == undefined){
						data.players[i].y = this.room.players[j].y;
						if(this.room.players[j].positions[longueur]){
							data.players[i].y = this.room.players[j].positions[longueur].y;
						}
					}*/
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
				/*var longueur = this.room.bombs[j].positions.length - 1;
				if(data.bombs[i].x == undefined){
					data.bombs[i].x = this.room.bombs[j].x;
					if(this.room.bombs[j].positions[longueur]){
						data.bombs[i].x = this.room.bombs[j].positions[longueur].x;
					}
				}
				if(data.bombs[i].y == undefined){
					data.bombs[i].y = this.room.bombs[j].y;
					if(this.room.bombs[j].positions[longueur]){
						data.bombs[i].y = this.room.bombs[j].positions[longueur].y;
					}
				}*/				
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
			var scale = this.display.scale;
			var p = new Particle({sprite:new Sprite(this.display.sprites["explosion"]), x:(this.room.bombs[i].x - this.room.bombs[i].radiusExplosion)*scale, y:(this.room.bombs[i].y - this.room.bombs[i].radiusExplosion)*scale, w:this.room.bombs[i].radiusExplosion*2 * scale, h:this.room.bombs[i].radiusExplosion*2 * scale, life:30});
			this.display.particles.push(p);
			this.room.bombs.splice(i, 1);
		}
	}

	//Ball
	if(data.ball){
		if(this.room.ball){
			data.ball.t = d;
			/*var longueur = this.room.ball.positions.length - 1;
			if(data.ball.x == undefined){
				data.ball.x = this.room.ball.x;
				if(this.room.ball.positions[longueur]){
					data.ball.x = this.room.ball.positions[longueur].x;
				}
			}
			if(data.ball.y == undefined){
				data.ball.y = this.room.ball.y;
				if(this.room.ball.positions[longueur]){
					data.ball.y = this.room.ball.positions[longueur].y;
				}
			}*/
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
		var svTime = this.calcServerTime(d);
		var input = this.checkKeys();
		for(var i in this.room.players){
			if(this.room.players[i].id == this.pID){
				//Joueur local
				this.input_seq++;
				input.seq = this.input_seq;
				input.svTime = svTime;
				socket.emit("keyboard", input);
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

Client.prototype.calcServerTime = function(tps){
	var interptime = tps - INTERPOLATION;
	for(var i = 0; i < this.svTimeSnapshots.length - 1; i++){
		if(this.svTimeSnapshots[i].t <= interptime && this.svTimeSnapshots[i + 1].t >= interptime){
			var ratio = (interptime - this.svTimeSnapshots[i].t)/(this.svTimeSnapshots[i + 1].t - this.svTimeSnapshots[i].t);
			var svTime = Math.round(this.svTimeSnapshots[i].svtime + ratio * (this.svTimeSnapshots[i + 1].svtime - this.svTimeSnapshots[i].svtime));
			this.svTimeSnapshots.splice(0, i - 1);
			return svTime; 
		}
	}
}

Client.prototype.checkKeys = function(){
	var input = {};
	if(this.keys[inputsKeyCode.up]){
		input.u = true;
	}
	if(this.keys[inputsKeyCode.right]){
		input.r = true;
	}
	if(this.keys[inputsKeyCode.down]){
		input.d = true;
	}
	if(this.keys[inputsKeyCode.left]){
		input.l = true;
	}
	if(this.keys[inputsKeyCode.kick]){
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