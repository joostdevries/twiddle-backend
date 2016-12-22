# twiddle-backend

Ember Addon builder &amp; server for Ember Twiddle


## Quick Start

You will need [Docker](https://www.docker.com/) installed and running.

Fork and clone twiddle-backend:

```
git clone git@github.com:my-github-username/twiddle-backend
cd twiddle-backend
```

Build a Docker container.

For example, this will build a container named `twiddle-addon-builder` using Ember 2.9.0 that will deploy to the staging environment:

```
docker build -t twiddle-addon-builder -f addon-builder/Dockerfile --build-arg EMBER_VERSION="2.9.0" --build-arg BUILDER_ENVIRONMENT="staging" .
```

Build your addon.

For example, to build ember-cli-mirage:

```
docker run --rm --entrypoint=/addon-builder/build-addon.sh -e ADDON_NAME=ember-cli-mirage -e ADDON_VERSION=0.2.4 twiddle-addon-builder
```

Note that build-addon.sh will try to upload the built addon to S3, which you will need credentials for, otherwise it will error.


## Adding support for a new Ember version
- Add a folder to [addon-build-configs](https://github.com/joostdevries/twiddle-backend/tree/master/addon-build-configs) with the version as name.
- Make sure `bower.json` and `package.json` contain only the minimal dependencies for building (so no test deps or ember data).
- Add the version + matching regex to `builderEmberVersions` in [config/staging.js](https://github.com/joostdevries/twiddle-backend/blob/master/config/staging.js#L10)
- Run `script/create-ember-version-image.sh <version> staging` to activate the version to staging
- Run `script/create-ember-version-image.sh <version> production` to activate the version to production
