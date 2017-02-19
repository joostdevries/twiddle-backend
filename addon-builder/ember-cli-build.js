/* global require, module */
var EmberApp = require('ember-cli/lib/broccoli/ember-app');
var mergeTrees = require('ember-cli/lib/broccoli/merge-trees');
var Funnel = require('broccoli-funnel');
var concat = require('broccoli-concat');
var path = require('path');

EmberApp.env = function() { return 'development'; }

function StubApp(options) {
  EmberApp.call(this, options);
}
StubApp.prototype = Object.create(EmberApp.prototype);
StubApp.prototype.constructor = StubApp;

// We don't want any of the default legacy files. But we *do* still
// want to let addons stick their own imports into the
// legacyFilesToAppend list.
StubApp.prototype.populateLegacyFiles = function() {};

var importedJsFiles = [];
var importedCssFiles = [];

var filesToExclude = [
  'loader.js'
];

// Files included via app.import need to end up in addon.js
StubApp.prototype.import = function(assetPath, options) {
  options = options || {};

  if (typeof assetPath === 'object') {
    assetPath = assetPath[this.env];
  }

  if (filesToExclude.filter(function(file) {return assetPath.indexOf(file) === -1}).length > 0) {

    var ext = path.extname(assetPath);
    var isCss = ext === '.css';
    var isJs = ext === '.js';
    if (isCss) {
      if (options.prepend) {
        importedCssFiles.unshift(assetPath);
      } else {
        importedCssFiles.push(assetPath);
      }
    } else if (isJs) {
      if (options.prepend) {
        importedJsFiles.unshift(assetPath);
      } else {
        importedJsFiles.push(assetPath);
      }
    }
  }

  EmberApp.prototype.import.call(this, assetPath, options);
};

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
      styles: ['app.css', 'app.scss'],
      templates: new EmptyTree(),
      public: new EmptyTree()
    }
  });

  var fullTree = mergeTrees([app.appAndDependencies(), app.styles()])

  return mergeTrees([
    concat(fullTree, {
      headerFiles: importedCssFiles,
      inputFiles: ['**/*.css'],
      outputFile: '/addon.css',
      allowNone: false,
      annotation: 'Concat: Addon CSS'
    }),

    new Funnel(app.otherAssets(), {
      srcDir:'assets',
      destDir:'.',
      allowEmpty:true
    }),

    concat(fullTree, {
      headerFiles: importedJsFiles.concat(app.legacyFilesToAppend).concat(['vendor/addons.js']),
      inputFiles: ['twiddle/**/*.js'],
      outputFile: '/addon.js',
      allowNone: true,
      annotation: 'Concat: Addon JS'
    })
  ]);
};
