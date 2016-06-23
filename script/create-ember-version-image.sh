#!/bin/bash
set -e

export AWS_ACCESS_KEY_ID="AKIAIC3KJV3HHVNHRBDA"
export AWS_SECRET_ACCESS_KEY=`security find-generic-password -a joostdevries -s twiddle-backend-deploy-aws-key -w`
export AWS_DEFAULT_REGION="us-east-1"

export EMBER_VERSION=$1
LOGIN=`aws ecr get-login --region us-east-1`

echo "Creating Docker image for Ember $EMBER_VERSION"
( docker build  --build-arg EMBER_VERSION=$EMBER_VERSION -f addon-builder/Dockerfile -t addon-build-containers/canary:$EMBER_VERSION .;
  docker tag addon-build-containers/canary:$EMBER_VERSION 620471542343.dkr.ecr.us-east-1.amazonaws.com/addon-build-containers/canary:$EMBER_VERSION;
  $LOGIN;
  docker push 620471542343.dkr.ecr.us-east-1.amazonaws.com/addon-build-containers/canary:$EMBER_VERSION)

echo 'Done'