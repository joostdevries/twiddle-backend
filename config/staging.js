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
      '2.6.0': /2\.6\./
    }
};