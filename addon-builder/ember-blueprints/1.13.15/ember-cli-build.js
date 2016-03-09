/* global require, module */
var EmberApp = require('ember-cli/lib/broccoli/ember-app');
var Babel  = require('ember-cli-babel/node_modules/broccoli-babel-transpiler');
var Funnel  = require('ember-cli/node_modules/broccoli-funnel');
var p            = require('ember-cli/node_modules/ember-cli-preprocess-registry/preprocessors');
var mergeTrees    = require('ember-cli/lib/broccoli/merge-trees');


var preprocessTemplates = p.preprocessTemplates;


module.exports = function(defaults) {
  var app = new EmberApp(defaults, {
    // Add options here
  });

  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.

  app.initializeAddons();
  app.name='demo-app';

  var addonAppTrees = app.addonTreesFor('app');
  var mergedApp  = mergeTrees(addonAppTrees.concat(), {
    overwrite: true,
    annotation: 'TreeMerger (app)'
  });

  var appTree = Funnel(mergedApp, {
    srcDir: '/',
    destDir: app.name,
    annotation: 'ProcessedAppTree'
  });

  var addonTrees = app.addonTreesFor('templates');
  var mergedTemplates = mergeTrees(addonTrees, {
    overwrite: true,
    annotation: 'TreeMerger (templates)'
  });

  var addonTemplates = new Funnel(mergedTemplates, {
    srcDir: '/',
    destDir: app.name + '/templates',
    annotation: 'ProcessedTemplateTree'
  });

  var templates = app.addonPreprocessTree('template', addonTemplates);
  var templatesTree = app.addonPostprocessTree('template', preprocessTemplates(templates, {
    registry: app.registry,
    annotation: 'TreeMerger (pod & standard templates)'
  }));


  var addonTrees = mergeTrees(app.addonTreesFor('addon').concat(app.addonTreesFor('vendor')));

  var addonES6 = new Funnel(addonTrees, {
    srcDir: 'modules',
    allowEmpty: true,
    annotation: 'Funnel: Addon JS'
  });

  var addonReexports = new Funnel(addonTrees, {
    srcDir: 'reexports',
    allowEmpty: true,
    annotation: 'Funnel: Addon Re-exports'
  });

  var transpiledTemplatesTree  = new Babel(templatesTree, app._prunedBabelOptions());
  var transpiledAppTree = new Babel(appTree, app._prunedBabelOptions());
  var transpiledAddonTree = new Babel(addonES6, app._prunedBabelOptions());

  var reexportsAndTranspiledAddonTree = mergeTrees([
    transpiledAddonTree,
    transpiledTemplatesTree,
    addonReexports
  ], {
    annotation: 'TreeMerger: (re-exports)'
  });

  var bowerTree = new Funnel(app.trees.bower, {
    srcDir: '/',
    destDir: app.bowerDirectory + '/',
    exclude: [
      '**/ember/**'
    ],
    annotation: 'Funnel (bower)'
  });

  var vendorTree = new Funnel(mergeTrees(app.addonTreesFor('vendor')), {
    srcDir: '/',
    destDir: 'vendor/',
    annotation: 'Funnel (vendor)',
    exclude: [
      '**/jquery/**'
    ]
  });


  var addonVendorJSTree = app.concatFiles(mergeTrees([bowerTree, vendorTree]), {
    inputFiles: ['**/*.js'],
    allowNone: true,
    header: ";(function() { ",
    footer: "}());",
    outputFile: '/addons-vendor.js',
  });

  return mergeTrees([
    app.concatFiles(mergeTrees(app.addonTreesFor('styles').concat(addonTrees)), {
      inputFiles: ['**/*.css'],
      outputFile: '/addons.css',
      allowNone: true,
      annotation: 'Concat: Addon CSS'
    }),

    app.concatFiles(mergeTrees([addonVendorJSTree, transpiledAppTree, reexportsAndTranspiledAddonTree]), {
      inputFiles: ['**/*.js'],
      outputFile: '/addons.js',
      allowNone: true,
      annotation: 'Concat: Addon JS'
    })
  ]);

};
