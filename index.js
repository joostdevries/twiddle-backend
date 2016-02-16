/*jshint node:true */
var fs = require('fs-extra');
var glob = require('glob');
var rimraf = require('rimraf');
var path = require('path');
var rsvp = require('rsvp');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var npm = require('npm');
var stream = require('stream');

// process.stdout doesnt work on lambda
var echoStream = new stream.Writable();
echoStream._write = function (chunk, encoding, done) {
  console.log(chunk.toString().replace('\n',''));
  done();
};


function createBuildDir(buildDirPath) {
  return new rsvp.Promise(function(resolve, reject) {
    rimraf.sync(buildDirPath);
    fs.mkdirSync(buildDirPath);
    fs.mkdirSync(buildDirPath + '/node_modules');
    fs.mkdirSync(buildDirPath + '/bower_components');
    fs.mkdirSync(buildDirPath + '/tmp');

    console.log('Created build dir');
    resolve(buildDirPath);
  });
}

function copyPackageJson(srcDirPath, buildDirPath) {
  return new rsvp.Promise(function(resolve, reject) {
    fs.copy(path.join(srcDirPath, 'package.json'), path.join(buildDirPath, 'package.json'), function (err) {
      if(err) {
        reject(err);
      }

      console.log('Copied package.json');
      resolve(buildDirPath);
    });
  });
}

function symlinkBuildDirApp(srcDirPath, buildDirPath) {
  // console.log(srcDirPath, buildDirPath);
  return new rsvp.Promise(function(resolve, reject) {
    glob(srcDirPath + '/*', function(err, files) {
      for(var i=0; i<files.length; i++) {
        var file = files[i];
        if(file == srcDirPath + '/node_modules' || file == srcDirPath + '/bower_components' || file == srcDirPath + '/package.json') {
          continue;
        }
        fs.symlinkSync(file, file.replace(srcDirPath, buildDirPath));
      }

      console.log('Copied dummy app');
      resolve(buildDirPath);
    });
  });
}

function symlinkBuildDirNodeModules(srcDirPath, buildDirPath) {
  // console.log(srcDirPath, buildDirPath);
  return new rsvp.Promise(function(resolve, reject) {
    glob(srcDirPath + '/node_modules/*', function(err, files) {
      for(var i=0; i<files.length; i++) {
        var file = files[i];
        fs.symlinkSync(path.resolve(file), file.replace(srcDirPath, buildDirPath));
      }

      console.log('Copied node modules');
      resolve(buildDirPath);
    });
  });
}

function symlinkBuildDirBowerComponents(srcDirPath, buildDirPath) {
  return new rsvp.Promise(function(resolve, reject) {
    glob(srcDirPath + '/bower_components/*', function(err, files) {
      for(var i=0; i<files.length; i++) {
        var file = files[i];
        fs.symlinkSync(path.resolve(file), file.replace(srcDirPath, buildDirPath));
      }

      console.log('Copied bower components');
      resolve(buildDirPath);
    });
  });
}

function uploadToS3(srcDir, uploadPath) {
  var jsUploadPromise = new rsvp.Promise(function(resolve, reject){
    var jsFileStream = fs.createReadStream(path.join(srcDir, 'addons.js'));
    jsFileStream.on('error', function (err) {
      if (err) { return reject(err); }
    });

    jsFileStream.on('open', function () {
      s3.putObject({
        Bucket: 'addons-test',
        ACL: 'public-read',
        Key: uploadPath + '/addon.js',
        ContentType: 'application/javascript',
        Body: jsFileStream
      }, function (err) {
        if (err) { return reject(err); }
        return resolve();
      });
    });
  });

  var cssUploadPromise = new rsvp.Promise(function(resolve, reject){
    var cssFileStream = fs.createReadStream(path.join(srcDir, 'addons.css'));
    cssFileStream.on('error', function (err) {
      if (err) { return reject(err); }
    });

    cssFileStream.on('open', function () {
      s3.putObject({
        Bucket: 'addons-test',
        ACL: 'public-read',
        Key: uploadPath + '/addon.css',
        ContentType: 'text/css',
        Body: cssFileStream
      }, function (err) {
        if (err) { return reject(err); }
        return resolve();
      });
    });
  });

  return rsvp.all([jsUploadPromise, cssUploadPromise]);
}

function npmInstall(buildDirPath, addon, addonVersion) {
  return new rsvp.Promise(function(resolve, reject) {
    process.chdir(buildDirPath);
    npm.load(function() {
      console.log('NPM Loaded');
      npm.config.set('save-dev', true);
      npm.install(addon + '@' + addonVersion, function() {
        console.log('NPM install complete');
        resolve();
      });
    });
  });
}

function giftwrap(buildDirPath, buildOutPath) {
  return ember(buildDirPath, ['giftwrap', '--output-path=' + buildOutPath]);
}

function ember(pkgPath, command) {
  var emberCli = require(pkgPath + '/node_modules/ember-cli/lib/cli/index');
  process.chdir(pkgPath);
  return emberCli({
    name: 'test',
    ui: false,
    inputStream: process.stdin,
    outputStream: echoStream,
    errorLog: echoStream,
    cliArgs: command
  });
}

exports.handler = function() {
  echoStream.write('Test stdout\n');
  echoStream.write('Test stderr\n');

  var addon = 'ember-breadcrumbs';
  var addonVersion = '0.1.7';
  var emberVersion = '1.13.1';

  var buildDirPath = path.resolve('/tmp/build-' + addon + '-' + addonVersion.replace(/\./gi,'-') + '-ember-' + emberVersion.replace(/\./gi,'-'));
  var buildOutPath = path.resolve('/tmp/' + addon + '-' + addonVersion.replace(/\./gi,'-') + '-ember-' + emberVersion.replace(/\./gi,'-'));
  var srcDirPath = path.resolve('./ember-blueprints/' + emberVersion);
  var s3Path = 'ember-' + emberVersion + '/' + addon + '/' + addonVersion;

  console.log(buildDirPath);
  console.log(buildOutPath);
  console.log(srcDirPath);

  createBuildDir(buildDirPath)
    .then(copyPackageJson.bind(this, srcDirPath))
    .then(symlinkBuildDirApp.bind(this, srcDirPath))
    .then(symlinkBuildDirNodeModules.bind(this, srcDirPath))
    .then(symlinkBuildDirBowerComponents.bind(this, srcDirPath))
    .then(npmInstall.bind(this, buildDirPath, addon, addonVersion))
    .then(giftwrap.bind(this, buildDirPath, buildOutPath))
    .then(uploadToS3.bind(this, buildOutPath, s3Path))
    .then(function(res) {
      console.log('Operations finished');
      context.success();
    },function(err) {
      console.log('Error', err);
    });
};

// exports.handler();