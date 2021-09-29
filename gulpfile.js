"use strict"

const gulp = require("gulp")
const livereload = require("gulp-livereload")
const nodemon = require("nodemon")
const webpack = require("webpack-stream")

gulp.task("server", (cb) => {
  nodemon({
    script: "server.js",
  })
  cb()
})

gulp.task("webpack", () =>
  gulp
    .src("src/main.tsx")
    .pipe(webpack({ ...require("./webpack.config.js"), watch: true }))
    .pipe(livereload())
)

gulp.task("watch", () => {
  livereload.listen()
  gulp.parallel("webpack", "server")
})

exports.default = gulp.series("watch")
// gulp.parallel("webpack", "server")
