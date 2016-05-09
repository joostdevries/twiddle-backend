/*jshint node:true */

var AWS = require('aws-sdk');
var http = require('http');
var s3 = new AWS.S3();
var lambda = new AWS.Lambda();

var s3BucketName = 'ember-twiddle-addons-beta';
var schedulerLambdaFunctionname = 'ember-twiddle-addon-build-scheduler';


exports.getAddon = function getAddon(event, context) {
  var addon = event.addon;
  var addonVersion = event.addon_version;
  var emberVersion = event.ember_version;

  resolvePackage(addon, addonVersion)
    .catch(packageNotFound.bind(undefined, context))
    .then(s3LookupAddon.bind(emberVersion))
    .then(function(emberVersion, addon, addonVersion, isPresentInS3) {
      if(!isPresentInS3) {
        return scheduleAddonBuild(emberVersion, addon, addonVersion);
      }

      return true;
    })
    .then(redirectToAddon.bind(undefined, context))
    .catch(function(err) {
      context.fail('An unknown error occurred: ' + JSON.stringify(err));
    });
};

/**
 * Returns a Promise that resolves if the package could
 * be resolved in NPM and fails if it could not
 * @param  {[type]} addon        [description]
 * @param  {[type]} addonVersion [description]
 * @return {[type]}              [description]
 */
function resolvePackage(addon, addonVersion) {
  return new Promise(function(resolve, reject) {
    return http.get({
      host: 'registry.npmjs.com',
      path: '/' + addon + '/' + addonVersion
    }, function(response) {
      var body = '';
      response.on('data', function(d) {
        body += d;
      });
      response.on('end', function() {
        var npmData = JSON.parse(body);
        if (isValidAddon(npmData)) {
          resolve(addon, npmData.version);
        }
        else {
          reject(npmData);
        }
      });
      response.on('error', function(err) {
        reject(error);
      });
    });
  });
}

/**
 * Checks whether an NPM package is a valid addon.
 * @param  {[type]}  npmData [description]
 * @return {Boolean}         [description]
 */
function isValidAddon(npmData) {
  if(npmData.version) {
    if(npmData.keywords) {
      return (npmData.keywords.indexOf('ember-addon')!==-1);
    }
  }
}

/**
 * Redirect to the addon in S3
 * @param  {[type]} context      [description]
 * @param  {[type]} emberVersion [description]
 * @param  {[type]} addon        [description]
 * @param  {[type]} addonVersion [description]
 * @return {[type]}              [description]
 */
function redirectToAddon(context, emberVersion, addon, addonVersion) {
  var addonS3Url = 'https://s3.amazonaws.com/' + s3BucketName + '/ember-' + emberVersion + '/' + addon + '/' + addonVersion + '/addon.json';
  context.done(null, { 'location': addonS3Url });
}

/**
 * Return a not found error
 * @param  {[type]} context     [description]
 * @param  {[type]} packageData [description]
 * @return {[type]}             [description]
 */
function packageNotFound(context, packageData) {
  context.fail('Version or package not found or not a valid addon, package details: ' + JSON.stringify(data));
}

/**
 * Returns a Promise that resolves if the addon was found in
 * S3 and fails if it wasn't.
 * @param  {[type]} emberVersion [description]
 * @param  {[type]} addon        [description]
 * @param  {[type]} addonVersion [description]
 * @return {[type]}              [description]
 */
function checkIfAddonExists(emberVersion, addon, addonVersion) {
  return new Promise(function(resolve, reject) {
    var params = {
      Bucket: s3BucketName,
      Key: 'ember-' + emberVersion + '/' + addon + '/' + addonVersion + '/addon.json'
    };

    s3.headObject(params, function(err) {
      resolve(emberVersion, addon, addonVersion, !!err);
    });
  });
}

function scheduleAddonBuild(emberVersion, addon, addonVersion) {
  return new Promise(function(resolve, reject) {
    var params = {
      FunctionName: schedulerLambdaFunctionname, /* required */
      InvocationType: 'Event',
      Payload: JSON.stringify({
        addon: addon,
        addon_version: addonVersion,
        ember_version: emberVersion
      }),
    };
    lambda.invoke(params, function() {
      resolve(emberVersion, addon, addonVersion);
    });
  });
}

function createAddonJSON(emberVersion, addon, addonVersion) {
  return new Promise(function(resolve, reject) {
    s3.putObject({
      Bucket: s3BucketName,
      ACL: 'public-read',
      Key: 'ember-' + emberVersion + '/' + addon + '/' + addonVersion + '/addon.json',
      ContentType: 'application/json',
      Body: JSON.stringify({
        status: 'building',
        status_date: new Date().toISOString(),
        addon_js: null,
        addon_css: null,
        errors: null,
        ember_errors: null,
      })
    }, function(err) {
      if (err) {
        return reject(err);
      }
      return resolve(emberVersion, addon, addonVersion);
    });
  });
}