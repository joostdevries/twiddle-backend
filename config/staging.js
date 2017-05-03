module.exports = {
    env: 'staging',
    addonBucketName: 'canary-addons.ember-twiddle.com',
    schedulerSqsQueueUrl: 'https://sqs.us-east-1.amazonaws.com/620471542343/addon-builds-canary',
    schedulerLambdaFunctionname: 'addon-build-scheduler-canary',
    schedulerRole: 'arn:aws:lambda:us-east-1:620471542343:function:addon-build-scheduler-canary',
    builderRole: 'arn:aws:iam::620471542343:role/addon-builder-role-canary',
    builderClusterName: 'ember-twiddle',
    builderTaskDefinition: 'addon-builder-staging',
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
      '2.11.0': /2\.11\./,
      '2.12.0': /2\.12\./,

      // support multiple canary / beta / release cycles
      // by tying them to a specific Ember version at
      // the time of deployment
      'alpha-2.15': /^alpha$/,
      'canary-2.15': /^canary$/,
      'beta-2.14': /^beta$/,
      'release-2-13': /^release$/
    }
};
