'use strict'

const processors = [
  require('cssnano'),
]

const processorsFn = () => [
  require('cssnano'),
]

module.exports = (grunt) => {
  require('load-grunt-tasks')(grunt)
  require('@lodder/time-grunt')(grunt)

  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>',
      ],
      options: {
        jshintrc: '.jshintrc',
      },
    },

    clean: {
      tests: ['tmp'],
    },

    postcss: {
      defaults: {
        options: {
          processors,
        },
        src: 'test/fixtures/a.css',
        dest: 'tmp/defaults.css',
      },
      defaultsFn: {
        options: {
          processors: processorsFn,
        },
        src: 'test/fixtures/a.css',
        dest: 'tmp/defaultsFn.css',
      },
      mapInline: {
        options: {
          map: true,
          processors,
        },
        src: 'test/fixtures/a.css',
        dest: 'tmp/mapInline.css',
      },
      mapSeparate: {
        options: {
          map: {
            inline: false,
          },
          processors,
        },
        src: 'test/fixtures/a.css',
        dest: 'tmp/mapSeparate.css',
      },
      mapAnnotationPath: {
        options: {
          map: {
            inline: false,
            annotation: 'tmp/maps/',
          },
          processors,
        },
        src: 'test/fixtures/a.css',
        dest: 'tmp/mapAnnotationPath.css',
      },
      diff: {
        options: {
          diff: true,
          processors,
        },
        src: 'test/fixtures/a.css',
        dest: 'tmp/diff.css',
      },
      syntax: {
        options: {
          syntax: require('postcss-scss'),
          processors: [],
        },
        src: 'test/fixtures/a.scss',
        dest: 'tmp/syntax.scss',
      },
      doWriteDest: {
        options: {
          syntax: require('postcss-scss'),
          writeDest: true,
        },
        src: 'test/fixtures/a.scss',
        dest: 'tmp/doWriteDest.scss',
      },
      noWriteDest: {
        options: {
          syntax: require('postcss-scss'),
          writeDest: false,
        },
        src: 'test/fixtures/a.scss',
        dest: 'tmp/noWriteDest.scss',
      },
      sequential: {
        options: {
          syntax: require('postcss-scss'),
          sequential: true,
        },
        src: ['test/fixtures/a.scss', 'test/fixtures/a.css'],
        dest: 'tmp/sequential.css',
      },
    },

    nodeunit: {
      tests: ['test/test.js'],
    },
  })

  grunt.loadTasks('tasks')

  grunt.registerTask('test', ['clean', 'postcss', 'nodeunit'])
  grunt.registerTask('default', ['jshint', 'test'])
}
