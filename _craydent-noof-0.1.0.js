/*
 * To Do:
 *  make private variables and methods only availabe to the declaring class
 *  create final property and methods to prevent override
 *  create abstract property and methods to ensure implementation
 */
if (typeof $g == "undefined") {
    var $g = GLOBAL;
}
$g.GarbageCollector = [];
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
function __strongerType(cls, options) {
    if (!cls || !cls.isFunction()) {
        throw options.missing;
    }
    
    var blocks = __processClass(cls),
    name = cls.getClass(),
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
            part.__name = parts[2];
            value = tryEval(parts[3]);
            
            if (parts[2].startsWith('method.')) {// this is a methodvar name = parts[2].replace('method.','');
                var pname = parts[2].replace('method.','');
                delete part[parts[2]];
                part[pname] = parts[3];
                part.__name = pname;
                a.methods[parts[1].trim()] = a.methods[parts[1].trim()] || [];
                a.methods[parts[1].trim()].push(part);
            } else {// this is a property
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
    var clsName = cls.getClass();
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
function __processBlocks(blocks, a, abstractClass) {
    if (!abstractClass) {
        for (var i = 0, len = blocks.length; i < len; i++) {
            if (blocks[i].startsWith("var ")) {//private var(s)
                var vars = blocks[i].replace("var ",'').slice(0,-1).split(',').map(function(str){
                    return str.split('=').map(function(val){return val.trim();});
                });// vars=[[var, value]]
                for (var j = 0, jlen = vars.length; j < jlen; j++) {
                    var item = {};
                    item.__name = vars[j][0];
                    item[vars[j][0]] = vars[j][1];
                    a.properties["private"].push(item);
                }
            } else if (blocks[i].startsWith("this.","public.","private.","protected.")) {
                var parts = blocks[i].match(/^(this|private|protected|public)\.([\s\S]*?)(?:=\s*?([\s\S]*;)|;)/);
                if (parts && parts.length == 4) { // is some kind of class property [0]=>block [1] => access modifier [2] => property [3] => value 
                    var part = {}, value,pname;
                    part[parts[2]] = parts[3];
                    value = tryEval(parts[3]);
                    part.__name = parts[2].trim();


                    if (parts[2].startsWith('method.') /*|| (value && value.isFunction())*/) {// this is a methodvar name = parts[2].replace('method.','');
                        pname = parts[2].replace('method.','').trim();
                        delete part[parts[2]];
                        part[pname] = parts[3]; 
                        part.__name = pname;
                        a.methods[parts[1]].push(part);
                    } else {// this is a property
                        pname = parts[2];
                        a.properties[parts[1]].push(part);
                        if (value && value.isFunction()) {
                            a.methods[parts[1]].push(part);
                        }
                    }

                    blocks[i] = (parts[1] == "private" || parts[1] == "protected"?"var ":"this.") + 
                            pname + (parts[3] ? "=" + parts[3] : "")+";";
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
                method[methodName] = methods[i][methodName];
                a.methods[modifier].push(method);
            }
        }
        
        for (var modifier in aProperties) {
            var properties = aProperties[modifier];
            for (var i = 0, len = properties.length; i < len; i++){
                var propertyName = properties[i].__name.trim(),
                property = {__name:propertyName};
                property[propertyName] = properties[i][propertyName];
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
function __checkDefined (modifiers, tName) {
    for (var modifier in modifiers) {
        if (!modifiers.hasOwnProperty(modifier)){
            continue;
        }
        var filtered = modifiers[modifier].filter(function (item){ return item.__name == tName;});
        if(!filtered.isEmpty()) {
            return filtered;
        }
    }
    return false;
}
$g.Abstract = function (acls) {
    return __strongerType(acls, {
        missing : "Abstract: missing required Class parameter",
        instantiation : "Abstract Class can not be instantiated",
        type : 1
    });
};
$g.Interface = function (icls) {
    return __strongerType(icls, {
        missing : "Interface: missing required Class parameter",
        instantiation : "Interfaces can not be instantiated",
        type : 0
    });   
};
$g.Namespace = function (name,cls){
//    if (!$g.[name]) {
//        $g[name] = {};
//    }
    $g.setProperty(name+"."+cls.getClass(),cls);
};
$g.Public = function (cls) {
    var blocks = __processClass(cls),
    name = cls.getClass(),
    a = {methods:{public:[],protected:[],private:[],"this":[]},properties:{public:[],protected:[],private:[],"this":[]}}
    __processBlocks(blocks, a);
    $g[name] = eval("(function "+name+"("+__getFuncArgs(cls).join(',')+"){"+blocks.join('')+
        "var self=this;self.destruct = self.destruct && self.destruct.isFunction() ? self.destruct : function(){};self.construct && self.construct.isFunction() && self.construct.apply(self,arguments);$g.GarbageCollector.push(this);return this;}"+")");
    $g[name].methods = a.methods;
    $g[name].properties = a.properties;
    
    return $g[name];
};
$g.Use = function (name) {
    var funcs = "",
    classes = $g.getProperty(name);
    for(cls in classes) {
        funcs += classes[cls].toString();
    }
    return funcs;
}

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
    name = this.getClass(),
    a = {methods:{public:[],protected:[],private:[],"this":[]},properties:{public:[],protected:[],private:[],"this":[]}};
    
    if (!isAbstract) {
        __processBlocks(blocks, a);
    } else {
        a.methods = this.methods;
        a.properties = this.properties;
    }
    
    var aMethods = cls.methods,
    aProperties = cls.properties,
    aname = cls.getClass(),
    missingItems = {methods:{public:[],protected:[],"this":[]},properties:{public:[],protected:[],"this":[]}};
    
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
                    } else {
                        this[type][modifier].push(types[j]);
                    }
                }
            }
        }
    }
    
    if (isAbstract) {
        return this;
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
                additional += prefix + pname + "=" + item[pname]+";";
            }
        
        }
    }
    
    $g[name] = eval("(function "+name+"("+__getFuncArgs(this).join(',')+"){"+additional+blocks.join('')+
        "var self=this;self.destruct = self.destruct && self.destruct.isFunction() ? self.destruct : function(){};self.construct && self.construct.isFunction() && self.construct.apply(self,arguments);$g.GarbageCollector.push(this);return this;}"+")");
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
    var blocks = __processClass(cls),
    name = this.getClass(),
    isAbstract = this.___type === 1,
    a = {methods:{public:[],protected:[],private:[],"this":[]},properties:{public:[],protected:[],private:[],"this":[]}};
    
    __processBlocks(blocks, a, isAbstract && this); // this alters blocks and a

    var iMethods = cls.methods,
    iProperties = cls.properties,
    iname = cls.getClass();
    
    for (var modifier in iMethods) {
        var methods = iMethods[modifier];
        for (var i = 0, len = methods.length; i < len; i++) {
            var methodName = methods[i].__name,
                method = __checkDefined(a.methods, methodName);
//            method = a.methods.filter(function(item){return item.__name == methodName;});
//            if (method.isEmpty()) {
            if (!method) {
                throw "Interface " + iname + " " + "must implement " + methodName;
            }
            var value = eval("("+method[0][methodName].slice(0,-1)+")");
            if (!value || !value.isFunction()) {
                throw "Interface " + iname + " property " + methodName + " must be a function";
            }
        }
    }
    for (var modifier in iProperties) {
        var properties = iProperties[modifier];
        for (var i = 0, len = properties.length; i < len; i++) {
            var propertyName = properties[i].__name;
//            if (a.properties.filter(function(item){return item.__name == propertyName;}).isEmpty()) {
            if (!__checkDefined(a.properties, propertyName)) {
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
    
    str += cls.getClass() + ":" + nl + nl;
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