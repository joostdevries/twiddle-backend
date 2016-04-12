export AWS_ACCESS_KEY_ID="AKIAIC3KJV3HHVNHRBDA"
export AWS_SECRET_ACCESS_KEY=`security find-generic-password -a joostdevries -s twiddle-backend-deploy-aws-key -w`
export AWS_DEFAULT_REGION="us-east-1"

function deploy_builder() {
  echo "Deploying builder..."
  package_builder
  upload_builder
  update_builder
}

function package_builder() {
  echo "Creating zip archive..."
  rm -rf /tmp/twiddle-backend-builder.zip
  (cd addon-builder; zip -r /tmp/twiddle-backend-builder.zip *)
}

function upload_builder() {
  echo "Uploading builder to S3..."
  aws s3 cp /tmp/twiddle-backend-builder.zip s3://twiddle-backend-lambda-src/twiddle-backend-builder.zip
}

function update_builder() {
  echo "Updating lambda..."
  aws lambda update-function-code \
    --function-name "build-addon-test" \
    --s3-bucket twiddle-backend-lambda-src \
    --s3-key twiddle-backend-builder.zip \
    --publish
}

function deploy_api() {
  echo "Deploying API..."
  package_api
  upload_api
  update_api
}

function package_api() {
  echo "Creating zip archive..."
  rm -rf /tmp/twiddle-backend-api.zip
  (cd api; zip -r /tmp/twiddle-backend-api.zip *)
}

function upload_api() {
  echo "Uploading api to S3..."
  aws s3 cp /tmp/twiddle-backend-api.zip s3://twiddle-backend-lambda-src/twiddle-backend-api.zip
}

function update_api() {
  echo "Updating lambda..."
  aws lambda update-function-code \
    --function-name "get-addon-test" \
    --s3-bucket twiddle-backend-lambda-src \
    --s3-key twiddle-backend-api.zip \
    --publish
}


if [ -z "$1" ]; then
  echo "Deploying both API and builder..."
  deploy_api
  deploy_builder
else
  if [ "$1" == "api" ]; then
    deploy_api
  fi
  if [ "$1" == "builder" ]; then
    deploy_builder
  fi
fi