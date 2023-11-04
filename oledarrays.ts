
namespace oledssd1315 {

    let x20: string[], x30: string[], x40: string[], x50: string[], x60: string[], x70: string[]

    //% group="Zeichensatz aus Arrays laden"
    //% block="Arrays laden - Zeichencodes | aus calliope-net/oled-eeprom | 20-2F %p20 30-3F %p30 40-4F %p40 50-5F %p50 60-6F %p60 70-7F %p70" subcategory="Arrays"
    export function ladeArrays(p20: string[], p30: string[], p40: string[], p50: string[], p60: string[], p70: string[]) {
        x20 = p20; x30 = p30; x40 = p40; x50 = p50; x60 = p60; x70 = p70
    }

    export function getPixel8ByteArray(pCharCode: number) {
        let charCodeArray: string[]
        switch (pCharCode & 0xF0) {
            //case 0x00: { charCodeArray = extendedCharacters; break; }
            case 0x20: { charCodeArray = x20; break; } // 16 string-Elemente je 8 Byte = 128
            case 0x30: { charCodeArray = x30; break; }
            case 0x40: { charCodeArray = x40; break; }
            case 0x50: { charCodeArray = x50; break; }
            case 0x60: { charCodeArray = x60; break; }
            case 0x70: { charCodeArray = x70; break; }
            //default: { charCodeArray.length = 0 }
        }
        if (charCodeArray.length == 8)
            return Buffer.fromUTF8(charCodeArray.get(pCharCode & 0x0F))
        else
            return Buffer.fromUTF8("\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF")
    }

} // oledarrays.ts
