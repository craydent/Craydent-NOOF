Abstract(function Base(){
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

Abstract(function Items(){
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
