
	var gulp = require('gulp');
	var livereload = require('gulp-livereload');
	var concat = require('gulp-concat');
  var sass = require('gulp-sass');
	var autoprefixer = require('gulp-autoprefixer');
	var rename = require('gulp-rename');

	/* ------------------------------------------------------------------------------------------
	   SONANDCALM
	*/

	/* styles */

	gulp.task('compile_scss', function() {

		return gulp.src('./src/scss/main.scss')
				   .pipe(sass().on('error', sass.logError))
				   .pipe(autoprefixer())
				   .pipe(rename('style.css'))
				   .pipe(gulp.dest('./src/'));
	});

	gulp.task('compile_sonandcalm', ['compile_scss'], function() {

		gulp.src([
			'../bower_components/kendo-ui/styles/kendo.common.min.css',
			'../bower_components/kendo-ui/styles/kendo.metro.min.css',
			'../bower_components/kendo-ui/styles/kendo.metro.mobile.min.css',
			'./src/style.css'
		])
		.pipe(concat('utils.css'))
		.pipe(gulp.dest('./dist/'));		

		gulp.src([
			'../bower_components/kendo-ui/js/jquery.min.js'
		])
		.pipe(gulp.dest('./dist/'));

		gulp.src([
			'../bower_components/kendo-ui/js/angular.min.js',
			'../bower_components/kendo-ui/js/kendo.all.min.js',
			'../bower_components/jszip/dist/jszip.min.js',

			'./src/module.js',

			'./src/service/datasource-categories.js',
			'./src/service/datasource-products.js',
			'./src/service/datasource-images.js',			
			'./src/service/excel-to-web.js',
			'./src/service/notifications.js',
			'./src/service/utils.js',

			'./src/directive/utils.js',
			'./src/directive/dialog.js',
			'./src/directive/excel.js',
			'./src/directive/products.js',
			'./src/directive/categories.js',
			'./src/directive/images.js',

			'./src/app.js'
		])
		.pipe(concat('utils.js'))
		.pipe(gulp.dest('./dist/'));

		gulp.src([
			'../bower_components/kendo-ui/styles/images/kendoui.woff'
		])
		.pipe(gulp.dest('./dist/images/'));

		gulp.src([
			'../bower_components/kendo-ui/styles/Metro/loading-image.gif',
			'../bower_components/kendo-ui/styles/Metro/loading.gif'
		])
		.pipe(gulp.dest('./dist/Metro/'));

		gulp.src([
			'../bower_components/kendo-ui/styles/fonts/glyphs/WebComponentsIcons.ttf',
			'../bower_components/kendo-ui/styles/fonts/glyphs/WebComponentsIcons.woff'
		])
		.pipe(gulp.dest('./dist/fonts/glyphs/'));

		// return;
		return setTimeout(livereload.reload, 800);
	});	

	gulp.task('update_sonandcalm', ['compile_sonandcalm'], function() {	

		gulp.src('../bower_components/kendo-ui/styles/images/kendoui.woff')
		.pipe(gulp.dest('P:/sonandcalm/www.sonandcalm.com/wp-content/plugins/poeticsoft-utils/images/'));

		gulp.src([
			'../bower_components/kendo-ui/styles/Metro/loading-image.gif',
			'../bower_components/kendo-ui/styles/Metro/loading.gif'
		])
		.pipe(gulp.dest('P:/sonandcalm/www.sonandcalm.com/wp-content/plugins/poeticsoft-utils/Metro/'));

		gulp.src([
			'../bower_components/kendo-ui/styles/fonts/glyphs/WebComponentsIcons.ttf',
			'../bower_components/kendo-ui/styles/fonts/glyphs/WebComponentsIcons.woff'
		])
		.pipe(gulp.dest('P:/sonandcalm/www.sonandcalm.com/wp-content/plugins/poeticsoft-utils/fonts/glyphs/'));

		gulp.src('./dist/utils.css')
		.pipe(gulp.dest('P:/sonandcalm/www.sonandcalm.com/wp-content/plugins/poeticsoft-utils/'));

		gulp.src('./dist/jquery.min.js')
		.pipe(gulp.dest('P:/sonandcalm/www.sonandcalm.com/wp-content/plugins/poeticsoft-utils/'));

		gulp.src('./dist/utils.js')
		.pipe(gulp.dest('P:/sonandcalm/www.sonandcalm.com/wp-content/plugins/poeticsoft-utils/'));

		gulp.src('./dist/index.html')
		.pipe(gulp.dest('P:/sonandcalm/www.sonandcalm.com/wp-content/plugins/poeticsoft-utils/'));

	  return setTimeout(livereload.reload, 1500);
	});

	gulp.task('watch', function () {

		livereload.listen();

		gulp.watch(
			['./src/**/*'], 
			// ['update_sonandcalm'], 
			['compile_sonandcalm']
		);
	});

	/* ------------------------------------------------------------------------------------------ */

	gulp.task('default', ['watch']);