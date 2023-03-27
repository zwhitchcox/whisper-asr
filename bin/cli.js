#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const argv = yargs(hideBin(process.argv))
  .command(
    'get-static-files <model-names..> <destination-directory>',
    'Download static files and models for whisper-asr',
    (yargs) => {
      yargs
        .positional('model-names', {
          describe: 'Comma separated model names to download',
          type: 'string',
          example: 'tiny.en,base.en,small.en',
        })
        .positional('destination-directory', {
          describe: 'Directory to save the static files and models',
          type: 'string',
        })
    },
    async (argv) => {
      let { modelNames, destinationDirectory } = argv;
      modelNames = modelNames.split(',');

      const staticPath = path.join(__dirname, '../dist/static');
      const modelsPath = path.join(destinationDirectory, 'models');

      // Copy static files
      await fs.copy(staticPath, destinationDirectory);
      console.log(`Static files copied to ${destinationDirectory}`);

      // Create models directory
      await fs.ensureDir(modelsPath);

      // Download models
      const modelBaseURL =
        'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-';

      for (const modelName of modelNames) {
        const modelURL = `${modelBaseURL}${modelName}.bin`;
        const modelDestPath = path.join(modelsPath, `${modelName}.bin`);

        try {
          const response = await axios.get(modelURL, {
            responseType: 'arraybuffer',
          });
          await fs.writeFile(modelDestPath, response.data);
          console.log(`Downloaded and saved model: ${modelName}`);
        } catch (error) {
          console.error(`Error downloading model ${modelName}:`, error.message);
        }
      }
    }
  )
  .demandCommand(1, 'You must provide a valid command')
  .help().argv;

