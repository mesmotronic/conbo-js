/**
 * observeDom example for ConboJS
 * @author	Neil Rackett
 */
conbo('ns', function()
{
	var ns = this;
	
	ns.MyApp = conbo.Application.extend
	({
		namespace: ns,
		template: '<p><b>Hello!</b></p><p>I was dynamically detected in the DOM :-)</p>',
	});
	
	/**
	 * ns.observeDom watches the DOM for new elements with a cb-app attribute 
	 * and automatically instantiates the appropriate Application instance
	 */
	ns.observeDom();
});

document.querySelector('#jsButton').addEventListener('click', function(event)
{
	var div = document.createElement('DIV');
	div.setAttribute('cb-app', 'MyApp');
	document.body.appendChild(div);
});
