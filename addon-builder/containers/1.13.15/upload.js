var AWS = require('aws-sdk');
var s3 = require('s3');

var awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
var awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
var awsRegion = process.env.AWS_DEFAULT_REGION;

var addonName = process.env.ADDON_NAME;
var addonVersion = process.env.ADDON_VERSION;

var client = s3.createClient({
  s3Options: {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
    region: awsRegion,
  },
});

var params = {
  localDir: "dist",

  s3Params: {
    Bucket: "addons-test",
    Prefix: "ember-1.13.15/" + addonName + "/" + addonVersion,
  },
};

var uploader = client.uploadDir(params);
uploader.on('error', function(err) {
  console.error("unable to sync:", err.stack);
});
uploader.on('progress', function() {
  console.log("progress", uploader.progressAmount, uploader.progressTotal);
});
uploader.on('end', function() {
  console.log("done uploading");
});
