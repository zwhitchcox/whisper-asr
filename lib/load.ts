export type ProgressCallback = (p: number) => void;
export type PrintCallback = (text: string, ...args: any[]) => void;
export type ReadyCallback = (dst: string, buf: Uint8Array) => void;
export type CancelCallback = () => void;

const dbName = "models";
const dbVersion = 1;

export function convertTypedArray(src: ArrayBufferView, type: any): ArrayBufferView {
  const buffer = new ArrayBuffer(src.byteLength);
  return new type(buffer);
}

export async function clearCache(): Promise<void> {
  if (confirm("Are you sure you want to clear the cache?\nAll the models will be downloaded again.")) {
    indexedDB.deleteDatabase(dbName);
  }
}

async function fetchRemote(url: string, cbProgress: ProgressCallback, cbPrint: PrintCallback): Promise<Uint8Array> {
  cbPrint("fetchRemote: downloading with fetch()...");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/octet-stream",
    },
  });

  if (!response.ok) {
    cbPrint("fetchRemote: failed to fetch " + url);
    throw new Error("Failed to fetch");
  }

  const contentLength = response.headers.get("content-length");
  const total = parseInt(contentLength!, 10);
  const reader = response.body!.getReader();

  let chunks: Uint8Array[] = [];
  let receivedLength = 0;
  let progressLast = -1;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
    receivedLength += value.length;

    if (contentLength) {
      cbProgress(receivedLength / total);

      const progressCur = Math.round((receivedLength / total) * 10);
      if (progressCur !== progressLast) {
        cbPrint("fetchRemote: fetching " + 10 * progressCur + "% ...");
        progressLast = progressCur;
      }
    }
  }

  let position = 0;
  const chunksAll = new Uint8Array(receivedLength);

  for (const chunk of chunks) {
    chunksAll.set(chunk, position);
    position += chunk.length;
  }

  return chunksAll;
}

function fetchDataFromDB(url: string, cbPrint: PrintCallback): Promise<Uint8Array | undefined> {
  return new Promise((resolve, reject) => {
    const rq = indexedDB.open(dbName, dbVersion);

    rq.onupgradeneeded = function(event: IDBVersionChangeEvent) {
      const db = (event.target as IDBOpenDBRequest).result;
      if (db.version === 1) {
        const os = db.createObjectStore("models", { autoIncrement: false });
        cbPrint("loadRemote: created IndexedDB " + db.name + " version " + db.version);
      } else {
        // clear the database
        const os = (event.currentTarget as IDBOpenDBRequest).transaction!.objectStore("models");
        os.clear();
        cbPrint("loadRemote: cleared IndexedDB " + db.name + " version " + db.version);
      }
    };

    rq.onsuccess = function(event: Event) {
      const db = (event.target as IDBOpenDBRequest).result;
      const tx = db.transaction(["models"], "readonly");
      const os = tx.objectStore("models")
      const getRq = os.get(url);
      getRq.onsuccess = function(event: Event) {
        cbPrint(`loadRemote: "${url}" is already in the IndexedDB`);
        if (rq.result) {
          resolve(getRq.result);
        } else {
          cbPrint(`loadRemote: "${url}" is not in the IndexedDB`);
          resolve(undefined);
        }
      };

      getRq.onerror = function(event: Event) {
        cbPrint("loadRemote: failed to get data from the IndexedDB");
        reject();
      };
    };

    rq.onerror = function(event: Event) {
      cbPrint("loadRemote: failed to open IndexedDB");
      reject();
    };

    rq.onblocked = function(event: Event) {
      cbPrint("loadRemote: failed to open IndexedDB: blocked");
      reject();
    };
  });
}

async function storeDataInDB(url: string, data: Uint8Array, cbPrint: PrintCallback): Promise<void> {
  return new Promise((resolve, reject) => {
    const rq = indexedDB.open(dbName, dbVersion);
    rq.onsuccess = function(event: Event) {
      const db = (event.target as IDBOpenDBRequest).result;
      const tx = db.transaction(["models"], "readwrite");
      const os = tx.objectStore("models");
      const rq = os.put(data, url);

      rq.onsuccess = function(event: Event) {
        cbPrint(`loadRemote: "${url}" stored in the IndexedDB`);
        resolve();
      };

      rq.onerror = function(event: Event) {
        cbPrint(`loadRemote: failed to store "${url}" in the IndexedDB`);
        reject();
      };
    };

  });
}

export async function loadRemote(
  url: string,
  dst: string,
  size_mb: number,
  cbProgress: ProgressCallback,
  cbReady: ReadyCallback,
  cbCancel: CancelCallback,
  cbPrint: PrintCallback
): Promise<void> {
  if (!navigator.storage || !navigator.storage.estimate) {
    cbPrint("loadRemote: navigator.storage.estimate() is not supported");
  } else {
    const estimate = await navigator.storage.estimate();
    cbPrint("loadRemote: storage quota: " + estimate.quota + " bytes");
    cbPrint("loadRemote: storage usage: " + estimate.usage + " bytes");
  }

  try {
    let data = await fetchDataFromDB(url, cbPrint);
    if (!data) {
      if (!confirm(
        "You are about to download " + size_mb + " MB of data.\n" +
        "The model data will be cached in the browser for future use.\n\n" +
        "Press OK to continue."
      )) {
        cbCancel();
        return;
      }
      data = await fetchRemote(url, cbProgress, cbPrint);
      await storeDataInDB(url, data, cbPrint);
    }
    cbReady(dst, data);
  } catch (err) {
    console.error(err);
    cbCancel();
  }
}


let whisperModuleLoaded = false;
let whisperModulePromise: any;

export function getWhisperModule(
  urlPrefix: string = '/static',
  model: string = 'tiny.en',
  Module: any = {},
) {
  const url = urlPrefix + '/whisper.js';
  const workerUrl = urlPrefix + '/whisper.worker.js';
  Module = {
    mainScriptUrlOrBlob: url,
    locateFile: function (path: string, prefix: string) {
      if (path.endsWith('.worker.js')) {
        return workerUrl;
      }
      return prefix + path;
    },
    print(str: string) {
      Module.onOut?.(str);
    },
    printErr(str: string) {
      Module.onError?.(str);
    },
    set_status(str: string) {
      Module.onStatus?.(str);
    },
    ...Module,
  }

  if (!whisperModuleLoaded) {
    whisperModuleLoaded = true;
    whisperModulePromise = new Promise((resolve, reject) => {
      const scriptEl = document.createElement("script");
      scriptEl.src = url;
      scriptEl.onload = () => {
        // @ts-ignore
        resolve(window.createWhisperModule(Module))
      }
      scriptEl.onerror = () => {
        reject(new Error("Failed to load Whisper module"));
      }
      document.body.appendChild(scriptEl);
    });
  }
  return whisperModulePromise;
}

export async function loadModel(
  modelName: "tiny.en" | "small.en" | "base.en",
  urlPrefix?: string,
  onProgress?: (progress: number) => void
): Promise<any> {
  const Module = await getWhisperModule(urlPrefix || '/static');
  const urls = {
    "tiny.en": urlPrefix + "/models/ggml-tiny.en.bin",
    "small.en": urlPrefix + "/models/ggml-small.en.bin",
    "base.en": urlPrefix + "/models/ggml-base.en.bin",
  };

  const sizes = {
    "tiny.en": 75,
    "base.en": 142,
    "small.en": 466,
  };

  const url = urls[modelName];
  const dst = "whisper.bin";
  const size_mb = sizes[modelName];

  if (!url) {
    throw new Error(`Model "${modelName}" not found`);
  }

  await new Promise<void>((resolve, reject) => {
    loadRemote(
      url,
      dst,
      size_mb,
      onProgress || (() => {}),
      (fname: string, buf: Uint8Array) => {
        // Store the model data in the whisper instance using the FS API
        // If the file exists, delete it
        try {
          Module.FS_unlink(fname);
        } catch (e) {
          // Ignore
        }

        Module.FS_createDataFile("/", fname, buf, true, true);

        resolve();
      },
      reject,
      console.log,
    );
  });
  return Module;
}
