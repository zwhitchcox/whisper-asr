import { getWhisperModule, loadModel } from "./load";


interface WhisperStreamCallbacks {
  onStatusChange?: (status: string) => any;
  onTranscription?: (transcription: string) => any;
  onError?: (error: string) => any;
  onInfo?: (info: string) => any;
}

export interface WhisperStreamInstance extends WhisperStreamCallbacks {
  context: AudioContext | null;
  audio: Float32Array | null;
  audio0: Float32Array | null;
  doRecording: boolean;
  startTime: number;
  mediaRecorder: MediaRecorder | null;
  intervalUpdate: any;
  transcribedAll: string;
  nLines: number;
  instance: any;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

export interface WhisperStreamOptions extends WhisperStreamCallbacks {
  urlPrefix?: string;
  model?: "tiny.en" | "small.en" | "base.en",
  onProgress?: (progress: number) => void
}

const infoPrefixes = [
  'stream: ',
  'whisper_model_load: ',
  'whisper_init_from_file_no_state: ',
  'whisper_init_from_file: ',
  'whisper_init_state: ',
];

const isInfo = (str: string) => {
  return infoPrefixes.some(prefix => str.startsWith(prefix));
}

export async function createWhisperStream(options: WhisperStreamOptions = {}): Promise<WhisperStreamInstance> {
  const prefix = options?.urlPrefix || '/static';
  const model = options.model || 'tiny.en';
  const WhisperModule = await getWhisperModule(prefix, model);

  await Promise.all([
    loadModel(model, prefix, options.onProgress),
    WhisperModule.ready
  ])

  WhisperModule.onOut = (str: string) => {
    if (isInfo(str)) {
      options.onInfo?.(str);
    } else if (str.startsWith('transcribed: ')) {
      options.onTranscription?.(str.substr('transcribed: '.length));
    } else {
      console.log('unknown output: ' + str);
    }
  }
  WhisperModule.onError = (str: string) => {
    if (str.startsWith('transcribed: ')) {
      options.onTranscription?.(str.substr('transcribed: '.length));
    } else if (isInfo(str)) {
      options.onInfo?.(str);
    } else {
      options.onError?.(str);
    }
  }
  WhisperModule.onStatusChange = options.onStatusChange;

  let whisperStream: WhisperStreamInstance;
  whisperStream = {
    context: null,
    audio: null,
    audio0: null,
    doRecording: false,
    startTime: 0,
    mediaRecorder: null,
    intervalUpdate: null,
    transcribedAll: '',
    nLines: 0,
    instance: null,
    onStatusChange: options.onStatusChange,
    onTranscription: () => {
      options.onTranscription
    },
    onError: options.onError,
    async start() {
      startRecording(whisperStream);
    },
    async stop() {
      stopRecording(whisperStream);
    },
  };
  return whisperStream;
}

export async function startRecording(whisperStream: WhisperStreamInstance) {
  const kSampleRate = 16000;
  const kRestartRecording_s = 120;
  const kIntervalAudio_ms = 5000;
  const WhisperModule = await getWhisperModule();

  if (typeof whisperStream.instance !== 'number') {
    whisperStream.instance = await WhisperModule.stream_init('whisper.bin');
  }

  if (!whisperStream.context) {
    whisperStream.context = new AudioContext({
      sampleRate: kSampleRate,
      // @ts-ignore
      channelCount: 1,
      echoCancellation: false,
      autoGainControl: true,
      noiseSuppression: true,
    });
  }

  WhisperModule.stream_set_status("");

  whisperStream.doRecording = true;
  whisperStream.startTime = Date.now();

  let chunks: BlobPart[] = [];
  let mediaStream: MediaStream | null = null;

  navigator.mediaDevices
    .getUserMedia({ audio: true, video: false })
    .then(function(s) {
      mediaStream = s;
      whisperStream.mediaRecorder = new MediaRecorder(mediaStream);
      whisperStream.mediaRecorder.ondataavailable = function(e) {
        chunks.push(e.data);

        const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
        const reader = new FileReader();

        reader.onload = function(event) {
          const buf = new Uint8Array(reader.result as ArrayBuffer);

          if (!whisperStream.context) {
            return;
          }
          whisperStream.context.decodeAudioData(
            buf.buffer,
            function(audioBuffer) {
              const offlineContext = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);
              const source = offlineContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(offlineContext.destination);
              source.start(0);

              offlineContext.startRendering().then(function(renderedBuffer) {
                whisperStream.audio = renderedBuffer.getChannelData(0);

                const audioAll = new Float32Array(whisperStream.audio0 == null ? whisperStream.audio.length : whisperStream.audio0.length + whisperStream.audio.length);
                if (whisperStream.audio0 != null) {
                  audioAll.set(whisperStream.audio0, 0);
                }
                audioAll.set(whisperStream.audio, whisperStream.audio0 == null ? 0 : whisperStream.audio0.length);

                WhisperModule.stream_set_audio(whisperStream.instance, audioAll);
              });
            },
            function(e) {
              whisperStream.audio = null;
            }
          );
        };

        reader.readAsArrayBuffer(blob);
      };

      whisperStream.mediaRecorder.onstop = function(e) {
        if (whisperStream.doRecording) {
          setTimeout(function() {
            startRecording(whisperStream);
          });
        }
      };

      whisperStream.mediaRecorder.start(kIntervalAudio_ms);
    })
    .catch(function(err) {
      if (whisperStream.onError) {
        whisperStream.onError("error getting audio mediaStream: " + err);
      }
    });

  const interval = setInterval(function() {
    if (!whisperStream.doRecording) {
      clearInterval(interval);
      if (whisperStream.mediaRecorder) {
        whisperStream.mediaRecorder.stop();
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach(function(track) {
          track.stop();
        });
      }
    }

    // if audio length is more than kRestartRecording_s seconds, restart recording
    if (whisperStream.audio != null && whisperStream.audio.length > kSampleRate * kRestartRecording_s) {
      if (whisperStream.doRecording) {
        clearInterval(interval);
        whisperStream.audio0 = whisperStream.audio;
        whisperStream.audio = null;
        if (whisperStream.mediaRecorder) {
          whisperStream.mediaRecorder.stop();
        }
        if (mediaStream) {
          mediaStream.getTracks().forEach(function(track) {
            track.stop();
          });
        }
      }
    }
  }, 100);
}


export async function stopRecording(whisperStream: WhisperStreamInstance) {
  const WhisperModule = await getWhisperModule();
  WhisperModule.instance = null;
  WhisperModule.stream_set_status("paused");
  whisperStream.doRecording = false;
  whisperStream.audio0 = null;
  whisperStream.audio = null;
  whisperStream.context = null;
}
