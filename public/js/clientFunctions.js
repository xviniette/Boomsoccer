var setScreenSize = function(){
	var jeu = $("#jeu");
	var bW = 1024;
	var bH = 768;

	var sW = $(window).width();
	var sH = $(window).height();

	var rW = sW/bW;
	var rH = sH/bH;

	if(rW < rH){
		//on gere en fonction de la largeur
		var scale = sW/bW;
	}else{
		//on gere en fonction de la hauteur
		var scale = sH/bH;
	}
	client.scale = scale;
	jeu.css("top", (sH/2 - (bH/2)*scale)+"px");
	jeu.css("left", (sW/2 - (bW/2)*scale)+"px");
	jeu.css({
		'zoom' : scale,
		'-moz-transform'    : 'scale(' + scale + ')',
		'-o-transform'    : 'scale(' + scale + ')',
	});
}


function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

var menuOptions = function(nb){
	switch(nb) {
		case 'creation':
		socket.emit("gameCreation");
		break;
		case 'games':
		socket.emit("inProgressGames");
		break;
		case 'ranking':
		socket.emit("ranking");
		break;
		case 'options':
		client.display.options();
		break;
		case 'help':
		client.display.help();
		break;
	}
}


var spectate = function(id){
	socket.emit("spectate", {id:id});
	$("#popup").hide();
}

var createParty = function(){
	socket.emit("createFunGame", {name:document.getElementById("creation_nom").value, map:document.getElementById("creation_map").value, password:document.getElementById("creation_password").value});
	$("#popup").hide();
}

var matchmaking = function(){
	var checkedValue = null; 
	var maps = [];
	var inputElements = document.getElementsByClassName('mapChoice');
	for(var i=0; inputElements[i]; ++i){
		if(inputElements[i].checked){
			checkedValue = inputElements[i].value;
			maps.push(checkedValue);
		}
	}
	localStorage.setItem("choosenMaps", maps);
	socket.emit("matchmaking", maps);
	$("#popup").hide();
}

var join = function(id){
	socket.emit("joinFunGame", {id:id, password:document.getElementById("password_"+id).value});
}

var changeInput = function(inp){
	nextInput = inp;
}

var profil = function(id){
	socket.emit("profil", id);
}

function convertToLinks(text) {
	var replaceText, replacePattern1;
	replacePattern1 = /(\b(https?):\/\/[-A-Z0-9+&amp;@#\/%?=~_|!:,.;]*[-A-Z0-9+&amp;@#\/%=~_|])/ig;
	replacedText = text.replace(replacePattern1, '<a title="$1" href="$1" target="_blank">$1</a>');
	replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
	replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');
	return replacedText;
}

function addMessageToTchat(msg, classe){
	var date = new Date();
	var msgDiv = $("#messages");
	var pattern = "<li class=\"{{c}}\">[{{d}}] {{{msg}}}</li>";
	var d = {
		d:date.getHours()+":"+date.getMinutes(),
		msg:msg,
		c:classe
	};
	msgDiv.append(Mustache.render(pattern, d));
	msgDiv.animate({scrollTop:$("#messages").prop('scrollHeight')}, 0);
}