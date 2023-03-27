import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { createWhisperStream, WhisperStreamInstance } from '../..';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faMicrophone, faStop } from '@fortawesome/free-solid-svg-icons';
import './styles.css';

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

  const colorBg = isRecording ? 'animate-pulse from-red-700' : 'from-green-600';
  return (

    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 lg:max-w-5xl md:max-w-3xl sm:max-w-xl sm:mx-auto px-4">
        <div className={`absolute inset-0 transition duration-100 ease-in-out bg-gradient-to-r ${colorBg} to-white shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl`}></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <h1 className="text-4xl font-bold text-center mb-8">Whisper ASR Demo</h1>
          <p className="text-lg text-center leading-relaxed mb-8">
              <span className="font-semibold">Whisper ASR</span> is a WebAssembly-based speech recognition library for web applications. Try this demo to explore its powerful ASR capabilities.
          </p>
          <div className="text-center mb-6">{status}</div>
          {progress !== null && progress !== 1 && (
            <div className="text-center mb-6">Loading model {(progress * 100) | 0}%...</div>
          )}
          {error && <div className="text-red-600 mb-6">{error}</div>}

          <div className="flex justify-center mb-6">

            {!isRecording && whisperStream && (
              <button
                disabled={isRecording || !whisperStream}
                onClick={handleStart}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow transition duration-100 ease-in-out mr-2"
              >

                <FontAwesomeIcon icon={faMicrophone} className="mr-2" />
                Start recording
              </button>
            )}
            {isRecording && (
              <button
                disabled={!isRecording}
                onClick={handleStop}
                className="bg-red-700 hover:bg-red-800 text-white font-semibold py-2 px-4 rounded shadow transition duration-200 ease-in-out mr-2"
              >
                <FontAwesomeIcon icon={faStop} className="mr-2" />
                Stop recording
              </button>
            )}
          </div>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Transcription</h2>
            <div className="bg-gray-100 p-4 rounded shadow">
              <div className="text-center">
                {transcription || (isRecording ? 'Waiting for audio...' : 'The transcription will appear here once you start recording.')}
              </div>
            </div>
          </div>
          <div className="text-center">
            <a
              href="https://github.com/zwhitchcox/whisper-asr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-900 hover:text-gray-600"
            >
              <FontAwesomeIcon icon={faGithub} size="2x" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <App />
);
