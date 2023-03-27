#!/bin/bash

# Create Droplet
droplet_id=$(doctl compute droplet create $DROPLET_NAME --size $DROPLET_SIZE --image $DROPLET_IMAGE --region $DROPLET_REGION --format ID --no-header --wait --ssh-keys $(get_fingerprint))

# Get Droplet IP address
droplet_ip=$(doctl compute droplet get $droplet_id --format PublicIPv4 --no-header)

