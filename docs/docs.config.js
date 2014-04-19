var path = require('canonical-path');
var basePath = path.resolve(__dirname, '..');

var _ = require('lodash');

var basePackage = require('dgeni-packages/jsdoc');
var supplementalPackage = require('dgeni-packages/ngdoc');
//var examplesPackage = require('dgeni-packages/examples');
var pkg = require('../package.json');

module.exports = function (config) {
    config.set('currentVersion', pkg.version);

    config = basePackage(config);
    config = supplementalPackage(config);

    console.log(config);
//    config = examplesPackage(config);

    config.set('logging.level', 'info');

    config.prepend('rendering.templateFolders', [
        path.resolve(__dirname, 'templates')
    ]);

    config.set('basePath', __dirname);
    config.set('source.projectPath', '.');
    config.set('rendering.outputFolder', '..');

    var versionData = require('./generate-versions')(config);
    config.set('versionData', versionData);
    config.set('rendering.contentsFolder', 'dist/docs');
//    config.set('rendering.contentsFolder', path.join('docs', versionData.current.folder));

    config.set('processing.api-docs', {
        outputPath: '${docType}/${name}.md',
//        outputPath: 'api/${docType}/${name}/index.md',
        path: 'api/${docType}/${name}/',
        moduleOutputPath: 'api/module/${name}/index.md',
//        moduleOutputPath: 'api/module/${name}/index.md',
        modulePath: 'api/module/${name}/'
    });

    config.append('rendering.filters', [
        require('./filters/capital')
    ]);

    config.set('source.files', [
        {
            // Process all js files in services/.
            pattern: 'app/scripts/services/*.js',
            basePath: path.resolve(__dirname, '..')
        }
    ]);

    config.append('processing.inlineTagDefinitions', [
        require('./inline-tag-defs/link')
    ]);

//    // Configure the tags that will be parsed from the jsDoc.
//    var tagDefs = require('dgeni-packages/ngdoc/tag-defs');
//
//    // Parse the following annotations.
//    tagDefs.push({name: 'alias'});
//    tagDefs.push({name: 'augments'});
//    tagDefs.push({name: 'deprecated'});
//    tagDefs.push({name: 'description'});
//    tagDefs.push({name: 'example'});
//    tagDefs.push({name: 'private'});
//    tagDefs.push({name: 'see'});
//    tagDefs.push({name: 'type'});
//    tagDefs.push({name: 'view'});
//
//    // The name tag should not be required.
//    var nameTag = _.find(tagDefs, {name: 'name'});
//    nameTag.required = false;
//
//    config.set('processing.tagDefinitions', tagDefs);

    config.append('processing.tagDefinitions', require('./tag-defs'));

    //Don't conflict with the jekyll tags
    config.set('rendering.nunjucks.config.tags', {
        blockStart: '<@',
        blockEnd: '@>',
        variableStart: '<$',
        variableEnd: '$>',
        commentStart: '<#',
        commentEnd: '#>'
    });

    config.append('processing.processors', [
//        require('./processors/latest-version'),
        require('./processors/keywords'),
        require('./processors/pages-data'),
        require('./processors/index-page'),
//        require('./processors/version-data'),
        require('./processors/jekyll')
    ]);

    return config;
};
