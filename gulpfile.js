var gulp            = require('gulp'),
    browserify      = require('browserify'),
    source          = require('vinyl-source-stream'),
    $               = require('gulp-load-plugins')(),
    reactify = require('reactify');

function onError(e) {
  console.log("SASS Error>>", e);
}
gulp.task('devtool-sass', [], function() {
  return gulp.src('./src/devtool/css/panel.scss')
    .pipe($.plumber({ errorHandler: onError }))
    .pipe($.rubySass())
    .pipe(gulp.dest('./devtool/'));
});

gulp.task('build-simflux', [], function () {
  return browserify('./src/vizone/patches/simflux-viz.js')
    .external('simflux')
    .bundle()
    .pipe(source('simflux-viz-bundle.js'))
    .pipe(gulp.dest('./dist'))
    .pipe(gulp.dest('./demo-gauntlet'))
    .pipe(gulp.dest('./demo'));
});

gulp.task('build1', [], function () {

  // packaged without zone.js
  return browserify('./src/vizone/index.js')
    .external('simflux')
    .external('zone.js')
    .external('zone')
    .bundle()
    .pipe(source('vizone-build1.js'))
    .pipe(gulp.dest('./tmp'))
});

gulp.task('build', ['build1'], function () {

  // packaged with zone.js
  return gulp.src(['./src/zone-patch/zone-pre.js.part', './node_modules/zone.js/zone.js', './src/zone-patch/zone-post.js.part', './tmp/vizone-build1.js'])
    .pipe($.concat('vizone-bundle.js'))
    .pipe(gulp.dest('./dist'))
    .pipe(gulp.dest('./demo-gauntlet'))
    .pipe(gulp.dest('./demo'));
});

function browserifyDevtool(file) {
  var outFile = file.replace('.jsx', '.js').replace('./src/devtool/js/', './devtool/js/');
  return function () {
    return browserify()
      .transform(reactify, { harmony: true })
      .add(file)
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
  gulp.src(['./src/devtool/**/*', '!./src/devtool/**/*.scss'].concat(devtoolFilesDontCopy))
    .pipe(gulp.dest('./devtool'));
});

devtoolCompileTasks = devtoolFilesToCompile.map(function (file,i) {
  var taskName = 'devtool-compile'+i;
  gulp.task(taskName, browserifyDevtool(file));
  return taskName;
});

gulp.task('build-devtool', ['devtool-sass','devtool-copy'].concat(devtoolCompileTasks));

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

gulp.task('build-gauntlet', ['build', 'build-devtool'], function () {
  return browserify('./demo-gauntlet/src/app.jsx')
    .transform(reactify, { harmony: true })
    .bundle()
    .pipe(source('app.js'))
    .pipe(gulp.dest('./demo-gauntlet'))
});

gulp.task('watch', ['default'], function() {
  gulp.watch('./**/*', ['build', 'build-simflux', 'build-devtool']);
});

gulp.task('default', ['build', 'build-simflux', 'build-devtool']);
