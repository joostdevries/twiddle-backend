/* global require, module */
const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const Plugin = require('broccoli-plugin');
const mergeTrees = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');
const concat = require('broccoli-concat');
const writeFile = require('broccoli-file-creator');
const path = require('path');
const assetRev = require('broccoli-asset-rev');
const stew = require('broccoli-stew');
const DEBUG = false;

EmberApp.env = function() { return 'development'; }

function StubApp(options) {
  return Reflect.construct(EmberApp, [options], StubApp);
}
Reflect.setPrototypeOf(StubApp.prototype, EmberApp.prototype);
Reflect.setPrototypeOf(StubApp, EmberApp);

// We don't want any of the default legacy files. But we *do* still
// want to let addons stick their own imports into the
// legacyFilesToAppend list.
StubApp.prototype.populateLegacyFiles = function() {};

let importedJsFiles = [];
let importedCssFiles = [];

let filesToExclude = [
  'loader.js',
  'legacy-shims.js',
  'app-shims.js',
  'deprecations.js',
  'jquery.js'
];

// Files included via app.import need to end up in addon.js
StubApp.prototype.import = function(assetPath, options) {
  options = options || {};

  if (typeof assetPath === 'object') {
    assetPath = assetPath[this.env];
  }

  if (filesToExclude.filter(file => assetPath.indexOf(file) !== -1).length === 0) {

    if (DEBUG) {
      console.log(assetPath);
    }

    let ext = path.extname(assetPath);
    let isCss = ext === '.css';
    let isJs = ext === '.js';
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

class EmptyTree extends Plugin {
  constructor(names = []) {
    super([], {});
    this.names = names;
  }

  build() {
    this.names.forEach(name => {
      this.output.writeFileSync(name, '');
    });
  }
}


module.exports = function() {
  let app = new StubApp({
    name: 'twiddle',
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

  let origAddonTree = new Funnel(app.addonTree(), {
    exclude: ['*/ember-load-initializers/**/*.js', '*/ember-resolver/**/*.js']
  });

  if (DEBUG) {
    origAddonTree = stew.debug(origAddonTree, { name: 'origAddonTree' });
  }

  let addonTree = concat(mergeTrees([origAddonTree, app.addonSrcTree()]), {
    inputFiles: '**/*.js',
    outputFile: 'vendor/addons.js'
  });

  let addonTestSupportTree = concat(app.addonTestSupportTree(), {
    inputFiles: '**/*.js',
    outputFile: 'vendor/addon-test-support.js',
    allowNone: true
  });

  let fullTree = mergeTrees([
    app.getAddonTemplates(),
    app.getStyles(),
    app.getTests(),
    app.getExternalTree(),
    app.getSrc(),
    app.getAppJavascript(false),
    addonTree,
    addonTestSupportTree
  ].filter(Boolean), { overwrite: true });

  fullTree = new Funnel(fullTree, {
    exclude: ['*/ember-load-initializers/**/*.js', '*/ember-resolver/**/*.js']
  });

  let templates = writeFile('twiddle/templates/.gitkeep', '');
  fullTree = mergeTrees([fullTree, templates]);

  if (DEBUG) {
    fullTree = stew.debug(fullTree, { name: 'fullTree' });
  }

  let processedTree = mergeTrees([
    app._defaultPackager.processAppAndDependencies(fullTree),
    app._defaultPackager.packageStyles(fullTree)
  ]);

  if (DEBUG) {
    processedTree = stew.debug(processedTree, { name: 'processedTree' });
  }

  let headerFiles = importedJsFiles
    .concat(app.legacyFilesToAppend || [])
    .concat(['vendor/addons.js', 'vendor/addon-test-support.js']);

  let cssTree = concat(processedTree, {
    headerFiles: importedCssFiles,
    inputFiles: ['**/*.css'],
    outputFile: '/addon.css',
    allowNone: false,
    sourceMapConfig: { enabled: false },
    annotation: 'Concat: Addon CSS'
  });

  let publicTree = new Funnel(app.getPublic(), {
    srcDir:'assets',
    destDir:'.',
    allowEmpty:true
  });

  let jsTree = concat(processedTree, {
    headerFiles: headerFiles,
    inputFiles: ['twiddle/**/*.js'],
    outputFile: '/addon.js',
    allowNone: true,
    sourceMapConfig: { enabled: false },
    annotation: 'Concat: Addon JS'
  });

  let mergedTree = mergeTrees([cssTree, publicTree, jsTree]);

  let fingerprintedTree = new assetRev(mergedTree, {
    generateAssetMap: true
  });

  return fingerprintedTree;
};
