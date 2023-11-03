
//% color=#0000BF icon="\uf108" block="OLED 16x8" weight=20
//% groups='["beim Start"]'
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
    //% group="beim Start"
    //% block="i2c %pADDR beim Start || i2c-Check %ck"
    //% ck.shadow="toggleOnOff" ck.defl=1
    //% blockSetVariable=OLED16x8
    export function beimStart(pADDR: eADDR, ck?: boolean): oledclass {
        return new oledclass(pADDR, (ck ? true : false)) // optionaler boolean Parameter kann undefined sein
    }
    export class oledclass {
        private readonly i2cADDR: eADDR
        private readonly i2cCheck: boolean // i2c-Check

        private i2cError: number = 0 // Fehlercode vom letzten WriteBuffer (0 ist kein Fehler)
        constructor(pADDR: eADDR, ck: boolean) {
            this.i2cADDR = pADDR
            this.i2cCheck = ck
            this.i2cError = 0 // Reset Fehlercode
            //this.i2cRESET_OUTPUTS()
        }
    }
}