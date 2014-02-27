
module.exports = function(grunt){

    var banner = grunt.template.process(
        grunt.file.read("src/banner.js"),
        {data: grunt.file.readJSON("package.json")}
    );

    var files = [
        "src/proc.chain.js",
        "src/proc.frames.js",
        "src/proc.scroll.js",
        "src/proc.js"
    ];

    grunt.initConfig({

        concat: {
            dist: {
                options: {banner: banner},
                files: {
                    "dist/proc.js": files
                }
            }
        },

        uglify: {
            dist: {
                options: {banner: banner},
                files: {
                    "dist/proc.min.js": files
                }
            }
        }

    });

    grunt.registerTask("default", ["concat:dist", "uglify:dist"])

    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");

};