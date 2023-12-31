

namespace oledssd1315
/* 230908 231011 https://github.com/calliope-net/oled-16x8

Grove - OLED Yellow&Blue Display 0.96(SSD1315)
https://wiki.seeedstudio.com/Grove-OLED-Yellow&Blue-Display-0.96-SSD1315_V1.0/

SparkFun Qwiic EEPROM Breakout - 512Kbit
https://www.sparkfun.com/products/18355

initdisplaycodes from https://gist.githubusercontent.com/pulsar256/564fda3b9e8fc6b06b89/raw/4bb559d4088e42f7b4859a8533be920434818617/ssd1306_init.c

https://cdn-shop.adafruit.com/datasheets/UG-2864HSWEG01.pdf (Seite 15, 20 im pdf)

OLED Display mit EEPROM neu programmiert von Lutz Elßner im September 2023
*/ {
    // For the SSD1315, the slave address is either "b0111100" or "b0111101" by changing the SA0 to LOW or HIGH (D/C pin acts as SA0).
    //export enum eADDR { OLED_16x8_x3C = 0x3C, OLED_16x8_x3D = 0x3D }
    //export enum eADDR_EEPROM { EEPROM_x50 = 0x50 }


    let n_i2cCheck: boolean = false // i2c-Check
    let n_i2cError_x3C: number = 0 // Fehlercode vom letzten WriteBuffer (0 ist kein Fehler)
    let n_i2cError_x3D: number = 0 // Fehlercode vom letzten WriteBuffer (0 ist kein Fehler)

    let n_i2cError_x50: number = 0 // Fehlercode vom letzten WriteBuffer (0 ist kein Fehler)

    //export enum eStartAdresse { F800 = 0xF800, FC00 = 0xFC00, F000 = 0xF000, F400 = 0xF400 }
    //export enum eEEPROM_Startadresse { F800 = 0xF800, FC00 = 0xFC00, F000 = 0xF000, F400 = 0xF400 }
    // blockId=oledssd1315_eEEPROM_Startadresse block="%p" blockHidden=true
    //export function oledssd1315_eEEPROM_Startadresse(p: eEEPROM_Startadresse): number { return p }


    // Variablen im namespace oledssd1315
    let n_ADDR_EEPROM = eADDR_EEPROM.EEPROM_x50 // i2c Adresse vom EEPROM wird bei init gespeichert, es soll nur einen geben
    let n_0x3C_EEPROM_Startadresse = eEEPROM_Startadresse.F800 // jedes Display kann eigenen Zeichesatz im EEPROM haben
    let n_0x3D_EEPROM_Startadresse = eEEPROM_Startadresse.F800 // F000 sind Zeichen für Hochformat

    // die zum Modul gehörende Startadresse der Zeichen im EEPROM
    //function stAdr(pADDR: eADDR) { return (pADDR == eADDR.OLED_16x8_x3D ? oledssd1315_0x3D_EEPROM_Startadresse : oledssd1315_0x3C_EEPROM_Startadresse) }


    // ========== group="OLED Display 0.96 + SparkFun Qwiic EEPROM Breakout - 512Kbit"

    //% deprecated=true
    //% group="OLED Display 0.96 + SparkFun Qwiic EEPROM Breakout - 512Kbit"
    //% block="i2c %pADDR beim Start || invert %pInvert drehen %pFlip i2c-Check %ck EEPROM: Zeichensatz %pEEPROM_Startadresse i2c %pADDR_EEPROM" weight=8
    //% pADDR.shadow="oledssd1315_eADDR"
    //% pInvert.shadow="toggleOnOff" pInvert.defl=false
    //% pFlip.shadow="toggleOnOff" pFlip.defl=false
    //% ck.shadow="toggleOnOff" ck.defl=1
    //% pEEPROM_Startadresse.shadow="oledssd1315_eEEPROM_Startadresse"
    //% pADDR_EEPROM.shadow="oledssd1315_eADDR_EEPROM"
    //% inlineInputMode=inline
    export function init(pADDR: number, pInvert?: boolean, pFlip?: boolean, ck?: boolean,
        pEEPROM_Startadresse?: number, pADDR_EEPROM?: number): void {

        //if (!between(pADDR, eADDR.OLED_16x8_x3C, eADDR.OLED_16x8_x3D)) {
        //    basic.showString("nur x3C oder x3D ist gültig")
        //} else {
        // nur diese beiden i2c-Adressen sind gültig

        n_i2cCheck = (ck ? true : false) // optionaler boolean Parameter kann undefined sein
        n_i2cError_x50 = 0 // Reset Fehlercode

        // i2c Adresse vom EEPROM nur speichern, wenn Parameter angegeben (nicht NaN)
        if (between(pADDR_EEPROM, 0x50, 0x57)) { n_ADDR_EEPROM = pADDR_EEPROM }

        // Startadresse Zeichensatz im EEPROM je Display getrennt speichern, wenn angegeben
        if (between(pEEPROM_Startadresse, 0x0000, 0xFFFF)) {
            if (pADDR == eADDR.OLED_16x8_x3C) {
                n_i2cError_x3C = 0
                n_0x3C_EEPROM_Startadresse = pEEPROM_Startadresse
            }
            else if (pADDR == eADDR.OLED_16x8_x3D) {
                n_i2cError_x3D = 0
                n_0x3D_EEPROM_Startadresse = pEEPROM_Startadresse
            }
        }

        // Vcc Generated by Internal DC/DC Circuit
        const vccext = false

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
        //bu.setUint8(offset++, 0x14)  //     Charge Pump (0x10 Disable; 0x14 7,5V; 0x94 8,5V; 0x95 9,0V)
        bu.setUint8(offset++, (vccext ? 0x10 : 0x14))

        //bu.setUint8(offset++, 0xA1)  // Set Segment Re-Map default 0xA0
        bu.setUint8(offset++, (!pFlip ? 0xA1 : 0xA0))

        //bu.setUint8(offset++, 0xC8)  // Set Com Output Scan Direction default 0xC0
        bu.setUint8(offset++, (!pFlip ? 0xC8 : 0xC0))

        bu.setUint8(offset++, 0xDA)  // Set COM Hardware Configuration
        bu.setUint8(offset++, 0x12)  //     COM Hardware Configuration

        bu.setUint8(offset++, 0x81)  // Set Contrast (Helligkeit)
        //bu.setUint8(offset++, 0xCF)  //     Contrast default 0x7F
        bu.setUint8(offset++, (vccext ? 0x9F : 0xCF))

        bu.setUint8(offset++, 0xD9)  // Set Pre-Charge Period
        //bu.setUint8(offset++, 0xF1)  //     Pre-Charge Period (0x22 External, 0xF1 Internal)
        bu.setUint8(offset++, (vccext ? 0x22 : 0xF1))

        bu.setUint8(offset++, 0xDB)  // Set VCOMH Deselect Level
        bu.setUint8(offset++, 0x40)  //     VCOMH Deselect Level default 0x20

        bu.setUint8(offset++, 0xA4)  // Set all pixels OFF

        bu.setUint8(offset++, (pInvert ? 0xA7 : 0xA6))  // Set display not inverted / A6 Normal A7 Inverse display

        //bu.setUint8(offset++, 0xAF)  // Set display ON

        i2cWriteBuffer(pADDR, bu) // nur 1 Buffer wird gesendet


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
            i2cWriteBuffer(pADDR, bu, true) // Clear Screen
        }

        // Set display ON
        bu = Buffer.create(2)
        bu.setUint8(0, eCONTROL.x80_1Com) // CONTROL+1Command
        bu.setUint8(1, 0xAF) // Set display ON
        i2cWriteBuffer(pADDR, bu)

        control.waitMicros(100000) // 100ms Delay Recommended
        //}
    }


    // ========== group="OLED Display 0.96 + SparkFun Qwiic EEPROM Breakout - 512Kbit"


    //% deprecated=true
    //% group="OLED Display 0.96 + SparkFun Qwiic EEPROM Breakout - 512Kbit"
    //% block="i2c %pADDR Display löschen || von Zeile %vonZeile bis Zeile %bisZeile mit Bitmuster %charcode" weight=2
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
                i2cWriteBuffer(pADDR, bu, page < bisZeile) // Clear Screen
            }
            control.waitMicros(100000) // 100ms Delay Recommended
        }
    }


    // ========== group="OLED 16x8 Display Text anzeigen"

    //% deprecated=true
    //% group="Text anzeigen (Zeichensatz muss im EEPROM programmiert sein)"
    //% block="i2c %pADDR Text 16x8 Zeile %row von %col bis %end %pText || %pAlign" weight=8
    //% pADDR.shadow="oledssd1315_eADDR"
    //% row.min=0 row.max=7 col.min=0 col.max=15 end.min=0 end.max=15 end.defl=15
    //% pText.shadow="oledssd1315_text"
    //% pAlign.defl=0
    //% inlineInputMode=inline
    export function writeText16x8(pADDR: number, row: number, col: number, end: number, pText: any, pAlign?: eAlign) {
        let text: string = convertToText(pText)
        let len: number = end - col + 1
        if (between(row, 0, 7) && between(col, 0, 15) && between(len, 0, 16)) {

            if (text.length > len)
                text = text.substr(0, len)
            else if (text.length < len && pAlign == eAlign.rechts)
                text = "                ".substr(0, len - text.length) + text
            else if (text.length < len)
                text = text + "                ".substr(0, len - text.length)
            // else { } // Original Text text.length == len

            let bu = Buffer.create(7 + text.length * 8)
            let offset = setCursorBuffer6(bu, 0, row, col) // setCursor

            writeTextBuffer1(pADDR, bu, offset, text)
        }
    }

    //% deprecated=true
    //% group="Text 8x16 anzeigen (Zeichensatz muss im EEPROM programmiert sein)"
    //% block="i2c %pADDR Text 8x16 Zeile %row von %col bis %end %pText || %pAlign" weight=7
    //% pADDR.shadow="oledssd1315_eADDR"
    //% row.min=0 row.max=15 col.min=0 col.max=7 end.min=0 end.max=7 end.defl=7
    //% pText.shadow="oledssd1315_text"
    //% pAlign.defl=0
    //% inlineInputMode=inline
    export function writeText8x16(pADDR: number, row: number, col: number, end: number, pText: any, pAlign?: eAlign) {
        let text: string = convertToText(pText)
        let len: number = end - col + 1
        if (between(row, 0, 15) && between(col, 0, 7) && between(len, 0, 8)) {

            if (text.length > len)
                text = text.substr(0, len)
            else if (text.length < len && pAlign == eAlign.rechts)
                text = "        ".substr(0, len - text.length) + text
            else if (text.length < len)
                text = text + "        ".substr(0, len - text.length)
            // else { } // Original Text text.length == len

            let bu = Buffer.create(7 + 8) // 7 CONTROL+command + 8 text
            let offset = setCursorBuffer6(bu, 0, 7 - col, row) // setCursor
            bu.setUint8(offset++, eCONTROL.x40_Data) // CONTROL Byte 0x40: Display Data

            for (let j = 0; j < text.length; j++) {
                bu.setUint8(1, 0xB0 | (7 - (col + j)) & 0x07)      // page number 7-0 B7-B0
                bu.write(8, getPixel8ByteEEPROM(pADDR, text.charCodeAt(j), eDrehen.nicht))

                i2cWriteBuffer(pADDR, bu)
            }
            control.waitMicros(50)
        }
    }



    //% deprecated=true
    //% group="Text anzeigen (Zeichensatz muss im EEPROM programmiert sein)"
    //% block="i2c %pADDR Cursor Zeile %row von %col" weight=6
    //% pADDR.shadow="oledssd1315_eADDR"
    //% row.min=0 row.max=7 col.min=0 col.max=15
    export function setCursor(pADDR: number, row: number, col: number) {
        if (between(row, 0, 7) && between(col, 0, 15)) {
            let bu = Buffer.create(6)
            setCursorBuffer6(bu, 0, row, col)
            i2cWriteBuffer(pADDR, bu)
            control.waitMicros(50)
        }
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

    //% deprecated=true
    //% group="Text anzeigen (Zeichensatz muss im EEPROM programmiert sein)"
    //% block="i2c %pADDR Text %pText" weight=4
    //% pADDR.shadow="oledssd1315_eADDR"
    //% pText.shadow="oledssd1315_text"
    export function writeText1(pADDR: number, pText: any) {
        let text: string = convertToText(pText)
        writeTextBuffer1(pADDR, Buffer.create(1 + text.length * 8), 0, text)
    }

    function writeTextBuffer1(pADDR: eADDR, bu: Buffer, offset: number, pText: string) {
        // schreibt in den Buffer ab offset 1 Byte 0x40 + 8 Byte pro char im Text für die 8x8 Pixel
        // Buffer muss vorher die richtige Länge haben
        let font: string
        bu.setUint8(offset++, eCONTROL.x40_Data) // CONTROL Byte 0x40: Display Data
        for (let j = 0; j < pText.length; j++) {
            bu.write(offset, getPixel8ByteEEPROM(pADDR, pText.charCodeAt(j), eDrehen.nicht))
            offset += 8
        }
        i2cWriteBuffer(pADDR, bu)
        control.waitMicros(50)
    }


    // ========== group="kopiert 1024 Byte vom EEPROM auf ein Display (Text, Bild)"

    //% deprecated=true
    //% group="kopiert 1024 Byte vom EEPROM auf ein Display (Text, Bild)"
    //% block="i2c %pADDR Display 16x8 füllen %pEEPROM_Startadresse || von Zeile %vonZeile bis Zeile %bisZeile" weight=1
    //% pADDR.shadow="oledssd1315_eADDR"
    //% pEEPROM_Startadresse.shadow="oledssd1315_eEEPROM_Startadresse"
    //% vonZeile.min=0 vonZeile.max=7 vonZeile.defl=0
    //% bisZeile.min=0 bisZeile.max=7 bisZeile.defl=7
    //% inlineInputMode=inline
    export function fillScreen(pADDR: number, pEEPROM_Startadresse: number, vonZeile?: number, bisZeile?: number) {
        if (between(vonZeile, 0, 7) && between(bisZeile, 0, 7)) {
            let buEEPROM = Buffer.create(2)

            let buDisplay = Buffer.create(135)
            let offsetDisplay = setCursorBuffer6(buDisplay, 0, 0, 0)
            buDisplay.setUint8(offsetDisplay++, eCONTROL.x40_Data) // CONTROL+DisplayData

            for (let page = vonZeile; page <= bisZeile; page++) {

                buEEPROM.setNumber(NumberFormat.UInt16BE, 0, pEEPROM_Startadresse + page * 128)

                buDisplay.setUint8(1, 0xB0 | page) // an offset=1 steht die page number (Zeile 0-7)
                //offsetDisplay = 7 // offset 7-135 sind 128 Byte für die Pixel in einer Zeile

                i2cWriteBuffer(n_ADDR_EEPROM, buEEPROM)

                buDisplay.write(7, i2cReadBuffer_EEPROM(n_ADDR_EEPROM, 128))

                i2cWriteBuffer(pADDR, buDisplay)
            }
        }
    }



    // ========== advanced=true

    // ========== group="Display Command"

    //% deprecated=true
    //% group="Display Command"
    //% block="i2c %pADDR Display Command %pDisplayCommand %pON" advanced=true
    //% pADDR.shadow="oledssd1315_eADDR"
    //% pON.shadow="toggleOnOff"
    export function displayCommand(pADDR: number, pDisplayCommand: eDisplayCommand, pON: boolean) {
        let bu = Buffer.create(2)
        bu.setUint8(0, eCONTROL.x00_xCom)
        switch (pDisplayCommand) {
            case eDisplayCommand.ON: { bu.setUint8(1, (pON ? eCommand.AF_DISPLAY_ON : eCommand.AE_DISPLAY_OFF)); break; }
            case eDisplayCommand.INVERS: { bu.setUint8(1, (pON ? eCommand.A7_INVERT_DISPLAY : eCommand.A6_NORMAL_DISPLAY)); break; }
            case eDisplayCommand.FLIP: { bu.setUint8(1, (pON ? eCommand.A0_SEGMENT_REMAP : eCommand.A1_SEGMENT_REMAP)); break }
            case eDisplayCommand.REMAP: { bu.setUint8(1, (pON ? eCommand.C0_COM_SCAN_INC : eCommand.C8_COM_SCAN_DEC)); break; }
            case eDisplayCommand.ENTIRE_ON: { bu.setUint8(1, (pON ? eCommand.A4_ENTIRE_DISPLAY_ON : eCommand.A5_RAM_CONTENT_DISPLAY)); break; }
        }
        i2cWriteBuffer(pADDR, bu)
    }



    // ========== private

    function getPixel8ByteEEPROM(pADDR: eADDR, pCharCode: number, pDrehen: eDrehen) {

        let startAdresse = (pADDR == eADDR.OLED_16x8_x3D ? n_0x3D_EEPROM_Startadresse : n_0x3C_EEPROM_Startadresse)

        let bu = Buffer.create(2)
        bu.setNumber(NumberFormat.UInt16BE, 0, startAdresse + pCharCode * 8)
        i2cWriteBuffer(n_ADDR_EEPROM, bu, true)

        //if (pStartAdresse >= eStartAdresse.F800) {
        //return pins.i2cReadBuffer(eADDR_EEPROM.EEPROM, 8)
        //} else {
        return drehen(i2cReadBuffer_EEPROM(n_ADDR_EEPROM, 8), pDrehen)
        //}
    }

    enum eDrehen { nicht, viertel, halb }
    function drehen(b0: Buffer, pDrehen: eDrehen) { // Buffer mit 8 Byte
        let b1 = Buffer.create(8)
        b1.fill(0b00000000)

        switch (pDrehen) {
            case eDrehen.nicht: {
                return b0
            }
            case eDrehen.viertel: {
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
            case eDrehen.halb: {
                for (let b0offset = 0; b0offset <= 7; b0offset++) { // 8x8 Bit 1/2 nach rechts drehen
                    if ((b0.getUint8(b0offset) & 2 ** 0) != 0) { b1.setUint8(7 - b0offset, b1.getUint8(7 - b0offset) | 2 ** 0) }
                    if ((b0.getUint8(b0offset) & 2 ** 1) != 0) { b1.setUint8(7 - b0offset, b1.getUint8(7 - b0offset) | 2 ** 1) }
                    if ((b0.getUint8(b0offset) & 2 ** 2) != 0) { b1.setUint8(7 - b0offset, b1.getUint8(7 - b0offset) | 2 ** 2) }
                    if ((b0.getUint8(b0offset) & 2 ** 3) != 0) { b1.setUint8(7 - b0offset, b1.getUint8(7 - b0offset) | 2 ** 3) }
                    if ((b0.getUint8(b0offset) & 2 ** 4) != 0) { b1.setUint8(7 - b0offset, b1.getUint8(7 - b0offset) | 2 ** 4) }
                    if ((b0.getUint8(b0offset) & 2 ** 5) != 0) { b1.setUint8(7 - b0offset, b1.getUint8(7 - b0offset) | 2 ** 5) }
                    if ((b0.getUint8(b0offset) & 2 ** 6) != 0) { b1.setUint8(7 - b0offset, b1.getUint8(7 - b0offset) | 2 ** 6) }
                    if ((b0.getUint8(b0offset) & 2 ** 7) != 0) { b1.setUint8(7 - b0offset, b1.getUint8(7 - b0offset) | 2 ** 7) }
                }
                return b1
            }
            default: return b0
        }
    }



    // ========== group="Text, Logik"

    // group="Text, Logik" advanced=true
    // blockId=oledssd1315_text block="%s" weight=6
    //export function oledssd1315_text(s: string): string { return s }

    //% deprecated=true
    //% group="Text, Logik" advanced=true
    //% block="%i0 zwischen %i1 und %i2" weight=4
    export function between(i0: number, i1: number, i2: number): boolean {
        return (i0 >= i1 && i0 <= i2)
    }

    // ========== group="i2c Adressen"


    //% deprecated=true
    //% group="i2c Adressen" advanced=true
    //% block="i2c Fehlercode %pADDR" weight=4
    //% pADDR.shadow="oledssd1315_eADDR"
    export function i2cError_OLED(pADDR: number) {
        return (pADDR == eADDR.OLED_16x8_x3D ? n_i2cError_x3D : n_i2cError_x3C)
    }


    //% deprecated=true
    //% group="i2c Adressen" advanced=true
    //% block="i2c Fehlercode EEPROM" weight=2
    export function i2cError_EEPROM() { return n_i2cError_x50 }



    function i2cWriteBuffer(pADDR: number, buf: Buffer, repeat: boolean = false) {
        switch (pADDR) {
            case eADDR.OLED_16x8_x3C:
                if (n_i2cError_x3C == 0) { // vorher kein Fehler
                    n_i2cError_x3C = pins.i2cWriteBuffer(pADDR, buf, repeat)
                    if (n_i2cCheck && n_i2cError_x3C != 0)  // vorher kein Fehler, wenn (n_i2cCheck=true): beim 1. Fehler anzeigen
                        basic.showString(Buffer.fromArray([pADDR]).toHex()) // zeige fehlerhafte i2c-Adresse als HEX
                } else if (!n_i2cCheck)  // vorher Fehler, aber ignorieren (n_i2cCheck=false): i2c weiter versuchen
                    n_i2cError_x3C = pins.i2cWriteBuffer(pADDR, buf, repeat)
                //else { } // n_i2cCheck=true und n_i2cError != 0: weitere i2c Aufrufe blockieren
                break
            case eADDR.OLED_16x8_x3D:
                if (n_i2cError_x3D == 0) { // vorher kein Fehler
                    n_i2cError_x3D = pins.i2cWriteBuffer(pADDR, buf, repeat)
                    if (n_i2cCheck && n_i2cError_x3D != 0)  // vorher kein Fehler, wenn (n_i2cCheck=true): beim 1. Fehler anzeigen
                        basic.showString(Buffer.fromArray([pADDR]).toHex()) // zeige fehlerhafte i2c-Adresse als HEX
                } else if (!n_i2cCheck)  // vorher Fehler, aber ignorieren (n_i2cCheck=false): i2c weiter versuchen
                    n_i2cError_x3D = pins.i2cWriteBuffer(pADDR, buf, repeat)
                //else { } // n_i2cCheck=true und n_i2cError != 0: weitere i2c Aufrufe blockieren
                break
            case n_ADDR_EEPROM: // eADDR_EEPROM.EEPROM_x50:
                if (n_i2cError_x50 == 0) { // vorher kein Fehler
                    n_i2cError_x50 = pins.i2cWriteBuffer(pADDR, buf, repeat)
                    if (n_i2cCheck && n_i2cError_x50 != 0)  // vorher kein Fehler, wenn (n_i2cCheck=true): beim 1. Fehler anzeigen
                        basic.showString(Buffer.fromArray([pADDR]).toHex()) // zeige fehlerhafte i2c-Adresse als HEX
                } else if (!n_i2cCheck)  // vorher Fehler, aber ignorieren (n_i2cCheck=false): i2c weiter versuchen
                    n_i2cError_x50 = pins.i2cWriteBuffer(pADDR, buf, repeat)
                //else { } // n_i2cCheck=true und n_i2cError != 0: weitere i2c Aufrufe blockieren
                break
        }
    }

    function i2cReadBuffer_EEPROM(pADDR: number, size: number, repeat: boolean = false): Buffer {
        if (!n_i2cCheck || n_i2cError_x50 == 0)
            return pins.i2cReadBuffer(pADDR, size, repeat)
        else
            return Buffer.create(size)
    }

} // oledssd1315.ts
