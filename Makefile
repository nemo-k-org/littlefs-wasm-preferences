PWD:=$(shell pwd)
UID:=$(shell id -u)
GID:=$(shell id -g)
BUILD_MODE ?= prod
CC=emcc
SOURCES=littlefs/lfs.c littlefs/lfs_util.c lfsapi.c
EXPORTS=_lfs_format,_lfs_mount,_lfs_unmount,_lfs_remove,_lfs_rename,_lfs_stat,_lfs_getattr,_lfs_setattr,_lfs_removeattr,_lfs_file_open,\
	_lfs_file_opencfg,_lfs_file_close,_lfs_file_sync,_lfs_file_read,_lfs_file_write,_lfs_file_seek,_lfs_file_truncate,_lfs_file_tell,\
	_lfs_file_rewind,_lfs_file_size,_lfs_mkdir,_lfs_dir_open,_lfs_dir_close,_lfs_dir_read,_lfs_dir_seek,_lfs_dir_tell,_lfs_dir_rewind,\
	_lfs_fs_size,_lfs_fs_traverse,_new_lfs_config,_new_lfs,_lfs_make_dir,_lfs_write_file
CFLAGS = -s MODULARIZE=1 -s 'EXPORT_NAME="littlefs"' -s EXPORT_ES6=1 -I littlefs \
	-s 'EXPORTED_FUNCTIONS=$(EXPORTS)' \
	-s EXPORTED_RUNTIME_METHODS="['addFunction', 'cwrap','HEAPU8']" -s ALLOW_TABLE_GROWTH=1 -s ASSERTIONS=0 \
    -DLFS_NAME_MAX=32

docker:
	docker run --rm -v $(PWD):/src -u $(UID):$(GID) emscripten/emsdk make all

dev: BUILD_MODE := dev
dev: src/littlefs.js eslint all

all: dist/littlefs.wasm dist/index.js dist/index.d.ts

dist/index.js: FORCE
	node ./esbuild.$(BUILD_MODE).mjs

dist/index.d.ts: src/index.d.ts
	cp src/index.d.ts dist/index.d.ts

dist/littlefs.wasm: dev
	cp src/littlefs.wasm dist/littlefs.wasm

src/littlefs.js: $(SOURCES) | dist
	$(CC) -o $@ $(CFLAGS) -s ENVIRONMENT=web $^

dist:
	mkdir $@

.PHONY: eslint
eslint:
	npx eslint "src/**"

.PHONY: pack
pack:
	npm pack

clean:
	rm -rf dist

.PHONY: FORCE
FORCE:
