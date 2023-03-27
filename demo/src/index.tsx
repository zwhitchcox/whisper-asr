import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import {createWhisperStream, WhisperStreamInstance} from '../..';

const App: React.FC = () => {
  const [whisperStream, setWhisperStream] = React.useState<WhisperStreamInstance | null>(null);
  const [transcription, setTranscription] = React.useState<string>('');
  const [status, setStatus] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isRecording, setIsRecording] = React.useState<boolean>(false);
  const [progress, setProgress] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!whisperStream) {
      createWhisperStream({
        onTranscription: t => setTranscription(prev => prev + t + ' '),
        onInfo: console.warn,
        onError: setError,
        onStatusChange: setStatus,
        model: "tiny.en",
        urlPrefix: process.env.NODE_ENV === 'development' ? '/static' : '/whisper-asr/static',
        onProgress: setProgress,
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
      {progress !== null && progress !== 1 && <div>Loading model {progress*100|0}%...</div>}
      {error && <div style={{color: 'red'}}>{error}</div>}
      <button disabled={isRecording || !whisperStream} onClick={handleStart}>Start recording</button>
      <button disabled={!isRecording} onClick={handleStop}>Stop recording</button>
      <div>{transcription}</div>
    </div>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <App />
);
