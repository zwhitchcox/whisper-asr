#!/bin/bash

set -euxo pipefail

bash scripts/helpers/create-droplet.sh
bash scripts/helpers/setup-droplet.sh
bash scripts/helpers/generate-key-pair.sh

echo "Provisioning complete!"
