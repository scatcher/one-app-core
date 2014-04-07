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
            dist: require('./bower.json').distPath || 'dist'
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
                    '<%= config.app %>/bower_components/one-app-core//{,*/}*.{js,html,css}',
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

//        ngdoc : {
//            options: {
//                html5Mode: false,
//                title: 'OneApp Core Documentation',
//                scripts: ['<%= config.app %>/scripts/services/*.js']
//            },
//            all: {
//                src: ['<%= config.app %>/scripts/services/*.js'],
//                title: 'Services'
//            }
//        },
//
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
            docs: '<%= config.dist %>/docs/*',
            server: '.tmp'
        },

        // Add vendor prefixed styles
        autoprefixer: {
            options: {
                browsers: ['last 1 version']
            },
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: '.tmp/styles/',
                        src: '{,*/}*.css',
                        dest: '.tmp/styles/'
                    }
                ]
            }
        },

        // Renames files for browser caching purposes
        rev: {
            dist: {
                files: {
                    src: [
                        '<%= config.dist %>/scripts/{,*/}*.js',
                        '<%= config.dist %>/styles/{,*/}*.css',
                        '<%= config.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
                        '<%= config.dist %>/styles/fonts/*'
                    ]
                }
            }
        },

        // Reads HTML for usemin blocks to enable smart builds that automatically
        // concat, minify and revision files. Creates configurations in memory so
        // additional tasks can operate on them
//        useminPrepare: {
//            html: '<%= config.app %>/index.html',
//            options: {
//                dest: '<%= config.dist %>'
//            }
//        },

        useminPrepare: {
            html: '<%= config.app %>/index.html',
            options: {
                dest: '<%= config.dist %>',
                flow: {
                    steps: {
                        'js': ['concat'],
                        'css': ['concat']
                    },
                    post: {}
                }
            }
        },

        // Performs rewrites based on rev and the useminPrepare configuration
        usemin: {
            html: [
                '<%= config.dist %>/{,*/}*.html',
                '<%= config.dist %>/scripts/**/*.html'
            ],
            css: ['<%= config.dist %>/styles/{,*/}*.css'],
            options: {
                assetsDirs: ['<%= config.dist %>']
            }
        },

        // The following *-min tasks produce minified files in the dist folder
        imagemin: {
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= config.app %>/images',
                        src: '{,*/}*.{png,jpg,jpeg,gif}',
                        dest: '<%= config.dist %>/images'
                    }
                ]
            }
        },
        svgmin: {
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= config.app %>/images',
                        src: '{,*/}*.svg',
                        dest: '<%= config.dist %>/images'
                    }
                ]
            }
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

        // Allow the use of non-minsafe AngularJS files. Automatically makes it
        // minsafe compatible so Uglify does not destroy the ng references
        ngmin: {
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: '.tmp/concat/scripts',
                        src: '*.js',
                        dest: '.tmp/concat/scripts'
                    }
                ]
            }
        },

        // Replace Google CDN references
        cdnify: {
            dist: {
                html: ['<%= config.dist %>/*.html']
            }
        },

        // Copies remaining files to places other tasks can use
        copy: {
            dist: {
                files: [
                    {
                        expand: true,
                        dot: true,
                        cwd: '<%= config.app %>',
                        dest: '<%= config.dist %>',
                        src: [
                            //HTML
                            '*.html',
                            'views/{,*/}*.html',
                            'modules/**/*.html',
                            'scripts/**/*.html',

                            //PROJECT SPECIFIC RESOURCES
                            '*.{ico,png,txt}',
                            'images/{,*/}*.{png,jpg,gif}',

                            //CK EDITOR
                            'bower_components/ng-ckeditor/libs/ckeditor/*.{js,css}',
                            'bower_components/ng-ckeditor/libs/ckeditor/plugins/**',
                            'bower_components/ng-ckeditor/libs/ckeditor/skins/**',
                            'bower_components/ng-ckeditor/libs/ckeditor/lang/en.js',

                            //FONT AWESOME
                            'bower_components/font-awesome/css/**',
                            'bower_components/font-awesome/fonts/**',

                            //ONE APP CORE
                            '<%= config.app %>/modules/**/*.html',
                            '<%= config.app %>/scripts/**/*.html'
                        ]
                    },
                    {
                        expand: true,
                        cwd: '.tmp/images',
                        dest: '<%= config.dist %>/images',
                        src: [
                            'generated/*'
                        ]
                    },
                    {
                        expand: true,
                        dest: '<%= config.dist %>/styles/images',
                        flatten: true,
                        src: ['<%= config.app %>/bower_components/jquery-ui-bootstrap/css/custom-theme/images/*.png']
                    }
                ]
            },
            styles: {
                expand: true,
                cwd: '<%= config.app %>/styles',
                dest: '.tmp/styles/',
                src: '{,*/}*.css'
            }
        },

        // Run some tasks in parallel to speed up the build process
        concurrent: {
            server: [
                'copy:styles'
            ],
            test: [
                'copy:styles'
            ],
            dist: [
                'copy:styles',
                'svgmin'
            ]
        },

        // By default, your `index.html`'s <!-- Usemin block --> will take care of
        // minification. These next options are pre-configured if you do not wish
        // to use the Usemin blocks.
        cssmin: {
            dist: {
                files: {
                    '<%= config.dist %>/styles/main.css': [
                        '.tmp/styles/{,*/}*.css',
                        '<%= config.app %>/styles/{,*/}*.css'
                    ]
                }
            }
        },
        uglify: {
            dist: {
                files: [
                    {
                        '<%= config.dist %>/scripts/vendor.js': [
                            '<%= config.dist %>/scripts/vendor.js'
                        ]
                    },
//                    {
//                        '<%= config.dist %>/scripts/scripts.js': [
//                            '<%= config.dist %>/scripts/scripts.js'
//                        ]
//                    },
                    {
                        '<%= config.dist %>/scripts/ie-shim.js': [
                            '<%= config.dist %>/scripts/ie-shim.js'
                        ]
                    }
                ]
            }
        },
//        concat: {
//            dist: {}
//        },

        // Test settings
        karma: {
            unit: {
                configFile: 'karma.conf.js',
                singleRun: true
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
        'useminPrepare',
        'concurrent:dist',
        'autoprefixer',
        'concat',
        'ngmin',
        'copy:dist',
//        'cdnify',
        'cssmin',
        'uglify',
//        'rev',
        'usemin',
        'htmlmin'
    ]);

    grunt.registerTask('ngdoc', 'Create ngdocs.', function() {
        var dgeni = require('dgeni');
        var done = this.async();

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