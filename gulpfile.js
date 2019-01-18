
	var gulp = require('gulp');
	var livereload = require('gulp-livereload');
	var concat = require('gulp-concat');

	/* ------------------------------------------------------------------------------------------
	   FUCHS
	*/
	
	gulp.task('update_fuchs', ['compile_fuchs'], function() {

		gulp.src('./fuchs/dist/**/*')
		.pipe(gulp.dest('E:/playmotiv/web/www.playmotiv.net/fuchs/'));		

		setTimeout(livereload.reload, 500);
	});

	gulp.task('compile_fuchs', function() {

		// css

		gulp.src([
			'./bower_components/kendo-ui/styles/kendo.common.min.css',
			'./bower_components/kendo-ui/styles/kendo.metro.min.css',
			'./bower_components/kendo-ui/styles/kendo.metro.mobile.min.css',
			'./fuchs/src/grid.css',
			'./fuchs/src/editor.css'
		])
		.pipe(concat('fuchs.css'))
		.pipe(gulp.dest('./fuchs/dist/'));			

		// Javascript

		gulp.src([
			'./bower_components/kendo-ui/js/jquery.min.js',
			'./bower_components/kendo-ui/js/angular.min.js',
			'./bower_components/kendo-ui/js/kendo.all.min.js',
			'./fuchs/src/module.js',
			'./fuchs/src/service/data.js',
			'./fuchs/src/directive/blender-grid.js',
			'./fuchs/src/directive/blender-editor.js',
			'./fuchs/src/app.js'
		])
		.pipe(concat('fuchs.js'))
		.pipe(gulp.dest('./fuchs/dist/'));			

		// Files

		gulp.src([
			'./bower_components/kendo-ui/styles/images/kendoui.woff'
		])
		.pipe(gulp.dest('./fuchs/dist/images/'));

		gulp.src([
			'./bower_components/kendo-ui/styles/Metro/loading-image.gif',
			'./bower_components/kendo-ui/styles/Metro/loading.gif'
		])
		.pipe(gulp.dest('./fuchs/dist/Metro/'));

		gulp.src([
			'./bower_components/kendo-ui/styles/fonts/glyphs/WebComponentsIcons.ttf',
			'./bower_components/kendo-ui/styles/fonts/glyphs/WebComponentsIcons.woff'
		])
		.pipe(gulp.dest('./fuchs/dist/fonts/glyphs/'));

	    return;
	});

	gulp.task('copy_to_web_fuchs', function() {

		gulp.src([
			'./fuchs/dist/**/*'
		])
		.pipe(gulp.dest('E:/playmotiv/web/www.playmotiv.net/fuchs'));

	});

	/* ------------------------------------------------------------------------------------------
	   SONANDCALM
	*/

	gulp.task('compile_sonandcalm', function() {

		gulp.src([
			'./bower_components/kendo-ui/styles/kendo.common.min.css',
			'./bower_components/kendo-ui/styles/kendo.metro.min.css',
			'./bower_components/kendo-ui/styles/kendo.metro.mobile.min.css',
			'./sonandcalm/src/css/app.css',
			'./sonandcalm/src/css/excel.css',
			'./sonandcalm/src/css/images.css',
			'./sonandcalm/src/css/products.css',
			'./sonandcalm/src/css/upload-images.css',
			'./sonandcalm/src/css/utils.css'
		])
		.pipe(concat('utils.css'))
		.pipe(gulp.dest('./sonandcalm/dist/'));		

		gulp.src([
			'./bower_components/kendo-ui/js/jquery.min.js'
		])
		.pipe(gulp.dest('./sonandcalm/dist/'));

		gulp.src([
			'./bower_components/kendo-ui/js/angular.min.js',
			'./bower_components/kendo-ui/js/kendo.all.min.js',
			'./bower_components/jszip/dist/jszip.min.js',
			'./sonandcalm/src/module.js',
			'./sonandcalm/src/service/datasource.js',
			'./sonandcalm/src/service/errors.js',
			'./sonandcalm/src/service/utils.js',
			'./sonandcalm/src/directive/excel.js',
			'./sonandcalm/src/directive/products.js',
			'./sonandcalm/src/directive/images.js',
			'./sonandcalm/src/directive/upload.js',
			'./sonandcalm/src/directive/utils.js',
			'./sonandcalm/src/app.js'
		])
		.pipe(concat('utils.js'))
		.pipe(gulp.dest('./sonandcalm/dist/'));

		gulp.src([
			'./bower_components/kendo-ui/styles/images/kendoui.woff'
		])
		.pipe(gulp.dest('./sonandcalm/dist/images/'));

		gulp.src([
			'./bower_components/kendo-ui/styles/Metro/loading-image.gif',
			'./bower_components/kendo-ui/styles/Metro/loading.gif'
		])
		.pipe(gulp.dest('./sonandcalm/dist/Metro/'));

		gulp.src([
			'./bower_components/kendo-ui/styles/fonts/glyphs/WebComponentsIcons.ttf',
			'./bower_components/kendo-ui/styles/fonts/glyphs/WebComponentsIcons.woff'
		])
		.pipe(gulp.dest('./sonandcalm/dist/fonts/glyphs/'));

	  return;
	});	

	gulp.task('update_sonandcalm', ['compile_sonandcalm'], function() {	

		gulp.src('./bower_components/kendo-ui/styles/images/kendoui.woff')
		.pipe(gulp.dest('P:/sonandcalm/www.sonandcalm.com/wp-content/plugins/poeticsoft-utils/images/'));

		gulp.src([
			'./bower_components/kendo-ui/styles/Metro/loading-image.gif',
			'./bower_components/kendo-ui/styles/Metro/loading.gif'
		])
		.pipe(gulp.dest('P:/sonandcalm/www.sonandcalm.com/wp-content/plugins/poeticsoft-utils/Metro/'));

		gulp.src([
			'./bower_components/kendo-ui/styles/fonts/glyphs/WebComponentsIcons.ttf',
			'./bower_components/kendo-ui/styles/fonts/glyphs/WebComponentsIcons.woff'
		])
		.pipe(gulp.dest('P:/sonandcalm/www.sonandcalm.com/wp-content/plugins/poeticsoft-utils/fonts/glyphs/'));

		gulp.src('./sonandcalm/dist/utils.css')
		.pipe(gulp.dest('P:/sonandcalm/www.sonandcalm.com/wp-content/plugins/poeticsoft-utils/'));

		gulp.src('./sonandcalm/dist/jquery.min.js')
		.pipe(gulp.dest('P:/sonandcalm/www.sonandcalm.com/wp-content/plugins/poeticsoft-utils/'));

		gulp.src('./sonandcalm/dist/utils.js')
		.pipe(gulp.dest('P:/sonandcalm/www.sonandcalm.com/wp-content/plugins/poeticsoft-utils/'));

		gulp.src('./sonandcalm/dist/index.html')
		.pipe(gulp.dest('P:/sonandcalm/www.sonandcalm.com/wp-content/plugins/poeticsoft-utils/'));

	  return setTimeout(livereload.reload, 1500);
	});

	gulp.task('watch', function () {

		livereload.listen();

		gulp.watch(
			['./sonandcalm/src/**/*'], 
			['update_sonandcalm']
		);

		gulp.watch(
			['./fuchs/src/**/*'], 
			['update_fuchs']
		);
	});

	/* ------------------------------------------------------------------------------------------ */

	gulp.task('default', ['watch']);