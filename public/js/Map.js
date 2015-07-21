var Map = function(json){
	this.id;
	this.name;
	this.tilesize;
	this.tiles;
	this.balls;
	this.player;

	this.type;
	this.difficulty;

	this.init(json);
}

Map.prototype.init = function(json){
	for(var i in json){
		this[i] = json[i];
	}
}

Map.prototype.getInitInfos = function(){
	return {
		id:this.id,
		name:this.name,
		tiles:this.tiles,
		tilesize:this.tilesize,
		balls:this.balls,
		player:this.player
	};
}