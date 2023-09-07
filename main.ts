input.onButtonEvent(Button.A, input.buttonEventClick(), function () {
    oledssd1315.writeText(oledssd1315.oledssd1315_eADDR(oledssd1315.eADDR.OLED_16x8), 0, 2, 15, oledssd1315.eAlign.left, "EEPROM brennen")
    oledssd1315.writeText(oledssd1315.oledssd1315_eADDR(oledssd1315.eADDR.OLED_16x8), 2, 4, 11, oledssd1315.eAlign.left, "fertig")
})
input.onButtonEvent(Button.B, input.buttonEventClick(), function () {
    oledssd1315.fillScreen(oledssd1315.oledssd1315_eADDR(oledssd1315.eADDR.OLED_16x8))
})
oledssd1315.init(oledssd1315.oledssd1315_eADDR(oledssd1315.eADDR.OLED_16x8))
oledssd1315.init(oledssd1315.oledssd1315_eADDR(oledssd1315.eADDR.OLED_16x8_x3D))
