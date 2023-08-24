const path = require("path")
const modConcat = require('module-concat');

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-file-append');
    grunt.loadNpmTasks('grunt-screeps');

    const config = require('./.screeps.json');
    const email = grunt.option('email') || config.email;
    const password = grunt.option('password') || config.password;
    const branch = grunt.option('branch') || config.branch;
    const ptr = grunt.option('ptr') ? true : config.ptr;
    const private_directory = grunt.option('private_directory') || config.private_directory;

	grunt.initConfig({
		screeps: {
			options: {
				email:    email,
				password: password,
				branch:   branch,
				ptr:      ptr,
			},
			dist:    {
				src: ['dist/*.js']
			}
		},

        clean: {
            'dist': ['dist']
        },

		copy: {
			screeps: {
                files: [{
                    expand:  true,
                    filter:  'isFile',
                    cwd:     'src/',
                    src:     '**',
                    dest:    'dist/',
                    rename: function (dest, src) {
                        return dest + src.replace(/[\/\\]/g,'_');
                    },
                }],
                options: {
                    process: function (content, srcPath) {
                        return content.replace(/require\('(.*)'\)/gm, function (match, importPath) {
                            const absolutePath = path.resolve(path.dirname(srcPath), importPath)
                            const absoluteImportPath = path.relative("src", absolutePath)
                            return `require("${absoluteImportPath.replace(/[\/\\]/g, "_")}")`
                        });
                    },
                },
			},
            private: {
				expand:  true,
				filter:  'isFile',
				cwd:     'dist/',
				src:     '**',
				dest:    private_directory,
			},
		},

        file_append: {
            versioning: {
                files: [
                    {
                    append: "\nglobal.SCRIPT_VERSION = "+ (new Date()).getTime() + "\n",
                    input: 'dist/version.js',
                    }
                ]
            }
        },
	});

    grunt.registerTask('mergeFiles', function () {
		let done = this.async();

		const outputDir = './dist/';
		const outputFile = 'main.js';
		grunt.file.mkdir(outputDir);
		modConcat('./src/main.js', outputDir + outputFile, null, function (err, stats) {
			if (err) {
				grunt.fail.fatal('Error while processing files: ' + err.message);
			} else {
				grunt.log.write(stats.files.length + ' were combined into ' + outputFile);
			}

			done();
		});
	});

	grunt.registerTask('default', ['clean', 'copy:screeps', 'file_append:versioning', 'screeps']);
    grunt.registerTask('private', ['clean', 'copy:screeps', 'file_append:versioning', 'copy:private']);
};
