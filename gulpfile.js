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
  var outFile = file.replace('.jsx', '.js').replace('./src/devtool/js/', './devtool/js/');
  return function () {
    return browserify()
      .transform(reactify, { harmony: true })
      .add(file)
      //.external('simflux')
      .external('zone.js')
      .external('zone')
      .bundle()
      .pipe(source(outFile))
      .pipe(gulp.dest('./'))
  }
}

var devtoolFilesToCompile = [
      './src/devtool/js/panel.jsx',
      './src/devtool/js/bridge.js'
    ],
    devtoolFilesDontCopy = devtoolFilesToCompile.map(function (f) {
      return '!'+f;
    }),
    devtoolCompileTasks = [];

gulp.task('devtool-copy', function () {
  gulp.src(['./src/devtool/**/*'].concat(devtoolFilesDontCopy))
    .pipe(gulp.dest('./devtool'));
});

devtoolCompileTasks = devtoolFilesToCompile.map(function (file,i) {
  var taskName = 'devtool-compile'+i;
  gulp.task(taskName, browserifyDevtool(file));
  return taskName;
});

gulp.task('build-devtool', ['devtool-copy'].concat(devtoolCompileTasks));

gulp.task('zip', ['build', 'build-devtool'], function() {
  var manifest = require('./src/devtool/manifest'),
    distFileName = manifest.name + ' v' + manifest.version + '.zip',
    mapFileName = manifest.name + ' v' + manifest.version + '-maps.zip';
  //collect all source maps
  //gulp.src('build/scripts/**/*.map')
  //  .pipe($.zip(mapFileName))
  //  .pipe(gulp.dest('dist'));
  //build distributable extension
  return gulp.src(['devtool/**', '!devtool/**/*.map'])
    .pipe($.zip(distFileName))
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', ['default'], function() {
  gulp.watch('./**/*', ['build', 'build-devtool']);
});

gulp.task('default', ['build', 'build-devtool']);
