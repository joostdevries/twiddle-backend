/*jshint node:true */
/*
  API GateWay lambda function
  todo:
    - maybe also use promises
 */

var AWS = require('aws-sdk');
var http = require('http');
var s3 = new AWS.S3();
var sts = new AWS.STS();
var ecs = new AWS.ECS();

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
      // if(err) {
        console.log('Building ', addon, addonVersion);
        buildAddon(emberVersion, addon, addonVersion, function(err, data) {
          console.log('Invocation complete');
          console.log(err, data);
          var addonS3Url = "https://s3.amazonaws.com/ember-twiddle-addons-beta/ember-"+emberVersion+"/"+addon+"/"+addonVersion+"/addon.json";
          context.done(null, {"location":addonS3Url});
        });
      // }
      // else {
      //   console.log('Serving cached ', addon, addonVersion);
      //   var addonS3Url = "https://s3.amazonaws.com/ember-twiddle-addons-beta/ember-"+emberVersion+"/"+addon+"/"+addonVersion+"/addon.json";
      //   context.done(null, {"location":addonS3Url});
      // }
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
    Bucket: 'ember-twiddle-addons-beta',
    Key: 'ember-'+emberVersion+'/'+addon+'/'+addonVersion+'/addon.json'
  };

  s3.headObject(params, cb);
}


function buildAddon(emberVersion, addon, addonVersion, cb) {
  var buildAddonPolicy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetBucketCORS",
                "s3:GetBucketLocation",
                "s3:GetBucketLogging",
                "s3:GetBucketNotification",
                "s3:GetBucketPolicy",
                "s3:GetBucketRequestPayment",
                "s3:GetBucketTagging",
                "s3:GetBucketVersioning",
                "s3:GetBucketWebsite",
                "s3:GetLifecycleConfiguration",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::ember-twiddle-addons-beta"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject",
                "s3:GetObjectAcl",
                "s3:GetObjectTorrent",
                "s3:GetObjectVersion",
                "s3:GetObjectVersionAcl",
                "s3:GetObjectVersionTorrent"
            ],
            "Resource": [
                "arn:aws:s3:::ember-twiddle-addons-beta/ember-"+emberVersion+"/"+addon+"/"+addonVersion+"/*"
            ]
        }
    ]
  };

  s3.putObject({
    Bucket: 'ember-twiddle-addons-beta',
    ACL: 'public-read',
    Key: 'ember-'+emberVersion+'/'+addon+'/'+addonVersion+'/addon.json',
    ContentType: 'application/json',
    Body: JSON.stringify({
      status: 'building',
      status_date: new Date().toISOString(),
      addon_js: null,
      addon_css: null,
      errors: null,
      ember_errors: null,
    })
  }, function (err) {
    if (err) console.log(err, err.stack); // an error occurred

    var stsParams = {
      RoleArn: 'arn:aws:iam::620471542343:role/addon-builder-role', /* required */
      RoleSessionName: 'build-addon', /* required */
      DurationSeconds: 900,
      Policy: JSON.stringify(buildAddonPolicy)
    };

    console.log(JSON.stringify(buildAddonPolicy));
    sts.assumeRole(stsParams, function (err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response

      var params = {
        taskDefinition: 'addon-builder', /* required */
        cluster: 'ember-twiddle',
        count: 1,
        overrides: {
          containerOverrides: [
            {
              name: 'addon-builder',
              environment: [
                {
                  name: 'AWS_ACCESS_KEY_ID',
                  value: data.Credentials.AccessKeyId
                },
                {
                  name: 'AWS_SECRET_ACCESS_KEY',
                  value: data.Credentials.SecretAccessKey
                },
                {
                  name: 'AWS_SESSION_TOKEN',
                  value: data.Credentials.SessionToken
                },
                {
                  name: 'ADDON_NAME',
                  value: addon
                },
                {
                  name: 'ADDON_VERSION',
                  value: addonVersion
                },
              ]
            }
          ]
        },
        startedBy: 'api_call'
      };
      ecs.runTask(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
      });
    });
  });
}


function isValidAddon(npmData) {
  if(npmData.version) {
    if(npmData.keywords) {
      return (npmData.keywords.indexOf('ember-addon')!==-1);
    }
  }
}