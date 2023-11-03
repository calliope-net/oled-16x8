input.onButtonEvent(Button.A, input.buttonEventClick(), function () {
    OLED16x8.clearScreen(0, 7, 0)
    oledssd1315.clearScreen(oledssd1315.oledssd1315_eADDR(oledssd1315.eADDR.OLED_16x8_x3C), 0, 7, 0)
})
let OLED16x8: oledssd1315.oledclass = null
OLED16x8 = oledssd1315.beimStart(oledssd1315.oledssd1315_eADDR(oledssd1315.eADDR.OLED_16x8_x3C))
