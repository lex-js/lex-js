module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    // Project configuration.
    grunt.initConfig({
        babel: {
            options: {
                sourceMap: true,
                presets: ['es2015']
            },
            libs: {
                files: {
                    'tmp/mousetrap.min.js':'lib/mousetrap.min.js',
                    'tmp/mousetrap-global-bind.min.js':'lib/mousetrap-global-bind.min.js',
                    'tmp/cp866.js':'lib/cp866.js',
                    'tmp/fastclick.js':'lib/fastclick.js',
                    'tmp/fileSaver.min.js':'lib/fileSaver.min.js',
                    'tmp/func.js': 'src/func.js',
                    'tmp/config-default.js': 'src/config-default.js',
                    'tmp/lex.js': 'src/lex.js',
                    'tmp/gui.js': 'src/gui.js',
                    'tmp/fonts.js': 'fonts/fonts.js',
                }
            },
        },
        concat: {
            dist: {
                src: [
                    'tmp/mousetrap.min.js',
                    'tmp/mousetrap-global-bind.min.js',
                    'tmp/cp866.js',
                    'tmp/fastclick.js',
                    'tmp/fileSaver.min.js',
                    'tmp/func.js',
                    'tmp/config-default.js',
                    'tmp/lex.js',
                    'tmp/gui.js',
                    'tmp/fonts.js'],
                dest: 'tmp/bundle.js'
            },
            addlocalforage: {
                src: [
                    'lib/localforage.min.js',
                    'tmp/bundle.js'
                ],
                dest: 'tmp/bundle.js'
            }
        },
        uglify: {
            default: {
                files: {
                    'public/bundle.min.js': ['tmp/bundle.js']
                }
            }
        },
        clean: {
            tmp: ['tmp/']
        },
    });
    grunt.registerTask('default', ['babel', 'concat:dist', 'concat:addlocalforage', 'uglify:default', 'clean:tmp']);
};
