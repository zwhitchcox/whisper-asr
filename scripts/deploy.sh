#!/bin/bash
set -eux

# Variables
DIST_DIR="demo/dist"
STATIC_DIR="dist/static"
REMOTE_DIR="/var/www/whisper-asr"

get_droplet_ip_by_name() {
  local name="$1"
  doctl compute droplet list --format Name,PublicIPv4 --no-header | awk -v droplet_name="$name" '$1 == droplet_name {print $2; exit}'
}

DROPLET_IP=$(get_droplet_ip_by_name "$DROPLET_NAME")

# copy the static assets to the dist directory
cp -r "$STATIC_DIR" "$DIST_DIR"

# Rsync the static assets
echo "Syncing site assets with the DigitalOcean droplet..."
rsync -avz --exclude "static/models/" --delete --progress -e "ssh" "$DIST_DIR/" "$DROPLET_USERNAME@$DROPLET_IP:$REMOTE_DIR/"


echo "Downloading models..."
bash scripts/helpers/download-models.sh

echo "Deployment complete!"
