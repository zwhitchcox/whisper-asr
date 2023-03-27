#!/bin/bash

set -euxo pipefail

get_droplet_ip_by_name() {
  local name="$1"
  doctl compute droplet list --format Name,PublicIPv4 --no-header | awk -v droplet_name="$name" '$1 == droplet_name {print $2; exit}'
}

droplet_ip=$(get_droplet_ip_by_name $DROPLET_NAME)

run_remote() {
  local script="$1"
  shift

  # Copy setup script to Droplet
  scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ./scripts/helpers/remote/$script.sh root@$droplet_ip:/root/$script.sh

  # Run setup script on Droplet
  ssh -o StrictHostKeyChecking=no root@$droplet_ip "bash /root/$script.sh $@"
}


run_remote download-models
