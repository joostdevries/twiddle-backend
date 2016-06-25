/* global require, module */
var EmberApp = require('ember-cli/lib/broccoli/ember-app');
var mergeTrees    = require('ember-cli/lib/broccoli/merge-trees');
var Funnel    = require('broccoli-funnel');

function StubApp(options) {
  EmberApp.call(this, options);
}
StubApp.prototype = Object.create(EmberApp.prototype);
StubApp.prototype.constructor = StubApp;

// We don't want any of the default legacy files. But we *do* still
// want to let addons stick their own imports into the
// legacyFilesToAppend list.
StubApp.prototype.populateLegacyFiles = function() {};

var quickTemp = require('quick-temp');
var fs = require('fs');
var path = require('path');

function EmptyTree(names) {
  this.names = names || [];
}

EmptyTree.prototype.read = function() {
  var dir = quickTemp.makeOrReuse(this, 'emptyTree');
  this.names.forEach(function(name) {
    fs.writeFileSync(path.join(dir, name), '');
  });
  return dir;
};

EmptyTree.prototype.cleanup = function() {
  quickTemp.remove(this, 'tmpCacheDir');
};


module.exports = function() {
  var app = new StubApp({
    name: 'twiddle',
    tests: false,
    sourcemaps: {
      enabled: false
    },
     minifyCSS: {
       enabled: false,
     },
     minifyJS: {
      enabled: false
     },
    trees: {
      app: new EmptyTree(),
      styles: new EmptyTree(['app.css', 'app.scss']),
      templates: new EmptyTree(),
      public: new EmptyTree()
    }
  });

  var fullTree = app.appAndDependencies();

  return mergeTrees([
    app.concatFiles(fullTree, {
      inputFiles: ['**/*.css'],
      outputFile: '/addon.css',
      allowNone: false,
      annotation: 'Concat: Addon CSS'
    }),

    new Funnel(app.otherAssets(), {
      srcDir:'assets',
      destDir:'.'
    }),

    app.concatFiles(fullTree, {
      headerFiles: app.legacyFilesToAppend.concat(['vendor/addons.js']),
      inputFiles: ['twiddle/**/*.js'],
      outputFile: '/addon.js',
      allowNone: true,
      annotation: 'Concat: Addon JS'
    })
  ]);

};
