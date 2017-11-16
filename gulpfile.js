/*global require*/
"use strict";

const gulp = require('gulp'),
  jade = require('gulp-jade'),
  prefix = require('gulp-autoprefixer'),
  sass = require('gulp-sass'),
  babel = require('gulp-babel'),
  changed = require('gulp-changed'),
  browserSync = require('browser-sync'),
  concat = require('gulp-concat'),
  clean = require('gulp-clean'),
  uglify = require('gulp-uglify'),
  runSequence = require('gulp-run-sequence'),
  ngAnnotate = require('gulp-ng-annotate'),
  project = require("./package.json"),
  fs = require('fs');


const config = {
  src: "./src",
  build: "./build",
  dist: "./dist",
  bundleName: `${project.name}.${project.version}`,
  srcIndex: './src/index.jade',
  srcSASS: "./src/smooth-image.scss",
  srcTemplates: ['./src/**/*.jade'],
  srcJS: ['./src/**/*.js']
};

//Helpers
const replaceSrcWithBuild = file => file.replace(config.src, config.build);
const stripBuildDir = file => file.replace(config.build, '');
const stripDistDir = file => file.replace(config.dist, '');


// Compile jade files
gulp.task('templates', () => {
  return gulp.src(config.srcTemplates)
    .pipe(changed(config.build, {extension: '.html'}))
    .pipe(jade())
    .on('error', function (err) {
      console.log(err.message);
      this.emit('end');
    })
    .pipe(gulp.dest(config.build))
    .pipe(browserSync.stream({
      once: true
    }));
});


// Compile es6 js files
gulp.task('scripts', () => {
  return gulp.src(config.srcJS)
    .pipe(changed(config.build))
    .pipe(babel({
      presets: ['es2015']
    }))
    .on('error', function (err) {
      console.log(err.message, err.name, err.stack);
      this.emit('end');
    })
    .pipe(ngAnnotate())
    .pipe(gulp.dest(config.build))
    .pipe(browserSync.reload({
      stream: true
    }));
});


// Compile scss files and apply autoprefixer
gulp.task('styles', () => {
  return gulp.src(config.srcSASS)
    .pipe(sass({
      outputStyle: 'compressed'
    }))
    .on('error', sass.logError)
    .pipe(prefix(['last 15 versions', '> 1%', 'ie >= 11'], {
      cascade: true
    }))
    .pipe(gulp.dest(config.build))
    .pipe(browserSync.reload({
      stream: true
    }));
});


//Find all assets in app.build and include them in the index html file
gulp.task('generate-index', () => {
  return gulp.src(config.srcIndex)
    .pipe(jade())
    .pipe(gulp.dest(config.build))
    .pipe(browserSync.reload({
      stream: true
    }));
});


//Wait for build task, then launch the browser-sync Server
gulp.task('browser-sync', () => {
  browserSync({
    files: './build/**/*.*',
    server: {
      baseDir: config.build
    },
    port: 5000,
    notify: false
  });
});


//Clean build directory
gulp.task('clean-build', () => {
  return gulp.src(config.build, {read: false})
    .pipe(clean());
});


// Build task compile assets
gulp.task('build', (cb) => {
  runSequence('clean-build', ['styles', 'templates', 'scripts', 'generate-index'], cb);
});


//Watch for changes and rebuild
gulp.task('watch', () => {
  gulp.watch(config.srcSCSS, ['styles']);
  gulp.watch(config.srcTemplates, ['templates']);
  gulp.watch(config.srcJS, ['scripts']);
});

//Start server, browser sync, and watch files
gulp.task('default', (cb) => {
  runSequence( 'build', 'browser-sync', 'watch', cb);
});