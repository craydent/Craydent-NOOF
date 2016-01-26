var noof = require('./craydent-noof.js');
for (var prop in noof) {
	if (!noof.hasOwnProperty(prop)) { continue; }
	GLOBAL[prop] = noof[prop];
}