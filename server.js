var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var uuid = require('node-uuid');
var fs = require('fs');
var mysql = require('mysql');

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

db.query("SELECT * FROM maps", function(e, r, f){
	for(var i in r){
		var d = JSON.parse(r[i]["informations"]);
		d.id = r[i]['id'];
		game.maps.push(new Map(d));
	}
	game.newRoom();
});

//physic game
setInterval(function(){
	game.update();
}, 1000/FPS);

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
	socket.on("disconnect", function(){
		Utils.onDisconnect(socket);
	});

	//ok
	socket.on("ping", function(data){
		socket.emit("pong", data);
	});
});

