import createLittleFS from './littlefs'
import { Buffer } from 'buffer'

import { PreferenceType, Preference } from '.'

class LittleFSWASMPreferences {
  namespace: string
  fnProgress: Function | null
  preferences: Preference[]

  constructor (namespace: string, fnProgress?: Function) {
    this.namespace = namespace
    this.fnProgress = null

    if (typeof fnProgress === 'function') {
      this.fnProgress = fnProgress
    } else {
      console.error(`LittleFSWASMPreferecens got progress function, but its type is ${typeof fnProgress}. Continuing without progress function`)
    }

    this.preferences = []
  }

  progressWrite = (message: string) => {
    if (this.fnProgress) {
      this.fnProgress(message)
    }
  }

  progressWriteLine = (message: string) => {
    this.progressWrite(`${message}\n`)
  }

  putString = (key: string, value: string) => {
    this.preferences.push({key, value})
  }

  putInt = (key: string, value: number) => {
    const buffer: Buffer = Buffer.alloc(4)
    buffer.writeInt32LE(value, 0)
    this.preferences.push({key, value: buffer})
  }

  put = (key: string, value: number|string, type: PreferenceType) => {
    if (type === 'string') {
      if (typeof value === 'string') {
        this.putString(key, value)
      } else {
        throw new Error(`littlefs-wasm-preferences: Tried to put value "${value}" of type "${typeof value}" to key "${key}"`)
      }
    }

    if (type === 'int') {
      if (typeof value === 'number') {
        this.putInt(key, value)
      } else if (typeof value === 'string') {
        const valueNumber = +value
        if (isNaN(valueNumber)) {
          throw new Error(`littlefs-wasm-preferences: tried to put value "${value}" as type int, but it is not a number`)
        }
        this.putInt(key, valueNumber)
      } else {
        throw new Error(`littlefs-wasm-preferences: tried to put value "${value}" of type "${typeof value}" to key "${key}"`)
      }
    }
  }

  getLittleFSImage = async (): Promise<Uint8Array> => {
    console.debug('creating fs')

    const BLOCK_SIZE = 4096;
    const PROG_SIZE = 256;
    const BLOCK_COUNT = 64;

    const littlefs = await createLittleFS({locateFile: () => '/littlefs.wasm'})

    const flash = new Uint8Array(BLOCK_SIZE * BLOCK_COUNT);

    const flashRead = (
      _cfg: number,
      block: number,
      offset: number,
      buffer: number,
      size: number,
    ): number => {
      const start = block * BLOCK_SIZE + offset;
      littlefs.HEAPU8.set(flash.subarray(start, start + size), buffer);
      return 0;
    };

    const flashProg = (
      _cfg: number,
      block: number,
      offset: number,
      buffer: number,
      size: number,
    ): number => {
      const start = block * BLOCK_SIZE + offset;
      flash.set(littlefs.HEAPU8.subarray(buffer, buffer + size), start);
      return 0;
    };

    const flashErase = (_cfg: number, block: number): number => {
      const start = block * BLOCK_SIZE;
      flash.fill(0xff, start, start + BLOCK_SIZE);
      return 0;
    };

    const flashSync = (_cfg: number): number => {
      console.debug('flashSync cfg', _cfg)
      return 0
    };

    const readFn = littlefs.addFunction(flashRead, "iiiiii")
    const progFn = littlefs.addFunction(flashProg, "iiiiii")
    const eraseFn = littlefs.addFunction(flashErase, "iii")
    const syncFn = littlefs.addFunction(flashSync, "ii")

    const config = littlefs._new_lfs_config(
      readFn,
      progFn,
      eraseFn,
      syncFn,
      BLOCK_COUNT,
      BLOCK_SIZE,
      PROG_SIZE,
    )

    this.progressWrite('Creating littlefs... ')
    const lfs = littlefs._new_lfs()

    this.progressWrite('formatting... ')
    littlefs._lfs_format(lfs, config)

    this.progressWrite('mounting... ')
    littlefs._lfs_mount(lfs, config)

    this.progressWrite('creating directories... ')
    const mkdir = littlefs.cwrap(
      'lfs_make_dir',
      'number',
      ['number', 'string']
    )

    const result_mkdirNvs: number = mkdir(lfs, 'nvs')
    if (result_mkdirNvs < 0) {
      throw new Error(`mkdir returns error code: ${result_mkdirNvs}`)
    }

    const result_mkdirTestapp: number = mkdir(lfs, `nvs/${this.namespace}`)
    if (result_mkdirTestapp < 0) {
      throw new Error(`mkdir returns error code: ${result_mkdirTestapp}`)
    }

    this.progressWrite('writing files... ')
    const fileWriteText = littlefs.cwrap(
      'lfs_write_text',
      null,
      ['number', 'string', 'string']
    )

    const fileWriteBytes = littlefs.cwrap(
      'lfs_write_bytes',
      null,
      ['number', 'string', 'number', 'number']
    )

    for (const preference of this.preferences) {
      const filePath = `nvs/${this.namespace}/${preference.key}`

      if (typeof preference.value === 'string') {
        fileWriteText(lfs, filePath, preference.value, preference.value.length)
      } else {
          const ptr = littlefs._malloc(preference.value.length)
          littlefs.HEAPU8.set(preference.value, ptr)
          try {
            fileWriteBytes(lfs, filePath, ptr, preference.value.length)
          } finally {
            littlefs._free(ptr)
          }
      }
    }

    this.progressWrite('unmounting... ')
    littlefs._lfs_unmount(lfs)

    this.progressWrite('done')

    return flash
  }
}

export default LittleFSWASMPreferences
