# littlefs-wasm-preferences

The purpose of this module is to create a LittleFS containing preferences
which can be read by ESP8266 using [vshymanskyy/Preferences](https://github.com/vshymanskyy/Preferences). The filesystem can be uploaded to ESP8266 using
[esptool-js](https://github.com/espressif/esptool-js/).

## Developing

Make sure you have Docker, which is used to build WASM version of LittleFS.

* `git submodule init` to get LittleFS
* `make dev` to create `src/littlefs.js` for satisfy you IDE syntax highlightning.
* `make pack` creates `nemo-k-org-littlefs-wasm-preferences-VERSION.tgz`.

## Building

Run `make all` to build littlefs.wasm and JavaScript code.

## Usage

Get the littlefs image with desired settings:

```
import LittleFSWASMPreferences from '@nemo-k-org/littlefs-wasm-preferences'

getTestLittleFSImage = async (): Promise<Uint8Array> => {
    const preferencesFS = new LittleFSWASMPreferences('testapp', (message: string) => { console.debug(message) })
    preferencesFS.putString('teststr', 'test string preferencesFS')
    preferencesFS.putInt('testint', 67)

    const image = await preferencesFS.getLittleFSImage()

    return image
}
```

Use esptool-js:

```
uploadFirmwareToMicrocontroller = async (firmwareImage: any): Promise<boolean> => {
    const littleFSImage = await this.getTestLittleFSImage()

    const flashOptionsFileArray = [
        {
        data: new Uint8Array(firmwareImage),
        address: 0x0
        },
        {
        data: littleFSImage,
        address: 0xBB000
        }
    ]

    try {
        const flashOptions: FlashOptions = {
        fileArray: flashOptionsFileArray,
        eraseAll: false,
        compress: true,
        flashMode: 'keep',
        flashFreq: 'keep',
        flashSize: FirmwareUploader.ESP01_FLASHSIZE,
        calculateMD5Hash: (image: Uint8Array) =>
            CryptoJS.MD5(
            CryptoJS.lib.WordArray.create(image as unknown as number[])
            ).toString()
        }

        await this.espLoader.writeFlash(flashOptions)
        await this.espLoader.after()
    } catch (e: any) {
        console.error(e)
        this.espLoaderTerminal.writeLine(`Error: ${e.message}`)
        return false
    }

    return true
}
```
