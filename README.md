# Ajax Magic

## Purpose
The modern world of website development relies heavily on the use of Ajax to create more responsive and dynamic interfaces.  While some complex web applications may leverage large active client and widget libraries to achieve "smart" client functionality, for most content-geared solutions such libraries are an unnecessary performance hit -- akin to killing a mosquito with a sledgehammer.

Nevertheless, even in a simple interface, Ajax requests quickly become unwieldy.  Combinations of filters, paging, search boxes, and more require Ajax requests that interact with one another and with the front-end markup in complex ways that must be individually coded on the fly for each kind of request and set of parameters.  Things get rapidly worse when different types of requests (paging vs. filtering, for instance) require different sets of data and expect different markup in response.

Thus, active client functionality that ought to be simple becomes a mess of arbitrary code with basic code repeated in several places with only tiny modifications from one block of code to another.  This is not only poor program structure, but wastes development time on what should be a simple task.

This library aims to solve that problem.  It is a lightweight, powerful, and flexible library that automates the nuts-and-bolts of your Ajax functionality based on HTML classes and attributes alone (in other words, for almost any common Ajax solution you should not have to write a single line of code).

## Prerequisites
The only prerequisite for this library is jQuery 2.  Making the library compatible with jQuery 1.6+ requires only minor modifications (specifically, the event bindings should be changed to 1.6+ syntax, though this removes support for event namespacing and thus may be destructive to DOM events in some cases).  In theory, the library could be re-written to function independently of jQuery; however, since the jQuery library is ubiqitous this most likely will never be a critical feature.

## Overview
The class works on the theory that virtually every Ajax operation interacts with only four kinds of things, each of which can be manipulated and responded to in a generic, functionality-agnostic way (that is, AjaxMagic doesn't need to know what you need these elements for, it just needs to know which of these four things you want it to do with them).

### Value preservation
Some elements store a value that should persist across Ajax requests.  For instance, a filter dropdown should store the value of the filter somehow so that every time we request data, the server is informed of the current filter value.  We want to preserve that value even if the Ajax request has nothing to do with filtering, or else we'll lose our filter every time we do something with that page.  

By default, this type of element should receive a class of 'ajax-preserve', should have a 'name' attribute to give the POST value a name, and should have a 'value' attribute that contains the value we wish to POST back to the server.

### Ajax triggering
Other elements simply trigger an Ajax request.  Typically these elements also modify the Ajax payload in some fashion (for instance, items in a filter dropdown should modify the value of the associated filter).  

Therefore, an 'ajax-trigger' element will typically (but is not required to) have a 'name' and 'value' attribute, which will be used to modify the Ajax payload when that particular trigger is clicked.  Note that the 'value' on a named 'ajax-trigger' will override any same-named 'ajax-preserve' element.

### Ajax content
A typical Ajax request will return some HTML content that will be used to update the page.  However, we do not necessarily want to inject all of that content, and we may wish to update multiple areas of the page.

This type of element receives the class 'ajax-content' and a 'target' attribute which provides a jQuery selector that specifies which element on the page receives the content it contains.  Optionally, it can have an 'action' attribute that defines the method by which we insert the content (whether to append it to the target, replace the entire target with it, etc.).

### Ajax exclusion
The last type of element is a special case.  Suppose we have an 'ajax-content' element but we'd like to leave out just one contained element that is returned from the server by default.  We could exclude that element on the server side for Ajax requests, but there is also a far simpler way to do it: simply give it a class of 'ajax-exclude' and AjaxMagic will delete it from the returned HTML before doing anything else with the content.

## Usage
This library contains a single class (AjaxMagic) that is instantiated with one parameter, an options object.  The options parameter has two functions: (1) it allows the user to override the default options of the class, and (2) it can be used to override any function, method, or property of the class if custom functionality is desired.  The simplest instantiation is:

    window.ajax = new AjaxMagic();

That line of code will allow you to start building Ajax-enabled elements immediately with no further code required.

Every Ajax post to the server will include two additional parameters:

    namespace = [the AjaxMagic namespace]
    using_ajax = true

These additional parameters are useful for detecting an Ajax request server-side and determining what sort of request it is based on the namespace.

### Options
The options parameter to the class constructor takes several standard options, and can also take direct overrides of any of the methods, functions, or properties of the object prototype.  The standard options are:

#### options.namespace
##### default: 'ajax'
The default namespace for AjaxMagic is 'ajax'; thus we use the classes 'ajax-trigger', 'ajax-content', and so on; trigger events are namespaced as 'click.ajax'; elements will consume attributes with an optional 'ajax-' prefix (e.g., 'ajax-target'); and the POST payload to the server will include a parameter 'namespace' with a value of 'ajax'.

For various reasons (particularly in the case where two AjaxMagic instances exist client-side), we might change this namespace.  Let's say we do the following:

    window.pagination = new AjaxMagic({
        namespace: 'pagination'
    });

In this case, window.pagination will act (by default) on classes such as 'pagination-trigger', 'pagination-content', and so on; it will create 'click.pagination' events on triggers; it will consume 'pagination-[attr]' attributes; and the 'namespace' will POST as 'pagination'.  Note that an element could have *both* a 'pagination-preserve' and an 'ajax-preserve' class, say, if you wished it to preserve its value for both 'ajax' and 'pagination' POSTs.  This can be leveraged to wire up highly complex functionality, giving each element unique behavior depending on which AjaxMagic instance was triggered.

#### options.preserveClass, options.triggerClass, options.contentClass, options.excludeClass
These four options allow you to override the classes that define preserve, trigger, content, and so on.  Thus instead of 'ajax-trigger' you might want to use 'my-trigger-class', so you would set options.triggerClass = 'my-trigger-class'.

Keep in mind that it is possible to create elements that have more than one of these classes.  So, for instance, you might have an ajax-trigger element that is *also* an ajax-content element, in the (very common) case where you want the Ajax request to update or replace the same element that triggered it (or for that matter another trigger element on the page).

#### options.defaultAction
##### default: 'inject'
##### possible values: 'inject', 'replace', 'append', 'prepend', 'delete'
By default an 'ajax-content' element will inject its contents into the target, replacing the target's contents.  By setting an 'action' attribute on an 'ajax-content' element, you can instruct AjaxMagic to perform a different action on the element's contents; if there is no 'action' attribute set, the defaultAction will be used for any content elements.

#### options.simpleInjection
##### default: false
Use this to instruct AjaxMagic to use simple mode.  If this option is set, the target option is **required**.  In simple mode, all DOM content returned to the Ajax handler will be placed in options.target using the action specified in options.defaultAction.  All content classes and attributes will be ignored when AjaxMagic processes the returned data.

#### options.target
##### default: 'ajax-target'
The element to target when AjaxMagic is in simple mode.  If options.simpleInjection is **false** this option will be ignored.

#### options.beforePost, options.afterPost
These hooks, if set in options, will be called before and after AjaxMagic makes a POST request.  This allows for pre- and post-processing of the page's data.

#### options.customTransition
This hook allows for the use of custom transitions, animations, and any other custom actions to be performed when content is injected into the DOM after an Ajax request. If a custom transition function is defined, it will receive the following parameters:

$source: a jQuery object representing the DOM node that was returned to be injected into the DOM.

target: a jQuery selector string idenfying the target node

action: a string representing the thing that should be done with $source. Possible options:
    - "replace" means, replace target with $source entirely
    - "append" means, append $source to target
    - "prepend" means, prepend $source to target
    - "delete" means, just delete the target (don't do anything with $source)
    - the default action to take is to replace the contents of target with the contents of $source

The function you define should perform at least the action(s), out of the above options, that you plan to implement, and do so using whatever custom transitions you wish to apply. Without a customTransition function, those actions will be performed with no transition/animation.

### Classes and Attributes
Once the AjaxMagic instance is running on the page, you should not need to run any additional code to handle Ajax requests.  From that point on, all Ajaxification is handled through classes and attributes on elements that interact with the Ajax framework.

Note that all attributes *optionally* accept a prefix containing the AjaxMagic instance's namespace.  E.g., if the namespace is 'pagination', you may use either 'target' or 'pagination-target' attributes to specify the target of some Ajax content.  If both attributes exist, 'pagination-target' will override 'target'.  Since the default namespace is 'ajax', a non-namespaced AjaxMagic instance will check for, e.g., 'ajax-target' attributes before it checks for a 'target' attribute.

Additionally, attributes *optionally* accept a 'data-' prefix, which is, technically speaking, the HTML5 standard for non-standard attributes.  I say "technically speaking" because all modern browsers permit any attribute on HTML elements without breaking, so I don't generally consider this necessary. However, if you are one of those folks who just have to write HTML that validates, you may do so :)

The class attribute on a given element defines which attributes it will use to communicate with AjaxMagic.

#### Class: ajax-preserve, ajax-trigger
##### Attributes: name, value
The 'name' attribute on an ajax-preserve or ajax-trigger element is the name of a POST parameter; the 'value' is the desired value of that parameter.  If an ajax-preserve and ajax-trigger element share a 'name' attribute, the value of the ajax-trigger element will be used *if* that trigger was the actual element that triggered the Ajax request.  If not, the ajax-preserve value will be used.

#### Class: ajax-content
##### Attribute: target
This is a jQuery selector string that defines a target for the content.  Generally, this selector should only return a single element, though depending on the action, it may function with multiple targets.  However, it is not recommended to attempt to inject one content element into multiple parts of the page since results may be unpredictable.

##### Attribute: action
The action attribute specifies one of several standard actions to take with returned content.  Additional actions can be added in the injectContent method of the class, if desired.

###### Value: inject
An 'inject' action simply takes the entire contents of the content element and uses them to replace the entire contents of the target element.

###### Value: replace
A 'replace' action will delete the target element and insert the content element in its place.  This is similar to an inject action, with the difference that the containing tags will also be replaced.

###### Value: append
This will append the content element's contents to the target element.

###### Value: prepend
This will prepend the content element's contents to the target element.

###### Value: delete
In this special case the content element's contents are ignored.  Typically this action will be placed on an empty content element, as its purpose is to simply delete the target from the DOM, taking no further action.

### Class Methods
Generally speaking, there are only two methods you are likely to call directly on an AjaxMagic instance.

#### ajaxPost( $trigger, defaults )
This function instructs your AjaxMagic instance to make an Ajax post without waiting for a trigger element to be clicked.  This is useful when an Ajax post should be triggered by something other than a click, for instance when an element receives focus or when the user scrolls the screen to a new location.

The first parameter, **$trigger**, can be null; if provided, it should be a jQuery entity that modifies the Ajax payload based on its name and value attributes.  In this context, it does not have any purpose other than providing a POST parameter that will override any ajax-preserve element with the same name.

The second parameter, **defaults**, is a Javascript object whose properties are default POST parameters.  Any values given will be overridden by ajax-preserve elements and by the provided $trigger element.

When ajaxPost returns it will process the returned HTML exactly as if you had clicked an ajax-trigger.

#### activateAjax()
The AjaxMagic instance will normally call this function every time it processes a POST, to ensure that any replaced or injected trigger elements receive the necessary click events.  However, there may be cases in which trigger elements will not be properly updated; for instance, if an AjaxMagic instance creates a trigger element for another AjaxMagic instance in a different namespace, it will not wire up the click event on that element.  In that case, you would include code similar to the following in your class instantiation:

    // window.ajax periodically creates pagination-trigger controls, which should trigger window.pagination
    window.ajax = new AjaxMagic({
    	afterPost: function() {
    		// anytime we POST using this instance, we need to tell window.pagination
    		// to re-wire its triggers
    		pagination.activateAjax();
    	}
    });

    // window.pagination is the instance that "knows" how to wire up pagination-trigger controls
    window.pagination = new AjaxMagic({
    	namespace: 'pagination'
    });