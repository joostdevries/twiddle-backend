#!/bin/sh
echo "Installing $ADDON_NAME@$ADDON_VERSION..."
ember install "$ADDON_NAME@$ADDON_VERSION" > ember.log
echo "Building $ADDON_NAME@$ADDON_VERSION..."
ember build > ember.log
node upload.js $?
