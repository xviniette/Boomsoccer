var Matchmaking = function(game){
	this.game = game;
	this.queue = []; //[{player time found}]
}

Matchmaking.prototype.addPlayer = function(player, maps){
	this.queue.push({player:player, time:Date.now(), found:false, maps:maps});
	Utils.messageTo(player.socket, "information", "Inscription Matchmaking.");
}

Matchmaking.prototype.isInQueue = function(player){
	for(var i in this.queue){
		if(this.queue[i].player.id == player.id){
			return true;
		}
	}
	return false;
}

Matchmaking.prototype.removePlayer = function(player){
	for(var i in this.queue){
		if(this.queue[i].player.id == player.id){
			Utils.messageTo(player.socket, "information", "Désinscription Matchmaking.");
			this.queue.splice(i, 1);
			break;
		}
	}
}

Matchmaking.prototype.update = function(){
	for(var i in this.queue){
		if(!this.queue[i].found){
			//pas trouvé
			for(var j in this.queue){
				if(this.queue[i].player.id != this.queue[j].player.id){
					if(!this.queue[j].found && this.isMatching(this.queue[i], this.queue[j])){
						this.queue[i].found = true;
						this.queue[j].found = true;
						this.game.addRanked(this.queue[i].player, this.queue[j].player, this.getMatchingMap(this.queue[i], this.queue[j]));
						break;
					}
				}
			}
		}
	}

	//on supprime les joueurs qui ont un match
	var q = this.queue;
	for(var i in q){
		if(q[i].found){
			this.removePlayer(q[i].player);
		}
	}
}

Matchmaking.prototype.isMatching = function(p1, p2){
	var timeInterval = 10;
	var intervalPerTime = 50;
	var range = (Math.round((Date.now() - p1.time)/1000/timeInterval) + 1) * intervalPerTime;
	if(Math.abs(p1.player.elo - p2.player.elo) <= range){
		for(var i in p1.maps){
			for(var j in p2.maps){
				if(p1.maps[i] == p2.maps[j]){
					return true;
				}
			}
		}
	}
	return false;
}

Matchmaking.prototype.getMatchingMap = function(p1, p2){
	var maps = [];
	for(var i in p1.maps){
		for(var j in p2.maps){
			if(p1.maps[i] == p2.maps[j]){
				maps.push(p1.maps[i]);
			}
		}
	}
	return maps[Math.floor(Math.random() * maps.length)];
}