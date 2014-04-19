'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

var shelljs = require('shelljs');


module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    // Define the configuration for all the tasks
    grunt.initConfig({

        // Project settings
        config: {
            // configurable paths
            app: require('./bower.json').appPath || 'app',
            dist: require('./bower.json').distPath || 'dist',
            services: 'app/scripts/services'
        },

        // Watches files for changes and runs tasks based on the changed files
        watch: {
            js: {
                files: ['{.tmp,<%= config.app %>}/scripts/{,*/}*.js'],
                tasks: ['newer:jshint:all'],
                options: {
                    livereload: true
                }
            },
            jsTest: {
                files: ['test/spec/{,*/}*.js'],
                tasks: ['newer:jshint:test', 'karma']
            },
            styles: {
                files: ['<%= config.app %>/styles/{,*/}*.css'],
                tasks: ['newer:copy:styles', 'autoprefixer']
            },
            gruntfile: {
                files: ['Gruntfile.js']
            },
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: [
                    '<%= config.app %>/{,*/}*.html',
                    '<%= config.app %>/modules/**/*.{js,html}',
                    '{.tmp,<%= config.app %>}/scripts/{,*/}*.js',
                    '<%= config.app %>/dev/*.xml',
                    '<%= config.app %>/bower_components/sp-angular//{,*/}*.{js,html,css}',
                    '<%= config.app %>/styles/css/main.css',
                    '<%= config.app %>/images/{,*/}*.{png,jpg,jpeg,gif,svg}'
                ]
            }
        },

        // The actual grunt server settings
        connect: {
            options: {
                port: 9000,
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: 'localhost',
                livereload: 35729
            },
            livereload: {
                options: {
                    open: true,
                    base: [
                        '.tmp',
                        '<%= config.app %>'
                    ]
                }
            },
            test: {
                options: {
                    port: 9001,
                    base: [
                        '.tmp',
                        'test',
                        '<%= config.app %>'
                    ]
                }
            },
            dist: {
                options: {
                    base: '<%= config.dist %>'
                }
            }
        },

        // Make sure code styles are up to par and there are no obvious mistakes
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: [
                'Gruntfile.js',
                '<%= config.app %>/scripts/{,*/}*.js'
            ],
            test: {
                options: {
                    jshintrc: 'test/.jshintrc'
                },
                src: ['test/spec/{,*/}*.js']
            }
        },

        // Empties folders to start fresh
        clean: {
            dist: {
                files: [
                    {
                        dot: true,
                        src: [
                            '.tmp',
                            '<%= config.dist %>/*',
                            '!<%= config.dist %>/.git*'
                        ]
                    }
                ]
            },
            server: '.tmp'
        },

        htmlmin: {
            dist: {
                options: {
                    //collapseWhitespace: true,
                    //collapseBooleanAttributes: true,
                    // removeAttributeQuotes: true,
                    // removeRedundantAttributes: true,
                    // useShortDoctype: true,
                    // removeEmptyAttributes: true,
                    //removeOptionalTags: true
                },
                files: [
                    {
                        expand: true,
                        cwd: '<%= config.dist %>',
                        src: [
                            '*.html',
                            'views/*.html',
                            'modules/**/*.html',
                            'scripts/directives/**/*.html'
                        ],
                        dest: '<%= config.dist %>'
                    }
                ]
            }
        },

        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: ['<%= config.services %>/*.js'],
                dest: '<%= config.dist %>/sp-angular.js'
            }
        },

        // Allow the use of non-minsafe AngularJS files. Automatically makes it
        // minsafe compatible so Uglify does not destroy the ng references
        ngmin: {
            dist: {
                files: [
                    {
//                        expand: true,
//                        cwd: '.tmp/concat/scripts',
                        src: '<%= config.dist %>/sp-angular.js',
                        dest: '<%= config.dist %>/sp-angular.js'
                    }
                ]
            }
        },

        // Copies remaining files to places other tasks can use
        copy: {
            dist: {
                files: [
//                    {
//                        expand: true,
//                        dot: true,
//                        cwd: '<%= config.app %>',
//                        dest: '<%= config.dist %>',
//                        src: [
//                            //HTML
//                            '*.html',
//                            'views/{,*/}*.html',
//                            'modules/**/*.html',
//                            'scripts/**/*.html',
//
//                            //PROJECT SPECIFIC RESOURCES
//                            '*.{ico,png,txt}',
//                            'images/{,*/}*.{png,jpg,gif}',
//
//                            //CK EDITOR
//                            'bower_components/ng-ckeditor/libs/ckeditor/*.{js,css}',
//                            'bower_components/ng-ckeditor/libs/ckeditor/plugins/**',
//                            'bower_components/ng-ckeditor/libs/ckeditor/skins/**',
//                            'bower_components/ng-ckeditor/libs/ckeditor/lang/en.js',
//
//                            //FONT AWESOME
//                            'bower_components/font-awesome/css/**',
//                            'bower_components/font-awesome/fonts/**',
//
//                            //ONE APP CORE
//                            '<%= config.app %>/modules/**/*.html',
//                            '<%= config.app %>/scripts/**/*.html'
//                        ]
//                    },
                    {
                        expand: true,
//                        cwd: '<%= config.app %>',
                        dest: '<%= config.dist %>',
                        src: [
                            '<%= config.dist %>*.js'
                        ]
                    }
                ]
            }
        },
        uglify: {
            js: {
                src: ['<%= config.dist %>/sp-angular.js'],
                dest: '<%= config.dist %>/sp-angular.min.js'
            }
        }
    });


    grunt.registerTask('serve', function (target) {
        if (target === 'dist') {
            return grunt.task.run(['build', 'connect:dist:keepalive']);
        }

        grunt.task.run([
            'clean:server',
            'concurrent:server',
            'autoprefixer',
            'connect:livereload',
            'watch'
        ]);
    });

    grunt.registerTask('server', function () {
        grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
        grunt.task.run(['serve']);
    });

    grunt.registerTask('test', [
        'clean:server',
        'concurrent:test',
        'autoprefixer',
        'connect:test',
        'karma'
    ]);

    grunt.registerTask('build', [
        'clean:dist',
        'concat',
        'ngmin',
        'uglify',
        'ngdoc'
    ]);
//    grunt.registerTask('build', [
//        'clean:dist',
////        'useminPrepare',
////        'concurrent:dist',
////        'autoprefixer',
//        'concat',
//        'ngmin',
////        'copy:dist',
////        'cdnify',
////        'cssmin',
//        'uglify'
////        'rev',
////        'usemin',
////        'htmlmin'
//    ]);

    grunt.registerTask('ngdoc', 'Create ngdocs.', function() {
        var dgeni = require('dgeni');
        var done = this.async();

//        dgeni('docs/docs.config.js')
        dgeni('docs/docs.config.js')
            .generateDocs()
            .then(done);
    });

//    grunt.registerTask('default', ['dgeni']);

//    grunt.registerTask('docs', 'create docs', function(){
//        var gruntProc = shelljs.exec('"node_modules/.bin/gulp" --gulpfile gulpfile.js');
//        if (gruntProc.code !== 0) {
//            throw new Error('doc generation failed');
//        }
//    });


    grunt.registerTask('doc', [
        'clean:docs',
        'ngdoc'
    ]);

    grunt.registerTask('default', [
        'newer:jshint',
        'test',
        'build'
    ]);


};