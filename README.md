# !Gulp-importify

[![NPM version][npm-image]][npm-url]

There is one problem with all css-preprocessors: if we want to use them, we have to create only one entry point and we have to import all styles there. Only in that case all css-preprocessors will work as expected: sourcemaps will be generated correctly, there will be verbose log in case of error and so on. But, what should we do, if we need to compile css from multiple sources and we would like to store variables in one file and use them in another? There is a small example (for scss):

```javascript
var scssFilesToConcat = [
    'vars.scss',
    'module.scss'
]

gulp.task('compile-css', function () {
    return gulp.src(scssFilesToConcat, { base: process.cwd() })
            .pipe(scss())
            .pipe(gulp.dest('.'));
});
```
```scss
// var.scss

$color: #c00;

// module.scss

.module {
    color: $color;
}
```

So, the previous code is not working, cause scss will compile each file separately. Gulp-importify fixes this problem.

Gulp-importify will process all files you passed to the gulp.src and create temp file in pipe with imports of that files. It creates something like that:

```scss
// temp.scss

@import 'vars.scss';
@import 'module.scss';
```

And everything will work: verbose error log, sourcemaps and so on.

Gulp-importify will import css files as its in case of using less, stylus or scss (sass), because these preprocessors can't import css-files. And sourcemaps (and error log), still be working.

## Usage

Let's try to fix the first example with gulp-importify:
```javascript
var importify = require('gulp-importify');
var scssFilesToConcat = [
    'vars.scss',
    'module.scss'
]

gulp.task('compile-css', function () {
    return gulp.src(scssFilesToConcat, { base: process.cwd() })
            .pipe(importify('main.scss', {
                cssPreproc: 'scss' 
            }))
            .pipe(scss())
            .pipe(gulp.dest('.'));
});
```

## Required params and available options:

### fileName (Required)

Type: `String`

The first argument, which has to be passed to the gulp-importify.

### cssPreproc

Type: `String`

Default: `scss`

The name of used css-preprocessor. The property of the second argument (object). `stylus` and `less` is supported too.

## Thanks

[Fractal command](http://wearefractal.com/) and their gulp-plugin [gulp-concat](https://github.com/wearefractal/gulp-concat#readme).


[npm-url]: https://npmjs.org/package/gulp-importify
[npm-image]: http://img.shields.io/npm/v/gulp-importify.svg
