var importify = require('../');
var should = require('should');
var fs = require('fs');
var path = require('path');
var assert = require('stream-assert');
var test = require('./test-stream');
var File = require('gulp-util').File;
var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
require('mocha');

var fixtures = function (glob) { return path.join(__dirname, 'fixtures', glob); }

var thirdBase = __dirname,
    thirdFile = 'third.js',
    thirdPath = path.join(thirdBase, thirdFile);

describe('gulp-importify', function() {


  // Create a third fixture, so we'll know it has the latest modified stamp.
  // It must not live in the test/fixtures directory, otherwise the test
  // 'should take path from latest file' will be meaningless.
  before(function(done){
    fs.writeFile(thirdPath, 'console.log(\'third\');\n', done);
  });

  // We'll delete it when we're done.
  after(function(done){
    fs.unlink(thirdPath, done);
  });

  describe('improtify()', function() {
    it('should throw, when arguments is missing', function () {
      (function() {
        importify();
      }).should.throw('Missing file option for gulp-importify');
    });

    it('should ignore null files', function (done) {
      var stream = importify('test.js');
      stream
        .pipe(assert.length(0))
        .pipe(assert.end(done));
      stream.write(new File());
      stream.end();
    });

    it('should emit error on streamed file', function (done) {
      gulp.src(fixtures('*'), { buffer: false })
        .pipe(importify('test.js'))
        .on('error', function (err) {
          err.message.should.eql('Streaming not supported');
          done();
        });
    });

    it('should importify one file', function (done) {
      test('wadap')
        .pipe(importify('test.js'))
        .pipe(assert.length(1))
        .pipe(assert.first(function (d) { d.contents.toString().should.eql('wadap'); }))
        .pipe(assert.end(done));
    });

    it('should importify multiple files', function (done) {
      test('wadap', 'doe')
        .pipe(importify('test.js'))
        .pipe(assert.length(1))
        .pipe(assert.first(function (d) { d.contents.toString().should.eql('wadap\ndoe'); }))
        .pipe(assert.end(done));
    });

    it('should importify buffers', function (done) {
      test([65, 66], [67, 68], [69, 70])
        .pipe(importify('test.js'))
        .pipe(assert.length(1))
        .pipe(assert.first(function (d) { d.contents.toString().should.eql('AB\nCD\nEF'); }))
        .pipe(assert.end(done));
    });

    it('should preserve mode from files', function (done) {
      test('wadaup')
        .pipe(importify('test.js'))
        .pipe(assert.length(1))
        .pipe(assert.first(function (d) { d.stat.mode.should.eql(0666); }))
        .pipe(assert.end(done));
    });

    it('should take path from latest file', function (done) {
      gulp.src([fixtures('*'), thirdPath])
        .pipe(importify('test.js'))
        .pipe(assert.length(1))
        .pipe(assert.first(function (newFile) {
          var newFilePath = path.resolve(newFile.path);
          var expectedFilePath = path.resolve(path.join(thirdBase, 'test.js'));
          newFilePath.should.equal(expectedFilePath);
        }))
        .pipe(assert.end(done));
    });

    it('should preserve relative path from files', function (done) {
      test('wadap', 'doe')
        .pipe(importify('test.js'))
        .pipe(assert.length(1))
        .pipe(assert.first(function (d) { d.relative.should.eql('test.js'); }))
        .pipe(assert.end(done));
    });

    it('should support source maps', function (done) {
      gulp.src(fixtures('*'))
        .pipe(sourcemaps.init())
        .pipe(importify('all.js'))
        .pipe(assert.length(1))
        .pipe(assert.first(function (d) {
          d.sourceMap.sources.should.have.length(2);
          d.sourceMap.file.should.eql('all.js');
        }))
        .pipe(assert.end(done));
    });

    describe('should not fail if no files were input', function () {
      it('when argument is a string', function(done) {
        var stream = importify('test.js');
        stream.end();
        done();
      });

      it('when argument is an object', function(done) {
        var stream = importify({path: 'new.txt'});
        stream.end();
        done();
      });
    });

    describe('options', function () {
      it('should support newLine', function (done) {
        test('wadap', 'doe')
          .pipe(importify('test.js', {newLine: '\r\n'}))
          .pipe(assert.length(1))
          .pipe(assert.first(function (d) { d.contents.toString().should.eql('wadap\r\ndoe'); }))
          .pipe(assert.end(done));
      })

      it('should support empty newLine', function (done) {
        test('wadap', 'doe')
          .pipe(importify('test.js', {newLine: ''}))
          .pipe(assert.length(1))
          .pipe(assert.first(function (d) { d.contents.toString().should.eql('wadapdoe'); }))
          .pipe(assert.end(done));
      })
    });

    describe('with object as argument', function () {
      it('should throw without path', function () {
        (function() {
          importify({ path: undefined });
        }).should.throw('Missing path in file options for gulp-importify');
      });

      it('should create file based on path property', function (done) {
        test('wadap')
          .pipe(importify({path: 'new.txt'}))
          .pipe(assert.length(1))
          .pipe(assert.first(function (d) { d.path.should.eql('new.txt'); }))
          .pipe(assert.end(done));
      });

      it('should calculate relative path from cwd and path in arguments', function (done) {
        test('wadap')
          .pipe(importify({cwd: '/home/contra', path: '/home/contra/test/new.txt'}))
          .pipe(assert.length(1))
          .pipe(assert.first(function (d) { d.relative.should.eql('test/new.txt'); }))
          .pipe(assert.end(done));
      });
    });
  });
});

