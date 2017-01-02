module.exports = function (grunt) {

    var webpack = require('webpack');

    grunt.initConfig({

        // ----- Environment
        // read in some metadata from project descriptor
        project: grunt.file.readJSON('package.json'),

        // ----- TypeScript compilation
        //  See https://npmjs.org/package/grunt-ts
        ts: {
            default: {
                tsconfig: true
            }
        },

        // https://www.npmjs.com/package/grunt-webpack
        webpack: {

            dist: {
                entry: "./target/web/statusci.js",
                output: {
                    filename: "./target/dist/statusci.js"
                },

                plugins: [
                    // new webpack.optimize.UglifyJsPlugin({
                    //     minimize: true
                    // })
                ]
            }
        },

        copy: {
            dist: {
                files: [
                    {expand: true, cwd: 'src/web', src: ['**.html','**.css','**.gif','**.png'], dest: 'target/dist'}
                ]
            }
        },

        mochaTest: {
            test: {
                src: ['target/**/*.spec.js']
            }
        },

        tslint: {
            options: {

                force: false // false: tslint errors will be reported, and the task will fail
            },
            files: {
                src: [
                    "src/**/*.ts",
                    "src/**/*.tsx"
                ]
            }
        }

    });


    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-webpack');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks("grunt-tslint");
    grunt.registerTask('default', ['ts', 'mochaTest', 'tslint', 'webpack:dist', 'copy:dist']);
};