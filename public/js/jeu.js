var client;
var isServer = false;
var socket;

$(function(){

	var imgs = {
		tiles:"public/img/tiles.png"
	}

	client = new Client();
	socket = io();
	socket.on("login", function(data){
		socket.emit("login", "Joueur"+Math.round(Math.random() * 1000));
	});

	socket.on("playerID", function(data){
		client.pID = data;
	});

	socket.on("initRoom", function(data){
		client.initRoom(data);
	});

	socket.on("snapshot", function(data){
		client.snapshot(JSON.parse(data));
	});

	socket.on("newPlayer", function(data){
		client.room.addPlayer(new Player(data));
	});

	socket.on("deletePlayer", function(data){
		client.room.deletePlayer(data);
	});

	socket.on("nbPlayers", function(data){
		console.log(data+" Joueurs");
	});

	socket.on("goal", function(data){
		console.log(data);
	});

	socket.on("changeSide", function(data){
		client.room.changeSide();
	});

	//ping
	setInterval(function(){
		socket.emit("ping", Date.now());
	}, 1000);

	socket.on("pong", function(data){
		client.ping = Date.now() - data;
	});

	//Event
	setInterval(function(){
		client.update();
	}, 1000/FPS);

	//Clavier
	document.body.addEventListener("keydown", function(e) {
		if((37 <= e.keyCode && e.keyCode <= 39)){
			e.preventDefault();
		}
		client.keys[e.keyCode] = true;
	});
	document.body.addEventListener("keyup", function(e) {
		client.keys[e.keyCode] = false;
	});


});
