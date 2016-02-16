/*jshint node:true */
/*
  API GateWay lambda function
  todo:
    - create temporary json object before building
 */

var AWS = require('aws-sdk');
var http = require('http');
var s3 = new AWS.S3();
var lambda = new AWS.Lambda();

exports.handler = function(event, context) {
  var addon = event.addon;
  var addonVersion = event.addon_version;
  var emberVersion = event.ember_version;

  getPackageInfo(addon, addonVersion, function(data) {
    if(!isValidAddon(data)) {
      context.fail('Version or package not found or not a valid addon, package details: ' + JSON.stringify(data));
    }

    addonVersion = data.version;

    checkIfAddonExists(emberVersion, addon, addonVersion, function(err) {
      if(err) {
        console.log('Building ', addon, addonVersion);
        buildAddon(emberVersion, addon, addonVersion, function(err, data) {
          console.log('Invocation complete');
          console.log(err, data);
          var addonS3Url = "https://s3.amazonaws.com/addons-test/ember-"+emberVersion+"/"+addon+"/"+addonVersion+"/addon.js";
          context.done(null, {"location":addonS3Url});
        });
      }
      else {
        console.log('Serving cached ', addon, addonVersion);
        var addonS3Url = "https://s3.amazonaws.com/addons-test/ember-"+emberVersion+"/"+addon+"/"+addonVersion+"/addon.js";
        context.done(null, {"location":addonS3Url});
      }
    });
  });
 };


function getPackageInfo(name, versionSpec, callback) {
  return http.get({
    host: 'registry.npmjs.com',
    path: '/'+name+'/'+versionSpec
  }, function(response) {
    var body = '';
    response.on('data', function(d) {
      body += d;
    });
    response.on('end', function() {
      callback(JSON.parse(body));
    });
  });
}


function checkIfAddonExists(emberVersion, addon, addonVersion, cb) {
  var params = {
    Bucket: 'addons-test',
    Key: 'ember-'+emberVersion+'/'+addon+'/'+addonVersion+'/addon.js'
  };

  s3.headObject(params, cb);
}


function buildAddon(emberVersion, addon, addonVersion, cb) {
  s3.putObject({
    Bucket: 'addons-test',
    ACL: 'public-read',
    Key: 'ember-'+emberVersion+'/'+addon+'/'+addonVersion+'/addon.js',
    ContentType: 'application/javascript',
    Body: JSON.stringify({status: "building", details: "try again in 30s"})
  }, function (err) {
    var params = {
      FunctionName: 'build-addon-test', /* required */
      InvocationType: 'Event',
      Payload: JSON.stringify({
        addon: addon,
        addon_version: addonVersion,
        ember_version: emberVersion
      }),
    };
    lambda.invoke(params, cb);
  });
}


function isValidAddon(npmData) {
  if(npmData.version) {
    if(npmData.keywords) {
      return (npmData.keywords.indexOf('ember-addon')!==-1);
    }
  }
}