
//% color=#0000BF icon="\uf108" block="OLED EEPROM" weight=20
namespace oledeeprom
/* 230907

*/ {
    export enum eADDR_EEPROM { EEPROM = 0x50 }
    export enum eADDR_LOG { LOG_Qwiic = 0x2A, LOG_Qwiic_x29 = 0x29 }

    export enum eCharCodeArray {
        //% block="x00_x0F extendedCharacters"
        x00_x0F,
        x20_x2F, x30_x3F, x40_x4F, x50_x5F, x60_x6F, x70_x7F
    }


    // ========== group="EEPROM aus Char-Array im Code brennen"

    //% group="EEPROM aus Char-Array im Code brennen"
    //% block="i2c %pADDR auf Page %page <- 128 Byte=16 Zeichen-Codes %pzArray schreiben"
    //% pADDR.shadow="oledeeprom_eADDR"
    // page.shadow="oledeeprom_pageAdr"
    //% page.min=0 page.max=511 page.defl=496
    //% inlineInputMode=inline
    export function writeEEPROM(pADDR: number, page: number, pCharCodeArray: eCharCodeArray) {
        let charCodeArray: string[] = []
        switch (pCharCodeArray) {
            case eCharCodeArray.x00_x0F: { charCodeArray = extendedCharacters; break; }
            case eCharCodeArray.x20_x2F: { charCodeArray = basicFontx20; break; } // 16 string-Elemente je 8 Byte = 128
            case eCharCodeArray.x30_x3F: { charCodeArray = basicFontx30; break; }
            case eCharCodeArray.x40_x4F: { charCodeArray = basicFontx40; break; }
            case eCharCodeArray.x50_x5F: { charCodeArray = basicFontx50; break; }
            case eCharCodeArray.x60_x6F: { charCodeArray = basicFontx60; break; }
            case eCharCodeArray.x70_x7F: { charCodeArray = basicFontx70; break; }
        }
        if (charCodeArray.length == 16) {
            let bu = Buffer.create(130) // 130
            bu.setNumber(NumberFormat.UInt16BE, 0, page * 128)
            for (let i = 0; i <= 15; i++) {
                for (let j = 0; j <= 7; j++) {
                    bu.setUint8(2 + i * 8 + j, charCodeArray[i].charCodeAt(j))
                }
            }
            oledeeprom_i2cWriteBufferError = pins.i2cWriteBuffer(pADDR, bu)
            control.waitMicros(50000) // 50ms
        }
    }

    // ========== //% group="EEPROM Adresse 0000-FFFF in Page-Nummer 0-511 umrechnen"

    //% group="EEPROM Adresse 0000-FFFF in Page-Nummer 0-511 umrechnen"
    //% blockId=oledeeprom_pageAdr
    //% block="Page %x4 %x3"
    //% x4.defl=oledeeprom.eH4.F000
    //% x3.defl=oledeeprom.eH3.x800
    export function pageAdr(x4: eH4, x3: eH3) { return (x4 + x3) / 128 }

    export enum eH3 {
        //% block="000"
        x000 = 0x000,
        //% block="080"
        x080 = 0x080,
        //% block="100"
        x100 = 0x100,
        //% block="180"
        x180 = 0x180,
        //% block="200"
        x200 = 0x200,
        //% block="280"
        x280 = 0x280,
        //% block="300"
        x300 = 0x300,
        //% block="380"
        x380 = 0x380,
        //% block="400"
        x400 = 0x400,
        //% block="480"
        x480 = 0x480,
        //% block="500"
        x500 = 0x500,
        //% block="580"
        x580 = 0x580,
        //% block="600"
        x600 = 0x600,
        //% block="680"
        x680 = 0x680,
        //% block="700"
        x700 = 0x700,
        //% block="780"
        x780 = 0x780,
        //% block="800"
        x800 = 0x800,
        //% block="880"
        x880 = 0x880,
        //% block="900"
        x900 = 0x900,
        //% block="980"
        x980 = 0x980,
        A00 = 0xA00, A80 = 0xA80, B00 = 0xB00, B80 = 0xB80,
        C00 = 0xC00, C80 = 0xC80, D00 = 0xD00, D80 = 0xD80, E00 = 0xE00, E80 = 0xE80, F00 = 0xF00, F80 = 0xF80
    }
    export enum eH4 {
        //% block="0000"
        x0000 = 0x0000,
        //% block="1000"
        x1000 = 0x1000,
        //% block="2000"
        x2000 = 0x2000,
        //% block="3000"
        x3000 = 0x3000,
        //% block="4000"
        x4000 = 0x4000,
        //% block="5000"
        x5000 = 0x5000,
        //% block="6000"
        x6000 = 0x6000,
        //% block="7000"
        x7000 = 0x7000,
        //% block="8000"
        x8000 = 0x8000,
        //% block="9000"
        x9000 = 0x9000,
        A000 = 0xA000, B000 = 0xB000, C000 = 0xC000, D000 = 0xD000, E000 = 0xE000, F000 = 0xF000
    }

    const basicFontx20: string[] = [
        "\x00\x00\x00\x00\x00\x00\x00\x00", // " "
        "\x00\x00\x5F\x00\x00\x00\x00\x00", // "!"
        "\x00\x00\x07\x00\x07\x00\x00\x00", // """
        "\x00\x14\x7F\x14\x7F\x14\x00\x00", // "#"
        "\x00\x24\x2A\x7F\x2A\x12\x00\x00", // "$"
        "\x00\x23\x13\x08\x64\x62\x00\x00", // "%"
        "\x00\x36\x49\x55\x22\x50\x00\x00", // "&"
        "\x00\x00\x05\x03\x00\x00\x00\x00", // "'"
        "\x00\x1C\x22\x41\x00\x00\x00\x00", // "("
        "\x00\x41\x22\x1C\x00\x00\x00\x00", // ")"
        "\x00\x08\x2A\x1C\x2A\x08\x00\x00", // "*"
        "\x00\x08\x08\x3E\x08\x08\x00\x00", // "+"
        "\x00\xA0\x60\x00\x00\x00\x00\x00", // ","
        "\x00\x08\x08\x08\x08\x08\x00\x00", // "-"
        "\x00\x60\x60\x00\x00\x00\x00\x00", // "."
        "\x00\x20\x10\x08\x04\x02\x00\x00", // "/"
    ]
    const basicFontx30: string[] = [
        "\x00\x3E\x51\x49\x45\x3E\x00\x00", // "0"
        "\x00\x00\x42\x7F\x40\x00\x00\x00", // "1"
        "\x00\x62\x51\x49\x49\x46\x00\x00", // "2"
        "\x00\x22\x41\x49\x49\x36\x00\x00", // "3"
        "\x00\x18\x14\x12\x7F\x10\x00\x00", // "4"
        "\x00\x27\x45\x45\x45\x39\x00\x00", // "5"
        "\x00\x3C\x4A\x49\x49\x30\x00\x00", // "6"
        "\x00\x01\x71\x09\x05\x03\x00\x00", // "7"
        "\x00\x36\x49\x49\x49\x36\x00\x00", // "8"
        "\x00\x06\x49\x49\x29\x1E\x00\x00", // "9"
        "\x00\x00\x36\x36\x00\x00\x00\x00", // ":"
        "\x00\x00\xAC\x6C\x00\x00\x00\x00", // ";"
        "\x00\x08\x14\x22\x41\x00\x00\x00", // "<"
        "\x00\x14\x14\x14\x14\x14\x00\x00", // "="
        "\x00\x41\x22\x14\x08\x00\x00\x00", // ">"
        "\x00\x02\x01\x51\x09\x06\x00\x00", // "?"
    ]
    const basicFontx40: string[] = [
        "\x00\x32\x49\x79\x41\x3E\x00\x00", // "@" 32
        "\x00\x7E\x09\x09\x09\x7E\x00\x00", // "A"   33
        "\x00\x7F\x49\x49\x49\x36\x00\x00", // "B"
        "\x00\x3E\x41\x41\x41\x22\x00\x00", // "C"
        "\x00\x7F\x41\x41\x22\x1C\x00\x00", // "D"
        "\x00\x7F\x49\x49\x49\x41\x00\x00", // "E"
        "\x00\x7F\x09\x09\x09\x01\x00\x00", // "F"
        "\x00\x3E\x41\x41\x51\x72\x00\x00", // "G"
        "\x00\x7F\x08\x08\x08\x7F\x00\x00", // "H"
        "\x00\x41\x7F\x41\x00\x00\x00\x00", // "I"
        "\x00\x20\x40\x41\x3F\x01\x00\x00", // "J"
        "\x00\x7F\x08\x14\x22\x41\x00\x00", // "K"
        "\x00\x7F\x40\x40\x40\x40\x00\x00", // "L"
        "\x00\x7F\x02\x0C\x02\x7F\x00\x00", // "M"
        "\x00\x7F\x04\x08\x10\x7F\x00\x00", // "N"
        "\x00\x3E\x41\x41\x41\x3E\x00\x00", // "O"
    ]
    const basicFontx50: string[] = [
        "\x00\x7F\x09\x09\x09\x06\x00\x00", // "P"
        "\x00\x3E\x41\x51\x21\x5E\x00\x00", // "Q"
        "\x00\x7F\x09\x19\x29\x46\x00\x00", // "R"
        "\x00\x26\x49\x49\x49\x32\x00\x00", // "S"
        "\x00\x01\x01\x7F\x01\x01\x00\x00", // "T"
        "\x00\x3F\x40\x40\x40\x3F\x00\x00", // "U"
        "\x00\x1F\x20\x40\x20\x1F\x00\x00", // "V"
        "\x00\x3F\x40\x38\x40\x3F\x00\x00", // "W"
        "\x00\x63\x14\x08\x14\x63\x00\x00", // "X"
        "\x00\x03\x04\x78\x04\x03\x00\x00", // "Y"
        "\x00\x61\x51\x49\x45\x43\x00\x00", // "Z"
        "\x00\x7F\x41\x41\x00\x00\x00\x00", // """
        "\x00\x02\x04\x08\x10\x20\x00\x00", // "\"
        "\x00\x41\x41\x7F\x00\x00\x00\x00", // """
        "\x00\x04\x02\x01\x02\x04\x00\x00", // "^"
        "\x00\x80\x80\x80\x80\x80\x00\x00", // "_"
    ]
    const basicFontx60: string[] = [
        "\x00\x01\x02\x04\x00\x00\x00\x00", // "`"
        "\x00\x20\x54\x54\x54\x78\x00\x00", // "a"
        "\x00\x7F\x48\x44\x44\x38\x00\x00", // "b"
        "\x00\x38\x44\x44\x28\x00\x00\x00", // "c"
        "\x00\x38\x44\x44\x48\x7F\x00\x00", // "d"
        "\x00\x38\x54\x54\x54\x18\x00\x00", // "e"
        "\x00\x08\x7E\x09\x02\x00\x00\x00", // "f"
        "\x00\x18\xA4\xA4\xA4\x7C\x00\x00", // "g"
        "\x00\x7F\x08\x04\x04\x78\x00\x00", // "h"
        "\x00\x00\x7D\x00\x00\x00\x00\x00", // "i"
        "\x00\x80\x84\x7D\x00\x00\x00\x00", // "j"
        "\x00\x7F\x10\x28\x44\x00\x00\x00", // "k"
        "\x00\x41\x7F\x40\x00\x00\x00\x00", // "l"
        "\x00\x7C\x04\x18\x04\x78\x00\x00", // "m"
        "\x00\x7C\x08\x04\x7C\x00\x00\x00", // "n"
        "\x00\x38\x44\x44\x38\x00\x00\x00", // "o"
    ]
    const basicFontx70: string[] = [
        "\x00\xFC\x24\x24\x18\x00\x00\x00", // "p"
        "\x00\x18\x24\x24\xFC\x00\x00\x00", // "q"
        "\x00\x00\x7C\x08\x04\x00\x00\x00", // "r"
        "\x00\x48\x54\x54\x24\x00\x00\x00", // "s"
        "\x00\x04\x7F\x44\x00\x00\x00\x00", // "t"
        "\x00\x3C\x40\x40\x7C\x00\x00\x00", // "u"
        "\x00\x1C\x20\x40\x20\x1C\x00\x00", // "v"
        "\x00\x3C\x40\x30\x40\x3C\x00\x00", // "w"
        "\x00\x44\x28\x10\x28\x44\x00\x00", // "x"
        "\x00\x1C\xA0\xA0\x7C\x00\x00\x00", // "y"
        "\x00\x44\x64\x54\x4C\x44\x00\x00", // "z"
        "\x00\x08\x36\x41\x00\x00\x00\x00", // "{"
        "\x00\x00\x7F\x00\x00\x00\x00\x00", // "|"
        "\x00\x41\x36\x08\x00\x00\x00\x00", // "}"
        "\x00\x02\x01\x01\x02\x01\x00\x00", // "~" 126
        "\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF"  // 127
    ]

    //const basicFont: string[] = [];

    const extendedCharacters: string[] = [
        "\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF",
        "\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF",
        "\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF",
        "\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF",
        "\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF",
        "\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF",
        "\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF",
        "\x00\x7D\x0A\x09\x0A\x7D\x00\x00", // "Ä"
        "\x00\x3D\x42\x41\x42\x3D\x00\x00", // "Ö"
        "\x00\x3D\x40\x40\x40\x3D\x00\x00", // "Ü"
        "\x00\x21\x54\x54\x55\x78\x00\x00", // "ä"
        "\x00\x39\x44\x44\x39\x00\x00\x00", // "ö"
        "\x00\x3D\x40\x40\x7D\x00\x00\x00", // "ü"
        "\x00\xFE\x09\x49\x36\x00\x00\x00", // "ß"
        "\x00\x14\x3E\x55\x55\x55\x14\x00", // "€"
        "\x00\x02\x05\x02\x00\x00\x00\x00"  // "°"
    ];


    // ========== SparkFun Qwiic OpenLog, Zeichengenerator von Speicherkarte lesen 2048 Byte .BIN Datei

    export enum eWriteStringReadString { readFile = 9, list = 14, } // Qwiic OpenLog Register Nummern

    //% group="EEPROM aus Datei auf Speicherkarte brennen"
    //% block="i2c %pADDR auf Page %pageEEPROM von %pADDR_LOG Dateiname %pFilename %pAnzahlPages128 * 128 Byte schreiben"
    //% pFilename.defl="BM505.BIN"
    //% pageEEPROM.min=0 pageEEPROM.max=511 pageEEPROM.defl=480
    //% pAnzahlPages128.min=1 pAnzahlPages128.max=16 pAnzahlPages128.defl=16
    //% inlineInputMode=inline
    export function burnFile(pADDR_EEPROM: eADDR_EEPROM, pageEEPROM: number,
        pADDR_LOG: eADDR_LOG, pFilename: string, pAnzahlPages128: number) {

        let filenameBuffer = Buffer.fromUTF8(pFilename)
        let logBuffer = Buffer.create(1 + filenameBuffer.length)

        // filename von einem Buffer in den anderen füllen
        logBuffer.write(1, filenameBuffer)

        // mit DIR feststellen, ob Datei vorhanden ist
        logBuffer.setUint8(0, eWriteStringReadString.list) // LIST command
        oledeeprom_i2cWriteBufferError = pins.i2cWriteBuffer(pADDR_LOG, logBuffer)
        control.waitMicros(50000) // 50ms

        //  ersten Dateiname lesen
        filenameBuffer = pins.i2cReadBuffer(pADDR_LOG, 32)
        control.waitMicros(50000) // 50ms
        if (filenameBuffer.toString().substr(0, pFilename.length) != pFilename) {
            /* 
            oledssd1315.writeText(oledssd1315.eADDR.OLED_16x8_x3D, 0, 0, 15, oledssd1315.eAlign.left, pFilename)
            oledssd1315.writeText(oledssd1315.eADDR.OLED_16x8_x3D, 1, 0, 15, oledssd1315.eAlign.left, filenameBuffer.toString())
            */
            return false // file not found
        } else {

            logBuffer.setUint8(0, eWriteStringReadString.readFile) // READ command
            // filename steht ab offset=1 schon im logBuffer

            // Dateiname senden, open read
            oledeeprom_i2cWriteBufferError = pins.i2cWriteBuffer(pADDR_LOG, logBuffer)
            control.waitMicros(50000) // 50ms

            let eepromBuffer = Buffer.create(130)
            for (let page = 0; page < pAnzahlPages128; page++) {

                // 128 Byte von Speicherkarte lesen als 4 * 32 Byte
                // Qwiic OpenLog überträgt nur 32 Byte in einem Buffer
                // EEPROM kann (2 Byte Adresse) + 128 Byte in einem Buffer schreiben
                logBuffer = pins.i2cReadBuffer(pADDR_LOG, 32) // 128
                // 32 Byte von einem Buffer in den anderen füllen
                eepromBuffer.write(2, logBuffer)
                control.waitMicros(5000) // 5ms

                logBuffer = pins.i2cReadBuffer(pADDR_LOG, 32)
                eepromBuffer.write(34, logBuffer)
                control.waitMicros(5000) // 5ms

                logBuffer = pins.i2cReadBuffer(pADDR_LOG, 32)
                eepromBuffer.write(66, logBuffer)
                control.waitMicros(5000) // 5ms

                logBuffer = pins.i2cReadBuffer(pADDR_LOG, 32)
                eepromBuffer.write(98, logBuffer)
                control.waitMicros(5000) // 5ms

                // EEPROM Buffer 2 Byte startAdrEEPROM
                eepromBuffer.setNumber(NumberFormat.UInt16BE, 0, pageEEPROM * 128 + page * 128)
                /* 
                if (page >= 0 && page <= 7) {
                    oledssd1315.writeText(oledssd1315.eADDR.OLED_16x8_x3D, page, 0, 7, oledssd1315.eAlign.left,
                        eepromBuffer.slice(0, 6).toHex() //+ " " + eepromBuffer.slice(0, 2).toHex()
                    )

                } else if (page >= 8 && page <= 15) {
                    oledssd1315.writeText(oledssd1315.eADDR.OLED_16x8_x3D, page - 8, 8, 15, oledssd1315.eAlign.left,
                        eepromBuffer.slice(0, 6).toHex() //+ eepromBuffer.slice(0, 2).toHex()
                    )
                }
                */
                // 2+128 Byte auf EEPROM brennen (1 Page)
                oledeeprom_i2cWriteBufferError = pins.i2cWriteBuffer(pADDR_EEPROM, eepromBuffer)
                control.waitMicros(50000) // 50ms

            }
            return true
        }

    }


    // ========== group="i2c Adressen"

    //% blockId=oledeeprom_eADDR
    //% group="i2c Adressen"
    //% block="%pADDR" weight=4
    export function oledeeprom_eADDR(pADDR: eADDR_EEPROM): number { return pADDR }

    //% group="i2c Adressen"
    //% block="Fehlercode vom letzten WriteBuffer (0 ist kein Fehler)" weight=2
    export function i2cError() { return oledeeprom_i2cWriteBufferError }
    let oledeeprom_i2cWriteBufferError: number = 0 // Fehlercode vom letzten WriteBuffer (0 ist kein Fehler)

} // oledeeprom.ts
