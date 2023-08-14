
//% color=#007FFF icon="\uf108" block="OLED 16x8" weight=15
namespace oledssd1315
/*
    // initdisplaycodes from https://gist.githubusercontent.com/pulsar256/564fda3b9e8fc6b06b89/raw/4bb559d4088e42f7b4859a8533be920434818617/ssd1306_init.c
*/ {
    export enum eADDR { OLED_16x8 = 0x3C, OLED_16x8_x3D = 0x3D }
    // For the SSD1315, the slave address is either "b0111100" or "b0111101" by changing the SA0 to LOW or HIGH (D/C pin acts as SA0).

    export enum eCommand {
        Display_OFF = 0xAE,
        Display_ON = 0xAF,



    }
    let x = 0
    //% block
    export function test() {
        return x++
    }

    function write2Byte(pADDR: eADDR, b0: number, b1: number) {
        let bu = pins.createBuffer(2)
        bu.setUint8(0, b0)
        bu.setUint8(1, b1)
        pins.i2cWriteBuffer(pADDR, bu)
    }
    function write1Byte(pADDR: eADDR, b0: number) {
        let bu = pins.createBuffer(1)
        bu.setUint8(0, b0)
        pins.i2cWriteBuffer(pADDR, bu)
    }



    //% block="i2c %pADDR init Display"
    export function init(pADDR: eADDR) {
        //let bu = pins.createBuffer(18)
        //let off = 0 // Buffer offset

        //bu.setUint8(off++, eCommand.Display_OFF) // Set display OFF
        write1Byte(pADDR, eCommand.Display_OFF)//0xAE

        //bu.setUint8(off++, 0xD5)    // Set Display Clock Divide Ratio / OSC Frequency
        //bu.setUint8(off++, 0x80)// 0x90)    //     default 0x80
        write2Byte(pADDR, 0xD5, 0x90)

        //*
        //bu.setUint8(off++, 0xA8)  // Set Multiplex Ratio
        //bu.setUint8(off++, 0x3F)  //     Multiplex Ratio for 128x64 (64-1)
        write2Byte(pADDR, 0xA8, 0x3F)

        //bu.setUint8(off++, 0xD3)  // Set Display Offset
        //bu.setUint8(off++, 0x00)  //     Display Offset
        write2Byte(pADDR, 0xD3, 0x00)

        //bu.setUint8(off++, 0x40)  // Set Display Start Line
        write1Byte(pADDR, 0x40)

        //bu.setUint8(off++, 0x8D)  // Set Charge Pump
        //bu.setUint8(off++, 0x14)//0x10)  //     Charge Pump (0x10 Disable; 0x14 7,5V; 0x94 8,5V; 0x95 9,0V)
        write2Byte(pADDR, 0x8D, 0x14)

        //
        //bu.setUint8(off++, 0xA1)    // Set Segment Re-Map default 0xA0
        write1Byte(pADDR, 0xA1)

        //bu.setUint8(off++, 0xC8)    // Set Com Output Scan Direction default 0xC0
        write1Byte(pADDR, 0xC8)

        //*
        /* bu.setUint8(off++, 0xDA)  // Set COM Hardware Configuration
        bu.setUint8(off++, 0x12) */  //     COM Hardware Configuration
        write2Byte(pADDR, 0xDA, 0x12)
        //

        //bu.setUint8(off++, 0x81)  // Set Contrast
        //bu.setUint8(off++, 0xB0)  //     Contrast default 0x7F
        write2Byte(pADDR, 0x81, 0xB0)

        //*
        /* bu.setUint8(off++, 0xD9)  // Set Pre-Charge Period
        bu.setUint8(off++, 0xF1) *///0x22)  //     Pre-Charge Period (0x22 External, 0xF1 Internal)
        write2Byte(pADDR, 0xD9, 0x22)
        //

        //bu.setUint8(off++, 0xDB)  // Set VCOMH Deselect Level
        //bu.setUint8(off++, 0x40)//0x30)  //     VCOMH Deselect Level default 0x20
        write2Byte(pADDR, 0xDB, 0x30)

        //*
        //bu.setUint8(off++, 0xA4) // Set all pixels OFF
        write1Byte(pADDR, 0xA4)

        //
        //bu.setUint8(off++, 0xA6)  // Set display not inverted / A6 Normal A7 Inverse display
        write1Byte(pADDR, 0xA6)

        //bu.setUint8(off++, eCommand.Display_ON)
        write1Byte(pADDR, 0xAF)



        //pins.i2cWriteBuffer(pADDR, bu)

        clearPage(pADDR, 3)

        control.waitMicros(100000)// 100ms Delay Recommended

    }

    /**
       * Setzt das Display zurück und löscht es.
       * Sollte beim Start des Programms verwendet werden.
       */
    //% block="init Display"
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
        cmd(DISPLAY_OFF);   //display off
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
        cmd(DISPLAY_ON);    //display on
        setTextXY(0, 0);
    }

    //% block="i2c %pADDR lösche Zeile %pPage"
    //% pPage.min=0 pPage.max=7
    export function clearPage(pADDR: eADDR, pPage: number) {
        // Page (0-7) ist eine Text-Zeile 8 Pixel hoch
        //setCursor(pADDR, pPage, 0)
        setTextXY(pPage, 0)
        putChar("x")
        /*  let bu = pins.createBuffer(2)
         bu.setUint8(0, 0x40)    //set column lower address 0-15
         bu.setUint8(1, 0x44)
         //bu.setUint8(2, 0xB0 | 0x07 & pPage)         //set page address 0-7
         //bu.fill(0x44, 1, 48)
         pins.i2cWriteBuffer(pADDR, bu) */
    }

    //% block="i2c %pADDR setCursor row %row col %col" weight=82
    //% row.min=0 row.max=7 col.min=0 col.max=15
    export function setCursor(pADDR: eADDR, row: number, col: number) {
        /* let bu = pins.createBuffer(3)
        bu.setUint8(0, 0x00 | 0x0F & col << 3)    //set column lower address
        bu.setUint8(1, 0x10 | 0x07 & col >> 1)    //set column higher address
        bu.setUint8(2, 0xB0 | 0x07 & row)         //set page address 
        // 0xB0 darf nicht zuerst im Buffer stehen (offset=0)
        pins.i2cWriteBuffer(pADDR, bu)
        //write0x80Byte(pADDR, (row == 0 ? col | 0x80 : col | 0xc0))
        //control.waitMicros(50) */

        write1Byte(0x3c, 0x00 | 0x0F & col << 3)
        write1Byte(0x3c, 0x10 | 0x07 & col >> 1)
        write1Byte(0x3c, 0xB0 | 0x07 & row)
    }

    /**
     * Bewegt den Cursor an eine neue Position.
     */
    //% row.min=0 row.max=7 
    //% column.min=0 column.max=15
    //% block="setze Cursor auf Zeile %row| und Spalte %column"
    export function setTextXY(row: number, column: number) {
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
    export function writeString(s: string) {
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
        //pins.i2cWriteNumber(0x3c, c, NumberFormat.UInt16BE);
        pins.i2cWriteNumber(0x3c, c & 0xFF, NumberFormat.UInt16BE);

        /* let bu = pins.createBuffer(1)
        bu.setUint8(0, c) */

        /* let bu = pins.createBuffer(2)
        bu.setUint8(0, 0)
        bu.setUint8(1, c) */

        /* pins.i2cWriteBuffer(0x3c, bu) */
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

    let flipped = false;

    const DISPLAY_OFF = 0xAE;
    const DISPLAY_ON = 0xAF;
    /*    const SET_DISPLAY_CLOCK_DIV = 0xD5;
       const SET_MULTIPLEX = 0xA8;
       const SET_DISPLAY_OFFSET = 0xD3;
       const SET_START_LINE = 0x00;
       const CHARGE_PUMP = 0x8D;
       const EXTERNAL_VCC = false;
       const MEMORY_MODE = 0x20;
       const SEG_REMAP = 0xA1; // using 0xA0 will flip screen
       const COM_SCAN_DEC = 0xC8;
       const COM_SCAN_INC = 0xC0;
       const SET_COM_PINS = 0xDA;
       const SET_CONTRAST = 0x81;
       const SET_PRECHARGE = 0xd9;
       const SET_VCOM_DETECT = 0xDB;
       const DISPLAY_ALL_ON_RESUME = 0xA4;
       const NORMAL_DISPLAY = 0xA6;
       const COLUMN_ADDR = 0x21;
       const PAGE_ADDR = 0x22;
       const INVERT_DISPLAY = 0xA7;
       const ACTIVATE_SCROLL = 0x2F;
       const DEACTIVATE_SCROLL = 0x2E;
       const SET_VERTICAL_SCROLL_AREA = 0xA3;
       const RIGHT_HORIZONTAL_SCROLL = 0x26;
       const LEFT_HORIZONTAL_SCROLL = 0x27;
       const VERTICAL_AND_RIGHT_HORIZONTAL_SCROLL = 0x29;
       const VERTICAL_AND_LEFT_HORIZONTAL_SCROLL = 0x2A; */


    const basicFont: string[] = [
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
        "\x00\x32\x49\x79\x41\x3E\x00\x00", // "@"
        "\x00\x7E\x09\x09\x09\x7E\x00\x00", // "A"
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
        "\x00\x02\x01\x01\x02\x01\x00\x00"  // "~"
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


} // oledssd1315.ts
