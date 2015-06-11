var client;
var isServer = false;
var socket;

var inputsKeyCode = {
	up:38, 
	right:39,
	left:37,
	down:40,
	kick:13
};

$(function(){

	//Chargement des bonnes touches
	var inputsConfig = JSON.parse(localStorage.getItem("inputsConfig"));
	if(inputsConfig){
		for(var i in inputsConfig){
			inputsKeyCode[i] = inputsConfig[i];
		}
	}else{
		localStorage.setItem("inputsConfig", JSON.stringify(inputsKeyCode));
	}

	var imgs = {
		sprites:"public/img/sprites.png"
	}

	client = new Client();
	client.loadImages(imgs, function(){
		$("#loader").hide();
		client.display.initSprites();
	});

	socket = io();
	socket.on("login", function(data){
		$("#homePanel").show();
		client.pID = null;
		client.room = null;
		console.log("connectez vous");
	});

	socket.on("playerID", function(data){
		$("#homePanel").hide();
		client.pID = data;
	});

	socket.on("initRoom", function(data){
		client.initRoom(data);
		client.display.displayRoomPlayers();
	});

	socket.on("snapshot", function(data){
		client.snapshot(JSON.parse(data));
	});

	socket.on("tchat", function(data){
		var msgDiv = $("#messages");
		msgDiv.append("<li>"+data.pseudo+" : "+data.message+"</li>");
		msgDiv.animate({scrollTop:$("#messages").prop('scrollHeight')}, 0);
	});

	socket.on("newPlayer", function(data){
		client.room.addPlayer(new Player(data), data.team);
		client.display.displayRoomPlayers();
	});

	socket.on("deletePlayer", function(data){
		client.room.deletePlayer(data);
		client.display.displayRoomPlayers();
	});

	socket.on("nbPlayers", function(data){
		console.log(data+" Joueurs");
	});

	socket.on("goal", function(data){
		$("#score"+data.team).text(data.score);
	});

	socket.on("changeSide", function(data){
		client.room.changeSide();
	});

	//PING
	setInterval(function(){
		socket.emit("ping", Date.now());
	}, 1000);

	socket.on("pong", function(data){
		client.ping = Date.now() - data;
	});

	//Interval client
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

	//Gestion des formulaires
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
		$('#inputTchat').val("");
	});

	setScreenSize();
	$(window).resize(function(){
		setScreenSize();
	});
});

var setScreenSize = function(){
	/*var jeu = $("#jeu");
	var bW = 770;
	var bH = 605;

	var sW = $(window).width();
	var sH = $(window).height();

	var rW = sW/bW;
	var rH = sH/bH;

	if(rW < rH){
		//on gere en fonction de la largeur
		var scale = sW/bW;
		jeu.css({
			'-webkit-transform' : 'scale(' + scale + ')',
			'-moz-transform'    : 'scale(' + scale + ')',
			'-ms-transform'     : 'scale(' + scale + ')',
			'-o-transform'      : 'scale(' + scale + ')',
			'transform'         : 'scale(' + scale + ')'
		});
	}else{
		//on gere en fonction de la hauteur
		var scale = sH/bH;
		jeu.css({
			'-webkit-transform' : 'scale(' + scale + ')',
			'-moz-transform'    : 'scale(' + scale + ')',
			'-ms-transform'     : 'scale(' + scale + ')',
			'-o-transform'      : 'scale(' + scale + ')',
			'transform'         : 'scale(' + scale + ')'
		});
	}

	jeu.css("top", (sH/2 - (bH/2)*scale)+"px");
	jeu.css("left", (sW/2 - (bW/2)*scale)+"px");

	client.scale = scale;*/
}