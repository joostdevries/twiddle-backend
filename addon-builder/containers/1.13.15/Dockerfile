FROM mhart/alpine-node:5.7.0

RUN apk --update add git
RUN npm install -g bower@1.7.7

RUN mkdir /addon-builder
WORKDIR /addon-builder

COPY bower.json /addon-builder/bower.json
COPY package.json /addon-builder/package.json

RUN npm install
RUN bower --allow-root install
RUN ln -s /addon-builder/node_modules/ember-cli/bin/ember /bin/ember

COPY app /addon-builder/app
COPY config /addon-builder/config
COPY public /addon-builder/public
COPY tests /addon-builder/tests
COPY vendor /addon-builder/vendor
COPY ember-cli-build.js /addon-builder/ember-cli-build.js
COPY build-addon.sh /addon-builder/build-addon.sh

ENTRYPOINT ['/addon-builder/build-addon.sh']
EXPOSE 4200