
//% color=#0000BF icon="\uf108" block="OLED 16x8" weight=20
namespace oledssd1315
/* 230905

initdisplaycodes from https://gist.githubusercontent.com/pulsar256/564fda3b9e8fc6b06b89/raw/4bb559d4088e42f7b4859a8533be920434818617/ssd1306_init.c

https://cdn-shop.adafruit.com/datasheets/UG-2864HSWEG01.pdf (Seite 15, 20 im pdf)


*/ {
    export enum eADDR { OLED_16x8 = 0x3C, OLED_16x8_x3D = 0x3D }
    // For the SSD1315, the slave address is either "b0111100" or "b0111101" by changing the SA0 to LOW or HIGH (D/C pin acts as SA0).

    enum eCONTROL { // Co Continuation bit(7); D/C# Data/Command Selection bit(6); following by six "0"s
        // CONTROL ist immer das 1. Byte im Buffer
        x00_xCom = 0x00, // im selben Buffer folgen nur Command Bytes ohne CONTROL dazwischen
        x80_1Com = 0x80, // im selben Buffer nach jedem Command ein neues CONTROL [0x00 | 0x80 | 0x40]
        x40_Data = 0x40  // im selben Buffer folgen nur Display-Data Bytes ohne CONTROL dazwischen
    }

    export enum eCommand {
        A0_SEGMENT_REMAP = 0xA0, // column address 0 is mapped to SEG0 (RESET) // using 0xA0 will flip screen
        A1_SEGMENT_REMAP = 0xA1, // column address 127 is mapped to SEG0
        A4_ENTITE_DISPLAY_ON = 0xA4,
        A5_RAM_CONTENT_DISPLAY = 0xA5,
        A6_NORMAL_DISPLAY = 0xA6, // invert Hintergrund schwarz
        A7_INVERT_DISPLAY = 0xA7, // invert Hintergrund leuchtet
        AE_DISPLAY_OFF = 0xAE,
        AF_DISPLAY_ON = 0xAF,
        C0_COM_SCAN_INC = 0xC0, // COM Output Scan Direction
        C8_COM_SCAN_DEC = 0xC8, // remapped mode Scan from COM[N-1] to COM0
    }


    /* function write2Byte(pADDR: eADDR, b0: number, b1: number) {
        let bu = pins.createBuffer(3)
        bu.setUint8(0, 0x00)
        bu.setUint8(1, b0)
        bu.setUint8(2, b1)
        pins.i2cWriteBuffer(pADDR, bu)
    }*/
    function writeCommandx00(pADDR: eADDR, pCommand: eCommand) {
        let bu = pins.createBuffer(2)
        bu.setUint8(0, 0x00)
        bu.setUint8(1, pCommand)
        pins.i2cWriteBuffer(pADDR, bu)
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
            //if (col >= 0 && col <= 15 && l > 0 && l <= 16) {

            if (pText.length >= len) text = pText.substr(0, len)
            else if (pText.length < len && pAlign == eAlign.left) { text = pText + "                ".substr(0, len - pText.length) }
            else if (pText.length < len && pAlign == eAlign.right) { text = "                ".substr(0, len - pText.length) + pText }

            let bu = Buffer.create(7 + text.length * 8)
            let offset = setCursorBuffer6(bu, 0, row, col) // setCursor

            writeTextBuffer1(pADDR, bu, offset, text)
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

            bu.write(offset, getPixel8Byte(pText.charCodeAt(j)))
            offset += 8
            /* font = basicFont[pText.charCodeAt(j) - 32]

            for (let i = 0; i < 8; i++) {
                bu.setUint8(offset++, font.charCodeAt(i))
            } */
        }
        oledssd1315_i2cWriteBufferError = pins.i2cWriteBuffer(pADDR, bu)
        control.waitMicros(50)
    }

    //% group="OLED 16x8 Display"
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
            case eDisplayCommand.ENTIRE_ON: { bu.setUint8(1, (pON ? eCommand.A4_ENTITE_DISPLAY_ON : eCommand.A5_RAM_CONTENT_DISPLAY)); break; }
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


    let flipped: boolean
    /**
     * Dreht den Displayinhalt auf den Kopf.
     */
    //% blockId=oledssd1306_flip_screen advanced=true
    //% block="drehe Display"
    export function flipScreen() {
        cmd(eCommand.AE_DISPLAY_OFF);
        cmd(eCommand.C0_COM_SCAN_INC);
        if (flipped) {
            cmd(0xA1)
        } else {
            cmd(0xA0);
        }
        cmd(eCommand.AF_DISPLAY_ON);
    }



    /**
       * Setzt das Display zurück und löscht es.
       * Sollte beim Start des Programms verwendet werden.
       */
    //% block="init Display" advanced=true
    export function inDisplay(): void {
        cmd(0xAE);  // Set display OFF		
        cmd(0xD5);  // Set Display Clock Divide Ratio / OSC Frequency 0xD4
        cmd(0x80);  // Display Clock Divide Ratio / OSC Frequency 
        cmd(0xA8);  // Set Multiplex Ratio
        cmd(0x3F);  // Multiplex Ratio for 128x64 (64-1)
        cmd(0xD3);  // Set Display Offset
        cmd(0x00);  // Display Offset
        cmd(0x40);  // Set Display Start Line
        cmd(0x8D);  // Set Charge Pump
        cmd(0x14);  // Charge Pump (0x10 External, 0x14 Internal DC/DC)
        cmd(0xA1);  // Set Segment Re-Map
        cmd(0xC8);  // Set Com Output Scan Direction
        cmd(0xDA);  // Set COM Hardware Configuration
        cmd(0x12);  // COM Hardware Configuration
        cmd(0x81);  // Set Contrast
        cmd(0xCF);  // Contrast
        cmd(0xD9);  // Set Pre-Charge Period
        cmd(0xF1);  // Set Pre-Charge Period (0x22 External, 0xF1 Internal)
        cmd(0xDB);  // Set VCOMH Deselect Level
        cmd(0x40);  // VCOMH Deselect Level
        cmd(0xA4);  // Set all pixels OFF
        cmd(0xA6);  // Set display not inverted

        cmd(0xAF);  // Set display On
        clDisplay();
    }


    /**
     * Löscht das gesamte Display.
     */
    //% block="lösche Display"
    function clDisplay() {
        cmd(eCommand.AE_DISPLAY_OFF);   //display off
        for (let j = 0; j < 8; j++) {
            setTextXY(j, 0);
            {
                for (let i = 0; i < 16; i++)  //clear all columns
                {
                    putChar('h');
                }
            }
        }
        //clearPage(eADDR.OLED_16x8, 4)
        //clearPage(eADDR.OLED_16x8, 6)
        cmd(eCommand.AF_DISPLAY_ON);    //display on
        setTextXY(0, 0);
    }




    /**
     * Bewegt den Cursor an eine neue Position.
     */
    //% row.min=0 row.max=7 
    //% column.min=0 column.max=15
    //% block="setze Cursor auf Zeile %row| und Spalte %column"
    function setTextXY(row: number, column: number) {
        let r = row;
        let c = column;
        if (row < 0) { r = 0 }
        if (column < 0) { c = 0 }
        if (row > 7) { r = 7 }
        if (column > 15) { c = 15 }

        cmd(0xB0 + r);            //set page address
        cmd(0x00 + (8 * c & 0x0F));  //set column lower address
        cmd(0x10 + ((8 * c >> 4) & 0x0F));   //set column higher address

        //let bu: Buffer

        /* bu = pins.createBuffer(1)
        bu.setUint8(0, 0x00 + ((8 * c) & 0x0F))
        pins.i2cWriteBuffer(0x3c, bu) */

        /* bu = pins.createBuffer(1)
        bu.setUint8(0, 0x10 + ((c >> 1) & 0x07))
        pins.i2cWriteBuffer(0x3c, bu) */

        /* bu = pins.createBuffer(1)
        bu.setUint8(0, 0xB0 + r) */

        /* bu = pins.createBuffer(3)
        bu.setUint8(0, 0x00 | 0x0F & column << 3)    //set column lower address
        bu.setUint8(1, 0x10 | 0x07 & column >> 1)    //set column higher address
        bu.setUint8(2, 0xB0 | 0x07 & row)   */       //set page address
        // 0xB0 darf nicht zuerst im Buffer stehen (offset=0)

        /* bu = pins.createBuffer(2)
        bu.setUint8(0, 0x10 + ((c >> 1) & 0x07))
        bu.setUint8(1, 0xB0 + r) */

        //pins.i2cWriteBuffer(0x3c, bu)


        /* write1Byte(0x3c, 0x00 | 0x0F & column << 3)
        write1Byte(0x3c, 0x10 | 0x07 & column >> 1)
        write1Byte(0x3c, 0xB0 | 0x07 & row) */

    }

    /**
     * Writes a single character to the display.
     */
    function putChar(c: string) {
        let c1 = c.charCodeAt(0);
        switch (c1) {
            case 196: writeCustomChar(extendedCharacters[0]); break;
            case 214: writeCustomChar(extendedCharacters[1]); break;
            case 220: writeCustomChar(extendedCharacters[2]); break;
            case 228: writeCustomChar(extendedCharacters[3]); break;
            case 246: writeCustomChar(extendedCharacters[4]); break;
            case 252: writeCustomChar(extendedCharacters[5]); break;
            case 223: writeCustomChar(extendedCharacters[6]); break;
            case 172: writeCustomChar(extendedCharacters[7]); break;
            case 176: writeCustomChar(extendedCharacters[8]); break;
            default:
                if (c1 < 32 || c1 > 127) //Ignore non-printable ASCII characters. This can be modified for multilingual font.
                {
                    writeCustomChar("\x00\xFF\x81\x81\x81\xFF\x00\x00");
                } else {
                    writeCustomChar(basicFont[c1 - 32]);
                }
        }
    }

    //% block="schreibe %s|auf das Display"
    function writeString(s: string) {
        for (let c of s) {
            putChar(c);
        }
    }

    //% advanced=true
    //% block="schreibe eigenes Zeichen %c"
    function writeCustomChar(c: string) {
        for (let i = 0; i < 8; i++) {
            writeData(c.charCodeAt(i));
        }
    }

    /**
     * Sendet einen Befehl an das Display.
     * Nur verwenden wenn du weißt was du tust!
     */
    //% advanced=true
    //% block="sende Befehl %c|an Display"
    function cmd(c: number) {
        pins.i2cWriteNumber(0x3c, c & 0xFF, NumberFormat.UInt16BE);
    }

    function writeData(n: number) {
        //let b = n;
        /* if (n < 0) { n = 0 }
        if (n > 255) { n = 255 } */
        //pins.i2cWriteNumber(0x3c, 0x4000 + b, NumberFormat.UInt16BE);
        //pins.i2cWriteNumber(0x3c, 0xE300 + b & 0xFF, NumberFormat.UInt16BE);

        let bu = pins.createBuffer(2)
        bu.setUint8(0, 0x40)
        bu.setUint8(1, n)
        pins.i2cWriteBuffer(0x3c, bu)
    }

    //let flipped = false;

    //const DISPLAY_OFF = 0xAE;
    //const DISPLAY_ON = 0xAF;

    /* let oledssd1315_basicFont: Buffer[] = [
        Buffer.create(128), Buffer.create(128), Buffer.create(128), Buffer.create(128),
        Buffer.create(128), Buffer.create(128)
    ] */

    function getPixel8Byte(pCharCode: number) {
        let zArray: string[]
        switch (pCharCode & 0xF0) {
            case 0x20: { zArray = basicFontx20; break; } // 16 string-Elemente je 8 Byte = 128
            case 0x30: { zArray = basicFontx30; break; }
            case 0x40: { zArray = basicFontx40; break; }
            case 0x50: { zArray = basicFontx50; break; }
            case 0x60: { zArray = basicFontx60; break; }
            case 0x70: { zArray = basicFontx70; break; }
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
    }

    export enum ezArray { x20_x2F, x30_x3F, x40_x4F, x50_x5F, x60_x6F, x70_x7F }


    //% group="EEPROM"
    //% block="i2c %pADDR EEPROM schreiben %x4 %x3 %x2 Zeichencodes %pzArray"
    //% inlineInputMode=inline
    export function writeEEPROM(pADDR: eADDR_EEPROM, x4: H4, x3: H3, x2: H2, pzArray: ezArray) {
        let zArray: string[]
        switch (pzArray) {
            case ezArray.x20_x2F: { zArray = basicFontx20; break; } // 16 string-Elemente je 8 Byte = 128
            case ezArray.x30_x3F: { zArray = basicFontx30; break; }
            case ezArray.x40_x4F: { zArray = basicFontx40; break; }
            case ezArray.x50_x5F: { zArray = basicFontx50; break; }
            case ezArray.x60_x6F: { zArray = basicFontx60; break; }
            case ezArray.x70_x7F: { zArray = basicFontx70; break; }
        }
        if (zArray.length = 16) {
            let bu = Buffer.create(130)
            bu.setNumber(NumberFormat.UInt16BE, 0, x4 + x3 + x2)
            for (let i = 0; i <= 15; i++) {
                for (let j = 0; j <= 7; j++) {
                    bu.setUint8(2 + i * 8 + j, zArray[i].charCodeAt(j))
                }
            }
            oledssd1315_i2cWriteBufferError = pins.i2cWriteBuffer(pADDR, bu)
        }
    }
    export enum eADDR_EEPROM {  EEPROM = 0x50}

    export enum H2 {
        x00 = 0x00, /*x10 = 0x10, x20 = 0x20, x30 = 0x30, x40 = 0x40, x50 = 0x50, x60 = 0x60, x70 = 0x70,*/
        x80 = 0x80 /*, x90 = 0x90, xA0 = 0xA0, xB0 = 0xB0, xC0 = 0xC0, xD0 = 0xD0, xE0 = 0xE0, xF0 = 0xF0*/
    }
    export enum H3 {
        /* x000 = 0x000, x100 = 0x100, x200 = 0x200, x300 = 0x300, x400 = 0x400, x500 = 0x500, x600 = 0x600, x700 = 0x700, */
        x800 = 0x800, x900 = 0x900, xA00 = 0xA00, xB00 = 0xB00, xC00 = 0xC00, xD00 = 0xD00, xE00 = 0xE00, xF00 = 0xF00
    }
    export enum H4 {
        /* x0000 = 0x0000, x1000 = 0x1000, x2000 = 0x2000, x3000 = 0x3000, x4000 = 0x4000, x5000 = 0x5000, x6000 = 0x6000, x7000 = 0x7000,
        x8000 = 0x8000, x9000 = 0x9000, xA000 = 0xA000, xB000 = 0xB000, xC000 = 0xC000, xD000 = 0xD000, xE000 = 0xE000,  */
        xF000 = 0xF000
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

    const basicFont: string[] = [
        /*  "\x00\x00\x00\x00\x00\x00\x00\x00", // " "
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

          /* "\x00\x32\x49\x79\x41\x3E\x00\x00", // "@" 32
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
           "\x00\x02\x01\x01\x02\x01\x00\x00"  // "~" 126
           "\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF"  // 127
            */
    ];
    const extendedCharacters: string[] = [
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
