var FPS = 60;
var NETWORKFPS = 60;
var INTERPOLATION = Math.floor(1000/NETWORKFPS * 2);
var NBGAMEPLACEMENT = 5;


var isValidPseudo = function(pseudo){
	if (pseudo.length <= 20 && /^([a-zA-Z0-9]+)$/.test(pseudo)){
		return true;
	}
	return false;
}

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}