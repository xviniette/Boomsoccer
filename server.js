var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var uuid = require('node-uuid');
var fs = require('fs');
var mysql = require('mysql');
var crypto = require('crypto');

//Inclde files
eval(fs.readFileSync('./public/js/config.js')+'');
eval(fs.readFileSync('./public/js/Matchmaking.js')+'');
eval(fs.readFileSync('./public/js/Game.js')+'');
eval(fs.readFileSync('./public/js/Map.js')+'');
eval(fs.readFileSync('./public/js/Objet.js')+'');
eval(fs.readFileSync('./public/js/Player.js')+'');
eval(fs.readFileSync('./public/js/Ball.js')+'');
eval(fs.readFileSync('./public/js/Bomb.js')+'');
eval(fs.readFileSync('./public/js/Room.js')+'');
eval(fs.readFileSync('./public/js/serverUtils.js')+'');

server.listen(1321);

var db = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : '',
	database : 'soccerfest'
});

db.connect(function(err){
	if(err) {
		console.log("Error connecting database \n\n");  
		process.exit();
	}
});

app.get('/',function(req, res){
	res.sendFile(__dirname + '/public/index.html');
});

app.get( '/*' , function( req, res, next ) {
	var file = req.params[0];
	res.sendFile( __dirname + '/' + file );
});

var isServer = true;
//Ces deux variable servent à générer les valeurs pour id user/room
var nbRooms = 0;
var game = new Game();
game.loadMaps(function(){
	//Ajout de la room d'accueil
	var room = new Room({id:uuid.v1(), ranked:false, name:"Accueil", spawningBall:true, spawningBomb:true, nbGoal:-1});
	room.map = new Map(JSON.parse(game.maps[Math.floor(Math.random() * game.maps.length)]));
	room.start();
	game.rooms.push(room);
});

//physic game
setInterval(function(){
	game.update();
}, 1000/FPS);

setInterval(function(){
	game.matchmaking.update();
}, 5000);

io.on('connection', function(socket){
	//On demande le pseudo au joueur
	socket.emit("login", true);
	//Reponse du pseudo
	socket.on("login", function(data){
		Utils.onLogin(data, socket);
	});

	socket.on("signin", function(data){
		Utils.onSignin(data, socket);
	});

	socket.on("keyboard", function(data){
		Utils.onKeyboard(data, socket);
	});

	//ok
	socket.on("tchat", function(data){
		Utils.onTchat(data, socket);
	});

	//ok
	socket.on("matchmaking", function(data){
		Utils.onMatchmaking(data, socket);
	});

	//ok
	socket.on("spectableRooms", function(data){
		Utils.onGetSpectableRooms(data, socket);
	});

	//ok
	socket.on("spectate", function(data){
		Utils.onSpectate(data, socket);
	});

	//ok
	socket.on("ranking", function(data){
		Utils.onGetRanking(data, socket);
	});
	
	//ok
	socket.on("disconnect", function(){
		Utils.onDisconnect(socket);
	});

	//ok
	socket.on("ping", function(data){
		socket.emit("pong", data);
	});
});

