
//% color=#0000BF icon="\uf108" block="OLED 16x8" weight=20
namespace oledssd1315
/* 230907

initdisplaycodes from https://gist.githubusercontent.com/pulsar256/564fda3b9e8fc6b06b89/raw/4bb559d4088e42f7b4859a8533be920434818617/ssd1306_init.c

https://cdn-shop.adafruit.com/datasheets/UG-2864HSWEG01.pdf (Seite 15, 20 im pdf)


*/ {
    // For the SSD1315, the slave address is either "b0111100" or "b0111101" by changing the SA0 to LOW or HIGH (D/C pin acts as SA0).
    export enum eADDR { OLED_16x8 = 0x3C, OLED_16x8_x3D = 0x3D }
    export enum eADDR_EEPROM { EEPROM = 0x50 }

    enum eCONTROL { // Co Continuation bit(7); D/C# Data/Command Selection bit(6); following by six "0"s
        // CONTROL ist immer das 1. Byte im Buffer
        x00_xCom = 0x00, // im selben Buffer folgen nur Command Bytes ohne CONTROL dazwischen
        x80_1Com = 0x80, // im selben Buffer nach jedem Command ein neues CONTROL [0x00 | 0x80 | 0x40]
        x40_Data = 0x40  // im selben Buffer folgen nur Display-Data Bytes ohne CONTROL dazwischen
    }

    export enum eCommand {
        A0_SEGMENT_REMAP = 0xA0, // column address 0 is mapped to SEG0 (RESET) // using 0xA0 will flip screen
        A1_SEGMENT_REMAP = 0xA1, // column address 127 is mapped to SEG0
        A4_ENTIRE_DISPLAY_ON = 0xA4,
        A5_RAM_CONTENT_DISPLAY = 0xA5,
        A6_NORMAL_DISPLAY = 0xA6, // invert Hintergrund schwarz
        A7_INVERT_DISPLAY = 0xA7, // invert Hintergrund leuchtet
        AE_DISPLAY_OFF = 0xAE,
        AF_DISPLAY_ON = 0xAF,
        C0_COM_SCAN_INC = 0xC0, // COM Output Scan Direction
        C8_COM_SCAN_DEC = 0xC8, // remapped mode Scan from COM[N-1] to COM0
    }


    // ========== group="OLED 16x8 Display initialisieren"

    //% group="OLED 16x8 Display initialisieren"
    //% block="i2c %pADDR beim Start"
    //% pADDR.shadow="oledssd1315_eADDR"
    export function init(pADDR: number) {
        let bu = Buffer.create(23)   // muss Anzahl der folgenden setUint8 entsprechen
        let offset = 0               // Buffer offset (offset++ liest erst den Wert und erhöht ihn dann)

        bu.setUint8(offset++, eCONTROL.x00_xCom) // CONTROL Byte 0x00: folgende Bytes (im selben Buffer) sind alle command und kein CONTROL
        // CONTROL Byte 0x80: ignoriert 2. command-Byte (0xD5) und wertet es als CONTROL
        // CONTROL Byte 0x80: nach jedem command muss (im selben Buffer) wieder ein CONTROL 0x80 vor dem nächsten command kommen
        // CONTROL Byte 0x80: wenn ein CONTROL 0x40 folgt, können (im selben Buffer) auch Display-Daten GDDRAM folgen


        // https://cdn-shop.adafruit.com/datasheets/UG-2864HSWEG01.pdf (Seite 15, 20 im pdf)

        bu.setUint8(offset++, 0xAE)  // Set display OFF

        bu.setUint8(offset++, 0xD5)  // Set Display Clock Divide Ratio / OSC Frequency
        bu.setUint8(offset++, 0x80)  //     default 0x80

        bu.setUint8(offset++, 0xA8)  // Set Multiplex Ratio
        bu.setUint8(offset++, 0x3F)  //     Multiplex Ratio for 128x64 (64-1)

        bu.setUint8(offset++, 0xD3)  // Set Display Offset
        bu.setUint8(offset++, 0x00)  //     Display Offset

        bu.setUint8(offset++, 0x40)  // Set Display Start Line

        bu.setUint8(offset++, 0x8D)  // Set Charge Pump
        bu.setUint8(offset++, 0x14)  //     Charge Pump (0x10 Disable; 0x14 7,5V; 0x94 8,5V; 0x95 9,0V)

        bu.setUint8(offset++, 0xA1)  // Set Segment Re-Map default 0xA0

        bu.setUint8(offset++, 0xC8)  // Set Com Output Scan Direction default 0xC0

        bu.setUint8(offset++, 0xDA)  // Set COM Hardware Configuration
        bu.setUint8(offset++, 0x12)  //     COM Hardware Configuration

        bu.setUint8(offset++, 0x81)  // Set Contrast (Helligkeit)
        bu.setUint8(offset++, 0xCF)  //     Contrast default 0x7F

        bu.setUint8(offset++, 0xD9)  // Set Pre-Charge Period
        bu.setUint8(offset++, 0xF1)  //     Pre-Charge Period (0x22 External, 0xF1 Internal)

        bu.setUint8(offset++, 0xDB)  // Set VCOMH Deselect Level
        bu.setUint8(offset++, 0x40)  //     VCOMH Deselect Level default 0x20

        bu.setUint8(offset++, 0xA4)  // Set all pixels OFF

        bu.setUint8(offset++, 0xA7)  // Set display not inverted / A6 Normal A7 Inverse display

        //bu.setUint8(offset++, 0xAF)  // Set display ON

        oledssd1315_i2cWriteBufferError = pins.i2cWriteBuffer(pADDR, bu) // nur 1 Buffer wird gesendet

        if (oledssd1315_i2cWriteBufferError != 0) {
            basic.showNumber(pADDR) // wenn Modul nicht angesteckt: i2c Adresse anzeigen und Abbruch
        } else {
            bu = Buffer.create(135)
            offset = 0            //offset = setCursorBuffer6(bu, 0, 0, 0)

            bu.setUint8(offset++, eCONTROL.x80_1Com) // CONTROL+1Command
            bu.setUint8(offset++, 0xB0)// | (page & 0x07)) // page number

            bu.setUint8(offset++, eCONTROL.x80_1Com) // CONTROL+1Command
            bu.setUint8(offset++, 0x00)// | (col & 0x0F)) // lower start column address 0x00-0x0F 4 Bit

            bu.setUint8(offset++, eCONTROL.x80_1Com) // CONTROL+1Command
            bu.setUint8(offset++, 0x10)// | (col >> 4) & 0x07) // upper start column address 0x10-0x17 3 Bit

            bu.setUint8(offset++, eCONTROL.x40_Data) // CONTROL+DisplayData
            bu.fill(0x00, offset++, 128)

            for (let page = 0; page <= 7; page++) {
                bu.setUint8(1, 0xB0 | page) // an offset=1 steht die page number (Zeile 0-7)
                // sendet den selben Buffer 8 Mal mit Änderung an 1 Byte
                // true gibt den i2c Bus dazwischen nicht für andere Geräte frei
                oledssd1315_i2cWriteBufferError = pins.i2cWriteBuffer(pADDR, bu, true) // Clear Screen
            }

            // Set display ON
            bu = Buffer.create(2)
            bu.setUint8(0, eCONTROL.x80_1Com) // CONTROL+1Command
            bu.setUint8(1, 0xAF) // Set display ON
            oledssd1315_i2cWriteBufferError = pins.i2cWriteBuffer(pADDR, bu)

            control.waitMicros(100000) // 100ms Delay Recommended
        }
    }


    // ========== group="OLED 16x8 Display"

    export enum eAlign { left, right }

    //% group="OLED 16x8 Display"
    //% block="i2c %pADDR writeText row %row col %col end %end align %pFormat Text %pText" weight=8
    //% row.min=0 row.max=7 col.min=0 col.max=15 end.min=0 end.max=15 end.defl=15
    //% inlineInputMode=inline
    //% pADDR.shadow="oledssd1315_eADDR"
    export function writeText(pADDR: number, row: number, col: number, end: number, pAlign: eAlign, pText: string) {
        let len = end - col + 1, text: string
        if (between(row, 0, 7) && between(col, 0, 15) && between(len, 0, 16)) {

            if (pText.length >= len) text = pText.substr(0, len)
            else if (pText.length < len && pAlign == eAlign.left) { text = pText + "                ".substr(0, len - pText.length) }
            else if (pText.length < len && pAlign == eAlign.right) { text = "                ".substr(0, len - pText.length) + pText }

            let bu = Buffer.create(7 + text.length * 8)
            let offset = setCursorBuffer6(bu, 0, row, col) // setCursor

            writeTextBuffer1(pADDR, bu, offset, text)
        }
    }

    //% group="OLED 16x8 Display"
    //% block="i2c %pADDR writeText hoch row %row col %col end %end align %pFormat Text %pText" weight=7
    //% row.min=0 row.max=15 col.min=0 col.max=7 end.min=0 end.max=7 end.defl=7
    //% inlineInputMode=inline
    //% pADDR.shadow="oledssd1315_eADDR"
    export function writeTexthoch(pADDR: number, row: number, col: number, end: number, pAlign: eAlign, pText: string) {
        let len = end - col + 1, text: string
        if (between(row, 0, 15) && between(col, 0, 7) && between(len, 0, 8)) {

            if (pText.length >= len) text = pText.substr(0, len)
            else if (pText.length < len && pAlign == eAlign.left) { text = pText + "        ".substr(0, len - pText.length) }
            else if (pText.length < len && pAlign == eAlign.right) { text = "        ".substr(0, len - pText.length) + pText }

            let bu = Buffer.create(7 + 8) // 7 CONTROL+command + 8 text
            let offset = setCursorBuffer6(bu, 0, 7 - col, row) // setCursor
            bu.setUint8(offset++, eCONTROL.x40_Data) // CONTROL Byte 0x40: Display Data

            for (let j = 0; j < text.length; j++) {
                bu.setUint8(1, 0xB0 | (7 - (col + j)) & 0x07)      // page number 7-0 B7-B0
                bu.write(8, getPixel8ByteEEPROM(text.charCodeAt(j), eStartAdresse.F000))

                oledssd1315_i2cWriteBufferError = pins.i2cWriteBuffer(pADDR, bu)
            }
            control.waitMicros(50)
        }
    }



    //% group="OLED 16x8 Display"
    //% block="i2c %pADDR setCursor row %row col %col" weight=6
    //% row.min=0 row.max=7 col.min=0 col.max=15
    //% pADDR.shadow="oledssd1315_eADDR"
    export function setCursor(pADDR: number, row: number, col: number) {
        //write0x80Byte(pADDR, (row == 0 ? col | 0x80 : col | 0xc0))
        let bu = Buffer.create(6)
        setCursorBuffer6(bu, 0, row, col)
        /*
        bu.setUint8(0, 0x00) // CONTROL mehrere command
        bu.setUint8(1, 0xB0 | (row & 0x07)) // page number 0-7 B0-B7
        bu.setUint8(2, 0x00 | (col << 3) & 0x0F)// (col % 16)) // lower start column address 0x00-0x0F 4 Bit
        bu.setUint8(3, 0x10 | (col >> 1) & 0x07) // (col >> 4) upper start column address 0x10-0x17 3 Bit
        */
        oledssd1315_i2cWriteBufferError = pins.i2cWriteBuffer(pADDR, bu)

        control.waitMicros(50)
    }

    function setCursorBuffer6(bu: Buffer, offset: number, row: number, col: number) {
        // schreibt in den Buffer ab offset 6 Byte (CONTROL und Command für setCursor)
        // Buffer muss vorher die richtige Länge haben
        bu.setUint8(offset++, eCONTROL.x80_1Com) // CONTROL+1Command
        bu.setUint8(offset++, 0xB0 | row & 0x07)      // page number 0-7 B0-B7
        bu.setUint8(offset++, eCONTROL.x80_1Com) // CONTROL+1Command
        bu.setUint8(offset++, 0x00 | col << 3 & 0x0F) // (col % 16) lower start column address 0x00-0x0F 4 Bit
        bu.setUint8(offset++, eCONTROL.x80_1Com) // CONTROL+1Command
        bu.setUint8(offset++, 0x10 | col >> 1 & 0x07) // (col >> 4) upper start column address 0x10-0x17 3 Bit
        return offset
        //                    0x40               // CONTROL+Display Data
    }

    //% group="OLED 16x8 Display"
    //% block="i2c %pADDR writeText %pText" weight=4
    //% pADDR.shadow="oledssd1315_eADDR"
    export function writeText1(pADDR: number, pText: string) {
        writeTextBuffer1(pADDR, Buffer.create(1 + pText.length * 8), 0, pText)
    }

    function writeTextBuffer1(pADDR: eADDR, bu: Buffer, offset: number, pText: string) {
        // schreibt in den Buffer ab offset 1 Byte 0x40 + 8 Byte pro char im Text für die 8x8 Pixel
        // Buffer muss vorher die richtige Länge haben
        let font: string
        bu.setUint8(offset++, eCONTROL.x40_Data) // CONTROL Byte 0x40: Display Data
        for (let j = 0; j < pText.length; j++) {
            bu.write(offset, getPixel8ByteEEPROM(pText.charCodeAt(j), eStartAdresse.F800))
            offset += 8
        }
        oledssd1315_i2cWriteBufferError = pins.i2cWriteBuffer(pADDR, bu)
        control.waitMicros(50)
    }

    // ========== group="OLED 16x8 Display löschen"

    //% group="OLED 16x8 Display löschen"
    //% block="i2c %pADDR Display löschen || von Zeile %vonZeile bis Zeile %bisZeile mit Zeichencode %charcode" weight=2
    //% pADDR.shadow="oledssd1315_eADDR"
    //% vonZeile.min=0 vonZeile.max=7 vonZeile.defl=0
    //% bisZeile.min=0 bisZeile.max=7 bisZeile.defl=7
    //% charcode.min=0 charcode.max=255 charcode.defl=0
    //% inlineInputMode=inline
    export function clearScreen(pADDR: number, vonZeile?: number, bisZeile?: number, charcode?: number) {
        if (between(vonZeile, 0, 7) && between(bisZeile, 0, 7)) {
            let bu = Buffer.create(135)
            let offset = setCursorBuffer6(bu, 0, 0, 0)
            bu.setUint8(offset++, eCONTROL.x40_Data) // CONTROL+DisplayData
            bu.fill(charcode & 0xFF, offset++, 128)   // 128 Byte füllen eine Zeile pixelweise

            for (let page = vonZeile; page <= bisZeile; page++) {
                bu.setUint8(1, 0xB0 | page) // an offset=1 steht die page number (Zeile 0-7)
                // sendet den selben Buffer 8 Mal mit Änderung an 1 Byte
                // true gibt den i2c Bus dazwischen nicht für andere Geräte frei
                oledssd1315_i2cWriteBufferError = pins.i2cWriteBuffer(pADDR, bu, page < bisZeile) // Clear Screen
            }
            control.waitMicros(100000) // 100ms Delay Recommended
        }
    }

    //% group="OLED 16x8 Display löschen"
    //% block="i2c %pADDR Display füllen %pStartAdresse" weight=1
    //% pADDR.shadow="oledssd1315_eADDR"
    export function fillScreen(pADDR: number, pStartAdresse: eStartAdresse) {
        let bu = Buffer.create(135)
        let offset = setCursorBuffer6(bu, 0, 0, 0)
        bu.setUint8(offset++, eCONTROL.x40_Data) // CONTROL+DisplayData

        for (let page = 0; page <= 7; page++) {
            bu.setUint8(1, 0xB0 | page) // an offset=1 steht die page number (Zeile 0-7)
            offset = 7 // offset 7-135 sind 128 Byte für die Pixel in einer Zeile
            for (let charCode = 0; charCode <= 15; charCode++) {
                // schreibt 16 Zeichen je 8 Pixel in den Buffer(7-135)
                bu.write(offset, getPixel8ByteEEPROM(page * 16 + charCode, pStartAdresse))
                offset += 8
            }
            oledssd1315_i2cWriteBufferError = pins.i2cWriteBuffer(pADDR, bu, page < 7)
        }
    }



    export enum eDisplayCommand {
        //% block="AF AE Set Display ON/OFF"
        ON,
        //% block="A7 A6 Set Normal/Inverse Display"
        INVERS,
        //% block="A0 A1 Set Segment Remap"
        FLIP,
        //% block="C0 C8 Set COM Output Scan Direction"
        REMAP,
        //% block="A4 A5 Entire Display"
        ENTIRE_ON
    }
    //% block="i2c %pADDR Display %pDisplayCommand %pON" weight=1
    //% pADDR.shadow="oledssd1315_eADDR"
    //% pON.shadow="toggleOnOff"
    export function displayCommand(pADDR: number, pDisplayCommand: eDisplayCommand, pON: boolean) {
        let bu = pins.createBuffer(2)
        bu.setUint8(0, eCONTROL.x00_xCom)
        switch (pDisplayCommand) {
            case eDisplayCommand.ON: { bu.setUint8(1, (pON ? eCommand.AF_DISPLAY_ON : eCommand.AE_DISPLAY_OFF)); break; }
            case eDisplayCommand.INVERS: { bu.setUint8(1, (pON ? eCommand.A7_INVERT_DISPLAY : eCommand.A6_NORMAL_DISPLAY)); break; }
            case eDisplayCommand.ENTIRE_ON: { bu.setUint8(1, (pON ? eCommand.A4_ENTIRE_DISPLAY_ON : eCommand.A5_RAM_CONTENT_DISPLAY)); break; }
            case eDisplayCommand.FLIP: {
                //bu = pins.createBuffer(3)
                //bu.setUint8(0, eCONTROL.x00_xCom)
                //bu.setUint8(1, eCommand.C0_COM_SCAN_INC)//(pON ? eCommand.A0_SEGMENT_REMAP : eCommand.A1_SEGMENT_REMAP))
                bu.setUint8(1, (pON ? eCommand.A0_SEGMENT_REMAP : eCommand.A1_SEGMENT_REMAP))
                break
            }
            case eDisplayCommand.REMAP: { bu.setUint8(1, (pON ? eCommand.C0_COM_SCAN_INC : eCommand.C8_COM_SCAN_DEC)); break; }

        }
        oledssd1315_i2cWriteBufferError = pins.i2cWriteBuffer(pADDR, bu)
    }

    export enum eStartAdresse { F800 = 0xF800, FC00 = 0xFC00, F000 = 0xF000, F400 = 0xF400 }

    function getPixel8ByteEEPROM(pCharCode: number, pStartAdresse: eStartAdresse) {
        let bu = Buffer.create(2)
        bu.setNumber(NumberFormat.UInt16BE, 0, pStartAdresse + pCharCode * 8)
        oledssd1315_i2cWriteBufferError = pins.i2cWriteBuffer(eADDR_EEPROM.EEPROM, bu, true)

        //if (pStartAdresse >= eStartAdresse.F800) {
        return pins.i2cReadBuffer(eADDR_EEPROM.EEPROM, 8)
        //} else {
        //    return drehen(pins.i2cReadBuffer(eADDR_EEPROM.EEPROM, 8))
        //}
    }

    function drehen(b0: Buffer) { // Buffer mit 8 Byte
        let b1 = Buffer.create(8)
        b1.fill(0b00000000)

        /* for (let b0offset = 0; b0offset <= 7; b0offset++) { // 8x8 Bit 1/2 nach rechts drehen
            if ((b0.getUint8(b0offset) & 2 ** 0) != 0) { b1.setUint8(7 - b0offset, b1.getUint8(7 - b0offset) | 2 ** 0) }
            if ((b0.getUint8(b0offset) & 2 ** 1) != 0) { b1.setUint8(7 - b0offset, b1.getUint8(7 - b0offset) | 2 ** 1) }
            if ((b0.getUint8(b0offset) & 2 ** 2) != 0) { b1.setUint8(7 - b0offset, b1.getUint8(7 - b0offset) | 2 ** 2) }
            if ((b0.getUint8(b0offset) & 2 ** 3) != 0) { b1.setUint8(7 - b0offset, b1.getUint8(7 - b0offset) | 2 ** 3) }
            if ((b0.getUint8(b0offset) & 2 ** 4) != 0) { b1.setUint8(7 - b0offset, b1.getUint8(7 - b0offset) | 2 ** 4) }
            if ((b0.getUint8(b0offset) & 2 ** 5) != 0) { b1.setUint8(7 - b0offset, b1.getUint8(7 - b0offset) | 2 ** 5) }
            if ((b0.getUint8(b0offset) & 2 ** 6) != 0) { b1.setUint8(7 - b0offset, b1.getUint8(7 - b0offset) | 2 ** 6) }
            if ((b0.getUint8(b0offset) & 2 ** 7) != 0) { b1.setUint8(7 - b0offset, b1.getUint8(7 - b0offset) | 2 ** 7) }
        } */

        for (let i = 0; i <= 7; i++) { // 8x8 Bit 1/4 nach rechts drehen
            if ((b0.getUint8(i) & 2 ** 0) != 0) { b1.setUint8(7, b1.getUint8(7) | 2 ** i) }
            if ((b0.getUint8(i) & 2 ** 1) != 0) { b1.setUint8(6, b1.getUint8(6) | 2 ** i) }
            if ((b0.getUint8(i) & 2 ** 2) != 0) { b1.setUint8(5, b1.getUint8(5) | 2 ** i) }
            if ((b0.getUint8(i) & 2 ** 3) != 0) { b1.setUint8(4, b1.getUint8(4) | 2 ** i) }
            if ((b0.getUint8(i) & 2 ** 4) != 0) { b1.setUint8(3, b1.getUint8(3) | 2 ** i) }
            if ((b0.getUint8(i) & 2 ** 5) != 0) { b1.setUint8(2, b1.getUint8(2) | 2 ** i) }
            if ((b0.getUint8(i) & 2 ** 6) != 0) { b1.setUint8(1, b1.getUint8(1) | 2 ** i) }
            if ((b0.getUint8(i) & 2 ** 7) != 0) { b1.setUint8(0, b1.getUint8(0) | 2 ** i) }
        }
        return b1
    }






    /* function getPixel8Byte_(pCharCode: number) {
        let zArray: string[]
        switch (pCharCode & 0xF0) {
            case 0x20: { zArray = oledeeprom.basicFontx20; break; } // 16 string-Elemente je 8 Byte = 128
            case 0x30: { zArray = oledeeprom.basicFontx30; break; }
            case 0x40: { zArray = oledeeprom.basicFontx40; break; }
            case 0x50: { zArray = oledeeprom.basicFontx50; break; }
            case 0x60: { zArray = oledeeprom.basicFontx60; break; }
            case 0x70: { zArray = oledeeprom.basicFontx70; break; }
        }
        let bu = Buffer.create(128)
        //let o = 0
        for (let i = 0; i <= 15; i++) {
            for (let j = 0; j <= 7; j++) {
                bu.setUint8(i * 8 + j, zArray[i].charCodeAt(j))
            }
        }

        let offset = (pCharCode & 0x0F) * 8 // max 15*8=120

        return bu.slice(offset, 8)
    } */



    // ========== group="Logik"

    //% group="Logik" advanced=true
    //% block="%i0 zwischen %i1 und %i2"
    export function between(i0: number, i1: number, i2: number): boolean {
        return (i0 >= i1 && i0 <= i2)
    }

    // ========== group="i2c Adressen"

    //% blockId=oledssd1315_eADDR
    //% group="i2c Adressen" advanced=true
    //% block="%pADDR" weight=4
    export function oledssd1315_eADDR(pADDR: eADDR): number { return pADDR }

    //% group="i2c Adressen" advanced=true
    //% block="Fehlercode vom letzten WriteBuffer (0 ist kein Fehler)" weight=2
    export function i2cError() { return oledssd1315_i2cWriteBufferError }
    let oledssd1315_i2cWriteBufferError: number = 0 // Fehlercode vom letzten WriteBuffer (0 ist kein Fehler)

} // oledssd1315.ts
