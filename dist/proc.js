/*!
 * Proc.js
 * -------
 * Run proccesses by something
 * 
 * @version 0.0.0
 * @author mach3 <http://github.com/mach3>
 * @url http://github.com/mach3/proc.js
 * @license MIT License
 * @require jQurery.js
 */
(function($){

    /**
     * Chain
     * -----
     * Run processes synchronously
     */
    var Chain = function(){
        if(arguments.length){
            this.append.apply(this, arguments);
        }
    };

    $.extend(Chain.prototype, {

        states: [],
        state: -1,
        df: null,

        /**
         * Append process(es)
         * @param {... Function|Array} process
         * @returns {$.Chain}
         */
        append: function(){
            var my = this;
            $.each(Array.prototype.slice.call(arguments), function(i, arg){
            	switch($.type(arg)){
            		case "array": my.append.apply(my, arg); break;
            		case "function": my.states.push(arg); break;
            		default: break;
            	}
            });
            return this;
        },

        /**
         * Run process
         * @returns {$.Deferred}
         */
        process: function(){
            var r, func, my = this;
            func = this.states[++this.state];
            if($.type(func) === "function"){
                r = func.call(this);
                switch(true){
                    case r === false:
                        return this.df.reject();
                    case $.type(r) === "undefined" || r === true:
                        return this.process();
                    case r.type === "delay":
                        return setTimeout(function(){
                            my.process.call(my);
                        }, r.time);
                    case r.type === "deferred":
                        return r
                        .done($.proxy(this.process, this))
                        .fail(function(){
                            my.df.reject();
                        });
                    default: break;
                }
            }
            if(this.states.length === this.state){
                return this.df.resolve();
            }
        },

        /**
         * Start running processes
         * @returns {$.Deferred}
         */
        run: function(){
            this.reset();
            this.process();
            return this.df;
        },

        /**
         * Reset a state of process and deferred
         * @returns {$.Chain}
         */
        reset: function(){
            this.state = -1;
            this.df = new $.Deferred();
            return this;
        },

        /**
         * Return new deferred object
         * @return {$.Deferred}
         */
        deferred: function(){
            var df = $.Deferred();
            df.type = "deferred";
            return df;
        },

        /**
         * Have the process duration as time
         * @param {Integer} time
         * @returns {Object}
         */
        delay: function(time){
            return { type: "delay", time: time };
        }

    });

    $.Chain = Chain;

}(jQuery));
(function($){

    /**
     * Frames
     * ------
     * @class Run processes by time
     */
    var Frames = function(){
        this.init.apply(this, arguments);
    };

    $.extend(Frames.prototype, {

        /**
         * Defaults for options:
         * - {Integer} duration - Duration time for frames
         * - {Integer} interval - Interval time for checking
         */
        defaults: {
            duration: 0,
            interval: 10
        },

        options: null,
        states: null,
        _states: null,
        startTime: null,
        timer: null,
        working: false,
        df: null,

        /**
         * Initialize
         * @constructor
         * @param {Object} options
         */
        init: function(options){
            this.config(this.defaults);
            if(options){
                this.config(options);
            }
            this._states = [];
        },

        /**
         * Configure options
         * @param {Object} options
         * @returns {$.Frames}
         */
        config: function(options){
            if(! this.options){
                this.options = {};
            }
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
         * Append processes
         * - .append(time, callback); // Set a process
         * - .append(obj);  // Set a process as object
         * - .append([obj, obj, obj...]); // Set processes as array
         * @param {...Object|Integer|Array} process|time|proccesses
         * @param {Function} callback
         */
        append: function(){
            var args, my = this;
            args = Array.prototype.slice.call(arguments);
            switch(true){
                case $.type(args[0]) === "object":
                    this._states.push(args[0]);
                    return this;
                case $.type(args[0]) === "numer" && $.type(args[1]) === "function":
                    this._states.push({
                        time: args[0],
                        callback: args[1]
                    });
                    return this;
                case $.type(args[0]) === "array":
                    $.each(args[0], function(i, o){
                        my.append(o);
                    });
                    return this;
                default: break;
            }
            return this;
        },

        /**
         * Reset processes: sort by time, initialize processes, initialize deferred
         * @return {$.Frames}
         */
        reset: function(){
            this._states.sort(function(a, b){
                return b.time - a.time;
            });
            this.states = $.extend([], this._states);
            this.startTime = this.now();
            this.df = $.Deferred();
            return this;
        },

        /**
         * Start runninng processes
         */
        run: function(){
            this.reset();
            this.work(true);
            this.process();
            return this.df;
        },

        /**
         * Get current time as millisecond
         */
        now: function(){
            return (new Date).getTime();
        },

        /**
         * Get or set 'working' value as boolean
         * @param {Boolean} working
         */
        work: function(working){
        	switch($.type(working)){
        		case "undefined": return this.working;
        		case "boolean":
        			this.working = working;
        			return this.working;
        		default: break;
        	}
        },

        /**
         * Run a process
         */
        process: function(){
            var time, i, o, duration;

            if(! this.work()){
            	return;
            }

            time = this.now() - this.startTime;
            i = this.states.length;
            duration = this.get("duration");

            // If all processes done, or it expires to duration, resolve
            if((duration && duration <= time) || ! this.states.length){
                this.df.resolve();
                return;
            }

            // check each proccess
            // If it is the time, run it
            while(i--){
                o = this.states[i];
                if(o.time <= time){
                    if(false === o.callback(this)){
                        return this.df.reject();
                    }
                    this.states.pop();
                }
            }

            this.timer = setTimeout($.proxy(this.process, this), this.get("interval"));
        },

        /**
         * Stop running proccess and reject
         * @returns {$.Frames}
         */
        stop: function(){
        	clearTimeout(this.timer);
        	this.timer = null;
        	this.work(false);
        	this.df.reject();
            return this;
        }
    });

    $.Frames = Frames;

}(jQuery));
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
(function($){

    /**
     * Get instance of Chain|Frames|Scroll
     * @param {String} name
     * @param {Object} options
     * @returns {Chain|Frames|Scroll}
     */
    $.proc = function(name, options){
        options = options || {};
        switch(name){
            case "chain": return new $.Chain(options);
            case "frames": return new $.Frames(options);
            case "scroll": return new $.Scroll(options);
        }
    };

}(jQuery));