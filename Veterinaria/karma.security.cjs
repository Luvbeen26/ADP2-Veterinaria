module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    plugins: [require('karma-jasmine'), require('karma-chrome-launcher'), require('karma-coverage')],
    reporters: ['progress'], browsers: ['SecurityHeadless'],
    customLaunchers: {SecurityHeadless: {base: 'ChromeHeadless', flags: ['--disable-gpu']}},
    singleRun: true, restartOnFileChange: false
  });
};
