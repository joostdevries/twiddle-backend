module.exports = {
    env: 'production',
    addonBucketName: 'addons.ember-twiddle.com',
    schedulerSqsQueueUrl: 'https://sqs.us-east-1.amazonaws.com/620471542343/addon-builds-production',
    schedulerLambdaFunctionname: 'addon-build-scheduler-production',
    schedulerRole: 'arn:aws:lambda:us-east-1:620471542343:function:addon-build-scheduler-production',
    builderRole: 'arn:aws:iam::620471542343:role/addon-builder-role-production',
    builderClusterName: 'ember-twiddle',
    builderTaskDefinition: 'addon-builder-production',
    builderEmberVersions: {
      '1.13.13': /1\.13\./,
      '2.0.0': /2\.0\.0/,
      '2.0.3': /2\.0\./,
      '2.1.0': /2\.1\./,
      '2.2.0': /2\.2\./,
      '2.3.0': /2\.3\./,
      '2.4.0': /2\.4\./,
      '2.5.0': /2\.5\./,
      '2.6.0': /2\.6\./,
      '2.7.0': /2\.7\./,
      '2.8.0': /2\.8\./,
      '2.9.0': /2\.9\./,
      '2.10.0': /2\.10\.0/,
      '2.10.1': /2\.10\./,
      '2.11.0': /2\.11\./
    }
};
