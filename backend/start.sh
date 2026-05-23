#!/bin/sh
# Start backend from repository root in production
cd "$(dirname "$0")" || exit 1
exec node server.js
