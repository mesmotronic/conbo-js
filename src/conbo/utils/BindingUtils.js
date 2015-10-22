/**
 * Binding utility class
 * 
 * Used to bind properties of EventDispatcher class instances to DOM elements, 
 * other EventDispatcher class instances or setter functions
 * 
 * @author Neil Rackett
 */
conbo.BindingUtils = conbo.Class.extend({},
{
	__attrBindings: new conbo.AttributeBindings(),
	
	/**
	 * Bind a property of a EventDispatcher class instance (e.g. Hash or Model) 
	 * to a DOM element's value/content, using Conbo's best judgement to
	 * work out how the value should be bound to the element.
	 * 
	 * This method of binding also allows for the use of a parse function,
	 * which can be used to manipulate bound data in real time
	 * 
	 * @param 		{conbo.EventDispatcher}	source				Class instance which extends from conbo.EventDispatcher (e.g. Hash or Model)
	 * @param 		{String} 				propName			Property name to bind
	 * @param 		{DOMElement} 			element				DOM element to bind value to (two-way bind on input/form elements)
	 * @param 		{Function}				parseFunction		Optional method used to parse values before outputting as HTML
	 * 
	 * @returns		{Array}										Array of bindings
	 */
	bindElement: function(source, propName, element, parseFunction)
	{
		if (!(source instanceof conbo.EventDispatcher))
		{
			throw new Error('Source is not EventDispatcher');
		}
		
		if (!element)
		{
			throw new Error('element is undefined');
		}
		
		if (!conbo.isAccessor(source, propName)) // Use isBindable?
		{
			conbo.warn('It may not be possible to detect changes to "'+propName+'" on class "'+source.toString()+'" because the property is not bindable');
		}
		
		var scope = this,
			bindings = [],
			eventType,
			eventHandler;
		
		parseFunction || (parseFunction = this.defaultParseFunction);
		
		$(element).each(function(index, el)
		{
			var $el = $(el);
			var tagName = $el[0].tagName;
			
			switch (tagName)
			{
				case 'INPUT':
				case 'SELECT':
				case 'TEXTAREA':
				{	
					var type = ($el.attr('type') || tagName).toLowerCase();
					
					switch (type)
					{
						case 'checkbox':
						{
							$el.prop('checked', !!source[propName]);
							
							eventType = 'change:'+propName;
							
							eventHandler = function(event)
							{
								$el.prop('checked', !!event.value);
							};
							
							source.addEventListener(eventType, eventHandler);
							bindings.push([source, eventType, eventHandler]);
							
							eventType = 'input change';
							
							eventHandler = function(event)
							{	
								scope.__set.call(source, propName, $el.is(':checked'));
							};
							
							$el.on(eventType, eventHandler);
							bindings.push([$el, eventType, eventHandler]);
							
							return;
						}
						
						case 'radio':
						{
							if ($el.val() == source[propName]) $el.prop('checked', true);
							
							eventType = 'change:'+propName;
							
							eventHandler = function(event)
							{
								if (event.value == null) event.value = '';
								if ($el.val() != event.value) return; 
								
								$el.prop('checked', true);
							};
							
							source.addEventListener(eventType, eventHandler);
							bindings.push([source, eventType, eventHandler]);
							
							break;
						}
						
						default:
						{
							$el.val(source[propName]);
						
							eventType = 'change:'+propName;
							
							eventHandler = function(event)
							{
								if (event.value == null) event.value = '';
								if ($el.val() == event.value) return;
								
								$el.val(event.value);
							};
							
							source.addEventListener(eventType, eventHandler);
							bindings.push([source, eventType, eventHandler]);
							
							break;
						}
					}
					
					eventType = 'input change';
					
					eventHandler = function(event)
					{	
						scope.__set.call(source, propName, $el.val() === undefined ? $el.html() : $el.val());
					};
					
					$el.on(eventType, eventHandler);
					bindings.push([$el, eventType, eventHandler]);
					
					break;
				}
				
				default:
				{
					$el.html(parseFunction(source[propName]));
					
					eventType = 'change:'+propName;
					
					eventHandler = function(event) 
					{
						var html = parseFunction(event.value);
						$el.html(html);
					};
					
					source.addEventListener(eventType, eventHandler);
					bindings.push([source, eventType, eventHandler]);
					
					break;
				}
			}
			
		});
		
		return bindings;
	},
	
	/**
	 * Unbinds the specified property of a bindable class from the specified DOM element
	 * 
	 *  @param	el		DOM element
	 *  @param	view	View class
	 */
	unbindElement: function(source, propName, element)
	{
		// TODO Implement unbindElement
	},
	
	/**
	 * Bind a DOM element to the property of a EventDispatcher class instance,
	 * e.g. Hash or Model, using cb-* attributes to specify how the binding
	 * should be made.
	 * 
	 * Two way bindings will automatically be applied where the attribute name 
	 * matches a property on the target element, meaning your EventDispatcher object 
	 * will automatically be updated when the property changes.
	 * 
	 * @param 	{conbo.EventDispatcher}	source			Class instance which extends from conbo.EventDispatcher (e.g. Hash or Model)
	 * @param 	{String}			propertyName	Property name to bind
	 * @param 	{DOMElement}		element			DOM element to bind value to (two-way bind on input/form elements)
	 * @param 	{String}			attributeName	The cb-* property to bind against in camelCase, e.g. "propName" for "cb-prop-name"
	 * @param 	{Function} 			parseFunction	Method used to parse values before outputting as HTML (optional)
	 * @param	{Object}			options			Options related to this attribute binding (optional)
	 * 
	 * @returns	{Array}								Array of bindings
	 */
	bindAttribute: function(source, propertyName, element, attributeName, parseFunction, options)
	{
		if (this.__isReservedAttribute(attributeName))
		{
			return [];
		}
		
		if (!element)
		{
			throw new Error('element is undefined');
		}
		
		if (attributeName == "bind")
		{
			return this.bindElement(source, propertyName, element, parseFunction);
		}
		
		var scope = this,
			bindings = [],
			isConbo = false,
			isNative = false,
			eventType,
			eventHandler,
			args = conbo.toArray(arguments).slice(5),
			camelCase = conbo.toCamelCase('cb-'+attributeName),
			split = attributeName.split('-');
		
		switch (true)
		{
			case split[0] == 'attr':
			{
				attributeName = attributeName.substr(5);
				isNative = attributeName in element;
				break;
			}
			
			default:
			{
				isConbo = camelCase in this.__attrBindings;
				isNative = !isConbo && attributeName in element;
			}
		}
		
		parseFunction || (parseFunction = this.defaultParseFunction);
		
		switch (true)
		{
			// If we have a bespoke handler for this attribute, use it
			case isConbo:
			{
				if (!(source instanceof conbo.EventDispatcher))
				{
					conbo.warn('Source is not EventDispatcher');
					return this;
				}
				
				var fn = scope.__attrBindings[camelCase],
					isRaw = fn.raw;
				
				if (isRaw)
				{
					fn.apply
					(
						scope.__attrBindings, 
						[propertyName, element].concat(args)
					);
				}
				else
				{
					eventHandler = function(event)
					{
						fn.apply
						(
							scope.__attrBindings, 
							[parseFunction(source[propertyName]), element].concat(args)
						);
					}
					
					eventType = 'change:'+propertyName;
					
					source.addEventListener(eventType, eventHandler);
					eventHandler();
					
					bindings.push([source, eventType, eventHandler]);
				}
				
				break;
			}
			
			case isNative:
			{
				switch (true)
				{
					case !attributeName.indexOf('on') == 0 && conbo.isFunction(element[attributeName]):
						conbo.warn('cb-'+attributeName+' is not a recognised attribute, did you mean cb-on'+attributeName+'?');
						break;
						
					// If it's an event, add a listener
					case attributeName.indexOf('on') == 0:
					{
						if (!conbo.isFunction(source[propertyName]))
						{
							conbo.warn(propertyName+' is not a function and cannot be bound to DOM events');
							return this;
						}
						
						$(element).on(attributeName.substr(2), source[propertyName]);
						return this;
					}
					
					// ... otherwise, bind to the native property
					default:
					{
						if (!(source instanceof conbo.EventDispatcher))
						{
							conbo.warn('Source is not EventDispatcher');
							return this;
						}
						
						eventHandler = function()
						{
							var value;
							
							value = parseFunction(source[propertyName]);
							value = conbo.isBoolean(element[attributeName]) ? !!value : value;
							
							element[attributeName] = value;
						}
					    
						eventType = 'change:'+propertyName;
						source.addEventListener(eventType, eventHandler);
						eventHandler();
						
						bindings.push([source, eventType, eventHandler]);
						
						var $el = $(element);
						
						eventHandler = function()
		     			{
							scope.__set.call(source, propertyName, element[attributeName]);
		     			};
						
		     			eventType = 'input change';
						$el.on(eventType, eventHandler);
						
						bindings.push([$el, eventType, eventHandler]);
						
						break;
					}
				}
				
				break;
			}
			
			default:
			{
				conbo.warn('cb-'+attributeName+' is not recognised or does not exist on specified element');
				break;
			}
		}
		
		return bindings;
	},
	
	/**
	 * Bind everything within the DOM scope of a View to the specified 
	 * properties of EventDispatcher class instances (e.g. Hash or Model)
	 * 
	 * @param 	{conbo.View}		view		The View class controlling the element
	 * @returns	{this}
	 */
	bindView: function(view)
	{
		if (!view)
		{
			throw new Error('view is undefined');
		}
		
		if (!!view.__bindings__)
		{
			this.unbindView(view);
		}
		
		var options = {view:view},
			bindings = [],
			$ignored = view.$('[cb-repeat]'),
			scope = this;
		
		if (!!view.subcontext) 
		{
			view.subcontext.addTo(options);
		}
		
		this.applyViews(view, view.context.namespace, 'glimpse');
		
		view.$('*').add(view.el).filter(function()
		{
			if (this == view.el) return true;
			if ($ignored.find(this).length) return false;
			return true;
		})
		.each(function(index, el)
		{
			var cbData = $(el).cbAttrs(false);
			
			if (!cbData) 
			{
				return;
			}
			
			var keys = conbo.keys(cbData);
			
			// Prevents Conbo trying to populate repeat templates 
			if (keys.indexOf('repeat') != -1)
			{
				keys = ['repeat'];
			}
			
			keys.forEach(function(key)
			{
				if (scope.__isReservedAttribute(key))
				{
					return;
				}
				
				var a, i, f,
					d = cbData[key],
					b = d.split('|'),
					splits = scope.__splitAttribute('cb-'+key, b[0]);
				
				if (!splits)
				{
					conbo.warn('cb-'+key+' attribute cannot be empty');
					return;
				}
				
				try
				{
					f = !!b[1] ? eval('view.'+scope.cleanPropertyName(b[1])) : undefined;
					f = conbo.isFunction(f) ? f : undefined;
				}
				catch (e) {}
				
				for (a in splits)
				{
					var param = splits[a],
						split = scope.cleanPropertyName(a).split('.'),
						property = split.pop(),
						model;
					
					try
					{
						model = !!split.length ? eval('view.'+split.join('.')) : view;
					}
					catch (e) {}
					
					if (!model) 
					{
						conbo.warn(a+' is not defined in this View');
						return;
					}
					
					if (!property) 
					{
						conbo.warn('Unable to bind to undefined property "'+property+'"');
						return;
					}
					
					var args = [model, property, el, key, f, options, param];
	
					bindings = bindings.concat(scope.bindAttribute.apply(scope, args));
				}
				
				// Dispatch a `bind` event from the element at the end of the current call stack
				conbo.defer(function()
				{
					var customEvent;
					
					customEvent = document.createEvent('CustomEvent');
					customEvent.initCustomEvent('bind', false, false, {});					
					
					el.dispatchEvent(customEvent);
				});
				
			});
			
		});
		
		_defineUnenumerableProperty(view, '__bindings__', bindings);
		
		return this;
	},
	
	/**
	 * Removes all data binding from the specified View instance
	 * @param 	{conbo.View}	view
	 * @return	{this}
	 */
	unbindView: function(view)
	{
		if (!view)
		{
			throw new Error('view is undefined');
		}
		
		if (!view.__bindings__ || !view.__bindings__.length)
		{
			return this;
		}
		
		var bindings = view.__bindings__;
		
		while (bindings.length)
		{
			var binding = bindings.pop();
			
			try
			{
				switch (true)
				{
					case binding[0] instanceof $:
					{
						binding[0].off(binding[1], binding[2]);
						break;
					}
					
					case binding[0] instanceof conbo.EventDispatcher:
					case !!binding[0] && !!binding[0].removeEventListener:
					{
						binding[0].removeEventListener(binding[1], binding[2]);
						break;
					}
					
					default:
					{
						// Looks like the object's been deleted!
						break;
					}
				}
			}
			catch (e) 
			{
				// TODO ?
			}
		}
		
		delete view.__bindings__;
		
		return this;
	},
	
	/**
	 * Applies View classes child DOM elements based on their cb-view attribute
	 * 
	 * @param	rootView	View or Application class instance
	 * @param	namespace	The current namespace
	 * @param	attr		Attribute to search (default: 'view')
	 */
	applyViews: function(rootView, namespace, attr)
	{
		attr || (attr = 'view');
		
		var scope = this;
		
		rootView.$el.find('[cb-'+attr+']').not('.cb-'+attr).each(function(index, el)
		{
			var className = $(el).cbAttrs()[attr],
				classReference;
			
			if (classReference = scope.getClass(className, namespace))
			{
				new classReference({el:el, context:rootView.subcontext});
			}
		});
		
		return this;
	},
	
	/**
	 * Bind the property of one EventDispatcher class instance (e.g. Hash or Model) to another
	 * 
	 * @param 	{conbo.EventDispatcher}	source						Class instance which extends conbo.EventDispatcher
	 * @param 	{String}			sourcePropertyName			Source property name
	 * @param 	{any}				destination					Object or class instance which extends conbo.EventDispatcher
	 * @param 	{String}			destinationPropertyName		Optional (default: sourcePropertyName)
	 * @param 	{Boolean}			twoWay						Optional (default: false)
	 * 
	 * @returns	{this}
	 */
	bindProperty: function(source, sourcePropertyName, destination, destinationPropertyName, twoWay)
	{
		if (!(source instanceof conbo.EventDispatcher))
		{
			throw new Error(sourcePropertyName+' source is not EventDispatcher');
		}
		
		var scope = this;
		
		destinationPropertyName || (destinationPropertyName = sourcePropertyName);
		
		source.addEventListener('change:'+sourcePropertyName, function(event)
		{
			if (!(destination instanceof conbo.EventDispatcher))
			{
				destination[destinationPropertyName] = event.value;
				return;
			}
			
			scope.__set.call(destination, destinationPropertyName, event.value);
		});
		
		if (twoWay && destination instanceof conbo.EventDispatcher)
		{
			this.bindProperty(destination, destinationPropertyName, source, sourcePropertyName);
		}
		
		return this;
	},
	
	/**
	 * Call a setter function when the specified property of a EventDispatcher 
	 * class instance (e.g. Hash or Model) is changed
	 * 
	 * @param 	{conbo.EventDispatcher}	source				Class instance which extends conbo.EventDispatcher
	 * @param 	{String}			propertyName
	 * @param 	{Function}			setterFunction
	 */
	bindSetter: function(source, propertyName, setterFunction)
	{
		if (!(source instanceof conbo.EventDispatcher))
		{
			throw new Error('Source is not EventDispatcher');
		}
		
		if (!conbo.isFunction(setterFunction))
		{
			if (!setterFunction || !(propertyName in setterFunction))
			{
				throw new Error('Invalid setter function');
			}
			
			setterFunction = setterFunction[propertyName];
		}
		
		source.addEventListener('change:'+propertyName, function(event)
		{
			setterFunction(event.value);
		});
		
		return this;
	},
	
	/**
	 * Default parse function
	 * 
	 * @param	value
	 * @returns	{any}
	 */
	defaultParseFunction: function(value)
	{
		return typeof(value) == 'undefined' ? '' : value;
	},
	
	/**
	 * Remove everything except alphanumberic, dots and underscores from Strings
	 * 
	 * @private
	 * @param 		{String}	view		String value to clean
	 * @returns		{String}
	 */
	cleanPropertyName: function(value)
	{
		return (value || '').replace(/[^\w\._]/g, '');
	},
	
	/**
	 * Attempt to convert string into a conbo.Class in the specified namespace
	 * 
	 * @param 		name
	 * @returns		Class
	 */
	getClass: function(className, namespace)
	{
		if (!className) return;
		
		try
		{
			var viewClass = !!namespace
				? namespace[className]
				: eval(className);
			
			if (conbo.isClass(viewClass)) 
			{
				return viewClass;
			}
		}
		catch (e)
		{
			conbo.warn(className+' does not exist!');
		}
	},
	
	toString: function()
	{
		return 'conbo.BindingUtils';
	},
	
	/**
	 * Set the value of one or more property and dispatch a change:[propertyName] event
	 * 
	 * Event handlers, in line with conbo.Model change:[propertyName] handlers, 
	 * should be in the format handler(source, value) {...}
	 * 
	 * @param 	attribute
	 * @param 	value
	 * @param 	options
	 * @example	BindingUtils.__set.call(target, 'n', 123);
	 * @example	BindingUtils.__set.call(target, {n:123, s:'abc'});
	 * @returns	this
	 */
	__set: function(propName, value)
	{
		if (this[propName] === value)
		{
			return this;
		}
		
		this[propName] = value;
		
		// We're assuming accessors will dispatch their own change events
		if (!conbo.isAccessor(this, propName))
		{
			_dispatchChange(this, propName);
		}
		
		return this;
	},
	
	/**
	 * Reserved attributes
	 * @private
	 */
	__reservedAttributes: ['app', 'view', 'glimpse', 'content'],
	
	/**
	 * Is the specified attribute reserved for another purpose?
	 * 
	 * @private
	 * @param 		{String}	value
	 * @returns		{Boolean}
	 */
	__isReservedAttribute: function(value)
	{
		return this.__reservedAttributes.indexOf(value) != -1;
	},
	
	/**
	 * Split JSON-ish attribute values into usable chunks
	 * @private
	 * @param value
	 */
	__splitAttribute: function(attribute, value)
	{
		if (!conbo.isString(value))
		{
			return;
		}
		
		var a = value.split(','),
			o = {},
			i;
		
		var c = this.__attrBindings.canHandleMultiple(attribute)
			? a.length
			: 1;
		
		for (i=0; i<c; ++i)
		{
			s = a[i].split(':');
			o[s[0]] = s[1];
		}
		
		return o;
	},
	
});
