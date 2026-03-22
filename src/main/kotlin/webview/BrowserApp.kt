package com.tbread.webview

import com.tbread.DpsCalculator
import com.tbread.config.HotkeyHandler
import com.tbread.config.PropertyHandler
import com.tbread.config.VersionConfig
import com.tbread.data.DataManager
import com.tbread.entity.DpsReport
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

        fun saveProps(key:String,value:String){
            PropertyHandler.setProperty(key,value)
        }

        fun loadProps(key:String): String?{
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
            if (stage.isShowing) hideToTray(stage) else showFromTray(stage)
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
            return Json.encodeToString(dpsCalculator.battleDetails(dpsCalculator.getRecentData(), uid))
        }

        fun getBattleDetailFromList(idx: Int, uid: Int): String {
            return Json.encodeToString(dpsCalculator.battleDetails(DataManager.battleLog(idx), uid))
        }

        fun getBattleList():String{
            return Json.encodeToString(DataManager.recentBattleList())
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
                    val relaunchLine = if (currentExe != null)
                        "Start-Process '${currentExe.replace("'", "''")}'"
                    else ""

                    val psFile = java.io.File(tempDir, "aion2meter_updater.ps1")
                    psFile.writeText(
                        """
                        Start-Process msiexec -ArgumentList '/i','${msiFile.absolutePath.replace("'", "''")}','/qn' -Wait
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

    }

    @Volatile
    private var dpsData: DpsReport = dpsCalculator.getDps()

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
            logger.error("리플렉션 실패", e)
        }

        stage.initStyle(StageStyle.TRANSPARENT)
        stage.scene = scene
        stage.isAlwaysOnTop = true
        stage.title = "Aion2 Dps Overlay"

        stage.show()

        setupTray(stage)

        HotkeyHandler.registerCallback {
            Platform.runLater {
                bridge.resetDps()
            }
        }
        HotkeyHandler.registerVisibilityCallback {
            if (stage.isShowing) hideToTray(stage) else showFromTray(stage)
        }
        HotkeyHandler.start()
        Timeline(KeyFrame(Duration.millis(500.0), {
            dpsData = dpsCalculator.getDps()
        })).apply {
            cycleCount = Timeline.INDEFINITE
            play()
        }
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
                val showItem = MenuItem("보이기")
                showItem.addActionListener { showFromTray(stage) }
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
                            if (e.button == MouseEvent.BUTTON1) showFromTray(stage)
                        }
                    })
                }
            } catch (e: AWTException) {
                logger.error("트레이 설정 실패", e)
            }
        }
    }

    private fun hideToTray(stage: Stage) {
        Platform.runLater { stage.hide() }
        EventQueue.invokeLater {
            try {
                val icon = trayIcon ?: return@invokeLater
                SystemTray.getSystemTray().add(icon)
                icon.displayMessage("Aion2 DPS Overlay", "미터기가 아직 실행 중 입니다.", TrayIcon.MessageType.INFO)
            } catch (e: AWTException) {
                logger.error("트레이 추가 실패", e)
            }
        }
    }

    private fun showFromTray(stage: Stage) {
        Platform.runLater {
            stage.show()
            stage.toFront()
        }
        EventQueue.invokeLater {
            SystemTray.getSystemTray().remove(trayIcon)
        }
    }

}
