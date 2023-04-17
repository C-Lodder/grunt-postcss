'use strict'

const path = require('path')
const postcss = require('postcss')
const diff = require('diff')
const maxmin = require('maxmin')
const picocolors = require('picocolors')

module.exports = (grunt) => {
  let options
  let processor
  let tasks

  /**
   * Returns an input map contents if a custom map path was specified
   * @param {string} from Input CSS path
   * @returns {?string}
   */
  function getPrevMap(from) {
    if (typeof options.map.prev === 'string') {
      const mapPath = `${options.map.prev + path.basename(from)}.map`

      if (grunt.file.exists(mapPath)) {
        return grunt.file.read(mapPath)
      }
    }
  }

  /**
   * @param {string} to Output CSS path
   * @returns {string}
   */
  function getSourcemapPath(to) {
    return `${path.join(options.map.annotation, path.basename(to))}.map`
  }

  /**
   * @param {string} to Output CSS path
   * @returns {boolean|string}
   */
  function getAnnotation(to) {
    let annotation = true

    if (typeof options.map.annotation === 'boolean') {
      annotation = options.map.annotation
    }

    if (typeof options.map.annotation === 'string') {
      annotation = path.relative(path.dirname(to), getSourcemapPath(to)).replace(/\\/g, '/')
    }

    return annotation
  }

  /**
   * @param {string} input Input CSS contents
   * @param {string} from Input CSS path
   * @param {string} to Output CSS path
   * @returns {LazyResult}
   */
  function process(input, from, to) {
    const map = typeof options.map === 'boolean' ?
      options.map : {
        prev: getPrevMap(from),
        inline: typeof options.map.inline === 'boolean' ? options.map.inline : true,
        annotation: getAnnotation(to),
        sourcesContent: typeof options.map.sourcesContent === 'boolean' ? options.map.sourcesContent : true,
        absolute: typeof options.map.absolute === 'boolean' ? options.map.absolute : false,
      }

    return processor.process(input, {
      map,
      from,
      to,
      parser: options.parser,
      stringifier: options.stringifier,
      syntax: options.syntax,
    })
  }

  /**
   * Runs tasks sequentially
   * @returns {Promise}
   */
  function runSequence() {
    if (tasks.length === 0) {
      return Promise.resolve()
    }

    let currentTask = tasks.shift()

    return process(currentTask.input, currentTask.from, currentTask.to).then((result) => {
      currentTask.cb(result)
      currentTask = null
      return runSequence()
    })
  }

  /**
   * Creates a task to be processed
   * @param {string} input
   * @param {string} from
   * @param {string} to
   * @param {Function} cb
   * @returns {Promise|Object}
   */
  function createTask(input, from, to, cb) {
    return options.sequential ? {
      input,
      from,
      to,
      cb,
    } :
      process(input, from, to).then(cb)
  }

  /**
   * Runs prepared tasks
   * @returns {Promise}
   */
  function runTasks() {
    return options.sequential ? runSequence() : Promise.all(tasks)
  }

  grunt.registerMultiTask('postcss', 'Process CSS files.', function() {
    options = this.options({
      processors: [],
      map: false,
      diff: false,
      safe: false,
      failOnError: false,
      writeDest: true,
      sequential: false,
    })
    const tally = {
      sheets: 0,
      maps: 0,
      diffs: 0,
      issues: 0,
      sizeBefore: 0,
      sizeAfter: 0,
    }
    const done = this.async()
    tasks = []

    processor = typeof options.processors === 'function' ?
      postcss(options.processors.call()) :
      postcss(options.processors)

    for (const f of this.files) {
      const src = f.src.filter((filepath) => {
        if (!grunt.file.exists(filepath)) {
          grunt.log.error(`Source file ${picocolors.cyan(filepath)} not found.`)

          return false
        }

        return true
      })

      if (src.length === 0) {
        grunt.log.error(picocolors.red('No source files were found.'))

        done()
        continue
      }

      Array.prototype.push.apply(tasks, src.map((filepath) => {
        const dest = f.dest || filepath
        const input = grunt.file.read(filepath)
        tally.sizeBefore += input.length

        return createTask(input, filepath, dest, (result) => {
          const warnings = result.warnings()

          tally.issues += warnings.length

          for (const msg of warnings) {
            grunt.log.error(picocolors.red(msg.toString()))
          }

          if (options.writeDest) {
            tally.sizeAfter += result.css.length
            grunt.file.write(dest, result.css)
            grunt.log.ok(`File ${picocolors.cyan(dest)} created. ${picocolors.green(maxmin(input.length, result.css.length))}`)
          }

          tally.sheets += 1

          if (result.map) {
            let mapDest = `${dest}.map`

            if (typeof options.map.annotation === 'string') {
              mapDest = getSourcemapPath(dest)
            }

            grunt.file.write(mapDest, result.map.toString())
            grunt.log.ok(`File ${picocolors.cyan(`${dest}.map`)} created (source map).`)

            tally.maps += 1
          }

          if (options.diff) {
            const diffPath = typeof options.diff === 'string' ? options.diff : `${dest}.diff`

            grunt.file.write(diffPath, diff.createPatch(dest, input, result.css))
            grunt.log.ok(`File ${picocolors.cyan(diffPath)} created (diff).`)

            tally.diffs += 1
          }
        })
      }))
    }

    runTasks().then(() => {
      if (tally.sheets) {
        if (options.writeDest) {
          const size = maxmin(tally.sizeBefore, tally.sizeAfter)
          grunt.log.ok(`${tally.sheets} processed ${grunt.util.pluralize(tally.sheets, 'stylesheet/stylesheets')} created. ${picocolors.green(size)}`)
        } else {
          grunt.log.write(`${tally.sheets} ${grunt.util.pluralize(tally.sheets, 'stylesheet/stylesheets')} processed, no files written.`)
        }
      }

      if (tally.maps) {
        grunt.log.ok(`${tally.maps} ${grunt.util.pluralize(tally.maps, 'sourcemap/sourcemaps')} created.`)
      }

      if (tally.diffs) {
        grunt.log.ok(`${tally.diffs} ${grunt.util.pluralize(tally.diffs, 'diff/diffs')} created.`)
      }

      if (tally.issues) {
        grunt.log.error(`${tally.issues} ${grunt.util.pluralize(tally.issues, 'issue/issues')} found.`)

        if (options.failOnError) {
          return done(false)
        }
      }

      done()
    }).catch((error) => {
      if (options.onError !== undefined && typeof options.onError === 'function') {
        options.onError(error)
      }

      if (error.name === 'CssSyntaxError') {
        grunt.fail.fatal(error.message + error.showSourceCode())
      } else {
        grunt.fail.fatal(error)
      }

      done(error)
    })
  })
}
