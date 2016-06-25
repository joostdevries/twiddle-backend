# twiddle-backend
Ember Addon builder &amp; server for Ember Twiddle

## Adding support for a new Ember version
- Add a folder to [addon-build-configs](https://github.com/joostdevries/twiddle-backend/tree/master/addon-build-configs) with the version as name.
- Make sure `bower.json` and `package.json` contain only the minimal dependencies for building (so no test deps or ember data).
- Add the version + matching regex to `builderEmberVersions` in [config/staging.js](https://github.com/joostdevries/twiddle-backend/blob/master/config/staging.js#L10)