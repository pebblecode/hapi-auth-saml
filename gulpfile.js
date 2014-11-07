var gulp = require('gulp');
var jshint = require('gulp-jshint');

var paths = {
  src: [
    "lib/*.js"
  ],
  examples: [
    "examples/*.js"
  ]
};

paths.allJS = paths.src.concat(paths.examples);

gulp.task('lint', function() {
  return gulp.src(paths.allJS)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('watch', ['lint'], function(done) {
  gulp.watch(paths.allJS, [
    'lint'
  ]);
});

gulp.task('default', ['watch']);