(function(window, document, factory)
{
	/* Universal Module Definition (UMD) */

    // AMD (recommended)
    if (typeof define == 'function' && define.amd) 
	{
		define('conbo', function()
		{
			return factory(window, document);
		});
	}
	// Common.js & Node.js
	else if (typeof module != 'undefined' && module.exports)
	{
    	module.exports = factory(window, document);
    }
	// Global
	else
	{
		window.conbo = factory(window, document);
	}
	
})(this, this.document, function(window, document, undefined)
{
/*! 
 * ConboJS: Lightweight MVC application framework for JavaScript
 * http://conbojs.mesmotronic.com/
 * 
 * Copyright (c) 2015 Mesmotronic Limited
 * Released under the MIT license
 * http://www.mesmotronic.com/legal/mit
 */

var __namespaces = {};

/**
 * ConboJS is a lightweight MVC application framework for JavaScript featuring 
 * dependency injection, context and encapsulation, data binding, command 
 * pattern and an event model which enables callback scoping and consistent 
 * event handling
 * 
 * Dependencies
 *
 * Lite: None
 * Complete: jQuery 1.7+
 * 
 * @namespace 	conbo
 * @param		namespace	{String}	The selected namespace
 * @author		Neil Rackett
 * @see			http://www.mesmotronic.com/
 * 
 * @example
 * // Conbo can replace the standard minification pattern with modular namespace definitions
 * // If an Object is returned, its contents will be added to the namespace
 * conbo('com.namespace.example', window, document, conbo, function(window, document, conbo, undefined)
 * {
 * 	var example = this;
 * 	
 * 	// Your code here
 * });  
 */
var conbo = function(namespace)
{
	if (!namespace || !conbo.isString(namespace))
	{
		conbo.warn('First parameter must be the namespace string, received', namespace);
		return;
	}

	if (!__namespaces[namespace])
	{
		__namespaces[namespace] = new conbo.Namespace();
	}
	
	var ns = __namespaces[namespace],
		params = conbo.rest(arguments),
		func = params.pop()
		;
	
	if (conbo.isFunction(func))
	{
		var obj = func.apply(ns, params);
		
		if (conbo.isObject(obj) && !conbo.isArray(obj))
		{
			ns.extend(obj);
		}
	}
	
	return ns;
};

/**
 * Internal reference to self, enables full functionality to be used via 
 * ES2015 import statements
 * 
 * @augments	conbo
 * @returns		{conbo}
 * 
 * @example 
 * import {conbo} from 'conbo';
 */
conbo.conbo = conbo;

/**
 * @augments	conbo
 * @returns 	{String}
 */
conbo.VERSION = '3.2.4';
	
/**
 * @augments	conbo
 * @returns 	{String}
 */
conbo.toString = function() 
{ 
	return 'ConboJS v'+this.VERSION; 
};

if (!!$)
{
	/**
	 * Local jQuery instance used by Conbo internally (not available in lite build)
	 * @namespace	conbo.$
	 */
	conbo.$ = $;
	
	$(function()
	{
		conbo.info(conbo.toString());
	})
}

/*
 * Utility methods: a modified subset of Underscore.js methods, 
 * plus loads of our own
 */

(function() 
{
	// Establish the object that gets returned to break out of a loop iteration.
	var breaker = false;

	// Save bytes in the minified (but not gzipped) version:
	var
		ArrayProto = Array.prototype, 
		ObjProto = Object.prototype, 
		FuncProto = Function.prototype;

	// Create quick reference variables for speed access to core prototypes.
	var
		push			= ArrayProto.push,
		slice			= ArrayProto.slice,
		concat			= ArrayProto.concat,
		toString		= ObjProto.toString,
		hasOwnProperty	= ObjProto.hasOwnProperty;

	// All ECMAScript 5 native function implementations that we hope to use
	// are declared here.
	var
		nativeIndexOf		= ArrayProto.indexOf,
		nativeLastIndexOf	= ArrayProto.lastIndexOf,
		nativeMap			= ArrayProto.map,
		nativeReduce		= ArrayProto.reduce,
		nativeReduceRight	= ArrayProto.reduceRight,
		nativeFilter		= ArrayProto.filter,
		nativeEvery			= ArrayProto.every,
		nativeSome			= ArrayProto.some,
		nativeIsArray		= Array.isArray,
		nativeKeys			= Object.keys,
		nativeBind			= FuncProto.bind;
	
	// Collection Functions
	// --------------------

	/**
	 * Handles objects, arrays, lists and raw objects using a for loop (because 
	 * tests show that a for loop can be twice as fast as a native forEach).
	 * 
	 * Return `false` to break the loop.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The list to iterate
	 * @param		{function}	iterator - Iterator function with parameters: item, index, list
	 * @param		{object}	scope - The scope the iterator function should run in (optional)
	 */
	 conbo.forEach = function(obj, iterator, scope) 
	 {
		if (obj == null) return;
		
		var i, length;
		
		if (conbo.isIterable(obj)) 
		{
			for (i=0, length=obj.length; i<length; ++i) 
			{
				if (iterator.call(scope, obj[i], i, obj) === breaker) return;
			}
		}
		else
		{
			var keys = conbo.keys(obj);
			
			for (i=0, length=keys.length; i<length; i++) 
			{
				if (iterator.call(scope, obj[keys[i]], keys[i], obj) === breaker) return;
			}
		}
		
		return obj;
	};
	
	var forEach = conbo.forEach;
	
	/**
	 * Return the results of applying the iterator to each element.
	 * Delegates to native `map` if available.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The list to iterate
	 * @param		{function}	iterator - Iterator function with parameters: item, index, list
	 * @param		{object}	scope - The scope the iterator function should run in (optional)
	 */
	conbo.map = function(obj, iterator, scope) 
	{
		var results = [];
		
		if (obj == null) return results;
		if (nativeMap && obj.map === nativeMap) return obj.map(iterator, scope);
		
		forEach(obj, function(value, index, list) 
		{
			results.push(iterator.call(scope, value, index, list));
		});
		
		return results;
	};
	
	/**
	 * Returns the index of the first instance of the specified item in the list
	 * 
	 * @param	{object}	obj - The list to search
	 * @param	{object}	item - The value to find the index of
	 */
	conbo.indexOf = function(obj, item)
	{
		return nativeIndexOf.call(obj, item);
	};
	
	/**
	 * Returns the index of the last instance of the specified item in the list
	 * 
	 * @param	{object}	obj - The list to search
	 * @param	{object}	item - The value to find the index of
	 */
	conbo.lastIndexOf = function(obj, item)
	{
		return nativeLastIndexOf.call(obj, item);
	};
	
	/**
	 * Return the first value which passes a truth test
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The list to iterate
	 * @param		{function}	predicate - Function that tests each value, returning true or false
	 * @param		{object}	scope - The scope the predicate function should run in (optional)
	 */
	conbo.find = function(obj, predicate, scope) 
	{
		var result;
		
		conbo.some(obj, function(value, index, list) 
		{
			if (predicate.call(scope, value, index, list)) 
			{
				result = value;
				return true;
			}
		});
		
		return result;
	};
	
	/**
	 * Return the index of the first value which passes a truth test
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The list to iterate
	 * @param		{function}	predicate - Function that tests each value, returning true or false
	 * @param		{object}	scope - The scope the predicate function should run in (optional)
	 */
	conbo.findIndex = function(obj, predicate, scope) 
	{
		var value = conbo.find(obj, predicate, scope);
		return obj.indexOf(value);
	};
	
	/**
	 * Return all the elements that pass a truth test.
	 * Delegates to native `filter` if available.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The list to iterate
	 * @param		{function}	predicate - Function that tests each value, returning true or false
	 * @param		{object}	scope - The scope the predicate function should run in (optional)
	 */
	conbo.filter = function(obj, predicate, scope) 
	{
		var results = [];
		
		if (obj == null) return results;
		if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, scope);
		
		forEach(obj, function(value, index, list) 
		{
			if (predicate.call(scope, value, index, list)) results.push(value);
		});
		
		return results;
	};

	/**
	 * Return all the elements for which a truth test fails.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The list to iterate
	 * @param		{function}	predicate - Function that tests each value, returning true or false
	 * @param		{object}	scope - The scope the predicate function should run in (optional)
	 */
	conbo.reject = function(obj, predicate, scope) 
	{
		return conbo.filter(obj, function(value, index, list) 
		{
			return !predicate.call(scope, value, index, list);
		},
		scope);
	};
	
	/**
	 * Determine whether all of the elements match a truth test.
	 * Delegates to native `every` if available.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The list to iterate
	 * @param		{function}	predicate - Function that tests each value, returning true or false
	 * @param		{object}	scope - The scope the predicate function should run in (optional)
	 */
	conbo.every = function(obj, predicate, scope) 
	{
		predicate || (predicate = conbo.identity);
		
		var result = true;
		
		if (obj == null) return result;
		if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, scope);
		
		forEach(obj, function(value, index, list) 
		{
			if (!(result = result && predicate.call(scope, value, index, list))) return breaker;
		});
		
		return !!result;
	};

	/**
	 * Determine if at least one element in the object matches a truth test.
	 * Delegates to native `some` if available.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The list to iterate
	 * @param		{function}	predicate - Function that tests each value, returning true or false
	 * @param		{object}	scope - The scope the predicate function should run in (optional)
	 */
	conbo.some = function(obj, predicate, scope) 
	{
		predicate || (predicate = conbo.identity);
		var result = false;
		if (obj == null) return result;
		if (nativeSome && obj.some === nativeSome) return obj.some(predicate, scope);
		forEach(obj, function(value, index, list) {
			if (result || (result = predicate.call(scope, value, index, list))) return breaker;
		});
		return !!result;
	};
	
	var some = conbo.some;
	
	/**
	 * Determine if the array or object contains a given value (using `===`).
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The list to iterate
	 * @param		{function}	target - The value to match
	 */
	conbo.contains = function(obj, target) 
	{
		if (obj == null) return false;
		return obj.indexOf(target) != -1;
	};

	/**
	 * Invoke a method (with arguments) on every item in a collection.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The list to iterate
	 * @param		{function}	method - Function to invoke on every item
	 */
	conbo.invoke = function(obj, method) 
	{
		var args = slice.call(arguments, 2);
		var isFunc = conbo.isFunction(method);
		
		return conbo.map(obj, function(value) 
		{
			return (isFunc ? method : value[method]).apply(value, args);
		});
	};
	
	/**
	 * Convenience version of a common use case of `map`: fetching a property.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object
	 * @param		{string}	key - Property name
	 */
	conbo.pluck = function(obj, key) 
	{
		return conbo.map(obj, conbo.property(key));
	};

	/**
	 * Return the maximum element or (element-based computation).
	 * Can't optimize arrays of integers longer than 65,535 elements.
	 * 
	 * @see https://bugs.webkit.org/show_bug.cgi?id=80797
	 * @memberof	conbo
	 * @param		{object}	obj - The list to iterate
	 * @param		{function}	iterator - Function that tests each value (optional)
	 * @param		{object}	scope - The scope the iterator function should run in (optional)
	 */
	conbo.max = function(obj, iterator, scope) 
	{
		if (!iterator && conbo.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) 
		{
			return Math.max.apply(Math, obj);
		}
		
		var result = -Infinity, lastComputed = -Infinity;
		
		forEach(obj, function(value, index, list) 
		{
			var computed = iterator ? iterator.call(scope, value, index, list) : value;
			if (computed > lastComputed) {
				result = value;
				lastComputed = computed;
			}
		});
		
		return result;
	};

	/**
	 * Return the minimum element (or element-based computation).
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The list to iterate
	 * @param		{function}	iterator - Function that tests each value (optional)
	 * @param		{object}	scope - The scope the iterator function should run in (optional)
	 */
	conbo.min = function(obj, iterator, scope) 
	{
		if (!iterator && conbo.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
			return Math.min.apply(Math, obj);
		}
		
		var result = Infinity, lastComputed = Infinity;
		
		forEach(obj, function(value, index, list) 
		{
			var computed = iterator ? iterator.call(scope, value, index, list) : value;
			
			if (computed < lastComputed) 
			{
				result = value;
				lastComputed = computed;
			}
		});
		
		return result;
	};

	/**
	 * Shuffle an array, using the modern version of the Fisher-Yates shuffle
	 * @see http://en.wikipedia.org/wiki/Fisher–Yates_shuffle
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The list to shuffle
	 */
	conbo.shuffle = function(obj) 
	{
		var rand;
		var index = 0;
		var shuffled = [];
		
		forEach(obj, function(value) 
		{
			rand = conbo.random(index++);
			shuffled[index - 1] = shuffled[rand];
			shuffled[rand] = value;
		});
		
		return shuffled;
	};

	/**
	 * An internal function to generate lookup iterators.
	 * @private
	 */
	var lookupIterator = function(value) 
	{
		if (value == null) return conbo.identity;
		if (conbo.isFunction(value)) return value;
		return conbo.property(value);
	};
	
	/**
	 * Convert anything iterable into an Array
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The object to convert into an Array 
	 */
	conbo.toArray = function(obj) 
	{
		if (!obj) return [];
		if (conbo.isArray(obj)) return slice.call(obj);
		if (conbo.isIterable(obj)) return conbo.map(obj, conbo.identity);
		return conbo.values(obj);
	};
	
	/**
	 * Return the number of elements in an object.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The object to count the keys of
	 */
	conbo.size = function(obj) 
	{
		if (!obj) return 0;
		
		return conbo.isIterable(obj)
			? obj.length 
			: conbo.keys(obj).length;
	};
	
	// Array Functions
	// ---------------

	/**
	 * Get the last element of an array. Passing n will return the last N
	 * values in the array. The guard check allows it to work with `conbo.map`.
	 * 
	 * @memberof	conbo
	 * @param		{array}		array - The array to slice
	 * @param		{function}	n - The number of elements to return (default: 1)
	 * @param		{object}	guard - Optional
	 */
	conbo.last = function(array, n, guard) 
	{
		if (array == null) return undefined;
		if (n == null || guard) return array[array.length - 1];
		return slice.call(array, Math.max(array.length - n, 0));
	};

	/**
	 * Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
	 * Especially useful on the arguments object. Passing an n will return
	 * the rest N values in the array. The guard
	 * check allows it to work with `conbo.map`.
	 * 
	 * @memberof	conbo
	 * @param		{array}		array - The array to slice
	 * @param		{function}	n - The number of elements to return (default: 1)
	 * @param		{object}	guard - Optional
	 */
	conbo.rest = function(array, n, guard) 
	{
		return slice.call(array, (n == null) || guard ? 1 : n);
	};

	/**
	 * Trim out all falsy values from an array.
	 * 
	 * @memberof	conbo
	 * @param		{array}		array - The array to trim
	 */
	conbo.compact = function(array) 
	{
		return conbo.filter(array, conbo.identity);
	};

	/**
	 * Internal implementation of a recursive `flatten` function.
	 * @private
	 */
	var flatten = function(input, shallow, output) 
	{
		if (shallow && conbo.every(input, conbo.isArray)) 
		{
			return concat.apply(output, input);
		}
		
		forEach(input, function(value) 
		{
			if (conbo.isArray(value) || conbo.isArguments(value)) 
			{
				shallow ? push.apply(output, value) : flatten(value, shallow, output);
			}
			else 
			{
				output.push(value);
			}
		});
		
		return output;
	};

	/**
	 * Flatten out an array, either recursively (by default), or just one level.
	 * 
	 * @memberof	conbo
	 * @param		{array}		array - The array to flatten
	 */
	conbo.flatten = function(array, shallow) 
	{
		return flatten(array, shallow, []);
	};

	/**
	 * Return a version of the array that does not contain the specified value(s).
	 * 
	 * @memberof	conbo
	 * @param		{array}		array - The array to remove the specified values from
	 */
	conbo.without = function(array) 
	{
		return conbo.difference(array, slice.call(arguments, 1));
	};

	/**
	 * Split an array into two arrays: one whose elements all satisfy the given
	 * predicate, and one whose elements all do not satisfy the predicate.
	 * 
	 * @memberof	conbo
	 * @param		{array}		array - The array to split
	 * @param		{function}	predicate - Function to determine a match, returning true or false
	 * @returns		{array}
	 */
	conbo.partition = function(array, predicate) 
	{
		var pass = [], fail = [];
		
		forEach(array, function(elem) 
		{
			(predicate(elem) ? pass : fail).push(elem);
		});
		
		return [pass, fail];
	};

	/**
	 * Produce a duplicate-free version of the array. If the array has already
	 * been sorted, you have the option of using a faster algorithm.
	 * 
	 * @memberof	conbo
	 * @param		{array}		array - The array to filter
	 * @param		{boolean}	isSorted - Should the returned array be sorted?
	 * @param		{object}	iterator - Iterator function
	 * @param		{object}	scope - The scope the iterator function should run in (optional)
	 */
	conbo.uniq = function(array, isSorted, iterator, scope) 
	{
		if (conbo.isFunction(isSorted)) 
		{
			scope = iterator;
			iterator = isSorted;
			isSorted = false;
		}
		
		var initial = iterator ? conbo.map(array, iterator, scope) : array;
		var results = [];
		var seen = [];
		
		forEach(initial, function(value, index) 
		{
			if (isSorted ? (!index || seen[seen.length - 1] !== value) : !conbo.contains(seen, value)) 
			{
				seen.push(value);
				results.push(array[index]);
			}
		});
		
		return results;
	};

	/**
	 * Produce an array that contains the union: each distinct element from all of
	 * the passed-in arrays.
	 * 
	 * @memberof	conbo
	 */
	conbo.union = function() 
	{
		return conbo.uniq(conbo.flatten(arguments, true));
	};

	/**
	 * Produce an array that contains every item shared between all the
	 * passed-in arrays.
	 * 
	 * @memberof	conbo
	 * @param		{array}		array - Array of values
	 * @returns		{array}
	 */
	conbo.intersection = function(array) 
	{
		var rest = slice.call(arguments, 1);
		
		return conbo.filter(conbo.uniq(array), function(item) 
		{
			return conbo.every(rest, function(other) 
			{
				return conbo.contains(other, item);
			});
		});
	};

	/**
	 * Take the difference between one array and a number of other arrays.
	 * Only the elements present in just the first array will remain.
	 * 
	 * @memberof	conbo
	 * @param		{array}		array - Array of compare
	 * @returns		{array}
	 */
	conbo.difference = function(array) 
	{
		var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
		return conbo.filter(array, function(value){ return !conbo.contains(rest, value); });
	};

	/**
	 * Converts lists into objects. Pass either a single array of `[key, value]`
	 * pairs, or two parallel arrays of the same length -- one of keys, and one of
	 * the corresponding values.
	 * 
	 * @memberof	conbo
	 * @param		{object}	list - List of keys
	 * @param		{object}	values - List of values
	 * @returns		{array}
	 */
	conbo.object = function(list, values) 
	{
		if (list == null) return {};
		
		var result = {};
		
		for (var i = 0, length = list.length; i < length; i++) 
		{
			if (values) 
			{
				result[list[i]] = values[i];
			}
			else 
			{
				result[list[i][0]] = list[i][1];
			}
		}
		return result;
	};
	
	/**
	 * Generate an integer Array containing an arithmetic progression. A port of
	 * the native Python `range()` function.
	 * 
	 * @see http://docs.python.org/library/functions.html#range
	 * @memberof	conbo
	 * @param		{number}	start - Start
	 * @param		{number}	stop - Stop
	 * @param		{number}	stop - Step
	 */
	conbo.range = function(start, stop, step) 
	{
		if (arguments.length <= 1) 
		{
			stop = start || 0;
			start = 0;
		}
		
		step = arguments[2] || 1;

		var length = Math.max(Math.ceil((stop - start) / step), 0);
		var idx = 0;
		var range = new Array(length);

		while(idx < length) 
		{
			range[idx++] = start;
			start += step;
		}

		return range;
	};

	// Function (ahem) Functions
	// ------------------

	// Reusable constructor function for prototype setting.
	var ctor = function(){};

	/**
	 * Create a function bound to a given object (assigning `this`, and arguments,
	 * optionally). Delegates to native `Function.bind` if
	 * available.
	 * 
	 * @memberof	conbo
	 * @param		{function}	func - Method to bind
	 * @param		{object}	scope - The scope to bind the method to
	 */
	conbo.bind = function(func, scope) 
	{
		var args;
		
		if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
		if (!conbo.isFunction(func)) throw new TypeError();
		
		args = slice.call(arguments, 2);
		
		return function() 
		{
			if (!(this instanceof bound)) return func.apply(scope, args.concat(slice.call(arguments)));
			ctor.prototype = func.prototype;
			var self = new ctor();
			ctor.prototype = null;
			var result = func.apply(self, args.concat(slice.call(arguments)));
			if (Object(result) === result) return result;
			return self;
		};
	};

	/**
	 * Partially apply a function by creating a version that has had some of its
	 * arguments pre-filled, without changing its dynamic `this` scope. _ acts
	 * as a placeholder, allowing any combination of arguments to be pre-filled.
	 * 
	 * @memberof	conbo
	 * @param		{function}	func - Method to partially pre-fill
	 */
	conbo.partial = function(func) 
	{
		var boundArgs = slice.call(arguments, 1);
		
		return function() 
		{
			var position = 0;
			var args = boundArgs.slice();
			
			for (var i = 0, length = args.length; i < length; i++) 
			{
				if (args[i] === conbo) args[i] = arguments[position++];
			}
			
			while (position < arguments.length) args.push(arguments[position++]);
			return func.apply(this, args);
		};
	};

	/**
	 * Bind a number of an object's methods to that object. Remaining arguments
	 * are the method names to be bound. Useful for ensuring that all callbacks
	 * defined on an object belong to it.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to bind methods to
	 * @param		{regexp}	regExp - Method name filter (optional)
	 */
	conbo.bindAll = function(obj, regExp)
	{
		var isRegExp = regExp instanceof RegExp,
			funcs = slice.call(arguments, 1);
		
		if (isRegExp || funcs.length === 0) 
		{
			funcs = conbo.functions(obj);
			if (isRegExp) funcs = conbo.filter(funcs, function(f) { return regExp.test(f); });
		}
		
		funcs.forEach(function(f)
		{
			obj[f] = conbo.bind(obj[f], obj); 
		});
		
		return obj;
	};
	
	/**
	 * Defers a function, scheduling it to run after the current call stack has
	 * cleared.
	 * 
	 * @memberof	conbo
	 * @param		{function}	func - Function to call
	 * @param		{object}	scope - The scope in which to call the function
	 */
	conbo.defer = function(func, scope) 
	{
		if (scope)
		{
			func = conbo.bind(func, scope);
		}
		
		return setTimeout.apply(null, [func, 0].concat(conbo.rest(arguments, 2)));
	};

	/**
	 * Returns a function that will be executed at most one time, no matter how
	 * often you call it. Useful for lazy initialization.
	 * 
	 * @memberof	conbo
	 * @param		{function}	func - Function to call
	 */
	conbo.once = function(func) 
	{
		var ran = false, memo;
		
		return function() {
			if (ran) return memo;
			ran = true;
			memo = func.apply(this, arguments);
			func = null;
			return memo;
		};
	};

	/**
	 * Returns the first function passed as an argument to the second,
	 * allowing you to adjust arguments, run code before and after, and
	 * conditionally execute the original function.
	 * 
	 * @memberof	conbo
	 * @param		{function}	func - Function to wrap
	 * @param		{function}	wrapper - Function to call 
	 */
	conbo.wrap = function(func, wrapper) 
	{
		return conbo.partial(wrapper, func);
	};
	
	// Object Functions
	// ----------------

	/**
	 * Retrieve the names of an object's enumerable properties
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to get keys from
	 * @param		{boolean}	useForIn - Whether or not to include prototype keys 
	 */
	conbo.keys = function(obj, useForIn)
	{
		if (!conbo.isObject(obj)) return [];
		
		if (nativeKeys && !useForIn)
		{
			return nativeKeys(obj);
		}
		
		var keys = [];
		
		for (var key in obj)
		{
			if (useForIn || conbo.has(obj, key)) keys.push(key);
		}
		
		return keys;
	};
	
	/**
	 * Retrieve the names of every property of an object, regardless of whether it's
	 * enumerable or unenumerable and where it is on the prototype chain
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to get keys from
	 */
	conbo.getAllPropertyNames = function(obj)
	{
		var names = [];
		
		do
		{
			var props = Object.getOwnPropertyNames(obj);
			
			props.forEach(function(name)
			{
				if (names.indexOf(name) === -1)
				{
					names.push(name)
				}
			})
		}
		while(obj = Object.getPrototypeOf(obj));
		
		return names
	};
	
	/**
	 * Retrieve the names of every public property (names that do not begin 
	 * with an underscore) of an object, regardless of whether it's enumerable 
	 * or unenumerable and where it is on the prototype chain
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to get keys from
	 */
	conbo.getPublicPropertyNames = function(obj)
	{
		return conbo.filter(conbo.getAllPropertyNames(obj), function(name) { return !/^_.+/.test(name); });
	};
	
	/**
	 * Retrieve the names of every private property (names that begin with a 
	 * single underscore) of an object, regardless of whether it's enumerable 
	 * or unenumerable and where it is on the prototype chain
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to get keys from
	 */
	conbo.getPrivatePropertyNames = function(obj)
	{
		return conbo.filter(conbo.getAllPropertyNames(obj), function(name) { return /^_[a-z\d]+/i.test(name); });
	};
	
	/**
	 * Retrieve the names of every private property (names that begin with a 
	 * double underscore) of an object, regardless of whether it's enumerable 
	 * or unenumerable and where it is on the prototype chain
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to get keys from
	 */
	conbo.getInternalPropertyNames = function(obj)
	{
		return conbo.filter(conbo.getAllPropertyNames(obj), function(name) { return /^__.+/.test(name); });
	};
	
	/**
	 * Retrieve the values of an object's properties.
	 * ConboJS: Extended to enable keys further up the prototype chain to be found too
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to get values from
	 * @param		{boolean}	useForIn - Whether or not to include prototype keys 
	 */
	conbo.values = function(obj, useForIn) 
	{
		var keys = conbo.keys(obj, useForIn);
		var length = keys.length;
		var values = new Array(length);
		
		for (var i = 0; i < length; i++)
		{
			values[i] = obj[keys[i]];
		}
		
		return values;
	};

	/**
	 * Return a sorted list of the function names available on the object,
	 * including both enumerable and unenumerable functions
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to sort
	 */
	conbo.functions = function(obj) 
	{
		var names = [];
		var allKeys = conbo.getAllPropertyNames(obj);
		
		allKeys.forEach(function(key)
		{
			if (conbo.isFunction(obj[key])) 
			{
				names.push(key);
			}
		});
		
		return names.sort();
	};

	/**
	 * Define the values of the given object by cloning all of the properties 
	 * of the passed-in object(s), destroying and overwriting the target's 
	 * property descriptors and values in the process
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to define properties on
	 * @returns		{object}
	 * @see			conbo.setValues
	 */
	conbo.defineValues = function(obj) 
	{
		forEach(slice.call(arguments, 1), function(source) 
		{
			if (!source) return;
			
			for (var propName in source) 
			{
				conbo.cloneProperty(source, propName, obj);
			}
		});
		
		return obj;
	};
	
	/**
	 * Define bindable values on the given object using the property names and
	 * of the passed-in object(s), destroying and overwriting the target's 
	 * property descriptors and values in the process
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to define properties on
	 * @returns		{object}
	 */
	conbo.defineBindableValues = function(obj) 
	{
		forEach(slice.call(arguments, 1), function(source) 
		{
			if (!source) return;
			
			for (var propName in source) 
			{
				delete obj[propName];
				__defineProperty(obj, propName, source[propName]);
			}
		});
		
		return obj;
	};
	
	/**
	 * Return a copy of the object only containing the whitelisted properties.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to copy properties from
	 */
	conbo.pick = function(obj) 
	{
		var copy = {};
		var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
		
		forEach(keys, function(key) 
		{
			if (key in obj)
			{
				conbo.cloneProperty(obj, key, copy);
			}
		});
		
		return copy;
	};
	
	/**
	 * Return a copy of the object without the blacklisted properties.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to copy
	 */
	conbo.omit = function(obj) 
	{
		var copy = {};
		var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
		
		for (var key in obj) 
		{
			if (!conbo.contains(keys, key))
			{
				conbo.cloneProperty(obj, key, copy);
			}
		}
		
		return copy;
	};

	/**
	 * Fill in an object's missing properties by cloning the properties of the 
	 * source object(s) onto the target object, overwriting the target's
	 * property descriptors
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to populate
	 * @see			conbo.setDefaults
	 */
	conbo.defineDefaults = function(obj) 
	{
		forEach(slice.call(arguments, 1), function(source) 
		{
			if (source) 
			{
				for (var propName in source) 
				{
					if (obj[propName] !== undefined) continue;
					conbo.cloneProperty(source, propName, obj);
				}
			}
		});
		
		return obj;
	};
	
	/**
	 * Fill in missing values on an object by setting the property values on 
	 * the target object, without affecting the target's property descriptors
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to populate
	 */
	conbo.setDefaults = function(obj) 
	{
		forEach(slice.call(arguments, 1), function(source) 
		{
			if (source) 
			{
				for (var propName in source) 
				{
					if (obj[propName] !== undefined) continue;
					obj[propName] = source[propName];
				}
			}
		});
		
		return obj;
	};
	
	/**
	 * Create a (shallow-cloned) duplicate of an object.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to clone
	 */
	conbo.clone = function(obj) 
	{
		if (!conbo.isObject(obj)) return obj;
		return conbo.isArray(obj) ? obj.slice() : conbo.defineValues({}, obj);
	};
	
	// Internal recursive comparison function for `isEqual`.
	var eq = function(a, b, aStack, bStack) {
		// Identical objects are equal. `0 === -0`, but they aren't identical.
		// See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
		if (a === b) return a !== 0 || 1 / a == 1 / b;
		// A strict comparison is necessary because `null == undefined`.
		if (a == null || b == null) return a === b;
		// Unwrap any wrapped objects.
		// Compare `[[Class]]` names.
		var className = toString.call(a);
		if (className != toString.call(b)) return false;
		switch (className) {
			// Strings, numbers, dates, and booleans are compared by value.
			case '[object String]':
				// Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
				// equivalent to `new String("5")`.
				return a == String(b);
			case '[object Number]':
				// `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
				// other numeric values.
				return a != +a ? b != +b : (a === 0 ? 1 / a == 1 / b : a == +b);
			case '[object Date]':
			case '[object Boolean]':
				// Coerce dates and booleans to numeric primitive values. Dates are compared by their
				// millisecond representations. Note that invalid dates with millisecond representations
				// of `NaN` are not equivalent.
				return +a == +b;
			// RegExps are compared by their source patterns and flags.
			case '[object RegExp]':
				return a.source == b.source &&
							 a.global == b.global &&
							 a.multiline == b.multiline &&
							 a.ignoreCase == b.ignoreCase;
		}
		if (typeof a != 'object' || typeof b != 'object') return false;
		// Assume equality for cyclic structures. The algorithm for detecting cyclic
		// structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
		var length = aStack.length;
		while (length--) {
			// Linear search. Performance is inversely proportional to the number of
			// unique nested structures.
			if (aStack[length] == a) return bStack[length] == b;
		}
		// Objects with different constructors are not equivalent, but `Object`s
		// from different frames are.
		var aCtor = a.constructor, bCtor = b.constructor;
		if (aCtor !== bCtor && !(conbo.isFunction(aCtor) && (aCtor instanceof aCtor) &&
														 conbo.isFunction(bCtor) && (bCtor instanceof bCtor))
												&& ('constructor' in a && 'constructor' in b)) {
			return false;
		}
		// Add the first object to the stack of traversed objects.
		aStack.push(a);
		bStack.push(b);
		var size = 0, result = true;
		// Recursively compare objects and arrays.
		if (className == '[object Array]') {
			// Compare array lengths to determine if a deep comparison is necessary.
			size = a.length;
			result = size == b.length;
			if (result) {
				// Deep compare the contents, ignoring non-numeric properties.
				while (size--) {
					if (!(result = eq(a[size], b[size], aStack, bStack))) break;
				}
			}
		} else {
			// Deep compare objects.
			for (var key in a) {
				if (conbo.has(a, key)) {
					// Count the expected number of properties.
					size++;
					// Deep compare each member.
					if (!(result = conbo.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
				}
			}
			// Ensure that both objects contain the same number of properties.
			if (result) {
				for (key in b) {
					if (conbo.has(b, key) && !(size--)) break;
				}
				result = !size;
			}
		}
		// Remove the first object from the stack of traversed objects.
		aStack.pop();
		bStack.pop();
		return result;
	};

	/**
	 * Perform a deep comparison to check if two objects are equal.
	 * 
	 * @memberof	conbo
	 * @param		{object}	a - Object to compare
	 * @param		{object}	b - Object to compare
	 * @returns		{boolean}
	 */
	conbo.isEqual = function(a, b) 
	{
		return eq(a, b, [], []);
	};

	/**
	 * Is the value empty?
	 * Based on PHP's `empty()` method
	 * 
	 * @memberof	conbo
	 * @param		{any}		value - Value that might be empty
	 * @returns		{boolean}
	 */
	conbo.isEmpty = function(value)
	{
		return !value // 0, false, undefined, null, ""
			|| (conbo.isArray(value) && value.length === 0) // []
			|| (!isNaN(value) && !parseFloat(value)) // "0", "0.0", etc
			|| (conbo.isObject(value) && !conbo.keys(value).length) // {}
			|| (conbo.isObject(value) && 'length' in value && value.length === 0) // Arguments, List, etc
			;
	};
	
	/**
	 * Can the value be iterated using a for loop? For example an Array, Arguments, ElementsList, etc.
	 * 
	 * @memberof	conbo
	 * @param		{any}		obj - Object that might be iterable 
	 * @returns		{boolean}
	 */
	conbo.isIterable = function(obj)
	{
		return obj && obj.length === +obj.length;
	};
	
	/**
	 * Is a given value a DOM element?
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Value that might be a DOM element
	 * @returns		{boolean}
	 */
	conbo.isElement = function(obj) 
	{
		return !!(obj && obj.nodeType === 1);
	};
	
	/**
	 * Is a given value an array?
	 * Delegates to ECMA5's native Array.isArray
	 * 
	 * @function
	 * @memberof	conbo
	 * @param		{object}	obj - Value that might be an Array
	 * @returns		{boolean}
	 */
	conbo.isArray = nativeIsArray || function(obj) 
	{
		return toString.call(obj) == '[object Array]';
	};

	/**
	 * Is a given variable an object?
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Value that might be an Object
	 */
	conbo.isObject = function(obj) 
	{
		return obj === Object(obj);
	};

	// Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
	forEach(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) 
	{
		conbo['is' + name] = function(obj) 
		{
			return toString.call(obj) == '[object ' + name + ']';
		};
	});

	// Define a fallback version of the method in browsers (ahem, IE), where
	// there isn't any inspectable "Arguments" type.
	if (!conbo.isArguments(arguments)) 
	{
		conbo.isArguments = function(obj) 
		{
			return !!(obj && conbo.has(obj, 'callee'));
		};
	}
	
	// Optimize `isFunction` if appropriate.
	if (typeof (/./) !== 'function') 
	{
		conbo.isFunction = function(obj) 
		{
			return typeof obj === 'function';
		};
	}
	
	/**
	 * Is a given object a finite number?
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Value that might be finite
	 * @returns		{boolean}
	 */
	conbo.isFinite = function(obj) 
	{
		return isFinite(obj) && !isNaN(parseFloat(obj));
	};

	/**
	 * Is the given value `NaN`? (NaN is the only number which does not equal itself).
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Value that might be NaN
	 * @returns		{boolean}
	 */
	conbo.isNaN = function(obj) 
	{
		return conbo.isNumber(obj) && obj != +obj;
	};

	/**
	 * Is a given value a boolean?
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Value that might be a Boolean
	 * @returns		{boolean}
	 */
	conbo.isBoolean = function(obj) 
	{
		return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
	};

	/**
	 * Is a given value equal to null?
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Value that might be null
	 * @returns		{boolean}
	 */
	conbo.isNull = function(obj)
	{
		return obj === null;
	};

	/**
	 * Is a given variable undefined?
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Value that might be undefined
	 * @returns		{boolean}
	 */
	conbo.isUndefined = function(obj) {
		return obj === undefined;
	};

	/**
	 * Shortcut function for checking if an object has a given property directly
	 * on itself (in other words, not on a prototype).
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object
	 * @param		{string}	key - Property name
	 * @returns		{boolean}
	 */
	conbo.has = function(obj, key)
	{
		return hasOwnProperty.call(obj, key);
	};
	
	// Utility Functions
	// -----------------

	/**
	 * Keep the identity function around for default iterators.
	 * 
	 * @memberof	conbo
	 * @param		{any}		obj - Value to return
	 * @returns		{any}
	 */
	conbo.identity = function(value) 
	{
		return value;
	};
	
	/**
	 * Get the property value
	 * 
	 * @memberof	conbo
	 * @param		{string}	key - Property name
	 */
	conbo.property = function(key) 
	{
		return function(obj) 
		{
			return obj[key];
		};
	};

	/**
	 * Returns a predicate for checking whether an object has a given set of `key:value` pairs.
	 * 
	 * @memberof	conbo
	 * @param		{object}	attrs - Object containing key:value pairs to compare
	 */
	conbo.matches = function(attrs) 
	{
		return function(obj) 
		{
			if (obj === attrs) return true; //avoid comparing an object to itself.
			
			for (var key in attrs) 
			{
				if (attrs[key] !== obj[key])
				{
					return false;
				}
			}
			return true;
		};
	};
	
	/**
	 * Return a random integer between min and max (inclusive).
	 * 
	 * @memberof	conbo
	 * @param		{number}	min - Minimum number
	 * @param		{number}	max - Maximum number
	 * @returns		{number}
	 */
	conbo.random = function(min, max)
	{
		if (max == null) 
		{
			max = min;
			min = 0;
		}
		
		return min + Math.floor(Math.random() * (max - min + 1));
	};
	
	var idCounter = 0;

	/**
	 * Generate a unique integer id (unique within the entire client session).
	 * Useful for temporary DOM ids.
	 * 
	 * @memberof	conbo
	 * @param		{string}	prefix - String to prefix unique ID with
	 */
	conbo.uniqueId = function(prefix) 
	{
		var id = ++idCounter + '';
		return prefix ? prefix + id : id;
	};
	
	/**
	 * Is Conbo supported by the current browser?
	 * 
	 * @memberof	conbo
	 */
	conbo.isSupported = 
		window.addEventListener
		&& !!Object.defineProperty 
		&& !!Object.getOwnPropertyDescriptor;
	
	/**
	 * Does nothing, returns undefined, that's it.
	 * 
	 * @memberof	conbo
	 */
	conbo.noop = function() {};
	
	/**
	 * Returns the value of the first parameter passed to it, that's it.
	 * 
	 * @memberof	conbo
	 */
	conbo.noopr = function(value) 
	{
		return value;
	};
	
	/**
	 * Default function to assign to the methods of pseudo-interfaces
	 * 
	 * @example	IExample = { myMethod:conbo.notImplemented };
	 * @memberof	conbo
	 */
	conbo.notImplemented = function() 
	{
		conbo.warn('Method not implemented');
	};
	
	/**
	 * Convert dash-or_underscore separated words into camelCaseWords
	 * 
	 * @memberof	conbo
	 * @param		{string}	string - underscore_case_string to convertToCamelCase
	 * @param		{boolean}	initCap - Should the first letter be a CapitalLetter? (default: false)
	 */
	conbo.toCamelCase = function(string, initCap)
	{
		var s = (string || '').toLowerCase().replace(/([\W_])([a-z])/g, function (g) { return g[1].toUpperCase(); }).replace(/(\W+)/, '');
		if (initCap) return s.charAt(0).toUpperCase() + s.slice(1);
		return s;
	};
	
	/**
	 * Convert camelCaseWords into underscore_case_words (or another user defined separator)
	 * 
	 * @memberof	conbo
	 * @param		{string}	string - camelCase string to convert to underscore_case
	 * @param		{string}	separator - Default: "_"
	 */
	conbo.toUnderscoreCase = function(string, separator)
	{
		separator || (separator = '_');
		return (string || '').replace(/\W+/g, separator).replace(/([a-z\d])([A-Z])/g, '$1'+separator+'$2').toLowerCase();
	};
	
	/**
	 * Convert camelCaseWords into kebab-case-words
	 * 
	 * @memberof	conbo
	 * @param		{string}	string - camelCase string to convert to underscore_case
	 */
	conbo.toKebabCase = function(string)
	{
		return conbo.toUnderscoreCase(string, '-');
	};
	
	conbo.padLeft = function(value, minLength, padChar)
	{
		if (!padChar && padChar !== 0) padChar = ' ';
		if (!value && value !== 0) value = '';
		
		minLength || (minLength = 2);
		
		padChar = padChar.toString().charAt(0);
		string = value.toString();
		
		while (string.length < minLength)
		{
			string = padChar+string;
		}
		
		return string;
	};
	
	/**
	 * Add a leading zero to the specified number and return it as a string
	 * @memberof 	conbo
	 * @param		{number}	number - The number to add a leading zero to
	 * @param		{number}	minLength - the minumum length of the returned string (default: 2)
	 */
	conbo.addLeadingZero = function(number, minLength)
	{
		return conbo.padLeft(number, minLength, 0);
	};
	
	/**
	 * Format a number using the selected number of decimals, using the 
	 * provided decimal point, thousands separator 
	 * 
	 * @memberof	conbo
	 * @see 		http://phpjs.org/functions/number_format/
	 * @param 		number
	 * @param 		decimals				default: 0
	 * @param 		decimalPoint			default: '.'
	 * @param 		thousandsSeparator		default: ','
	 * @returns		{string}				Formatted number
	 */
	conbo.formatNumber = function(number, decimals, decimalPoint, thousandsSeparator) 
	{
		number = (number+'').replace(/[^0-9+\-Ee.]/g, '');
		
		var n = !isFinite(+number) ? 0 : +number,
			prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
			sep = conbo.isUndefined(thousandsSeparator) ? ',' : thousandsSeparator,
			dec = conbo.isUndefined(decimalPoint) ? '.' : decimalPoint,
			s = n.toFixed(prec).split('.')
			;
		
		if (s[0].length > 3) 
		{
			s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
		}
		
		if ((s[1] || '').length < prec) 
		{
			s[1] = s[1] || '';
			s[1] += new Array(prec-s[1].length+1).join('0');
		}
		
		return s.join(dec);
	};
	
	/**
	 * Format a number as a currency
	 * 
	 * @memberof	conbo
	 * @param number
	 * @param symbol
	 * @param suffixed
	 * @param decimals
	 * @param decimalPoint
	 * @param thousandsSeparator
	 */
	conbo.formatCurrency = function(number, symbol, suffixed, decimals, decimalPoint, thousandsSeparator)
	{
		if (conbo.isUndefined(decimals)) decimals = 2;
		symbol || (symbol = '');
		var n = conbo.formatNumber(number, decimals, decimalPoint, thousandsSeparator);
		return suffixed ? n+symbol : symbol+n;
	};
	
	/**
	 * Encodes all of the special characters contained in a string into HTML 
	 * entities, making it safe for use in an HTML document
	 * 
	 * @memberof	conbo
	 * @param string
	 */
	conbo.encodeEntities = function(string)
	{
		if (!conbo.isString(string))
		{
			string = conbo.isNumber(string)
				? string.toString()
				: '';
		}
		
		return string.replace(/[\u00A0-\u9999<>\&]/gim, function(char)
		{
			return '&#'+char.charCodeAt(0)+';';
		});
	};
	
	/**
	 * Decodes all of the HTML entities contained in an string, replacing them with
	 * special characters, making it safe for use in plain text documents
	 * 
	 * @memberof	conbo
	 * @param string
	 */
	conbo.decodeEntities = function(string) 
	{
		if (!conbo.isString(string)) string = '';
		
		return string.replace(/&#(\d+);/g, function(match, dec) 
		{
			return String.fromCharCode(dec);
		});
	};
	
	/**
	 * Copies all of the enumerable values from one or more objects and sets
	 * them to another, without affecting the target object's property
	 * descriptors.
	 * 
	 * Unlike conbo.defineValues, setValues only sets the values on the target 
	 * object and does not destroy and redifine them.
	 * 
	 * @memberof	conbo
	 * @param		{Object}	obj		Object to copy properties to
	 * 
	 * @example	
	 * conbo.setValues({id:1}, {get name() { return 'Arthur'; }}, {get age() { return 42; }});
	 * => {id:1, name:'Arthur', age:42}
	 */
	conbo.setValues = function(obj)
	{
		conbo.rest(arguments).forEach(function(source) 
		{
			if (!source) return;
			
			for (var propName in source) 
			{
				obj[propName] = source[propName];
			}
		});
		
		return obj;
	};
	
	/**
	 * Is the value a Conbo class?
	 * 
	 * @memberof	conbo
	 * @param		{any}		value - Value that might be a class
	 * @param		{class}		classReference - The Conbo class that the value must match or be an extension of (optional) 
	 */
	conbo.isClass = function(value, classReference)
	{
		return !!value 
			&& typeof value == 'function' 
			&& value.prototype instanceof (classReference || conbo.Class)
			;
	};
	
	/**
	 * Copies a property, including defined properties and accessors, 
	 * from one object to another
	 * 
	 * @memberof	conbo
	 * @param		{object}	source - Source object
	 * @param		{string}	sourceName - Name of the property on the source
	 * @param		{object}	target - Target object
	 * @param		{string} 	targetName - Name of the property on the target (default: sourceName)
	 */
	conbo.cloneProperty = function(source, sourceName, target, targetName)
	{
		targetName || (targetName = sourceName);
		
		var descriptor = Object.getOwnPropertyDescriptor(source, sourceName);
		
		if (!!descriptor)
		{
			Object.defineProperty(target, targetName, descriptor);
		}
		else 
		{
			target[targetName] = source[sourceName];
		}
		
		return this;
	};
	
	/**
	 * Sorts the items in an array according to one or more fields in the array. 
	 * The array should have the following characteristics:
	 * 
	 * <ul>
	 * <li>The array is an indexed array, not an associative array.</li>
	 * <li>Each element of the array holds an object with one or more properties.</li>
	 * <li>All of the objects have at least one property in common, the values of which can be used to sort the array. Such a property is called a field.</li>
	 * </ul>
	 * 
	 * @memberof	conbo
	 * @param		{array}		array - The Array to sort
	 * @param		{string}	fieldName - The field/property name to sort on
	 * @param		{object}	options - Optional sort criteria: `descending` (Boolean), `caseInsensitive` (Boolean)
	 */
	conbo.sortOn = function(array, fieldName, options)
	{
		options || (options = {});
		
		if (conbo.isArray(array) && fieldName)
		{
			array.sort(function(a, b)
			{
				var values = [a[fieldName], b[fieldName]];
				
				// Configure
				if (options.descending)
				{
					values.reverse();
				}
				
				if (options.caseInsensitive)
				{
					conbo.forEach(values, function(value, index)
					{
						if (conbo.isString(value)) values[index] = value.toLowerCase();
					});
				}
				
				// Sort
				if (values[0] < values[1]) return -1;
				if (values[0] > values[1]) return 1;
				return 0;
			});
		}
		
		return array;
	};
	
	/**
	 * Is the object an instance of the specified class(es) or implement the
	 * specified pseudo-interface(s)?
	 * 
	 * This method will always return false if the specified object is a Conbo
	 * class, because by it's nature a class is not an instance of anything.
	 * 
	 * @memberof	conbo
	 * @param		obj					The class instance
	 * @param		classOrInterface	The Conbo class or pseudo-interface to compare against
	 * @example							var b = conbo.instanceOf(obj, conbo.EventDispatcher);
	 * @example							var b = conbo.instanceOf(obj, conbo.View, conbo.IInjectable);
	 */
	conbo.instanceOf = function(obj, classOrInterface)
	{
		if (!obj || conbo.isClass(obj)) return false;
		
		var partials = conbo.rest(arguments);
		
		for (var p=0, c=partials.length; p<c; p++)
		{
			classOrInterface = partials[p];
			
			if (!classOrInterface) return false;
			
			try { if (obj instanceof classOrInterface) return true; }
			catch (e) {}
			
			if (conbo.isObject(classOrInterface))
			{
				for (var a in classOrInterface)
				{
					if (!(a in obj) || conbo.isFunction(obj[a]) != conbo.isFunction(classOrInterface[a])) 
					{
						return false;
					}
				}
			}
			else
			{
				return false;
			}
		}
		
		return true;
	};
	
	/**
	 * Loads a CSS file and apply it to the DOM
	 * 
	 * @memberof	conbo
	 * @param 		{String}	url		The CSS file's URL
	 * @param 		{String}	media	The media attribute (defaults to 'all')
	 */
	conbo.loadCss = function(url, media)
	{
		if (!('document' in window) || !!document.querySelector('[href="'+url+'"]'))
		{
			return this;
		}
		
		var link, head; 
			
		link = document.createElement('link');
		link.rel	= 'stylesheet';
		link.type = 'text/css';
		link.href = url;
		link.media = media || 'all';
		
		head = document.getElementsByTagName('head')[0];
		head.appendChild(link);
		
		return this;
	};
	
	/**
	 * Load a JavaScript file and executes it
	 * 
	 * @memberof	conbo
	 * @param 		{String}	url		The JavaScript file's URL
	 * @returns		conbo.Promise
	 */
	conbo.loadScript = function(url)
	{
		return conbo.httpRequest
		({
			url: url,
			dataType: "script"
		});
	};
	
	/*
	 * Property utilities
	 */
	
	/**
	 * Return the names of all the enumerable properties on the specified object, 
	 * i.e. all of the keys that aren't functions
	 * 
	 * @memberof	conbo
	 * @see			#keys
	 * @param		obj			The object to list the properties of
	 * @param		useForIn	Whether or not to include properties further up the prorotype chain
	 */
	conbo.properties = function(obj, useForIn)
	{
		return conbo.difference(conbo.keys(obj, useForIn), conbo.functions(obj));
	};
	
	/**
	 * Makes the specified properties of an object bindable; if no property 
	 * names are passed, all enumarable properties will be made bindable
	 * 
	 * @memberof	conbo
	 * @see 		#makeAllBindable
	 * 
	 * @param		{String}		obj
	 * @param		{Array}			propNames (optional)
	 */
	conbo.makeBindable = function(obj, propNames)
	{
		propNames || (propNames = conbo.properties(obj));
		
		propNames.forEach(function(propName)
		{
			__defineProperty(obj, propName);
		});
		
		return this;
	};
	
	/**
	 * Makes all existing properties of the specified object bindable, and 
	 * optionally create additional bindable properties for each of the property 
	 * names passed in the propNames array
	 * 
	 * @memberof	conbo
	 * @see 		#makeBindable
	 * 
	 * @param		{String}		obj
	 * @param		{Array}			propNames (optional)
	 * @param		{useForIn}		Whether or not to include properties further up the prototype chain
	 */
	conbo.makeAllBindable = function(obj, propNames, useForIn)
	{
		propNames = conbo.uniq((propNames || []).concat(conbo.properties(obj, useForIn)));
		conbo.makeBindable(obj, propNames);
		
		return this;
	};
	
	/**
	 * Is the specified property an accessor (defined using a getter and/or setter)?
	 * 
	 * @memberof	conbo
	 * @returns		Boolean
	 */
	conbo.isAccessor = function(obj, propName)
	{
		if (obj)
		{
			return !!obj.__lookupGetter__(propName) 
				|| !!obj.__lookupSetter__(propName);
		}
		
		return false;
	};
	
	/**
	 * Is the specified property explicitely bindable?
	 * 
	 * @memberof	conbo
	 * @returns		Boolean
	 */
	conbo.isBindable = function(obj, propName)
	{
		if (!conbo.isAccessor(obj, propName))
		{
			return false;
		}
		
		return !!(obj.__lookupSetter__(propName) || {}).bindable;
	};
	
	/**
	 * Parse a template
	 * 
	 * @param	{string}	template - A string containing property names in {{moustache}} or ${ES2015} format to be replaced with property values
	 * @param	{object}	data - An object containing the data to be used to populate the template 
	 * @returns	{string}	The populated template
	 */
	conbo.parseTemplate = function(template, data)
	{
		if (!template) return "";
		
		data || (data = {});
		
		return template.replace(/(({{(.+?)}})|(\${(.+?)}))/g, function(propNameInBrackets, propName) 
		{
			var args = propName.split("|");
			var value, parseFunction;
			
			args[0] = conbo.BindingUtils.cleanPropertyName(args[0]);
			
			try { value = eval("data."+args[0]);			} catch(e) {}
			try { parseFunction = eval("data."+args[1]);	} catch(e) {}
			
			if (!conbo.isFunction(parseFunction)) 
			{
				parseFunction = conbo.BindingUtils.defaultParseFunction;
			}
			
			return parseFunction(value);
		});
	};
	
	/**
	 * Converts a template string into a pre-populated templating method that can 
	 * be evaluated for rendering.
	 * 
	 * @param	{string}	template - A string containing property names in {{moustache}} or ${ES2015} format to be replaced with property values
	 * @param	{object}	defaults - An object containing default values to use when populating the template (optional)
	 * @returns	{function}	A function that can be called with a data object, returning the populated template
	 */
	conbo.compileTemplate = function(template, defaults)
	{
		return function(data)
		{
			return conbo.parseTemplate(template, conbo.setDefaults(data || {}, defaults));
		}
	};
	
	/*
	 * Polyfill methods for useful ECMAScript 5 methods that aren't quite universal
	 */
	
	if (!String.prototype.trim) 
	{
		String.prototype.trim = function () 
		{
			return this.replace(/^\s+|\s+$/g,''); 
		};
	}
	
	if (!window.requestAnimationFrame)
	{
		window.requestAnimationFrame = (function()
		{
			return window.webkitRequestAnimationFrame
				|| window.mozRequestAnimationFrame
				|| function(callback)
				{
					window.setTimeout(callback, 1000 / 60);
				};
		})();
	}
	
	
	/*
	 * Logging
	 */
	
	/**
	 * Should Conbo output data to the console when calls are made to loggin methods?
	 * 
	 * @memberof	conbo
	 * @example
	 * conbo.logEnabled = false;
	 * conbo.log('Blah!');
	 * conbo.warn('Warning!');
	 * conbo.info('Information!'); 
	 * conbo.error('Error!');
	 * // Result: Nothing will be displayed in the console
	 */
	conbo.logEnabled = true;
	
	var logMethods = ['log','warn','info','error'];
	
	logMethods.forEach(function(method)
	{
		conbo[method] = function()
		{
			if (!console || !conbo.logEnabled) return;
			console[method].apply(console, arguments);		
		};
	});
	
})();


/*
 * Internal utility methods
 */

/**
 * Dispatch a property change event from the specified object
 * @private
 */
var __dispatchChange = function(obj, propName)
{
	if (!(obj instanceof conbo.EventDispatcher)) return;
	
	var options = {property:propName, value:obj[propName]};
	
	obj.dispatchEvent(new conbo.ConboEvent('change:'+propName, options));
	obj.dispatchEvent(new conbo.ConboEvent('change', options));
	
	return this;
};

/**
 * Creates a property which can be bound to DOM elements and others
 * 
 * @param	(Object)	obj			The EventDispatcher object on which the property will be defined
 * @param	(String)	propName	The name of the property to be defined
 * @param	(*)			value		The default value of the property (optional)
 * @param	(Function)	getter		The getter function (optional)
 * @param	(Function)	setter		The setter function (optional)
 * @param	(Boolean)	enumerable	Whether of not the property should be enumerable (optional, default: true)
 * @private
 */
var __defineProperty = function(obj, propName, value, getter, setter, enumerable)
{
	if (conbo.isAccessor(obj, propName))
	{
		return this;
	}
	
	if (conbo.isUndefined(value))
	{
		value = obj[propName];
	}
	
	var nogs = !getter && !setter;
	
	if (arguments.length < 6)
	{
		enumerable = propName.indexOf('_') !== 0;
	}
	
	if (nogs)
	{
		getter = function()
		{
			return value;
		};
	
		setter = function(newValue)
		{
			if (!conbo.isEqual(newValue, value)) 
			{
				value = newValue;
				__dispatchChange(this, propName, value);
			}
		};
		
		setter.bindable = true;
	}
	else if (!!setter)
	{
		setter = conbo.wrap(setter, function(fn, newValue)
		{
			fn.call(this, newValue);
			__dispatchChange(this, propName, obj[propName]);
		});
		
		setter.bindable = true;
	}
	
	Object.defineProperty(obj, propName, {enumerable:enumerable, configurable:true, get:getter, set:setter});
	
	return this;
};

/**
 * Used by ConboJS to define private and internal properties (usually prefixed 
 * with an underscore) that can't be enumerated
 * 
 * @private
 */
var __definePrivateProperty = function(obj, propName, value)
{
	if (arguments.length == 2)
	{
		value = obj[propName];
	}
	
	Object.defineProperty(obj, propName, {enumerable:false, configurable:true, writable:true, value:value});
	return this;
};

/**
 * Define properties that can't be enumerated
 * @private
 */
var __definePrivateProperties = function(obj, values)
{
	for (var key in values)
	{
		__definePrivateProperty(obj, key, values[key]);
	}
	
	return this;
}

/**
 * Convert enumerable properties of the specified object into non-enumerable ones
 * @private
 */
var __denumerate = function(obj)
{
	var regExp = arguments[1];
	
	var keys = regExp instanceof RegExp
		? conbo.filter(conbo.keys(obj), function(key) { return regExp.test(key); })
		: (arguments.length > 1 ? conbo.rest(arguments) : conbo.keys(obj));
	
	keys.forEach(function(key)
	{
		var descriptor = Object.getOwnPropertyDescriptor(obj, key) 
			|| {value:obj[key], configurable:true, writable:true};
		
		descriptor.enumerable = false;
		Object.defineProperty(obj, key, descriptor);
	});
	
	return this;
};

/**
 * Class
 * Extendable base class from which all others extend
 * @class		conbo.Class
 * @param 		{object} options - Object containing initialisation options
 */
conbo.Class = function(options) 
{
	this.declarations.apply(this, arguments);
	this.preinitialize.apply(this, arguments);
	this.initialize.apply(this, arguments);
};

/**
 * @memberof conbo.Class
 */
conbo.Class.prototype =
{
	/**
	 * Declarations is used to declare instance properties used by this class 
	 */
	declarations: function() {},
	
	/**
	 * Preinitialize is called before any code in the constructor has been run
	 */
	preinitialize: function() {},
	
	/**
	 * Initialize (entry point) is called immediately after the constructor has completed
	 */
	initialize: function() {},
	
	/**
	 * Similar to `super` in ActionScript or Java, this property enables 
	 * you to access properties and methods of the super class prototype, 
	 * which is the case of JavaScript is the next prototype up the chain
	 */
	get supro()
	{
		return Object.getPrototypeOf(Object.getPrototypeOf(this));
	},
	
	/**
	 * Scope one or more methods to this class instance
	 * @param 	{function} method - The function to bind to this class instance
	 * @returns	this
	 */
	bind: function(method)
	{
		return conbo.bind.apply(conbo, [method, this].concat(conbo.rest(arguments)));
	},
	
	/**
	 * Scope all methods of this class instance to this class instance
	 * @returns this
	 */
	bindAll: function()
	{
		conbo.bindAll.apply(conbo, [this].concat(conbo.toArray(arguments)));
		return this;
	},
	
	toString: function()
	{
		return 'conbo.Class';
	},
};

__denumerate(conbo.Class.prototype);

/**
 * Extend this class to create a new class
 * 
 * @memberof 	conbo.Class
 * @param		{object}	protoProps - Object containing the new class's prototype
 * @param		{object}	staticProps - Object containing the new class's static methods and properties
 * 
 * @example		
 * var MyClass = conbo.Class.extend
 * ({
 * 	doSomething:function()
 * 	{ 
 * 		console.log(':-)'); 
 * 	}
 * });
 */
conbo.Class.extend = function(protoProps, staticProps)
{
	var child, parent=this;
	
	/**
	 * The constructor function for the new subclass is either defined by you
	 * (the 'constructor' property in your `extend` definition), or defaulted
	 * by us to simply call the parent's constructor.
	 */
	child = protoProps && conbo.has(protoProps, 'constructor')
		? protoProps.constructor
		: function() { return parent.apply(this, arguments); };
	
	conbo.defineValues(child, parent, staticProps);
	
	/**
	 * Set the prototype chain to inherit from parent, without calling
	 * parent's constructor
	 */
	var Surrogate = function(){ this.constructor = child; };
	Surrogate.prototype = parent.prototype;
	child.prototype = new Surrogate();
	
	if (protoProps)
	{
		conbo.defineValues(child.prototype, protoProps);
	}
	
	conbo.makeBindable(child.prototype);
	
	return child;
};

/**
 * Implements the specified pseudo-interface(s) on the class, copying 
 * the default methods or properties from the partial(s) if they have 
 * not already been implemented.
 * 
 * @memberof	conbo.Class
 * @param		{Object} interface - Object containing one or more properties or methods to be implemented (an unlimited number of parameters can be passed)
 * 
 * @example
 * var MyClass = conbo.Class.extend().implement(conbo.IInjectable);
 */
conbo.Class.implement = function()
{
	var implementation = conbo.defineDefaults.apply(conbo, conbo.union([{}], arguments)),
		keys = conbo.keys(implementation),
		prototype = this.prototype;
	
	conbo.defineDefaults(this.prototype, implementation);
	
	var rejected = conbo.reject(keys, function(key)
	{
		return prototype[key] !== conbo.notImplemented;
	});
	
	if (rejected.length)
	{
		throw new Error(prototype.toString()+' does not implement the following method(s): '+rejected.join(', '));
	}
	
	return this;
};

/**
 * Conbo class
 * 
 * Base class for most Conbo framework classes that calls preinitialize before 
 * the constructor and initialize afterwards, populating the options parameter
 * with an empty Object if no parameter is passed and automatically making all
 * properties bindable.
 * 
 * @class		conbo.ConboClass
 * @augments	conbo.Class
 * @author		Neil Rackett
 * @param 		{object}	options - Class configuration object
 */
conbo.ConboClass = conbo.Class.extend(
/** @lends conbo.ConboClass.prototype */
{
	/**
	 * Constructor: DO NOT override! (Use initialize instead)
	 * @param 	{object}	options - Class configuration object
	 */
	constructor: function(options)
	{
		var args = conbo.toArray(arguments);
		if (args[0] === undefined) args[0] = {};
		
		this.declarations.apply(this, args);
		this.preinitialize.apply(this, args);
		this.__construct.apply(this, args);
		
		this.initialize.apply(this, args);
		conbo.makeAllBindable(this, this.bindable);
		this.__postInitialize.apply(this, args);
	},
	
	toString: function()
	{
		return 'conbo.ConboClass';
	},
	
	/**
	 * @private
	 */
	__construct: function() {},
	
	/**
	 * @private
	 */
	__postInitialize: function() {}
	
});

__denumerate(conbo.ConboClass.prototype);

/**
 * Conbo namespaces enable you to create modular, encapsulated code, similar to
 * how you might use packages in languages like Java or ActionScript.
 * 
 * By default, namespaces will automatically call initDom() when the HTML page
 * has finished loading.
 * 
 * @class		conbo.Namespace
 * @augments	conbo.Class
 * @author 		Neil Rackett
 * @param 		{object} options - Object containing initialisation options
 */
conbo.Namespace = conbo.ConboClass.extend(
/** @lends conbo.Namespace.prototype */
{
	__construct: function()
	{
		if ($)
		{
			// Automatically initializes the DOM when the page is completely loaded
			var init = this.bind(function()
			{
				if (this.autoInit !== false)
				{
					this.initDom();
				}
			});
			
			$(init);
		}
	},
	
	/**
	 * Search the DOM and initialize Applications contained in this namespace
	 * 
	 * @param 	{Element} 	rootEl - The root element to initialize (optional)
	 * @returns {this}
	 */
	initDom: function(rootEl)
	{
		conbo.initDom(this, rootEl);
		return this;
	},
	
	/**
	 * Watch the DOM and automatically initialize Applications contained in 
	 * this namespace when an element with the appropriate cb-app attribute
	 * is added.
	 * 
	 * @param 	{Element} 	rootEl - The root element to initialize (optional)
	 * @returns {this}
	 */
	observeDom: function(rootEl)
	{
		conbo.observeDom(this, rootEl);
		return this;
	},
	
	/**
	 * Stop watching the DOM for Applications
	 * 
	 * @param 	{Element} 	rootEl - The root element to initialize (optional)
	 * @returns {this}
	 */
	unobserveDom: function(rootEl)
	{
		conbo.unobserveDom(this, rootEl);
		return this;
	},
	
	/**
	 * Add classes, properties or methods to the namespace. Using this method
	 * will not overwrite existing items of the same name.
	 * 
	 * @param 	{object}	obj - An object containing items to add to the namespace 
	 * @returns	{this}
	 */
	extend: function(obj)
	{
		conbo.setDefaults.apply(conbo, [this].concat(conbo.toArray(arguments)));
		return this;
	},
	
});

/**
 * Server Application 
 * 
 * Base class for applications that don't require DOM, e.g. Node.js
 * 
 * @class		conbo.ServerApplication
 * @augments	conbo.EventDispatcher
 * @author		Neil Rackett
 * @param 		{object} options - Object containing initialisation options
 */
conbo.ServerApplication = conbo.EventDispatcher.extend(
/** @lends conbo.ServerApplication.prototype */
{
	/**
	 * Default context class to use
	 * You'll normally want to override this with your own
	 */
	contextClass: conbo.Context,
	
	/**
	 * Constructor: DO NOT override! (Use initialize instead)
	 * @param options
	 */
	constructor: function(options)
	{
		options = conbo.clone(options || {});
		options.app = this;
		
		if (this.contextClass)
		{
			this.context = new this.contextClass(options);
		}
		
		this.initialize.apply(this, arguments);
		conbo.makeAllBindable(this, this.bindable);
	},
	
	toString: function()
	{
		return 'conbo.ServerApplication';
	}
	
}).implement(conbo.IInjectable);

__denumerate(conbo.ServerApplication.prototype);

/**
 * Event class
 * 
 * Base class for all events triggered in ConboJS
 * 
 * @class		conbo.Event
 * @augments	conbo.Class
 * @author		Neil Rackett
 * @param 		{string}	type - The type of event this object represents
 */
conbo.Event = conbo.Class.extend(
/** @lends conbo.Event.prototype */
{
	/**
	 * Constructor: DO NOT override! (Use initialize instead)
	 * @param options
	 */
	constructor: function(type)
	{
		this.preinitialize.apply(this, arguments);
		
		if (conbo.isString(type)) 
		{
			this.type = type;
		}
		else 
		{
			conbo.defineDefaults(this, type);
		}
		
		if (!this.type) 
		{
			throw new Error('Invalid or undefined event type');
		}
		
		this.initialize.apply(this, arguments);
	},
	
	/**
	 * Initialize: Override this!
	 * @param type
	 */
	initialize: function(type, data)
	{
		this.data = data;
	},
	
	/**
	 * Create an identical clone of this event
	 * @returns 	Event
	 */
	clone: function()
	{
		return conbo.clone(this);
	},
	
	/**
	 * Prevent whatever the default framework action for this event is
	 */
	preventDefault: function() 
	{
		this.defaultPrevented = true;
		
		return this;
	},
	
	/**
	 * Not currently used
	 */
	stopPropagation: function() 
	{
		this.cancelBubble = true;
		
		return this;
	},
	
	/**
	 * Keep the rest of the handlers from being executed
	 */
	stopImmediatePropagation: function() 
	{
		this.immediatePropagationStopped = true;
		this.stopPropagation();
		
		return this;
	},
	
	toString: function()
	{
		return 'conbo.Event';
	}
},
/** @lends conbo.Event */
{
	ALL: '*',
});

__denumerate(conbo.Event.prototype);

/**
 * conbo.Event
 * 
 * Default event class for events fired by ConboJS
 * 
 * For consistency, callback parameters of Backbone.js derived classes 
 * are event object properties in ConboJS
 * 
 * @class		conbo.ConboEvent
 * @augments	conbo.Event
 * @author		Neil Rackett
 * @param 		{string}	type - The type of event this object represents
 * @param 		{object}	options - Properties to be added to this event object
 */
conbo.ConboEvent = conbo.Event.extend(
/** @lends conbo.ConboEvent.prototype */
{
	initialize: function(type, options)
	{
		conbo.defineDefaults(this, options);
	},
	
	toString: function()
	{
		return 'conbo.ConboEvent';
	}
},
/** @lends conbo.ConboEvent */
{
	/** Special event fires for any triggered event */
	ALL:					'*',
	
	/** When a save call fails on the server (Properties: model, xhr, options) */
	ERROR:					'error',
	
	/** (Properties: model, error, options) when a model's validation fails on the client */	
	INVALID:				'invalid', 			

	/**
	 * When a Bindable instance's attributes have changed (Properties: property, value)
	 * Also, `change:[attribute]` when a specific attribute has been updated (Properties: property, value)								
	 */
	CHANGE:					'change',
	
	/** when a model is added to a collection (Properties: model, collection, options) */
	ADD:					'add', 				

	/**
	 * When a model is removed from a collection (Properties: model, collection, options)
	 * or a View's element has been removed from the DOM
	 */
	REMOVE:					'remove',

	/** (Properties: model, collection, options) when a model is destroyed */
	DESTROY:				'destroy', 			

	/** (Properties: collection, options) when the collection's entire contents have been replaced */
	RESET:					'reset', 			

	/** (Properties: collection, options) when the collection has been re-sorted */
	SORT:					'sort', 			

	/** (Properties: model, xhr, options) when a model (or collection) has started a request to the server */	
	REQUEST:				'request', 			

	/** (Properties: model, response, options) when a model (or collection) has been successfully synced with the server */
	SYNC:					'sync',

	/**
	 * (Properties: router, route, params) Fired by history (or router) when any route has been matched
	 * Also, 'route:[name]' // (Properties: params) Fired by the router when a specific route is matched 
	 */
	ROUTE:					'route', 			
											
	/** Dispatched by history (or router) when the path changes, regardless of whether the route has changed */
	NAVIGATE:				'navigate',

	/** A process, e.g. history, has started */
	STARTED:				'started',

	/** A process, e.g. history, has stopped */
	STOPPED:				'stopped',
	
	// View
	
	/** Template data has been loaded into the View and can now be manipulated in the DOM */
	TEMPLATE_LOADED:		'templateloaded',

	/** An error occurred while loading the template */
	TEMPLATE_ERROR:			'templateerror',

	/** Fired by an element after having one or more property bound to it */
	BIND:					'bind',

	/** All elements in HTML have been bound to the View */
	BOUND:					'bound',			

	/** All elements in HTML have been unbound from the View */
	UNBOUND:				'unbound',			

	/** 
	 * For a View, this means template loaded, elements bound, DOM rendered
	 * @deprecated
	 * @see		conbo.ConboEvent.CREATION_COMPLETE 
	 */
	INIT:					'init',

	/** 
	 * View template loaded, elements bound, DOM rendered
	 */
	CREATION_COMPLETE:		'creationcomplete',
	
	/** The View has been detached from the DOM */
	DETACH:					'detach',
	
	// Web Services & Promises
	
	/** A result has been received */
	RESULT:					'result',
	
	/** A fault has occurred */
	FAULT:					'fault',			
	
});

__denumerate(conbo.ConboEvent.prototype);

/**
 * Event Dispatcher
 * 
 * Event model designed to bring events into line with DOM events and those 
 * found in HTML DOM, jQuery and ActionScript 2 & 3, offering a more 
 * predictable, object based approach to event dispatching and handling
 * 
 * Should be used as the base class for any class that won't be used for 
 * data binding
 * 
 * @class		conbo.EventDispatcher
 * @augments	conbo.Class
 * @author		Neil Rackett
 * @param 		{object} options - Object containing optional initialisation options, including 'context'
 */
conbo.EventDispatcher = conbo.ConboClass.extend(
/** @lends conbo.EventDispatcher.prototype */
{
	/**
	 * Do not override: use initialize
	 * @private
	 */
	__construct: function(options)
	{
		if (!!options.context)
		{
			this.context = options.context;
		}
	},
	
	/**
	 * Add a listener for a particular event type
	 * 
	 * @param type		{string}	Type of event ('change') or events ('change blur')
	 * @param handler	{function}	Function that should be called
	 * @param scope		{object}	The scope in which to run the event handler (optional)
	 * @param priority	{number}	The event handler's priority when the event is dispatached (default: 0)
	 * @param once		{boolean}	Should the event listener automatically be removed after it has been called once? (default: false) 
	 */
	addEventListener: function(type, handler, scope, priority, once)
	{
		if (!type) throw new Error('Event type undefined');
		if (!handler || !conbo.isFunction(handler)) throw new Error('Event handler is undefined or not a function');

		if (conbo.isString(type)) type = type.split(' ');
		if (conbo.isArray(type)) conbo.forEach(type, function(value, index, list) { this.__addEventListener(value, handler, scope, priority, !!once); }, this);
		
		return this;
	},
	
	/**
	 * Remove a listener for a particular event type
	 * 
	 * @param type		{string}	Type of event ('change') or events ('change blur') (optional: if not specified, all listeners will be removed) 
	 * @param handler	{function}	Function that should be called (optional: if not specified, all listeners of the specified type will be removed)
	 * @param scope		{object} 	The scope in which the handler is set to run (optional)
	 */
	removeEventListener: function(type, handler, scope)
	{
		if (!arguments.length)
		{
			__definePrivateProperty(this, '__queue', {});
			return this;
		}
		
		if (conbo.isString(type)) type = type.split(' ');
		if (!conbo.isArray(type)) type = [undefined];
		
		conbo.forEach(type, function(value, index, list) 
		{
			this.__removeEventListener(value, handler, scope); 
		}, 
		this);
		
		return this;
	},
	
	/**
	 * Does this object have an event listener of the specified type?
	 * 
	 * @param type		{string}	Type of event (e.g. 'change') 
	 * @param handler	{function}	Function that should be called (optional)
	 * @param scope		{object} 	The scope in which the handler is set to run (optional)
	 */
	hasEventListener: function(type, handler, scope)
	{
		if (!this.__queue 
			|| !(type in this.__queue)
			|| !this.__queue[type].length)
		{
			return false;
		}
		
		var queue = this.__queue[type];
		var length = queue.length;
		
		for (var i=0; i<length; i++)
		{
			if ((!handler || queue[i].handler == handler) 
				&& (!scope || queue[i].scope == scope))
			{
				return true;
			}
		}
		
		return false;
	},
	
	/**
	 * Dispatch the event to listeners
	 * @param event		conbo.Event class instance or event type (e.g. 'change')
	 */
	dispatchEvent: function(event)
	{
		if (!event) throw new Error('Event undefined');
		
		var isString = conbo.isString(event);
		
		if (isString)
		{
			conbo.warn('Use of dispatchEvent("'+event+'") is deprecated, please use dispatchEvent(new conbo.Event("'+event+'"))');
		}
		
		if (isString || !(event instanceof conbo.Event))
		{
			event = new conbo.Event(event);
		}
		
		if (!this.__queue || (!(event.type in this.__queue) && !this.__queue.all)) return this;
		
		if (!event.target) event.target = this;
		event.currentTarget = this;
		
		var queue = conbo.union(this.__queue[event.type] || [], this.__queue.all || []);
		if (!queue || !queue.length) return this;
		
		for (var i=0, length=queue.length; i<length; ++i)
		{
			var value = queue[i];
			var returnValue = value.handler.call(value.scope || this, event);
			if (value.once) this.__removeEventListener(event.type, value.handler, value.scope);
			if (returnValue === false || event.immediatePropagationStopped) break;
		}
		
		return this;
	},
	
	/**
	 * Dispatch a change event for one or more changed properties
	 * @param propName
	 */
	dispatchChange: function()
	{
		conbo.forEach(arguments, function(propName)
		{
			__dispatchChange(this, propName);
		},
		this);
		
		return this;
	},

	toString: function()
	{
		return 'conbo.EventDispatcher';
	},

	/**
	 * @private
	 */
	__addEventListener: function(type, handler, scope, priority, once)
	{
		if (type == '*') type = 'all';
		if (!this.__queue) __definePrivateProperty(this, '__queue', {});
		
		if (!this.hasEventListener(type, handler, scope))
		{
			if (!(type in this.__queue)) this.__queue[type] = [];
			this.__queue[type].push({handler:handler, scope:scope, once:once, priority:priority||0});
			this.__queue[type].sort(function(a,b){return b.priority-a.priority;});
		}
	},
	
	/**
	 * @private
	 */
	__removeEventListener: function(type, handler, scope)
	{
		if (type == '*') type = 'all';
		if (!this.__queue) return;
		
		var queue, 
			i, 
			self = this;
		
		var removeFromQueue = function(queue, key)
		{
			for (i=0; i<queue.length; i++)
			{
				if ((!queue[i].handler || queue[i].handler == handler)
					&& (!queue[i].scope || queue[i].scope == scope))
				{
					queue.splice(i--, 1);
				}
			}
			
			if (!queue.length)
			{
				delete self.__queue[key];
			}
		};
		
		if (type in this.__queue)
		{
			queue = this.__queue[type];
			removeFromQueue(queue, type);
		}
		else if (type == undefined)
		{
			conbo.forEach(this.__queue, function(queue, key)
			{
				removeFromQueue(queue, key);
			});
		}
	},
	
}).implement(conbo.IInjectable);

__definePrivateProperty(conbo.EventDispatcher.prototype, 'bindable');
__denumerate(conbo.EventDispatcher.prototype);

/**
 * conbo.Hash
 * A Hash is a bindable object of associated keys and values
 * 
 * @class		conbo.Hash
 * @augments	conbo.EventDispatcher
 * @author 		Neil Rackett
 * @param 		{object} options - Object containing optional initialisation options, including 'source' (object) containing initial values
 */
conbo.Hash = conbo.EventDispatcher.extend(
/** @lends conbo.Hash.prototype */
{
	/**
	 * Constructor: DO NOT override! (Use initialize instead)
	 * @param options
	 */
	__construct: function(options)
	{
		if (!!options.context) this.context = options.context;
		
		conbo.setDefaults(this, options.source, this.defaults);	
		delete this.defaults;
	},
	
	/**
	 * Return an object that can easily be converted into JSON
	 */
	toJSON: function()
	{
		var filter = function(value) 
		{
			return String(value).indexOf('_') !== 0; 
		};
		
		var obj = {},
			keys = conbo.filter(conbo.properties(this), filter);
		
		keys.forEach(function(value) 
		{
			obj[value] = this[value]; 
		}, 
		this);
		
		return obj;
	},
	
	toString: function()
	{
		return 'conbo.Hash';
	}
	
});

__denumerate(conbo.Hash.prototype);

/**
 * A persistent Hash that stores data in LocalStorage or Session
 * 
 * @class		conbo.LocalHash
 * @augments	conbo.Hash
 * @author 		Neil Rackett
 * @param 		{object} options - Object containing initialisation options, including 'name' (string), 'session' (Boolean) and 'source' (object) containing default values; see Hash for other options
 */
conbo.LocalHash = conbo.Hash.extend(
/** @lends conbo.LocalHash.prototype */
{
	__construct: function(options)
	{
		var defaultName = 'ConboLocalHash';
		
		options = conbo.defineDefaults(options, {name:defaultName});
		
		var name = options.name;
		
		var storage = options.session
			? window.sessionStorage
			: window.localStorage;
		
		if (name == defaultName)
		{
			conbo.warn('No name specified for '+this.toString+', using "'+defaultName+'"');
		}
		
		var getLocal = function()
		{
			return name in storage 
				? JSON.parse(storage.getItem(name) || '{}')
				: options.source || {};
		};
		
		// Sync with LocalStorage
		this.addEventListener(conbo.ConboEvent.CHANGE, function(event)
  		{
  			storage.setItem(name, JSON.stringify(this.toJSON()));
  		}, 
  		this, 1000);
		
		options.source = getLocal();
		
		conbo.Hash.prototype.__construct.call(this, options);		
	},
	
	/**
	 * Immediately writes all data to local storage. If you don't use this method, 
	 * Conbo writes the data the next time it detects a change to a bindable property.
	 */
	flush: function()
	{
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.CHANGE));
	},
	
	toString: function()
	{
		return 'conbo.LocalHash';
	}
	
});

__denumerate(conbo.LocalHash.prototype);

/**
 * Promise
 * 
 * @class		conbo.Promise
 * @augments	conbo.EventDispatcher
 * @author 		Neil Rackett
 * @param 		{object} options - Object containing initialisation options
 */
conbo.Promise = conbo.EventDispatcher.extend(
/** @lends conbo.Promise.prototype */
{
	initialize: function(options)
	{
		this.bindAll('dispatchResult', 'dispatchFault');
	},
	
	/**
	 * Dispatch a result event using the specified result
	 * @param 	result
	 * @returns {conbo.Promise}
	 */
	dispatchResult: function(result)
	{
		this.dispatchEvent(new conbo.ConboEvent('result', {result:result}));
		return this;
	},
	
	/**
	 * Dispatch a fault event using the specified fault
	 * @param 	result
	 * @returns {conbo.Promise}
	 */
	dispatchFault: function(fault)
	{
		this.dispatchEvent(new conbo.ConboEvent('fault', {fault:fault}));
		return this;
	},
	
	/**
	 * Shorthand method for adding a result and fault event handlers
	 *  
	 * @param	{function}	resultHandler
	 * @param	{function}	faultHandler
	 * @param	{object}	scope
	 * @returns	{conbo.Promise}
	 */
	then: function(resultHandler, faultHandler, scope)
	{
		if (resultHandler) this.addEveventListener('result', resultHandler, scope);
		if (faultHandler) this.addEveventListener('fault', faultHandler, scope);
		
		return this;
	},
	
	/**
	 * The class name as a string
	 * @returns {String}
	 */
	toString: function()
	{
		return 'conbo.Promise';
	},
	
});

//__denumerate(conbo.Promise.prototype);

/**
 * Glimpse
 * 
 * A lightweight element wrapper that has no dependencies, no context and 
 * no data binding, but is able to apply a super-simple template.
 * 
 * It's invisible to View, so it's great for creating components, and you 
 * can bind data to it using the `cb-data` attribute to set the data 
 * property of your Glimpse
 * 
 * @class		conbo.Glimpse
 * @augments	conbo.EventDispatcher
 * @author 		Neil Rackett
 * @param 		{object} options - Object containing initialisation options
 */
conbo.Glimpse = conbo.EventDispatcher.extend(
/** @lends conbo.Glimpse.prototype */
{
	/**
	 * Constructor: DO NOT override! (Use initialize instead)
	 * @param options
	 * @private
	 */
	__construct: function(options)
	{
		this.__setEl(options.el || document.createElement(this.tagName));
		
		if (this.template)
		{
			this.el.innerHTML = this.template;
		}
	},
	
	/**
	 * The default `tagName` is `div`
	 */
	get tagName()
	{
		return this.__tagName || 'div';
	},
	
	set tagName(value)
	{
		__definePrivateProperty(this, '__tagName', value);
	},
	
	/**
	 * The class's element
	 */
	get el()
	{
		return this.__el;
	},
	
	toString: function()
	{
		return 'conbo.Glimpse';
	},
	
	/**
	 * Set this View's element
	 * @private
	 */
	__setEl: function(element)
	{
		var attrs = conbo.setValues({}, this.attributes);
		
		if (this.id && !element.id) 
		{
			attrs.id = this.id;
		}
		
		var classList = el.classList;
		
		el = element;
		el.cbGlimpse = this;
		
		classList.add('cb-glimpse');
		
		if (this.className)
		{
			classList.add.apply(classList, this.className.split(' '));
		}
		
		conbo.setValues(el, attrs);
		
		__definePrivateProperty(this, '__el', el);
		
		return this;
	}
	
});

__denumerate(conbo.Glimpse.prototype);


	return conbo;
});