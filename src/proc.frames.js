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