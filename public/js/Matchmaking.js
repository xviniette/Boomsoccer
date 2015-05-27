var Matchmaking = function(game){
	this.game = game;
	this.queue = []; //[{player time found}]
}

Matchmaking.prototype.addPlayer = function(player){
	this.queue.push({player:player, time:Date.now(), found:false});
}

Matchmaking.prototype.isInQueue = function(player){

}

Matchmaking.prototype.removePlayer = function(player){
	for(var i in this.queue){
		if(this.queue[i].player.id == player.id){
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
					if(this.isMatching(this.queue[i], this.queue[j])){
						this.queue[i].found = true;
						this.queue[j].found = true;
						this.game.addMatch(this.queue[i].player, this.queue[j].player, true);
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
	return true;
}