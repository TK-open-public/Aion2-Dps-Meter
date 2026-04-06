package com.tbread.webview

import com.sun.jna.platform.win32.Kernel32
import com.sun.jna.platform.win32.Psapi
import com.sun.jna.platform.win32.User32
import com.sun.jna.platform.win32.WinNT
import com.tbread.DpsCalculator
import com.tbread.addon.UploadManager
import com.tbread.config.HotkeyHandler
import com.tbread.config.PropertyHandler
import com.tbread.config.VersionConfig
import com.tbread.data.DataManager
import com.tbread.entity.DpsReport
import com.tbread.entity.JoinRequestUser
import com.tbread.packet.PacketEvent
import com.tbread.packet.PacketEventBus
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
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import netscape.javascript.JSObject
import org.slf4j.LoggerFactory
import java.awt.*
import java.awt.event.MouseAdapter
import java.awt.event.MouseEvent
import javax.imageio.ImageIO
import kotlin.system.exitProcess

class BrowserApp(private val config: VersionConfig, private val dpsCalculator: DpsCalculator) : Application() {

    private val logger = LoggerFactory.getLogger(BrowserApp::class.java)

    private lateinit var engine: WebEngine
    private var trayIcon: TrayIcon? = null

    inner class JSBridge(private val stage: Stage, private val hostServices: HostServices) {

        fun saveProps(key: String, value: String) {
            PropertyHandler.setProperty(key, value)
        }

        fun loadProps(key: String): String? {
            return PropertyHandler.getProperty(key)
        }

        fun moveWindow(x: Double, y: Double) {
            stage.x = x
            stage.y = y
        }

        fun resetDps() {
            dpsCalculator.resetDataStorage()
            engine.executeScript("resetDpsUI()")
        }

        fun hardResetDps() {
            dpsCalculator.hardReset()
            engine.executeScript("strongReset()")
        }

        fun updateHotkey(modifiers: Int, vkCode: Int) {
            HotkeyHandler.updateHotkey(modifiers, vkCode)
        }

        fun getHotkey(): String {
            return HotkeyHandler.getCurrentHotkey().toString()
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

        fun toggleVisibility() {
            if (isVisible) hideToTray(stage) else showFromTray(stage)
        }

        fun showWindow() {
            if (!isVisible) showFromTray(stage)
        }

        fun getHideHotkey(): String {
            return HotkeyHandler.getVisibilityHotkey().toString()
        }

        fun updateHideHotkey(modifiers: Int, vkCode: Int) {
            HotkeyHandler.updateVisibilityHotkey(modifiers, vkCode)
        }

        fun getDpsData(): String {
            return Json.encodeToString(dpsData)
        }

        fun isDebuggingMode(): Boolean {
            return debugMode
        }

        fun getBattleDetail(uid: Int): String {
            return Json.encodeToString(dpsCalculator.battleDetails(dpsCalculator.getLiveReport(), uid))
        }

        fun getBattleDetailFromList(idx: Int, uid: Int): String {
            return Json.encodeToString(dpsCalculator.battleDetails(DataManager.battleLog(idx)?.report, uid))
        }

        fun getBattleList(): String {
            return Json.encodeToString(DataManager.recentBattleList())
        }

        fun getLiveBuffOperatingRate(uid: Int): String {
            val report = dpsCalculator.getLiveReport()
            val end = if (report.battleEnd == 0L) System.currentTimeMillis() else report.battleEnd
            return Json.encodeToString(dpsCalculator.getBuffOperatingRate(uid,report.battleStart,end))
        }

        fun getBuffOperatingRate(idx: Int, uid: Int): String {
            val report = DataManager.battleLog(idx)?.report ?: return ""
            return Json.encodeToString(dpsCalculator.getBuffOperatingRate(uid,report.battleStart,report.battleEnd))
        }

        fun upload(idx: Int): Boolean {
            val log = DataManager.battleLog(idx) ?: return false
            return UploadManager.upload(log)
        }

        fun getVersion(): String {
            return version
        }

        fun startUpdate(msiUrl: String) {
            Thread {
                try {
                    val tempDir = System.getProperty("java.io.tmpdir")
                    val msiFile = java.io.File(tempDir, "aion2meter_update.msi")

                    val connection = java.net.URI(msiUrl).toURL().openConnection() as java.net.HttpURLConnection
                    connection.connect()
                    val totalBytes = connection.contentLengthLong

                    var downloadedBytes = 0L
                    connection.inputStream.use { input ->
                        java.io.FileOutputStream(msiFile).use { output ->
                            val buffer = ByteArray(8192)
                            var bytesRead: Int
                            while (input.read(buffer).also { bytesRead = it } != -1) {
                                output.write(buffer, 0, bytesRead)
                                downloadedBytes += bytesRead
                                if (totalBytes > 0) {
                                    val percent = (downloadedBytes * 100 / totalBytes).toInt()
                                    Platform.runLater {
                                        engine.executeScript("onDownloadProgress($percent)")
                                    }
                                }
                            }
                        }
                    }

                    Platform.runLater { engine.executeScript("onDownloadComplete()") }

                    val currentExe = ProcessHandle.current().info().command().orElse(null)
                    val installDir = if (currentExe != null) java.io.File(currentExe).parentFile?.absolutePath else null
                    val relaunchLine = if (currentExe != null)
                        "Start-Process '${currentExe.replace("'", "''")}'"
                    else ""
                    val installDirArg = if (installDir != null) ",'INSTALLDIR=${installDir.replace("'", "''")}'" else ""

                    val psFile = java.io.File(tempDir, "aion2meter_updater.ps1")
                    psFile.writeText(
                        """
                        Start-Process msiexec -ArgumentList '/i','${
                            msiFile.absolutePath.replace(
                                "'",
                                "''"
                            )
                        }','/qn','/norestart'$installDirArg -Wait
                        $relaunchLine
                        """.trimIndent()
                    )

                    ProcessBuilder(
                        "powershell", "-ExecutionPolicy", "Bypass",
                        "-WindowStyle", "Hidden",
                        "-File", psFile.absolutePath
                    ).start()

                    Platform.exit()
                    exitProcess(0)
                } catch (e: Exception) {
                    logger.error("업데이트 실패", e)
                    Platform.runLater { engine.executeScript("onDownloadError()") }
                }
            }.start()
        }

        fun pushJoinRequest(data: JoinRequestUser) {
            engine.executeScript("onJoinRequest(${Json.encodeToString(data)})")
        }

        fun pushJoinRequestRemove(id: Int) {
            engine.executeScript("onJoinRequestRemove($id)")
        }

        fun pushExitPartyUI(){
            engine.executeScript("onExitPartyUI()")
        }

        fun pushRefuseJoinRequest(){
            engine.executeScript("onRefuseJoinRequest()")
        }

    }

    @Volatile
    private var dpsData: DpsReport = dpsCalculator.getDps()

    @Volatile
    private var isVisible = true  // false = 사용자가 직접 숨긴 상태

    @Volatile
    private var aionEverFocused = false  // Aion2.exe가 한 번이라도 포커싱된 적 있는지

    private val debugMode = false

    private val version = config.version


    override fun start(stage: Stage) {
        Platform.setImplicitExit(false)
        stage.setOnCloseRequest {
            HotkeyHandler.stop()
            exitProcess(0)
        }
        val webView = WebView()
        engine = webView.engine
        engine.load(javaClass.getResource("/dist/index.html")?.toExternalForm())

        val bridge = JSBridge(stage, hostServices)
        engine.loadWorker.stateProperty().addListener { _, _, newState ->
            if (newState == Worker.State.SUCCEEDED) {
                val window = engine.executeScript("window") as JSObject
                window.setMember("javaBridge", bridge)
            }
        }


        val scene = Scene(webView, 1920.0, 1080.0)
        scene.fill = Color.TRANSPARENT

        try {
            val pageField = engine.javaClass.getDeclaredField("page")
            pageField.isAccessible = true
            val page = pageField.get(engine)

            val setBgMethod = page.javaClass.getMethod("setBackgroundColor", Int::class.javaPrimitiveType)
            setBgMethod.isAccessible = true
            setBgMethod.invoke(page, 0)
        } catch (e: Exception) {
            logger.error("리플렉션 실패", e)
        }

        stage.initStyle(StageStyle.TRANSPARENT)
        stage.scene = scene
        stage.isAlwaysOnTop = true
        stage.title = "Aion2 Dps Overlay"

        stage.show()
        applyOverlayWindowStyle(stage.title)

        setupTray(stage)

        HotkeyHandler.registerCallback {
            Platform.runLater {
                bridge.hardResetDps()
            }
        }
        HotkeyHandler.registerVisibilityCallback {
            if (isVisible) hideToTray(stage) else showFromTray(stage)
        }
        HotkeyHandler.start()
        
        
        CoroutineScope(Dispatchers.IO).launch {
            PacketEventBus.events.collect { event ->
                Platform.runLater {
                    when (event) {
                        is PacketEvent.JoinRequest -> bridge.pushJoinRequest(event.user)
                        is PacketEvent.JoinRequestRemove -> bridge.pushJoinRequestRemove(event.id)
                        is PacketEvent.ExitPartyUI -> bridge.pushExitPartyUI()
                        is PacketEvent.RefuseJoinRequest -> bridge.pushRefuseJoinRequest()
                    }
                }
            }
        }
        
        
        Timeline(KeyFrame(Duration.millis(500.0), {
            dpsData = dpsCalculator.getDps()
        })).apply {
            cycleCount = Timeline.INDEFINITE
            play()
        }

        CoroutineScope(Dispatchers.IO).launch {
            while (true) {
                kotlinx.coroutines.delay(300)
                if (!isVisible) continue

                val focused = isAion2Focused()
                if (!aionEverFocused) {
                    if (focused) aionEverFocused = true
                    else continue
                }

                Platform.runLater {
                    stage.opacity = if (focused) 1.0 else 0.0
                }
            }
        }
    }

    private fun isAion2Focused(): Boolean {
        val hwnd = User32.INSTANCE.GetForegroundWindow() ?: return false
        val pidRef = com.sun.jna.ptr.IntByReference()
        User32.INSTANCE.GetWindowThreadProcessId(hwnd, pidRef)
        val foregroundPid = pidRef.value.toLong()

        val hProcess = Kernel32.INSTANCE.OpenProcess(WinNT.PROCESS_QUERY_LIMITED_INFORMATION, false, foregroundPid.toInt())
            ?: return false
        return try {
            val buf = com.sun.jna.Memory(2048)
            Psapi.INSTANCE.GetModuleFileNameEx(hProcess, null, buf, 1024)
            val exePath = buf.getWideString(0)
            exePath.endsWith("Aion2.exe", ignoreCase = true)
        } finally {
            Kernel32.INSTANCE.CloseHandle(hProcess)
        }
    }

    private fun applyOverlayWindowStyle(title: String) {
        val GWL_EXSTYLE = -20
        val WS_EX_TOOLWINDOW = 0x00000080
        val WS_EX_APPWINDOW = 0x00040000
        val user32 = User32.INSTANCE
        val hwnd = user32.FindWindow(null, title) ?: return
        val exStyle = user32.GetWindowLong(hwnd, GWL_EXSTYLE)
        user32.SetWindowLong(hwnd, GWL_EXSTYLE,
            (exStyle or WS_EX_TOOLWINDOW) and WS_EX_APPWINDOW.inv()
        )
    }

    private fun setupTray(stage: Stage) {
        if (!SystemTray.isSupported()) return
        EventQueue.invokeLater {
            try {
                val tray = SystemTray.getSystemTray()
                val iconUrl = javaClass.getResource("/src/assets/logo.png")
                val image = if (iconUrl != null) {
                    ImageIO.read(iconUrl)
                } else {
                    java.awt.image.BufferedImage(16, 16, java.awt.image.BufferedImage.TYPE_INT_ARGB)
                }

                val popup = PopupMenu()
                val showItem = MenuItem("보이기/숨기기")
                showItem.addActionListener { if (isVisible) hideToTray(stage) else showFromTray(stage) }
                val exitItem = MenuItem("종료")
                exitItem.addActionListener {
                    tray.remove(trayIcon)
                    Platform.exit()
                    exitProcess(0)
                }
                popup.add(showItem)
                popup.addSeparator()
                popup.add(exitItem)

                trayIcon = TrayIcon(image, "Aion2 DPS Overlay", popup).apply {
                    isImageAutoSize = true
                    addMouseListener(object : MouseAdapter() {
                        override fun mouseClicked(e: MouseEvent) {
                            if (e.button == MouseEvent.BUTTON1) {
                                if (isVisible) hideToTray(stage) else showFromTray(stage)
                            }
                        }
                    })
                }
                tray.add(trayIcon)
            } catch (e: AWTException) {
                logger.error("트레이 설정 실패", e)
            }
        }
    }

    private fun hideToTray(stage: Stage) {
        isVisible = false
        Platform.runLater { stage.opacity = 0.0 }
    }

    private fun showFromTray(stage: Stage) {
        isVisible = true
        aionEverFocused = false  // 포커스 추적 초기화 → Aion2 첫 포커싱 전까지 다시 보임
        Platform.runLater {
            stage.opacity = 1.0
            stage.toFront()
        }
    }

}
