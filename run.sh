#!/bin/bash

# Start a local server for the Angular app
angular-http-server --path ./dist/task-manager/browser/ -p 64300 &

# Wait for the server to start

# Run the Electron app
pnpm electron ./
