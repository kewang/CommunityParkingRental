#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
cd $(dirname "$0")  # Navigate to the directory containing .nvmrc
node "$@"  # Execute node with all passed arguments
