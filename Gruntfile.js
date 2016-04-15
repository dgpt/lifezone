module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt); // npm install --save-dev load-grunt-tasks

    grunt.initConfig({
        babel: {
            options: {
                sourceMap: true,
                presets: ['es2015']
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['*.js'],
                    dest: 'public/babel/'
                }]
            },
            test: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['logic.js'],
                    dest: 'public/babel/'
                }]
            }
        },

        browserify: {
            'public/app.js': ['public/babel/*.js']
        },

        watch: {
            files: ['src/*.js'],
            tasks: ['build']
        },

        shell: {
            qunit: {
                command: '"node_modules/.bin/qunit" -c public/babel/logic.js -t test/tests.js',
            }
        }
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('build', ['babel', 'browserify']);
    grunt.registerTask('test', ['babel:test', 'shell:qunit']);
    grunt.registerTask('default', 'watch');
};
