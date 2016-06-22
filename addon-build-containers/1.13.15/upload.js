/*jshint node:true */
var ENVIRONMENT = 'canary';

var configs = {
  canary: {
    addonBucketName: 'canary-addons.ember-twiddle.com',
    schedulerSqsQueueUrl: 'https://sqs.us-east-1.amazonaws.com/620471542343/addon-builds-canary',
    schedulerLambdaFunctionname: 'addon-build-scheduler-canary',
    builderRole: 'arn:aws:iam::620471542343:role/addon-builder-role-canary',
    builderClusterName: 'ember-twiddle',
    builderTaskDefinition: 'addon-builder-canary'
  },

  production: {
    addonBucketName: 'addons.ember-twiddle.com',
    schedulerSqsQueueUrl: 'https://sqs.us-east-1.amazonaws.com/620471542343/addon-builds-production',
    schedulerLambdaFunctionname: 'addon-build-scheduler-production',
    builderRole: 'arn:aws:iam::620471542343:role/addon-builder-role-production',
    builderClusterName: 'ember-twiddle',
    builderTaskDefinition: 'addon-builder'
  }
};

var config = configs[ENVIRONMENT];

var util = require('util');
var AWS = require('aws-sdk');
var s3 = require('s3');
var fs = require('fs');

var awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
var awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
var awsSessionToken = process.env.AWS_SESSION_TOKEN;
var awsRegion = process.env.AWS_DEFAULT_REGION;

var emberVersion = '1.13.15';
var buildStatus = process.argv[2];
var addonName = process.env.ADDON_NAME;
var addonVersion = process.env.ADDON_VERSION;
var uploadPath = 'ember-' + emberVersion + '/' + addonName + '/' + addonVersion;


console.log('Generating json...');
generateAddonJson();
console.log('Uploading assets...');
uploadAssets();


// Generate addon.json with details on build
function generateAddonJson() {
  var addonJson = {
    status_date: new Date().toISOString(),
  };

  if (buildStatus==='0') {
    addonJson.status = 'build_success';
    addonJson.addon_js = '//s3.amazonaws.com/' + config.addonBucketName + '/' + uploadPath + '/addon.js';
    addonJson.addon_css = '//s3.amazonaws.com/' + config.addonBucketName + '/' + uploadPath + '/addon.css';
    addonJson.error_log = null;
  }
  else {
    var buildLog = fs.readFileSync('ember.log', 'utf8');
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