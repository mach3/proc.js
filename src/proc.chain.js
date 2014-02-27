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