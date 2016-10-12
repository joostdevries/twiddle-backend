#!/bin/bash
set -e

if [ -z ${AWS_ACCESS_KEY_ID+x} ]; then
  read -p 'Access Key ID: ' ACCESS_KEY_ID
  read -sp 'Secret Access Key: ' SECRET_ACCESS_KEY
  export AWS_ACCESS_KEY_ID=${ACCESS_KEY_ID}
  export AWS_SECRET_ACCESS_KEY=${SECRET_ACCESS_KEY}
fi
export AWS_DEFAULT_REGION="us-east-1"

export EMBER_VERSION=$1
export BUILDER_ENVIRONMENT=$2
source config/$BUILDER_ENVIRONMENT.sh

if [ "$BUILDER_ENVIRONMENT" == "staging" ]; then
  export ENV_SUFFIX="canary"
else
  export ENV_SUFFIX="production"
fi

echo "Deploying to $BUILDER_ENVIRONMENT..."

LOGIN=`aws ecr get-login --region us-east-1`

echo "Creating Docker image for Ember $EMBER_VERSION"
( docker build --build-arg EMBER_VERSION=$EMBER_VERSION --build-arg BUILDER_ENVIRONMENT=$BUILDER_ENVIRONMENT -f addon-builder/Dockerfile -t addon-build-containers/$BUILDER_ENVIRONMENT:$EMBER_VERSION .;
  docker tag addon-build-containers/$BUILDER_ENVIRONMENT:$EMBER_VERSION $ECR_URL:$EMBER_VERSION;
  $LOGIN;
  docker push $ECR_URL:$EMBER_VERSION)

echo "Registering task definition addon-builder-$BUILDER_ENVIRONMENT-${EMBER_VERSION//\./-}"
aws ecs register-task-definition --family "addon-builder-$BUILDER_ENVIRONMENT-${EMBER_VERSION//\./-}" --container-definitions  "[
    {
      \"volumesFrom\": [],
      \"memory\": 450,
      \"portMappings\": [],
      \"essential\": true,
      \"entryPoint\": [
        \"/bin/sh\"
      ],
      \"mountPoints\": [],
      \"name\": \"addon-builder\",
      \"environment\": [
        {
          \"name\": \"AWS_DEFAULT_REGION\",
          \"value\": \"us-east-1\"
        }
      ],
      \"links\": [],
      \"image\": \"$ECR_URL:$EMBER_VERSION\",
      \"command\": [
        \"/addon-builder/build-addon.sh\"
      ],
      \"logConfiguration\": {
        \"logDriver\": \"awslogs\",
        \"options\": {
          \"awslogs-group\": \"addon-builder-logs-$ENV_SUFFIX\",
          \"awslogs-region\": \"us-east-1\"
        }
      },
      \"cpu\": 450
    }
  ]"

echo 'Done'