// Karma configuration
// Generated on Wed Oct 28 2015 17:45:03 GMT+0000 (GMT)

module.exports = function(config) {
  config.set({

	 // base path that will be used to resolve all patterns (eg. files, exclude)
	 basePath: 'public/',


	 // frameworks to use
	 // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
	 frameworks: ['mocha', 'fixture', 'chai', 'sinon'],


	 // list of files / patterns to load in the browser
	 files: [
		'app/fixtures/**/*',

		'bower_components/tween.js/src/Tween.js',
		'bower_components/angular/angular.js',
		'bower_components/angular-mocks/angular-mocks.js',
		'bower_components/lodash/lodash.min.js',
		'bower_components/angular-simple-logger/dist/angular-simple-logger.min.js',
		'bower_components/angular-google-maps/dist/angular-google-maps.min.js',
		'app/app.js',
		'app/modules/**/*.js',
		'app/filters/*.js',
		'app/tests/**/*.js'
	 ],


	 // list of files to exclude
	 exclude: [
	 ],


	 // preprocess matching files before serving them to the browser
	 // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
	 preprocessors: {
		'**/*.json'   : ['json_fixtures']
	 },


	 // test results reporter to use
	 // possible values: 'dots', 'progress'
	 // available reporters: https://npmjs.org/browse/keyword/karma-reporter
	 reporters: ['progress'],


	 // web server port
	 port: 9876,


	 // enable / disable colors in the output (reporters and logs)
	 colors: true,


	 // level of logging
	 // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
	 logLevel: config.LOG_INFO,


	 // enable / disable watching file and executing tests whenever any file changes
	 autoWatch: true,


	 // start these browsers
	 // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
	 browsers: ['PhantomJS'],


	 // Continuous Integration mode
	 // if true, Karma captures browsers, runs the tests and exits
	 singleRun: true,


	 plugins: [
		'karma-mocha',
		'karma-phantomjs-launcher',
		'karma-fixture',
		'karma-chai',
		'karma-sinon',
		'karma-json-fixtures-preprocessor'
	 ],

	 jsonFixturesPreprocessor: {
		variableName: '__json__'
	 },
  })
}