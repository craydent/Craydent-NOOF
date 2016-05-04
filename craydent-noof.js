/*
 * To Do:
 *  make private variables and methods only availabe to the declaring class
 *  create final property and methods to prevent override
 *  create abstract property and methods to ensure implementation
 */
require('craydent');

$g.GarbageCollector = [];
var modifiers = ['private','protected','public','this'];
var modAccessible = ['public','this'];
var modInAccessible = ['private','protected'];
function __getClassProperties (cls) {
    return (__removeComments(cls).match(RegExp('(this|private|protected|public)\.(.|\n|\r\n)*?;','g'))||[]).map(function (p) {
        var prop = p.replace(/\./g, '_____').replace(';',''),
            index = -1;
        if ((index = prop.indexOf("=")) != -1) {
            prop = prop.substring(0,index).trim();
        }

        if (prop.indexOf("this_____") == 0) {
            prop = prop.replace('this','public');
        }
        if (!tryEval("typeof " + prop)) {
            return undefined;
        }
        return prop;
    });
}
function __getUnformattedPropertyName(prop, details) {
    var arr = prop.split('_____');
    details = details || {};
    details.accessModifier = arr[0];
    if (arr.length > 1 && arr[1] == "method") {
        details.isMethod = true;
        arr.splice(0,2);
        return arr.join('_____');
    }

    return arr.splice(1,arr.length).join('_____');
}
function __removeComments(cls){
    return cls.toString().replace(/\/\/[\s\S]*?\n/g,'').replace(/\/\*[\s\S]*?\*\//g,'');
}
function __processParameter (parameter) {
    var pval,pclass = "any",extra = "";
    if ($c.contains(parameter,'=')) {
        var varval = parameter.split('=');
        parameter = varval[0];
        pval = varval[1];
    }
    var strongvar = parameter;
    var fargparts = parameter.split('.');
    if (fargparts.length > 2) {
        throw "malformatted argument: " + parameter;
    } else if (fargparts.length == 2) {
        pclass = fargparts[0];
        parameter = fargparts[1];
    }
    if (pval) {
        extra += "this." + parameter + " = " + "this." + parameter + " || " + pval;
    }
    if (pclass && pclass != "any") {
        var typeError = "'Invalid Type: " + parameter + " must be type "+pclass+"'";
        extra += "if (!$c.isNull(this." + parameter + ") && " + "this." + parameter + ".constructor != " + pclass + ") { throw new Error("+typeError+");}";
        extra += "var ___"+parameter+" = this."+parameter+";"
        extra += "this.__defineSetter__('"+parameter+"', function(val){ if (!$c.isNull(val) && val.constructor != " + pclass + ") { throw new Error('Invalid Type: " + parameter + " must be type "+pclass+"'); }___"+parameter+" = val; });"
        extra += "this.__defineGetter__('"+parameter+"', function(){ return ___"+parameter+"; });"
    }
    return {name:parameter,type:pclass,code:extra};

}
function __strongerType(cls, options) {
    if (!cls || !cls.isFunction()) {
        throw options.missing;
    }

    var blocks = __processClass(cls),
        name = cls.name,
        a = eval("(function "+name+" () {throw \""+options.instantiation+"\";})");
    a.___type = options.type;
    a.methods = {public:[],protected:[],private:[],"this":[]};
    a.properties = {public:[],protected:[],private:[],"this":[]};

    for (var i = 0, len = blocks.length; i < len; i++) {
        var parts = blocks[i].match(/^(this|private|protected|public)\.([\s\S]*?)(?:=\s*?([\s\S]*;)|;)/);
        if (parts && parts.length == 4) { // is some kind of class property [0]=>block [1] => access modifier [2] => property [3] => value
            var part = {}, value;
            parts[2] = parts[2].trim();
            part[parts[2]] = parts[3];
            value = $c.tryEval($c.strip(parts[3] || "",';'));

            if (parts[2].startsWith('method.')) {// this is a methodvar name = parts[2].replace('method.','');
                var mparts = parts[2].match(/method\.([^\s]*?)\s*(?:\((.*?)\))?$/), afunc;
                var pname = mparts[1];

                delete part[parts[2]];
                part[pname] = parts[3];
                part.__name = pname;
                part.__args = [];


                if (!value && parts[3]) {
                    afunc = $c.strip(parts[3],';');
                    var fargs = $c.getParameters(afunc);
                    var extra = "",parameters = [];
                    for (var k = 0, klen = fargs; k < klen; k++) {
                        var farg = __processParameter(fargs[k]);
                        extra += farg.code;
                        part.__args.push(farg);
                    }
                    if (extra) {
                        value = $c.tryEval(afunc.replace(/function\s*(\*?)\s*\(.*?\)\s*?\{/,"function$1 ("+parameters.join(',')+"){" + extra));
                    }
                } else {
                    if (mparts[2]) {
                        var args = mparts[2].split(',');

                        for (var j = 0, jlen = args.length; j < jlen; j++) {
                            var arg = __processParameter(args[j]);
                            //var arg = {name: args[j], type: "any"};
                            //var aparts = args[j].split('.');
                            //if (aparts.length > 2) {
                            //    throw "malformatted argument: " + args[j];
                            //} else if (aparts.length == 2) {
                            //    arg.name = aparts[0];
                            //    arg.type = aparts[1];
                            //}
                            part.__args.push(arg);
                        }
                    }
                }
                part.__value = value;
                a.methods[parts[1].trim()] = a.methods[parts[1].trim()] || [];
                a.methods[parts[1].trim()].push(part);
            } else {// this is a property
                var parg = __processParameter(parts[2].trim());
                part.__name = parg.name;
                part.__type = parg.type;
                part.__code = parg.code;
                part.__value = value;
                a.properties[parts[1].trim()] = a.properties[parts[1].trim()] || [];
                a.properties[parts[1].trim()].push(part);
            }
        } else {
            throw "There can not be code block in abtract classes and interfaces";
        }
    }

    return $g[name] = a;
}
function __processClass(cls) {
    var clsStr = __removeComments(cls);
    var clsName = cls.name;
    var regexp = new RegExp('\\s*?function\\s*?'+clsName+'\\s*?\\([\\s\\S]*?\\)[\\s\\S]*?\\{');
    var lastIndex = clsStr.lastIndexOf('}');
    if (clsStr[lastIndex-1] == ';') {
        lastIndex--;
    }
    var lines = clsStr.substring(0,lastIndex).replace(regexp, '').split(';').map(function(item){return item.trim();});
    var fullLines = [];
    for (var i = 0, len = lines.length, line = lines[i]; i < len; line = lines[++i]) {
        var lbraceCount = line.replace(/[^{]/g, "").length,
            rbraceCount = line.replace(/[^}]/g, "").length,
            lparenCount = line.replace(/[^(]/g, "").length,
            rparenCount = line.replace(/[^)]/g, "").length;
        if (lbraceCount == rbraceCount && lparenCount == rparenCount) {
            if (!line) {
                continue;
            }
            fullLines.push(line+";");
        } else {
            while ((lbraceCount != rbraceCount || lparenCount != rparenCount) && i < len) {
                line += ";"+lines[++i];
                lbraceCount = line.replace(/[^{]/g, "").length;
                rbraceCount = line.replace(/[^}]/g, "").length;
                lparenCount = line.replace(/[^(]/g, "").length;
                rparenCount = line.replace(/[^)]/g, "").length;
            }
            if (lbraceCount != rbraceCount ||  lparenCount != rparenCount) {
                throw "syntax problem " + clsName;
            }
            if (!line) {
                continue;
            }
            fullLines.push(line+";");
        }
    }
    return fullLines.condense();
}
function __processBlocks(blocks, a, abstractClass, log) {
    if (!abstractClass) {
        var methods = [];
        for (var i = 0, len = blocks.length; i < len; i++) {
            if (blocks[i].startsWith("var ")) {//private var(s)
                var vars = blocks[i].replace("var ",'').slice(0,-1).split(',').map(function(str){
                    return str.split('=').map(function(val){return val.trim();});
                });// vars=[[var, value]]
                for (var j = 0, jlen = vars.length; j < jlen; j++) {
                    var item = {};
                    var parg = __processParameter(vars[j][0]);
                    //item.__name = vars[j][0];
                    item.__name = parg.name;
                    item.__type = parg.type;
                    item.__code = parg.code;
                    item[item.__name] = item.__value = vars[j][1];
                    a.properties["private"].push(item);
                }
            } else if (blocks[i].startsWithAny("this.","public.","private.","protected.") && !blocks[i].startsWithAny("this.__define","public.__define","private.__define","protected.__define")) {
                var parts = blocks[i].match(/^(this|private|protected|public)\.([\s\S]*?)(?:=\s*?([\s\S]*;)|;)/);
                if (parts && parts.length == 4) { // is some kind of class property [0]=>block [1] => access modifier [2] => property [3] => value
                    var part = {}, value;
                    //part[parts[2]] = parts[3];
                    value = parts[3] && ($c.tryEval(parts[3]) || $c.tryEval(parts[3].slice(0,-1)));
                    //part.__name = parts[2].trim();
                    if (parts[2].startsWith('method.') /*|| (value && value.isFunction())*/) {// this is a methodvar name = parts[2].replace('method.','');
                        var mparts = parts[2].match(/method\.([^\s]*?)\s*(?:\((.*?)\))?\s*$/), afunc;

                        part.__name = mparts[1];
                        part[part.__name] = part.__value = parts[3];
                        part.__args = [];

                        var index, args = null;
                        if ((index = part.__name.indexOf('(')) != -1) {
                            args = part.__name.substring(index + 1, part.__name.length - 1).split(',');
                            part.__name = part.__name.substring(0,index);
                        } else if (mparts[2]) {
                            args = mparts[2].split(',');
                        }


                        afunc = $c.strip(parts[3],';');
                        var fargs = args || $c.getParameters(afunc);
                        var extra = "",parameters = [];
                        for (var k = 0, klen = fargs.length; k < klen; k++) {
                            var farg = __processParameter(fargs[k]);
                            parameters.push(farg.name);
                            extra += farg.code;
                            part.__args.push(farg);
                        }
                        if (extra) {
                            var regex = /function\s*(\*?)\s*\(.*?\)\s*?\{/, replacer = "function$1 ("+parameters.join(',')+"){";
                            value = $c.tryEval(afunc.replace(regex,replacer + extra));
                            parts[3] = parts[3].replace(regex,replacer)
                        }

                        var index = -1;
                        if ((index = methods.indexOf(part.__name)) == -1) {
                            methods.push(part.__name);
                        } else {
                            var amods = $c.contains(modAccessible,parts[1]) ? modAccessible : modInAccessible;
                            for (var j = 0, jlen = amods.length; j < jlen; j++) {
                                var modifier = amods[j];
                                do {
                                    var mindex = $c.indexOfAlt(a.methods[modifier],part.__name,function(item){return item.__name;});
                                    if (mindex == -1) { continue; }
                                    if ($c.equals(a.methods[modifier][mindex].__args, part.__args)) {
                                        throw 'Duplicate Error: ' + part.__name + ' has been already declared with the same signature.';
                                    }
                                    a.methods[modifier][index].__overloaded = part.__overloaded = true;
                                } while ((index = methods.indexOf(part.__name, index + 1)) != -1);
                            }
                        }

                        a.methods[parts[1]].push(part);
                    } else {// this is a property
                        var parg = __processParameter(parts[2].trim());
                        part.__name = parg.name;
                        part.__type = parg.type;
                        part.__code = parg.code;
                        if (value && value.isFunction()) {
                            part.__args = [];
                            var index = -1;
                            if ((index = methods.indexOf(part.__name)) == -1) {
                                methods.push(part.__name);
                            } else {
                                for (var j = 0, jlen = modifiers.length; j < jlen; j++) {
                                    var modifier = modifiers[j];
                                    do {
                                        if ($c.isEqual(a.methods[modifier][index].__args, part.__args)
                                            && ($c.contains(modAccessible,modifier) && $c.contains(modAccessible,parts[1]) || $c.contains(modInAccessible,modifier) && $c.contains(modInAccessible,parts[1]))) {
                                            throw 'Duplicate Error: ' + part.__name + ' has been already declared with the same signature.';
                                        }
                                        a.methods[modifier][index].__overloaded = part.__overloaded = true;
                                    } while ((index = methods.indexOf(part.__name, index + 1)) != -1);
                                }
                            }
                            a.methods[parts[1]].push(part);
                        } else {
                            a.properties[parts[1]].push(part);
                        }
                    }

                    part[part.__name] = part.__value = parts[3];
                    blocks[i] = (parts[1] == "private" || parts[1] == "protected"?"var ":"this.") +
                        part.__name + (parts[3] ? "=" + parts[3] : "")+";";
                }
            }
        }
    } else {
        var aMethods = abstractClass.methods,
            aProperties = abstractClass.properties;

        for (var modifier in aMethods) {
            var methods = aMethods[modifier];
            for (var i = 0, len = methods.length; i < len; i++){
                var methodName = methods[i].__name.trim(),
                    method = {__name:methodName};
                method[methodName] = method.__value = methods[i][methodName];
                a.methods[modifier].push(method);
            }
        }

        for (var modifier in aProperties) {
            var properties = aProperties[modifier];
            for (var i = 0, len = properties.length; i < len; i++){
                var propertyName = properties[i].__name.trim(),
                    property = {__name:propertyName};
                property[propertyName] = property.__value = properties[i][propertyName];
                a.properties[modifier].push(property);

                var value = tryEval(properties[i][propertyName]);
                if (value && value.isFunction()) {
                    a.methods[modifier].push(property);
                }
            }
        }

    }
}
function __getFuncArgs (func) {
    return func.toString().trim().replace(/\s*/gi, '').replace(/.*?\((.*?)\).*/, '$1').split(',');
}
function __checkDefined (modifiers, spec) {
    //var tName = spec.__name;
    var args = [],types = [];
    if (spec.__args) {
        for (var i = 0, len = spec.__args.length; i < len; i++) {
            args.push(spec.__args[i].name);
            types.push(spec.__args[i].type);
        }
    }
    var len = args.length;

    for (var modifier in modifiers) {
        if (!modifiers.hasOwnProperty(modifier)){
            continue;
        }
        var filtered = modifiers[modifier].filter(function (item){
            if (spec.__args && spec.__args.length) {
                if (item.__args.length != len) { return false; }
                for (var i = 0; i < len; i++) {
                    if (types[i] != "any" && (types[i] != item.__args[i].type || args[i] != item.__args[i].name)) {
                        return false;
                    } else if (types[i] == "any" && args[i] != item.__args[i].name) {
                        return false;
                    }
                }
                return true;
                //return $c.equals($c.getParameters(item[item.__name]), args);
                //return $c.equals(item.__args, spec.__args);
            }
            return spec.__name == item.__name;
            //return item.__name == tName ;
        });
        if(!filtered.isEmpty()) {
            return filtered;
        }
    }
    return false;
}
module.exports.Abstract = function (acls) {
    return __strongerType(acls, {
        missing : "Abstract: missing required Class parameter",
        instantiation : "Abstract Class can not be instantiated",
        type : 1
    });
};
module.exports.Interface = function (icls) {
    return __strongerType(icls, {
        missing : "Interface: missing required Class parameter",
        instantiation : "Interfaces can not be instantiated",
        type : 0
    });
};
module.exports.Namespace = function (name,cls){
    if (name.indexOf('.') == -1) {
        !$g[name] && ($g[name] = "");
        $g[name] += cls.toString();
    } else {
        var np = name.split('.')[0];
        !$g[name] && ($g[name] = "");
        $g[name] += cls.toString();
        $g.setProperty(name+"."+cls.name,cls);
    }
};
module.exports.Public = function (cls) {
    var blocks = __processClass(cls),
        name = cls.name,
        a = {methods:{public:[],protected:[],private:[],"this":[]},properties:{public:[],protected:[],private:[],"this":[]}},
        properties = "", methods = "", body = "";
    __processBlocks(blocks, a);

    for (var i = 0, len = modifiers.length; i < len; i++) {
        var modifier = modifiers[i],
            props = a.properties[modifier],
            meths = a.methods[modifier],
            context = modAccessible.indexOf(modifier) == -1 ? "var " : "this.";
        for (var j = 0, jlen = props.length; j < jlen; j++) {
            body += context + props[j].__name + " = " + props[j].__value + (props[j].__code || "") + ";";
        }
        for (var j = 0, jlen = meths.length; j < jlen; j++) {
            var func = meths[j];
            if (func.__overloaded) {
                var fname = func.__name;
                // first time
                var ofuncname = "_" + fname + j, routeCode = "";
                var condition = "arguments.length == " + func.__args.length;
                var funcSyntax = context + fname + " = function(){";
                for (var k = 0, klen = func.__args.length; k < klen; k++) {
                    var arg = func.__args[k];
                    if (arg.type != "any") {
                        condition += " && ($c.isNull(arguments[" + k + "]) || arguments[" + k + "].constructor == " + arg.type + ")";
                    }
                }
                routeCode += "if(" + condition + ") { return " + ofuncname + ".apply(this,arguments); }";
                if (body.indexOf(funcSyntax) == -1) {
                    body += funcSyntax + routeCode + "};";
                }  else {
                    body = body.replace(funcSyntax, funcSyntax + routeCode);
                }
                body += "function " + ofuncname + func.__value.replace('function','');
            } else {
                body += context + meths[j].__name + " = " + meths[j].__value + (meths[j].__code || "");
            }
        }
    }

    $g[name] = eval("(function "+name+"("+__getFuncArgs(cls).join(',')+"){var self=this;"+body+
        "self.destruct = self.destruct && self.destruct.isFunction() ? self.destruct : function(){};self.construct && self.construct.isFunction() && self.construct.apply(self,arguments);$g.GarbageCollector.push(this);return this;})");
    $g[name].methods = a.methods;
    $g[name].properties = a.properties;
    return $g[name];
};
module.exports.Use = eval;

Function.prototype.extendsFrom = function (cls) {
    if (cls.___type === 0) {
        throw "Class is not extendible";
    }
    if (cls.___type !== 1 && this.__type === 1) { // when trying to extend an abstract class with a normal class
        throw "Abstract classes cannot extend a non-abstract class";
    }
    var clsToExtend,
        isAbstract = cls.___type === 1;
    if (isAbstract) {
        clsToExtend = cls;
    } else {
        clsToExtend = new cls();
    }
    isAbstract = this.___type === 1;
    var blocks = __processClass(this),
        name = this.name,
        a = this.methods ? this : {methods:{public:[],protected:[],private:[],"this":[]},properties:{public:[],protected:[],private:[],"this":[]}};

    if (!isAbstract) {
        __processBlocks(blocks, a);
    } else {
        a.methods = this.methods;
        a.properties = this.properties;
    }

    var aMethods = cls.methods,
        aProperties = cls.properties,
        aname = cls.name,
        missingItems = {methods:{public:[],protected:[],"this":[]},properties:{public:[],protected:[],"this":[]}},
        existingItems = {methods:{public:[],protected:[],"this":[]}};

    for (var i = 0, obj = aMethods,type = "methods"; i < 2; obj = aProperties,type = "properties", i++) {
        for (var modifier in obj) {
            if (modifier == "private" || !obj.hasOwnProperty(modifier)) {
                continue;
            }
            var types = obj[modifier];

            for (var j = 0, jlen = types.length; j < jlen; j++) {
                var tName = types[j].__name;
                if (!__checkDefined(a[type], tName)) {
                    if (!isAbstract) {
                        missingItems[type][modifier].push(types[j]);
                    } else if (type == "methods") {
                        this[type][modifier].push(types[j]);
                    }
                } else if (type == "methods" || tName == "construct" || tName == "destruct")  {
                    existingItems["methods"][modifier].push(types[j]);
                }
            }
        }
    }

    if (isAbstract) {
        return this;
    }

    var existingItem = existingItems["methods"],
        parent = "var parent = {";
    for (var modifier in existingItem) {
        if (!existingItem.hasOwnProperty(modifier)) {
            continue;
        }
        var prefix = "var ";
        if (modifier == "public" || modifier == "this") {
            prefix = "this.";
        }

        for (var j = 0, item = existingItem[modifier][j]; item; item = existingItem[modifier][++j]) {
            var pname = item.__name;
            parent += '"' + pname + "\":" + (item[pname]||"foo").strip(';') +",";
        }
    }

    var additional = "";
    for (var i = 0, missingItem = missingItems["methods"]; i < 2; obj = aProperties,missingItem = missingItems["properties"], i++) {
        for (var modifier in missingItem) {
            if (!missingItem.hasOwnProperty(modifier)) {
                continue;
            }
            var prefix = "var ";
            if (modifier == "public" || modifier == "this") {
                prefix = "this.";
            }

            for (var j = 0, item = missingItem[modifier][j]; item; item = missingItem[modifier][++j]) {
                var pname = item.__name;
                additional += prefix + pname + "=" + $c.parseRaw(item.__value)+";";
            }

        }
    }
    parent = parent.strip(',') + "};";
    var init_code = "var self=this;" +
        "self.destruct && self.destruct.isFunction() ? self.destruct : function(){};" +
        "self.construct && self.construct.isFunction() && self.construct.apply(self,arguments);" +
        "$g.GarbageCollector.push(this);return this;";
    $g[name] = eval("(function "+name+"("+__getFuncArgs(this).join(',')+"){"
        +additional
        +parent
        +blocks.join('')
        +(blocks.contains("$g.GarbageCollector.push(this);") ? "" : init_code)
        +"})".replace_all(';;',';'));
    for (var i = 0, prop = "methods"; i < 2; prop = "properties", i++) {
        for (var modifier in missingItems[prop]) {
            a[prop][modifier] = (a[prop][modifier] || []).concat(missingItems[prop][modifier] || []);
        }
    }
    $g[name].methods = a.methods;
    $g[name].properties = a.properties;

    return $g[name]
};
Function.prototype.implementsInterface =  function (cls) {
    if (cls.___type !== 0) {
        throw "Class is not an Interface";
    }
    var blocks = __processClass(this),
        name = this.name,
        isAbstract = this.___type === 1,
        a = this || {methods:{public:[],protected:[],private:[],"this":[]},properties:{public:[],protected:[],private:[],"this":[]}};
    this.methods || __processBlocks(blocks, a, isAbstract && this,true); // this alters blocks and a
    var iMethods = cls.methods,
        iProperties = cls.properties,
        iname = cls.name;

    for (var modifier in iMethods) {
        var methods = iMethods[modifier];
        for (var i = 0, len = methods.length; i < len; i++) {
            var methodName = methods[i].__name,
                method = __checkDefined(a.methods, methods[i]);
//            method = a.methods.filter(function(item){return item.__name == methodName;});
//            if (method.isEmpty()) {
            if (!method) {
                var sig = "";
                for (var j = 0, jlen = methods[i].__args.length; j < jlen; j++) {
                    var arg = methods[i].__args[j]
                    sig += arg.type + "." +arg.name + ",";
                }
                throw "Interface " + iname + " " + "must implement " + methodName + "("+$c.strip(sig,',')+")";
            }
            var value = eval("("+method[0][methodName].slice(0,-1)+")");
            if (!value || (!$c.isFunction(value) && !$c.isGenerator(value))) {
                throw "Interface " + iname + " property " + methodName + " must be a function";
            }
        }
    }
    for (var modifier in iProperties) {
        var properties = iProperties[modifier];
        for (var i = 0, len = properties.length; i < len; i++) {
            var propertyName = properties[i].__name;
//            if (a.properties.filter(function(item){return item.__name == propertyName;}).isEmpty()) {
            if (!__checkDefined(a.properties, properties[i])) {
                throw propertyName + " must be defined";
            }
        }
    }
    // if it gets to here the class passes the contract

    if (isAbstract) {
        return this;
    }

    return $g[name] = eval("(function "+name+"("+__getFuncArgs(this).join(',')+"){"+blocks.join('')+"}"+")");
};

function getDocumentation (cls, html) {
    var str = "", nl = "\n", tb="    ";
    html && (nl = "<br />");

    str += cls.name + ":" + nl + nl;
    for (var i = 0, pm = ['properties','methods'], prop = pm[i]; i < 2; prop = pm[++i]) {
        for (var j = 0, am = ['private','protected','public','this']; j < 4; j++) {
            am[j] != 'this' && (str += tb + am[j] + " " + prop + ": " + cls[prop][am[j]].length + nl);
            for (var k = 0, klen = cls[prop][am[j]].length, name = ""; k < klen; k++) {
                name = cls[prop][am[j]][k].__name;
                str += tb + tb + name + " ";
                if (prop == "properties") {
                    str += "(default:" + cls[prop][am[j]][k][name] + ")" + nl;
                } else if (prop == "methods") {
                    var params = __getFuncArgs(cls[prop][am[j]][k][name]);
                    str += "(parameters : " + params.length + ")" + nl;
                    for (var l = 0, llen = params.length; l < llen; l++) {
                        str += tb + tb + tb + params[l] + nl;
                    }
                }
            }
        }
    }
}