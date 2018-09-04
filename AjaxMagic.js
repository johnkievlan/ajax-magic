// Ajax Magic!
(AjaxMagic = function( options ) {
    $.extend(this, options);

    /*
     this.namespace keeps events and classes distinct, if necessary; 
        default is 'ajax'
     this.preserveClass defines elements that persist POST values through Ajax requests; 
        default is 'ajax-preserve'
     this.triggerClass defines elements that trigger an Ajax POST; 
        default is 'ajax-trigger'
     this.contentClass defines elements that contain content to be injected into the page; 
        default is 'ajax-content'
     this.excludeClass defines elements that should *not* be injected into the page,
     even if they're inside an ajax-content element; 
        default is 'ajax-exclude'
     this.defaultAction is the default action to take with content, if none is specified;
        see injectContent() method.
     this.simpleInjection means, ignore contentClass and just inject everything we get back;
        action will be this.defaultAction
     this.defaultTarget only applies if simpleInjection is true; it's the target for injection;
        default is 'ajax-target'
    */

    // default options
    this.namespace = this.namespace || 'ajax';
    this.preserveClass = this.preserveClass || this.namespace+'-preserve';
    this.triggerClass = this.triggerClass || this.namespace+'-trigger';
    this.contentClass = this.contentClass || this.namespace+'-content';
    this.excludeClass = this.excludeClass || this.namespace+'-exclude';
    this.defaultAction = this.defaultAction || 'inject';
    this.simpleInjection = this.simpleInjection || false;
    this.target = this.target || this.namespace+'-target';

    // initialize class
    this.init();
}).prototype = {
    init: function() {
        this.activateAjax();
    }, 
    activateAjax: function() {
        var me = this;

        $('.'+this.triggerClass).off('click.'+this.namespace);

        // set up ajax triggers
        $('.'+this.triggerClass).on('click.'+this.namespace, function( e ) {
            // if the trigger has a default action (such as a clickable link), prevent it
            e.preventDefault();

            // do an ajax post
            me.ajaxPost( $(this) );
        });
    },
    ajaxPost: function( $trigger, defaults ) {
        if ( this.beforePost ){
            this.beforePost();
        }

        var me = this,
            options = {
            type: 'POST', cache: false, data: this.ajaxParams( $trigger, defaults ),
            success: function( data ) {
                $contents = $('<div>'); // make a jquery object out of the data
                $contents.html(data);

                // inject content, according to configuration
                if ( me.simpleInjection ){
                    $contents.attr('data-target', me.target);
                    $contents.attr('data-action', me.defaultAction);

                    me.injectContent( $contents );
                }else{
                    $contents.find('.'+me.contentClass).each(function() {
                        me.injectContent( $(this) );
                    });
                }

                // reactivate Ajax, in case ajax triggers were part of the injected content
                me.activateAjax();

                if ( me.afterPost ){
                    me.afterPost();
                }
            },error: function(){
                console.log('Ajax request failed!');
            }
        };

        // use a custom URL if provided
        if ( this.url ) options.url=this.url;

        $.ajax(options);
    },
    ajaxParams: function( $trigger, defaults ) {
        // default params
        var me=this,
            params = $.extend(defaults, {
            using_ajax: true,
            namespace: this.namespace
        });

        // ajax-preserve params
        $('.'+this.preserveClass).each(function() {
            // The values of form input controls cannot be reliably obtained through
            // .attr('value').  Instead, for these controls we use the jQuery val() function.
            fieldName = 
                $(this).attr(me.namespace + '-name') || 
                $(this).data(me.namespace + '-name') || 
                $(this).attr('name') || 
                $(this).data('name');

            if ( $(this).prop('tagName').toLowerCase() == 'input' ||
                 $(this).prop('tagName').toLowerCase() == 'select' ||
                 $(this).prop('tagName').toLowerCase() == 'textarea' ){
                fieldValue = $(this).val();
            }else{
                fieldValue = 
                    $(this).attr(me.namespace + '-value') || 
                    $(this).data(me.namespace + '-value') || 
                    $(this).attr('value') || 
                    $(this).data('value');
            }
            params[fieldName] = fieldValue;
        });

        // trigger param
        if ( $trigger && 
                ($trigger.attr('name') || 
                 $trigger.attr(me.namespace + '-name') || 
                 $trigger.data('name') || 
                 $trigger.data(me.namespace + '-name')) ){

            fieldName = 
                $trigger.attr(me.namespace + '-name') || 
                $trigger.data(me.namespace + '-name') || 
                $trigger.attr('name') || 
                $trigger.data('name');

            if ( $trigger.prop('tagName').toLowerCase() == 'input' ||
                 $trigger.prop('tagName').toLowerCase() == 'select' ||
                 $trigger.prop('tagName').toLowerCase() == 'textarea' ){
                fieldValue = $trigger.val();
            }else{
                fieldValue = 
                    $trigger.attr(me.namespace + '-value') || 
                    $trigger.data(me.namespace + '-value') || 
                    $trigger.attr('value') || 
                    $trigger.data('value');
            }
            params[fieldName] = fieldValue;
        }

        return params;
    },
    injectContent: function( $source ){
        // You might have accidentally used the excludeClass in non-Ajax elements,
        // so we're gonna remove the class to keep them from being destroyed even though 
        // you were sloppy.  But just to teach you a lesson, I'm not going to put it back afterwards.
        $('.'+this.excludeClass).removeClass(this.excludeClass);

        var target = 
            $source.attr(this.namespace+'-target') || 
            $source.data(this.namespace+'-target') || 
            $source.attr('target') || 
            $source.data('target');
        var action = 
            $source.attr(this.namespace+'-action') || 
            $source.data(this.namespace+'-action') || 
            $source.attr('action') || 
            $source.data('action') ||
            this.defaultAction;

        /* JDK@AM
            If a custom transition function is defined, it will receive the following parameters:

            $source: a jQuery object representing the DOM node that was returned to be injected
                into the DOM.

            target: a jQuery selector string idenfying the target node

            action: a string representing the thing that should be done with $source. Possible options:
                - "replace" means, replace target with $source entirely
                - "append" means, append $source to target
                - "prepend" means, prepend $source to target
                - "delete" means, just delete the target (don't do anything with $source)
                - the default action to take is to replace the contents of target with the contents of $source

            The function you define should perform at least the action(s), out of the above options,
            that you plan to implement, and do so using whatever custom transitions you wish to
            apply. Without a customTransition function, those actions will be performed with no
            transition/animation.
        */
        if ( this.customTransition && typeof this.customTransition == 'function' ){
            this.customTransition( $source, target, action );
        }else{
            switch ( action ){
                case 'replace':
                    $(target).replaceWith($source);
                    break;
                case 'append':
                    $(target).append($source.html());
                    break;
                case 'prepend':
                    $(target).prepend($source.html());
                    break;
                case 'delete':
                    $(target).remove();
                    break;
                default:
                    $(target).html($source.html());
                    break;
            }
        }

        // delete any excluded content
        $('.'+this.excludeClass).remove();
    }
};