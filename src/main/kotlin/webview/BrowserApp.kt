package com.tbread.webview

import com.tbread.DpsCalculator
import com.tbread.entity.DpsData
import com.sun.jna.platform.win32.Kernel32
import com.sun.jna.platform.win32.Psapi
import com.sun.jna.platform.win32.User32
import com.sun.jna.platform.win32.WinDef
import com.sun.jna.platform.win32.WinUser
import com.sun.jna.platform.win32.WinNT
import com.sun.jna.ptr.IntByReference
import javafx.animation.KeyFrame
import javafx.animation.Timeline
import javafx.application.Application
import javafx.application.HostServices
import javafx.application.Platform
import javafx.concurrent.Worker
import javafx.scene.Scene
import javafx.scene.paint.Color
import javafx.scene.web.WebEngine
import javafx.scene.web.WebView
import javafx.stage.Stage
import javafx.stage.StageStyle
import javafx.util.Duration
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString
import kotlin.system.exitProcess
import java.awt.event.KeyEvent

import netscape.javascript.JSObject
import org.slf4j.LoggerFactory

class BrowserApp(private val dpsCalculator: DpsCalculator) : Application() {

    private val logger = LoggerFactory.getLogger(BrowserApp::class.java)
    private val pmRemoveFlag = 0x0001

    @Serializable
    private data class NativeKeyPayload(
        val keyCode: Int,
        val rawCode: Int,
        val keyText: String,
        val ctrl: Boolean,
        val alt: Boolean,
        val shift: Boolean,
        val meta: Boolean
    )

    inner class JSBridge(private val stage: Stage,private val dpsCalculator: DpsCalculator,private val hostServices: HostServices,) {
        fun moveWindow(x: Double, y: Double) {
            stage.x = x
            stage.y = y
        }

        fun resetDps(){
            dpsCalculator.resetDataStorage()
        }
        fun openBrowser(url: String) {
            try {
                hostServices.showDocument(url)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        fun exitApp() {
          Platform.exit()     
          exitProcess(0)       
        }

        fun setHotkey(modifiers: Int, keyCode: Int) {
            logger.info("setHotkey called mods={} vk={}", modifiers, keyCode)
            registerHotkey(modifiers, keyCode)
        }
    }

    @Volatile
    private var dpsData: DpsData = dpsCalculator.getDps()

    private val debugMode = false

    private val version = "0.2.4"
    private var engineRef: WebEngine? = null
    @Volatile private var hotkeyThread: Thread? = null
    @Volatile private var hotkeyRunning = false
    private val hotkeyId = 1
    private val hotkeyTargetProcess = "Aion2.exe"
    private val hotkeyTargetTitle = "Aion2"


    override fun start(stage: Stage) {
        stage.setOnCloseRequest {
            stopHotkeyThread()
            exitProcess(0)
        }
        val webView = WebView()
        val engine = webView.engine
        engineRef = engine
        engine.load(javaClass.getResource("/index.html")?.toExternalForm())

        val bridge = JSBridge(stage, dpsCalculator, hostServices)
        engine.loadWorker.stateProperty().addListener { _, _, newState ->
            if (newState == Worker.State.SUCCEEDED) {
                val window = engine.executeScript("window") as JSObject
                window.setMember("javaBridge", bridge)
                window.setMember("dpsData", this)
            }
        }


        val scene = Scene(webView, 1600.0, 1000.0)
        scene.fill = Color.TRANSPARENT

        try {
            val pageField = engine.javaClass.getDeclaredField("page")
            pageField.isAccessible = true
            val page = pageField.get(engine)

            val setBgMethod = page.javaClass.getMethod("setBackgroundColor", Int::class.javaPrimitiveType)
            setBgMethod.isAccessible = true
            setBgMethod.invoke(page, 0)
        } catch (e: Exception) {
            logger.error("리플렉션 실패",e)
        }

        stage.initStyle(StageStyle.TRANSPARENT)
        stage.scene = scene
        stage.isAlwaysOnTop = true
        stage.title = "Aion2 Dps Overlay"

        stage.show()
        Timeline(KeyFrame(Duration.millis(500.0), {
            dpsData = dpsCalculator.getDps()
        })).apply {
            cycleCount = Timeline.INDEFINITE
            play()
        }
    }

    fun getDpsData(): String {
        return Json.encodeToString(dpsData)
    }

    fun isDebuggingMode(): Boolean {
        return debugMode
    }

    fun getBattleDetail(uid:Int):String{
        return Json.encodeToString(dpsData.map[uid]?.analyzedData)
    }

    fun getVersion():String{
        return version
    }

    override fun stop() {
        stopHotkeyThread()
        super.stop()
    }

    private fun registerHotkey(modifiers: Int, keyCode: Int) {
        if (!System.getProperty("os.name").lowercase().contains("windows")) {
            logger.info("전역 핫키는 Windows에서만 활성화됩니다.")
            return
        }
        if (modifiers == 0 && keyCode == 0) {
            stopHotkeyThread()
            return
        }
        startHotkeyThread(modifiers, keyCode)
    }

    private fun dispatchNativeKey(payload: NativeKeyPayload) {
        val engine = engineRef ?: return
        val json = Json.encodeToString(payload)
        Platform.runLater {
            try {
                engine.executeScript(
                    "window.dispatchEvent(new CustomEvent('nativeKey', { detail: $json }));"
                )
            } catch (e: Exception) {
                logger.debug("nativeKey 이벤트 전달 실패", e)
            }
        }
    }

    private fun startHotkeyThread(modifiers: Int, keyCode: Int) {
        stopHotkeyThread()
        hotkeyRunning = true
        hotkeyThread = Thread {
            val registered = User32.INSTANCE.RegisterHotKey(null, hotkeyId, modifiers, keyCode)
            if (!registered) {
                val err = Kernel32.INSTANCE.GetLastError()
                logger.warn("RegisterHotKey 실패 mods={} vk={} err={}", modifiers, keyCode, err)
            } else {
                logger.info("RegisterHotKey 등록 mods={} vk={}", modifiers, keyCode)
            }

            val msg = WinUser.MSG()
            while (hotkeyRunning) {
                while (User32.INSTANCE.PeekMessage(msg, null, 0, 0, pmRemoveFlag)) {
                    if (msg.message == WinUser.WM_HOTKEY) {
                        if (!isAion2Foreground()) {
                            continue
                        }
                        val lParam = msg.lParam.toInt()
                        val recvMods = lParam and 0xFFFF
                        val recvVk = (lParam ushr 16) and 0xFFFF
                        val payload = NativeKeyPayload(
                            keyCode = recvVk,
                            rawCode = recvVk,
                            keyText = KeyEvent.getKeyText(recvVk),
                            ctrl = (recvMods and WinUser.MOD_CONTROL) != 0,
                            alt = (recvMods and WinUser.MOD_ALT) != 0,
                            shift = (recvMods and WinUser.MOD_SHIFT) != 0,
                            meta = (recvMods and WinUser.MOD_WIN) != 0
                        )
                        logger.info(
                            "hotkey received mods={} vk={} keyText={}",
                            recvMods,
                            recvVk,
                            payload.keyText
                        )
                        dispatchNativeKey(payload)
                    }
                }
                Thread.sleep(25)
            }
            User32.INSTANCE.UnregisterHotKey(null, hotkeyId)
        }.apply {
            isDaemon = true
            name = "hotkey-thread"
            start()
        }
    }

    private fun isAion2Foreground(): Boolean {
        val hwnd = User32.INSTANCE.GetForegroundWindow() ?: return false
        val title = getWindowTitle(hwnd)
        if (title.contains(hotkeyTargetTitle, ignoreCase = true)) {
            return true
        }
        val pidRef = IntByReference()
        User32.INSTANCE.GetWindowThreadProcessId(hwnd, pidRef)
        val pidValue = pidRef.value
        if (pidValue <= 0) {
            return false
        }
        val processName = getProcessName(pidValue) ?: return false
        return processName.equals(hotkeyTargetProcess, ignoreCase = true)
    }

    private fun getWindowTitle(hwnd: WinDef.HWND): String {
        val buffer = CharArray(256)
        val len = User32.INSTANCE.GetWindowText(hwnd, buffer, buffer.size)
        return if (len > 0) String(buffer, 0, len) else ""
    }

    private fun getProcessName(pid: Int): String? {
        val processHandle = Kernel32.INSTANCE.OpenProcess(
            WinNT.PROCESS_QUERY_LIMITED_INFORMATION or WinNT.PROCESS_VM_READ,
            false,
            pid
        ) ?: return null
        return try {
            val buffer = CharArray(260)
            val ok = Psapi.INSTANCE.GetProcessImageFileName(
                processHandle,
                buffer,
                buffer.size
            )
            if (ok > 0) {
                val fullPath = String(buffer, 0, ok)
                fullPath.substringAfterLast('\\', fullPath)
            } else {
                null
            }
        } finally {
            Kernel32.INSTANCE.CloseHandle(processHandle)
        }
    }

    private fun stopHotkeyThread() {
        hotkeyRunning = false
        hotkeyThread?.interrupt()
        hotkeyThread = null
    }

}
