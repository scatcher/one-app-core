// @dgeni developers: Why do we need canonical-path?
var path = require('canonical-path');

var basePackage = require('dgeni-packages/ngdoc');

module.exports = function(config) {
    // Use ngdocPackage
    config = basePackage(config);

    // Set logging level
    config.set('logging.level', 'info');

    // Add your own templates to render docs
    config.prepend('rendering.templateFolders', [
        path.resolve(__dirname, 'templates')
    ]);

    // You can specifiy which tempate should be used based on a pattern.
    // Currently we just use one template and don't need a pattern
    config.prepend('rendering.templatePatterns', [
        'common.template.html'
    ]);

    // This tells dgeni where to look for stuff
    config.set('source.projectPath', '.');

    config.set('source.files', [
        {
            // Process all js files in services/.
            pattern: 'app/scripts/services/*.js',
            // @dgeni developers: Why is basePath different from config.get('source.projectPath')?
            basePath: path.resolve(__dirname, '..')
        }
    ]);

    // Our generated docs will be written here:
    // @dgeni developers: Why is both (outputFolder and contentsFolder) needed?
    config.set('rendering.outputFolder', '../dist/');
    config.set('rendering.contentsFolder', 'docs');

    return config;
};
