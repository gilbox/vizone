var gulp            = require('gulp'),
    browserify      = require('browserify'),
    source          = require('vinyl-source-stream'),
    $               = require('gulp-load-plugins')();

gulp.task('build1', [], function () {

  // packaged without zone.js
  return browserify('./src/simflux-viz.js')
    .external('simflux')
    .external('zone.js')
    .external('zone')
    .bundle()
    .pipe(source('simflux-viz-build1.js'))
    .pipe(gulp.dest('./tmp'))
});

gulp.task('build', ['build1'], function () {

  // packaged with zone.js
  return gulp.src(['./src/zone-patch/simflux-zone-pre.js.part', './node_modules/zone.js/zone.js', './src/zone-patch/simflux-zone-post.js.part', './tmp/simflux-viz-build1.js'])
    .pipe($.concat('simflux-viz-bundle.js'))
    .pipe(gulp.dest('./dist'))
    .pipe(gulp.dest('./demo'));
});

gulp.task('build-devtool', ['build1'], function () {
  return browserify('./src/devtool/bridge.js')
    .external('simflux')
    .external('zone.js')
    .external('zone')
    .bundle()
    .pipe(source('bridge.js'))
    .pipe(gulp.dest('./devtool'))
});

gulp.task('watch', ['default'], function() {
  gulp.watch('./**/*', ['build', 'build-devtool']);
});

gulp.task('default', ['build', 'build-devtool']);
