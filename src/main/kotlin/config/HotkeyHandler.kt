package com.tbread.config

import com.sun.jna.platform.win32.User32
import com.sun.jna.platform.win32.WinDef
import com.sun.jna.platform.win32.WinUser
import com.tbread.packet.PropertyHandler
import com.tbread.webview.BrowserApp
import org.slf4j.LoggerFactory

object HotkeyHandler {
    private val logger = LoggerFactory.getLogger(HotkeyHandler::class.java)
    private const val propertyKey = "hotkey"

    private val defaultHotkey = HotkeyCombo(modifiers = WinUser.MOD_CONTROL, vkCode = 0x52)

    @Volatile
    private var currentHotkey: HotkeyCombo = loadHotkeyFromProperties()

    private var listenerThread: Thread? = null

    @Volatile
    private var running = false

    private var onHotkeyPressed: (() -> Unit)? = null

    fun registerCallback(callback: () -> Unit) {
        onHotkeyPressed = callback
    }

    data class HotkeyCombo(val modifiers: Int, val vkCode: Int) {
        override fun toString() = "modifiers=$modifiers,vkCode=$vkCode"

        companion object {
            private val logger = LoggerFactory.getLogger(HotkeyCombo::class.java)
            fun fromString(s: String): HotkeyCombo? {
                return try {
                    val map = s.split(",").associate {
                        val (k, v) = it.split("=")
                        k.trim() to v.trim().toInt()
                    }
                    HotkeyCombo(map["modifiers"]!!, map["vkCode"]!!)
                } catch (e: Exception) {
                    logger.warn("문자열 파싱실패로 단축키 초기화")
                    null
                }
            }
        }
    }

    private fun loadHotkeyFromProperties(): HotkeyCombo {
        val raw = PropertyHandler.getProperty(propertyKey)
        return if (raw != null) HotkeyCombo.fromString(raw) ?: defaultHotkey else defaultHotkey
    }

    fun getCurrentHotkey(): HotkeyCombo = currentHotkey


    fun updateHotkey(modifiers: Int, vkCode: Int) {
        currentHotkey = HotkeyCombo(modifiers, vkCode)
        PropertyHandler.setProperty(propertyKey, currentHotkey.toString())
        logger.info("단축키 변경: $currentHotkey")


        stop()
        start()
    }

    fun start() {
        if (running) return
        running = true
        listenerThread = Thread({
            val user32 = User32.INSTANCE
            val hotkeyId = 1

            val registered = user32.RegisterHotKey(
                null,
                hotkeyId,
                currentHotkey.modifiers,
                currentHotkey.vkCode
            )

            if (!registered) {
                logger.error("단축키 등록 실패: $currentHotkey")
                running = false
                return@Thread
            }

            logger.info("단축키 등록 성공: $currentHotkey")

            val msg = WinUser.MSG()
            while (running) {
                if (user32.PeekMessage(msg, null, 0, 0, 1)) {
                    if (msg.message == WinUser.WM_HOTKEY) {
                        onHotkeyPressed?.invoke()
                    }
                } else {
                    Thread.sleep(10)
                }
            }

            user32.UnregisterHotKey(null, hotkeyId)
            logger.info("단축키 해제")
        }, "HotkeyListener").apply { isDaemon = true }

        listenerThread!!.start()
    }

    fun stop() {
        running = false
        listenerThread?.interrupt()
        listenerThread = null
    }
}