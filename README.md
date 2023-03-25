# Whisper ASR
Whisper ASR is a speech recognition library based on Whisper C++ and compiled to WebAssembly. It provides an easy-to-use API for automatic speech recognition (ASR) in web applications. This library is not limited to React and can be used with other JavaScript frameworks or vanilla JavaScript.

Check out the [Live Demo](https://whisper-asr.zwhitchcox.dev) to see it in action.

## Installation
To install the library, run:


```bash
npm install whisper-asr
```

## Usage
Here's an example of how to use the library with React:

```javascript
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

## Contributing
Feel free to open issues or submit pull requests if you have any suggestions or improvements for the library. Contributions are always welcome!
