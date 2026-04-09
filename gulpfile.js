import gulp from "gulp";
import rename from "gulp-rename";
import sourcemaps from "gulp-sourcemaps";
import babel from "gulp-babel";
import terser from "gulp-terser";
import eslint from "gulp-eslint-new";
import cleanCSS from "gulp-clean-css";
import postcss from "gulp-postcss";
import cssnano from "cssnano";
import postcssNested from "postcss-nested";
import autoprefixer from "autoprefixer";
import postcssPresetEnv from "postcss-preset-env";

// Define source and destination paths
const paths = {
  scripts: "working-assets/js/**/*.js",
  css: "working-assets/css/**/*.css",
  destJS: "assets/",
  destCSS: "assets/",
};

// Lint JavaScript using ESLint
function lintJS() {
  return gulp.src([paths.scripts, "!working-assets/js/panzoom.js"]).pipe(eslint()).pipe(eslint.format()).pipe(eslint.failAfterError());
}

// Process JS files individually (preserve ES6 modules for dynamic import)
function processModules() {
  return gulp
    .src(paths.scripts)
    //.pipe(sourcemaps.init())
    .pipe(
      babel({
        presets: [["@babel/preset-env", { modules: false, targets: "Safari >= 13, iOS >= 13, > 0.5%, not dead" }]],
      }),
    )
    .on("error", function (err) {
      console.error(err.toString());
      this.emit("end");
    })
    .pipe(terser())
    .on("error", function (err) {
      console.error(err.toString());
      this.emit("end");
    })
    //.pipe(sourcemaps.write("."))
    .pipe(gulp.dest(paths.destJS));
}

// CSS processing with PostCSS plugins
function processCSS() {
  return gulp
    .src(paths.css)
    .pipe(postcss([postcssNested()]))
    .pipe(
      postcss([
        autoprefixer({ cascade: false }),
        postcssPresetEnv({
          stage: 2,
          browsers: ["Safari >= 13", "iOS >= 13", "> 0.5%", "not dead"],
        }),
        cssnano({
          preset: ["default", { calc: false }],
        }),
      ]),
    )
    .on("error", function (err) {
      console.error(err.toString());
      this.emit("end");
    })
    .pipe(cleanCSS())
    .on("error", function (err) {
      console.error(err.toString());
      this.emit("end");
    })
    .pipe(rename({ suffix: ".min" }))
    .pipe(gulp.dest(paths.destCSS));
}

// Watch files and re-run tasks on change
function watchFiles() {
  gulp.watch(paths.scripts, gulp.series(lintJS, processModules));
  gulp.watch(paths.css, processCSS);
}

// Build task
const build = gulp.parallel(gulp.series(lintJS, processModules), processCSS);

// Default task
export default gulp.series(build, watchFiles);
