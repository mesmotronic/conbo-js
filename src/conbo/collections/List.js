/**
 * A bindable Array wrapper that can be used when you don't require 
 * web service connectivity.
 * 
 * Plain objects will automatically be converted into an instance of 
 * the specified `itemClass` when added to a List, and the appropriate
 * events dispatched if the items it contains are changed or updated.
 * 
 * This class implements the Web Storage API.
 * 
 * @class		List
 * @memberof	conbo
 * @augments	conbo.EventDispatcher
 * @author 		Neil Rackett
 * @param 		{Object} options - Object containing optional initialisation options, including `source` (array), `context` (Context) and `itemClass` (Class)
 * @fires		conbo.ConboEvent#CHANGE
 * @fires		conbo.ConboEvent#ADD
 * @fires		conbo.ConboEvent#REMOVE
 */
conbo.List = conbo.EventDispatcher.extend(
/** @lends conbo.List.prototype */
{
	/**
	 * The class to use for items in this list (plain JS objects will 
	 * automatically be wrapped using this class), defaults to conbo.Hash
	 */
	itemClass: conbo.Hash,
	
	/**
	 * Constructor: DO NOT override! (Use initialize instead)
	 * @param options
	 */
	__construct: function(options) 
	{
		this.addEventListener(conbo.ConboEvent.ADD, this.__updateArrayAccess, {scope:this, priority:9999})
			.addEventListener(conbo.ConboEvent.REMOVE, this.__updateArrayAccess, {scope:this, priority:9999})
			;
		
		var listOptions = ['itemClass'];
		
		conbo.assign(this, conbo.pick(options, listOptions));
		
		this.source = options.source || [];
	},
	
	/**
	 * The Array used as the source for this List
	 */
	get source()
	{
		if (!this.__source)
		{
			this.__source = [];
		}
		
		return this.__source;
	},
	
	set source(value)
	{
		this.__source = [];
		this.push.apply(this, conbo.toArray(value));
		this.dispatchChange('source', 'length');
	},
	
	/**
	 * The number of items in the List
	 */
	get length()
	{
		if (this.source)
		{
			return this.source.length;
		}
		
		return 0;
	},
	
	/**
	 * Add an item to the end of the collection.
	 */
	push: function(item)
	{
		var items = conbo.toArray(arguments);
		
		if (items.length)
		{
			this.source.push.apply(this.source, this.__applyItemClass(items));
			this.__updateBindings(items);
			this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.ADD));
			this.dispatchChange('length');
		}
		
		return this.length;
	},
	
	/**
	 * Remove an item from the end of the collection.
	 */
	pop: function()
	{
		if (!this.length) return;
		
		var item = this.source.pop();
		
		this.__updateBindings(item, false);
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.REMOVE));
		this.dispatchChange('length');
		
		return item;
	},
	
	/**
	 * Add an item to the beginning of the collection.
	 */
	unshift: function(item) 
	{
		if (item)
		{
			this.source.unshift.apply(this.source, this.__applyItemClass(conbo.toArray(arguments)));
			this.__updateBindings(conbo.toArray(arguments));
			this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.ADD));
			this.dispatchChange('length');
		}
		
		return this.length;
	},
	
	/**
	 * Remove an item from the beginning of the collection.
	 */
	shift: function()
	{
		if (!this.length) return;
		
		var item = this.source.shift();
		
		this.__updateBindings(item, false);
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.REMOVE));
		this.dispatchChange('length');
		
		return item;
	},
	
	/**
	 * Slice out a sub-array of items from the collection.
	 */
	slice: function(begin, length)
	{
		begin || (begin = 0);
		if (conbo.isUndefined(length)) length = this.length;
		
		return new conbo.List({source:this.source.slice(begin, length)});
	},
	
	/**
	 * Splice out a sub-array of items from the collection.
	 */
	splice: function(begin, length)
	{
		begin || (begin = 0);
		if (conbo.isUndefined(length)) length = this.length;
		
		var inserts = conbo.rest(arguments,2);
		var items = this.source.splice.apply(this.source, [begin, length].concat(inserts));
		
		if (items.length) this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.REMOVE));
		if (inserts.length) this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.ADD));
		
		if (items.length || inserts.length)
		{
			this.dispatchChange('length');
		}
		
		return new conbo.List({source:items});
	},
	
	/**
	 * Get the item at the given index; similar to array[index]
	 * @deprecated	Use getItem()
	 */
	getItemAt: function(index) 
	{
		return this.source[index];
	},
	
	/**
	 * Add (or replace) item at given index with the one specified,
	 * similar to array[index] = value;
	 * @deprecated	Use setItem()
	 */
	setItemAt: function(index, item)
	{
		var length = this.length;
		
		var replaced = this.source[index];
		this.__updateBindings(replaced, false);
		
		this.source[index] = item;
		this.__updateBindings(item);
		
		if (this.length > length)
		{
			this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.ADD));
			this.dispatchChange('length');
		}
		
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.CHANGE, {item:item}));
		
		return replaced;
	},
	
	/**
	 * Force the collection to re-sort itself.
	 * @param	{Function}	[compareFunction] - Compare function to determine sort order
	 */
	sort: function(compareFunction) 
	{
		this.source.sort(compareFunction);
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.CHANGE));
		
		return this;
	},
	
	/**
   	 * Create a new List identical to this one.
	 */
	clone: function() 
	{
		return new this.constructor(this.source);
	},
	
	/**
	 * The JSON-friendly representation of the List
	 */
	toJSON: function() 
	{
		return conbo.jsonify(this.source);
	},
	
	toArray: function()
	{
		return this.source.slice();
	},

	toString: function()
	{
		return 'conbo.List';
	},
	
	// Web Storage API

	// [Web Storage API] for 'length' property, see above

	/**
	 * [Web Storage API] When passed a number n, this method will return n if that index exists or -1 if it does not
	 * @param {number} index
	 */
	key: function(index)
	{
		if (index in this.source)
		{
			return index;
		}

		return -1;
	},
	
	/**
	 * [Web Storage API] When passed a key name, will return that key's value
	 * @param {number} keyName
	 */
	getItem: function(keyName)
	{
		return this.getItemAt(keyName);
	},
	
	/**
	 * [Web Storage API] When passed a key name and value, will add that key to the List (i.e. add a new value at that index), or update that key's value if it already exists
	 * @param {number} keyName
	 * @param {*} keyValue
	 */
	setItem: function(keyName, keyValue)
	{
		this.setItemAt(keyName, keyValue);
	},

	/**
	 * [Web Storage API] When passed an key name, will remove that key from the List, equivalent to List.splice(keyName, 1)
	 * @param {number} keyName
	 */
	removeItem: function(keyName)
	{
		this.splice(keyName, 1);
	},

	/**
	 * [Web Storage API] When invoked, will empty all items out of the List, reducing its length to zero
	 */
	clear: function()
	{
		this.splice();
	},

	// Internal

	/**
	 * Listen to the events of Bindable values so we can detect changes
	 * @param 	{any}		models
	 * @param 	{Boolean}	enabled
	 * @private
	 */
	__updateBindings: function(items, enabled)
	{
		var method = enabled === false ? 'removeEventListener' : 'addEventListener';
		
		items = (conbo.isArray(items) ? items : [items]).slice();
		
		while (items.length)
		{
			var item = items.pop();
			
			if (item instanceof conbo.EventDispatcher)
			{
				item[method](conbo.ConboEvent.CHANGE, this.dispatchEvent, this);
			}
		}
	},
	
	/**
	 * Enables array access operator, e.g. myList[0]
	 * @private
	 */
	__updateArrayAccess: function(event)
	{
		var i;
		
		var define = (function(n)
		{
			Object.defineProperty(this, n, 
			{
				get: function() { return this.getItemAt(n); },
				set: function(value) { this.setItemAt(n, value); },
				configurable: true,
				enumerable: true
			});
		}).bind(this);
		
		for (i=0; i<this.length; i++)
		{
			if (!(i in this)) define(i);
		}
		
		while (i in this)
		{
			delete this[i++];
		}
	},
	
	/**
	 * @private
	 */
	__applyItemClass: function(item)
	{
		if (item instanceof Array)
		{
			for (var i=0; i<item.length; i++)
			{
				item[i] = this.__applyItemClass(item[i]);
			}
			
			return item;
		}
		
		if (conbo.isObject(item) 
			&& !conbo.isClass(item)
			&& !(item instanceof conbo.Class)
			)
		{
			item = new this.itemClass({source:item, context:this.context});
		}
		
		return item;
	},
	
}).implement(conbo.IInjectable);

// Utility methods that we want to implement on the List.
var listMethods = 
[
	'forEach', 'map', 'find', 'findIndex', 'filter', 'reject', 'every', 
	'contains', 'invoke', 'indexOf', 'lastIndexOf', 'max', 'min',
	'size', 'rest', 'last', 'without', 'shuffle', 'isEmpty', 'sortOn'
];

// Mix in each available Conbo utility method as a proxy
listMethods.forEach(function(method) 
{
	if (!(method in conbo)) return;
	
	conbo.List.prototype[method] = function() 
	{
		var args = [this.source].concat(conbo.toArray(arguments)),
			result = conbo[method].apply(conbo, args);
		
		// TODO What's the performance impact of doing this?
//		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.CHANGE));
		
		return conbo.isArray(result)
//			? new this.constructor({source:result}) // TODO Return List of same type as original?
			? new conbo.List({source:result, itemClass:this.itemClass})
			: result;
	};
});

__denumerate(conbo.List.prototype);
