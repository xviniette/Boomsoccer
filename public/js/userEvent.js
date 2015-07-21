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

	document.body.addEventListener("keydown", function(e) {
		var FocusTchat = 9;
		if($('input:focus').length == 0 ){
			//Choix changement input
			if(nextInput != null){
				inputsKeyCode[nextInput] = e.keyCode;
				localStorage.setItem("inputsConfig", JSON.stringify(inputsKeyCode));
				client.display.options();
				nextInput = null;
			}else{
				client.keys[e.keyCode] = true;
				if(e.keyCode == FocusTchat){
					e.preventDefault();
					$("#inputTchat").focus();
				}
			}
		}
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
			if(text[0] && text[0] == "/"){
				var split = text.split(" ");
				switch(split[0]) {
					case "/ignore":
					if(client.ignoredPlayers[split[1].toLowerCase()]){
						delete client.ignoredPlayers[split[1].toLowerCase()];
						var msgDiv = $("#messages");
						msgDiv.append("<li class='information'>Vous n'ignorez plus "+split[1]+".</li>");
						msgDiv.animate({scrollTop:$("#messages").prop('scrollHeight')}, 0);
					}else{
						client.ignoredPlayers[split[1].toLowerCase()] = 1;
						var msgDiv = $("#messages");
						msgDiv.append("<li class='information'>Vous ignorez "+split[1]+".</li>");
						msgDiv.animate({scrollTop:$("#messages").prop('scrollHeight')}, 0);
					}
					break;
					default:
					socket.emit("tchat", text);
				}
			}else{
				socket.emit("tchat", text);
			}
		}
		$('#inputTchat').val("");
	});

	$("#closePopup").click(function(e){
		$("#popup").hide();
	});

	$("#leave").click(function(e){
		socket.emit("leave");
	});

	$('#canvas').on('mousewheel', function(event) {
		if(event.deltaY > 0){
			client.display.scale += 0.1;
		}else if(event.deltaY < 0 && client.display.scale > 0){
			client.display.scale -= 0.1;
		}
	});


	setScreenSize();
	$(window).resize(function(){
		setScreenSize();
	});
});