#!/bin/bash
set -e

if [ -z ${AWS_ACCESS_KEY_ID+x} ]; then
  read -p 'Access Key ID: ' ACCESS_KEY_ID
  read -sp 'Secret Access Key: ' SECRET_ACCESS_KEY
  export AWS_ACCESS_KEY_ID=${ACCESS_KEY_ID}
  export AWS_SECRET_ACCESS_KEY=${SECRET_ACCESS_KEY}
fi
export AWS_DEFAULT_REGION="us-east-1"

export ENV=$1
source config/$ENV.sh

echo "Deploying to $ENV..."

echo "Uploading API"
rm -rf /tmp/twiddle-backend-deploy /tmp/twiddle-backend-deploy.zip
mkdir -p /tmp/twiddle-backend-deploy
cp api/addon/get.js /tmp/twiddle-backend-deploy/index.js
cp config/$ENV.js /tmp/twiddle-backend-deploy/config.js
zip --junk-paths /tmp/twiddle-backend-deploy.zip /tmp/twiddle-backend-deploy/*
aws lambda update-function-code --function-name $API_ADDON_GET_FUNCTION_NAME --zip-file fileb:///tmp/twiddle-backend-deploy.zip

echo "Uploading Scheduler"
rm -rf /tmp/twiddle-backend-deploy /tmp/twiddle-backend-deploy.zip
mkdir -p /tmp/twiddle-backend-deploy
cp scheduler/scheduler.js /tmp/twiddle-backend-deploy/index.js
cp config/$ENV.js /tmp/twiddle-backend-deploy/config.js
zip --junk-paths /tmp/twiddle-backend-deploy.zip /tmp/twiddle-backend-deploy/*
aws lambda update-function-code --function-name $SCHEDULER_FUNCTION_NAME --zip-file fileb:///tmp/twiddle-backend-deploy.zip