PWD:=$(shell pwd)
UID:=$(shell id -u)
GID:=$(shell id -g)
BUILD_MODE = prod
#BUILD_MODE = dev
CC=emcc
SOURCES=littlefs/lfs.c littlefs/lfs_util.c lfsapi.c
EXPORTS=_lfs_format,_lfs_mount,_lfs_unmount,_lfs_remove,_lfs_rename,_lfs_stat,_lfs_getattr,_lfs_setattr,_lfs_removeattr,_lfs_file_open,\
	_lfs_file_opencfg,_lfs_file_close,_lfs_file_sync,_lfs_file_read,_lfs_file_write,_lfs_file_seek,_lfs_file_truncate,_lfs_file_tell,\
	_lfs_file_rewind,_lfs_file_size,_lfs_mkdir,_lfs_dir_open,_lfs_dir_close,_lfs_dir_read,_lfs_dir_seek,_lfs_dir_tell,_lfs_dir_rewind,\
	_lfs_fs_size,_lfs_fs_traverse,_new_lfs_config,_new_lfs,_lfs_make_dir,_lfs_write_text,_lfs_write_bytes,_malloc,_free
CFLAGS = -s MODULARIZE=1 -s 'EXPORT_NAME="littlefs"' -s EXPORT_ES6=1 -I littlefs \
	-s 'EXPORTED_FUNCTIONS=$(EXPORTS)' \
	-s EXPORTED_RUNTIME_METHODS="['addFunction', 'cwrap','HEAPU8']" -s ALLOW_TABLE_GROWTH=1 -s ASSERTIONS=0 \
    -DLFS_NAME_MAX=32

all: dist/littlefs.wasm dist/index.js dist/index.d.ts

dist/index.js: eslint src/littlefs.wasm src/index.js src/littlefs-wasm-preferences.ts
	node ./esbuild.$(BUILD_MODE).mjs

dist/index.d.ts: src/index.d.ts
	cp src/index.d.ts dist/index.d.ts

dist/littlefs.wasm: src/littlefs.js
	cp src/littlefs.wasm dist/littlefs.wasm

src/littlefs.js: $(SOURCES) | dist
	docker run --rm -v $(PWD):/src -u $(UID):$(GID) emscripten/emsdk $(CC) -o $@ $(CFLAGS) -s ENVIRONMENT=web $^

dist:
	mkdir $@

.PHONY: eslint
eslint:
	npx eslint "src/**"

.PHONY: pack
pack:
	-rm nemo-k-org-littlefs-wasm-preferences-*.tgz
	npm pack

.PHONY: clean
clean:
	-rm -rf dist
	-rm src/littlefs.*
