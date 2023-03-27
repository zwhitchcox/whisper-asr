#!/bin/bash

set -euxo pipefail

DIR=/var/www/whisper-asr/static/models
mkdir -p $DIR
cd $DIR
for model in tiny.en.bin tiny.bin base.en.bin base.bin; do 
    if [ -f ggml-$model ]; then
        echo "Skipping $model"
        continue
    fi
    curl -L https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-$model -o ggml-$model
done
