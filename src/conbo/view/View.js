var View__templateCache = {};

/**
 * View
 * 
 * Creating a conbo.View creates its initial element outside of the DOM,
 * if an existing element is not provided...
 * 
 * @class		View
 * @memberof	conbo
 * @augments	conbo.Glimpse
 * @author 		Neil Rackett
 * @param 		{Object}	[options] - Object containing optional initialisation options, including 'attributes', 'className', 'data', 'el', 'id', 'tagName', 'template', 'templateUrl'
 * @fires		conbo.ConboEvent#ADD
 * @fires		conbo.ConboEvent#DETACH
 * @fires		conbo.ConboEvent#REMOVE
 * @fires		conbo.ConboEvent#BIND
 * @fires		conbo.ConboEvent#UNBIND
 * @fires		conbo.ConboEvent#TEMPLATE_COMPLETE
 * @fires		conbo.ConboEvent#TEMPLATE_ERROR
 * @fires		conbo.ConboEvent#PREINITIALIZE
 * @fires		conbo.ConboEvent#INITIALIZE
 * @fires		conbo.ConboEvent#INIT_COMPLETE
 * @fires		conbo.ConboEvent#CREATION_COMPLETE
 */
conbo.View = conbo.Glimpse.extend(
/** @lends 		conbo.View.prototype */
{
	/**
	 * @member		{Object}	attributes - Attributes to apply to the View's element
	 * @memberof	conbo.View.prototype
	 */
	
	/**
	 * @member		{string}	className - CSS class name(s) to apply to the View's element
	 * @memberof	conbo.View.prototype
	 */
	
	/**
	 * @member		{Object}	data - Arbitrary data Object
	 * @memberof	conbo.View.prototype
	 */
	
	/**
	 * @member		{string}	id - ID to apply to the View's element
	 * @memberof	conbo.View.prototype
	 */
	
	/**
	 * @member		{any}		style - Object containing CSS styles to apply to this View's element
	 * @memberof	conbo.View.prototype
	 */
	
	/**
	 * @member		{string}	tagName - The tag name to use for the View's element (if no element specified)
	 * @memberof	conbo.View.prototype
	 */
	
	/**
	 * @member		{string}	template - Template to apply to the View's element
	 * @memberof	conbo.View.prototype
	 */
	
	/**
	 * @member		{string}	templateUrl - Template to load and apply to the View's element
	 * @memberof	conbo.View.prototype
	 */
	
	/**
	 * @member		{boolean}	templateCacheEnabled - Whether or not the contents of templateUrl should be cached on first load for use with future instances of this View class (default: true)
	 * @memberof	conbo.View.prototype
	 */
	
	/**
	 * @member		{boolean}	autoInitTemplate - Whether or not the template should automatically be loaded and applied, rather than waiting for the user to call initTemplate (default: true)
	 * @memberof	conbo.View.prototype
	 */
	
	/**
	 * Constructor: DO NOT override! (Use initialize instead)
	 * @param options
	 * @private
	 */
	__construct: function(options)
	{
		options = conbo.clone(options) || {};
		
		if (options.className && this.className)
		{
			options.className += ' '+this.className;
		}
		
		var viewOptions = conbo.union
		(
			[
				'attributes',
				'className', 
				'data', 
				'id', 
				'style', 
				'tagName', 
				'template', 
				'templateUrl',
				'templateCacheEnabled',
				'autoInitTemplate',
			],
			
			// Adds interface properties
			conbo.intersection
			(
				conbo.variables(this, true), 
				conbo.variables(options)
			)
		);
		
		conbo.assign(this, conbo.pick(options, viewOptions));
		conbo.makeBindable(this);
		
		this.context = options.context;
		this.__setEl(options.el || document.createElement(this.tagName));
	},

	/**
	 * @private
	 */
	__postInitialize: function(options)
	{
		__definePrivateProperty(this, '__initialized', true);
		
		this.__content =  this.el.innerHTML;
		
		if (this.autoInitTemplate !== false)
		{
			this.initTemplate();
		}
	},
	
	/**
	 * This View's element
	 * @type		{HTMLElement}
	 */
	get el()
	{
		return this.__el;
	},
	
	/**
	 * Has this view completed its life cycle phases?
	 * @type	{boolean}
	 */
	get initialized()
	{
		return !!this.__initialized;
	},
	
	/**
	 * Returns a reference to the parent View of this View, based on this 
	 * View element's position in the DOM
	 * @type	{conbo.View}
	 */
	get parent()
	{
		if (this.initialized)
		{
			return this.__getParent('.cb-view');
		}
	},
	
	/**
	 * Returns a reference to the parent Application of this View, based on
	 * this View element's position in the DOM
	 * @type	{conbo.Application}
	 */
	get parentApp()
	{
		if (this.initialized)
		{
			return this.__getParent('.cb-app');
		}
	},
	
	/**
	 * Does this view have a template?
	 * @type	{boolean}
	 */
	get hasTemplate()
	{
		return !!(this.template || this.templateUrl);
	},
	
	/**
	 * The element into which HTML content should be placed; this is either the 
	 * first DOM element with a `cb-content` or the root element of this view
	 * @type	{HTMLElement}
	 */
	get content()
	{
		return this.querySelector('[cb-content]');
	},
	
	/**
	 * Does this View support HTML content?
	 * @type	{boolean}
	 */
	get hasContent()
	{
		return !!this.content;
	},
	
	/**
	 * A View's body is the element to which content should be added:
	 * the View's content, if it exists, or the View's main element, if it doesn't
	 * @type	{HTMLElement}
	 */
	get body()
	{
		return this.content || this.el;
	},
	
	/**
	 * The context that will automatically be applied to children
	 * when binding or appending Views inside of this View
	 * @type	{conbo.Context}
	 */
	get subcontext()
	{
		return this.__subcontext || this.context;
	},
	
	set subcontext(value)
	{
		this.__subcontext = value;
	},
	
	/**
	 * The current view state.
	 * When set, adds "cb-state-x" CSS class on the View's element, where "x" is the value of currentState.
	 * @type	{string}
	 */
	get currentState()
	{
		return this.__currentState || '';
	},

	set currentState(value)
	{
		// If the view is ready the state class is applied immediately, otherwise it gets set in __setEl()
		if (this.el)
		{
			if (this.currentState)
			{
				this.el.classList.remove('cb-state-'+this.currentState);
			}

			if (value)
			{
				this.el.classList.add('cb-state-'+value);
			}
		}

		this.__currentState = value;
		this.dispatchChange('currentState');
	},

	/**
	 * Convenience method for conbo.ConboEvent.TEMPLATE_COMPLETE event handler
	 */
	templateComplete: function() {},
	
	/**
	 * Convenience method for conbo.ConboEvent.CREATION_COMPLETE event handler
	 */
	creationComplete: function() {},

	/**
	 * Uses querySelector to find the first matching element contained within the
	 * current View's element, but not within the elements of child Views
	 * 
	 * @param	{string}		selector - The selector to use
	 * @param	{boolean}		deep - Include elements in child Views?
	 * @returns	{HTMLElement}	The first matching element
	 */
	querySelector: function(selector, deep)
	{
		return this.querySelectorAll(selector, deep)[0];
	},
	
	/**
	 * Uses querySelectorAll to find all matching elements contained within the
	 * current View's element, but not within the elements of child Views
	 * 
	 * @param	{string}		selector - The selector to use
	 * @param	{boolean}		deep - Include elements in child Views?
	 * @returns	{Array}			All elements matching the selector
	 */
	querySelectorAll: function(selector, deep)
	{
		if (this.el)
		{
			var results = conbo.toArray(this.el.querySelectorAll(selector));
			
			if (!deep)
			{
				var views = this.el.querySelectorAll('.cb-view, [cb-view], [cb-app]');
				
				// Remove elements in child Views
				conbo.forEach(views, function(el)
				{
					var els = conbo.toArray(el.querySelectorAll(selector));
					results = conbo.difference(results, els.concat(el));
				});
			}
			
			return results;
		}
		
		return [];
	},
	
	/**
	 * Take the View's element element out of the DOM
	 * @returns	{this}
	 */
	detach: function() 
	{
		try
		{
			var el = this.el;

			if (el.parentNode)
			{
				el.parentNode.removeChild(el);		
				this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.DETACH));
			}
		}
		catch(e) {}
		
		return this;
	},
	
	/**
	 * Remove and destroy this View by taking the element out of the DOM, 
	 * unbinding it, removing all event listeners and removing the View from 
	 * its Context.
	 * 
	 * You should use a REMOVE event handler to destroy any event listeners,
	 * timers or other persistent code you may have added.
	 * 
	 * @returns	{this}
	 */
	remove: function()
	{
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.REMOVE));
		
		if (this.data)
		{
			this.data = undefined;
		}
		
		if (this.subcontext && this.subcontext != this.context)
		{
			this.subcontext.destroy();
			this.subcontext = undefined;
		}
		
		if (this.context)
		{
			this.context.uninject(this);
			this.context.removeEventListener(undefined, undefined, this);
			this.context = undefined;
		}
		
		var children = this.querySelectorAll('.cb-view', true);

		while (children.length)
		{
			var child = children.pop();

			try { child.cbView.remove(); }
			catch (e) {}
		}

		this.unbindView()
			.detach()
			.removeEventListener()
			.destroy()
			;
		
		return this;
	},

	/**
	 * Append this DOM element from one View class instance this class 
	 * instances DOM element
	 * 
	 * @param 		{conbo.View|Function} view - The View instance to append
	 * @returns		{this}
	 */
	appendView: function(view)
	{
		if (arguments.length > 1)
		{
			conbo.forEach(arguments, function(view, index, list) 
			{
				this.appendView(view);
			},
			this);
			
			return this;
		}
	
		if (typeof view === 'function')
		{
			view = new view(this.context);
		}

		if (!(view instanceof conbo.View))
		{
			throw new Error('Parameter must be conbo.View class or instance of it');
		}
	
		this.body.appendChild(view.el);
		
		return this;
	},
	
	/**
	 * Prepend this DOM element from one View class instance this class 
	 * instances DOM element
	 * 
	 * @param 		{conbo.View} view - The View instance to preppend
	 * @returns		{this}
	 */
	prependView: function(view)
	{
		if (arguments.length > 1)
		{
			conbo.forEach(arguments, function(view, index, list) 
			{
				this.prependView(view);
			}, 
			this);
			
			return this;
		}
	
		if (typeof view === 'function')
		{
			view = new view(this.context);
		}
		
		if (!(view instanceof conbo.View))
		{
			throw new Error('Parameter must be conbo.View class or instance of it');
		}
		
		var firstChild = this.body.firstChild;
		
		firstChild
			? this.body.insertBefore(view.el, firstChild)
			: this.appendView(view);
		
		return this;
	},
	
	/**
	 * Automatically bind elements to properties of this View
	 * 
	 * @example	<div cb-bind="property|parseMethod" cb-hide="property">Hello!</div> 
	 * @returns	{this}
	 */
	bindView: function()
	{
		conbo.bindingUtils.bindView(this);
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.BIND));
		return this;
	},
	
	/**
	 * Unbind elements from class properties
	 * @returns	{this}
	 */
	unbindView: function() 
	{
		conbo.bindingUtils.unbindView(this);
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.UNBIND));
		return this;
	},
	
	/**
	 * Initialize the View's template, either by loading the templateUrl
	 * or using the contents of the template property, if either exist
	 * @returns	{this}
	 */
	initTemplate: function()
	{
		var template = this.template;
		
		if (!!this.templateUrl)
		{
			this.loadTemplate();
		}
		else
		{
			if (conbo.isFunction(template))
			{
				template = template(this);
			}
			
			var el = this.el;
			
			if (conbo.isString(template))
			{
				el.innerHTML = this.__parseTemplate(template);
			}
			else if (/{{(.+?)}}/.test(el.textContent))
			{
				el.innerHTML = this.__parseTemplate(el.innerHTML);
			}
			
			this.__initView();
		}
		
		return this;
	},
	
	/**
	 * Load HTML template and use it to populate this View's element
	 * 
	 * @param 	{string}	[url]	- The URL to which the request is sent
	 * @returns	{this}
	 */
	loadTemplate: function(url)
	{
		url || (url = this.templateUrl);
		
		var el = this.body;
		
		this.unbindView();
		
		if (this.templateCacheEnabled !== false && View__templateCache[url])
		{
			el.innerHTML = View__templateCache[url];
			this.__initView();
			
			return this;
		}
		
		var resultHandler = function(event)
		{
			var result = this.__parseTemplate(event.result);
			
			if (this.templateCacheEnabled !== false)
			{
				View__templateCache[url] = result;
			}
			
			el.innerHTML = result;
			this.__initView();
		};
		
		var faultHandler = function(event)
		{
			el.innerHTML = '';
			
			this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.TEMPLATE_ERROR));
			this.__initView();
		};
		
		conbo
			.httpRequest({url:url, dataType:'text'})
			.then(resultHandler.bind(this), faultHandler.bind(this))
			;
		
		return this;
	},
	
	toString: function()
	{
		return 'conbo.View';
	},

	
	/* INTERNAL */
	
	/**
	 * Set this View's element
	 * @private
	 */
	__setEl: function(el)
	{
		if (!conbo.isElement(el))
		{
			conbo.error('Invalid element passed to View');
			return;
		}
		
		var attrs = conbo.assign({}, this.attributes);
		
		if (this.id && !el.id) 
		{
			attrs.id = this.id;
		}
		
		if (this.style) 
		{
			conbo.assign(el.style, this.style);
		}
		
		var ep = __ep(el);
		
		el.cbView = this;
		
		ep.addClass('cb-view')
			.addClass(this.className)
			.addClass(this.__className)
			.setAttributes(attrs)
			;

		if (this.currentState)
		{
			ep.addClass('cb-state-'+this.currentState);			
		}

		__definePrivateProperty(this, '__el', el);
		
		return this;
	},

	/**
	 * Populate and render the View's HTML content
	 * @private
	 */
	__initView: function()
	{
		if (this.hasTemplate && this.hasContent)
		{
			this.content.innerHTML = this.__content;
		}
		
		delete this.__content;
		
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.TEMPLATE_COMPLETE));
		this.templateComplete();
		this.bindView();
		
		conbo.defer(function()
		{
			this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.CREATION_COMPLETE));
			this.creationComplete();
		}, this);
		
		return this;
	},
	
	/**
	 * @private
	 */
	__getParent: function(selector) 
	{
		var el = __ep(this.el).closest(selector);
	    if (el) return el.cbView;
	},
	
	/**
	 * @private
	 */
	__parseTemplate: function(template)
	{
		return conbo.bindingUtils.parseTemplate(template);
	}
	
});

__denumerate(conbo.View.prototype);
