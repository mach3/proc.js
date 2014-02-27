(function($){

    /**
     * Scroll
     * ------
     * Run process by scroll position
     */
    var Scroll = function(){
        this.init.apply(this, arguments);
    };

    $.extend(Scroll.prototype, {

        // Event for state change
        EVENT_STATE: "state",

        /**
         * Defaults for options
         * - {Boolean} useAnimationFrame: Use requestAnimationFrame for interval
         */
        defaults: {
            useAnimationFrame: true
        },

        /**
         * Defaults for state object
         * - {Integer} top - Offset top
         * - {Function} hover - Process to run when hovered
         * - {Function} down - Process to run when scroll down
         * - {Function} up - Process to run when scroll up on
         */
        stateDefaults: {
            top: 0,
            hover: null,
            down: null,
            up: null
        },

        win: $(window),
        options: null,
        states: [],
        running: false,
        scrollTop: 0,
        dispatcher: null,

        /**
         * Initialize
         * @param {Object} options
         */
        init: function(options){
            this.options = {};
            this.config(this.defaults);
            if(options){
                this.config(options);
            }
            this.dispatcher = $({});
            this.onFrame = $.proxy(this.onFrame, this);
            this.onScroll = $.proxy(this.onScroll, this);
        },

        /**
         * Configure options
         * @param {Object} options
         * @returns {Scroll}
         */
        config: function(options){
            $.extend(this.options, options);
            return this;
        },

        /**
         * Get value from options
         * @param {String} key
         * @returns {*}
         */
        get: function(key){
            return this.options[key];
        },

        /**
         * Add eventlistener
         * @alias this.dispatcher.on
         * @returns {Scroll}
         */
        on: function(){
            this.dispatcher.on.apply(this.dispatcher, arguments);
            return this;
        },

        /**
         * Remove eventlistener
         * @alias this.dispatcher.off
         * @returns {Scroll}
         */
        off: function(){
            this.dispatcher.off.apply(this.dispatcher, arguments);
            return this;
        },

        /**
         * Add process
         * - .append(obj); // set by object
         * - .append(obj, obj, obj); // set by objects
         * - .append([obj, obj, obj]); // set by array
         * @param {...Object|Array} process|processes
         * @returns {Scroll}
         */
        append: function(){
            var my = this;
            $.each(arguments, function(i, o){
                if($.type(o) === "array"){
                    my.append.apply(my, o);
                    return;
                }
                my.states.push($.extend({}, this.stateDefaults, o));
            });
            return this;
        },

        /**
         * Start running processes
         * @param {Boolean|Integer} scroll (true)
         * @returns {Scroll}
         */
        run: function(init){
            this.running = true;
            init = (init === undefined) ? true : init;
            switch($.type(init)){
                case "boolean": this.scrollTop = !! init ? this.win.scrollTop() : this.scrollTop; break;
                case "number": this.scrollTop = init; break;
            }
            if(this.get("useAnimationFrame") && ("requestAnimationFrame" in window)){
                this.onFrame();
            } else {
                this.win.on("scroll", this.onScroll);
                this.win.trigger("scroll");
            }
            return this;
        },

        /**
         * Stop runnninng processes
         * @returns {Scroll}
         */
        stop: function(){
            this.running = false;
            return this;
        },

        /**
         * Run process
         */
        process: function(top){
            var i, o, fire, fired, hover;

            fired = false;
            i = this.states.length;
            fire = function(obj, name){
                if($.type(obj[name]) !== "function"){
                    return;
                }
                if(false === obj[name]()){
                    obj[name] = null;
                }
                fired = true;
            };

            while(i--){
	            hover = false;
                o = this.states[i];
                if(o.top < this.scrollTop && o.top >= top){
                    fire(o, "up");
                    hover = true;
                }
                else if(o.top > this.scrollTop && o.top <= top){
                    fire(o, "down");
                    hover = true;
                }
                if(hover){
                    fire(o, "hover");
                }
            }

            if(fired){
                this.dispatcher.trigger(this.EVENT_STATE);
            }

            this.scrollTop = top;
        },

        /**
         * Run on requestAnmationFrame
         */
        onFrame: function(){
            if(! this.running){
                return;
            }
            this.process(this.win.scrollTop());
            window.requestAnimationFrame(this.onFrame);
        },

        /**
         * Run on scroll events
         */
        onScroll: function(){
            if(! this.running){
                this.win.off(this.onScroll);
            }
            this.process(this.win.scrollTop());
        }

    });

    $.Scroll = Scroll;


}(jQuery));