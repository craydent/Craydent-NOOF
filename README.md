<img src="http://craydent.com/JsonObjectEditor/img/svgs/craydent-logo.svg" width=75 height=75/>

# Craydent NOOF 0.2.1
**by Clark Inada**

NOOF (Node Object Oriented Framework) module is a framework to enable object oriented practices to JavaScript.  With this module, you are able define:

* Namespaces
* Interfaces
* Abstract Classes
* Public Classes
* Overloading methods
* Private methods/properties
* Protected methods/properties
* Public methods/properties
* Constructors
* Destructors
* Strongly typed variables and parameters

NOOF provides the ability to created extensions to classes and intreface implementation which are all checked on start/load.

###**Note: A semi-colon (;) as the end of every NOOF directive is required.
*Note: Checking method parameter/variable types can only be done through run time so it is still important to run unit tests to test your own code.

## Usages
### Defining typed method parameters & variables (the type is case sensitive)
```js
private.variable = "";
private.String.str = "";

protected.variable = "";
protected.String.str = "";

public.variable = "";
public.String.str = "";

private.method.foo = function () { /* your code goes here */ };

protected.method.foo = function () { /* your code goes here */ };

public.method.foo = function () { /* your code goes here */ };
```
### Overloading methods
```js
public.method.foo(Number.a) = function(a) { /* your code goes here */ };
public.method.foo(String.a, Number.b) = function(a, b) { /* your code goes here */ };
public.method.foo(Object.a, String.b, Boolean.c) = function (a, b, c) { /* your code goes here */ };
public.method.foo(Number.a, Array.d, Date.c) = function(a, d, c) { /* your code goes here */ };
public.method.foo(String.a, String.b, String.c, String.d) = function(a, b, c, d) { /* your code goes here */ };
```

### Defining Namespaces
```js
Namespace("NOOF", 
    Public(function User (params) {
        public.type = "User";
        public.first_name = "";
        public.last_name = "";
        public.method.foo(Number.a) = function(a) { /* your code goes here */ };
        public.method.foo(String.a, Number.b) = function(a, b) { /* your code goes here */ };
    })
)
```

### Defining Interfaces
```js
Interface(function IClass () {
	public.String.name;
	public.method.foo(String.a);
	public.method.foo(Number.a);
	public.method.foo(a, b);
	public.method.foo(a, b, c);
	public.method.foo(a, d, c);
	public.method.bar;
})
```

### Defining Abstract Classes
```js
Abstract(function Base() {
	public.String._id = null;
	public.Date.now = null;
	protected.Array.vals = [];

	public.method.foo(String.a) = function(a) { /* your code goes here */ };
	public.method.foobar = function* () { /* your code goes here */ };
});
```

### Defining Public
```js
Public(function User (params) {
    public.type = "User";
    public.first_name = "";
    public.last_name = "";
    public.method.foo(Number.a) = function(a) { /* your code goes here */ };
    public.method.foo(String.a, Number.b) = function(a, b) { /* your code goes here */ };
})
```

### Implementing Interfaces
```js
Public(function NewClass () {
	public.String.name = "";
	public.method.foo(String.a) = function(a) { /* your code goes here */ };
	public.method.foo(Number.a) = function(a) { /* your code goes here */ };
	public.method.foo(String.a, Number.b) = function(a, b) { /* your code goes here */ };
	public.method.foo(Object.a, String.b, Boolean.c) = function (a, b, c) { /* your code goes here */ };
	public.method.foo(Number.a, Array.d, Date.c) = function(a, d, c) { /* your code goes here */ };
	public.method.foo(String.a, String.b, String.c, String.d) = function(a, b, c, d) { /* your code goes here */ };

	public.method.bar = function*(a,b) { /* your code goes here */ };
    	
}).implementsInterface(IClass);
```

### Extending Classes
```js
Public(function NewClass () {
	public.String.name = "Clark";
	public.method.foo(Number.a) = function(a) { /* your code goes here */ };
	public.method.foo(String.a, Number.b) = function(a, b) { /* your code goes here */ };
	public.method.foo(Object.a, String.b, Boolean.c) = function (a, b, c) { /* your code goes here */ };
	public.method.foo(Number.a, Array.d, Date.c) = function (a, d, c) { /* your code goes here */ };
	public.method.foo(String.a, String.b, String.c, String.d) = function (a, b, c, d) { /* your code goes here */ };

	public.method.bar = function*(a, b) { /* your code goes here */ }
}).extendsFrom(Base);
```

### Extending Class and then Implementing Interface
```js
Public(function NewClass () {
	public.String.name = "Clark";
	public.method.foo(Number.a) = function (a) { /* your code goes here */ };
	public.method.foo(String.a, Number.b) = function (a, b) { /* your code goes here */ };
	public.method.foo(Object.a, String.b, Boolean.c) = function (a, b, c) { /* your code goes here */ };
	public.method.foo(Number.a, Array.d, Date.c) = function (a, d, c) { /* your code goes here */ };
	public.method.foo(String.a, String.b, String.c, String.d) = function (a, b, c, d) { /* your code goes here */ };

	public.method.bar = function*(a, b) { /* your code goes here */ }
}).extendsFrom(Base).implementsInterface(IClass);
```

## Installation

```shell
$ npm i --save noof
```


## Download

 * [GitHub](https://github.com/craydent/Craydent-NOOF)
 * [BitBucket](https://bitbucket.org/craydent/craydent-noof)

The Craydent NOOF is released under the [Dual licensed under the MIT or GPL Version 2 licenses](http://craydent.com/license).<br>



