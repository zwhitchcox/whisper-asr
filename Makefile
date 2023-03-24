V = 1
ifeq ($(strip $(V)),)
    E = @echo
    Q = @
else
    E = @echo
    Q =
endif

WHISPER_DIR=dep/whisper.cpp
EXAMPLE_DIR=$(WHISPER_DIR)/examples
STREAM_WASM_DIR=$(EXAMPLE_DIR)/stream.wasm
WHISPER_WASM_DIR=$(EXAMPLE_DIR)/whisper.wasm
DIST_DIR=dist
STATIC_DIR=$(DIST_DIR)/static
MODEL_DIR=$(STATIC_DIR)/models
SRC_DIR=src


# models to download
MODELS = tiny.en tiny base.en base small.en small

glue=$(SRC_DIR)/glue

CC = emcc
CFLAGS = -I $(WHISPER_DIR) \
	-pthread \
	-Wall \
	-Wextra \
	-Wpedantic \
	-Wcast-qual \
	-O3 \
	-msimd128 \

WEB_FLAGS = \
    -l embind \
    -s USE_PTHREADS=1 \
		-s PTHREAD_POOL_SIZE=8 \
    -s INITIAL_MEMORY=1024MB \
    -s TOTAL_MEMORY=1024MB \
    -s SINGLE_FILE=1 \
    -s FORCE_FILESYSTEM=1 \
    -s EXPORTED_RUNTIME_METHODS="['out', 'err', 'ccall', 'cwrap']" \
		-s MODULARIZE=1 \
		-s EXPORT_NAME="createWhisperModule" \

NODE_FLAGS = \
    --bind \
    -s USE_PTHREADS=1 \
    -s PTHREAD_POOL_SIZE=8 \
    -s INITIAL_MEMORY=1024MB \
    -s TOTAL_MEMORY=1024MB \
    -s FORCE_FILESYSTEM=1 \
    -s EXPORTED_RUNTIME_METHODS="['out', 'err', 'ccall', 'cwrap']"

OBJS= \
	$(WHISPER_DIR)/whisper.o \
	$(WHISPER_DIR)/ggml.o

all: $(DIST_DIR)/index.js $(STATIC_DIR)/whisper.js $(STATIC_DIR)/models

%.o: %.cpp
	$(E) "  CC      $<"
	$(Q) $(CC) $(CFLAGS) -c $< -o $@

%.o: %.c
	$(E) "  CC      $<"
	$(Q) $(CC) $(CFLAGS) -c $< -o $@
	
$(STATIC_DIR)/whisper.js: $(OBJS) $(glue).o
	mkdir -p $(STATIC_DIR)/stream
	$(E) "  JSGEN    $@"
	$(Q) $(CC) $(CFLAGS) $(WEB_FLAGS) $(OBJS) $(glue).o -o $@ 

$(DIST_DIR)/index.js:
	npx tsc

clean:
	rm -rf $(DIST_DIR) $(STATIC_DIR) $(WHISPER_DIR)/*.o $(STREAM_WASM_DIR)/*.o 

remake: clean all

$(MODEL_DIR):
	for model in $(MODELS); do \
		bash ./dep/whisper.cpp/models/download-ggml-model.sh $$model; \
	done; \
	mkdir -p $(MODEL_DIR); \
	for model in $(MODELS); do \
		cp $(WHISPER_DIR)/models/ggml-$$model.bin $(MODEL_DIR); \
	done \
