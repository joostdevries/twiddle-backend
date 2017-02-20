FROM mhart/alpine-node:6.9.2

RUN apk --update add git
RUN npm install -g bower@1.7.7

RUN mkdir /addon-builder
WORKDIR /addon-builder

ARG EMBER_VERSION

COPY addon-build-configs/$EMBER_VERSION/package.json /addon-builder/package.json
RUN npm install -g ember-cli
RUN npm install

COPY addon-build-configs/$EMBER_VERSION/bower.json /addon-builder/bower.json
RUN bower --allow-root install

RUN ln -s /addon-builder/node_modules/ember-cli/bin/ember /bin/ember
RUN rm /addon-builder/bower.json /addon-builder/package.json
RUN ember init --skip-npm --skip-bower --name twiddle

COPY addon-build-configs/$EMBER_VERSION/bower.json /addon-builder/bower.json
COPY addon-build-configs/$EMBER_VERSION/package.json /addon-builder/package.json

COPY addon-builder/ember-cli-build.js /addon-builder/ember-cli-build.js
COPY addon-builder/build-addon.sh /addon-builder/build-addon.sh
COPY addon-builder/upload.js /addon-builder/upload.js
ARG BUILDER_ENVIRONMENT
COPY config/$BUILDER_ENVIRONMENT.js /addon-builder/build-config.js

ENTRYPOINT ["/addon-builder/build-addon.sh"]
EXPOSE 4200
