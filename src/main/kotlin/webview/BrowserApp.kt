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
import com.sun.jna.Native
import com.sun.jna.win32.StdCallLibrary
import com.sun.jna.win32.W32APIOptions
import javafx.animation.KeyFrame
import javafx.animation.Timeline
import javafx.application.Application
import javafx.application.HostServices
import javafx.application.Platform
import javafx.concurrent.Worker
import javafx.scene.Scene
import javafx.scene.input.KeyCode
import javafx.scene.input.KeyEvent
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
import java.io.File
import java.net.InetSocketAddress
import java.util.concurrent.Executors
import com.sun.net.httpserver.HttpServer

import netscape.javascript.JSObject
import org.slf4j.LoggerFactory

class BrowserApp(private val dpsCalculator: DpsCalculator) : Application() {

    private val logger = LoggerFactory.getLogger(BrowserApp::class.java)
    private val pmRemoveFlag = 0x0001
    @Volatile private var keyCaptureEnabled = false
    @Volatile private var lastHotkeyMods = 0
    @Volatile private var lastHotkeyKey = 0
    @Volatile private var registeredHotkeyMods = 0
    @Volatile private var registeredHotkeyKey = 0
    @Volatile private var isAion2ForegroundCached = false
    private var foregroundHook: WinNT.HANDLE? = null
    private var foregroundHookProc: WinEventProc? = null
    // WinEventHook을 직접 선언해서 포커스 변경 이벤트를 즉시 받는다 (폴링 회피).
    private val user32Ex: User32Ex = Native.load(
        "user32",
        User32Ex::class.java,
        W32APIOptions.DEFAULT_OPTIONS
    )
    private val EVENT_SYSTEM_FOREGROUND = 0x0003
    private val WINEVENT_OUTOFCONTEXT = 0x0000

    private fun interface WinEventProc : StdCallLibrary.StdCallCallback {
        fun callback(
            hWinEventHook: WinNT.HANDLE?,
            event: Int,
            hwnd: WinDef.HWND?,
            idObject: Int,
            idChild: Int,
            dwEventThread: Int,
            dwmsEventTime: Int
        )
    }

    private interface User32Ex : StdCallLibrary {
        fun SetWinEventHook(
            eventMin: Int,
            eventMax: Int,
            hmodWinEventProc: WinDef.HMODULE?,
            pfnWinEventProc: WinEventProc,
            idProcess: Int,
            idThread: Int,
            dwFlags: Int
        ): WinNT.HANDLE?

        fun UnhookWinEvent(hWinEventHook: WinNT.HANDLE?): Boolean
    }

    @Serializable
    private data class NativeKeyPayload(
        val keyCode: Int,
        val keyText: String,
        val ctrl: Boolean,
        val alt: Boolean,
        val shift: Boolean,
        val meta: Boolean
    )

    @Serializable
    private data class CaptureKeyPayload(
        val keyCode: Int,
        val keyName: String,
        val text: String,
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
            lastHotkeyMods = modifiers
            lastHotkeyKey = keyCode
            // Aion2 포커스일 때만 등록되도록 현재 상태로 갱신.
            updateHotkeyRegistration(isAion2ForegroundCached)
        }

        fun startKeyCapture() {
            keyCaptureEnabled = true
            // 캡처 중에는 전역 핫키가 OS에 의해 가로채지 않도록 해제.
            updateHotkeyRegistration(false)
        }

        fun stopKeyCapture() {
            keyCaptureEnabled = false
            updateHotkeyRegistration(isAion2ForegroundCached)
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
    private var httpServer: HttpServer? = null
    private val httpPort = 57941


    override fun start(stage: Stage) {
        stage.setOnCloseRequest {
            stopHotkeyThread()
            stopForegroundHook()
            stopLocalServer()
            exitProcess(0)
        }
        val webView = WebView()
        val engine = webView.engine
        configureWebViewStorage(engine)
        engineRef = engine
        if (!startLocalServer()) {
            logger.error("로컬 HTTP 서버 시작 실패")
            return
        }
        // 고정 포트로 로드해서 localStorage origin을 유지한다.
        engine.load("http://127.0.0.1:$httpPort/index.html")

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
        scene.addEventFilter(KeyEvent.KEY_PRESSED) { event ->
            if (!keyCaptureEnabled) {
                return@addEventFilter
            }
            val code = event.code
            if (code == KeyCode.SHIFT || code == KeyCode.CONTROL || code == KeyCode.ALT || code == KeyCode.META) {
                return@addEventFilter
            }
            val payload = CaptureKeyPayload(
                keyCode = code.code,
                keyName = code.name,
                text = event.text ?: "",
                ctrl = event.isControlDown,
                alt = event.isAltDown,
                shift = event.isShiftDown,
                meta = event.isMetaDown
            )
            dispatchCapturedKey(payload)
            event.consume()
        }

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
        startForegroundHook()
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
        stopForegroundHook()
        stopLocalServer()
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
        registeredHotkeyMods = modifiers
        registeredHotkeyKey = keyCode
    }

    private fun dispatchResetHotKey(payload: NativeKeyPayload) {
        val engine = engineRef ?: return
        val json = Json.encodeToString(payload)
        Platform.runLater {
            try {
                engine.executeScript(
                    "window.dispatchEvent(new CustomEvent('nativeResetHotKey', { detail: $json }));"
                )
            } catch (e: Exception) {
                logger.debug("nativeResetHotKey 이벤트 전달 실패", e)
            }
        }
    }

    private fun dispatchCapturedKey(payload: CaptureKeyPayload) {
        val engine = engineRef ?: return
        val json = Json.encodeToString(payload)
        Platform.runLater {
            try {
                engine.executeScript(
                    "window.dispatchEvent(new CustomEvent('settings:captureKey', { detail: $json }));"
                )
            } catch (e: Exception) {
                logger.debug("captureKey 이벤트 전달 실패", e)
            }
        }
    }

    private fun configureWebViewStorage(engine: WebEngine) {
        val appData = System.getenv("APPDATA") ?: System.getProperty("user.home")
        val userDataDir = File(appData, "aion2meter4j/webview")
        if (!userDataDir.exists()) {
            userDataDir.mkdirs()
        }
        engine.userDataDirectory = userDataDir
        logger.info("webview userDataDirectory={}", userDataDir.absolutePath)
    }

    private fun startLocalServer(): Boolean {
        if (httpServer != null) {
            return true
        }
        return try {
            val server = HttpServer.create(InetSocketAddress("127.0.0.1", httpPort), 0)
            server.createContext("/") { exchange ->
                val rawPath = exchange.requestURI?.path ?: "/"
                val path = when {
                    rawPath == "/" || rawPath.isBlank() -> "/index.html"
                    else -> rawPath
                }
                if (path.contains("..")) {
                    exchange.sendResponseHeaders(403, -1)
                    exchange.close()
                    return@createContext
                }
                val resourcePath = path.removePrefix("/")
                val stream = javaClass.getResourceAsStream("/$resourcePath")
                if (stream == null) {
                    exchange.sendResponseHeaders(404, -1)
                    exchange.close()
                    return@createContext
                }
                stream.use { input ->
                    val bytes = input.readBytes()
                    val contentType = resolveContentType(resourcePath)
                    exchange.responseHeaders.set("Content-Type", contentType)
                    exchange.responseHeaders.set("Cache-Control", "no-store")
                    exchange.sendResponseHeaders(200, bytes.size.toLong())
                    exchange.responseBody.use { it.write(bytes) }
                }
            }
            server.executor = Executors.newSingleThreadExecutor { runnable ->
                Thread(runnable, "local-http-server").apply { isDaemon = true }
            }
            server.start()
            httpServer = server
            logger.info("local http server started http://127.0.0.1:{}", httpPort)
            true
        } catch (e: Exception) {
            logger.error("로컬 HTTP 서버 시작 실패", e)
            false
        }
    }

    private fun stopLocalServer() {
        try {
            httpServer?.stop(0)
        } catch (e: Exception) {
            logger.warn("로컬 HTTP 서버 종료 실패", e)
        } finally {
            httpServer = null
        }
    }

    private fun resolveContentType(path: String): String {
        return when {
            path.endsWith(".html") -> "text/html; charset=UTF-8"
            path.endsWith(".css") -> "text/css; charset=UTF-8"
            path.endsWith(".js") -> "application/javascript; charset=UTF-8"
            path.endsWith(".json") -> "application/json; charset=UTF-8"
            path.endsWith(".png") -> "image/png"
            path.endsWith(".jpg") || path.endsWith(".jpeg") -> "image/jpeg"
            path.endsWith(".gif") -> "image/gif"
            path.endsWith(".svg") -> "image/svg+xml"
            else -> "application/octet-stream"
        }
    }

    private fun startHotkeyThread(modifiers: Int, keyCode: Int) {
        stopHotkeyThread()
        hotkeyRunning = true
        hotkeyThread = Thread {
            val registeredMods = modifiers or WinUser.MOD_NOREPEAT
            val registered = User32.INSTANCE.RegisterHotKey(null, hotkeyId, registeredMods, keyCode)
            if (!registered) {
                val err = Kernel32.INSTANCE.GetLastError()
                logger.warn("RegisterHotKey 실패 mods={} vk={} err={}", registeredMods, keyCode, err)
            } else {
                logger.info("RegisterHotKey 등록 mods={} vk={}", registeredMods, keyCode)
            }

            val msg = WinUser.MSG()
            while (hotkeyRunning) {
                while (User32.INSTANCE.PeekMessage(msg, null, 0, 0, pmRemoveFlag)) {
                    if (msg.message == WinUser.WM_HOTKEY) {
                        val foreground = User32.INSTANCE.GetForegroundWindow()
                        if (foreground == null || !isAion2Window(foreground)) {
                            continue
                        }
                        val lParam = msg.lParam.toInt()
                        val recvMods = lParam and 0xFFFF
                        val recvVk = (lParam ushr 16) and 0xFFFF
                        val payload = NativeKeyPayload(
                            keyCode = recvVk,
                            keyText = java.awt.event.KeyEvent.getKeyText(recvVk),
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
                        dispatchResetHotKey(payload)
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

    private fun getWindowTitle(hwnd: WinDef.HWND): String {
        val buffer = CharArray(256)
        val len = User32.INSTANCE.GetWindowText(hwnd, buffer, buffer.size)
        return if (len > 0) String(buffer, 0, len) else ""
    }

    private fun isAion2Window(hwnd: WinDef.HWND): Boolean {
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
        registeredHotkeyMods = 0
        registeredHotkeyKey = 0
    }

    @Synchronized
    private fun updateHotkeyRegistration(shouldRegister: Boolean) {
        // 포커스/캡처 상태에 따라 전역 핫키 등록을 유지/해제한다.
        if (keyCaptureEnabled) {
            stopHotkeyThread()
            return
        }
        if (!shouldRegister) {
            stopHotkeyThread()
            return
        }
        if (lastHotkeyMods == 0 && lastHotkeyKey == 0) {
            stopHotkeyThread()
            return
        }
        if (hotkeyRunning &&
            lastHotkeyMods == registeredHotkeyMods &&
            lastHotkeyKey == registeredHotkeyKey
        ) {
            return
        }
        registerHotkey(lastHotkeyMods, lastHotkeyKey)
    }

    private fun startForegroundHook() {
        if (!System.getProperty("os.name").lowercase().contains("windows")) {
            return
        }
        if (foregroundHook != null) {
            return
        }
        // 포커스 변경 이벤트로 Aion2 포커싱 여부를 감지한다.
        val proc = WinEventProc { _, event, hwnd, _, _, _, _ ->
            if (event != EVENT_SYSTEM_FOREGROUND || hwnd == null) {
                return@WinEventProc
            }
            val isAion2 = isAion2Window(hwnd)
            if (isAion2 != isAion2ForegroundCached) {
                isAion2ForegroundCached = isAion2
                updateHotkeyRegistration(isAion2)
            }
        }
        foregroundHookProc = proc
        val hook = user32Ex.SetWinEventHook(
            EVENT_SYSTEM_FOREGROUND,
            EVENT_SYSTEM_FOREGROUND,
            null,
            proc,
            0,
            0,
            WINEVENT_OUTOFCONTEXT
        )
        if (hook == null) {
            foregroundHookProc = null
            logger.warn("WinEventHook 등록 실패")
            return
        }
        foregroundHook = hook
        val current = User32.INSTANCE.GetForegroundWindow()
        isAion2ForegroundCached = current != null && isAion2Window(current)
        updateHotkeyRegistration(isAion2ForegroundCached)
    }

    private fun stopForegroundHook() {
        val hook = foregroundHook ?: return
        try {
            user32Ex.UnhookWinEvent(hook)
        } catch (e: Exception) {
            logger.warn("WinEventHook 해제 실패", e)
        } finally {
            foregroundHook = null
            foregroundHookProc = null
        }
    }
}
