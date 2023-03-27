#!/bin/bash

# Get the hostname
hostname=$(hostname)

# Get the public key
public_key=$(cat ~/.ssh/id_rsa.pub)

# Add the key to DigitalOcean
doctl compute ssh-key create "$hostname" --public-key "$public_key"
