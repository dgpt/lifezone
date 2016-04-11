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
            }
        },

        browserify: {
            'public/app.js': ['public/babel/*.js']
        },

        watch: {
            files: ['src/*.js'],
            tasks: ['build']
        }
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('build', ['babel', 'browserify']);
    grunt.registerTask('default', 'watch');
};
