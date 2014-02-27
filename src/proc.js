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