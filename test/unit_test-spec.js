//var expect = require('chai').expect;
var craydent = require('craydent');
var $n = require('../craydent-noof.js');
$c.DEBUG_MODE = true;
// TODO: String
describe ('Abstrace', function () {
	$n.Abstract(function Base() {
		public._id = null;
		public.type = "";
		public.name = "";
		public.created_by = "";
		public.created_date = 0;
		public.last_updated_by = "";
		public.last_updated_date = 0;
		public.active = 1;
		protected.hidden = true;

		public.method.foo = function () { return true; };
		protected.method.bar = function () { return true; };
	});

});

describe ('Interface', function () {
	$n.Interface(function IClass () {
		private.ssn;
		protected.dob;
		public.id;


		public.method.foo;
		protected.method.protect;
		private.method.private_method;
	});
	try {
		$n.Public(function () {

		}).implementsInterface(IClass);
	} catch(e) {

	}
});
describe ('Namespace', function () {

});
describe ('Public', function () {


});
describe ('Use', function () {

});