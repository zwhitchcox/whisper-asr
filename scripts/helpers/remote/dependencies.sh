#!/bin/bash
#
set -euxo pipefail

wait_for_dpkg_lock() {
    # Wait until dpkg lock is released
    while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1 ; do
        echo "Waiting for another process to release the dpkg lock..."
        sleep 1
    done
}

# Install dependencies
wait_for_dpkg_lock
apt-get update -q
wait_for_dpkg_lock
apt-get install -y git nginx
