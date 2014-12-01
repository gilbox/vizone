var gulp            = require('gulp'),
    browserify      = require('browserify'),
    source          = require('vinyl-source-stream'),
    $               = require('gulp-load-plugins')(),
    reactify = require('reactify');

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

function browserifyDevtool(file) {
  var outFile = file.replace('.jsx', '.js');
  return function () {
    return browserify()
      .transform(reactify)
      .add('./src/devtool/'+file)
      .external('simflux')
      .external('zone.js')
      .external('zone')
      .bundle()
      .pipe(source(outFile))
      .pipe(gulp.dest('./devtool'))
  }
}

gulp.task('devtool-bridge', browserifyDevtool('bridge.js'));
gulp.task('devtool-panel', browserifyDevtool('panel.jsx'));
gulp.task('build-devtool', [
  'devtool-bridge',
  'devtool-panel'
]);

//gulp.task('build-devtool', [], function () {
//  return browserify('./src/devtool/bridge.js')
//    .external('simflux')
//    .external('zone.js')
//    .external('zone')
//    .bundle()
//    .pipe(source('bridge.js'))
//    .pipe(gulp.dest('./devtool'))
//});

//gulp.task('jsx', function () {
//  return gulp.src('./src/**/*.jsx')
//    .pipe($.react())
//    .pipe(gulp.dest('./src'));
//});

gulp.task('watch', ['default'], function() {
  gulp.watch('./**/*', ['build', 'build-devtool']);
});

gulp.task('default', ['build', 'build-devtool']);
