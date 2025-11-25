#!/bin/sh

# Start game server in background
cd /app/server
node game-server.js &

# Start nginx in foreground
nginx -g 'daemon off;'
