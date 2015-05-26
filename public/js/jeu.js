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
		client.pID = null;
		client.room = null;
		console.log("connectez vous");
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

	socket.on("tchat", function(data){
		$("#messages").append("<li>"+data.pseudo+" : "+data.message+"</li>");
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
	var lastTs = Date.now();
	setInterval(function step() {
		var ts = Date.now();
		var delta = 1000/FPS;
		while(ts - lastTs >= delta){
			client.update();
			lastTs += delta;
		}
	}, 1000/FPS)

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

	//Gestion des formulaire
	$('#connectionPanel').submit(function(e){
		e.preventDefault();
		socket.emit("login", {login:$('#loginLoginForm').val(), password:$('#passwordLoginForm').val()});
	});

	$('#signinForm').submit(function(e){
		e.preventDefault();
		if($('#passwordSigninForm').val() == $('#passwordSigninFormConfirm').val()){
			socket.emit("signin", {login:$('#loginSigninForm').val(), password:$('#passwordSigninForm').val()});
		}
	});

	$('#tchatForm').submit(function(e){
		e.preventDefault();
		var text = $('#inputTchat').val();
		if(text.length > 0){
			socket.emit("tchat", text);
		}
	});
});
