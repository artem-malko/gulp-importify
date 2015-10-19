'use strict';

var through = require('through2');
var path = require('path');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var File = gutil.File;
var os = require('os');
var Concat = require('concat-with-sourcemaps');

// file can be a vinyl file object or a string
// when a string it will construct a new one
module.exports = function(file, options) {
    var isUsingSourceMaps = false;
    var latestFile;
    var latestMod;
    var fileName;
    var importified;
    var extension;

    if (!file) {
        throw new PluginError('gulp-importify', 'Missing file option for gulp-importify');
    }

    options = options || {
        cssPreproc: 'scss'
    };
    options.cssPreproc = options.cssPreproc.toLowerCase();

    if (typeof file === 'string') {
        fileName = file;
    } else if (typeof file.path === 'string') {
        fileName = path.basename(file.path);
    } else {
        throw new PluginError('gulp-importify', 'Missing path in file options for gulp-importify');
    }

    function bufferContents(file, enc, cb) {
         var pathToFile;

        // ignore empty files
        if (file.isNull()) {
            cb();
            return;
        }

        // we don't do streams (yet)
        if (file.isStream()) {
            this.emit('error', new PluginError('gulp-importify',  'Streaming not supported'));
            cb();
            return;
        }

        // enable sourcemap support for importified
        // if a sourcemap initialized file comes in
        if (file.sourceMap && isUsingSourceMaps === false) {
            isUsingSourceMaps = true;
        }

        // set latest file if not already set,
        // or if the current file was modified more recently.
        if (!latestMod || file.stat && file.stat.mtime > latestMod) {
            latestFile = file;
            latestMod = file.stat && file.stat.mtime;
        }

        // construct concat instance
        if (!importified) {
            importified = new Concat(isUsingSourceMaps, fileName, gutil.linefeed);
        }

        extension = path.parse(file.path).ext.substr(1);

        pathToFile = file.relative;

        if ((/^win/i).test(os.platform())) {
            pathToFile = file.relative.toString().replace(/\\/g, '/');
        }

        // add file or import of file to concat instance
        switch (options.cssPreproc) {
            case 'scss':
            case 'sass':
            case 'less':
                if (extension === 'css') {
                    importified.add(file.relative, file.contents, file.sourceMap);
                } else {
                    importified.add(file.relative, '@import "' + pathToFile + '";\n', file.sourceMap);
                }
                break;
            case 'stylus':
                importified.add(file.relative, '@import "' + pathToFile + '";\n', file.sourceMap);
                break;
            default:
                importified.add(file.relative, '@import "' + pathToFile + '";\n', file.sourceMap);
                break;
        }

        cb();
    }

    function endStream(cb) {
        var joinedFile;

        // no files passed in, no file goes out
        if (!latestFile || !importified) {
            cb();
            return;
        }

        // if file opt was a file path
        // clone everything from the latest file
        if (typeof file === 'string') {
            joinedFile = latestFile.clone({contents: false});
            joinedFile.path = path.join(latestFile.base, file);
        } else {
            joinedFile = new File(file);
        }

        joinedFile.contents = importified.content;

        if (importified.sourceMapping) {
            joinedFile.sourceMap = JSON.parse(importified.sourceMap);
        }

        this.push(joinedFile);
        cb();
    }

    return through.obj(bufferContents, endStream);
};
