/*/---------------------------------------------------------/*/
/*/ Craydent LLC craydent-noof-v0.1.6                       /*/
/*/ Copyright 2011 (http://craydent.com/about)              /*/
/*/ Dual licensed under the MIT or GPL Version 2 licenses.  /*/
/*/ (http://craydent.com/license)                           /*/
/*/---------------------------------------------------------/*/
/*/---------------------------------------------------------/*/
var noof = require('./craydent-noof.js');
var proto = noof.proto;
for (var i = 0, len = proto.length; i < len; i++) {
	Function.prototype[proto[i]] = noof[proto[i]];
}
for (var prop in noof) {
	if (!noof.hasOwnProperty(prop) || proto.indexOf(prop) != -1) { continue; }
	global[prop] = noof[prop];
}
noof.context = global;
module.exports = noof;