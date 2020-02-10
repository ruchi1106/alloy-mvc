var browserify = require('browserify');
var gulp = require("gulp");
var sass = require("gulp-sass");
var rename = require("gulp-rename");
var autoprefixer = require("gulp-autoprefixer");
var cssnano = require("gulp-cssnano");
var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');
var babelify = require('babelify');
var del = require('del');


// Default gulp task
gulp.task("default", [
    'main-css',
    'javascript',
    'editor-css',
    'editor-icons-css',
    'episerver-edit-css',
    'generate-service-worker',
    'move-stuff',
    'print-styles'
]);

// Main CSS => scss to css, minification and autoprefixer
gulp.task('main-css', function () {
    return gulp.src('./src/main.scss')
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.write())
        .pipe(autoprefixer('last 2 version'))
        .pipe(gulp.dest('dist'))
        .pipe(rename({suffix: '.min'}))
        .pipe(cssnano())
        .pipe(gulp.dest('dist'));
});

// Editor CSS => used in admin mode in EPiServer
gulp.task('editor-css', function () {
    return gulp.src('./src/editor.css')
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer('last 2 version'))
        .pipe(gulp.dest('dist/editor'));
});

// Icons for EPiServer UI dropdown => used in admin mode in EPiServer
gulp.task('editor-icons-css', function () {
    return gulp.src('./src/icons.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer('last 2 version'))
        .pipe(gulp.dest('../ClientResources/Styles'));
});

// Styles for edit mode (ie block preview)
gulp.task('episerver-edit-css', function () {
    return gulp.src('./src/block-preview.css')
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer('last 2 version'))
        .pipe(gulp.dest('dist/episerver'));
});

// Styles for print
gulp.task('print-styles', function () {
    return gulp.src('./src/print.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer('last 2 version'))
        .pipe(gulp.dest('dist'));
});

// JS => babel, minifying, sourcemaps
gulp.task('javascript', function () {
    return browserify({
        entries: ["./src/main.js"],
        debug: true
        })
        .transform(babelify, {
            presets: [["env", {
                "targets": {
                    "browsers": ["last 2 versions"]
                }
            }]]
        })
        .bundle()
        .pipe(source("bundle.js"))
        .pipe(buffer())
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .on('error', gutil.log)
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./dist'));
});

// Move master task (do not call move subtasks directly)
gulp.task('move-stuff', ['clean'], function() {
    gulp.start(['move-fonts', 'move-svgs', 'move-favicons']);
});

// Move fonts to dist in order to cache them with sw
gulp.task('move-fonts', function () {
    var fontsToMove = [
        './src/styles/fonts/*.{svg,ttf,woff,woff2,eot}'
    ];

    return gulp.src(fontsToMove)
        .pipe(gulp.dest('dist/fonts'));
});

// Move svgs used directly in css to dist in order to cache them with sw
gulp.task('move-svgs', function () {    
    var svgsToMove = [
        './src/styles/icons/*.svg'
    ];

    return gulp.src(svgsToMove)
        .pipe(gulp.dest('dist/img'));
});

// Move favico stuff
gulp.task('move-favicons', function () {
    var faviconsToMove = [
        './static/favicon/*'
    ];

    return gulp.src(faviconsToMove)
        .pipe(gulp.dest('dist/favicon'));
});

// clean static files
gulp.task('clean', function() {
    return del([
        'dist/fonts/*.{svg,ttf,woff,woff2}',
        'dist/img/*.svg',
        'dist/favicon/*'
    ]);
});

// Service Worker => generate with sw-precache
gulp.task('generate-service-worker', function (callback) {
    var swPrecache = require('sw-precache');
    var rootDir = '../';

    swPrecache.write(`${rootDir}/service-worker.js`, {
        staticFileGlobs: [
            rootDir + '/assets/dist/**/*.{js,html,css,png,jpg,gif,svg,eot,ttf,woff,woff2}'
        ],
        stripPrefix: rootDir,
        runtimeCaching: [
            { handler: 'fastest', urlPattern: /^https:\/\/fonts\.googleapis\.com/ },
            { handler: 'fastest', urlPattern: /^https:\/\/fonts\.gstatic\.com/ }
        ]
    }, callback);
});

gulp.task('watch', function() {
    gulp.watch('src/**/*.scss', ['main-css', 'print-styles']);
    gulp.watch('src/**/*.js', ['javascript']);
    gulp.watch('src/editor.css', ['editor-css']); 
});
