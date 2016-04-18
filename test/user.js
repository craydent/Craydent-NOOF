require('./Base.js');
Namespace("Datu", Public(function Users (params) {}).extendsFrom(Items));

Namespace("Datu", Public(function User (params) {
	var dt = $c.now() , dob = new Date(params && params.date_of_birth || '');
	public.type = "User";
	public.first_name = "";
	public.last_name = "";
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


}).extendsFrom(Base));