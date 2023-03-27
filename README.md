# Whisper ASR
Whisper ASR is a speech recognition library based on Whisper C++ and compiled to WebAssembly. It provides an easy-to-use API for automatic speech recognition (ASR) in web applications. This library is not limited to React and can be used with other JavaScript frameworks or vanilla JavaScript.

Check out the [Live Demo](https://zwhitchcox.dev/whisper-asr) to see it in action.

## Installation
To install the library, run:

```bash
npm install whisper-asr
```

###  Downloading Static Files and Models
Use the CLI included in the Whisper ASR package to download the required static files and models. Check the [CLI for downloading static files and models](#cli-for-downloading-static-files-and-models) section for detailed instructions.

### Configuring Headers for WebAssembly Workers
To allow WebAssembly workers to run correctly, you need to set the following headers for your site:

```
'Cross-Origin-Opener-Policy': 'same-origin',
'Cross-Origin-Embedder-Policy': 'require-corp',
```

These headers ensure that the resources are properly isolated and protected, which is required by the WebAssembly workers.

#### Example configuration for Express.js

If you're using Express.js as your web server, you can set the headers using the following code:

```javascript
const express = require('express');
const app = express();

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// Your other Express.js configurations and routes here...

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
```

Make sure to adapt the headers configuration to your specific web server or hosting platform. Check their documentation for information on how to set custom headers.

## Usage
Here's an example of how to use the library with React:

```typescript
import * as React from 'react';
import { createWhisperStream, WhisperStreamInstance } from 'whisper-asr';

const App: React.FC = () => {
  const [whisperStream, setWhisperStream] = React.useState<WhisperStreamInstance | null>(null);
  const [transcription, setTranscription] = React.useState<string>('');
  const [status, setStatus] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isRecording, setIsRecording] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!whisperStream) {
      createWhisperStream({
        onTranscription: t => setTranscription(prev => prev + t + ' '),
        onProgress: console.log,
        onInfo: console.warn,
        onError: setError,
        onStatusChange: setStatus,
        model: "tiny.en",
      })
      .then(setWhisperStream)
      .catch(setError);
    }
    return () => {
      whisperStream?.stop();
    }
  }, [whisperStream]);

  const handleStart = async () => {
    try {
      setIsRecording(true);
      await whisperStream.start();
    } catch (e) {
      console.error(e);
      setError(e.message);
    }
  };

  const handleStop = async () => {
    try {
      await whisperStream.stop();
    } catch (e) {
      setError(e.message);
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div>
      <h1>Whisper ASR Demo</h1>
      <div>{status}</div>
      {error && <div style={{color: 'red'}}>{error}</div>}
      <button disabled={isRecording || !whisperStream} onClick={handleStart}>Start recording</button>
      <button disabled={!isRecording} onClick={handleStop}>Stop recording</button>
      <div>{transcription}</div>
    </div>
  );
};
```

In this example, the createWhisperStream function is used to create a new WhisperStreamInstance. This instance is used to start and stop recording and manage the transcription process.

## API
* `createWhisperStream(options?: WhisperStreamOptions)`: Promise<WhisperStreamInstance> Creates a new WhisperStreamInstance.

### Options
* `onStatusChange?: (status: string) => void`: Called when the status of the stream changes.
* `onTranscription?: (transcription: string) => void`: Called when a new transcription is available.
* `onError?: (error: string) => void`: Called when an error occurs.
* `onInfo?: (info: string) => void`: Called when an informational message is received.
* `urlPrefix?: string`: The URL prefix for the model files.
* `model?: "tiny.en" | "small.en" | "base.en"`: The model to use for speech recognition. Default is "tiny.en".
* `onProgress?: (progress: number) => void`: Called when the progress of model loading changes.
* `startRecording(whisperStream`: WhisperStreamInstance): Starts recording and processing audio from the user's microphone.
* `whisperStream: WhisperStreamInstance`: The WhisperStreamInstance returned by createWhisperStream.
* `stopRecording(whisperStream`: WhisperStreamInstance) Stops recording and processing audio.
* `whisperStream: WhisperStreamInstance`: The WhisperStreamInstance returned by createWhisperStream.

## Example with Vanilla JavaScript
Here's an example of how to use the library with vanilla JavaScript:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Whisper ASR Demo</title>
  <script type="module">
    import { createWhisperStream, startRecording, stopRecording } from 'whisper-asr';

    let whisperStream = null;
    let transcription = '';

    async function init() {
      try {
        whisperStream = await createWhisperStream({
          onTranscription: (t) => {
            transcription += t + ' ';
            document.getElementById('transcription').innerText = transcription;
          },
          onError: (err) => {
            console.error(err);
          },
          onStatusChange: (status) => {
            document.getElementById('status').innerText = status;
          },
          model: 'tiny.en',
        });
      } catch (err) {
        console.error(err);
      }
    }

    function handleStart() {
      if (whisperStream) {
        startRecording(whisperStream);
      }
    }

    function handleStop() {
      if (whisperStream) {
        stopRecording(whisperStream);
      }
    }

    init();
  </script>
</head>
<body>
  <h1>Whisper ASR Demo</h1>
  <div id="status"></div>
  <button onclick="handleStart()">Start recording</button>
  <button onclick="handleStop()">Stop recording</button>
  <div id="transcription"></div>
</body>
</html>
```

In this example, the init function initializes the whisperStream and starts the transcription process. The handleStart and handleStop functions are used to start and stop recording, respectively.


## CLI for downloading static files and models
Whisper ASR package includes a command-line interface (CLI) to easily download the required static files and ASR models. To use the CLI, follow the steps below:

### Installation
First, make sure that you have the package installed:

```bash
```bash
npm install whisper-asr
```

### Usage
To download the necessary static files and models, run the following command:

```bash
whisper-asr get-static-files <model-names> <destination-directory>
```

* `<model-names>`: A comma-separated list of model names to download, for example: tiny.en,base.en,small.en.
* `<destination-directory>`: The directory where the static files and models will be saved.


For example:

```bash
whisper-asr get-static-files tiny.en,base.en,small.en ./static
```

This command will download the static files and models, and save them in the ./static directory.

### Serving Static Files
Make sure to copy the static files to a location where your web server can serve them. If the urlPrefix is /static, copy the files to a location where the web server will serve them under the /static route.

### Gitignore
Add the `/static` directory (or the directory containing the static files) to your .`gitignore` file to exclude the downloaded files from your version control..

## Contributing
Feel free to open issues or submit pull requests if you have any suggestions or improvements for the library. Contributions are always welcome!
