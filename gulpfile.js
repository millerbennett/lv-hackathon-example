var gulp = require('gulp');
var sh = require('child_process').exec;

gulp.task('serve', function(cb) {
	sh('node server.js', function(err, stdout, stderr) {
		console.log(stdout);
		console.log(stderr);
		cb(err);
	});
});

gulp.task('default', ['serve']);