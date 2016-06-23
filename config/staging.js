module.exports = {
    addonBucketName: 'canary-addons.ember-twiddle.com',
    schedulerSqsQueueUrl: 'https://sqs.us-east-1.amazonaws.com/620471542343/addon-builds-canary',
    schedulerLambdaFunctionname: 'addon-build-scheduler-canary',
    builderRole: 'arn:aws:iam::620471542343:role/addon-builder-role-canary',
    builderClusterName: 'ember-twiddle',
    builderTaskDefinition: 'addon-builder-canary'
};