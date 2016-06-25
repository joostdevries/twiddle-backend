/*jshint node:true */
var config = require('./build-config');

var util = require('util');
var AWS = require('aws-sdk'); AWS.config.update({region:'us-east-1'});
var lambda = new AWS.Lambda();
var s3 = require('s3');
var fs = require('fs');

var awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
var awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
var awsSessionToken = process.env.AWS_SESSION_TOKEN;
var awsRegion = process.env.AWS_DEFAULT_REGION;

var emberVersion = require('./bower.json').dependencies.ember;
var installStatus = process.argv[2];
var buildStatus = process.argv[3];
var addonName = process.env.ADDON_NAME;
var addonVersion = process.env.ADDON_VERSION;
var uploadPath = 'ember-' + emberVersion + '/' + addonName + '/' + addonVersion;

console.log('Running in env: ' + config.env);
console.log('Generating json...');
generateAddonJson();
console.log('Uploading assets...');
uploadAssets();


// Generate addon.json with details on build
function generateAddonJson() {
  var buildLog = fs.readFileSync('ember.log', 'utf8');
  var addonJson = {
    status_date: new Date().toISOString(),
  };

  try {
    if(!fs.readFileSync('dist/addon.js', 'utf8').length) {
      buildLog = buildLog + '\nEmpty addon.js created';
      buildStatus = '1';
    }
  }
  catch(e) {
    buildLog = buildLog + '\nNo addon.js created';
    buildStatus = '1';
    try {
      fs.mkdirSync('dist');
    }
    catch(e) {}
  }

  if (buildStatus==='0' && installStatus==='0') {
    addonJson.status = 'build_success';
    addonJson.addon_js = '//' + config.addonBucketName + '/' + uploadPath + '/addon.js';
    addonJson.addon_css = '//' + config.addonBucketName + '/' + uploadPath + '/addon.css';
    addonJson.error_log = null;
  }
  else {
    addonJson.status = 'build_error';
    addonJson.addon_js = null;
    addonJson.addon_css = null;
    addonJson.error_log = buildLog;
  }

  fs.writeFileSync('dist/addon.json', JSON.stringify(addonJson));
}

function uploadAssets() {
  var client = s3.createClient({
    s3Options: {
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
      sessionToken: awsSessionToken,
      region: awsRegion,
    },
  });

  var params = {
    localDir: 'dist',

    s3Params: {
      Bucket: config.addonBucketName,
      Prefix: uploadPath,
      CacheControl: 'max-age=3600',
      ACL: 'public-read'
    },
  };

  var uploader = client.uploadDir(params);
  uploader.on('error', function(err) {
    console.error("unable to sync:", err.stack, util.inspect(err));
  });
  uploader.on('progress', function() {
    console.log("progress", uploader.progressAmount, uploader.progressTotal);
  });
  uploader.on('end', function() {
    console.log("done uploading");

    var params = {
      FunctionName: config.schedulerLambdaFunctionname, /* required */
      InvocationType: 'Event',
      Payload: JSON.stringify({
        triggered_by: 'builder'
      }),
    };
    lambda.invoke(params, function(err) {
      if(err) {
        console.error(err);
      }
      console.log('Triggered schedulder');
    });
  });
}