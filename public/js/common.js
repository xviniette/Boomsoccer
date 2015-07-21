
var isValidPseudo = function(pseudo){
	if (pseudo.length <= 20 && /^([a-zA-Z0-9]+)$/.test(pseudo)){
		return true;
	}
	return false;
}


function getRank(elo, played){
	var miniElo = 800;
	var ecartLevel = 100;
	var d = {rank:0,points:0};
	if(played == null || played >= NBGAMEPLACEMENT){
		d.rank = Math.floor((elo-miniElo)/ecartLevel)+1;
		if(d.rank < 1){
			d.rank = 1;
		}else if(d.rank > 15){
			d.rank = 15;
		}
		d.points = elo - ((d.rank-1)*ecartLevel+miniElo);
	}	
	return d;
}

function getLevel(xp){
	var d = {};
	d.cap = 50;
	d.level = Math.floor(xp/d.cap)+1;
	d.progress = xp - (d.level-1)*d.cap;
	return d;
}

function clone(src) {
	return JSON.parse(JSON.stringify(src));
}