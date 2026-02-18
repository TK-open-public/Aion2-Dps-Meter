package com.tbread.webview

import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class BrowserAppHotkeyPolicyTest {

    @Test
    fun doesNotRegisterWhenCaptureModeIsEnabled() {
        assertFalse(
            BrowserApp.shouldRegisterHotkey(
                keyCaptureEnabled = true,
                shouldRegister = true,
                modifiers = 0x0002,
                keyCode = 0x52,
            )
        )
    }

    @Test
    fun doesNotRegisterWhenWindowConditionIsFalse() {
        assertFalse(
            BrowserApp.shouldRegisterHotkey(
                keyCaptureEnabled = false,
                shouldRegister = false,
                modifiers = 0x0002,
                keyCode = 0x52,
            )
        )
    }

    @Test
    fun doesNotRegisterForEmptyHotkey() {
        assertFalse(
            BrowserApp.shouldRegisterHotkey(
                keyCaptureEnabled = false,
                shouldRegister = true,
                modifiers = 0,
                keyCode = 0,
            )
        )
    }

    @Test
    fun registersForValidHotkey() {
        assertTrue(
            BrowserApp.shouldRegisterHotkey(
                keyCaptureEnabled = false,
                shouldRegister = true,
                modifiers = 0x0002,
                keyCode = 0x52,
            )
        )
    }
}
