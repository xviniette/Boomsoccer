$(function(){
	socket = io();
	socket.on("login", function(data){
		$("#homePanel").show();
		client.pID = null;
		client.room = null;
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
		client.snapshot(data);
	});

	socket.on("tchat", function(data){
		for(var i in client.ignoredPlayers){
			if(client.ignoredPlayers[data.pseudo.toLowerCase()]){
				return;
			}
		}
		data.pseudo = "<span class='pointer' onclick='profil("+data.pID+")'>"+data.pseudo+"</span>";
		var msg = convertToLinks(htmlEntities(data.message));
		if(data.type == "private"){
			if(data.from){
				addMessageToTchat("De "+data.pseudo+" : "+msg, "private");
			}else{
				addMessageToTchat("A "+data.pseudo+" : "+msg, "private");
			}
		}else{
			addMessageToTchat(data.pseudo+" : "+msg, "");
		}
	});

	socket.on("information", function(data){
		addMessageToTchat(htmlEntities(data), "information");
	});

	socket.on("newPlayer", function(data){
		client.room.addPlayer(new Player(data), data.team);
		client.display.displayRoomPlayers();
	});

	socket.on("deletePlayer", function(data){
		client.room.deletePlayer(data);
		client.display.displayRoomPlayers();
	});

	socket.on("playersStats", function(data){
		var html = "{{online}} connectés<br/>{{active}} actifs<br/>{{register}} inscrits<br/>";
		$(".nbPlayers").html(Mustache.render(html, data));
	});

	socket.on("nbGames", function(data){
		$("#inProgressGames").text(data);
	});

	socket.on("goal", function(data){
		$("#score"+data.team).text(data.score);
		client.display.particles.push(new Particle({sprite:new Sprite(client.display.sprites["marqueurgoal"+data.team]), x:125, y:225, w:300, h:100, life:60}));
	});

	socket.on("changeSide", function(data){
		client.room.changeSide();
		client.display.particles.push(new Particle({sprite:new Sprite(client.display.sprites["mitemps"]), x:125, y:350, w:300, h:100, life:120}));
	});

	socket.on("inProgressGames", function(data){
		if(client && client.display){
			client.display.inProgressGames(data);
		}
	});

	socket.on("gameCreation", function(data){
		if(client && client.display){
			client.display.gameCreation(data);
		}
	});

	socket.on("ranking", function(data){
		if(client && client.display){
			client.display.ranking(data);
		}
	});

	socket.on("profil", function(data){
		if(client && client.display){
			client.display.profil(data);
		}
	});

	socket.on("scoreboard", function(data){
		if(client && client.display){
			client.display.scoreboard(data);
		}
	});

	//PING
	setInterval(function(){
		socket.emit("ping", Date.now());
	}, 1000);

	socket.on("pong", function(data){
		client.ping = Date.now() - data;
	});
});