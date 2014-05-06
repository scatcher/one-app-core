var mountFolder = function (connect, dir) {
    return connect.static(require('path').resolve(dir));
};
module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('default', ['uglify']);

    grunt.initConfig({
        uglify: {
            js: {
                src: ['jquery.SPServices.js'],
                dest: 'jquery.SPServices.min.js'
            }
        }
    });
};
