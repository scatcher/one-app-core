var gulp = require('gulp');
var dgeni = require('dgeni');

gulp.task('dgeni', function() {
    return dgeni('docs/docs.config.js')
        .generateDocs();
});

gulp.task('default', ['dgeni']);