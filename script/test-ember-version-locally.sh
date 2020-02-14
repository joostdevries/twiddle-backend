#!/bin/bash

export EMBER_VERSION=$1
export EMBER_ADDON_NAME=$2
export EMBER_ADDON_VERSION=$3

cd "${0%/*}"
mkdir -p ../tmp
cd ../tmp
mkdir -p $EMBER_VERSION
cd $EMBER_VERSION
cp ../../addon-build-configs/$EMBER_VERSION/* .
npm install
ember init --skip-npm --skip-bower --name twiddle
bower install
cp ../../addon-build-configs/$EMBER_VERSION/* .
npm install --save $EMBER_ADDON_NAME@$EMBER_ADDON_VERSION
ember generate $EMBER_ADDON_NAME
ember build
