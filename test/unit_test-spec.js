//var expect = require('chai').expect;
var craydent = require('craydent');
var $n = require('../craydent-noof.js');
$n.Abstract(function BaseU(){
	public._id = null;
	public.cuid = $c.cuid();
	public.type = "";
	public.name = "";
	public.created_by = "";
	public.created_date = 0;
	public.last_updated_by = "";
	public.last_updated_date = 0;
	public.active = 1;
	protected.mdb = null;

	public.construct = function (params) {
		_set_values(params);
	};
	/*Overloads*/
	protected.method._add = function (/*prop, key, value, callback*/) {
		try {
			var prop = arguments[0],
				key = arguments[1],
				value = arguments[2],
				callback = arguments[3];
			if (!callback && !self[prop].contains(key)) {
				self[prop].push(key);
			} else if (callback && !self[prop][key]) {
				self[prop][key] = value;
			} else {
				return _final(callback)({error:"Value already exists in " + prop},{});
			}
			self.save(callback || value);

		} catch (e) {
			logit(e);
			return false;
		}
	};
	protected.method._final = function (callback, multi) {
		callback = callback || foo;
		return (function (err, data) {
			if (!multi && data && data[0]) {
				data = data[0];
			}
			_set_values(data);
			callback.call(self, err || data, mdb);
			destruct();
		}).bind(self);
	};
	protected.method._remove = function (prop, key, callback) {
		try {
			if (self[prop].isArray() && self[prop].contains(key)) {
				self[prop].remove(key);
			} else if (self[prop][key]) {
				delete self[prop][key];
			} else {
				return _final(callback)({error:"Value does not exist in " + prop},{});
			}
			self.save(callback);

		} catch (e) {
			logit(e);
			return false;
		}
	};
	protected.method._set_values = function (obj) {
		obj = obj || {};
		for (var prop in obj) {
			if (obj.hasOwnProperty(prop) && self.hasOwnProperty(prop)) {
				self[prop] = obj[prop];
			}
		}
		self.last_updated_date = new Date();
		if(self._id && self._id != -1 && self._id != "-1"){
			var ObjectID = require("mongodb").ObjectID;
			self._id = new ObjectID(self._id);
		} else {
			self.created_date = new Date();
		}
	};
	protected.method.destruct = function () {
		for (var prop in self) {
			if (self.hasOwnProperty(prop)) {
				delete self[prop];
			}
		}
	};

	public.method.to_object = function (props) {
		var obj = {};
		for (var prop in self) {
			if (prop[0] == "_" && prop != "_id" || !self.hasOwnProperty(prop) || $c.isFunction(self[prop])) {
				continue;
			}
			if (!props || props.contains(prop)) {
				obj[prop] = self[prop];
			}
		}
		return obj;
	};
	public.method.get = function (callback, collection) {
		collection = collection || "item";
		var arg = {};
		arg.condition = {_id:self._id};
		arg.callback = _final(callback);
		arg.table = collection;
		if (self.cuid && (!self._id || self._id == "null")) {
			arg.condition = {cuid:self.cuid};
		}
		mdb.select(arg);
	};
	public.method.query = function (query, callback, collection) {
		collection = collection || "item";
		var arg = {};
		arg.condition = query;
		arg.callback = _final(callback);
		arg.table = collection;

		mdb.select(arg);
	};
	public.method.get_by = function (property, value, callback, collection) {

		var q = {};
		q[property] = value;

		collection = collection || "item";
		var arg = {};
		arg.condition = q;
		arg.callback = _final(callback);
		arg.table = collection;
		mdb.select(arg);
	};
	public.method.remove = function (callback, collection) {
		collection = collection || "item";
		self.update({_id:self._id}, {$set:{active: 0}}, callback);
	};
	public.method.update = function (query, update, callback, collection) {
		collection = collection || "item";
		mdb.update({
			table:collection,
			condition:query,
			update:update,
			callback: _final(callback)
		});
	};
	public.method.save = function (callback, collection) {
		collection = collection || "item";
		mdb.save({table:collection, doc:self.to_object(), callback: _final(callback)});
	};
});
$n.Abstract(function Items(){
	protected.mdb = null;
	public.construct = function (params) {
		if(!mdb) {
			mdb = new MongoDB(params);
		}
	};

	public.method.get_items_by_guid = function (cuid, callback, collection) {
		try{
			self.get_items_by("parent_cuid", cuid, callback, collection);
		} catch (e) {
			logit(e);
			return false;
		}
	};
	public.method.get_items_by = function (property, value, callback, collection) {
		try{
			collection = collection || "item";
			var arg = {}, q = {};
			q[property] = value;
			arg.condition = q;
			arg.callback = _final(callback);
			arg.table = collection;

			mdb.select(arg);
		} catch (e) {
			logit(e);
			return false;
		}
	};
	public.method.query = function (query, callback, collection) {
		collection = collection || "item";
		var arg = {}, singularForm = this.getClass().singularize();
		if (!$c.tryEval(singularForm)) {
			singularForm = this.getClass().slice(0,-1);
		}
		arg.condition = query;
		arg.condition.type = singularForm;
		arg.callback = _final(callback);
		arg.table = collection;
		mdb.select(arg);
	};

	protected.method._final = function (callback) {
		return (function (err, data) {
			callback.call(this, err || data);
			self.final();
		}).bind(self);
	};
	public.method.final = function () {};
});
$n.Namespace("Cray", function TestUse (params) { public.name = tu; });
$n.Namespace("Cray", $n.Public(function User (params) {
	var dt = $c.now() , dob = new Date(params && params.date_of_birth || '');
	public.type = "User";
	public.first_name = "";
	public.last_name = "";
	public.String.name = "";
	public.age = $c.isValidDate(dob) ? dt.getFullYear() - dob.getFullYear() - (dob.getDayOfYear() < dt.getDayOfYear() ? 0 : 1) : 0;
	public.date_of_birth = '';
	public.sex = "";
	public.huid = "";
	public.mrn = "";

	public.tips = [];
	public.nudges = [/*{cuid:"",answer:"",datetime:new Date()}*/];
	public.conditions = {};
	public.other = {};

	public.method.capture_response = function (userid, response) {

	};

	public.method.get_user_info_from_touchworks = function (provider_id, callback) {
		var url = TBONE_SERVER + "/v1/demographics/patients/search/",
			search = encodeURIComponent(self.last_name + ", " + self.first_name + " " + self.date_of_birth);

		var promise = $c.ajax({
			url : url+"?provider_id=" + provider_id + "&search_criteria=" + search,
			port: 1991
		});
		promise.then(function (data) {
			try {
				var pt = data.data[0];
				self.mrn = pt.MRN;
				self.sex = pt.gender;
				var url = TBONE_SERVER + "/v1/PAMI/patient/problems/",
					query = "provider_id=" + provider_id + "&patient_id=" + pt.ID + "&show_by_encounter=N&assessed=ALL&encounter_id=-1&filter_on_id=-1&limit=0";

				var promise1 = $c.ajax({
					url: url + "?" + query,
					port: 1991
				});
				promise1.then(function (data) {
					var i = 0, item;
					while (item = data.data[i++]) {
						if (item.ProblemStatus == "Active") {
							self.conditions[item.problemtext] = 1;
							item.ICD9 && (self.conditions[item.ICD9] = 1);
							item.ICD10 && (self.conditions[item.ICD10] = 1);
						}
					}
					callback(self);
				});
			} catch(e) {
				callback(e);
			}
		});
	};


}).extendsFrom($n.BaseU));

$c.DEBUG_MODE = true;
$n.Interface(function IClass () {
	public.String.name;
	public.method.foo(String.a);
	public.method.foo(Number.a);
	public.method.foo(a,b);
	public.method.foo(a,b,c);
	public.method.foo(a,Array.d,c);
	public.method.bar;
});
$n.Interface(function IClass2 () {
	private.ssn;
	protected.dob;
	public.id;


	public.method.foo;
	protected.method.protect;
	private.method.private_method;
});

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
$n.Abstract(function Base2() {
	public.String._id = null;
	public.Number.created_date = 0;
	public.Boolean.active = 1;
	public.Date.now = null;
	protected.Array.vals = "";

	public.method.foo(String.a) = function(){};
	public.method.foobar = function* (){};
});
$n.Public(function NewClass () {
	public.String.name = "Clark";
	public.method.foo(Number.a) = function(){};
	public.method.foo(String.a,Number.b) = function(){};
	public.method.foo(Object.a, String.b, Boolean.c) = function () {};
	public.method.foo(Number.a,Array.d,Date.c) = function(){};
	public.method.foo(String.a,String.b,String.c,String.d) = function(){};

	public.method.bar = function*(a,b){}
}).extendsFrom($n.Base2).implementsInterface($n.IClass);
describe ('Abstract', function () {
	it('new instance', function(){
		try {
			var nbase = new $n.BaseU();
		} catch (e) {
			expect(e).toBe("Abstract Class can not be instantiated");
		}
	});

	//expect('a').toBe('a');
});

describe ('Interface/Public', function () {
	it('Duplicate signature',function() {
		try {
			$n.Interface(function IClass3() {
				public.String.name;
				public.method.foo(String.a);
				public.method.foo(Number.a);
				public.method.foo(a, b);
				public.method.foo(a, b, c);
				public.method.foo(a, d, c);
				public.method.bar;
			});
		} catch (e) {
			expect(e).toEqual('Duplicate Error: IClass3.foo has been already declared with the same signature.');
		}
	});
	it('Missing class name',function() {
		try {
			$n.Public(function () {

			}).implementsInterface($n.IClass2);
		} catch (e) {
			expect(e).toBe('Public Class can not be anonymous.');
		}
	});
	it('Missing interface methods',function() {
		try {
			$n.Public(function Cls() {

			}).implementsInterface($n.IClass2);
		} catch (e) {
			expect(e).toEqual([ 'Cls implements interface IClass2 which must implement foo()',
			 'Cls implements interface IClass2 which must implement protect()',
			 'Cls implements interface IClass2 which must implement private_method()',
			 'id must be defined',
			 'dob must be defined',
			 'ssn must be defined']);
		}
	});
	it('Missing interface overload',function() {
		try {
			$n.Public(function NewClass () {
				public.String.name = "Clark";
				public.method.foo(Number.a) = function(){};
				public.method.foo(String.a,Number.b) = function(){};
				public.method.foo(Object.a, String.b, Boolean.c) = function () {};
				public.method.foo(String.a,String.b,String.c,String.d) = function(){};

				public.method.bar = function*(a,b){}
			}).extendsFrom($n.Base2).implementsInterface($n.IClass);
		} catch (e) {
			expect(e).toEqual([ 'NewClass implements interface IClass which must implement foo(any.a,Array.d,any.c)' ]);
		}
	});
	it('Interface implements',function() {
		try {
			$n.Public(function NewClass2() {
				public.String.name = "Clark";
				public.method.foo(Number.a) = function () {};
				public.method.foo(String.a, Number.b) = function () {};
				public.method.foo(Object.a, String.b, Boolean.c) = function () {};
				public.method.foo(a, Array.d, c) = function () {};
				public.method.foo(String.a, String.b, String.c, String.d) = function () {};

				public.method.bar = function*(a, b) {};
			}).extendsFrom($n.Base2).implementsInterface($n.IClass);
		} catch (e) {
			expect('not to be here').toBe('');
		}
	});
});
describe ('Namespace/Use', function () {
	$n.Namespace("NP", $n.Public(function Clark () {
		public.type = "";
		public.objectives = [];
		public.description = "";
		public.answers = [];

		public.method.get_recommendations = function () {

		};
		public.method.capture_response = function (userid) {

		};
	}));
	(function (){
		var Clark = $n.Use('NP.Clark');
		expect(Clark).toBe($n.Clark);

		var Cray = $n.Use('Cray');
		expect(Cray).toEqual({TestUse:$n.Use('Cray.TestUse'),User:$n.User});

		var tu = "**********************************";
		eval($n.Use('Cray.TestUse', true));
		var test = new TestUse();
		expect(test.name).toBe(tu);

	})()
});
describe ('Type error', function () {
	var u = new $n.User();
	try {
		u.name = 4;
	} catch (e) {
		expect(e).toEqual(new Error('Invalid Type: name must be type String'));
	}
});