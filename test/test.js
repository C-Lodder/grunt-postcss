'use strict'

const { readFile, access } = require('fs').promises

/*
 ======== A Handy Little Nodeunit Reference ========
 https://github.com/caolan/nodeunit

 Test methods:
 test.expect(numAssertions)
 test.done()
 Test assertions:
 test.ok(value, [message])
 test.equal(actual, expected, [message])
 test.notEqual(actual, expected, [message])
 test.deepEqual(actual, expected, [message])
 test.notDeepEqual(actual, expected, [message])
 test.strictEqual(actual, expected, [message])
 test.notStrictEqual(actual, expected, [message])
 test.throws(block, [error], [message])
 test.doesNotThrow(block, [error], [message])
 test.ifError(value)
 */

const fileExists = async file => {
  try {
    await access(file)
    return true
  } catch {
    return false
  }
}

exports.gruntPostcss = {
  async defaults(test) {
    const actual = {
      css: await readFile('tmp/defaults.css', 'utf8'),
    }

    const expected = {
      css: await readFile('test/expected/defaults.css', 'utf8'),
    }

    test.strictEqual(actual.css, expected.css)

    const checkExists = await fileExists('tmp/defaults.css.map')
    test.ok(!checkExists)
    test.done()
  },

  async defaultsFn(test) {
    const actual = {
      css: await readFile('tmp/defaultsFn.css', 'utf8'),
    }

    const expected = {
      css: await readFile('test/expected/defaults.css', 'utf8'),
    }

    test.strictEqual(actual.css, expected.css)

    const checkExists = await fileExists('tmp/defaultsFn.css.map')
    test.ok(!checkExists)
    test.done()
  },

  async mapInline(test) {
    const actual = {
      css: await readFile('tmp/mapInline.css', 'utf8'),
    }

    const expected = {
      css: await readFile('test/expected/mapInline.css', 'utf8'),
    }

    test.strictEqual(actual.css, expected.css)

    const checkExists = await fileExists('tmp/mapInline.css.map')
    test.ok(!checkExists)
    test.done()
  },

  async mapSeparate(test) {
    const actual = {
      css: await readFile('tmp/mapSeparate.css', 'utf8'),
      map: await readFile('tmp/mapSeparate.css.map', 'utf8'),
    }

    const expected = {
      css: await readFile('test/expected/mapSeparate.css', 'utf8'),
      map: await readFile('test/expected/mapSeparate.css.map', 'utf8'),
    }

    test.strictEqual(actual.css, expected.css)
    test.strictEqual(actual.map, expected.map)
    test.done()
  },

  async mapAnnotationPath(test) {
    const actual = {
      css: await readFile('tmp/mapAnnotationPath.css', 'utf8'),
      map: await readFile('tmp/maps/mapAnnotationPath.css.map', 'utf8'),
    }

    const expected = {
      css: await readFile('test/expected/mapAnnotationPath.css', 'utf8'),
      map: await readFile('test/expected/maps/mapAnnotationPath.css.map', 'utf8'),
    }

    test.strictEqual(actual.css, expected.css)
    test.strictEqual(actual.map, expected.map)

    const checkExists = await fileExists('tmp/mapAnnotationPath.css.map')
    test.ok(!checkExists)
    test.done()
  },

  async diff(test) {
    const actual = {
      css: await readFile('tmp/diff.css', 'utf8'),
      map: await readFile('tmp/diff.css.diff', 'utf8'),
    }

    const expected = {
      css: await readFile('test/expected/diff.css', 'utf8'),
      map: await readFile('test/expected/diff.css.diff', 'utf8'),
    }

    test.strictEqual(actual.css, expected.css)
    test.strictEqual(actual.map, expected.map)
    test.done()
  },

  async syntax(test) {
    const actual = {
      scss: await readFile('tmp/syntax.scss', 'utf8'),
    }

    const expected = {
      scss: await readFile('test/expected/syntax.scss', 'utf8'),
    }

    test.strictEqual(actual.scss, expected.scss)
    test.done()
  },

  async writeDest(test) {
    const checkExists = await fileExists('tmp/doWriteDest.scss')
    test.ok(checkExists)

    const checkNoExists = await fileExists('tmp/noWriteDest.scss')
    test.ok(!checkNoExists)
    test.done()
  },

  async sequential(test) {
    const checkExists = await fileExists('tmp/sequential.css')
    test.ok(checkExists)

    const actual = await readFile('tmp/sequential.css', 'utf8')
    const expected = await readFile('test/fixtures/a.css', 'utf8')
    test.strictEqual(actual, expected)
    test.done()
  },
}
