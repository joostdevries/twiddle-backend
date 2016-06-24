#!/bin/sh
echo "Installing $ADDON_NAME@$ADDON_VERSION..."
ember install "$ADDON_NAME@$ADDON_VERSION" > ember.log
INSTALL_STATUS=$?
echo "Building $ADDON_NAME@$ADDON_VERSION..."
ember build >> ember.log
BUILD_STATUS=$?
node upload.js $INSTALL_STATUS $BUILD_STATUS
