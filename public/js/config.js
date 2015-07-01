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

function getRank(elo, played){
	var miniElo = 800;
	var ecartLevel = 100;
	var d = {rank:0,points:0};
	if(played == null || played >= NBGAMEPLACEMENT){
		d.rank = Math.floor((elo-miniElo)/ecartLevel)+1;
		if(d.rank < 1){
			d.rank = 1;
		}else if(d.rank > 15){
			d.rank = 15;
		}
		d.points = elo - ((d.rank-1)*ecartLevel+miniElo);
	}	
	return d;
}

function clone(src) {
	function mixin(dest, source, copyFunc) {
		var name, s, i, empty = {};
		for(name in source){
			// the (!(name in empty) || empty[name] !== s) condition avoids copying properties in "source"
			// inherited from Object.prototype.	 For example, if dest has a custom toString() method,
			// don't overwrite it with the toString() method that source inherited from Object.prototype
			s = source[name];
			if(!(name in dest) || (dest[name] !== s && (!(name in empty) || empty[name] !== s))){
				dest[name] = copyFunc ? copyFunc(s) : s;
			}
		}
		return dest;
	}

	if(!src || typeof src != "object" || Object.prototype.toString.call(src) === "[object Function]"){
		// null, undefined, any non-object, or function
		return src;	// anything
	}
	if(src.nodeType && "cloneNode" in src){
		// DOM Node
		return src.cloneNode(true); // Node
	}
	if(src instanceof Date){
		// Date
		return new Date(src.getTime());	// Date
	}
	if(src instanceof RegExp){
		// RegExp
		return new RegExp(src);   // RegExp
	}
	var r, i, l;
	if(src instanceof Array){
		// array
		r = [];
		for(i = 0, l = src.length; i < l; ++i){
			if(i in src){
				r.push(clone(src[i]));
			}
		}
		// we don't clone functions for performance reasons
		//		}else if(d.isFunction(src)){
		//			// function
		//			r = function(){ return src.apply(this, arguments); };
	}else{
		// generic objects
		r = src.constructor ? new src.constructor() : {};
	}
	return mixin(r, src, clone);

}