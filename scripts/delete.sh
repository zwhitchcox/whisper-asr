#!/bin/bash
set -eux

# Get the root directory name of the git project
GIT_ROOT_DIR=$(git rev-parse --show-toplevel)
DROPLET_NAME=$(basename "$GIT_ROOT_DIR")

# Find the Droplet ID by name
droplet_id=$(doctl compute droplet list -o json | jq -r --arg DROPLET_NAME "$DROPLET_NAME" '.[] | select(.name == $DROPLET_NAME) | .id')

if [[ -z "$droplet_id" ]]; then
    echo "Error: Droplet with name '$DROPLET_NAME' not found." >&2
    exit 1
fi

# Delete the Droplet
doctl compute droplet delete -f "$droplet_id"

echo "Droplet '$DROPLET_NAME' deleted successfully!"
