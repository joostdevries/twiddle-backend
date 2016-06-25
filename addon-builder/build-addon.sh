#!/bin/sh
echo "Installing $ADDON_NAME@$ADDON_VERSION..."
ember install "$ADDON_NAME@$ADDON_VERSION" > ember.log 2>&1
INSTALL_STATUS=$?
echo "Building $ADDON_NAME@$ADDON_VERSION..."
ember build >> ember.log 2>&1
BUILD_STATUS=$?
node upload.js $INSTALL_STATUS $BUILD_STATUS
