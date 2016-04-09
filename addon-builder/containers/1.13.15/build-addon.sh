#!/bin/sh
echo "Building $ADDON_NAME@$ADDON_VERSION..."

ember install "$ADDON_NAME@$ADDON_VERSION"
ember build